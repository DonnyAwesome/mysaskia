# MySaskia

MySaskia ist ein lokaler Tier-Marktplatz und Shop als Lernprojekt für Backend-Entwicklung, REST APIs, SQLite, Login, Datei-Uploads und ein Frontend mit HTML, CSS und JavaScript.

Die Anwendung läuft lokal ohne echte Zahlung. Nutzer können Tier-Inserate entdecken, verwalten, merken und Interesse anmelden.

## Features

- Registrierung und Login mit Session-Token
- Eigenes Profil und Passwortverwaltung
- Öffentlicher Tier-Marktplatz mit Suche und Filtern
- Inserate erstellen
- Bilder für Inserate hochladen
- Eigene Inserate bearbeiten, verkaufen oder löschen
- Übersicht „Meine Inserate“
- Kauf- und Interesse-Anfragen
- Übersichten „Meine Käufe“ und „Meine Verkäufe“
- Favoriten und Merkliste
- Öffentliche Verkäuferprofile mit aktiven Inseraten
- Support-Tickets für Nutzer und Admins
- Admin-Bereich zur Account- und Ticketverwaltung
- Dashboard-Zahlen für Nutzer und Admins
- Lokale Demo-Inserate mit eigenen SVG-Bildern
- Light- und Dark-Theme

## Technik

- **Backend:** Python, Flask, Flask-CORS und Werkzeug
- **Datenbank:** SQLite
- **Frontend:** HTML, CSS und JavaScript
- **Lokaler Webserver:** Apache für das Frontend
- **Versionsverwaltung:** Git und GitHub

## Projektstruktur

```text
mysaskia/
├── backend/
│   ├── app.py                 # Flask-App und Blueprint-Registrierung
│   ├── db.py                  # SQLite-Verbindung und Tabellenanlage
│   ├── auth.py                # Registrierung, Login und Logout
│   ├── profile.py             # Eigenes Profil und Passwortverwaltung
│   ├── items.py               # Inserate, Bilder und Bearbeitung
│   ├── orders.py              # Kauf- und Interesse-Anfragen
│   ├── favorites.py           # Favoriten-API
│   ├── sellers.py             # Öffentliche Verkäuferprofile
│   ├── tickets.py             # Support-Tickets
│   ├── accounts.py            # Admin-Accountverwaltung
│   ├── dashboard.py           # Dashboard-Zahlen
│   ├── seed_demo_items.py     # Demo-Account, Inserate und SVG-Bilder
│   ├── utils.py               # Authentifizierungs-Helfer
│   └── uploads/items/         # Demo-SVGs und lokale Uploads
├── frontend/
│   ├── index.html             # Startseite
│   ├── marketplace.html       # Marktplatz mit Filtern
│   ├── item.html              # Inserat-Detailseite
│   ├── sell.html              # Neues Inserat
│   ├── edit-item.html         # Inserat bearbeiten
│   ├── my-items.html          # Eigene Inserate
│   ├── orders.html            # Meine Käufe
│   ├── sales.html             # Meine Verkäufe
│   ├── favorites.html         # Merkliste
│   ├── seller.html            # Öffentliches Verkäuferprofil
│   ├── dashboard.html         # Nutzer- und Admin-Dashboard
│   ├── profile.html           # Profilverwaltung
│   ├── support.html           # Support-Tickets
│   ├── css/                   # Gemeinsame Stylesheets
│   ├── js/                    # Frontend-Logik
│   └── images/                # Logo und statische Bilder
├── .gitignore
└── README.md
```

Die lokale Datenbank liegt unter `backend/database.db` und wird nicht versioniert.

## Voraussetzungen

- Python 3
- Flask
- Flask-CORS
- Werkzeug
- Apache mit DocumentRoot auf dem Frontend-Verzeichnis
- Moderner Browser

Fehlende Python-Pakete können lokal installiert werden:

```bash
pip install flask flask-cors werkzeug
```

## Lokal starten

### Backend

```bash
cd ~/mysaskia/backend
python3 app.py
```

Das Backend läuft anschließend unter `http://127.0.0.1:5000`. Die REST API verwendet den Prefix `http://127.0.0.1:5000/api`.

Beim Start erstellt `db.py` fehlende SQLite-Tabellen automatisch.

### Frontend

Der Apache DocumentRoot zeigt auf:

```text
~/mysaskia/frontend
```

Das Frontend ist anschließend unter `http://localhost` erreichbar.

## Demo-Daten

Das Seed-Script erzeugt einen Demo-Verkäufer, acht Tier-Inserate und passende lokale SVG-Bilder. Es kann mehrfach ausgeführt werden, ohne doppelte Demo-Inserate anzulegen.

```bash
cd ~/mysaskia/backend
python3 seed_demo_items.py
```

## Demo-Accounts

Diese Accounts sind ausschließlich für das lokale Lernprojekt gedacht:

| Rolle | E-Mail | Passwort |
|---|---|---|
| Admin | `admin@local.test` | `Admin` |
| Demo-Verkäufer | `demo@local.test` | `Demo123` |

## Wichtige URLs

- Startseite: `http://localhost`
- Marktplatz: `http://localhost/marketplace.html`
- Dashboard: `http://localhost/dashboard.html`
- Merkliste: `http://localhost/favorites.html`

## Wichtige API-Bereiche

Basis-URL: `http://127.0.0.1:5000/api`

- `/register`, `/login`, `/logout` – Authentifizierung
- `/profile`, `/change_password` – Profil und Sicherheit
- `/items`, `/my_items` – Marktplatz und Inserate
- `/orders`, `/my_orders`, `/my_sales` – Kauf- und Interesse-Anfragen
- `/favorites`, `/favorites/status` – Merkliste
- `/sellers/<user_id>` – öffentliche Verkäuferprofile
- `/tickets`, `/my_tickets`, `/admin/tickets` – Support
- `/dashboard/summary` – Dashboard-Zahlen
- `/accounts`, `/delete_account` – Accountverwaltung

Geschützte Endpunkte erwarten einen Authorization-Header:

```text
Authorization: Bearer <token>
```

## Tests ausführen

Die Backend-Tests verwenden für jeden Test eine eigene temporäre SQLite-Datenbank. Die lokale `backend/database.db` wird dabei nicht verändert.

```bash
cd ~/mysaskia/backend
python3 -m pip install -r requirements-dev.txt
python3 -m pytest
```

## Git und lokale Daten

Die `.gitignore`-Regeln schließen unter anderem folgende lokale Daten aus:

- `backend/database.db` und andere SQLite-Datenbanken
- Python-Caches wie `__pycache__/` und `*.pyc`
- Umgebungsdateien wie `.env`
- echte Uploads unter `backend/uploads/items/`

Die Demo-SVGs unter `backend/uploads/items/` dürfen versioniert bleiben.

## Git-Workflow

```bash
git status
git add .
git commit -m "Beschreibung"
git push
```

Vor einem Commit sollte geprüft werden, dass keine Datenbank, echten Uploads, Zugangsdaten oder unbeabsichtigten Änderungen vorgemerkt sind.

## Hinweis

MySaskia ist ein lokales Lernprojekt. Es gibt keine echte Zahlungsabwicklung, keine Produktionskonfiguration und keine Garantie für den Einsatz mit echten Nutzerdaten.

## Nächste mögliche Schritte

- Bewertungen für Verkäufer und Inserate
- Bessere Admin-Verwaltung und Moderation
- Testabdeckung für weitere Backend- und Frontend-Funktionen erweitern
- Deployment und produktionsgeeignete Konfiguration
