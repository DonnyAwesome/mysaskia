# MySaskia

MySaskia ist ein lokales Lernprojekt und ein einfacher Tier-Marktplatz. Das Projekt besteht aus einem statischen Frontend, das ueber Apache unter `http://localhost` ausgeliefert wird, und einem Flask-Backend unter `http://127.0.0.1:5000/api`.

Die Anwendung bietet Benutzerkonten, Profile, Support-Tickets und Tier-Inserate mit Bild-Upload. Der Marktplatz kann im Frontend durchsucht werden und nutzt eine professionelle Shop-Navigation.

## Projektstruktur

```text
mysaskia/
├── backend/
│   ├── app.py              # Flask-App, Blueprint-Registrierung, Upload-Auslieferung
│   ├── auth.py             # Registrierung, Login, Logout
│   ├── accounts.py         # Account-Verwaltung
│   ├── profile.py          # Profil anzeigen/aendern, Passwort aendern
│   ├── tickets.py          # Support-Tickets fuer User und Admins
│   ├── items.py            # Marktplatz-API fuer Tier-Inserate
│   ├── db.py               # SQLite-Verbindung und Tabellenanlage
│   ├── utils.py            # Auth- und Rollen-Helfer
│   ├── show_users.py       # lokales Hilfsskript
│   └── uploads/items/      # hochgeladene Inseratsbilder
├── frontend/
│   ├── index.html          # Startseite
│   ├── marketplace.html    # Marktplatz
│   ├── sell.html           # Inserat erstellen
│   ├── my-items.html       # eigene Inserate verwalten
│   ├── dashboard.html      # Benutzer-Dashboard
│   ├── login.html          # Login/Registrierung
│   ├── profile.html        # Profilverwaltung
│   ├── support.html        # Support-Tickets
│   ├── about.html          # Projektinformationen
│   ├── contact.html        # Kontaktseite
│   ├── css/                # Stylesheets
│   ├── js/                 # Frontend-Logik
│   └── images/             # Bilder und Logo
└── README.md
```

Die SQLite-Datenbank liegt lokal unter `backend/database.db`. Sie ist nicht fuer Git gedacht und wird durch `.gitignore` ausgeschlossen.

## Voraussetzungen

- Python 3
- Flask
- Flask-CORS
- Werkzeug
- Apache oder ein anderer lokaler Webserver fuer das Frontend
- Ein moderner Browser

Falls die Python-Abhaengigkeiten noch fehlen, koennen sie lokal installiert werden:

```bash
pip install flask flask-cors werkzeug
```

## Backend starten

```bash
cd backend
python app.py
```

Das Backend laeuft danach standardmaessig unter:

```text
http://127.0.0.1:5000
```

Die API ist unter diesem Prefix erreichbar:

```text
http://127.0.0.1:5000/api
```

Beim Start initialisiert `backend/db.py` die benoetigten SQLite-Tabellen, falls sie noch nicht existieren.

## Frontend oeffnen

Das Frontend liegt in `frontend/` und wird lokal ueber Apache unter folgender Adresse geoeffnet:

```text
http://localhost
```

Wichtige Seiten:

- `http://localhost/index.html`
- `http://localhost/marketplace.html`
- `http://localhost/sell.html`
- `http://localhost/my-items.html`
- `http://localhost/dashboard.html`
- `http://localhost/profile.html`
- `http://localhost/support.html`

## Standard-Admin-Account

Beim Initialisieren der Datenbank wird ein lokaler Admin-Account angelegt, falls er noch nicht existiert:

```text
E-Mail: admin@local.test
Passwort: Admin
```

Dieser Account ist fuer die lokale Entwicklung gedacht. In einer echten Umgebung muss das Passwort geaendert und das Seed-Verhalten angepasst werden.

## Wichtige API-Endpunkte

Basis-URL:

```text
http://127.0.0.1:5000/api
```

Auth:

- `POST /api/register` - neuen Account erstellen
- `POST /api/login` - einloggen und Session-Token erhalten
- `POST /api/logout` - ausloggen

Profile:

- `GET /api/profile` - eigenes Profil laden
- `PATCH /api/profile` - Vorname und Nachname aendern
- `PATCH /api/change_password` - Passwort aendern

Accounts:

- `GET /api/accounts` - Accounts laden
- `DELETE /api/delete_account` - Account loeschen

Support:

- `POST /api/tickets` - Support-Ticket erstellen
- `GET /api/my_tickets` - eigene Tickets laden
- `GET /api/admin/tickets` - alle Tickets fuer Admins laden
- `PATCH /api/admin/tickets/status` - Ticket-Status aendern

Marktplatz:

- `GET /api/items` - aktive Tier-Inserate laden
- `GET /api/my_items` - eigene Inserate laden
- `POST /api/items` - neues Inserat mit optionalem Bild erstellen
- `PATCH /api/items/status` - Inserat als aktiv oder verkauft markieren
- `DELETE /api/items` - Inserat loeschen
- `GET /uploads/items/<filename>` - hochgeladenes Inseratsbild laden

Geschuetzte Endpunkte erwarten einen Authorization-Header:

```text
Authorization: Bearer <token>
```

## Aktuelle Features

- Registrierung und Login mit Session-Token
- Benutzer-Dashboard
- Profil anzeigen und bearbeiten
- Passwort aendern
- Support-Tickets fuer eingeloggte Nutzer
- Admin-Ansicht fuer Tickets
- Account-Verwaltung
- Tier-Inserate erstellen
- Bild-Upload fuer Inserate
- Eigene Inserate anzeigen, loeschen und als verkauft markieren
- Oeffentlicher Marktplatz fuer aktive Inserate
- Frontend-Suche ueber `marketplace.html?q=Suchbegriff`
- Suche ueber Titel, Beschreibung, Tierart, Rasse, Alter, Geschlecht, Preis und Verkaeufername
- Professionelle Shop-Navigation mit Suche, Konto, Inseraten und Verkauf
- Light-/Dark-Theme-Unterstuetzung ueber CSS-Variablen

## Git-Workflow

Empfohlener Ablauf fuer Aenderungen:

```bash
git status
git diff
git add <dateien>
git commit -m "Kurze Beschreibung der Aenderung"
git status
```

Vor einem Commit sollte geprueft werden:

- Sind nur die beabsichtigten Dateien geaendert?
- Funktioniert das Backend noch?
- Laden die betroffenen Frontend-Seiten ohne Browser-Fehler?
- Sind keine lokalen Datenbank- oder Upload-Dateien versehentlich fuer Git vorgemerkt?

Die Datei `backend/database.db` und lokale Upload-/Cache-Dateien sollten nicht committed werden.

## Sinnvolle naechste Features

- Backend-Suche und Filter fuer den Marktplatz
- Detailseite fuer einzelne Tier-Inserate
- Bearbeiten bestehender Inserate
- Admin-Moderation fuer Inserate
- Kontaktfunktion zwischen Kaeufer und Verkaeufer
- Favoriten oder Merkliste
- Pagination fuer viele Inserate
- Validierung und Groessenlimit fuer Bild-Uploads
- Zentrale Frontend-Konfiguration fuer die API-URL
- `requirements.txt` fuer reproduzierbare Python-Abhaengigkeiten
- Automatisierte Tests fuer Backend-Endpunkte
- Verbesserte Fehler- und Ladezustaende im Frontend
