from flask import Blueprint, jsonify

from db import get_db
from utils import get_current_user


notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def create_notification(cursor, user_id, notification_type, title, message, link=None):
    cursor.execute("""
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            link
        )
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, notification_type, title, message, link))


@notifications_bp.route("", methods=["GET"])
def get_notifications():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    notifications = conn.execute("""
        SELECT id, type, title, message, link, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
    """, (current_user["id"],)).fetchall()
    conn.close()

    return jsonify({
        "notifications": [
            {
                "id": notification["id"],
                "type": notification["type"],
                "title": notification["title"],
                "message": notification["message"],
                "link": notification["link"],
                "is_read": bool(notification["is_read"]),
                "created_at": notification["created_at"]
            }
            for notification in notifications
        ]
    })


@notifications_bp.route("/unread-count", methods=["GET"])
def get_unread_count():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    unread_count = conn.execute("""
        SELECT COUNT(*)
        FROM notifications
        WHERE user_id = ? AND is_read = 0
    """, (current_user["id"],)).fetchone()[0]
    conn.close()

    return jsonify({"unread_count": unread_count})


@notifications_bp.route("/<int:notification_id>/read", methods=["PATCH"])
def mark_notification_read(notification_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE notifications
        SET is_read = 1
        WHERE id = ? AND user_id = ?
    """, (notification_id, current_user["id"]))

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Benachrichtigung nicht gefunden"}), 404

    conn.commit()
    conn.close()

    return jsonify({"message": "Benachrichtigung wurde als gelesen markiert"})


@notifications_bp.route("/read-all", methods=["PATCH"])
def mark_all_notifications_read():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = ? AND is_read = 0
    """, (current_user["id"],))
    updated_count = cursor.rowcount
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Alle Benachrichtigungen wurden als gelesen markiert",
        "updated_count": updated_count
    })
