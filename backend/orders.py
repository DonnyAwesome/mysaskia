from flask import Blueprint, jsonify, request

from db import get_db
from utils import get_current_user


orders_bp = Blueprint("orders", __name__, url_prefix="/api")


def build_image_url(image_path):
    if not image_path:
        return None

    base_url = request.host_url.rstrip("/")
    return f"{base_url}{image_path}"


def order_to_dict(order, person_field):
    data = {
        "id": order["id"],
        "item_id": order["item_id"],
        "item_title": order["item_title"],
        "price": order["price"],
        "image_path": order["image_path"],
        "image_url": build_image_url(order["image_path"]),
        "status": order["status"],
        "created_at": order["created_at"]
    }

    if person_field == "seller":
        data["seller_name"] = f"{order['seller_first_name']} {order['seller_last_name']}"

    if person_field == "buyer":
        data["buyer_name"] = f"{order['buyer_first_name']} {order['buyer_last_name']}"

    return data


@orders_bp.route("/orders", methods=["POST"])
def create_order():
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
        SELECT id, user_id, status
        FROM items
        WHERE id = ?
    """, (item_id,))

    item = cursor.fetchone()

    if not item:
        conn.close()
        return jsonify({"error": "Inserat nicht gefunden"}), 404

    if item["status"] != "aktiv":
        conn.close()
        return jsonify({"error": "Dieses Inserat ist nicht mehr aktiv"}), 400

    if item["user_id"] == current_user["id"]:
        conn.close()
        return jsonify({"error": "Du kannst dein eigenes Inserat nicht kaufen"}), 400

    cursor.execute("""
        SELECT id
        FROM orders
        WHERE item_id = ?
          AND buyer_id = ?
          AND status = 'angefragt'
    """, (item["id"], current_user["id"]))

    existing_order = cursor.fetchone()

    if existing_order:
        conn.close()
        return jsonify({"error": "Du hast für dieses Inserat bereits Interesse angemeldet"}), 409

    cursor.execute("""
        INSERT INTO orders (
            item_id,
            buyer_id,
            seller_id,
            status
        )
        VALUES (?, ?, ?, ?)
    """, (
        item["id"],
        current_user["id"],
        item["user_id"],
        "angefragt"
    ))

    conn.commit()
    order_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "message": "Interesse wurde angemeldet.",
        "order_id": order_id,
        "status": "angefragt"
    }), 201


@orders_bp.route("/my_orders", methods=["GET"])
def get_my_orders():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            orders.id,
            orders.item_id,
            orders.status,
            orders.created_at,
            items.title AS item_title,
            items.price,
            items.image_path,
            sellers.first_name AS seller_first_name,
            sellers.last_name AS seller_last_name
        FROM orders
        JOIN items ON orders.item_id = items.id
        JOIN users AS sellers ON orders.seller_id = sellers.id
        WHERE orders.buyer_id = ?
        ORDER BY orders.created_at DESC
    """, (current_user["id"],))

    orders = cursor.fetchall()
    conn.close()

    return jsonify({
        "orders": [order_to_dict(order, "seller") for order in orders]
    })


@orders_bp.route("/orders/status", methods=["PATCH"])
def update_order_status():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    data = request.get_json() or {}
    order_id = data.get("order_id")
    new_status = data.get("status")
    allowed_statuses = ["bestätigt", "abgelehnt", "abgeschlossen"]

    if not order_id:
        return jsonify({"error": "order_id fehlt"}), 400

    if new_status not in allowed_statuses:
        return jsonify({"error": "Ungültiger Status"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, item_id, seller_id, status
        FROM orders
        WHERE id = ?
    """, (order_id,))

    order = cursor.fetchone()

    if not order:
        conn.close()
        return jsonify({"error": "Kaufanfrage nicht gefunden"}), 404

    if order["seller_id"] != current_user["id"]:
        conn.close()
        return jsonify({"error": "Keine Berechtigung"}), 403

    cursor.execute("""
        UPDATE orders
        SET status = ?
        WHERE id = ?
    """, (new_status, order_id))

    if new_status == "bestätigt":
        cursor.execute("""
            UPDATE items
            SET status = 'verkauft'
            WHERE id = ?
        """, (order["item_id"],))

    if new_status == "abgeschlossen":
        cursor.execute("""
            UPDATE items
            SET status = 'verkauft'
            WHERE id = ?
        """, (order["item_id"],))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Status wurde aktualisiert",
        "status": new_status
    })


@orders_bp.route("/my_sales", methods=["GET"])
def get_my_sales():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            orders.id,
            orders.item_id,
            orders.status,
            orders.created_at,
            items.title AS item_title,
            items.price,
            items.image_path,
            buyers.first_name AS buyer_first_name,
            buyers.last_name AS buyer_last_name
        FROM orders
        JOIN items ON orders.item_id = items.id
        JOIN users AS buyers ON orders.buyer_id = buyers.id
        WHERE orders.seller_id = ?
        ORDER BY orders.created_at DESC
    """, (current_user["id"],))

    orders = cursor.fetchall()
    conn.close()

    return jsonify({
        "orders": [order_to_dict(order, "buyer") for order in orders]
    })
