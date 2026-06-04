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


def test_notifications_are_private_and_unread_count_updates(client):
    seller_token = register_and_login(client, email="seller@example.test")
    buyer_token = register_and_login(client, email="buyer@example.test")
    item_id = create_item(client, seller_token, title="Benachrichtigungs-Test")

    order_response = client.post(
        "/api/orders",
        headers=auth_headers(buyer_token),
        json={"item_id": item_id}
    )
    assert order_response.status_code == 201

    list_response = client.get(
        "/api/notifications",
        headers=auth_headers(seller_token)
    )
    assert list_response.status_code == 200
    assert len(list_response.json["notifications"]) == 1
    notification = list_response.json["notifications"][0]
    assert notification["title"] == "Neue Anfrage für dein Inserat"
    assert notification["is_read"] is False

    unread_response = client.get(
        "/api/notifications/unread-count",
        headers=auth_headers(seller_token)
    )
    assert unread_response.status_code == 200
    assert unread_response.json == {"unread_count": 1}

    foreign_read_response = client.patch(
        f"/api/notifications/{notification['id']}/read",
        headers=auth_headers(buyer_token)
    )
    assert foreign_read_response.status_code == 404

    read_response = client.patch(
        f"/api/notifications/{notification['id']}/read",
        headers=auth_headers(seller_token)
    )
    assert read_response.status_code == 200

    unread_after_read_response = client.get(
        "/api/notifications/unread-count",
        headers=auth_headers(seller_token)
    )
    assert unread_after_read_response.json == {"unread_count": 0}

    confirm_response = client.patch(
        "/api/orders/status",
        headers=auth_headers(seller_token),
        json={
            "order_id": order_response.json["order_id"],
            "status": "bestätigt"
        }
    )
    assert confirm_response.status_code == 200

    buyer_notifications_response = client.get(
        "/api/notifications",
        headers=auth_headers(buyer_token)
    )
    assert buyer_notifications_response.status_code == 200
    assert buyer_notifications_response.json["notifications"][0]["title"] == "Deine Anfrage wurde bestätigt"

    read_all_response = client.patch(
        "/api/notifications/read-all",
        headers=auth_headers(buyer_token)
    )
    assert read_all_response.status_code == 200
    assert read_all_response.json["updated_count"] == 1


def test_forum_group_membership_posts_and_feed(client):
    owner_token = register_and_login(client, email="forum-owner@example.test")
    member_token = register_and_login(client, email="forum-member@example.test")
    owner_character_id = create_item(client, owner_token, title="Luna")
    member_character_id = create_item(client, member_token, title="Mika")

    create_response = client.post(
        "/api/forum/groups",
        headers=auth_headers(owner_token),
        json={
            "title": "Waldpfoten",
            "description": "Gemeinsame Abenteuer im tiefen Wald.",
            "category": "Abenteuer"
        }
    )
    assert create_response.status_code == 201
    group_id = create_response.json["group_id"]

    groups_response = client.get(
        "/api/forum/groups",
        headers=auth_headers(owner_token)
    )
    assert groups_response.status_code == 200
    assert groups_response.json["groups"][0]["title"] == "Waldpfoten"
    assert groups_response.json["groups"][0]["is_member"] is True
    assert groups_response.json["groups"][0]["members_count"] == 1

    public_groups_response = client.get("/api/forum/groups")
    assert public_groups_response.status_code == 200
    assert public_groups_response.json["groups"][0]["is_member"] is False

    non_member_post_response = client.post(
        f"/api/forum/groups/{group_id}/posts",
        headers=auth_headers(member_token),
        json={"content": "Dieser Beitrag darf noch nicht veröffentlicht werden."}
    )
    assert non_member_post_response.status_code == 403

    join_response = client.post(
        f"/api/forum/groups/{group_id}/join",
        headers=auth_headers(member_token)
    )
    assert join_response.status_code == 200

    repeated_join_response = client.post(
        f"/api/forum/groups/{group_id}/join",
        headers=auth_headers(member_token)
    )
    assert repeated_join_response.status_code == 200

    characters_response = client.get(
        "/api/forum/my-characters",
        headers=auth_headers(member_token)
    )
    assert characters_response.status_code == 200
    assert characters_response.json["characters"][0]["id"] == member_character_id
    assert characters_response.json["characters"][0]["title"] == "Mika"

    foreign_character_post_response = client.post(
        f"/api/forum/groups/{group_id}/posts",
        headers=auth_headers(member_token),
        json={
            "content": "Dieser Beitrag darf nicht veröffentlicht werden.",
            "character_item_id": owner_character_id
        }
    )
    assert foreign_character_post_response.status_code == 403

    post_response = client.post(
        f"/api/forum/groups/{group_id}/posts",
        headers=auth_headers(member_token),
        json={
            "content": "Mika folgt einer geheimnisvollen Spur zwischen den Bäumen.",
            "character_item_id": member_character_id
        }
    )
    assert post_response.status_code == 201

    group_response = client.get(
        f"/api/forum/groups/{group_id}",
        headers=auth_headers(member_token)
    )
    assert group_response.status_code == 200
    assert group_response.json["members_count"] == 2
    assert group_response.json["posts_count"] == 1
    assert group_response.json["posts"][0]["content"].startswith("Mika folgt")
    assert group_response.json["posts"][0]["character_item_id"] == member_character_id
    assert group_response.json["posts"][0]["character_name"] == "Mika"
    assert group_response.json["posts"][0]["character_species"] == "Hund"
    assert group_response.json["posts"][0]["user_name"] == "Test User"

    feed_response = client.get("/api/forum/feed")
    assert feed_response.status_code == 200
    assert feed_response.json["posts"][0]["group_title"] == "Waldpfoten"
    assert feed_response.json["posts"][0]["character_name"] == "Mika"
