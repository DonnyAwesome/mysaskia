import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from db import get_db
from utils import get_current_user

items_bp = Blueprint("items", __name__, url_prefix="/api")

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads", "items")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def allowed_file(filename):
    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS


def build_image_url(image_path):
    if not image_path:
        return None

    base_url = request.host_url.rstrip("/")
    return f"{base_url}{image_path}"


def item_to_dict(item):
    return {
        "id": item["id"],
        "user_id": item["user_id"],
        "seller_name": f"{item['first_name']} {item['last_name']}",
        "title": item["title"],
        "description": item["description"],
        "item_type": item["item_type"],
        "species": item["species"],
        "breed": item["breed"],
        "age": item["age"],
        "gender": item["gender"],
        "price": item["price"],
        "image_path": item["image_path"],
        "image_url": build_image_url(item["image_path"]),
        "status": item["status"],
        "created_at": item["created_at"]
    }


@items_bp.route("/items", methods=["GET"])
def get_items():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            items.*,
            users.first_name,
            users.last_name
        FROM items
        JOIN users ON items.user_id = users.id
        WHERE items.status = 'aktiv'
        ORDER BY items.created_at DESC
    """)

    items = cursor.fetchall()
    conn.close()

    return jsonify({
        "items": [item_to_dict(item) for item in items]
    })


@items_bp.route("/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            items.*,
            users.first_name,
            users.last_name
        FROM items
        JOIN users ON items.user_id = users.id
        WHERE items.id = ?
    """, (item_id,))

    item = cursor.fetchone()
    conn.close()

    if not item:
        return jsonify({"error": "Inserat nicht gefunden"}), 404

    return jsonify({
        "item": item_to_dict(item)
    })


@items_bp.route("/my_items", methods=["GET"])
def get_my_items():
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
        FROM items
        JOIN users ON items.user_id = users.id
        WHERE items.user_id = ?
        ORDER BY items.created_at DESC
    """, (current_user["id"],))

    items = cursor.fetchall()
    conn.close()

    return jsonify({
        "items": [item_to_dict(item) for item in items]
    })


@items_bp.route("/items", methods=["POST"])
def create_item():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    item_type = request.form.get("item_type", "animal").strip()
    species = request.form.get("species", "").strip()
    breed = request.form.get("breed", "").strip()
    age = request.form.get("age", "").strip()
    gender = request.form.get("gender", "").strip()
    price_raw = request.form.get("price", "").strip()

    if not title:
        return jsonify({"error": "Titel fehlt"}), 400

    if not description:
        return jsonify({"error": "Beschreibung fehlt"}), 400

    if not price_raw:
        return jsonify({"error": "Preis fehlt"}), 400

    try:
        price = float(price_raw.replace(",", "."))
    except ValueError:
        return jsonify({"error": "Preis muss eine Zahl sein"}), 400

    if price < 0:
        return jsonify({"error": "Preis darf nicht negativ sein"}), 400

    image_path = None

    image = request.files.get("image")

    if image and image.filename:
        if not allowed_file(image.filename):
            return jsonify({
                "error": "Ungültiger Bildtyp. Erlaubt sind png, jpg, jpeg, gif und webp."
            }), 400

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        original_filename = secure_filename(image.filename)
        extension = original_filename.rsplit(".", 1)[1].lower()
        new_filename = f"{uuid.uuid4().hex}.{extension}"

        save_path = os.path.join(UPLOAD_FOLDER, new_filename)
        image.save(save_path)

        image_path = f"/uploads/items/{new_filename}"

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO items (
            user_id,
            title,
            description,
            item_type,
            species,
            breed,
            age,
            gender,
            price,
            image_path,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        current_user["id"],
        title,
        description,
        item_type or "animal",
        species,
        breed,
        age,
        gender,
        price,
        image_path,
        "aktiv"
    ))

    conn.commit()
    item_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "message": "Inserat wurde erstellt",
        "item_id": item_id,
        "image_path": image_path
    }), 201


@items_bp.route("/items/<int:item_id>", methods=["PATCH"])
def update_item(item_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, user_id, image_path
        FROM items
        WHERE id = ?
    """, (item_id,))

    item = cursor.fetchone()

    if not item:
        conn.close()
        return jsonify({"error": "Inserat nicht gefunden"}), 404

    if item["user_id"] != current_user["id"] and not current_user["is_admin"]:
        conn.close()
        return jsonify({"error": "Keine Berechtigung"}), 403

    editable_fields = [
        "title",
        "description",
        "item_type",
        "species",
        "breed",
        "age",
        "gender",
        "status"
    ]
    updates = {}

    for field in editable_fields:
        if field in request.form:
            updates[field] = request.form.get(field, "").strip()

    if "title" in updates and not updates["title"]:
        conn.close()
        return jsonify({"error": "Titel fehlt"}), 400

    if "price" in request.form:
        price_raw = request.form.get("price", "").strip()

        try:
            price = float(price_raw.replace(",", ".")) if price_raw else 0
        except ValueError:
            conn.close()
            return jsonify({"error": "Preis muss eine Zahl sein"}), 400

        if price < 0:
            conn.close()
            return jsonify({"error": "Preis darf nicht negativ sein"}), 400

        updates["price"] = price

    if "status" in updates and updates["status"] not in ["aktiv", "verkauft"]:
        conn.close()
        return jsonify({"error": "Ungültiger Status"}), 400

    image = request.files.get("image")

    if image and image.filename:
        if not allowed_file(image.filename):
            conn.close()
            return jsonify({
                "error": "Ungültiger Bildtyp. Erlaubt sind png, jpg, jpeg, gif und webp."
            }), 400

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        original_filename = secure_filename(image.filename)
        extension = original_filename.rsplit(".", 1)[1].lower()
        new_filename = f"{uuid.uuid4().hex}.{extension}"

        save_path = os.path.join(UPLOAD_FOLDER, new_filename)
        image.save(save_path)

        updates["image_path"] = f"/uploads/items/{new_filename}"

    if updates:
        assignments = ", ".join(f"{field} = ?" for field in updates)
        values = list(updates.values()) + [item_id]

        cursor.execute(
            f"UPDATE items SET {assignments} WHERE id = ?",
            values
        )
        conn.commit()

    cursor.execute("""
        SELECT
            items.*,
            users.first_name,
            users.last_name
        FROM items
        JOIN users ON items.user_id = users.id
        WHERE items.id = ?
    """, (item_id,))

    updated_item = cursor.fetchone()
    conn.close()

    return jsonify({
        "message": "Inserat wurde aktualisiert",
        "item": item_to_dict(updated_item)
    })


@items_bp.route("/items/status", methods=["PATCH"])
def update_item_status():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    data = request.get_json() or {}

    item_id = data.get("item_id")
    new_status = data.get("status")

    allowed_statuses = ["aktiv", "verkauft"]

    if not item_id:
        return jsonify({"error": "item_id fehlt"}), 400

    if new_status not in allowed_statuses:
        return jsonify({"error": "Ungültiger Status"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, user_id
        FROM items
        WHERE id = ?
    """, (item_id,))

    item = cursor.fetchone()

    if not item:
        conn.close()
        return jsonify({"error": "Inserat nicht gefunden"}), 404

    if item["user_id"] != current_user["id"] and not current_user["is_admin"]:
        conn.close()
        return jsonify({"error": "Keine Berechtigung"}), 403

    cursor.execute("""
        UPDATE items
        SET status = ?
        WHERE id = ?
    """, (new_status, item_id))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Status wurde aktualisiert"
    })


@items_bp.route("/items", methods=["DELETE"])
def delete_item():
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
        SELECT id, user_id, image_path
        FROM items
        WHERE id = ?
    """, (item_id,))

    item = cursor.fetchone()

    if not item:
        conn.close()
        return jsonify({"error": "Inserat nicht gefunden"}), 404

    if item["user_id"] != current_user["id"] and not current_user["is_admin"]:
        conn.close()
        return jsonify({"error": "Keine Berechtigung"}), 403

    if item["image_path"]:
        filename = os.path.basename(item["image_path"])
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        if os.path.exists(file_path):
            os.remove(file_path)

    cursor.execute("""
        DELETE FROM favorites
        WHERE item_id = ?
    """, (item_id,))

    cursor.execute("""
        DELETE FROM items
        WHERE id = ?
    """, (item_id,))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Inserat wurde gelöscht"
    })
