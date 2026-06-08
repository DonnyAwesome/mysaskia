from flask import Blueprint, jsonify, request

from db import get_db
from utils import admin_required


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/items", methods=["GET"])
@admin_required
def get_admin_items(current_user):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            items.id,
            items.title,
            items.species,
            items.breed,
            items.price,
            items.status,
            items.created_at,
            users.first_name,
            users.last_name,
            users.email
        FROM items
        JOIN users ON items.user_id = users.id
        ORDER BY items.created_at DESC
    """)

    items = cursor.fetchall()
    conn.close()

    return jsonify({
        "items": [
            {
                "id": item["id"],
                "title": item["title"],
                "seller_name": f"{item['first_name']} {item['last_name']}",
                "seller_email": item["email"],
                "species": item["species"],
                "breed": item["breed"],
                "price": item["price"],
                "status": item["status"],
                "created_at": item["created_at"]
            }
            for item in items
        ]
    })


@admin_bp.route("/orders", methods=["GET"])
@admin_required
def get_admin_orders(current_user):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            orders.id,
            orders.status,
            orders.created_at,
            items.title AS item_title,
            buyers.first_name AS buyer_first_name,
            buyers.last_name AS buyer_last_name,
            buyers.email AS buyer_email,
            sellers.first_name AS seller_first_name,
            sellers.last_name AS seller_last_name,
            sellers.email AS seller_email
        FROM orders
        JOIN items ON orders.item_id = items.id
        JOIN users AS buyers ON orders.buyer_id = buyers.id
        JOIN users AS sellers ON orders.seller_id = sellers.id
        ORDER BY orders.created_at DESC
    """)

    orders = cursor.fetchall()
    conn.close()

    return jsonify({
        "orders": [
            {
                "id": order["id"],
                "item_title": order["item_title"],
                "buyer_name": f"{order['buyer_first_name']} {order['buyer_last_name']}",
                "buyer_email": order["buyer_email"],
                "seller_name": f"{order['seller_first_name']} {order['seller_last_name']}",
                "seller_email": order["seller_email"],
                "status": order["status"],
                "created_at": order["created_at"]
            }
            for order in orders
        ]
    })


@admin_bp.route("/items/<int:item_id>/status", methods=["PATCH"])
@admin_required
def update_admin_item_status(current_user, item_id):
    data = request.get_json() or {}
    status = data.get("status")
    allowed_statuses = ["aktiv", "verkauft", "verborgen"]

    if status not in allowed_statuses:
        return jsonify({"error": "Ungültiger Status"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE items
        SET status = ?
        WHERE id = ?
    """, (status, item_id))

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Inserat nicht gefunden"}), 404

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Inseratstatus wurde aktualisiert",
        "status": status
    })


@admin_bp.route("/reviews", methods=["GET"])
@admin_required
def get_admin_reviews(current_user):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            seller_reviews.id,
            seller_reviews.rating,
            seller_reviews.comment,
            seller_reviews.created_at,
            sellers.first_name AS seller_first_name,
            sellers.last_name AS seller_last_name,
            reviewers.first_name AS reviewer_first_name,
            reviewers.last_name AS reviewer_last_name
        FROM seller_reviews
        JOIN users AS sellers ON seller_reviews.seller_id = sellers.id
        JOIN users AS reviewers ON seller_reviews.reviewer_id = reviewers.id
        ORDER BY seller_reviews.created_at DESC
    """)

    reviews = cursor.fetchall()
    conn.close()

    return jsonify({
        "reviews": [
            {
                "id": review["id"],
                "seller_name": f"{review['seller_first_name']} {review['seller_last_name']}",
                "reviewer_name": f"{review['reviewer_first_name']} {review['reviewer_last_name']}",
                "rating": review["rating"],
                "comment": review["comment"],
                "created_at": review["created_at"]
            }
            for review in reviews
        ]
    })


@admin_bp.route("/reviews/<int:review_id>", methods=["DELETE"])
@admin_required
def delete_admin_review(current_user, review_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM seller_reviews WHERE id = ?", (review_id,))

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Bewertung nicht gefunden"}), 404

    conn.commit()
    conn.close()

    return jsonify({"message": "Bewertung wurde gelöscht"})
