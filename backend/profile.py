from flask import Blueprint, jsonify, request
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
