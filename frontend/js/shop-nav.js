function getShopToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function getShopUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
        return null;
    }
}

function isShopAdmin() {
    const user = getShopUser();

    return Boolean(user && (user.is_admin === true || user.is_admin === 1));
}

function getCurrentPageName() {
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (!page || page === "") {
        return "index.html";
    }

    return page;
}

function isActivePage(targetPage) {
    return getCurrentPageName() === targetPage ? "active" : "";
}

function isAnyActivePage(targetPages) {
    return targetPages.includes(getCurrentPageName()) ? "active" : "";
}

function handleShopSearch(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const input = form.querySelector("input");
    const query = input.value.trim();

    if (!query) {
        window.location.href = "marketplace.html";
        return;
    }

    window.location.href = `marketplace.html?q=${encodeURIComponent(query)}`;
}

function shopLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("mysaskia_token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

async function loadShopUnreadCount() {
    const token = getShopToken();
    const label = document.getElementById("shopNotificationsLabel");

    if (!token || !label) {
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/api/notifications/unread-count", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        label.textContent = data.unread_count > 0
            ? `Benachrichtigungen (${data.unread_count})`
            : "Benachrichtigungen";
    } catch (error) {
        // Die Navigation bleibt auch ohne erreichbares Backend nutzbar.
    }
}

function renderShopNavigation() {
    document.querySelectorAll(".navbar").forEach((existingNavbar) => {
        existingNavbar.remove();
    });

    const token = getShopToken();
    const isLoggedIn = Boolean(token);
    const accountActivePages = [
        "dashboard.html",
        "profile.html",
        "my-items.html",
        "favorites.html",
        "orders.html",
        "sales.html",
        "support.html",
        "notifications.html",
        "admin.html",
        "login.html"
    ];
    const guideActivePages = ["guide.html", "adoption.html", "safety.html", "about.html"];
    const accountMenu = isLoggedIn
        ? `
            <details class="shop-dropdown shop-account-dropdown">
                <summary class="shop-action ${isAnyActivePage(accountActivePages)}" title="Mein Konto">
                    <span class="shop-action-icon">👤</span>
                    <span>Mein Konto</span>
                </summary>
                <div class="shop-dropdown-menu">
                    <a class="${isActivePage("dashboard.html")}" href="dashboard.html">Dashboard</a>
                    <a class="${isActivePage("profile.html")}" href="profile.html">Profil</a>
                    <a class="${isActivePage("my-items.html")}" href="my-items.html">Meine Inserate</a>
                    <a class="${isActivePage("favorites.html")}" href="favorites.html">Merkliste</a>
                    <a class="${isActivePage("orders.html")}" href="orders.html">Meine Käufe</a>
                    <a class="${isActivePage("sales.html")}" href="sales.html">Meine Verkäufe</a>
                    <a class="${isActivePage("support.html")}" href="support.html">Support</a>
                    <a class="${isActivePage("notifications.html")}" href="notifications.html">Benachrichtigungen</a>
                    ${isShopAdmin() ? `<a class="${isActivePage("admin.html")}" href="admin.html">Admin-Bereich</a>` : ""}
                    <button type="button" onclick="shopLogout()">Logout</button>
                </div>
            </details>
        `
        : `
            <a class="shop-auth-link ${isActivePage("login.html")}" href="login.html">Login</a>
            <a class="shop-auth-link primary" href="login.html#register">Registrieren</a>
        `;

    const navHtml = `
        <header class="shop-header">
            <div class="shop-header-top">
                <a class="shop-logo" href="index.html">
                    <img src="images/flower-logo.svg" alt="MySaskia Logo">
                    <span>MySaskia</span>
                </a>

                <form class="shop-search" onsubmit="handleShopSearch(event)">
                    <input type="search" placeholder="Tier, Rasse oder Zubehör suchen...">
                    <button type="submit">Suchen</button>
                </form>

                <div class="shop-actions">
                    <a class="shop-sell-action ${isAnyActivePage(["sell.html", "edit-item.html"])}" href="sell.html">Inserieren</a>
                    ${accountMenu}
                </div>
            </div>

            <div class="shop-mobile-search">
                <form class="shop-search" onsubmit="handleShopSearch(event)">
                    <input type="search" placeholder="Tier, Rasse oder Zubehör suchen...">
                    <button type="submit">Suchen</button>
                </form>
            </div>

            <div class="shop-header-bottom">
                <nav class="shop-tabs">
                    <a class="shop-tab ${isActivePage("index.html")}" href="index.html">
                        <span class="shop-tab-icon">🏡</span>
                        <span>Home</span>
                    </a>

                    <a class="shop-tab ${isAnyActivePage(["marketplace.html", "item.html", "seller.html"])}" href="marketplace.html">
                        <span class="shop-tab-icon">🐾</span>
                        <span>Marktplatz</span>
                    </a>

                    <a class="shop-tab ${isAnyActivePage(["sell.html", "edit-item.html"])}" href="sell.html">
                        <span class="shop-tab-icon">📸</span>
                        <span>Verkaufen</span>
                    </a>

                    <a class="shop-tab ${isActivePage("forum.html") || isActivePage("forum-group.html") || isActivePage("forum-story.html")}" href="forum.html">
                        <span class="shop-tab-icon">📖</span>
                        <span>Tiergeschichten</span>
                    </a>

                    <details class="shop-dropdown shop-tab-dropdown">
                        <summary class="shop-tab ${isAnyActivePage(guideActivePages)}">
                            <span class="shop-tab-icon">💡</span>
                            <span>Ratgeber</span>
                        </summary>
                        <div class="shop-dropdown-menu">
                            <a class="${isActivePage("guide.html")}" href="guide.html">Tierwissen</a>
                            <a class="${isActivePage("adoption.html")}" href="adoption.html">Adoption</a>
                            <a class="${isActivePage("safety.html")}" href="safety.html">Sicherheit</a>
                            <a class="${isActivePage("about.html")}" href="about.html">Über uns</a>
                        </div>
                    </details>
                </nav>
            </div>
        </header>
    `;

    document.body.insertAdjacentHTML("afterbegin", navHtml);
    loadShopUnreadCount();
}

document.addEventListener("DOMContentLoaded", renderShopNavigation);
