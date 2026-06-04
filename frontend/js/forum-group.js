const FORUM_GROUP_API_BASE_URL = "http://127.0.0.1:5000/api/forum";

function getForumGroupToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function getForumGroupId() {
    return (new URLSearchParams(window.location.search).get("id") || "").trim();
}

function escapeForumGroupHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatForumGroupDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value.replace(" ", "T") + "Z");

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function forumGroupImageUrl(imagePath) {
    if (!imagePath) {
        return "";
    }

    try {
        return new URL(imagePath, FORUM_GROUP_API_BASE_URL).href;
    } catch (error) {
        return "";
    }
}

function forumGroupHeaders(includeJson = false) {
    const headers = {};
    const token = getForumGroupToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

function forumGroupStateHtml(title, text, type = "") {
    return `
        <div class="empty-state ${type}">
            <div class="empty-state-icon">${type === "loading-state" ? "…" : type === "error-state" ? "!" : "📖"}</div>
            <strong>${escapeForumGroupHtml(title)}</strong>
            ${text ? `<p>${escapeForumGroupHtml(text)}</p>` : ""}
        </div>
    `;
}

function forumGroupDetailsHtml(group) {
    let membershipAction = `<a class="btn" href="login.html">Anmelden und beitreten</a>`;

    if (getForumGroupToken()) {
        if (group.is_owner) {
            membershipAction = `<span class="forum-owner-label">Du leitest diese Gruppe</span>`;
        } else {
            membershipAction = group.is_member
                ? `<button class="btn secondary" type="button" onclick="leaveForumGroup()">Gruppe verlassen</button>`
                : `<button class="btn" type="button" onclick="joinCurrentForumGroup()">Gruppe beitreten</button>`;
        }
    }

    return `
        <span class="item-badge">${escapeForumGroupHtml(group.category)}</span>
        <h1>${escapeForumGroupHtml(group.title)}</h1>
        <p>${escapeForumGroupHtml(group.description)}</p>
        <div class="forum-card-meta">
            <span>Erstellt von ${escapeForumGroupHtml(group.owner_name)}</span>
            <span>${group.members_count} Mitglieder</span>
            <span>${group.posts_count} Beiträge</span>
        </div>
        <div class="marketplace-actions">
            ${membershipAction}
            <a class="btn secondary" href="forum.html">Alle Gruppen</a>
        </div>
    `;
}

function forumGroupPostHtml(post) {
    const author = post.character_name
        ? `
            <div class="forum-character-author">
                <strong>${escapeForumGroupHtml(post.character_name)}</strong>
                ${post.character_species ? `<span>${escapeForumGroupHtml(post.character_species)}</span>` : ""}
                <small>gespielt von ${escapeForumGroupHtml(post.user_name)}</small>
            </div>
        `
        : `<strong>${escapeForumGroupHtml(post.user_name)}</strong>`;
    const imageUrl = forumGroupImageUrl(post.character_image_path);

    return `
        <article class="forum-post-card">
            <div class="forum-post-header">
                <div class="forum-post-author">
                    ${imageUrl ? `<img class="forum-character-avatar" src="${escapeForumGroupHtml(imageUrl)}" alt="" onerror="this.remove()">` : ""}
                    ${author}
                </div>
                <time>${escapeForumGroupHtml(formatForumGroupDate(post.created_at))}</time>
            </div>
            <p>${escapeForumGroupHtml(post.content)}</p>
        </article>
    `;
}

function renderForumPostForm(group) {
    const container = document.getElementById("forumPostForm");

    if (!container) {
        return;
    }

    if (!getForumGroupToken()) {
        container.innerHTML = forumGroupStateHtml("Melde dich an, um mitzuschreiben.", "Nach dem Login kannst du der Gruppe beitreten.");
        return;
    }

    if (!group.is_member) {
        container.innerHTML = forumGroupStateHtml("Tritt der Gruppe bei, um mitzuschreiben.", "Mitglieder können die gemeinsame Geschichte fortsetzen.");
        return;
    }

    container.innerHTML = `
        <form id="forumPostCreateForm" class="forum-form">
            <div class="forum-role-select">
                <label for="forumPostCharacter">Schreiben als</label>
                <select id="forumPostCharacter" name="character_item_id">
                    <option value="">Als ich selbst schreiben</option>
                </select>
            </div>
            <label for="forumPostContent">Dein Beitrag</label>
            <textarea id="forumPostContent" name="content" maxlength="1000" rows="6" placeholder="Schreibe die Geschichte aus Sicht deines Tieres weiter..." required></textarea>
            <button class="btn" type="submit">Beitrag veröffentlichen</button>
            <div id="forumPostMessage" class="status-message"></div>
        </form>
    `;

    document.getElementById("forumPostCreateForm").addEventListener("submit", createForumPost);
    loadForumCharacters();
}

async function loadForumCharacters() {
    const select = document.getElementById("forumPostCharacter");

    if (!select) {
        return;
    }

    try {
        const response = await fetch(`${FORUM_GROUP_API_BASE_URL}/my-characters`, {
            headers: forumGroupHeaders()
        });
        const data = await response.json();

        if (!response.ok) {
            return;
        }

        data.characters.forEach((character) => {
            const option = document.createElement("option");
            option.value = character.id;
            option.textContent = character.species
                ? `${character.title} (${character.species})`
                : character.title;
            select.appendChild(option);
        });
    } catch (error) {
        // Schreiben als User bleibt auch ohne geladene Tierrollen möglich.
    }
}

async function loadForumGroup() {
    const groupId = getForumGroupId();
    const details = document.getElementById("forumGroupDetails");
    const posts = document.getElementById("forumGroupPosts");

    if (!groupId) {
        details.innerHTML = forumGroupStateHtml("Keine Gruppe ausgewählt", "Öffne eine Gruppe über die Tiergeschichten-Seite.", "error-state");
        posts.innerHTML = forumGroupStateHtml("Keine Beiträge verfügbar", "");
        return;
    }

    posts.innerHTML = forumGroupStateHtml("Beiträge werden geladen", "Einen Moment bitte.", "loading-state");

    try {
        const response = await fetch(`${FORUM_GROUP_API_BASE_URL}/groups/${encodeURIComponent(groupId)}`, {
            headers: forumGroupHeaders()
        });
        const data = await response.json();

        if (!response.ok) {
            details.innerHTML = forumGroupStateHtml("Gruppe nicht verfügbar", data.error || "Bitte versuche es erneut.", "error-state");
            posts.innerHTML = forumGroupStateHtml("Keine Beiträge verfügbar", "");
            return;
        }

        details.innerHTML = forumGroupDetailsHtml(data);
        renderForumPostForm(data);
        posts.innerHTML = data.posts.length
            ? data.posts.map(forumGroupPostHtml).join("")
            : forumGroupStateHtml("Noch keine Beiträge", "Beginne die erste Geschichte dieser Gruppe.");
    } catch (error) {
        details.innerHTML = forumGroupStateHtml("Server nicht erreichbar", "Prüfe, ob das Flask-Backend läuft.", "error-state");
        posts.innerHTML = forumGroupStateHtml("Keine Beiträge verfügbar", "");
    }
}

async function changeForumMembership(action) {
    const groupId = getForumGroupId();

    try {
        const response = await fetch(`${FORUM_GROUP_API_BASE_URL}/groups/${encodeURIComponent(groupId)}/${action}`, {
            method: "POST",
            headers: forumGroupHeaders()
        });
        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Mitgliedschaft konnte nicht geändert werden.");
            return;
        }

        loadForumGroup();
    } catch (error) {
        alert("Server nicht erreichbar.");
    }
}

function joinCurrentForumGroup() {
    changeForumMembership("join");
}

function leaveForumGroup() {
    changeForumMembership("leave");
}

async function createForumPost(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById("forumPostMessage");
    const formData = new FormData(form);
    const content = formData.get("content");
    const characterItemId = formData.get("character_item_id");
    const payload = {content};

    if (characterItemId) {
        payload.character_item_id = Number(characterItemId);
    }

    message.textContent = "Beitrag wird veröffentlicht...";
    message.className = "status-message";

    try {
        const response = await fetch(`${FORUM_GROUP_API_BASE_URL}/groups/${encodeURIComponent(getForumGroupId())}/posts`, {
            method: "POST",
            headers: forumGroupHeaders(true),
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.error || "Beitrag konnte nicht veröffentlicht werden.";
            message.className = "status-message error";
            return;
        }

        form.reset();
        loadForumGroup();
    } catch (error) {
        message.textContent = "Server nicht erreichbar.";
        message.className = "status-message error";
    }
}

document.addEventListener("DOMContentLoaded", loadForumGroup);
