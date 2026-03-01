#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load env from mcpserver/.env or scripts/.env if present
if [[ -f "${MCP_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${MCP_DIR}/.env"
  set +a
elif [[ -f "${SCRIPT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.env"
  set +a
fi

PROJECT_ID="${PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${REGION:-${GOOGLE_CLOUD_LOCATION:-us-central1}}"
SERVICE_NAME="${SERVICE_NAME:-=voice-zk-wallet-mcpserver}"
RUNTIME_SA_NAME="${RUNTIME_SA_NAME:-=voice-zk-wallet-mcpserver-sa}"
RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
ALLOW_UNAUTHENTICATED="${ALLOW_UNAUTHENTICATED:-true}"

# .env から Cloud Run に渡す環境変数
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
BASE_SEPOLIA_RPC_URL="${BASE_SEPOLIA_RPC_URL:-https://sepolia.base.org}"
RELAYER_PRIVATE_KEY="${RELAYER_PRIVATE_KEY:-}"
VOICE_WALLET_FACTORY_ADDRESS="${VOICE_WALLET_FACTORY_ADDRESS:-0x3872A516c8e8FDB29b5D28C6D5528153D66Edd4f}"
VOICE_OWNERSHIP_VERIFIER_ADDRESS="${VOICE_OWNERSHIP_VERIFIER_ADDRESS:-0x877e07ddC0b95640cD009154ab9dA6a691Ee783b}"
USDC_ADDRESS="${USDC_ADDRESS:-0x036CbD53842c5426634e7929541eC2318f3dCF7e}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "ERROR: PROJECT_ID (or GOOGLE_CLOUD_PROJECT) is required."
  exit 1
fi

echo "==> Project: ${PROJECT_ID}"
echo "==> Region:  ${REGION}"
echo "==> Service: ${SERVICE_NAME}"
echo "==> Source:  ${MCP_DIR}"
echo "==> Runtime SA: ${RUNTIME_SA}"

gcloud config set project "${PROJECT_ID}" >/dev/null

echo "==> Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com

echo "==> Ensuring runtime service account exists..."
if ! gcloud iam service-accounts describe "${RUNTIME_SA}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${RUNTIME_SA_NAME}" \
    --display-name "Voice ZK Wallet MCP Server Runtime"
else
  echo "Service account already exists: ${RUNTIME_SA}"
fi

# 環境変数の組み立て
# NOTE: PORT は Cloud Run の予約環境変数のため、--set-env-vars で渡さない。
ENV_VARS="BACKEND_URL=${BACKEND_URL}"
ENV_VARS+=",BASE_SEPOLIA_RPC_URL=${BASE_SEPOLIA_RPC_URL}"
ENV_VARS+=",VOICE_WALLET_FACTORY_ADDRESS=${VOICE_WALLET_FACTORY_ADDRESS}"
ENV_VARS+=",VOICE_OWNERSHIP_VERIFIER_ADDRESS=${VOICE_OWNERSHIP_VERIFIER_ADDRESS}"
ENV_VARS+=",USDC_ADDRESS=${USDC_ADDRESS}"

# RELAYER_PRIVATE_KEY はシークレットとして別途設定を推奨
# ここでは簡易的に env var として渡す（ハッカソン用）
if [[ -n "${RELAYER_PRIVATE_KEY}" ]]; then
  ENV_VARS+=",RELAYER_PRIVATE_KEY=${RELAYER_PRIVATE_KEY}"
fi

DEPLOY_ARGS=(
  --source "${MCP_DIR}"
  --region "${REGION}"
  --service-account "${RUNTIME_SA}"
  --port 3000
  --timeout 60
  --memory 512Mi
  --cpu 1
  --min-instances 0
  --max-instances 3
  --set-env-vars "${ENV_VARS}"
)

if [[ "${ALLOW_UNAUTHENTICATED}" == "true" ]]; then
  DEPLOY_ARGS+=(--allow-unauthenticated)
else
  DEPLOY_ARGS+=(--no-allow-unauthenticated)
fi

echo "==> Deploying Cloud Run service..."
gcloud run deploy "${SERVICE_NAME}" "${DEPLOY_ARGS[@]}"

URL="$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format='value(status.url)')"
echo ""
echo "==> Deployed: ${URL}"
echo "==> MCP endpoint: ${URL}/mcp"
echo "==> Health check: ${URL}/health"
