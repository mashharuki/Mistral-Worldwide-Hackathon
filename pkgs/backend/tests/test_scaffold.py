import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class BackendScaffoldTest(unittest.TestCase):
    def test_app_py_exists_and_has_required_routes(self):
        app_file = ROOT / "src" / "app.py"
        self.assertTrue(app_file.exists(), "src/app.py is missing")

        content = app_file.read_text(encoding="utf-8")
        self.assertIn("from flask import Flask, jsonify, request", content)
        self.assertIn("from flask_cors import CORS", content)
        self.assertIn("@app.get(\"/health\")", content)
        self.assertIn("@app.errorhandler(400)", content)
        self.assertIn("@app.errorhandler(404)", content)
        self.assertIn("@app.errorhandler(500)", content)

    def test_dockerfile_exists_and_has_multistage_setup(self):
        dockerfile = ROOT / "Dockerfile"
        self.assertTrue(dockerfile.exists(), "Dockerfile is missing")

        content = dockerfile.read_text(encoding="utf-8")
        self.assertIn("FROM node:20-bookworm-slim AS node-runtime", content)
        self.assertIn("FROM python:3.11-slim", content)
        self.assertIn("COPY requirements.txt", content)
        self.assertIn("pip install --no-cache-dir -r requirements.txt", content)
        self.assertIn("COPY --from=node-runtime", content)

    def test_http_file_exists_with_endpoint_samples(self):
        http_file = ROOT / "api.http"
        self.assertTrue(http_file.exists(), "api.http is missing")

        content = http_file.read_text(encoding="utf-8")
        self.assertIn("GET http://localhost:8080/health", content)
        self.assertIn("POST http://localhost:8080/extract-features", content)
        self.assertIn("POST http://localhost:8080/generate-proof", content)
        self.assertIn("POST http://localhost:8080/generate-commitment", content)


if __name__ == "__main__":
    unittest.main()
