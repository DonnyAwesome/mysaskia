from flask import Blueprint, jsonify, request

from db import get_db
from items import item_to_dict
from utils import get_current_user


favorites_bp = Blueprint("favorites", __name__, url_prefix="/api")


@favorites_bp.route("/favorites", methods=["POST"])
def create_favorite():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    data = request.get_json() or {}
    item_id = data.get("item_id")

    if not item_id:
        return jsonify({"error": "item_id fehlt"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM items WHERE id = ?", (item_id,))

    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Inserat nicht gefunden"}), 404

    cursor.execute("""
        SELECT id
        FROM favorites
        WHERE user_id = ? AND item_id = ?
    """, (current_user["id"], item_id))

    if cursor.fetchone():
        conn.close()
        return jsonify({
            "message": "Inserat ist bereits auf der Merkliste",
            "is_favorite": True
        })

    cursor.execute("""
        INSERT INTO favorites (user_id, item_id)
        VALUES (?, ?)
    """, (current_user["id"], item_id))

    conn.commit()
    favorite_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "message": "Inserat wurde zur Merkliste hinzugefügt",
        "favorite_id": favorite_id,
        "is_favorite": True
    }), 201


@favorites_bp.route("/favorites", methods=["DELETE"])
def delete_favorite():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    data = request.get_json() or {}
    item_id = data.get("item_id")

    if not item_id:
        return jsonify({"error": "item_id fehlt"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM favorites
        WHERE user_id = ? AND item_id = ?
    """, (current_user["id"], item_id))

    removed = cursor.rowcount > 0
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Inserat wurde von der Merkliste entfernt" if removed else "Inserat war nicht auf der Merkliste",
        "is_favorite": False
    })


@favorites_bp.route("/favorites", methods=["GET"])
def get_favorites():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            items.*,
            users.first_name,
            users.last_name
        FROM favorites
        JOIN items ON favorites.item_id = items.id
        JOIN users ON items.user_id = users.id
        WHERE favorites.user_id = ?
        ORDER BY favorites.created_at DESC
    """, (current_user["id"],))

    favorite_items = cursor.fetchall()
    conn.close()

    return jsonify({
        "items": [item_to_dict(item) for item in favorite_items]
    })


@favorites_bp.route("/favorites/status", methods=["GET"])
def get_favorite_status():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    item_id = request.args.get("item_id", "").strip()

    if not item_id:
        return jsonify({"error": "item_id fehlt"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id
        FROM favorites
        WHERE user_id = ? AND item_id = ?
    """, (current_user["id"], item_id))

    is_favorite = cursor.fetchone() is not None
    conn.close()

    return jsonify({
        "item_id": item_id,
        "is_favorite": is_favorite
    })
