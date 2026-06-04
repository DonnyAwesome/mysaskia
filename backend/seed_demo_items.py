import os
import sqlite3

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
        "price": 950.00,
        "image_filename": "demo-golden-retriever.svg",
        "illustration": "dog"
    },
    {
        "title": "Britisch Kurzhaar Katze",
        "description": "Ruhige Britisch Kurzhaar Katze, stubenrein und an Menschen gewöhnt.",
        "species": "Katze",
        "breed": "Britisch Kurzhaar",
        "age": "2 Jahre",
        "gender": "weiblich",
        "price": 650.00,
        "image_filename": "demo-britisch-kurzhaar.svg",
        "illustration": "british_cat"
    },
    {
        "title": "Zwergkaninchen Luna",
        "description": "Luna ist neugierig, zutraulich und sucht ein artgerechtes Zuhause mit viel Platz.",
        "species": "Kaninchen",
        "breed": "Zwergkaninchen",
        "age": "8 Monate",
        "gender": "weiblich",
        "price": 45.00,
        "image_filename": "demo-zwergkaninchen-luna.svg",
        "illustration": "rabbit"
    },
    {
        "title": "Wellensittich Paar",
        "description": "Zwei muntere Wellensittiche werden nur gemeinsam in gute Hände abgegeben.",
        "species": "Vogel",
        "breed": "Wellensittich",
        "age": "1 Jahr",
        "gender": "unbekannt",
        "price": 80.00,
        "image_filename": "demo-wellensittich-paar.svg",
        "illustration": "birds"
    },
    {
        "title": "Hamster Bruno",
        "description": "Bruno ist ein aktiver Goldhamster und bringt sein gewohntes Zubehör gerne mit.",
        "species": "Hamster",
        "breed": "Goldhamster",
        "age": "5 Monate",
        "gender": "männlich",
        "price": 25.00,
        "image_filename": "demo-hamster-bruno.svg",
        "illustration": "hamster"
    },
    {
        "title": "Maine Coon Kater",
        "description": "Großer, verschmuster Maine Coon Kater mit ruhigem Wesen.",
        "species": "Katze",
        "breed": "Maine Coon",
        "age": "3 Jahre",
        "gender": "männlich",
        "price": 780.00,
        "image_filename": "demo-maine-coon-kater.svg",
        "illustration": "maine_coon"
    },
    {
        "title": "Meerschweinchen Gruppe",
        "description": "Kleine harmonische Meerschweinchen Gruppe sucht gemeinsam ein neues Gehege.",
        "species": "Meerschweinchen",
        "breed": "Glatthaar",
        "age": "1 bis 2 Jahre",
        "gender": "unbekannt",
        "price": 60.00,
        "image_filename": "demo-meerschweinchen-gruppe.svg",
        "illustration": "guinea_pigs"
    },
    {
        "title": "Schildkröte Theo",
        "description": "Theo ist eine ruhige Landschildkröte und braucht ein erfahrenes Zuhause mit Außengehege.",
        "species": "Schildkröte",
        "breed": "Landschildkröte",
        "age": "6 Jahre",
        "gender": "männlich",
        "price": 180.00,
        "image_filename": "demo-schildkroete-theo.svg",
        "illustration": "turtle"
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


def build_demo_svg(item):
    illustrations = {
        "dog": """
            <path d="M205 184 165 105l72 35M435 184l40-79-72 35" fill="#bf7b32"/>
            <ellipse cx="320" cy="245" rx="150" ry="125" fill="#e6a84f"/>
            <ellipse cx="320" cy="278" rx="82" ry="63" fill="#f7d18d"/>
            <circle cx="265" cy="225" r="12"/><circle cx="375" cy="225" r="12"/>
            <path d="M300 267q20-18 40 0-4 25-20 25t-20-25M276 310q44 38 88 0" fill="#5b3827" stroke="#5b3827" stroke-width="10" stroke-linecap="round"/>
            <path d="M210 374q110 45 220 0" fill="none" stroke="#fff4d6" stroke-width="22" stroke-linecap="round"/>
        """,
        "british_cat": """
            <path d="M195 175 220 85l75 75M445 175 420 85l-75 75" fill="#718096"/>
            <circle cx="320" cy="245" r="145" fill="#8b98aa"/>
            <circle cx="265" cy="230" r="13" fill="#f4c542"/><circle cx="375" cy="230" r="13" fill="#f4c542"/>
            <path d="M306 270h28l-14 18z" fill="#e8a3a3"/>
            <path d="M320 288q-24 27-48 5M320 288q24 27 48 5M235 275l-75-15M235 295l-78 18M405 275l75-15M405 295l78 18" fill="none" stroke="#4a5568" stroke-width="7" stroke-linecap="round"/>
        """,
        "rabbit": """
            <ellipse cx="260" cy="120" rx="42" ry="105" fill="#d6c1aa"/><ellipse cx="380" cy="120" rx="42" ry="105" fill="#d6c1aa"/>
            <ellipse cx="260" cy="120" rx="18" ry="72" fill="#efb4b4"/><ellipse cx="380" cy="120" rx="18" ry="72" fill="#efb4b4"/>
            <ellipse cx="320" cy="275" rx="145" ry="130" fill="#e5d5c3"/>
            <circle cx="270" cy="245" r="12"/><circle cx="370" cy="245" r="12"/>
            <path d="M308 280h24l-12 16z" fill="#df9292"/>
            <path d="M320 296v28M320 312l-28 18M320 312l28 18M245 295l-75-15M245 315l-75 18M395 295l75-15M395 315l75 18" fill="none" stroke="#786452" stroke-width="7" stroke-linecap="round"/>
        """,
        "birds": """
            <path d="M155 355h330" stroke="#9a6b3b" stroke-width="18" stroke-linecap="round"/>
            <ellipse cx="250" cy="245" rx="86" ry="112" fill="#72c9d4"/><ellipse cx="390" cy="245" rx="86" ry="112" fill="#8fd36b"/>
            <circle cx="225" cy="210" r="10"/><circle cx="365" cy="210" r="10"/>
            <path d="m270 225 38 16-38 16M410 225l38 16-38 16" fill="#f6b73c"/>
            <path d="M205 250q45 30 75 75M345 250q45 30 75 75" fill="none" stroke="#4b9daa" stroke-width="18" stroke-linecap="round"/>
            <path d="M230 355v38M270 355v38M370 355v38M410 355v38" stroke="#6f563d" stroke-width="7"/>
        """,
        "hamster": """
            <circle cx="215" cy="195" r="65" fill="#bf7b42"/><circle cx="425" cy="195" r="65" fill="#bf7b42"/>
            <circle cx="320" cy="265" r="155" fill="#d99a58"/>
            <ellipse cx="320" cy="305" rx="95" ry="80" fill="#fff0d6"/>
            <circle cx="265" cy="245" r="12"/><circle cx="375" cy="245" r="12"/>
            <circle cx="320" cy="285" r="14" fill="#7a4935"/>
            <path d="M320 300v25M320 320l-25 15M320 320l25 15M245 295l-72-15M245 315l-72 18M395 295l72-15M395 315l72 18" fill="none" stroke="#7a4935" stroke-width="7" stroke-linecap="round"/>
        """,
        "maine_coon": """
            <path d="M170 195 215 65l80 105M470 195 425 65l-80 105" fill="#805f4b"/>
            <path d="M320 105 470 220l-40 165-110 55-110-55-40-165z" fill="#9b765d"/>
            <path d="M320 145 390 210l-35 35 45 40-80 125-80-125 45-40-35-35z" fill="#c1a087"/>
            <circle cx="260" cy="235" r="13" fill="#8fca63"/><circle cx="380" cy="235" r="13" fill="#8fca63"/>
            <path d="M306 278h28l-14 18z" fill="#d69a9a"/>
            <path d="M320 296q-25 26-50 4M320 296q25 26 50 4M240 280l-85-16M240 305l-85 20M400 280l85-16M400 305l85 20" fill="none" stroke="#5d4436" stroke-width="7" stroke-linecap="round"/>
        """,
        "guinea_pigs": """
            <ellipse cx="205" cy="285" rx="105" ry="115" fill="#b87943"/><ellipse cx="320" cy="245" rx="112" ry="132" fill="#f1dfc4"/><ellipse cx="435" cy="285" rx="105" ry="115" fill="#9b765d"/>
            <circle cx="175" cy="265" r="10"/><circle cx="235" cy="265" r="10"/><circle cx="285" cy="225" r="10"/><circle cx="355" cy="225" r="10"/><circle cx="405" cy="265" r="10"/><circle cx="465" cy="265" r="10"/>
            <path d="M195 295h20M310 260h20M425 295h20" stroke="#6b4631" stroke-width="10" stroke-linecap="round"/>
            <path d="M100 395q220-55 440 0" fill="none" stroke="#6ea55b" stroke-width="24" stroke-linecap="round"/>
        """,
        "turtle": """
            <ellipse cx="320" cy="260" rx="180" ry="130" fill="#6ca45d"/>
            <path d="M220 180 320 140l100 40 35 90-75 85H260l-75-85z" fill="#8fbd68" stroke="#557f49" stroke-width="12"/>
            <path d="M320 140v215M220 180l160 175M420 180 260 355M185 270h270" stroke="#557f49" stroke-width="8" opacity=".65"/>
            <circle cx="515" cy="260" r="60" fill="#88b875"/><circle cx="535" cy="245" r="8"/>
            <path d="M535 278q15 12 30 0" fill="none" stroke="#466a3d" stroke-width="7" stroke-linecap="round"/>
            <ellipse cx="170" cy="165" rx="42" ry="25" fill="#88b875"/><ellipse cx="170" cy="355" rx="42" ry="25" fill="#88b875"/><ellipse cx="440" cy="165" rx="42" ry="25" fill="#88b875"/><ellipse cx="440" cy="355" rx="42" ry="25" fill="#88b875"/>
        """
    }

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" role="img" aria-label="{item['title']}">
    <rect width="640" height="480" rx="32" fill="#f7f0e6"/>
    <circle cx="85" cy="80" r="38" fill="#ffffff" opacity=".55"/>
    <circle cx="555" cy="395" r="55" fill="#ffffff" opacity=".45"/>
    <g stroke-linejoin="round">{illustrations[item["illustration"]]}</g>
</svg>
"""


def ensure_demo_images():
    os.makedirs(UPLOAD_ITEMS_FOLDER, exist_ok=True)
    created_titles = []

    for item in DEMO_ITEMS:
        image_file = os.path.join(UPLOAD_ITEMS_FOLDER, item["image_filename"])

        if os.path.exists(image_file):
            continue

        with open(image_file, "w", encoding="utf-8") as file:
            file.write(build_demo_svg(item))

        created_titles.append(item["title"])

    return created_titles


def main():
    init_db()
    created_image_titles = ensure_demo_images()

    conn = get_connection()
    cursor = conn.cursor()

    demo_user_id, user_created = ensure_demo_user(cursor)
    inserted_titles = []
    updated_titles = []
    existing_titles = []

    for item in DEMO_ITEMS:
        image_path = f"/uploads/items/{item['image_filename']}"
        cursor.execute(
            "SELECT id, image_path FROM items WHERE user_id = ? AND title = ?",
            (demo_user_id, item["title"])
        )
        existing_items = cursor.fetchall()

        if existing_items:
            existing_titles.append(item["title"])

            for existing_item in existing_items:
                if existing_item["image_path"] == image_path:
                    continue

                cursor.execute(
                    "UPDATE items SET image_path = ? WHERE id = ?",
                    (image_path, existing_item["id"])
                )
                updated_titles.append(item["title"])

            continue

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
    print(f"Erstellte Demo-Bilder: {len(created_image_titles)}")
    print(f"Eingefügte Demo-Inserate: {len(inserted_titles)}")
    print(f"Aktualisierte Demo-Inserate: {len(updated_titles)}")

    if inserted_titles:
        print("Neu eingefügt:")
        for title in inserted_titles:
            print(f"- {title}")

    if updated_titles:
        print("Bildpfad aktualisiert:")
        for title in updated_titles:
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
