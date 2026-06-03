from functools import wraps

from flask import request, jsonify
from db import get_db_connection


def get_user_by_token(token):
    if not token:
        return None

    conn = get_db_connection()
    user = conn.execute(
        """
        SELECT users.id, users.first_name, users.last_name, users.email,
               users.is_admin, users.created_at
        FROM sessions
        JOIN users ON sessions.user_id = users.id
        WHERE sessions.token = ?
        """,
        (token,)
    ).fetchone()
    conn.close()

    return user


def get_current_user():
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None

    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "", 1).strip()

    return get_user_by_token(token)


def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        current_user = get_current_user()

        if current_user is None:
            return jsonify({"error": "Nicht eingeloggt"}), 401

        return func(current_user, *args, **kwargs)

    return wrapper


def admin_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        current_user = get_current_user()

        if current_user is None:
            return jsonify({"error": "Nicht eingeloggt"}), 401

        if current_user["is_admin"] != 1:
            return jsonify({"error": "Keine Admin-Rechte"}), 403

        return func(current_user, *args, **kwargs)

    return wrapper
