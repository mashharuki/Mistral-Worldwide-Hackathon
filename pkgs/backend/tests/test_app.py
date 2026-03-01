import json
import unittest
from unittest.mock import patch

class AppRouteTest(unittest.TestCase):
    def setUp(self):
        try:
            from src.app import create_app
        except ModuleNotFoundError as error:
            self.skipTest(f"flask is not installed in this environment: {error}")

        app = create_app()
        app.testing = True
        self.client = app.test_client()

    @patch("src.app.extract_voice_features")
    def test_extract_features_returns_503_when_model_unavailable(self, mock_extract):
        mock_extract.side_effect = RuntimeError("mock setup error")
        # Patch side_effect with exact exception type lazily to avoid import cycles in test startup
        from src.feature_extraction import EmbeddingModelUnavailableError

        mock_extract.side_effect = EmbeddingModelUnavailableError("failed to load model")
        response = self.client.post(
            "/extract-features",
            data=json.dumps({"audio": "UklGRiQAAABXQVZFZm10"}),  # short/invalid payload; mocked extract bypasses it
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 503)
        body = response.get_json()
        self.assertEqual(body["error"]["code"], "MODEL_UNAVAILABLE")


if __name__ == "__main__":
    unittest.main()
