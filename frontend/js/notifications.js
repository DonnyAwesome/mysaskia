const NOTIFICATIONS_API_BASE_URL = "http://127.0.0.1:5000/api/notifications";

function getNotificationsToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function escapeNotificationHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatNotificationDate(value) {
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

function notificationStateHtml(title, text, type = "") {
    return `
        <div class="empty-state ${type}">
            <div class="empty-state-icon">${type === "loading-state" ? "…" : type === "error-state" ? "!" : "🔔"}</div>
            <strong>${escapeNotificationHtml(title)}</strong>
            ${text ? `<p>${escapeNotificationHtml(text)}</p>` : ""}
        </div>
    `;
}

function notificationHtml(notification) {
    const link = notification.link
        ? `<a class="btn secondary" href="${escapeNotificationHtml(notification.link)}">Öffnen</a>`
        : "";
    const readButton = notification.is_read
        ? ""
        : `<button class="btn" type="button" onclick="markNotificationRead(${notification.id})">Als gelesen markieren</button>`;

    return `
        <article id="notification-${notification.id}" class="notification-card ${notification.is_read ? "" : "unread"}">
            <div class="notification-card-header">
                <h3>${escapeNotificationHtml(notification.title)}</h3>
                ${notification.is_read ? "" : `<span class="item-badge">Neu</span>`}
            </div>
            <p>${escapeNotificationHtml(notification.message)}</p>
            <div class="notification-date">${escapeNotificationHtml(formatNotificationDate(notification.created_at))}</div>
            ${link || readButton ? `<div class="item-card-actions">${link}${readButton}</div>` : ""}
        </article>
    `;
}

async function loadNotifications() {
    const token = getNotificationsToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const container = document.getElementById("notificationsList");

    if (!container) {
        return;
    }

    container.innerHTML = notificationStateHtml("Benachrichtigungen werden geladen", "Einen Moment bitte.", "loading-state");

    try {
        const response = await fetch(NOTIFICATIONS_API_BASE_URL, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = notificationStateHtml("Benachrichtigungen konnten nicht geladen werden", data.error || "Bitte versuche es erneut.", "error-state");
            return;
        }

        if (!data.notifications || data.notifications.length === 0) {
            container.innerHTML = notificationStateHtml("Noch keine Benachrichtigungen", "Wichtige Neuigkeiten erscheinen künftig hier.");
            return;
        }

        container.innerHTML = data.notifications.map(notificationHtml).join("");
    } catch (error) {
        container.innerHTML = notificationStateHtml("Server nicht erreichbar", "Prüfe, ob das Flask-Backend läuft.", "error-state");
    }
}

async function markNotificationRead(notificationId) {
    const token = getNotificationsToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${NOTIFICATIONS_API_BASE_URL}/${notificationId}/read`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || "Benachrichtigung konnte nicht aktualisiert werden.");
            return;
        }

        loadNotifications();
        loadShopUnreadCount();
    } catch (error) {
        alert("Server nicht erreichbar.");
    }
}

async function markAllNotificationsRead() {
    const token = getNotificationsToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${NOTIFICATIONS_API_BASE_URL}/read-all`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || "Benachrichtigungen konnten nicht aktualisiert werden.");
            return;
        }

        loadNotifications();
        loadShopUnreadCount();
    } catch (error) {
        alert("Server nicht erreichbar.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("markAllNotificationsRead")?.addEventListener("click", markAllNotificationsRead);
    loadNotifications();
});
