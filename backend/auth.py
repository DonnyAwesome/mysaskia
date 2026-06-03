# auth.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_db_connection
from utils import get_user_by_token

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Keine Daten gesendet."}), 400

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not first_name or not last_name or not email or not password:
        return jsonify({"message": "Bitte alle Felder ausfüllen."}), 400

    password_hash = generate_password_hash(password)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO users (first_name, last_name, email, password_hash, is_admin)
            VALUES (?, ?, ?, ?, ?)
        """, (first_name, last_name, email, password_hash, 0))
        conn.commit()
    except:
        conn.close()
        return jsonify({"message": "Diese E-Mail ist bereits registriert."}), 409

    conn.close()
    return jsonify({"message": "Account wurde erstellt."}), 201

@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Keine Daten gesendet."}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "E-Mail und Passwort sind erforderlich."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, first_name, last_name, email, password_hash, is_admin FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        conn.close()
        return jsonify({"message": "Login fehlgeschlagen."}), 401

    import secrets
    token = secrets.token_hex(32)
    cursor.execute("INSERT INTO sessions (user_id, token) VALUES (?, ?)", (user["id"], token))
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Login erfolgreich.",
        "token": token,
        "user": {
            "id": user["id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user["email"],
            "is_admin": bool(user["is_admin"])
        }
    })

@auth_bp.route("/api/logout", methods=["POST"])
def logout():
    from flask import request
    token = get_token_from_header(request)
    if not token:
        return jsonify({"message": "Kein Token gesendet."}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Logout erfolgreich."})
