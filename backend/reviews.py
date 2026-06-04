import sqlite3

from flask import Blueprint, jsonify, request

from db import get_db
from notifications import create_notification
from utils import get_current_user


reviews_bp = Blueprint("reviews", __name__, url_prefix="/api")


@reviews_bp.route("/sellers/<int:seller_id>/reviews", methods=["GET"])
def get_seller_reviews(seller_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE id = ?", (seller_id,))

    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Verkäufer nicht gefunden"}), 404

    cursor.execute("""
        SELECT
            seller_reviews.id,
            seller_reviews.rating,
            seller_reviews.comment,
            seller_reviews.created_at,
            reviewers.first_name,
            reviewers.last_name
        FROM seller_reviews
        JOIN users AS reviewers ON seller_reviews.reviewer_id = reviewers.id
        WHERE seller_reviews.seller_id = ?
        ORDER BY seller_reviews.created_at DESC
    """, (seller_id,))

    reviews = cursor.fetchall()
    conn.close()

    return jsonify({
        "reviews": [
            {
                "id": review["id"],
                "rating": review["rating"],
                "comment": review["comment"],
                "created_at": review["created_at"],
                "reviewer_name": f"{review['first_name']} {review['last_name']}"
            }
            for review in reviews
        ]
    })


@reviews_bp.route("/sellers/<int:seller_id>/reviews", methods=["POST"])
def create_seller_review(seller_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    if current_user["id"] == seller_id:
        return jsonify({"error": "Du kannst dich nicht selbst bewerten"}), 400

    data = request.get_json() or {}
    rating_raw = data.get("rating")
    comment = str(data.get("comment") or "").strip()

    if isinstance(rating_raw, bool) or str(rating_raw) not in {"1", "2", "3", "4", "5"}:
        return jsonify({"error": "Bewertung muss zwischen 1 und 5 liegen"}), 400

    rating = int(rating_raw)

    if len(comment) > 500:
        return jsonify({"error": "Kommentar darf maximal 500 Zeichen lang sein"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE id = ?", (seller_id,))

    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Verkäufer nicht gefunden"}), 404

    try:
        cursor.execute("""
            INSERT INTO seller_reviews (
                seller_id,
                reviewer_id,
                rating,
                comment
            )
            VALUES (?, ?, ?, ?)
        """, (
            seller_id,
            current_user["id"],
            rating,
            comment
        ))
        create_notification(
            cursor,
            seller_id,
            "seller_review_received",
            "Neue Bewertung erhalten",
            f"Du hast eine neue Bewertung mit {rating} von 5 Sternen erhalten.",
            f"seller.html?id={seller_id}"
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({
            "error": "Du hast diesen Verkäufer bereits bewertet"
        }), 409

    review_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "message": "Bewertung wurde gespeichert",
        "review_id": review_id
    }), 201
