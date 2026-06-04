import os
import sqlite3

from werkzeug.security import generate_password_hash

import db


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "database.db")
DEMO_PASSWORD = "Demo123"

USERS = {
    "mia": ("Mia", "Wald", "mia@local.test"),
    "tom": ("Tom", "Pfote", "tom@local.test"),
    "lina": ("Lina", "Feder", "lina@local.test"),
    "ben": ("Ben", "Bach", "ben@local.test")
}

ANIMALS = {
    "Luna": ("mia", "Kaninchen", "Zwergkaninchen", "neugierig und mutig", "demo-zwergkaninchen-luna.svg"),
    "Momo": ("mia", "Katze", "Waldkatze", "leise und klug", "demo-britisch-kurzhaar.svg"),
    "Bruno": ("tom", "Hund", "Golden Retriever", "freundlich und beschützend", "demo-golden-retriever.svg"),
    "Theo": ("tom", "Schildkröte", "Landschildkröte", "langsam aber weise", "demo-schildkroete-theo.svg"),
    "Kiki": ("lina", "Vogel", "Wellensittich", "frech und schnell", "demo-wellensittich-paar.svg"),
    "Nala": ("lina", "Katze", "Maine Coon", "stolz und geheimnisvoll", "demo-maine-coon-kater.svg"),
    "Fips": ("ben", "Hamster", "Goldhamster", "klein aber tapfer", "demo-hamster-bruno.svg"),
    "Wuschel": ("ben", "Meerschweinchen", "Glatthaar", "gemütlich und loyal", "demo-meerschweinchen-gruppe.svg")
}

GROUPS = {
    "Die Waldlichtung": {
        "owner": "mia",
        "category": "Wald",
        "description": "Ein friedlicher Treffpunkt für Tiere, die den Wald erkunden.",
        "members": ["mia", "tom", "lina"]
    },
    "Abenteuer am Bach": {
        "owner": "tom",
        "category": "Abenteuer",
        "description": "Mutige Tiere erleben Geschichten am Wasser und zwischen Steinen.",
        "members": ["tom", "ben", "mia"]
    },
    "Stadtpfoten": {
        "owner": "lina",
        "category": "Stadt",
        "description": "Haustiere entdecken heimlich die Straßen und Hinterhöfe der Stadt.",
        "members": ["lina", "ben", "tom"]
    }
}

STORIES = {
    "Das geheimnisvolle Leuchten": (
        "Die Waldlichtung",
        "mia",
        "Luna entdeckt nachts ein seltsames Licht zwischen den alten Bäumen."
    ),
    "Der Rat der Tiere": (
        "Die Waldlichtung",
        "tom",
        "Die Tiere versammeln sich, um über ein neues Geräusch im Wald zu sprechen."
    ),
    "Die verschwundene Brücke": (
        "Abenteuer am Bach",
        "ben",
        "Nach einem starken Regen ist der Weg über den Bach verschwunden."
    ),
    "Theo kennt den Weg": (
        "Abenteuer am Bach",
        "tom",
        "Die Schildkröte Theo erinnert sich an einen alten Pfad."
    ),
    "Nacht auf den Dächern": (
        "Stadtpfoten",
        "lina",
        "Nala führt die Tiere über Mauern, Dächer und stille Gassen."
    )
}

POSTS = {
    "Das geheimnisvolle Leuchten": [
        ("Luna", "Ich habe das Leuchten gesehen! Es war direkt hinter der großen Eiche."),
        ("Bruno", "Dann bleibe ich dicht bei euch. Niemand geht allein weiter."),
        ("Kiki", "Von oben funkelt es wie ein kleiner Stern zwischen den Zweigen!"),
        ("Momo", "Ich schleiche voraus und lausche, ob sich dort etwas bewegt.")
    ],
    "Der Rat der Tiere": [
        ("Bruno", "Wir sollten ruhig bleiben und zuerst allen zuhören."),
        ("Luna", "Das Geräusch kam dreimal aus Richtung Farnhügel."),
        ("Kiki", "Ich fliege hinauf und halte nach Spuren Ausschau!"),
        ("Momo", "Im Moos liegen kleine Abdrücke. Sie wirken nicht gefährlich.")
    ],
    "Die verschwundene Brücke": [
        ("Fips", "Die Brücke ist weg, aber ich sehe einen schmalen Ast über dem Wasser!"),
        ("Bruno", "Bleibt hinter mir. Ich prüfe zuerst, ob der Ast sicher ist."),
        ("Luna", "Zwischen den Steinen ist eine trockene Stelle zum Ausruhen."),
        ("Wuschel", "Gemeinsam schaffen wir das. Ich trage die kleinen Vorräte.")
    ],
    "Theo kennt den Weg": [
        ("Theo", "Langsam. Alte Wege verschwinden nicht, sie verstecken sich nur."),
        ("Bruno", "Wir folgen dir, Theo. Deine Erinnerung kennt diesen Bach besser als wir."),
        ("Fips", "Unter den Wurzeln ist wirklich ein kleiner Durchgang!"),
        ("Momo", "Der Pfad riecht nach trockenem Laub. Hier waren lange keine Pfoten.")
    ],
    "Nacht auf den Dächern": [
        ("Nala", "Setzt eure Pfoten genau dorthin, wo das Mondlicht die Ziegel berührt."),
        ("Kiki", "Von hier oben sehe ich die ganze Straße und keinen Menschen!"),
        ("Fips", "Die Dachrinne ist hoch, aber ich bin klein genug für den schmalen Weg."),
        ("Bruno", "Ich warte am Hof und passe auf, bis ihr wieder unten seid.")
    ]
}


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_user(cursor, first_name, last_name, email):
    user = cursor.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if user:
        return user["id"], False

    cursor.execute("""
        INSERT INTO users (first_name, last_name, email, password_hash, is_admin)
        VALUES (?, ?, ?, ?, 0)
    """, (first_name, last_name, email, generate_password_hash(DEMO_PASSWORD)))
    return cursor.lastrowid, True


def ensure_animal(cursor, user_id, title, species, breed, description, image_filename):
    animal = cursor.execute(
        "SELECT id FROM items WHERE user_id = ? AND title = ?",
        (user_id, title)
    ).fetchone()
    if animal:
        return animal["id"], False

    cursor.execute("""
        INSERT INTO items (
            user_id, title, description, item_type, species, breed, age,
            gender, price, image_path, status
        )
        VALUES (?, ?, ?, 'animal', ?, ?, '', 'unbekannt', 0, ?, 'aktiv')
    """, (user_id, title, description, species, breed, f"/uploads/items/{image_filename}"))
    return cursor.lastrowid, True


def ensure_group(cursor, owner_id, title, description, category):
    group = cursor.execute("SELECT id FROM forum_groups WHERE title = ?", (title,)).fetchone()
    if group:
        return group["id"], False

    cursor.execute("""
        INSERT INTO forum_groups (owner_id, title, description, category)
        VALUES (?, ?, ?, ?)
    """, (owner_id, title, description, category))
    return cursor.lastrowid, True


def ensure_story(cursor, group_id, owner_id, title, description):
    story = cursor.execute(
        "SELECT id FROM forum_stories WHERE group_id = ? AND title = ?",
        (group_id, title)
    ).fetchone()
    if story:
        return story["id"], False

    cursor.execute("""
        INSERT INTO forum_stories (group_id, owner_id, title, description, status)
        VALUES (?, ?, ?, ?, 'aktiv')
    """, (group_id, owner_id, title, description))
    return cursor.lastrowid, True


def main():
    db.DATABASE = DATABASE
    db.init_db()
    conn = get_connection()
    cursor = conn.cursor()
    counts = {"User": 0, "Tiere": 0, "Gruppen": 0, "Geschichten": 0, "Beiträge": 0, "Likes": 0}

    user_ids = {}
    for key, user in USERS.items():
        user_ids[key], created = ensure_user(cursor, *user)
        counts["User"] += int(created)

    animal_ids = {}
    animal_owner_ids = {}
    for title, (owner, species, breed, description, image_filename) in ANIMALS.items():
        animal_ids[title], created = ensure_animal(
            cursor, user_ids[owner], title, species, breed, description, image_filename
        )
        animal_owner_ids[title] = user_ids[owner]
        counts["Tiere"] += int(created)

    group_ids = {}
    for title, group in GROUPS.items():
        group_ids[title], created = ensure_group(
            cursor, user_ids[group["owner"]], title, group["description"], group["category"]
        )
        counts["Gruppen"] += int(created)
        for member in group["members"]:
            cursor.execute("""
                INSERT OR IGNORE INTO forum_group_members (group_id, user_id)
                VALUES (?, ?)
            """, (group_ids[title], user_ids[member]))

    story_ids = {}
    for title, (group_title, owner, description) in STORIES.items():
        story_ids[title], created = ensure_story(
            cursor, group_ids[group_title], user_ids[owner], title, description
        )
        counts["Geschichten"] += int(created)

    post_ids = []
    for story_title, posts in POSTS.items():
        group_title = STORIES[story_title][0]
        for animal, content in posts:
            post = cursor.execute(
                "SELECT id FROM forum_posts WHERE story_id = ? AND content = ?",
                (story_ids[story_title], content)
            ).fetchone()
            if post:
                post_ids.append(post["id"])
                continue

            cursor.execute("""
                INSERT INTO forum_posts (group_id, user_id, character_item_id, story_id, content)
                VALUES (?, ?, ?, ?, ?)
            """, (
                group_ids[group_title],
                animal_owner_ids[animal],
                animal_ids[animal],
                story_ids[story_title],
                content
            ))
            post_ids.append(cursor.lastrowid)
            counts["Beiträge"] += 1

    demo_user_ids = list(user_ids.values())
    for index, post_id in enumerate(post_ids):
        for offset in (1, 2):
            user_id = demo_user_ids[(index + offset) % len(demo_user_ids)]
            cursor.execute("""
                INSERT OR IGNORE INTO forum_post_reactions (post_id, user_id, reaction)
                VALUES (?, ?, 'like')
            """, (post_id, user_id))
            counts["Likes"] += cursor.rowcount

    conn.commit()
    conn.close()

    for label, count in counts.items():
        print(f"Erstellte {label}: {count}")

    print("\nDemo-Login:")
    for _, _, email in USERS.values():
        print(f"{email} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
