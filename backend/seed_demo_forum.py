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
    "ben": ("Ben", "Bach", "ben@local.test"),
    "emma": ("Emma", "Nebel", "emma@local.test"),
    "noah": ("Noah", "Fuchs", "noah@local.test"),
    "clara": ("Clara", "Mond", "clara@local.test"),
    "finn": ("Finn", "Wiese", "finn@local.test"),
    "sophie": ("Sophie", "Stein", "sophie@local.test"),
    "leon": ("Leon", "Fluss", "leon@local.test")
}

ANIMALS = {
    "Luna": ("mia", "Kaninchen", "Zwergkaninchen", "neugierig und mutig", "demo-zwergkaninchen-luna.svg"),
    "Momo": ("mia", "Katze", "Waldkatze", "leise und klug", "demo-britisch-kurzhaar.svg"),
    "Bruno": ("tom", "Hund", "Golden Retriever", "freundlich und beschützend", "demo-golden-retriever.svg"),
    "Theo": ("tom", "Schildkröte", "Landschildkröte", "langsam aber weise", "demo-schildkroete-theo.svg"),
    "Kiki": ("lina", "Vogel", "Wellensittich", "frech und schnell", "demo-wellensittich-paar.svg"),
    "Nala": ("lina", "Katze", "Maine Coon", "stolz und geheimnisvoll", "demo-maine-coon-kater.svg"),
    "Fips": ("ben", "Hamster", "Goldhamster", "klein aber tapfer", "demo-hamster-bruno.svg"),
    "Wuschel": ("ben", "Meerschweinchen", "Glatthaar", "gemütlich und loyal", "demo-meerschweinchen-gruppe.svg"),
    "Nebel": ("emma", "Katze", "Graue Katze", "vorsichtig und geheimnisvoll", "demo-britisch-kurzhaar.svg"),
    "Pino": ("emma", "Kaninchen", "Zwergkaninchen", "neugierig und schnell", "demo-zwergkaninchen-luna.svg"),
    "Rex": ("noah", "Hund", "Schäferhund", "mutig und wachsam", "demo-golden-retriever.svg"),
    "Mimi": ("noah", "Hamster", "Goldhamster", "erfinderisch und flink", "demo-hamster-bruno.svg"),
    "Ari": ("clara", "Vogel", "Weißer Wellensittich", "träumerisch und aufmerksam", "demo-wellensittich-paar.svg"),
    "Yuki": ("clara", "Schildkröte", "Landschildkröte", "ruhig und geduldig", "demo-schildkroete-theo.svg"),
    "Oskar": ("finn", "Meerschweinchen", "Glatthaar", "freundlich und etwas ängstlich", "demo-meerschweinchen-gruppe.svg"),
    "Tilda": ("finn", "Katze", "Maine Coon", "stolz und beschützend", "demo-maine-coon-kater.svg"),
    "Pepper": ("sophie", "Kaninchen", "Zwergkaninchen", "frech und mutig", "demo-zwergkaninchen-luna.svg"),
    "Lotte": ("sophie", "Hund", "Golden Retriever", "warmherzig und verspielt", "demo-golden-retriever.svg"),
    "Milo": ("leon", "Vogel", "Wellensittich", "laut und abenteuerlustig", "demo-wellensittich-paar.svg"),
    "Tara": ("leon", "Katze", "Waldkatze", "leise und klug", "demo-britisch-kurzhaar.svg")
}

GROUPS = {
    "Die Waldlichtung": {
        "owner": "mia",
        "category": "Wald",
        "description": "Ein friedlicher Treffpunkt für Tiere, die den Wald erkunden.",
        "members": ["mia", "tom", "lina", "emma", "noah", "clara"]
    },
    "Abenteuer am Bach": {
        "owner": "tom",
        "category": "Abenteuer",
        "description": "Mutige Tiere erleben Geschichten am Wasser und zwischen Steinen.",
        "members": ["tom", "ben", "mia", "noah", "finn", "leon"]
    },
    "Stadtpfoten": {
        "owner": "lina",
        "category": "Stadt",
        "description": "Haustiere entdecken heimlich die Straßen und Hinterhöfe der Stadt.",
        "members": ["lina", "ben", "tom", "sophie", "leon", "emma"]
    },
    "Mondscheinpfad": {
        "owner": "emma",
        "category": "Fantasie",
        "description": "Tiere folgen nachts geheimnisvollen Spuren unter dem Mondlicht.",
        "members": ["emma", "clara", "mia", "lina", "noah", "leon"]
    },
    "Die alte Scheune": {
        "owner": "finn",
        "category": "Familie",
        "description": "Ein warmer Ort voller Stroh, Geschichten und kleiner Geheimnisse.",
        "members": ["finn", "sophie", "ben", "tom", "clara", "mia"]
    },
    "Pfoten in der Stadt": {
        "owner": "sophie",
        "category": "Stadt",
        "description": "Zwischen Gärten, Hinterhöfen und Straßenlaternen erleben Tiere heimliche Abenteuer.",
        "members": ["sophie", "leon", "emma", "lina", "ben", "noah"]
    },
    "Die große Reise": {
        "owner": "leon",
        "category": "Abenteuer",
        "description": "Eine lange Reise über Wiesen, Wege und Flüsse beginnt.",
        "members": ["leon", "noah", "finn", "sophie", "tom", "clara"]
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
    ),
    "Der Ruf aus der Baumkrone": (
        "Die Waldlichtung",
        "clara",
        "Ein heller Ruf lockt die Tiere zu einer besonders hohen alten Buche."
    ),
    "Spuren im nassen Sand": (
        "Abenteuer am Bach",
        "noah",
        "Am Ufer entdecken die Tiere eine Reihe rätselhafter kleiner Abdrücke."
    ),
    "Das Fenster mit dem blauen Licht": (
        "Stadtpfoten",
        "sophie",
        "Ein sanft blau leuchtendes Fenster weckt die Neugier der Stadtpfoten."
    ),
    "Das Flüstern im Nebel": (
        "Mondscheinpfad",
        "emma",
        "Im silbernen Nebel klingt eine leise Melodie zwischen den Gräsern."
    ),
    "Die Spur aus silbernen Pfoten": (
        "Mondscheinpfad",
        "clara",
        "Funkelnde Pfotenabdrücke führen über den nächtlichen Pfad."
    ),
    "Ein Sturm zieht auf": (
        "Die alte Scheune",
        "finn",
        "Die Tiere bereiten den warmen Scheunenplatz gemeinsam auf den Regen vor."
    ),
    "Das Geheimnis unter dem Heuboden": (
        "Die alte Scheune",
        "sophie",
        "Unter dem Heu finden die Tiere eine vergessene Schachtel voller kleiner Andenken."
    ),
    "Die verschwundene Glocke": (
        "Pfoten in der Stadt",
        "sophie",
        "Eine kleine Gartenglocke ist verschwunden und alle helfen bei der Suche."
    ),
    "Unter den Straßenlaternen": (
        "Pfoten in der Stadt",
        "leon",
        "Die Tiere folgen dem Licht der Laternen durch ruhige Hinterhöfe."
    ),
    "Der erste Schritt": (
        "Die große Reise",
        "leon",
        "Mit gepackten Vorräten beginnt die gemeinsame Reise über die Wiesen."
    ),
    "Die Brücke aus Wurzeln": (
        "Die große Reise",
        "noah",
        "Ein Geflecht aus starken Wurzeln hilft den Reisenden über einen Graben."
    )
}

STORY_CASTS = {
    "Das geheimnisvolle Leuchten": ["Luna", "Bruno", "Kiki", "Momo", "Nebel", "Ari"],
    "Der Rat der Tiere": ["Bruno", "Luna", "Kiki", "Momo", "Rex", "Yuki"],
    "Der Ruf aus der Baumkrone": ["Ari", "Kiki", "Luna", "Nebel", "Rex", "Momo"],
    "Die verschwundene Brücke": ["Fips", "Bruno", "Luna", "Wuschel", "Rex", "Tara"],
    "Theo kennt den Weg": ["Theo", "Bruno", "Fips", "Momo", "Oskar", "Milo"],
    "Spuren im nassen Sand": ["Rex", "Tara", "Luna", "Fips", "Bruno", "Milo"],
    "Nacht auf den Dächern": ["Nala", "Kiki", "Fips", "Bruno", "Pepper", "Tara"],
    "Das Fenster mit dem blauen Licht": ["Pepper", "Nala", "Milo", "Nebel", "Wuschel", "Bruno"],
    "Das Flüstern im Nebel": ["Nebel", "Ari", "Luna", "Kiki", "Rex", "Tara"],
    "Die Spur aus silbernen Pfoten": ["Ari", "Nebel", "Momo", "Milo", "Luna", "Rex"],
    "Ein Sturm zieht auf": ["Oskar", "Lotte", "Wuschel", "Bruno", "Yuki", "Luna"],
    "Das Geheimnis unter dem Heuboden": ["Pepper", "Fips", "Theo", "Tilda", "Ari", "Momo"],
    "Die verschwundene Glocke": ["Pepper", "Milo", "Nebel", "Kiki", "Fips", "Mimi"],
    "Unter den Straßenlaternen": ["Milo", "Tara", "Nala", "Lotte", "Wuschel", "Rex"],
    "Der erste Schritt": ["Milo", "Rex", "Oskar", "Lotte", "Bruno", "Yuki"],
    "Die Brücke aus Wurzeln": ["Rex", "Tilda", "Theo", "Pepper", "Milo", "Ari"],
}

POST_TEMPLATES = [
    "{animal} blieb am Anfang des Weges kurz stehen und betrachtete aufmerksam die Umgebung. Die Geschichte „{story}“ fühlte sich heute besonders lebendig an, denn überall gab es neue Düfte und leise Geräusche zu entdecken. „Wir gehen gemeinsam weiter und achten gut aufeinander“, sagte {animal} freundlich.",
    "{animal} rückte ein wenig näher zu den anderen und lauschte dem sanften Rascheln ringsum. Obwohl {trait} sonst oft den eigenen Weg bestimmte, war jetzt vor allem die gemeinsame Aufgabe wichtig. Mit einem zuversichtlichen Blick zeigte {animal} auf eine kleine Spur, die vorher niemand bemerkt hatte.",
    "Vorsichtig folgte {animal} dem Weg und ließ sich Zeit, jedes Detail anzusehen. Ein warmer Lichtschein fiel auf den Boden und machte die Umgebung beinahe märchenhaft. „Vielleicht erzählt uns dieser Ort selbst, wohin wir als Nächstes gehen sollen“, überlegte {animal} laut.",
    "{animal} entdeckte zwischen Blättern, Steinen und Gräsern ein winziges Zeichen, das gut zur Geschichte „{story}“ passen könnte. Sofort rief {animal} die Freunde zusammen, damit niemand die Entdeckung allein untersuchen musste. Gemeinsam schmiedeten sie einen ruhigen und klugen Plan.",
    "Ein leichter Wind strich über das Fell und die Federn, während {animal} mutig den nächsten Schritt machte. Dabei blieb {animal} immer wieder stehen, um sicherzugehen, dass alle Freunde folgen konnten. „Es ist viel schöner, wenn wir dieses Abenteuer miteinander erleben“, sagte {animal} lächelnd.",
    "{animal} setzte sich für einen Moment an den Rand des Weges und dachte über alles nach, was die Gruppe bisher entdeckt hatte. Weil {trait} gut zu diesem Augenblick passte, fiel {animal} eine einfache, aber hilfreiche Idee ein. Die anderen hörten aufmerksam zu und machten sich anschließend gemeinsam auf den Weg."
]


def build_story_posts(story_title):
    return [
        (
            animal,
            POST_TEMPLATES[index].format(
                animal=animal,
                story=story_title,
                trait=ANIMALS[animal][3]
            )
        )
        for index, animal in enumerate(STORY_CASTS[story_title])
    ]


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
    counts = {
        "User": 0,
        "Tiere": 0,
        "Gruppen": 0,
        "Mitgliedschaften": 0,
        "Geschichten": 0,
        "Beiträge": 0,
        "Likes": 0
    }

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
            counts["Mitgliedschaften"] += cursor.rowcount

    story_ids = {}
    for title, (group_title, owner, description) in STORIES.items():
        story_ids[title], created = ensure_story(
            cursor, group_ids[group_title], user_ids[owner], title, description
        )
        counts["Geschichten"] += int(created)

    post_ids = []
    post_owner_ids = {}
    for story_title in STORIES:
        group_title = STORIES[story_title][0]
        for animal, content in build_story_posts(story_title):
            post = cursor.execute(
                "SELECT id FROM forum_posts WHERE story_id = ? AND content = ?",
                (story_ids[story_title], content)
            ).fetchone()
            if post:
                post_ids.append(post["id"])
                post_owner_ids[post["id"]] = animal_owner_ids[animal]
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
            post_owner_ids[cursor.lastrowid] = animal_owner_ids[animal]
            counts["Beiträge"] += 1

    demo_user_ids = list(user_ids.values())
    for index, post_id in enumerate(post_ids):
        target_likes = 1 + (index % 4)
        added_likes = 0
        for offset in range(1, len(demo_user_ids) + 1):
            user_id = demo_user_ids[(index + offset) % len(demo_user_ids)]
            if user_id == post_owner_ids[post_id]:
                continue

            cursor.execute("""
                INSERT OR IGNORE INTO forum_post_reactions (post_id, user_id, reaction)
                VALUES (?, ?, 'like')
            """, (post_id, user_id))
            counts["Likes"] += cursor.rowcount
            added_likes += 1

            if added_likes == target_likes:
                break

    conn.commit()
    conn.close()

    for label, count in counts.items():
        print(f"Erstellte {label}: {count}")

    print("\nDemo-Login:")
    for _, _, email in USERS.values():
        print(f"{email} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
