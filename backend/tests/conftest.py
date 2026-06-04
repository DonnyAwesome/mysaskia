import os
import sys

import pytest


BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import db


@pytest.fixture
def app(tmp_path, monkeypatch):
    test_database = tmp_path / "test.db"
    monkeypatch.setattr(db, "DATABASE", str(test_database))

    from app import app as flask_app

    db.init_db()
    flask_app.config.update(TESTING=True)

    yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()
