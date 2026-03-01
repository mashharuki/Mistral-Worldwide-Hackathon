#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load env from backend/.env or scripts/.env if present
if [[ -f "${BACKEND_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${BACKEND_DIR}/.env"
  set +a
elif [[ -f "${SCRIPT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.env"
  set +a
fi

PROJECT_ID="${PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${REGION:-${GOOGLE_CLOUD_LOCATION:-us-central1}}"
SERVICE_NAME="${SERVICE_NAME:-voice-zk-wallet-backend}"
RUNTIME_SA_NAME="${RUNTIME_SA_NAME:-voice-zk-wallet-backend-sa}"
RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
ALLOW_UNAUTHENTICATED="${ALLOW_UNAUTHENTICATED:-true}"
BACKEND_MEMORY="${BACKEND_MEMORY:-2Gi}"
BACKEND_CPU="${BACKEND_CPU:-1}"
BACKEND_CONCURRENCY="${BACKEND_CONCURRENCY:-1}"
BACKEND_MIN_INSTANCES="${BACKEND_MIN_INSTANCES:-0}"
BACKEND_MAX_INSTANCES="${BACKEND_MAX_INSTANCES:-3}"
BACKEND_EMBEDDING_PROVIDER="${BACKEND_EMBEDDING_PROVIDER:-pyannote}"
BACKEND_EMBEDDING_MODEL="${BACKEND_EMBEDDING_MODEL:-pyannote/embedding}"
HF_TOKEN="${HF_TOKEN:-${HUGGINGFACE_HUB_TOKEN:-}}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "ERROR: PROJECT_ID (or GOOGLE_CLOUD_PROJECT) is required."
  exit 1
fi

echo "==> Project: ${PROJECT_ID}"
echo "==> Region: ${REGION}"
echo "==> Service: ${SERVICE_NAME}"
echo "==> Source:  ${BACKEND_DIR}"
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
    --display-name "Voice ZK Wallet Backend Runtime"
else
  echo "Service account already exists: ${RUNTIME_SA}"
fi

DEPLOY_ARGS=(
  --source "${BACKEND_DIR}"
  --region "${REGION}"
  --service-account "${RUNTIME_SA}"
  --port 8080
  --timeout 3600
  --memory "${BACKEND_MEMORY}"
  --cpu "${BACKEND_CPU}"
  --concurrency "${BACKEND_CONCURRENCY}"
  --min-instances "${BACKEND_MIN_INSTANCES}"
  --max-instances "${BACKEND_MAX_INSTANCES}"
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=${REGION},ZK_CIRCUIT_ROOT=/app/zk,BACKEND_EMBEDDING_PROVIDER=${BACKEND_EMBEDDING_PROVIDER},BACKEND_EMBEDDING_MODEL=${BACKEND_EMBEDDING_MODEL}"
)

if [[ -n "${HF_TOKEN}" ]]; then
  DEPLOY_ARGS+=(--set-env-vars "HF_TOKEN=${HF_TOKEN},HUGGINGFACE_HUB_TOKEN=${HF_TOKEN}")
fi

if [[ "${ALLOW_UNAUTHENTICATED}" == "true" ]]; then
  DEPLOY_ARGS+=(--allow-unauthenticated)
else
  DEPLOY_ARGS+=(--no-allow-unauthenticated)
fi

echo "==> Deploying Cloud Run service..."
gcloud run deploy "${SERVICE_NAME}" "${DEPLOY_ARGS[@]}"

URL="$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format='value(status.url)')"
echo "==> Deployed: ${URL}"
