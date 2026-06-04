# auth.py
import secrets

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_db_connection
from notifications import create_notification
from utils import get_user_by_token

auth_bp = Blueprint("auth", __name__)
PASSWORD_RESET_MESSAGE = "Wenn die E-Mail existiert, wurde ein Reset vorbereitet."

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


@auth_bp.route("/api/password-reset/request", methods=["POST"])
def request_password_reset():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"message": "Bitte eine E-Mail-Adresse angeben."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    response = {"message": PASSWORD_RESET_MESSAGE}

    if user:
        reset_token = secrets.token_urlsafe(32)
        cursor.execute("""
            UPDATE password_resets
            SET used_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND used_at IS NULL
        """, (user["id"],))
        cursor.execute("""
            INSERT INTO password_resets (user_id, token)
            VALUES (?, ?)
        """, (user["id"], reset_token))
        create_notification(
            cursor,
            user["id"],
            "password_reset_requested",
            "Passwort-Reset angefordert",
            "Für dein Konto wurde ein lokaler Passwort-Reset angefordert.",
            "profile.html#security"
        )
        conn.commit()

        response["reset_token"] = reset_token
        print(f"Lokaler Passwort-Reset für {email}: {reset_token}")

    conn.close()
    return jsonify(response)


@auth_bp.route("/api/password-reset/confirm", methods=["POST"])
def confirm_password_reset():
    data = request.get_json(silent=True) or {}
    reset_token = data.get("token", "").strip()
    new_password = data.get("new_password", "")

    if not reset_token:
        return jsonify({"message": "Reset-Token fehlt."}), 400

    if len(new_password) < 6:
        return jsonify({"message": "Das neue Passwort muss mindestens 6 Zeichen lang sein."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, user_id
        FROM password_resets
        WHERE token = ?
          AND used_at IS NULL
          AND created_at >= datetime('now', '-30 minutes')
    """, (reset_token,))
    password_reset = cursor.fetchone()

    if not password_reset:
        conn.close()
        return jsonify({"message": "Reset-Token ist ungültig oder abgelaufen."}), 400

    cursor.execute("""
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
    """, (generate_password_hash(new_password), password_reset["user_id"]))
    cursor.execute("""
        UPDATE password_resets
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (password_reset["id"],))
    cursor.execute("DELETE FROM sessions WHERE user_id = ?", (password_reset["user_id"],))
    conn.commit()
    conn.close()

    return jsonify({"message": "Passwort wurde erfolgreich geändert."})
