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

let marketplaceItems = [];

function marketplaceFiltersHtml() {
    return `
        <form id="marketplaceFilters" class="marketplace-filters">
            <div class="marketplace-filter-fields">
                <div class="marketplace-filter-field marketplace-filter-search">
                    <label for="filterQuery">Suche</label>
                    <input id="filterQuery" name="q" type="search" placeholder="Titel, Rasse, Beschreibung...">
                </div>

                <div class="marketplace-filter-field">
                    <label for="filterSpecies">Tierart/Kategorie</label>
                    <select id="filterSpecies" name="species">
                        <option value="">Alle</option>
                        <option value="Hund">Hund</option>
                        <option value="Katze">Katze</option>
                        <option value="Kaninchen">Kaninchen</option>
                        <option value="Vogel">Vogel</option>
                        <option value="Hamster">Hamster</option>
                        <option value="Meerschweinchen">Meerschweinchen</option>
                        <option value="Schildkröte">Schildkröte</option>
                    </select>
                </div>

                <div class="marketplace-filter-field">
                    <label for="filterMaxPrice">Preis bis</label>
                    <input id="filterMaxPrice" name="maxPrice" type="number" min="0" step="0.01" placeholder="500">
                </div>
            </div>

            <div class="marketplace-filter-actions">
                <button class="btn" type="submit">Filter anwenden</button>
                <button id="resetMarketplaceFilters" class="btn secondary" type="button">Zurücksetzen</button>
            </div>
        </form>
    `;
}

function ensureMarketplaceFilters() {
    if (document.getElementById("marketplaceFilters")) {
        return;
    }

    const itemsGrid = document.getElementById("itemsGrid");

    if (itemsGrid) {
        itemsGrid.insertAdjacentHTML("beforebegin", marketplaceFiltersHtml());
    }
}

function getMarketplaceFilters() {
    const params = new URLSearchParams(window.location.search);

    return {
        q: (params.get("q") || "").trim(),
        species: (params.get("species") || "").trim(),
        maxPrice: (params.get("maxPrice") || "").trim()
    };
}

function itemMatchesFilters(item, filters) {
    const normalizedQuery = filters.q.toLowerCase();
    const searchableFields = [
        item.title,
        item.description,
        item.species,
        item.breed,
        item.age,
        item.gender,
        item.price,
        item.seller_name
    ];

    const matchesSearch = !normalizedQuery || searchableFields.some((field) => {
        return String(field || "").toLowerCase().includes(normalizedQuery);
    });
    const matchesSpecies = !filters.species ||
        String(item.species || "").toLowerCase() === filters.species.toLowerCase();
    const maxPrice = Number(filters.maxPrice);
    const matchesPrice = !filters.maxPrice ||
        (!Number.isNaN(maxPrice) && Number(item.price) <= maxPrice);

    return matchesSearch && matchesSpecies && matchesPrice;
}

function marketplaceFilterInfoHtml(filters, resultCount) {
    if (!filters.q && !filters.species && !filters.maxPrice) {
        return "";
    }

    return `
        <div class="search-results-info">
            <span>${resultCount} passende Inserate gefunden</span>
            <a class="btn secondary" href="marketplace.html">Filter zurücksetzen</a>
        </div>
    `;
}

function fillMarketplaceFilterFields(filters) {
    const queryInput = document.getElementById("filterQuery");
    const speciesSelect = document.getElementById("filterSpecies");
    const maxPriceInput = document.getElementById("filterMaxPrice");

    if (queryInput) {
        queryInput.value = filters.q;
    }

    if (speciesSelect) {
        speciesSelect.value = filters.species;
    }

    if (maxPriceInput) {
        maxPriceInput.value = filters.maxPrice;
    }
}

function renderMarketplaceItems() {
    const container = document.getElementById("itemsGrid");

    if (!container) {
        return;
    }

    const filters = getMarketplaceFilters();
    const visibleItems = marketplaceItems.filter((item) => itemMatchesFilters(item, filters));
    const filterInfoHtml = marketplaceFilterInfoHtml(filters, visibleItems.length);

    if (visibleItems.length === 0) {
        container.innerHTML = `${filterInfoHtml}<div class="empty-state">Keine Tiere für diese Filter gefunden.</div>`;
        return;
    }

    container.innerHTML = `${filterInfoHtml}${visibleItems.map((item) => itemCardHtml(item, false)).join("")}`;
}

function setupMarketplaceFilters() {
    const form = document.getElementById("marketplaceFilters");
    const resetButton = document.getElementById("resetMarketplaceFilters");

    if (!form || !resetButton) {
        return;
    }

    fillMarketplaceFilterFields(getMarketplaceFilters());

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const params = new URLSearchParams();

        for (const name of ["q", "species", "maxPrice"]) {
            const value = String(formData.get(name) || "").trim();

            if (value) {
                params.set(name, value);
            }
        }

        const queryString = params.toString();
        const url = queryString ? `marketplace.html?${queryString}` : "marketplace.html";

        window.history.pushState({}, "", url);
        renderMarketplaceItems();
    });

    resetButton.addEventListener("click", () => {
        form.reset();
        window.history.pushState({}, "", "marketplace.html");
        renderMarketplaceItems();
    });

    window.addEventListener("popstate", () => {
        fillMarketplaceFilterFields(getMarketplaceFilters());
        renderMarketplaceItems();
    });
}

function itemImageHtml(item) {
    if (item.image_url) {
        return `<img class="item-card-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}">`;
    }

    return `<div class="item-card-placeholder">🐾</div>`;
}

function itemDetailUrl(item) {
    return `item.html?id=${encodeURIComponent(item.id)}`;
}

function itemCardHtml(item, showOwnerActions = false) {
    const statusBadge = item.status
        ? `<span class="item-badge">${escapeHtml(item.status)}</span>`
        : "";

    const ownerActions = showOwnerActions
        ? `
            <div class="item-card-actions">
                <a class="btn" href="edit-item.html?id=${encodeURIComponent(item.id)}">Bearbeiten</a>
                ${
                    item.status === "verkauft"
                        ? `<button class="btn secondary" onclick="updateItemStatus(${item.id}, 'aktiv')">Wieder aktiv</button>`
                        : `<button class="btn secondary" onclick="updateItemStatus(${item.id}, 'verkauft')">Als verkauft markieren</button>`
                }
                <button class="btn danger" onclick="deleteItem(${item.id})">Löschen</button>
            </div>
        `
        : "";

    const cardContent = `
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
    `;

    if (!showOwnerActions) {
        return `
            <a class="item-card item-card-link" href="${escapeHtml(itemDetailUrl(item))}">
                ${cardContent}
            </a>
        `;
    }

    return `
        <article class="item-card">
            ${cardContent}
        </article>
    `;
}

function getItemDetailId() {
    const params = new URLSearchParams(window.location.search);

    return (params.get("id") || "").trim();
}

function itemDetailImageHtml(item) {
    if (item.image_url) {
        return `<img class="item-detail-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}">`;
    }

    return `<div class="item-detail-placeholder">🐾</div>`;
}

function formatDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function detailRowHtml(label, value) {
    if (!value && value !== 0) {
        return "";
    }

    return `
        <div class="item-detail-row">
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
        </div>
    `;
}

function itemDetailHtml(item) {
    const createdAt = formatDate(item.created_at);

    return `
        <article class="item-detail">
            <div class="item-detail-media">
                ${itemDetailImageHtml(item)}
            </div>

            <div class="item-detail-content">
                <div class="item-meta">
                    <span class="item-badge">${escapeHtml(item.status || "aktiv")}</span>
                    <span class="item-badge">${escapeHtml(item.species || "Tier")}</span>
                </div>

                <h2>${escapeHtml(item.title)}</h2>
                <p class="item-detail-description">${escapeHtml(item.description)}</p>
                <div class="item-detail-price">${formatPrice(item.price)}</div>

                <dl class="item-detail-list">
                    ${detailRowHtml("Tierart", item.species)}
                    ${detailRowHtml("Rasse", item.breed)}
                    ${detailRowHtml("Alter", item.age)}
                    ${detailRowHtml("Geschlecht", item.gender)}
                    ${detailRowHtml("Verkäufer", item.seller_name)}
                    ${detailRowHtml("Status", item.status)}
                    ${createdAt ? detailRowHtml("Erstellt am", createdAt) : ""}
                </dl>

                <div class="item-detail-actions">
                    <button id="interestButton" class="btn" type="button">Interesse anmelden</button>
                    <a class="btn secondary" href="marketplace.html">Zurück</a>
                </div>

                <div id="interestMessage" class="status-message"></div>
            </div>
        </article>
    `;
}

async function createOrder(itemId) {
    if (!requireLogin()) {
        return;
    }

    const message = document.getElementById("interestMessage");

    if (message) {
        message.textContent = "Interesse wird angemeldet...";
        message.className = "status-message";
    }

    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: "POST",
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
            if (message) {
                message.textContent = data.error || data.message || "Interesse konnte nicht angemeldet werden.";
                message.className = "status-message error";
            }
            return;
        }

        if (message) {
            message.textContent = "Interesse wurde angemeldet.";
            message.className = "status-message success";
        }
    } catch (error) {
        if (message) {
            message.textContent = "Server nicht erreichbar. Läuft dein Flask-Backend?";
            message.className = "status-message error";
        }
    }
}

function setupInterestButton(item) {
    const button = document.getElementById("interestButton");

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {
        createOrder(item.id);
    });
}

async function loadItemDetail() {
    const container = document.getElementById("itemDetail");

    if (!container) {
        return;
    }

    const itemId = getItemDetailId();

    if (!itemId) {
        container.innerHTML = `<div class="empty-state">Kein Inserat ausgewählt.</div>`;
        return;
    }

    container.innerHTML = `<div class="empty-state">Inserat wird geladen...</div>`;

    try {
        const response = await fetch(`${API_BASE_URL}/items/${encodeURIComponent(itemId)}`);
        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = `<div class="empty-state">Fehler: ${escapeHtml(data.error || data.message || "Inserat konnte nicht geladen werden.")}</div>`;
            return;
        }

        const item = data.item;

        if (!item) {
            container.innerHTML = `<div class="empty-state">Inserat nicht gefunden.</div>`;
            return;
        }

        container.innerHTML = itemDetailHtml(item);
        setupInterestButton(item);
    } catch (error) {
        container.innerHTML = `<div class="empty-state">Server nicht erreichbar. Läuft dein Flask-Backend?</div>`;
    }
}

function orderImageHtml(order) {
    if (order.image_url) {
        return `<img class="item-card-image" src="${escapeHtml(order.image_url)}" alt="${escapeHtml(order.item_title)}">`;
    }

    return `<div class="item-card-placeholder">🐾</div>`;
}

function orderStatusClass(status) {
    const statusMap = {
        "angefragt": "requested",
        "bestätigt": "confirmed",
        "abgelehnt": "rejected",
        "abgeschlossen": "completed"
    };

    return statusMap[status] || "requested";
}

function saleOrderActionsHtml(order) {
    if (order.status === "angefragt") {
        return `
            <button class="btn" type="button" onclick="updateOrderStatus(${order.id}, 'bestätigt')">Bestätigen</button>
            <button class="btn danger" type="button" onclick="updateOrderStatus(${order.id}, 'abgelehnt')">Ablehnen</button>
        `;
    }

    if (order.status === "bestätigt") {
        return `
            <button class="btn" type="button" onclick="updateOrderStatus(${order.id}, 'abgeschlossen')">Abschließen</button>
        `;
    }

    return "";
}

function orderCardHtml(order, type) {
    const personLabel = type === "sale" ? "Käufer" : "Verkäufer";
    const personName = type === "sale" ? order.buyer_name : order.seller_name;
    const createdAt = formatDate(order.created_at);
    const status = order.status || "angefragt";
    const saleActions = type === "sale" ? saleOrderActionsHtml(order) : "";

    return `
        <article class="item-card">
            ${orderImageHtml(order)}
            <div class="item-card-body">
                <div class="item-meta">
                    <span class="item-badge status-badge status-${orderStatusClass(status)}">${escapeHtml(status)}</span>
                </div>

                <h3>${escapeHtml(order.item_title)}</h3>
                <div class="item-price">${formatPrice(order.price)}</div>

                <div class="item-seller">${personLabel}: ${escapeHtml(personName || "Unbekannt")}</div>
                ${createdAt ? `<div class="item-seller">Angefragt am: ${escapeHtml(createdAt)}</div>` : ""}

                <div class="item-card-actions">
                    <a class="btn secondary" href="item.html?id=${encodeURIComponent(order.item_id)}">Inserat ansehen</a>
                    ${saleActions}
                </div>

                <div id="orderMessage-${order.id}" class="status-message"></div>
            </div>
        </article>
    `;
}

async function updateOrderStatus(orderId, status) {
    if (!requireLogin()) {
        return;
    }

    const message = document.getElementById(`orderMessage-${orderId}`);

    if (message) {
        message.textContent = "Status wird aktualisiert...";
        message.className = "status-message";
    }

    try {
        const response = await fetch(`${API_BASE_URL}/orders/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                order_id: orderId,
                status: status
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorText = data.error || data.message || "Status konnte nicht geändert werden.";

            if (message) {
                message.textContent = errorText;
                message.className = "status-message error";
            } else {
                alert(errorText);
            }
            return;
        }

        if (message) {
            message.textContent = data.message || "Status wurde aktualisiert.";
            message.className = "status-message success";
        }

        loadOrderList("sale");
    } catch (error) {
        const errorText = "Server nicht erreichbar.";

        if (message) {
            message.textContent = errorText;
            message.className = "status-message error";
        } else {
            alert(errorText);
        }
    }
}

async function loadOrderList(type) {
    if (!requireLogin()) {
        return;
    }

    const containerId = type === "sale" ? "salesGrid" : "ordersGrid";
    const endpoint = type === "sale" ? "my_sales" : "my_orders";
    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    container.innerHTML = `<div class="empty-state">Anfragen werden geladen...</div>`;

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = `<div class="empty-state">Fehler: ${escapeHtml(data.error || data.message || "Anfragen konnten nicht geladen werden.")}</div>`;
            return;
        }

        if (!data.orders || data.orders.length === 0) {
            const emptyText = type === "sale"
                ? "Noch keine Kaufanfragen zu deinen Inseraten."
                : "Du hast noch keine Kaufanfragen gestellt.";

            container.innerHTML = `<div class="empty-state">${emptyText}</div>`;
            return;
        }

        container.innerHTML = data.orders.map((order) => orderCardHtml(order, type)).join("");
    } catch (error) {
        container.innerHTML = `<div class="empty-state">Server nicht erreichbar. Läuft dein Flask-Backend?</div>`;
    }
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
            marketplaceItems = [];
            container.innerHTML = `<div class="empty-state">Noch keine Tiere im Marktplatz.</div>`;
            return;
        }

        marketplaceItems = data.items;
        renderMarketplaceItems();
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
        ensureMarketplaceFilters();
        setupMarketplaceFilters();
        loadMarketplaceItems();
    }

    if (document.body.dataset.page === "sell") {
        setupSellForm();
    }

    if (document.body.dataset.page === "my-items") {
        loadMyItems();
    }

    if (document.body.dataset.page === "item-detail") {
        loadItemDetail();
    }

    if (document.body.dataset.page === "orders") {
        loadOrderList("order");
    }

    if (document.body.dataset.page === "sales") {
        loadOrderList("sale");
    }
});
