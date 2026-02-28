import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from feature_extraction import AudioFormatError, AudioQualityError, extract_voice_features


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.post("/extract-features")
    def extract_features():
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
            result = extract_voice_features(audio, mime_type)
            return jsonify(result), 200
        except (AudioFormatError, AudioQualityError) as error:
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

    @app.errorhandler(400)
    def bad_request(error):
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
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8080"))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug)
