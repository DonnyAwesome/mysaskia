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

function itemStateHtml(title, text, type = "", actionHtml = "") {
    return `
        <div class="empty-state ${type}">
            <div class="empty-state-icon">${type === "loading-state" ? "…" : type === "error-state" ? "!" : "🐾"}</div>
            <strong>${escapeHtml(title)}</strong>
            ${text ? `<p>${escapeHtml(text)}</p>` : ""}
            ${actionHtml ? `<div class="empty-state-actions">${actionHtml}</div>` : ""}
        </div>
    `;
}

function handleItemImageError(image, detail = false) {
    const placeholder = document.createElement("div");
    placeholder.className = detail ? "item-detail-placeholder" : "item-card-placeholder";
    placeholder.textContent = "🐾";
    placeholder.setAttribute("aria-label", "Kein Bild verfügbar");
    image.replaceWith(placeholder);
}

let marketplaceItems = [];

function getInitialMarketplaceFilters() {
    const params = new URLSearchParams(window.location.search);

    return {
        q: (params.get("q") || "").trim()
    };
}

function getSelectedCheckboxValues(form, name) {
    return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function getMarketplaceFilters() {
    const form = document.getElementById("marketplaceFilters");

    if (!form) {
        return {
            q: "",
            categories: [],
            minPrice: "",
            maxPrice: "",
            gender: "",
            age: "",
            breed: "",
            withImage: false,
            activeOnly: true
        };
    }

    const formData = new FormData(form);

    return {
        q: String(formData.get("q") || "").trim(),
        categories: getSelectedCheckboxValues(form, "category"),
        minPrice: String(formData.get("minPrice") || "").trim(),
        maxPrice: String(formData.get("maxPrice") || "").trim(),
        gender: String(formData.get("gender") || "").trim(),
        age: String(formData.get("age") || "").trim(),
        breed: String(formData.get("breed") || "").trim(),
        withImage: Boolean(formData.get("withImage")),
        activeOnly: Boolean(formData.get("activeOnly"))
    };
}

function normalizeFilterText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss");
}

function itemText(item, fields) {
    return fields.map((field) => normalizeFilterText(item[field])).join(" ");
}

function itemCategoryKey(item) {
    const text = itemText(item, ["species", "breed", "title", "description"]);

    if (text.includes("hund")) {
        return "hunde";
    }

    if (text.includes("katze") || text.includes("kater")) {
        return "katzen";
    }

    if (["kaninchen", "hamster", "meerschwein", "maus", "ratte", "chinchilla"].some((word) => text.includes(word))) {
        return "kleintiere";
    }

    if (["vogel", "papagei", "wellensittich", "sittich", "kanar"].some((word) => text.includes(word))) {
        return "voegel";
    }

    if (["reptil", "schildkroete", "schildkrote", "echse", "gecko", "schlange"].some((word) => text.includes(word))) {
        return "reptilien";
    }

    return "sonstige";
}

function itemMatchesAgeFilter(item, ageFilter) {
    if (!ageFilter) {
        return true;
    }

    const ageText = normalizeFilterText(item.age);

    if (ageFilter === "jungtier") {
        return ["jung", "welpe", "kitten", "baby", "junior", "monat"].some((word) => ageText.includes(word));
    }

    if (ageFilter === "erwachsen") {
        return ["erwachsen", "adult", "jahr"].some((word) => ageText.includes(word)) &&
            !["senior", "alt"].some((word) => ageText.includes(word));
    }

    if (ageFilter === "senior") {
        return ["senior", "alt", "aelter"].some((word) => ageText.includes(word));
    }

    return true;
}

function itemMatchesGenderFilter(item, genderFilter) {
    if (!genderFilter) {
        return true;
    }

    const genderText = normalizeFilterText(item.gender);

    if (genderFilter === "unbekannt") {
        return !genderText || ["unbekannt", "keine", "n/a"].some((word) => genderText.includes(word));
    }

    return genderText.includes(normalizeFilterText(genderFilter));
}

function itemMatchesMarketplaceFilters(item, filters) {
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
    const matchesCategory = filters.categories.length === 0 ||
        filters.categories.includes(itemCategoryKey(item));
    const minPrice = Number(filters.minPrice);
    const maxPrice = Number(filters.maxPrice);
    const matchesMinPrice = !filters.minPrice ||
        (!Number.isNaN(minPrice) && Number(item.price) >= minPrice);
    const matchesMaxPrice = !filters.maxPrice ||
        (!Number.isNaN(maxPrice) && Number(item.price) <= maxPrice);
    const matchesGender = itemMatchesGenderFilter(item, filters.gender);
    const matchesAge = itemMatchesAgeFilter(item, filters.age);
    const matchesBreed = !filters.breed ||
        normalizeFilterText(item.breed).includes(normalizeFilterText(filters.breed));
    const matchesImage = !filters.withImage || Boolean(item.image_url || item.image_path);
    const matchesStatus = !filters.activeOnly || normalizeFilterText(item.status || "aktiv").includes("aktiv");

    return matchesSearch &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesGender &&
        matchesAge &&
        matchesBreed &&
        matchesImage &&
        matchesStatus;
}

function applyMarketplaceFilters(items) {
    const filters = getMarketplaceFilters();

    return items.filter((item) => itemMatchesMarketplaceFilters(item, filters));
}

function sortMarketplaceItems(items) {
    const sortSelect = document.getElementById("marketplaceSort");
    const sortValue = sortSelect ? sortSelect.value : "newest";
    const sortedItems = [...items];

    if (sortValue === "priceAsc") {
        sortedItems.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortValue === "priceDesc") {
        sortedItems.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortValue === "titleAsc") {
        sortedItems.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "de"));
    } else {
        sortedItems.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return sortedItems;
}

function renderResultCount(count) {
    const container = document.getElementById("marketplaceResultCount");

    if (container) {
        container.textContent = count === 1 ? "1 Inserat gefunden" : `${count} Inserate gefunden`;
    }
}

function renderMarketplaceItems() {
    const container = document.getElementById("itemsGrid");

    if (!container) {
        return;
    }

    const visibleItems = sortMarketplaceItems(applyMarketplaceFilters(marketplaceItems));

    renderResultCount(visibleItems.length);

    if (visibleItems.length === 0) {
        container.innerHTML = itemStateHtml(
            "Keine Inserate gefunden",
            "Passe deine Filter an.",
            "",
            `<button class="btn secondary" type="button" onclick="document.getElementById('resetMarketplaceFilters').click()">Filter zurücksetzen</button>`
        );
        return;
    }

    container.innerHTML = visibleItems.map((item) => itemCardHtml(item, false)).join("");
}

function setupMarketplaceFilters() {
    const form = document.getElementById("marketplaceFilters");
    const resetButton = document.getElementById("resetMarketplaceFilters");
    const sortSelect = document.getElementById("marketplaceSort");

    if (!form || !resetButton) {
        return;
    }

    const initialFilters = getInitialMarketplaceFilters();
    const queryInput = document.getElementById("filterQuery");

    if (queryInput) {
        queryInput.value = initialFilters.q;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        renderMarketplaceItems();
    });

    form.addEventListener("input", () => {
        renderMarketplaceItems();
    });

    form.addEventListener("change", () => {
        renderMarketplaceItems();
    });

    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            renderMarketplaceItems();
        });
    }

    resetButton.addEventListener("click", () => {
        form.reset();
        const activeOnly = document.getElementById("filterActiveOnly");

        if (activeOnly) {
            activeOnly.checked = true;
        }

        window.history.pushState({}, "", "marketplace.html");
        renderMarketplaceItems();
    });

    window.addEventListener("popstate", () => {
        const filters = getInitialMarketplaceFilters();

        if (queryInput) {
            queryInput.value = filters.q;
        }

        renderMarketplaceItems();
    });
}

function itemImageHtml(item) {
    if (item.image_url) {
        return `<img class="item-card-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" onerror="handleItemImageError(this)">`;
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
        return `<img class="item-detail-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" onerror="handleItemImageError(this, true)">`;
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

function sellerProfileRowHtml(item) {
    if (!item.user_id) {
        return "";
    }

    return `
        <div class="item-detail-row">
            <dt>Verkäuferprofil</dt>
            <dd><a href="seller.html?id=${encodeURIComponent(item.user_id)}">Verkäuferprofil ansehen</a></dd>
        </div>
    `;
}

function itemDetailHtml(item) {
    const createdAt = formatDate(item.created_at);
    const favoriteAction = getAuthToken()
        ? `<button id="favoriteButton" class="btn secondary" type="button">Merken</button>`
        : `<a class="btn secondary" href="login.html">Einloggen zum Merken</a>`;

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
                    ${sellerProfileRowHtml(item)}
                    ${detailRowHtml("Status", item.status)}
                    ${createdAt ? detailRowHtml("Erstellt am", createdAt) : ""}
                </dl>

                <div class="item-detail-actions">
                    <button id="interestButton" class="btn" type="button">Interesse anmelden</button>
                    ${favoriteAction}
                    <a class="btn secondary" href="marketplace.html">Zurück</a>
                </div>

                <div id="interestMessage" class="status-message"></div>
                <div id="favoriteMessage" class="status-message"></div>
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

async function setupFavoriteButton(item) {
    const button = document.getElementById("favoriteButton");
    const message = document.getElementById("favoriteMessage");
    const token = getAuthToken();

    if (!button || !token) {
        return;
    }

    let isFavorite = false;

    function updateButton() {
        button.textContent = isFavorite ? "Von Merkliste entfernen" : "Merken";
    }

    try {
        const response = await fetch(`${API_BASE_URL}/favorites/status?item_id=${encodeURIComponent(item.id)}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (response.ok) {
            isFavorite = Boolean(data.is_favorite);
            updateButton();
        }
    } catch (error) {
        if (message) {
            message.textContent = "Merkliste konnte nicht geladen werden.";
            message.className = "status-message error";
        }
    }

    button.addEventListener("click", async () => {
        button.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/favorites`, {
                method: isFavorite ? "DELETE" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    item_id: item.id
                })
            });
            const data = await response.json();

            if (!response.ok) {
                if (message) {
                    message.textContent = data.error || data.message || "Merkliste konnte nicht aktualisiert werden.";
                    message.className = "status-message error";
                }
                return;
            }

            isFavorite = Boolean(data.is_favorite);
            updateButton();

            if (message) {
                message.textContent = data.message;
                message.className = "status-message success";
            }
        } catch (error) {
            if (message) {
                message.textContent = "Server nicht erreichbar.";
                message.className = "status-message error";
            }
        } finally {
            button.disabled = false;
        }
    });
}

async function loadItemDetail() {
    const container = document.getElementById("itemDetail");

    if (!container) {
        return;
    }

    const itemId = getItemDetailId();

    if (!itemId) {
        container.innerHTML = itemStateHtml(
            "Kein Inserat ausgewählt",
            "Öffne ein Inserat über den Marktplatz.",
            "error-state",
            `<a class="btn secondary" href="marketplace.html">Zum Marktplatz</a>`
        );
        return;
    }

    container.innerHTML = itemStateHtml("Inserat wird geladen", "Einen Moment bitte.", "loading-state");

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/items/${encodeURIComponent(itemId)}`, {
            headers: token
                ? { "Authorization": `Bearer ${token}` }
                : {}
        });
        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = itemStateHtml(
                "Inserat nicht verfügbar",
                data.error || data.message || "Inserat konnte nicht geladen werden.",
                "error-state",
                `<a class="btn secondary" href="marketplace.html">Zum Marktplatz</a>`
            );
            return;
        }

        const item = data.item;

        if (!item) {
            container.innerHTML = itemStateHtml("Inserat nicht gefunden", "Das Inserat existiert nicht oder ist nicht öffentlich.", "error-state");
            return;
        }

        container.innerHTML = itemDetailHtml(item);
        setupInterestButton(item);
        setupFavoriteButton(item);
    } catch (error) {
        container.innerHTML = itemStateHtml("Server nicht erreichbar", "Prüfe, ob das Flask-Backend läuft.", "error-state");
    }
}

function orderImageHtml(order) {
    if (order.image_url) {
        return `<img class="item-card-image" src="${escapeHtml(order.image_url)}" alt="${escapeHtml(order.item_title)}" onerror="handleItemImageError(this)">`;
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

    container.innerHTML = itemStateHtml("Marktplatz wird geladen", "Aktive Inserate werden abgerufen.", "loading-state");

    try {
        const response = await fetch(`${API_BASE_URL}/items`);
        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = itemStateHtml("Marktplatz konnte nicht geladen werden", data.error || data.message || "Bitte versuche es erneut.", "error-state");
            return;
        }

        if (!data.items || data.items.length === 0) {
            marketplaceItems = [];
            renderResultCount(0);
            container.innerHTML = itemStateHtml(
                "Noch keine aktiven Inserate",
                "Sei der Erste und stelle ein Tier ein.",
                "",
                `<a class="btn" href="sell.html">Tier inserieren</a>`
            );
            return;
        }

        marketplaceItems = data.items;
        renderMarketplaceItems();
    } catch (error) {
        renderResultCount(0);
        container.innerHTML = itemStateHtml("Server nicht erreichbar", "Prüfe, ob das Flask-Backend läuft.", "error-state");
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

    container.innerHTML = itemStateHtml("Deine Inserate werden geladen", "Einen Moment bitte.", "loading-state");

    try {
        const response = await fetch(`${API_BASE_URL}/my_items`, {
            headers: {
                "Authorization": `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = itemStateHtml("Inserate konnten nicht geladen werden", data.error || data.message || "Bitte versuche es erneut.", "error-state");
            return;
        }

        if (!data.items || data.items.length === 0) {
            container.innerHTML = itemStateHtml(
                "Du hast noch keine Inserate",
                "Erstelle dein erstes Tier-Inserat.",
                "",
                `<a class="btn" href="sell.html">Neues Tier inserieren</a>`
            );
            return;
        }

        container.innerHTML = data.items.map((item) => itemCardHtml(item, true)).join("");
    } catch (error) {
        container.innerHTML = itemStateHtml("Server nicht erreichbar", "Prüfe, ob das Flask-Backend läuft.", "error-state");
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
