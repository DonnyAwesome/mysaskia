const FAVORITES_API_BASE_URL = "http://127.0.0.1:5000/api";

function getFavoritesToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function escapeFavoriteHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatFavoritePrice(price) {
    const numberPrice = Number(price);

    if (Number.isNaN(numberPrice)) {
        return `${price} €`;
    }

    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
    }).format(numberPrice);
}

function favoriteStateHtml(title, text, type = "", actionHtml = "") {
    return `
        <div class="empty-state ${type}">
            <div class="empty-state-icon">${type === "loading-state" ? "…" : type === "error-state" ? "!" : "♥"}</div>
            <strong>${escapeFavoriteHtml(title)}</strong>
            ${text ? `<p>${escapeFavoriteHtml(text)}</p>` : ""}
            ${actionHtml ? `<div class="empty-state-actions">${actionHtml}</div>` : ""}
        </div>
    `;
}

function handleFavoriteImageError(image) {
    const placeholder = document.createElement("div");
    placeholder.className = "item-card-placeholder";
    placeholder.textContent = "🐾";
    image.replaceWith(placeholder);
}

function favoriteCardHtml(item) {
    const imageHtml = item.image_url
        ? `<img class="item-card-image" src="${escapeFavoriteHtml(item.image_url)}" alt="${escapeFavoriteHtml(item.title)}" onerror="handleFavoriteImageError(this)">`
        : `<div class="item-card-placeholder">🐾</div>`;

    return `
        <article id="favoriteItem-${item.id}" class="item-card">
            ${imageHtml}
            <div class="item-card-body">
                <h3>${escapeFavoriteHtml(item.title)}</h3>
                <p class="item-description">${escapeFavoriteHtml(item.description)}</p>

                <div class="item-meta">
                    <span class="item-badge">${escapeFavoriteHtml(item.species || "Tier")}</span>
                    ${item.breed ? `<span class="item-badge">${escapeFavoriteHtml(item.breed)}</span>` : ""}
                    <span class="item-badge">${escapeFavoriteHtml(item.status || "aktiv")}</span>
                </div>

                <div class="item-price">${formatFavoritePrice(item.price)}</div>

                <div class="item-card-actions">
                    <a class="btn" href="item.html?id=${encodeURIComponent(item.id)}">Details ansehen</a>
                    <button class="btn danger" type="button" onclick="removeFavorite(${item.id})">Entfernen</button>
                </div>
            </div>
        </article>
    `;
}

async function loadFavorites() {
    const token = getFavoritesToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const container = document.getElementById("favoritesGrid");

    if (!container) {
        return;
    }

    container.innerHTML = favoriteStateHtml("Merkliste wird geladen", "Gemerkte Inserate werden abgerufen.", "loading-state");

    try {
        const response = await fetch(`${FAVORITES_API_BASE_URL}/favorites`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = favoriteStateHtml("Merkliste konnte nicht geladen werden", data.error || data.message || "Bitte versuche es erneut.", "error-state");
            return;
        }

        if (!data.items || data.items.length === 0) {
            container.innerHTML = favoriteStateHtml(
                "Deine Merkliste ist noch leer",
                "Merke interessante Inserate auf deren Detailseite.",
                "",
                `<a class="btn" href="marketplace.html">Tiere entdecken</a>`
            );
            return;
        }

        container.innerHTML = data.items.map(favoriteCardHtml).join("");
    } catch (error) {
        container.innerHTML = favoriteStateHtml("Server nicht erreichbar", "Prüfe, ob das Flask-Backend läuft.", "error-state");
    }
}

async function removeFavorite(itemId) {
    const token = getFavoritesToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${FAVORITES_API_BASE_URL}/favorites`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                item_id: itemId
            })
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || data.message || "Inserat konnte nicht entfernt werden.");
            return;
        }

        const card = document.getElementById(`favoriteItem-${itemId}`);

        if (card) {
            card.remove();
        }

        const container = document.getElementById("favoritesGrid");

        if (container && !container.querySelector(".item-card")) {
            container.innerHTML = favoriteStateHtml(
                "Deine Merkliste ist noch leer",
                "Merke interessante Inserate auf deren Detailseite.",
                "",
                `<a class="btn" href="marketplace.html">Tiere entdecken</a>`
            );
        }
    } catch (error) {
        alert("Server nicht erreichbar.");
    }
}

document.addEventListener("DOMContentLoaded", loadFavorites);
