const ADMIN_API_BASE_URL = "http://127.0.0.1:5000/api";

function getAdminToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function escapeAdminHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatAdminPrice(price) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
    }).format(Number(price) || 0);
}

function formatAdminDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value || "";
    }

    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function adminStateHtml(title, text, type = "") {
    return `
        <div class="empty-state ${type}">
            <div class="empty-state-icon">${type === "loading-state" ? "…" : type === "error-state" ? "!" : "🛡️"}</div>
            <strong>${escapeAdminHtml(title)}</strong>
            ${text ? `<p>${escapeAdminHtml(text)}</p>` : ""}
        </div>
    `;
}

async function adminFetch(path, options = {}) {
    const token = getAdminToken();

    options.headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, options);
    const data = await response.json();

    return { response, data };
}

function adminItemHtml(item) {
    return `
        <article class="item-card">
            <div class="item-card-body">
                <h3>${escapeAdminHtml(item.title)}</h3>
                <div class="item-meta">
                    <span class="item-badge">${escapeAdminHtml(item.species || "Tier")}</span>
                    <span class="item-badge">${escapeAdminHtml(item.status)}</span>
                </div>
                <div class="item-price">${formatAdminPrice(item.price)}</div>
                <div class="item-seller">Verkäufer: ${escapeAdminHtml(item.seller_name)}</div>
                <div class="item-seller">Erstellt: ${escapeAdminHtml(formatAdminDate(item.created_at))}</div>

                <div class="admin-status-row">
                    <select id="adminItemStatus-${item.id}">
                        <option value="aktiv" ${item.status === "aktiv" ? "selected" : ""}>aktiv</option>
                        <option value="verkauft" ${item.status === "verkauft" ? "selected" : ""}>verkauft</option>
                        <option value="verborgen" ${item.status === "verborgen" ? "selected" : ""}>verborgen</option>
                    </select>
                    <button class="btn" type="button" onclick="updateAdminItemStatus(${item.id})">Status speichern</button>
                    <a class="btn secondary" href="item.html?id=${encodeURIComponent(item.id)}">Details</a>
                </div>
                <div id="adminItemMessage-${item.id}" class="status-message"></div>
            </div>
        </article>
    `;
}

function adminReviewHtml(review) {
    return `
        <article id="adminReview-${review.id}" class="review-card">
            <div class="review-card-header">
                <strong>${escapeAdminHtml(review.reviewer_name)} bewertet ${escapeAdminHtml(review.seller_name)}</strong>
                <span class="item-badge">${review.rating} / 5 Sterne</span>
            </div>
            ${review.comment ? `<p>${escapeAdminHtml(review.comment)}</p>` : ""}
            <div class="item-seller">${escapeAdminHtml(formatAdminDate(review.created_at))}</div>
            <div class="item-card-actions">
                <button class="btn danger" type="button" onclick="deleteAdminReview(${review.id})">Löschen</button>
            </div>
        </article>
    `;
}

async function loadAdminItems() {
    const container = document.getElementById("adminItemsGrid");

    if (!container) {
        return;
    }

    container.innerHTML = adminStateHtml("Inserate werden geladen", "Alle Inserate werden abgerufen.", "loading-state");

    try {
        const { response, data } = await adminFetch("/admin/items");

        if (!response.ok) {
            container.innerHTML = adminStateHtml("Inserate konnten nicht geladen werden", data.error || "Bitte versuche es erneut.", "error-state");
            return;
        }

        container.innerHTML = data.items.length
            ? data.items.map(adminItemHtml).join("")
            : adminStateHtml("Keine Inserate vorhanden", "Aktuell gibt es nichts zu moderieren.");
    } catch (error) {
        container.innerHTML = adminStateHtml("Server nicht erreichbar", "Prüfe, ob das Flask-Backend läuft.", "error-state");
    }
}

async function loadAdminReviews() {
    const container = document.getElementById("adminReviewsList");

    if (!container) {
        return;
    }

    container.innerHTML = adminStateHtml("Bewertungen werden geladen", "Alle Verkäuferbewertungen werden abgerufen.", "loading-state");

    try {
        const { response, data } = await adminFetch("/admin/reviews");

        if (!response.ok) {
            container.innerHTML = adminStateHtml("Bewertungen konnten nicht geladen werden", data.error || "Bitte versuche es erneut.", "error-state");
            return;
        }

        container.innerHTML = data.reviews.length
            ? data.reviews.map(adminReviewHtml).join("")
            : adminStateHtml("Keine Bewertungen vorhanden", "Aktuell gibt es nichts zu moderieren.");
    } catch (error) {
        container.innerHTML = adminStateHtml("Server nicht erreichbar", "Prüfe, ob das Flask-Backend läuft.", "error-state");
    }
}

async function updateAdminItemStatus(itemId) {
    const select = document.getElementById(`adminItemStatus-${itemId}`);
    const message = document.getElementById(`adminItemMessage-${itemId}`);

    if (!select) {
        return;
    }

    try {
        const { response, data } = await adminFetch(`/admin/items/${itemId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: select.value
            })
        });

        if (message) {
            message.textContent = data.error || data.message || "";
            message.className = `status-message ${response.ok ? "success" : "error"}`;
        }

        if (response.ok) {
            loadAdminItems();
        }
    } catch (error) {
        if (message) {
            message.textContent = "Server nicht erreichbar.";
            message.className = "status-message error";
        }
    }
}

async function deleteAdminReview(reviewId) {
    if (!confirm("Möchtest du diese Bewertung wirklich löschen?")) {
        return;
    }

    try {
        const { response, data } = await adminFetch(`/admin/reviews/${reviewId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            alert(data.error || "Bewertung konnte nicht gelöscht werden.");
            return;
        }

        const review = document.getElementById(`adminReview-${reviewId}`);

        if (review) {
            review.remove();
        }

        const container = document.getElementById("adminReviewsList");

        if (container && !container.querySelector(".review-card")) {
            container.innerHTML = adminStateHtml("Keine Bewertungen vorhanden", "Aktuell gibt es nichts zu moderieren.");
        }
    } catch (error) {
        alert("Server nicht erreichbar.");
    }
}

async function setupAdminPage() {
    const token = getAdminToken();
    const message = document.getElementById("adminMessage");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/profile`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const user = await response.json();

        if (!response.ok || !(user.is_admin === true || user.is_admin === 1)) {
            if (message) {
                message.innerHTML = adminStateHtml(
                    "Keine Admin-Rechte",
                    "Diese Seite ist nur für Administratoren verfügbar.",
                    "error-state"
                );
                message.className = "status-message";
            }
            document.getElementById("adminItemsSection").style.display = "none";
            document.getElementById("adminReviewsSection").style.display = "none";
            return;
        }

        await Promise.all([
            loadAdminItems(),
            loadAdminReviews()
        ]);
    } catch (error) {
        if (message) {
            message.innerHTML = adminStateHtml(
                "Server nicht erreichbar",
                "Prüfe, ob das Flask-Backend läuft.",
                "error-state"
            );
            message.className = "status-message";
        }
    }
}

document.addEventListener("DOMContentLoaded", setupAdminPage);
