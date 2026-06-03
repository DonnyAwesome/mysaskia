const API_BASE_URL = "http://127.0.0.1:5000/api";

function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function requireLogin() {
    const token = getAuthToken();

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

function formatPrice(price) {
    const numberPrice = Number(price);

    if (Number.isNaN(numberPrice)) {
        return `${price} €`;
    }

    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
    }).format(numberPrice);
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function itemImageHtml(item) {
    if (item.image_url) {
        return `<img class="item-card-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}">`;
    }

    return `<div class="item-card-placeholder">🐾</div>`;
}

function itemCardHtml(item, showOwnerActions = false) {
    const statusBadge = item.status
        ? `<span class="item-badge">${escapeHtml(item.status)}</span>`
        : "";

    const ownerActions = showOwnerActions
        ? `
            <div class="item-card-actions">
                ${
                    item.status === "verkauft"
                        ? `<button class="btn secondary" onclick="updateItemStatus(${item.id}, 'aktiv')">Wieder aktiv</button>`
                        : `<button class="btn secondary" onclick="updateItemStatus(${item.id}, 'verkauft')">Als verkauft markieren</button>`
                }
                <button class="btn danger" onclick="deleteItem(${item.id})">Löschen</button>
            </div>
        `
        : "";

    return `
        <article class="item-card">
            ${itemImageHtml(item)}
            <div class="item-card-body">
                <h3>${escapeHtml(item.title)}</h3>

                <p class="item-description">${escapeHtml(item.description)}</p>

                <div class="item-meta">
                    <span class="item-badge">${escapeHtml(item.species || "Tier")}</span>
                    ${item.breed ? `<span class="item-badge">${escapeHtml(item.breed)}</span>` : ""}
                    ${item.age ? `<span class="item-badge">${escapeHtml(item.age)}</span>` : ""}
                    ${item.gender ? `<span class="item-badge">${escapeHtml(item.gender)}</span>` : ""}
                    ${statusBadge}
                </div>

                <div class="item-price">${formatPrice(item.price)}</div>

                ${
                    item.seller_name
                        ? `<div class="item-seller">Verkäufer: ${escapeHtml(item.seller_name)}</div>`
                        : ""
                }

                ${ownerActions}
            </div>
        </article>
    `;
}

async function loadMarketplaceItems() {
    const container = document.getElementById("itemsGrid");

    if (!container) {
        return;
    }

    container.innerHTML = `<div class="empty-state">Tiere werden geladen...</div>`;

    try {
        const response = await fetch(`${API_BASE_URL}/items`);
        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = `<div class="empty-state">Fehler: ${escapeHtml(data.error || data.message || "Tiere konnten nicht geladen werden.")}</div>`;
            return;
        }

        if (!data.items || data.items.length === 0) {
            container.innerHTML = `<div class="empty-state">Noch keine Tiere im Marktplatz.</div>`;
            return;
        }

        container.innerHTML = data.items.map((item) => itemCardHtml(item, false)).join("");
    } catch (error) {
        container.innerHTML = `<div class="empty-state">Server nicht erreichbar. Läuft dein Flask-Backend?</div>`;
    }
}

async function loadMyItems() {
    if (!requireLogin()) {
        return;
    }

    const container = document.getElementById("myItemsGrid");

    if (!container) {
        return;
    }

    container.innerHTML = `<div class="empty-state">Deine Inserate werden geladen...</div>`;

    try {
        const response = await fetch(`${API_BASE_URL}/my_items`, {
            headers: {
                "Authorization": `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = `<div class="empty-state">Fehler: ${escapeHtml(data.error || data.message || "Inserate konnten nicht geladen werden.")}</div>`;
            return;
        }

        if (!data.items || data.items.length === 0) {
            container.innerHTML = `<div class="empty-state">Du hast noch keine Tiere inseriert.</div>`;
            return;
        }

        container.innerHTML = data.items.map((item) => itemCardHtml(item, true)).join("");
    } catch (error) {
        container.innerHTML = `<div class="empty-state">Server nicht erreichbar. Läuft dein Flask-Backend?</div>`;
    }
}

async function updateItemStatus(itemId, status) {
    if (!requireLogin()) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/items/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                item_id: itemId,
                status: status
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || data.message || "Status konnte nicht geändert werden.");
            return;
        }

        loadMyItems();
    } catch (error) {
        alert("Server nicht erreichbar.");
    }
}

async function deleteItem(itemId) {
    if (!requireLogin()) {
        return;
    }

    const confirmed = confirm("Möchtest du dieses Inserat wirklich löschen?");

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/items`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                item_id: itemId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || data.message || "Inserat konnte nicht gelöscht werden.");
            return;
        }

        loadMyItems();
    } catch (error) {
        alert("Server nicht erreichbar.");
    }
}

function setupImagePreview() {
    const imageInput = document.getElementById("image");
    const preview = document.getElementById("imagePreview");

    if (!imageInput || !preview) {
        return;
    }

    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];

        if (!file) {
            preview.style.display = "none";
            preview.src = "";
            return;
        }

        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    });
}

function setupSellForm() {
    if (!requireLogin()) {
        return;
    }

    const form = document.getElementById("sellForm");
    const message = document.getElementById("sellMessage");

    if (!form || !message) {
        return;
    }

    setupImagePreview();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        message.textContent = "Inserat wird erstellt...";
        message.className = "status-message";

        const formData = new FormData(form);

        try {
            const response = await fetch(`${API_BASE_URL}/items`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${getAuthToken()}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                message.textContent = data.error || data.message || "Inserat konnte nicht erstellt werden.";
                message.className = "status-message error";
                return;
            }

            message.textContent = "Inserat wurde erstellt.";
            message.className = "status-message success";

            form.reset();

            const preview = document.getElementById("imagePreview");
            if (preview) {
                preview.style.display = "none";
                preview.src = "";
            }

            setTimeout(() => {
                window.location.href = "my-items.html";
            }, 900);
        } catch (error) {
            message.textContent = "Server nicht erreichbar. Läuft dein Flask-Backend?";
            message.className = "status-message error";
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.page === "marketplace") {
        loadMarketplaceItems();
    }

    if (document.body.dataset.page === "sell") {
        setupSellForm();
    }

    if (document.body.dataset.page === "my-items") {
        loadMyItems();
    }
});
