import os
import sqlite3
from itertools import cycle

from werkzeug.security import generate_password_hash


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "database.db")
UPLOAD_ITEMS_FOLDER = os.path.join(BASE_DIR, "uploads", "items")

os.chdir(BASE_DIR)

from db import init_db

DEMO_EMAIL = "demo@local.test"
DEMO_PASSWORD = "Demo123"

DEMO_ITEMS = [
    {
        "title": "Golden Retriever Welpe",
        "description": "Freundlicher Golden Retriever Welpe sucht ein liebevolles Zuhause mit viel Zeit und Geduld.",
        "species": "Hund",
        "breed": "Golden Retriever",
        "age": "12 Wochen",
        "gender": "männlich",
        "price": 950.00
    },
    {
        "title": "Britisch Kurzhaar Katze",
        "description": "Ruhige Britisch Kurzhaar Katze, stubenrein und an Menschen gewöhnt.",
        "species": "Katze",
        "breed": "Britisch Kurzhaar",
        "age": "2 Jahre",
        "gender": "weiblich",
        "price": 650.00
    },
    {
        "title": "Zwergkaninchen Luna",
        "description": "Luna ist neugierig, zutraulich und sucht ein artgerechtes Zuhause mit viel Platz.",
        "species": "Kaninchen",
        "breed": "Zwergkaninchen",
        "age": "8 Monate",
        "gender": "weiblich",
        "price": 45.00
    },
    {
        "title": "Wellensittich Paar",
        "description": "Zwei muntere Wellensittiche werden nur gemeinsam in gute Hände abgegeben.",
        "species": "Vogel",
        "breed": "Wellensittich",
        "age": "1 Jahr",
        "gender": "unbekannt",
        "price": 80.00
    },
    {
        "title": "Hamster Bruno",
        "description": "Bruno ist ein aktiver Goldhamster und bringt sein gewohntes Zubehör gerne mit.",
        "species": "Hamster",
        "breed": "Goldhamster",
        "age": "5 Monate",
        "gender": "männlich",
        "price": 25.00
    },
    {
        "title": "Maine Coon Kater",
        "description": "Großer, verschmuster Maine Coon Kater mit ruhigem Wesen.",
        "species": "Katze",
        "breed": "Maine Coon",
        "age": "3 Jahre",
        "gender": "männlich",
        "price": 780.00
    },
    {
        "title": "Meerschweinchen Gruppe",
        "description": "Kleine harmonische Meerschweinchen Gruppe sucht gemeinsam ein neues Gehege.",
        "species": "Meerschweinchen",
        "breed": "Glatthaar",
        "age": "1 bis 2 Jahre",
        "gender": "unbekannt",
        "price": 60.00
    },
    {
        "title": "Schildkröte Theo",
        "description": "Theo ist eine ruhige Landschildkröte und braucht ein erfahrenes Zuhause mit Außengehege.",
        "species": "Schildkröte",
        "breed": "Landschildkröte",
        "age": "6 Jahre",
        "gender": "männlich",
        "price": 180.00
    }
]


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row

    return conn


def ensure_demo_user(cursor):
    cursor.execute("SELECT id FROM users WHERE email = ?", (DEMO_EMAIL,))
    user = cursor.fetchone()

    if user:
        return user["id"], False

    cursor.execute("""
        INSERT INTO users (
            first_name,
            last_name,
            email,
            password_hash,
            is_admin
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        "Demo",
        "Verkäufer",
        DEMO_EMAIL,
        generate_password_hash(DEMO_PASSWORD),
        0
    ))

    return cursor.lastrowid, True


def get_existing_image_paths():
    if not os.path.isdir(UPLOAD_ITEMS_FOLDER):
        return []

    allowed_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
    filenames = sorted(
        filename
        for filename in os.listdir(UPLOAD_ITEMS_FOLDER)
        if os.path.splitext(filename)[1].lower() in allowed_extensions
    )

    return [f"/uploads/items/{filename}" for filename in filenames]


def main():
    init_db()

    conn = get_connection()
    cursor = conn.cursor()

    demo_user_id, user_created = ensure_demo_user(cursor)
    image_paths = get_existing_image_paths()
    image_cycle = cycle(image_paths) if image_paths else None
    inserted_titles = []
    existing_titles = []

    for item in DEMO_ITEMS:
        cursor.execute("SELECT id FROM items WHERE title = ?", (item["title"],))

        if cursor.fetchone():
            existing_titles.append(item["title"])
            continue

        image_path = next(image_cycle) if image_cycle else None

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
            demo_user_id,
            item["title"],
            item["description"],
            "animal",
            item["species"],
            item["breed"],
            item["age"],
            item["gender"],
            item["price"],
            image_path,
            "aktiv"
        ))

        inserted_titles.append(item["title"])

    conn.commit()
    conn.close()

    print(f"Demo-Verkäufer: {'erstellt' if user_created else 'bereits vorhanden'}")
    print(f"Eingefügte Demo-Inserate: {len(inserted_titles)}")

    if inserted_titles:
        print("Neu eingefügt:")
        for title in inserted_titles:
            print(f"- {title}")

    if existing_titles:
        print("Bereits vorhanden:")
        for title in existing_titles:
            print(f"- {title}")

    print("Demo-Login:")
    print(f"E-Mail: {DEMO_EMAIL}")
    print(f"Passwort: {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
