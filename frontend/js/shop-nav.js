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
    const existingNavbar = document.querySelector(".navbar");
    if (existingNavbar) {
        existingNavbar.remove();
    }

    const token = getShopToken();
    const isLoggedIn = Boolean(token);
    const adminAction = isShopAdmin()
        ? `
            <a class="shop-action ${isActivePage("admin.html")}" href="admin.html" title="Moderation">
                <span class="shop-action-icon">🛡️</span>
                <span>Admin</span>
            </a>
        `
        : "";
    const adminTab = isShopAdmin()
        ? `
            <a class="shop-tab ${isActivePage("admin.html")}" href="admin.html">
                <span class="shop-tab-icon">🛡️</span>
                <span>Moderation</span>
            </a>
        `
        : "";

    const authAction = isLoggedIn
        ? `
            <button class="shop-action shop-logout-button" onclick="shopLogout()" title="Logout">
                <span class="shop-action-icon">🚪</span>
                <span>Logout</span>
            </button>
        `
        : `
            <a class="shop-action ${isActivePage("login.html")}" href="login.html" title="Login">
                <span class="shop-action-icon">👤</span>
                <span>Login</span>
            </a>
        `;
    const notificationsAction = isLoggedIn
        ? `
            <a class="shop-action ${isActivePage("notifications.html")}" href="notifications.html" title="Benachrichtigungen">
                <span class="shop-action-icon">🔔</span>
                <span id="shopNotificationsLabel">Benachrichtigungen</span>
            </a>
        `
        : "";

    const navHtml = `
        <header class="shop-header">
            <div class="shop-header-top">
                <a class="shop-logo" href="index.html">
                    <img src="images/flower-logo.svg" alt="MySaskia Logo">
                    <span>MySaskia</span>
                </a>

                <form class="shop-search" onsubmit="handleShopSearch(event)">
                    <input type="search" placeholder="Tiere suchen, z. B. Labrador, Katze, Maus...">
                    <button type="submit">Suchen</button>
                </form>

                <div class="shop-actions">
                    <a class="shop-action ${isActivePage("dashboard.html")}" href="dashboard.html" title="Dashboard">
                        <span class="shop-action-icon">🏠</span>
                        <span>Konto</span>
                    </a>

                    <a class="shop-action ${isActivePage("my-items.html")}" href="my-items.html" title="Meine Inserate">
                        <span class="shop-action-icon">📦</span>
                        <span>Inserate</span>
                    </a>

                    <a class="shop-action ${isActivePage("orders.html")}" href="orders.html" title="Meine Käufe">
                        <span class="shop-action-icon">🛒</span>
                        <span>Käufe</span>
                    </a>

                    <a class="shop-action ${isActivePage("favorites.html")}" href="favorites.html" title="Merkliste">
                        <span class="shop-action-icon">♥</span>
                        <span>Merkliste</span>
                    </a>

                    <a class="shop-action ${isActivePage("sales.html")}" href="sales.html" title="Meine Verkäufe">
                        <span class="shop-action-icon">🤝</span>
                        <span>Verkäufe</span>
                    </a>

                    <a class="shop-action ${isActivePage("sell.html")}" href="sell.html" title="Tier verkaufen">
                        <span class="shop-action-icon">➕</span>
                        <span>Verkaufen</span>
                    </a>

                    ${notificationsAction}
                    ${adminAction}
                    ${authAction}
                </div>
            </div>

            <div class="shop-mobile-search">
                <form class="shop-search" onsubmit="handleShopSearch(event)">
                    <input type="search" placeholder="Tiere suchen...">
                    <button type="submit">Suchen</button>
                </form>
            </div>

            <div class="shop-header-bottom">
                <nav class="shop-tabs">
                    <a class="shop-tab ${isActivePage("index.html")}" href="index.html">
                        <span class="shop-tab-icon">🏡</span>
                        <span>Home</span>
                    </a>

                    <a class="shop-tab ${isActivePage("marketplace.html")}" href="marketplace.html">
                        <span class="shop-tab-icon">🐾</span>
                        <span>Marktplatz</span>
                    </a>

                    <a class="shop-tab ${isActivePage("sell.html")}" href="sell.html">
                        <span class="shop-tab-icon">📸</span>
                        <span>Tier verkaufen</span>
                    </a>

                    <a class="shop-tab ${isActivePage("my-items.html")}" href="my-items.html">
                        <span class="shop-tab-icon">📋</span>
                        <span>Meine Inserate</span>
                    </a>

                    <a class="shop-tab ${isActivePage("favorites.html")}" href="favorites.html">
                        <span class="shop-tab-icon">♥</span>
                        <span>Merkliste</span>
                    </a>

                    <a class="shop-tab ${isActivePage("forum.html") || isActivePage("forum-group.html") || isActivePage("forum-story.html")}" href="forum.html">
                        <span class="shop-tab-icon">📖</span>
                        <span>Tiergeschichten</span>
                    </a>

                    ${adminTab}
                    <a class="shop-tab ${isActivePage("support.html")}" href="support.html">
                        <span class="shop-tab-icon">🎫</span>
                        <span>Support</span>
                    </a>

                    <a class="shop-tab ${isActivePage("profile.html")}" href="profile.html">
                        <span class="shop-tab-icon">⚙️</span>
                        <span>Profil</span>
                    </a>

                    <a class="shop-tab ${isActivePage("about.html")}" href="about.html">
                        <span class="shop-tab-icon">ℹ️</span>
                        <span>Über uns</span>
                    </a>
                </nav>
            </div>
        </header>
    `;

    document.body.insertAdjacentHTML("afterbegin", navHtml);
    loadShopUnreadCount();
}

document.addEventListener("DOMContentLoaded", renderShopNavigation);
