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
SERVICE_NAME="${SERVICE_NAME:-voice-zk-wallet-mcp}"
RUNTIME_SA_NAME="${RUNTIME_SA_NAME:-voice-zk-wallet-mcp-sa}"
RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
DELETE_SA="${DELETE_SA:-false}"
FORCE="${FORCE:-false}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "ERROR: PROJECT_ID (or GOOGLE_CLOUD_PROJECT) is required."
  exit 1
fi

echo "==> Project: ${PROJECT_ID}"
echo "==> Region:  ${REGION}"
echo "==> Service to delete: ${SERVICE_NAME}"
echo "==> Runtime SA: ${RUNTIME_SA} (DELETE_SA=${DELETE_SA})"

if [[ "${FORCE}" != "true" ]]; then
  read -r -p "Proceed deleting Cloud Run resources? [y/N]: " ANSWER
  if [[ ! "${ANSWER}" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

gcloud config set project "${PROJECT_ID}" >/dev/null

echo "==> Deleting Cloud Run service (if exists)..."
if gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" >/dev/null 2>&1; then
  gcloud run services delete "${SERVICE_NAME}" --region "${REGION}" --quiet
  echo "Deleted service: ${SERVICE_NAME}"
else
  echo "Service not found: ${SERVICE_NAME}"
fi

if [[ "${DELETE_SA}" == "true" ]]; then
  echo "==> Deleting runtime service account (if exists)..."
  if gcloud iam service-accounts describe "${RUNTIME_SA}" >/dev/null 2>&1; then
    gcloud iam service-accounts delete "${RUNTIME_SA}" --quiet
    echo "Deleted service account: ${RUNTIME_SA}"
  else
    echo "Service account not found: ${RUNTIME_SA}"
  fi
fi

echo "==> Cleanup complete."
