from flask import Blueprint, jsonify

from db import get_db
from utils import get_current_user


dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")


def count_one(cursor, query, params=()):
    cursor.execute(query, params)
    row = cursor.fetchone()

    return row[0] if row else 0


@dashboard_bp.route("/dashboard/summary", methods=["GET"])
def get_dashboard_summary():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    cursor = conn.cursor()
    user_id = current_user["id"]

    summary = {
        "my_items_count": count_one(
            cursor,
            "SELECT COUNT(*) FROM items WHERE user_id = ?",
            (user_id,)
        ),
        "my_active_items_count": count_one(
            cursor,
            "SELECT COUNT(*) FROM items WHERE user_id = ? AND status = 'aktiv'",
            (user_id,)
        ),
        "my_sold_items_count": count_one(
            cursor,
            "SELECT COUNT(*) FROM items WHERE user_id = ? AND status = 'verkauft'",
            (user_id,)
        ),
        "my_orders_count": count_one(
            cursor,
            "SELECT COUNT(*) FROM orders WHERE buyer_id = ?",
            (user_id,)
        ),
        "my_sales_count": count_one(
            cursor,
            "SELECT COUNT(*) FROM orders WHERE seller_id = ?",
            (user_id,)
        ),
        "my_open_sales_count": count_one(
            cursor,
            "SELECT COUNT(*) FROM orders WHERE seller_id = ? AND status = 'angefragt'",
            (user_id,)
        ),
        "my_tickets_count": count_one(
            cursor,
            "SELECT COUNT(*) FROM tickets WHERE user_id = ?",
            (user_id,)
        ),
        "my_open_tickets_count": count_one(
            cursor,
            "SELECT COUNT(*) FROM tickets WHERE user_id = ? AND status = 'offen'",
            (user_id,)
        )
    }

    if current_user["is_admin"]:
        summary.update({
            "total_users": count_one(cursor, "SELECT COUNT(*) FROM users"),
            "total_items": count_one(cursor, "SELECT COUNT(*) FROM items"),
            "active_items": count_one(
                cursor,
                "SELECT COUNT(*) FROM items WHERE status = 'aktiv'"
            ),
            "sold_items": count_one(
                cursor,
                "SELECT COUNT(*) FROM items WHERE status = 'verkauft'"
            ),
            "total_orders": count_one(cursor, "SELECT COUNT(*) FROM orders"),
            "open_orders": count_one(
                cursor,
                "SELECT COUNT(*) FROM orders WHERE status = 'angefragt'"
            ),
            "total_tickets": count_one(cursor, "SELECT COUNT(*) FROM tickets"),
            "open_tickets": count_one(
                cursor,
                "SELECT COUNT(*) FROM tickets WHERE status = 'offen'"
            )
        })

    conn.close()

    return jsonify(summary)
