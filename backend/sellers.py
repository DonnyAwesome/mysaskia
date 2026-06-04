from flask import Blueprint, jsonify, request

from db import get_db


sellers_bp = Blueprint("sellers", __name__, url_prefix="/api")


def build_image_url(image_path):
    if not image_path:
        return None

    base_url = request.host_url.rstrip("/")
    return f"{base_url}{image_path}"


def seller_item_to_dict(item):
    return {
        "id": item["id"],
        "title": item["title"],
        "description": item["description"],
        "species": item["species"],
        "breed": item["breed"],
        "price": item["price"],
        "image_path": item["image_path"],
        "image_url": build_image_url(item["image_path"]),
        "status": item["status"],
        "created_at": item["created_at"]
    }


@sellers_bp.route("/sellers/<int:user_id>", methods=["GET"])
def get_seller(user_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, first_name, last_name, created_at
        FROM users
        WHERE id = ?
    """, (user_id,))

    seller = cursor.fetchone()

    if not seller:
        conn.close()
        return jsonify({"error": "Verkäufer nicht gefunden"}), 404

    cursor.execute("""
        SELECT COUNT(*)
        FROM items
        WHERE user_id = ? AND status = 'aktiv'
    """, (user_id,))
    active_items_count = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM items
        WHERE user_id = ? AND status = 'verkauft'
    """, (user_id,))
    sold_items_count = cursor.fetchone()[0]

    cursor.execute("""
        SELECT
            id,
            title,
            description,
            species,
            breed,
            price,
            image_path,
            status,
            created_at
        FROM items
        WHERE user_id = ? AND status = 'aktiv'
        ORDER BY created_at DESC
    """, (user_id,))

    active_items = cursor.fetchall()
    conn.close()

    return jsonify({
        "id": seller["id"],
        "first_name": seller["first_name"],
        "last_name": seller["last_name"],
        "created_at": seller["created_at"],
        "active_items_count": active_items_count,
        "sold_items_count": sold_items_count,
        "active_items": [seller_item_to_dict(item) for item in active_items]
    })
