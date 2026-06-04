def register_and_login(client, email="testuser@example.test"):
    register_response = client.post("/api/register", json={
        "first_name": "Test",
        "last_name": "User",
        "email": email,
        "password": "TestPass123"
    })
    assert register_response.status_code == 201

    login_response = client.post("/api/login", json={
        "email": email,
        "password": "TestPass123"
    })
    assert login_response.status_code == 200
    assert login_response.json["token"]

    return login_response.json["token"]


def auth_headers(token):
    return {
        "Authorization": f"Bearer {token}"
    }


def create_item(client, token, title="Test-Inserat"):
    response = client.post(
        "/api/items",
        headers=auth_headers(token),
        data={
            "title": title,
            "description": "Ein Inserat aus einem automatisierten Test.",
            "item_type": "animal",
            "species": "Hund",
            "breed": "Mischling",
            "age": "2 Jahre",
            "gender": "unbekannt",
            "price": "125.50"
        }
    )
    assert response.status_code == 201

    return response.json["item_id"]


def test_app_import_and_public_items_endpoint(app, client):
    assert app.testing is True

    response = client.get("/api/items")

    assert response.status_code == 200
    assert response.json == {"items": []}


def test_registration_and_login_returns_token(client):
    token = register_and_login(client)

    assert isinstance(token, str)
    assert token


def test_protected_route_requires_token(client):
    response = client.get("/api/favorites")

    assert response.status_code == 401
    assert response.json["error"] == "Nicht eingeloggt"


def test_logged_in_user_can_create_active_item(client):
    token = register_and_login(client)
    item_id = create_item(client, token)

    response = client.get("/api/items")

    assert response.status_code == 200
    assert len(response.json["items"]) == 1
    assert response.json["items"][0]["id"] == item_id
    assert response.json["items"][0]["status"] == "aktiv"


def test_logged_in_user_can_add_favorite(client):
    token = register_and_login(client)
    item_id = create_item(client, token, title="Favoriten-Test")

    create_response = client.post(
        "/api/favorites",
        headers=auth_headers(token),
        json={"item_id": item_id}
    )
    assert create_response.status_code == 201
    assert create_response.json["is_favorite"] is True

    list_response = client.get(
        "/api/favorites",
        headers=auth_headers(token)
    )

    assert list_response.status_code == 200
    assert len(list_response.json["items"]) == 1
    assert list_response.json["items"][0]["id"] == item_id


def test_normal_user_cannot_access_admin_items(client):
    token = register_and_login(client)

    response = client.get(
        "/api/admin/items",
        headers=auth_headers(token)
    )

    assert response.status_code == 403
    assert response.json["error"] == "Keine Admin-Rechte"


def test_password_reset_changes_password_and_invalidates_sessions(client):
    old_token = register_and_login(client, email="reset@example.test")

    request_response = client.post("/api/password-reset/request", json={
        "email": "reset@example.test"
    })

    assert request_response.status_code == 200
    assert request_response.json["reset_token"]

    reset_token = request_response.json["reset_token"]
    confirm_response = client.post("/api/password-reset/confirm", json={
        "token": reset_token,
        "new_password": "NeuesPasswort123"
    })

    assert confirm_response.status_code == 200

    old_session_response = client.get(
        "/api/favorites",
        headers=auth_headers(old_token)
    )
    assert old_session_response.status_code == 401

    old_login_response = client.post("/api/login", json={
        "email": "reset@example.test",
        "password": "TestPass123"
    })
    assert old_login_response.status_code == 401

    new_login_response = client.post("/api/login", json={
        "email": "reset@example.test",
        "password": "NeuesPasswort123"
    })
    assert new_login_response.status_code == 200

    reused_response = client.post("/api/password-reset/confirm", json={
        "token": reset_token,
        "new_password": "NochEinPasswort123"
    })
    assert reused_response.status_code == 400


def test_password_reset_request_for_unknown_email_is_neutral(client):
    response = client.post("/api/password-reset/request", json={
        "email": "unbekannt@example.test"
    })

    assert response.status_code == 200
    assert response.json["message"] == "Wenn die E-Mail existiert, wurde ein Reset vorbereitet."
    assert "reset_token" not in response.json
