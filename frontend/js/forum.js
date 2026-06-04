const FORUM_API_BASE_URL = "http://127.0.0.1:5000/api/forum";

function getForumToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function escapeForumHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatForumDate(value) {
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

function forumHeaders(includeJson = false) {
    const headers = {};
    const token = getForumToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

function forumStateHtml(title, text, type = "") {
    return `
        <div class="empty-state ${type}">
            <div class="empty-state-icon">${type === "loading-state" ? "…" : type === "error-state" ? "!" : "📖"}</div>
            <strong>${escapeForumHtml(title)}</strong>
            ${text ? `<p>${escapeForumHtml(text)}</p>` : ""}
        </div>
    `;
}

function forumGroupCardHtml(group) {
    const joinButton = getForumToken() && !group.is_member
        ? `<button class="btn" type="button" onclick="joinForumGroup(${group.id})">Beitreten</button>`
        : "";

    return `
        <article class="forum-group-card">
            <div class="forum-card-topline">
                <span class="item-badge">${escapeForumHtml(group.category)}</span>
                ${group.is_member ? `<span class="forum-member-label">Mitglied</span>` : ""}
            </div>
            <h3>${escapeForumHtml(group.title)}</h3>
            <p>${escapeForumHtml(group.description)}</p>
            <div class="forum-card-meta">
                <span>Von ${escapeForumHtml(group.owner_name)}</span>
                <span>${group.members_count} Mitglieder</span>
                <span>${group.posts_count} Beiträge</span>
            </div>
            <div class="item-card-actions">
                <a class="btn secondary" href="forum-group.html?id=${encodeURIComponent(group.id)}">Gruppe öffnen</a>
                ${joinButton}
            </div>
        </article>
    `;
}

function forumFeedPostHtml(post) {
    return `
        <article class="forum-post-card">
            <div class="forum-post-header">
                <div>
                    <a href="forum-group.html?id=${encodeURIComponent(post.group_id)}">${escapeForumHtml(post.group_title)}</a>
                    <span>von ${escapeForumHtml(post.user_name)}</span>
                </div>
                <time>${escapeForumHtml(formatForumDate(post.created_at))}</time>
            </div>
            <p>${escapeForumHtml(post.content)}</p>
            <a class="forum-post-link" href="forum-group.html?id=${encodeURIComponent(post.group_id)}">Zur Gruppe</a>
        </article>
    `;
}

function renderForumCreateGroup() {
    const container = document.getElementById("forumCreateGroup");

    if (!container) {
        return;
    }

    if (!getForumToken()) {
        container.innerHTML = `
            <div class="empty-state">
                <strong>Melde dich an, um eine Gruppe zu erstellen.</strong>
                <div class="empty-state-actions">
                    <a class="btn" href="login.html">Zum Login</a>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <form id="forumCreateGroupForm" class="forum-form">
            <div class="forum-form-grid">
                <div>
                    <label for="forumGroupTitle">Titel</label>
                    <input id="forumGroupTitle" name="title" maxlength="120" required>
                </div>
                <div>
                    <label for="forumGroupCategory">Kategorie</label>
                    <input id="forumGroupCategory" name="category" maxlength="80" placeholder="z. B. Abenteuer" required>
                </div>
            </div>
            <label for="forumGroupDescription">Beschreibung</label>
            <textarea id="forumGroupDescription" name="description" maxlength="1000" rows="4" required></textarea>
            <button class="btn" type="submit">Gruppe erstellen</button>
            <div id="forumCreateGroupMessage" class="status-message"></div>
        </form>
    `;

    document.getElementById("forumCreateGroupForm").addEventListener("submit", createForumGroup);
}

async function createForumGroup(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById("forumCreateGroupMessage");
    const formData = new FormData(form);

    message.textContent = "Gruppe wird erstellt...";
    message.className = "status-message";

    try {
        const response = await fetch(`${FORUM_API_BASE_URL}/groups`, {
            method: "POST",
            headers: forumHeaders(true),
            body: JSON.stringify({
                title: formData.get("title"),
                description: formData.get("description"),
                category: formData.get("category")
            })
        });
        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.error || "Gruppe konnte nicht erstellt werden.";
            message.className = "status-message error";
            return;
        }

        window.location.href = `forum-group.html?id=${encodeURIComponent(data.group_id)}`;
    } catch (error) {
        message.textContent = "Server nicht erreichbar.";
        message.className = "status-message error";
    }
}

async function loadForumGroups() {
    const container = document.getElementById("forumGroups");

    if (!container) {
        return;
    }

    container.innerHTML = forumStateHtml("Gruppen werden geladen", "Einen Moment bitte.", "loading-state");

    try {
        const response = await fetch(`${FORUM_API_BASE_URL}/groups`, {
            headers: forumHeaders()
        });
        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = forumStateHtml("Gruppen konnten nicht geladen werden", data.error || "Bitte versuche es erneut.", "error-state");
            return;
        }

        container.innerHTML = data.groups.length
            ? data.groups.map(forumGroupCardHtml).join("")
            : forumStateHtml("Noch keine Gruppen", "Erstelle die erste Gruppe für eine neue Tiergeschichte.");
    } catch (error) {
        container.innerHTML = forumStateHtml("Server nicht erreichbar", "Prüfe, ob das Flask-Backend läuft.", "error-state");
    }
}

async function joinForumGroup(groupId) {
    try {
        const response = await fetch(`${FORUM_API_BASE_URL}/groups/${groupId}/join`, {
            method: "POST",
            headers: forumHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || "Beitritt fehlgeschlagen.");
            return;
        }

        loadForumGroups();
    } catch (error) {
        alert("Server nicht erreichbar.");
    }
}

async function loadForumFeed() {
    const container = document.getElementById("forumFeed");

    if (!container) {
        return;
    }

    container.innerHTML = forumStateHtml("Geschichten werden geladen", "Einen Moment bitte.", "loading-state");

    try {
        const response = await fetch(`${FORUM_API_BASE_URL}/feed`);
        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = forumStateHtml("Geschichten konnten nicht geladen werden", data.error || "Bitte versuche es erneut.", "error-state");
            return;
        }

        container.innerHTML = data.posts.length
            ? data.posts.map(forumFeedPostHtml).join("")
            : forumStateHtml("Noch keine Geschichten", "Tritt einer Gruppe bei und beginne die erste Geschichte.");
    } catch (error) {
        container.innerHTML = forumStateHtml("Server nicht erreichbar", "Prüfe, ob das Flask-Backend läuft.", "error-state");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderForumCreateGroup();
    loadForumGroups();
    loadForumFeed();
});
