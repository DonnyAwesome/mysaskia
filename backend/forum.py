from flask import Blueprint, jsonify, request

from db import get_db
from utils import get_current_user


forum_bp = Blueprint("forum", __name__, url_prefix="/api/forum")


def group_to_dict(group):
    return {
        "id": group["id"],
        "title": group["title"],
        "description": group["description"],
        "category": group["category"],
        "owner_name": group["owner_name"],
        "members_count": group["members_count"],
        "posts_count": group["posts_count"],
        "created_at": group["created_at"],
        "is_member": bool(group["is_member"]),
        "is_owner": bool(group["is_owner"])
    }


def post_to_dict(post, include_group=False):
    result = {
        "character_item_id": post["character_item_id"],
        "character_name": post["character_name"],
        "character_species": post["character_species"],
        "character_image_path": post["character_image_path"],
        "user_name": post["user_name"],
        "content": post["content"],
        "created_at": post["created_at"],
        "likes_count": post["likes_count"],
        "liked_by_current_user": bool(post["liked_by_current_user"])
    }

    if include_group:
        result["post_id"] = post["post_id"]
        result["group_id"] = post["group_id"]
        result["group_title"] = post["group_title"]
        result["group_category"] = post["group_category"]
        result["story_id"] = post["story_id"]
        result["story_title"] = post["story_title"]
    else:
        result["id"] = post["post_id"]

    return result


def validate_character(cursor, current_user_id, character_item_id):
    if character_item_id is None:
        return None

    try:
        character_item_id = int(character_item_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Ungültige Tierrolle"}), 400

    if character_item_id < 1:
        return jsonify({"error": "Ungültige Tierrolle"}), 400

    character = cursor.execute("""
        SELECT id, user_id, item_type, status
        FROM items
        WHERE id = ?
    """, (character_item_id,)).fetchone()

    if not character:
        return jsonify({"error": "Tierrolle nicht gefunden"}), 404

    if character["user_id"] != current_user_id:
        return jsonify({"error": "Du darfst nicht als fremdes Tier schreiben"}), 403

    if character["item_type"] != "animal" or character["status"] not in ["aktiv", "verkauft"]:
        return jsonify({"error": "Dieses Inserat kann nicht als Tierrolle verwendet werden"}), 400

    return character_item_id


def select_group(cursor, group_id, current_user_id=None):
    return cursor.execute("""
        SELECT
            forum_groups.id,
            forum_groups.title,
            forum_groups.description,
            forum_groups.category,
            forum_groups.created_at,
            owners.first_name || ' ' || owners.last_name AS owner_name,
            forum_groups.owner_id = ? AS is_owner,
            (
                SELECT COUNT(*)
                FROM forum_group_members
                WHERE forum_group_members.group_id = forum_groups.id
            ) AS members_count,
            (
                SELECT COUNT(*)
                FROM forum_posts
                WHERE forum_posts.group_id = forum_groups.id
                  AND forum_posts.story_id IS NULL
            ) AS posts_count,
            EXISTS (
                SELECT 1
                FROM forum_group_members
                WHERE forum_group_members.group_id = forum_groups.id
                  AND forum_group_members.user_id = ?
            ) AS is_member
        FROM forum_groups
        JOIN users AS owners ON forum_groups.owner_id = owners.id
        WHERE forum_groups.id = ?
    """, (current_user_id, current_user_id, group_id)).fetchone()


@forum_bp.route("/groups", methods=["GET"])
def get_groups():
    current_user = get_current_user()
    current_user_id = current_user["id"] if current_user else None
    conn = get_db()
    groups = conn.execute("""
        SELECT
            forum_groups.id,
            forum_groups.title,
            forum_groups.description,
            forum_groups.category,
            forum_groups.created_at,
            owners.first_name || ' ' || owners.last_name AS owner_name,
            forum_groups.owner_id = ? AS is_owner,
            (
                SELECT COUNT(*)
                FROM forum_group_members
                WHERE forum_group_members.group_id = forum_groups.id
            ) AS members_count,
            (
                SELECT COUNT(*)
                FROM forum_posts
                WHERE forum_posts.group_id = forum_groups.id
                  AND forum_posts.story_id IS NULL
            ) AS posts_count,
            EXISTS (
                SELECT 1
                FROM forum_group_members
                WHERE forum_group_members.group_id = forum_groups.id
                  AND forum_group_members.user_id = ?
            ) AS is_member
        FROM forum_groups
        JOIN users AS owners ON forum_groups.owner_id = owners.id
        ORDER BY forum_groups.created_at DESC, forum_groups.id DESC
    """, (current_user_id, current_user_id)).fetchall()
    conn.close()

    return jsonify({"groups": [group_to_dict(group) for group in groups]})


@forum_bp.route("/groups", methods=["POST"])
def create_group():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    data = request.get_json() or {}
    title = str(data.get("title") or "").strip()
    description = str(data.get("description") or "").strip()
    category = str(data.get("category") or "").strip()

    if not title or not description or not category:
        return jsonify({"error": "Titel, Beschreibung und Kategorie sind erforderlich"}), 400

    if len(title) > 120 or len(description) > 1000 or len(category) > 80:
        return jsonify({"error": "Gruppendaten sind zu lang"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO forum_groups (owner_id, title, description, category)
        VALUES (?, ?, ?, ?)
    """, (current_user["id"], title, description, category))
    group_id = cursor.lastrowid
    cursor.execute("""
        INSERT INTO forum_group_members (group_id, user_id)
        VALUES (?, ?)
    """, (group_id, current_user["id"]))
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Gruppe wurde erstellt",
        "group_id": group_id
    }), 201


@forum_bp.route("/groups/<int:group_id>", methods=["GET"])
def get_group(group_id):
    current_user = get_current_user()
    current_user_id = current_user["id"] if current_user else None
    conn = get_db()
    cursor = conn.cursor()
    group = select_group(cursor, group_id, current_user_id)

    if not group:
        conn.close()
        return jsonify({"error": "Gruppe nicht gefunden"}), 404

    posts = cursor.execute("""
        SELECT
            forum_posts.id AS post_id,
            forum_posts.character_item_id,
            characters.title AS character_name,
            characters.species AS character_species,
            characters.image_path AS character_image_path,
            users.first_name || ' ' || users.last_name AS user_name,
            forum_posts.content,
            forum_posts.created_at,
            (
                SELECT COUNT(*) FROM forum_post_reactions
                WHERE forum_post_reactions.post_id = forum_posts.id
                  AND forum_post_reactions.reaction = 'like'
            ) AS likes_count,
            EXISTS (
                SELECT 1 FROM forum_post_reactions
                WHERE forum_post_reactions.post_id = forum_posts.id
                  AND forum_post_reactions.user_id = ?
                  AND forum_post_reactions.reaction = 'like'
            ) AS liked_by_current_user
        FROM forum_posts
        JOIN users ON forum_posts.user_id = users.id
        LEFT JOIN items AS characters ON forum_posts.character_item_id = characters.id
        WHERE forum_posts.group_id = ? AND forum_posts.story_id IS NULL
        ORDER BY forum_posts.created_at DESC, forum_posts.id DESC
        LIMIT 100
    """, (current_user_id, group_id)).fetchall()
    conn.close()

    result = group_to_dict(group)
    result["posts"] = [post_to_dict(post) for post in posts]

    return jsonify(result)


@forum_bp.route("/groups/<int:group_id>/join", methods=["POST"])
def join_group(group_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    cursor = conn.cursor()

    if not cursor.execute("SELECT id FROM forum_groups WHERE id = ?", (group_id,)).fetchone():
        conn.close()
        return jsonify({"error": "Gruppe nicht gefunden"}), 404

    cursor.execute("""
        INSERT OR IGNORE INTO forum_group_members (group_id, user_id)
        VALUES (?, ?)
    """, (group_id, current_user["id"]))
    conn.commit()
    conn.close()

    return jsonify({"message": "Du bist der Gruppe beigetreten", "is_member": True})


@forum_bp.route("/groups/<int:group_id>/leave", methods=["POST"])
def leave_group(group_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    cursor = conn.cursor()
    group = cursor.execute(
        "SELECT owner_id FROM forum_groups WHERE id = ?",
        (group_id,)
    ).fetchone()

    if not group:
        conn.close()
        return jsonify({"error": "Gruppe nicht gefunden"}), 404

    if group["owner_id"] == current_user["id"]:
        conn.close()
        return jsonify({"error": "Gruppenersteller können die Gruppe nicht verlassen"}), 400

    cursor.execute("""
        DELETE FROM forum_group_members
        WHERE group_id = ? AND user_id = ?
    """, (group_id, current_user["id"]))
    conn.commit()
    conn.close()

    return jsonify({"message": "Du hast die Gruppe verlassen", "is_member": False})


@forum_bp.route("/groups/<int:group_id>/posts", methods=["POST"])
def create_post(group_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    data = request.get_json() or {}
    content = str(data.get("content") or "").strip()
    character_item_id = data.get("character_item_id")

    if not content:
        return jsonify({"error": "Beitrag darf nicht leer sein"}), 400

    if len(content) > 1000:
        return jsonify({"error": "Beitrag darf maximal 1000 Zeichen lang sein"}), 400

    conn = get_db()
    cursor = conn.cursor()

    if not cursor.execute("SELECT id FROM forum_groups WHERE id = ?", (group_id,)).fetchone():
        conn.close()
        return jsonify({"error": "Gruppe nicht gefunden"}), 404

    membership = cursor.execute("""
        SELECT id
        FROM forum_group_members
        WHERE group_id = ? AND user_id = ?
    """, (group_id, current_user["id"])).fetchone()

    if not membership:
        conn.close()
        return jsonify({"error": "Du musst Mitglied der Gruppe sein"}), 403

    character_result = validate_character(cursor, current_user["id"], character_item_id)
    if isinstance(character_result, tuple):
        conn.close()
        return character_result
    character_item_id = character_result

    cursor.execute("""
        INSERT INTO forum_posts (group_id, user_id, character_item_id, content)
        VALUES (?, ?, ?, ?)
    """, (group_id, current_user["id"], character_item_id, content))
    post_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Beitrag wurde veröffentlicht",
        "post_id": post_id
    }), 201


@forum_bp.route("/groups/<int:group_id>/stories", methods=["GET"])
def get_group_stories(group_id):
    conn = get_db()
    cursor = conn.cursor()

    if not cursor.execute("SELECT id FROM forum_groups WHERE id = ?", (group_id,)).fetchone():
        conn.close()
        return jsonify({"error": "Gruppe nicht gefunden"}), 404

    stories = cursor.execute("""
        SELECT
            forum_stories.id,
            forum_stories.group_id,
            forum_stories.title,
            forum_stories.description,
            forum_stories.status,
            forum_stories.created_at,
            owners.first_name || ' ' || owners.last_name AS owner_name,
            COUNT(forum_posts.id) AS posts_count,
            MAX(forum_posts.created_at) AS last_post_at
        FROM forum_stories
        JOIN users AS owners ON forum_stories.owner_id = owners.id
        LEFT JOIN forum_posts ON forum_posts.story_id = forum_stories.id
        WHERE forum_stories.group_id = ?
        GROUP BY forum_stories.id
        ORDER BY COALESCE(MAX(forum_posts.created_at), forum_stories.created_at) DESC,
                 forum_stories.id DESC
    """, (group_id,)).fetchall()
    conn.close()

    return jsonify({
        "stories": [
            {
                "id": story["id"],
                "group_id": story["group_id"],
                "title": story["title"],
                "description": story["description"],
                "status": story["status"],
                "owner_name": story["owner_name"],
                "posts_count": story["posts_count"],
                "last_post_at": story["last_post_at"],
                "created_at": story["created_at"]
            }
            for story in stories
        ]
    })


@forum_bp.route("/groups/<int:group_id>/stories", methods=["POST"])
def create_story(group_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    data = request.get_json() or {}
    title = str(data.get("title") or "").strip()
    description = str(data.get("description") or "").strip()

    if not title:
        return jsonify({"error": "Titel darf nicht leer sein"}), 400

    if len(title) > 120 or len(description) > 1000:
        return jsonify({"error": "Geschichtendaten sind zu lang"}), 400

    conn = get_db()
    cursor = conn.cursor()

    if not cursor.execute("SELECT id FROM forum_groups WHERE id = ?", (group_id,)).fetchone():
        conn.close()
        return jsonify({"error": "Gruppe nicht gefunden"}), 404

    membership = cursor.execute("""
        SELECT id FROM forum_group_members
        WHERE group_id = ? AND user_id = ?
    """, (group_id, current_user["id"])).fetchone()

    if not membership:
        conn.close()
        return jsonify({"error": "Du musst Mitglied der Gruppe sein"}), 403

    cursor.execute("""
        INSERT INTO forum_stories (group_id, owner_id, title, description, status)
        VALUES (?, ?, ?, ?, 'aktiv')
    """, (group_id, current_user["id"], title, description))
    story_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"message": "Geschichte wurde gestartet", "story_id": story_id}), 201


@forum_bp.route("/stories/<int:story_id>", methods=["GET"])
def get_story(story_id):
    current_user = get_current_user()
    current_user_id = current_user["id"] if current_user else None
    conn = get_db()
    cursor = conn.cursor()
    story = cursor.execute("""
        SELECT
            forum_stories.id,
            forum_stories.group_id,
            forum_groups.title AS group_title,
            forum_stories.title,
            forum_stories.description,
            forum_stories.status,
            forum_stories.created_at,
            owners.first_name || ' ' || owners.last_name AS owner_name,
            forum_stories.owner_id = ? AS is_owner,
            forum_groups.owner_id = ? AS is_group_owner,
            EXISTS (
                SELECT 1 FROM forum_group_members
                WHERE forum_group_members.group_id = forum_stories.group_id
                  AND forum_group_members.user_id = ?
            ) AS is_group_member
        FROM forum_stories
        JOIN forum_groups ON forum_stories.group_id = forum_groups.id
        JOIN users AS owners ON forum_stories.owner_id = owners.id
        WHERE forum_stories.id = ?
    """, (current_user_id, current_user_id, current_user_id, story_id)).fetchone()

    if not story:
        conn.close()
        return jsonify({"error": "Geschichte nicht gefunden"}), 404

    posts = cursor.execute("""
        SELECT
            forum_posts.id AS post_id,
            forum_posts.character_item_id,
            characters.title AS character_name,
            characters.species AS character_species,
            characters.image_path AS character_image_path,
            users.first_name || ' ' || users.last_name AS user_name,
            forum_posts.content,
            forum_posts.created_at,
            (
                SELECT COUNT(*) FROM forum_post_reactions
                WHERE forum_post_reactions.post_id = forum_posts.id
                  AND forum_post_reactions.reaction = 'like'
            ) AS likes_count,
            EXISTS (
                SELECT 1 FROM forum_post_reactions
                WHERE forum_post_reactions.post_id = forum_posts.id
                  AND forum_post_reactions.user_id = ?
                  AND forum_post_reactions.reaction = 'like'
            ) AS liked_by_current_user
        FROM forum_posts
        JOIN users ON forum_posts.user_id = users.id
        LEFT JOIN items AS characters ON forum_posts.character_item_id = characters.id
        WHERE forum_posts.story_id = ?
        ORDER BY forum_posts.created_at ASC, forum_posts.id ASC
        LIMIT 200
    """, (current_user_id, story_id)).fetchall()
    conn.close()

    return jsonify({
        "id": story["id"],
        "group_id": story["group_id"],
        "group_title": story["group_title"],
        "title": story["title"],
        "description": story["description"],
        "status": story["status"],
        "owner_name": story["owner_name"],
        "created_at": story["created_at"],
        "is_group_member": bool(story["is_group_member"]),
        "is_owner": bool(story["is_owner"]),
        "is_group_owner": bool(story["is_group_owner"]),
        "posts": [post_to_dict(post) for post in posts]
    })


@forum_bp.route("/stories/<int:story_id>/posts", methods=["POST"])
def create_story_post(story_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    data = request.get_json() or {}
    content = str(data.get("content") or "").strip()
    character_item_id = data.get("character_item_id")

    if not content:
        return jsonify({"error": "Beitrag darf nicht leer sein"}), 400

    if len(content) > 1000:
        return jsonify({"error": "Beitrag darf maximal 1000 Zeichen lang sein"}), 400

    conn = get_db()
    cursor = conn.cursor()
    story = cursor.execute("""
        SELECT id, group_id, status FROM forum_stories WHERE id = ?
    """, (story_id,)).fetchone()

    if not story:
        conn.close()
        return jsonify({"error": "Geschichte nicht gefunden"}), 404

    if story["status"] != "aktiv":
        conn.close()
        return jsonify({"error": "Diese Geschichte ist abgeschlossen"}), 400

    membership = cursor.execute("""
        SELECT id FROM forum_group_members
        WHERE group_id = ? AND user_id = ?
    """, (story["group_id"], current_user["id"])).fetchone()

    if not membership:
        conn.close()
        return jsonify({"error": "Du musst Mitglied der Gruppe sein"}), 403

    character_result = validate_character(cursor, current_user["id"], character_item_id)
    if isinstance(character_result, tuple):
        conn.close()
        return character_result
    character_item_id = character_result

    cursor.execute("""
        INSERT INTO forum_posts (group_id, user_id, character_item_id, story_id, content)
        VALUES (?, ?, ?, ?, ?)
    """, (story["group_id"], current_user["id"], character_item_id, story_id, content))
    post_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"message": "Beitrag wurde veröffentlicht", "post_id": post_id}), 201


@forum_bp.route("/stories/<int:story_id>/status", methods=["PATCH"])
def update_story_status(story_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    status = str((request.get_json() or {}).get("status") or "").strip()
    if status not in ["aktiv", "abgeschlossen"]:
        return jsonify({"error": "Ungültiger Status"}), 400

    conn = get_db()
    cursor = conn.cursor()
    story = cursor.execute("""
        SELECT forum_stories.owner_id, forum_groups.owner_id AS group_owner_id
        FROM forum_stories
        JOIN forum_groups ON forum_stories.group_id = forum_groups.id
        WHERE forum_stories.id = ?
    """, (story_id,)).fetchone()

    if not story:
        conn.close()
        return jsonify({"error": "Geschichte nicht gefunden"}), 404

    if current_user["id"] not in [story["owner_id"], story["group_owner_id"]]:
        conn.close()
        return jsonify({"error": "Keine Berechtigung"}), 403

    cursor.execute("UPDATE forum_stories SET status = ? WHERE id = ?", (status, story_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Status wurde aktualisiert", "status": status})


@forum_bp.route("/posts/<int:post_id>/reactions", methods=["POST"])
def add_post_reaction(post_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    reaction = str((request.get_json() or {}).get("reaction") or "").strip()
    if reaction != "like":
        return jsonify({"error": "Ungültige Reaktion"}), 400

    conn = get_db()
    cursor = conn.cursor()

    if not cursor.execute("SELECT id FROM forum_posts WHERE id = ?", (post_id,)).fetchone():
        conn.close()
        return jsonify({"error": "Beitrag nicht gefunden"}), 404

    cursor.execute("""
        INSERT OR IGNORE INTO forum_post_reactions (post_id, user_id, reaction)
        VALUES (?, ?, ?)
    """, (post_id, current_user["id"], reaction))
    conn.commit()
    likes_count = cursor.execute("""
        SELECT COUNT(*) AS count FROM forum_post_reactions
        WHERE post_id = ? AND reaction = 'like'
    """, (post_id,)).fetchone()["count"]
    conn.close()

    return jsonify({"reaction": reaction, "likes_count": likes_count, "liked_by_current_user": True})


@forum_bp.route("/posts/<int:post_id>/reactions", methods=["DELETE"])
def remove_post_reaction(post_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    reaction = str((request.get_json() or {}).get("reaction") or "").strip()
    if reaction != "like":
        return jsonify({"error": "Ungültige Reaktion"}), 400

    conn = get_db()
    cursor = conn.cursor()

    if not cursor.execute("SELECT id FROM forum_posts WHERE id = ?", (post_id,)).fetchone():
        conn.close()
        return jsonify({"error": "Beitrag nicht gefunden"}), 404

    cursor.execute("""
        DELETE FROM forum_post_reactions
        WHERE post_id = ? AND user_id = ? AND reaction = ?
    """, (post_id, current_user["id"], reaction))
    conn.commit()
    likes_count = cursor.execute("""
        SELECT COUNT(*) AS count FROM forum_post_reactions
        WHERE post_id = ? AND reaction = 'like'
    """, (post_id,)).fetchone()["count"]
    conn.close()

    return jsonify({"reaction": reaction, "likes_count": likes_count, "liked_by_current_user": False})


@forum_bp.route("/my-characters", methods=["GET"])
def get_my_characters():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"error": "Nicht eingeloggt"}), 401

    conn = get_db()
    characters = conn.execute("""
        SELECT id, title, species, breed, image_path
        FROM items
        WHERE user_id = ?
          AND item_type = 'animal'
          AND status IN ('aktiv', 'verkauft')
        ORDER BY created_at DESC, id DESC
    """, (current_user["id"],)).fetchall()
    conn.close()

    return jsonify({
        "characters": [
            {
                "id": character["id"],
                "title": character["title"],
                "species": character["species"],
                "breed": character["breed"],
                "image_path": character["image_path"]
            }
            for character in characters
        ]
    })


@forum_bp.route("/feed", methods=["GET"])
def get_feed():
    current_user = get_current_user()
    current_user_id = current_user["id"] if current_user else None
    conn = get_db()
    posts = conn.execute("""
        SELECT
            forum_posts.id AS post_id,
            forum_groups.id AS group_id,
            forum_groups.title AS group_title,
            forum_groups.category AS group_category,
            forum_posts.story_id,
            forum_stories.title AS story_title,
            forum_posts.character_item_id,
            characters.title AS character_name,
            characters.species AS character_species,
            characters.image_path AS character_image_path,
            users.first_name || ' ' || users.last_name AS user_name,
            forum_posts.content,
            forum_posts.created_at,
            (
                SELECT COUNT(*) FROM forum_post_reactions
                WHERE forum_post_reactions.post_id = forum_posts.id
                  AND forum_post_reactions.reaction = 'like'
            ) AS likes_count,
            EXISTS (
                SELECT 1 FROM forum_post_reactions
                WHERE forum_post_reactions.post_id = forum_posts.id
                  AND forum_post_reactions.user_id = ?
                  AND forum_post_reactions.reaction = 'like'
            ) AS liked_by_current_user
        FROM forum_posts
        JOIN forum_groups ON forum_posts.group_id = forum_groups.id
        JOIN users ON forum_posts.user_id = users.id
        LEFT JOIN items AS characters ON forum_posts.character_item_id = characters.id
        LEFT JOIN forum_stories ON forum_posts.story_id = forum_stories.id
        ORDER BY forum_posts.created_at DESC, forum_posts.id DESC
        LIMIT 100
    """, (current_user_id,)).fetchall()
    conn.close()

    return jsonify({
        "posts": [post_to_dict(post, include_group=True) for post in posts]
    })
