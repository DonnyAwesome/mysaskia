# accounts.py
from flask import Blueprint, request, jsonify
from db import get_db_connection
from utils import get_user_by_token

accounts_bp = Blueprint("accounts", __name__)

def require_login(request):
    token = get_user_by_token(request.headers.get("Authorization","").replace("Bearer ", ""))
    return token

@accounts_bp.route("/api/accounts", methods=["GET"])
def get_accounts():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_by_token(token)
    if not user:
        return jsonify({"message":"Du musst eingeloggt sein."}), 401
    if not user["is_admin"]:
        return jsonify({"message":"Nur Admins dürfen Accounts sehen."}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, first_name, last_name, email, is_admin, created_at FROM users ORDER BY id ASC")
    users = cursor.fetchall()
    conn.close()

    return jsonify([dict(u) for u in users])

@accounts_bp.route("/api/delete_account", methods=["DELETE"])
def delete_account():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_by_token(token)
    if not user:
        return jsonify({"message":"Du musst eingeloggt sein."}), 401
    if not user["is_admin"]:
        return jsonify({"message":"Nur Admins dürfen Accounts löschen."}), 403

    data = request.get_json()
    account_id = data.get("id")
    if not account_id:
        return jsonify({"message":"Keine Account-ID gesendet."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, is_admin FROM users WHERE id = ?", (account_id,))
    account = cursor.fetchone()
    if not account:
        conn.close()
        return jsonify({"message":"Account nicht gefunden."}), 404
    if account["is_admin"]:
        conn.close()
        return jsonify({"message":"Admin-Account darf nicht gelöscht werden."}), 403

    cursor.execute("DELETE FROM sessions WHERE user_id = ?", (account_id,))
    cursor.execute("DELETE FROM tickets WHERE user_id = ?", (account_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (account_id,))
    conn.commit()
    conn.close()

    return jsonify({"message":"Account gelöscht."})
