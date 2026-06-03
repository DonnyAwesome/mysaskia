import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from db import init_db

from auth import auth_bp
from accounts import accounts_bp
from tickets import tickets_bp
from profile import profile_bp
from items import items_bp


app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_ITEMS_FOLDER = os.path.join(BASE_DIR, "uploads", "items")

os.makedirs(UPLOAD_ITEMS_FOLDER, exist_ok=True)

init_db()

app.register_blueprint(auth_bp)
app.register_blueprint(accounts_bp)
app.register_blueprint(tickets_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(items_bp)


@app.route("/uploads/items/<filename>")
def uploaded_item_image(filename):
    return send_from_directory(UPLOAD_ITEMS_FOLDER, filename)


@app.route("/")
def home():
    return {
        "message": "MySaskia API läuft",
        "api": "/api"
    }


if __name__ == "__main__":
    app.run(debug=True)
