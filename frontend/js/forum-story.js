const FORUM_STORY_API_BASE_URL = "http://127.0.0.1:5000/api/forum";

function getForumStoryToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function getForumStoryId() {
    return (new URLSearchParams(window.location.search).get("id") || "").trim();
}

function escapeForumStoryHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatForumStoryDate(value) {
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

function forumStoryHeaders(includeJson = false) {
    const headers = {};
    const token = getForumStoryToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

function forumStoryStateHtml(title, text, type = "") {
    return `
        <div class="empty-state ${type}">
            <div class="empty-state-icon">${type === "loading-state" ? "…" : type === "error-state" ? "!" : "📖"}</div>
            <strong>${escapeForumStoryHtml(title)}</strong>
            ${text ? `<p>${escapeForumStoryHtml(text)}</p>` : ""}
        </div>
    `;
}

function forumStoryImageUrl(imagePath) {
    if (!imagePath) {
        return "";
    }

    try {
        return new URL(imagePath, FORUM_STORY_API_BASE_URL).href;
    } catch (error) {
        return "";
    }
}

function forumStoryDetailsHtml(story) {
    const canManage = story.is_owner || story.is_group_owner;
    const nextStatus = story.status === "aktiv" ? "abgeschlossen" : "aktiv";
    const actionLabel = story.status === "aktiv" ? "Geschichte abschließen" : "Wieder öffnen";

    return `
        <a href="forum-group.html?id=${encodeURIComponent(story.group_id)}">← ${escapeForumStoryHtml(story.group_title)}</a>
        <h1>${escapeForumStoryHtml(story.title)}</h1>
        ${story.description ? `<p>${escapeForumStoryHtml(story.description)}</p>` : ""}
        <div class="forum-card-meta">
            <span>Status: ${escapeForumStoryHtml(story.status)}</span>
            <span>Gestartet von ${escapeForumStoryHtml(story.owner_name)}</span>
            <span>${escapeForumStoryHtml(formatForumStoryDate(story.created_at))}</span>
        </div>
        ${canManage ? `<button class="btn secondary" type="button" onclick="changeForumStoryStatus('${nextStatus}')">${actionLabel}</button>` : ""}
    `;
}

function forumStoryPostHtml(post) {
    const author = post.character_name
        ? `
            <div class="forum-character-author">
                <strong>${escapeForumStoryHtml(post.character_name)}</strong>
                ${post.character_species ? `<span>${escapeForumStoryHtml(post.character_species)}</span>` : ""}
                <small>gespielt von ${escapeForumStoryHtml(post.user_name)}</small>
            </div>
        `
        : `<strong>${escapeForumStoryHtml(post.user_name)}</strong>`;
    const imageUrl = forumStoryImageUrl(post.character_image_path);

    return `
        <article class="forum-post-card">
            <div class="forum-post-header">
                <div class="forum-post-author">
                    ${imageUrl ? `<img class="forum-character-avatar" src="${escapeForumStoryHtml(imageUrl)}" alt="" onerror="this.remove()">` : ""}
                    ${author}
                </div>
                <time>${escapeForumStoryHtml(formatForumStoryDate(post.created_at))}</time>
            </div>
            <p>${escapeForumStoryHtml(post.content)}</p>
        </article>
    `;
}

function renderForumStoryPostForm(story) {
    const container = document.getElementById("forumStoryPostForm");

    if (story.status !== "aktiv") {
        container.innerHTML = forumStoryStateHtml("Diese Geschichte ist abgeschlossen.", "Es können keine neuen Beiträge geschrieben werden.");
        return;
    }
    if (!getForumStoryToken()) {
        container.innerHTML = forumStoryStateHtml("Melde dich an, um mitzuschreiben.", "");
        return;
    }
    if (!story.is_group_member) {
        container.innerHTML = forumStoryStateHtml("Tritt der Gruppe bei, um mitzuschreiben.", "");
        return;
    }

    container.innerHTML = `
        <form id="forumStoryPostCreateForm" class="forum-form">
            <div class="forum-role-select">
                <label for="forumStoryCharacter">Schreiben als</label>
                <select id="forumStoryCharacter" name="character_item_id">
                    <option value="">Als ich selbst schreiben</option>
                </select>
            </div>
            <label for="forumStoryContent">Dein Beitrag</label>
            <textarea id="forumStoryContent" name="content" maxlength="1000" rows="7" required></textarea>
            <button class="btn" type="submit">Beitrag veröffentlichen</button>
            <div id="forumStoryPostMessage" class="status-message"></div>
        </form>
    `;

    document.getElementById("forumStoryPostCreateForm").addEventListener("submit", createForumStoryPost);
    loadForumStoryCharacters();
}

async function loadForumStoryCharacters() {
    const select = document.getElementById("forumStoryCharacter");
    if (!select) {
        return;
    }

    try {
        const response = await fetch(`${FORUM_STORY_API_BASE_URL}/my-characters`, {
            headers: forumStoryHeaders()
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
        // Schreiben als User bleibt weiterhin möglich.
    }
}

async function loadForumStory() {
    const storyId = getForumStoryId();
    const details = document.getElementById("forumStoryDetails");
    const posts = document.getElementById("forumStoryPosts");

    if (!storyId) {
        details.innerHTML = forumStoryStateHtml("Keine Geschichte ausgewählt", "", "error-state");
        return;
    }

    posts.innerHTML = forumStoryStateHtml("Beiträge werden geladen", "Einen Moment bitte.", "loading-state");

    try {
        const response = await fetch(`${FORUM_STORY_API_BASE_URL}/stories/${encodeURIComponent(storyId)}`, {
            headers: forumStoryHeaders()
        });
        const data = await response.json();

        if (!response.ok) {
            details.innerHTML = forumStoryStateHtml("Geschichte nicht verfügbar", data.error || "", "error-state");
            posts.innerHTML = "";
            return;
        }

        details.innerHTML = forumStoryDetailsHtml(data);
        renderForumStoryPostForm(data);
        posts.innerHTML = data.posts.length
            ? data.posts.map(forumStoryPostHtml).join("")
            : forumStoryStateHtml("Noch keine Beiträge", "Beginne diese Geschichte.");
    } catch (error) {
        details.innerHTML = forumStoryStateHtml("Server nicht erreichbar", "", "error-state");
        posts.innerHTML = "";
    }
}

async function createForumStoryPost(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById("forumStoryPostMessage");
    const formData = new FormData(form);
    const payload = {content: formData.get("content")};
    const characterItemId = formData.get("character_item_id");

    if (characterItemId) {
        payload.character_item_id = Number(characterItemId);
    }

    message.textContent = "Beitrag wird veröffentlicht...";
    message.className = "status-message";

    try {
        const response = await fetch(`${FORUM_STORY_API_BASE_URL}/stories/${encodeURIComponent(getForumStoryId())}/posts`, {
            method: "POST",
            headers: forumStoryHeaders(true),
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.error || "Beitrag konnte nicht veröffentlicht werden.";
            message.className = "status-message error";
            return;
        }

        form.reset();
        loadForumStory();
    } catch (error) {
        message.textContent = "Server nicht erreichbar.";
        message.className = "status-message error";
    }
}

async function changeForumStoryStatus(status) {
    try {
        const response = await fetch(`${FORUM_STORY_API_BASE_URL}/stories/${encodeURIComponent(getForumStoryId())}/status`, {
            method: "PATCH",
            headers: forumStoryHeaders(true),
            body: JSON.stringify({status})
        });
        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Status konnte nicht geändert werden.");
            return;
        }

        loadForumStory();
    } catch (error) {
        alert("Server nicht erreichbar.");
    }
}

document.addEventListener("DOMContentLoaded", loadForumStory);
