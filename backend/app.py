import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from db import init_db

from auth import auth_bp
from accounts import accounts_bp
from tickets import tickets_bp
from profile import profile_bp
from items import items_bp
from orders import orders_bp
from dashboard import dashboard_bp
from favorites import favorites_bp
from sellers import sellers_bp
from reviews import reviews_bp
from admin import admin_bp
from notifications import notifications_bp
from forum import forum_bp


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
app.register_blueprint(orders_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(favorites_bp)
app.register_blueprint(sellers_bp)
app.register_blueprint(reviews_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(forum_bp)


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
