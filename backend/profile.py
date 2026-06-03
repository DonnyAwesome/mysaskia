from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_db_connection
from utils import get_current_user


profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/api/profile", methods=["GET"])
def get_profile():
    current_user = get_current_user()

    if current_user is None:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db_connection()
    user = conn.execute(
        """
        SELECT id, first_name, last_name, email, is_admin, created_at
        FROM users
        WHERE id = ?
        """,
        (current_user["id"],)
    ).fetchone()
    conn.close()

    if user is None:
        return jsonify({"error": "User nicht gefunden"}), 404

    return jsonify({
        "id": user["id"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "email": user["email"],
        "is_admin": user["is_admin"],
        "role": "Admin" if user["is_admin"] == 1 else "User",
        "created_at": user["created_at"]
    }), 200


@profile_bp.route("/api/profile", methods=["PATCH"])
def update_profile():
    current_user = get_current_user()

    if current_user is None:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    data = request.get_json()

    if data is None:
        return jsonify({"error": "Keine JSON-Daten gesendet"}), 400

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()

    if not first_name or not last_name:
        return jsonify({"error": "Vorname und Nachname sind erforderlich"}), 400

    conn = get_db_connection()
    conn.execute(
        """
        UPDATE users
        SET first_name = ?, last_name = ?
        WHERE id = ?
        """,
        (first_name, last_name, current_user["id"])
    )
    conn.commit()

    updated_user = conn.execute(
        """
        SELECT id, first_name, last_name, email, is_admin, created_at
        FROM users
        WHERE id = ?
        """,
        (current_user["id"],)
    ).fetchone()
    conn.close()

    return jsonify({
        "message": "Profil wurde aktualisiert",
        "user": {
            "id": updated_user["id"],
            "first_name": updated_user["first_name"],
            "last_name": updated_user["last_name"],
            "email": updated_user["email"],
            "is_admin": updated_user["is_admin"],
            "role": "Admin" if updated_user["is_admin"] == 1 else "User",
            "created_at": updated_user["created_at"]
        }
    }), 200


@profile_bp.route("/api/change_password", methods=["PATCH"])
def change_password():
    current_user = get_current_user()

    if current_user is None:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    data = request.get_json()

    if data is None:
        return jsonify({"error": "Keine JSON-Daten gesendet"}), 400

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not current_password or not new_password or not confirm_password:
        return jsonify({"error": "Bitte alle Passwort-Felder ausfüllen"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Das neue Passwort muss mindestens 6 Zeichen lang sein"}), 400

    if new_password != confirm_password:
        return jsonify({"error": "Die neuen Passwörter stimmen nicht überein"}), 400

    conn = get_db_connection()
    user = conn.execute(
        """
        SELECT id, password_hash
        FROM users
        WHERE id = ?
        """,
        (current_user["id"],)
    ).fetchone()

    if user is None:
        conn.close()
        return jsonify({"error": "User nicht gefunden"}), 404

    if not check_password_hash(user["password_hash"], current_password):
        conn.close()
        return jsonify({"error": "Aktuelles Passwort ist falsch"}), 400

    new_password_hash = generate_password_hash(new_password)

    conn.execute(
        """
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
        """,
        (new_password_hash, current_user["id"])
    )
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Passwort wurde geändert"
    }), 200
