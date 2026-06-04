const SELLER_API_BASE_URL = "http://127.0.0.1:5000/api";

function escapeSellerHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getSellerId() {
    const params = new URLSearchParams(window.location.search);

    return (params.get("id") || "").trim();
}

function formatSellerDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value || "";
    }

    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "long"
    }).format(date);
}

function formatSellerPrice(price) {
    const numberPrice = Number(price);

    if (Number.isNaN(numberPrice)) {
        return `${price} €`;
    }

    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
    }).format(numberPrice);
}

function sellerProfileHtml(seller) {
    const name = `${seller.first_name} ${seller.last_name}`;

    return `
        <h1>${escapeSellerHtml(name)}</h1>
        <p>Mitglied seit ${escapeSellerHtml(formatSellerDate(seller.created_at))}</p>

        <div class="dashboard-stats-grid">
            <div class="dashboard-stat-card">
                <div class="dashboard-stat-value">${seller.active_items_count}</div>
                <div class="dashboard-stat-label">Aktive Inserate</div>
            </div>
            <div class="dashboard-stat-card">
                <div class="dashboard-stat-value">${seller.sold_items_count}</div>
                <div class="dashboard-stat-label">Verkaufte Inserate</div>
            </div>
        </div>

        <div class="marketplace-actions">
            <a class="btn secondary" href="marketplace.html">Zum Marktplatz</a>
        </div>
    `;
}

function sellerItemCardHtml(item) {
    const imageHtml = item.image_url
        ? `<img class="item-card-image" src="${escapeSellerHtml(item.image_url)}" alt="${escapeSellerHtml(item.title)}">`
        : `<div class="item-card-placeholder">🐾</div>`;

    return `
        <a class="item-card item-card-link" href="item.html?id=${encodeURIComponent(item.id)}">
            ${imageHtml}
            <div class="item-card-body">
                <h3>${escapeSellerHtml(item.title)}</h3>
                <p class="item-description">${escapeSellerHtml(item.description)}</p>

                <div class="item-meta">
                    <span class="item-badge">${escapeSellerHtml(item.species || "Tier")}</span>
                    ${item.breed ? `<span class="item-badge">${escapeSellerHtml(item.breed)}</span>` : ""}
                    <span class="item-badge">${escapeSellerHtml(item.status)}</span>
                </div>

                <div class="item-price">${formatSellerPrice(item.price)}</div>
            </div>
        </a>
    `;
}

async function loadSellerProfile() {
    const sellerId = getSellerId();
    const profile = document.getElementById("sellerProfile");
    const itemsGrid = document.getElementById("sellerItemsGrid");

    if (!profile || !itemsGrid) {
        return;
    }

    if (!sellerId) {
        profile.innerHTML = `<div class="empty-state">Keine Verkäufer-ID angegeben.</div>`;
        itemsGrid.innerHTML = "";
        return;
    }

    itemsGrid.innerHTML = `<div class="empty-state">Inserate werden geladen...</div>`;

    try {
        const response = await fetch(`${SELLER_API_BASE_URL}/sellers/${encodeURIComponent(sellerId)}`);
        const data = await response.json();

        if (!response.ok) {
            profile.innerHTML = `<div class="empty-state">${escapeSellerHtml(data.error || data.message || "Verkäuferprofil konnte nicht geladen werden.")}</div>`;
            itemsGrid.innerHTML = "";
            return;
        }

        profile.innerHTML = sellerProfileHtml(data);

        if (!data.active_items || data.active_items.length === 0) {
            itemsGrid.innerHTML = `<div class="empty-state">Dieser Verkäufer hat aktuell keine aktiven Inserate.</div>`;
            return;
        }

        itemsGrid.innerHTML = data.active_items.map(sellerItemCardHtml).join("");
    } catch (error) {
        profile.innerHTML = `<div class="empty-state">Server nicht erreichbar. Läuft dein Flask-Backend?</div>`;
        itemsGrid.innerHTML = "";
    }
}

document.addEventListener("DOMContentLoaded", loadSellerProfile);
