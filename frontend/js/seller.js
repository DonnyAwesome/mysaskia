const SELLER_API_BASE_URL = "http://127.0.0.1:5000/api";

function getSellerToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

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
            <div class="dashboard-stat-card">
                <div class="dashboard-stat-value">${seller.average_rating === null ? "–" : `${seller.average_rating} / 5 Sterne`}</div>
                <div class="dashboard-stat-label">${seller.reviews_count} Bewertungen</div>
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

function sellerReviewHtml(review) {
    return `
        <article class="review-card">
            <div class="review-card-header">
                <strong>${escapeSellerHtml(review.reviewer_name)}</strong>
                <span class="item-badge">${review.rating} / 5 Sterne</span>
            </div>
            ${review.comment ? `<p>${escapeSellerHtml(review.comment)}</p>` : ""}
            <div class="item-seller">${escapeSellerHtml(formatSellerDate(review.created_at))}</div>
        </article>
    `;
}

function sellerReviewFormHtml() {
    return `
        <form id="sellerReviewForm" class="sell-form seller-review-form">
            <label for="reviewRating">Bewertung</label>
            <select id="reviewRating" name="rating" required>
                <option value="">Bitte wählen</option>
                <option value="5">5 Sterne</option>
                <option value="4">4 Sterne</option>
                <option value="3">3 Sterne</option>
                <option value="2">2 Sterne</option>
                <option value="1">1 Stern</option>
            </select>

            <label for="reviewComment">Kommentar (optional)</label>
            <textarea id="reviewComment" name="comment" maxlength="500" rows="4" placeholder="Wie war deine Erfahrung?"></textarea>

            <button class="btn" type="submit">Bewertung senden</button>
            <div id="sellerReviewMessage" class="status-message"></div>
        </form>
    `;
}

async function loadSellerReviews(sellerId) {
    const reviewsList = document.getElementById("sellerReviewsList");

    if (!reviewsList) {
        return;
    }

    reviewsList.innerHTML = `<div class="empty-state">Bewertungen werden geladen...</div>`;

    try {
        const response = await fetch(`${SELLER_API_BASE_URL}/sellers/${encodeURIComponent(sellerId)}/reviews`);
        const data = await response.json();

        if (!response.ok) {
            reviewsList.innerHTML = `<div class="empty-state">${escapeSellerHtml(data.error || "Bewertungen konnten nicht geladen werden.")}</div>`;
            return;
        }

        if (!data.reviews || data.reviews.length === 0) {
            reviewsList.innerHTML = `<div class="empty-state">Noch keine Bewertungen</div>`;
            return;
        }

        reviewsList.innerHTML = data.reviews.map(sellerReviewHtml).join("");
    } catch (error) {
        reviewsList.innerHTML = `<div class="empty-state">Bewertungen konnten nicht geladen werden.</div>`;
    }
}

async function getCurrentSellerUser(token) {
    if (!token) {
        return null;
    }

    try {
        const response = await fetch(`${SELLER_API_BASE_URL}/profile`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        return null;
    }
}

function setupSellerReviewForm(sellerId, token) {
    const form = document.getElementById("sellerReviewForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("sellerReviewMessage");
        const formData = new FormData(form);

        if (message) {
            message.textContent = "Bewertung wird gesendet...";
            message.className = "status-message";
        }

        try {
            const response = await fetch(`${SELLER_API_BASE_URL}/sellers/${encodeURIComponent(sellerId)}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating: formData.get("rating"),
                    comment: formData.get("comment")
                })
            });
            const data = await response.json();

            if (!response.ok) {
                if (message) {
                    message.textContent = data.error || data.message || "Bewertung konnte nicht gespeichert werden.";
                    message.className = "status-message error";
                }
                return;
            }

            form.reset();

            if (message) {
                message.textContent = data.message || "Bewertung wurde gespeichert.";
                message.className = "status-message success";
            }

            await Promise.all([
                loadSellerProfile(),
                loadSellerReviews(sellerId)
            ]);
        } catch (error) {
            if (message) {
                message.textContent = "Server nicht erreichbar.";
                message.className = "status-message error";
            }
        }
    });
}

async function renderSellerReviewForm(sellerId) {
    const container = document.getElementById("sellerReviewFormContainer");

    if (!container) {
        return;
    }

    const token = getSellerToken();

    if (!token) {
        container.innerHTML = `<div class="empty-state">Melde dich an, um diesen Verkäufer zu bewerten.</div>`;
        return;
    }

    const currentUser = await getCurrentSellerUser(token);

    if (!currentUser) {
        container.innerHTML = `<div class="empty-state">Melde dich an, um diesen Verkäufer zu bewerten.</div>`;
        return;
    }

    if (currentUser && String(currentUser.id) === String(sellerId)) {
        container.innerHTML = `<div class="empty-state">Du kannst dich nicht selbst bewerten.</div>`;
        return;
    }

    container.innerHTML = sellerReviewFormHtml();
    setupSellerReviewForm(sellerId, token);
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

document.addEventListener("DOMContentLoaded", () => {
    const sellerId = getSellerId();

    loadSellerProfile();

    if (sellerId) {
        loadSellerReviews(sellerId);
        renderSellerReviewForm(sellerId);
    }
});
