# app.py
from profile import profile_bp
from flask import Flask
from flask_cors import CORS
from db import init_db, create_admin_user
from auth import auth_bp
from accounts import accounts_bp
from tickets import tickets_bp

app = Flask(__name__)
CORS(app)

# Blueprints registrieren
app.register_blueprint(auth_bp)
app.register_blueprint(accounts_bp)
app.register_blueprint(tickets_bp)
app.register_blueprint(profile_bp)

# DB initialisieren & Admin
init_db()
create_admin_user()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
