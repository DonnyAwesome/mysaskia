function getShopToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
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
    window.location.href = "login.html";
}

function renderShopNavigation() {
    const existingNavbar = document.querySelector(".navbar");
    if (existingNavbar) {
        existingNavbar.remove();
    }

    const token = getShopToken();
    const isLoggedIn = Boolean(token);

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

                    <a class="shop-action ${isActivePage("sell.html")}" href="sell.html" title="Tier verkaufen">
                        <span class="shop-action-icon">➕</span>
                        <span>Verkaufen</span>
                    </a>

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
}

document.addEventListener("DOMContentLoaded", renderShopNavigation);
