import sqlite3

DB_NAME = "database.db"

def main():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("SELECT id, username, created_at FROM users")
    users = cursor.fetchall()

    conn.close()

    if not users:
        print("Keine Benutzer gefunden.")
        return

    print("Benutzer in der Datenbank:")
    print("-" * 40)

    for user in users:
        user_id, username, created_at = user
        print(f"ID: {user_id}")
        print(f"Username: {username}")
        print(f"Erstellt am: {created_at}")
        print("-" * 40)

if __name__ == "__main__":
    main()
