import os
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from src.feature_extraction import (
    AudioDecodeError,
    AudioFormatError,
    AudioQualityError,
    EmbeddingModelUnavailableError,
    extract_voice_features,
)
from src.proof_generation import (
    ProofGenerationError,
    build_generate_proof_response,
    compute_poseidon_commitment,
)


def create_app() -> Flask:
    # Flaskアプリケーションを作成し、CORSを有効化
    app = Flask(__name__)
    CORS(app)
    # ZK回路ファイルのルートパスを設定
    circuit_root = Path(
        os.getenv(
            "ZK_CIRCUIT_ROOT",
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "circuit")),
        )
    )

    @app.get("/health")
    def health():
        # ヘルスチェックエンドポイント
        return jsonify({"status": "ok"}), 200

    @app.post("/extract-features")
    def extract_features():
        # 音声特徴量抽出エンドポイント
        payload = request.get_json(silent=True) or {}
        audio = payload.get("audio")
        mime_type = payload.get("mimeType", "")
        if not audio:
            return (
                jsonify(
                    {
                        "error": {
                            "code": "BAD_REQUEST",
                            "message": "audio field is required",
                        }
                    }
                ),
                400,
            )

        try:
            # 音声特徴量を抽出
            result = extract_voice_features(audio, mime_type)
            return jsonify(result), 200
        except (AudioFormatError, AudioQualityError, AudioDecodeError) as error:
            return (
                jsonify(
                    {
                        "error": {
                            "code": "INVALID_AUDIO",
                            "message": str(error),
                        }
                    }
                ),
                400,
            )
        except EmbeddingModelUnavailableError as error:
            return (
                jsonify(
                    {
                        "error": {
                            "code": "MODEL_UNAVAILABLE",
                            "message": str(error),
                        }
                    }
                ),
                503,
            )

    @app.post("/generate-proof")
    def generate_proof():
        # 証明生成エンドポイント
        payload = request.get_json(silent=True) or {}
        reference_features = payload.get("referenceFeatures")
        current_features = payload.get("currentFeatures")
        salt = str(payload.get("salt", ""))
        if reference_features is None or current_features is None or salt == "":
            return (
                jsonify(
                    {
                        "error": {
                            "code": "BAD_REQUEST",
                            "message": "referenceFeatures, currentFeatures, salt are required",
                        }
                    }
                ),
                400,
            )

        try:
            # 証明を生成
            response = build_generate_proof_response(
                reference_features=[int(value) for value in reference_features],
                current_features=[int(value) for value in current_features],
                salt=salt,
                circuit_name="VoiceOwnership",
                circuit_root=circuit_root,
                hamming_threshold=128,
            )
            return jsonify(response), 200
        except (ValueError, ProofGenerationError) as error:
            return (
                jsonify(
                    {
                        "error": {
                            "code": "PROOF_GENERATION_ERROR",
                            "message": str(error),
                        }
                    }
                ),
                400,
            )

    @app.post("/generate-commitment")
    def generate_commitment():
        # コミットメント生成エンドポイント
        payload = request.get_json(silent=True) or {}
        features = payload.get("features")
        salt = str(payload.get("salt", ""))
        if features is None or salt == "":
            return (
                jsonify(
                    {
                        "error": {
                            "code": "BAD_REQUEST",
                            "message": "features and salt are required",
                        }
                    }
                ),
                400,
            )

        try:
            # コミットメントを計算
            packed_features = [int(value) for value in features]
            commitment = compute_poseidon_commitment(
                packed_features,
                salt,
                circuit_root,
            )
            return (
                jsonify(
                    {
                        "commitment": commitment,
                        "packedFeatures": [str(value) for value in packed_features],
                    }
                ),
                200,
            )
        except (ValueError, ProofGenerationError) as error:
            return (
                jsonify(
                    {
                        "error": {
                            "code": "COMMITMENT_GENERATION_ERROR",
                            "message": str(error),
                        }
                    }
                ),
                400,
            )

    @app.errorhandler(400)
    def bad_request(error):
        # 400エラーハンドラ
        return (
            jsonify(
                {
                    "error": {
                        "code": "BAD_REQUEST",
                        "message": str(error),
                    }
                }
            ),
            400,
        )

    @app.errorhandler(404)
    def not_found(error):
        # 404エラーハンドラ
        return (
            jsonify(
                {
                    "error": {
                        "code": "NOT_FOUND",
                        "message": f"{request.path} was not found",
                    }
                }
            ),
            404,
        )

    @app.errorhandler(500)
    def internal_error(error):
        # 500エラーハンドラ
        return (
            jsonify(
                {
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "Unexpected server error",
                    }
                }
            ),
            500,
        )

    return app


app = create_app()


if __name__ == "__main__":
    # アプリケーションのエントリポイント
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8080"))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug)
