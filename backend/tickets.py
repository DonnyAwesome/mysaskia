# tickets.py
from flask import Blueprint, request, jsonify
from db import get_db_connection
from utils import get_user_by_token

tickets_bp = Blueprint("tickets", __name__)

@tickets_bp.route("/api/tickets", methods=["POST"])
def create_ticket():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_by_token(token)
    if not user:
        return jsonify({"message":"Du musst eingeloggt sein."}), 401

    data = request.get_json()
    subject = data.get("subject", "").strip()
    message = data.get("message", "").strip()
    if not subject or not message:
        return jsonify({"message":"Betreff und Nachricht erforderlich."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tickets (user_id, subject, message) VALUES (?, ?, ?)", (user["id"], subject, message))
    conn.commit()
    conn.close()
    return jsonify({"message":"Ticket erstellt."}), 201

@tickets_bp.route("/api/my_tickets", methods=["GET"])
def get_my_tickets():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_by_token(token)
    if not user:
        return jsonify({"message":"Du musst eingeloggt sein."}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, subject, message, status, created_at FROM tickets WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))
    tickets = cursor.fetchall()
    conn.close()
    return jsonify([dict(t) for t in tickets])

@tickets_bp.route("/api/admin/tickets", methods=["GET"])
def get_all_tickets():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_by_token(token)
    if not user:
        return jsonify({"message":"Du musst eingeloggt sein."}), 401
    if not user["is_admin"]:
        return jsonify({"message":"Nur Admins."}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT tickets.id, tickets.subject, tickets.message, tickets.status, tickets.created_at,
               users.first_name, users.last_name, users.email
        FROM tickets
        JOIN users ON tickets.user_id = users.id
        ORDER BY tickets.created_at DESC
    """)
    tickets = cursor.fetchall()
    conn.close()
    return jsonify([dict(t) for t in tickets])

@tickets_bp.route("/api/admin/tickets/status", methods=["PATCH"])
def update_ticket_status():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_by_token(token)
    if not user:
        return jsonify({"message":"Du musst eingeloggt sein."}), 401
    if not user["is_admin"]:
        return jsonify({"message":"Nur Admins."}), 403

    data = request.get_json()
    ticket_id = data.get("ticket_id")
    status = data.get("status", "").strip()
    if not ticket_id or status not in ["offen", "in_bearbeitung", "geloest"]:
        return jsonify({"message":"Ungültige Daten."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE tickets SET status=? WHERE id=?", (status, ticket_id))
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"message":"Ticket nicht gefunden."}), 404
    conn.commit()
    conn.close()
    return jsonify({"message":"Status geändert."})
