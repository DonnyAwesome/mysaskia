function getSavedTheme() {
    return localStorage.getItem("theme") || "system";
}

function applySavedTheme() {
    const theme = getSavedTheme();

    document.body.classList.remove("theme-light", "theme-dark");

    if (theme === "light") {
        document.body.classList.add("theme-light");
    }

    if (theme === "dark") {
        document.body.classList.add("theme-dark");
    }
}

function updateGlobalNavigation() {
    const token = localStorage.getItem("token");

    const loginNavItem = document.getElementById("loginNavItem");
    const logoutNavItem = document.getElementById("logoutNavItem");

    if (!loginNavItem || !logoutNavItem) {
        return;
    }

    if (token) {
        loginNavItem.style.display = "none";
        logoutNavItem.style.display = "list-item";
    } else {
        loginNavItem.style.display = "list-item";
        logoutNavItem.style.display = "none";
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", function () {
    applySavedTheme();
    updateGlobalNavigation();

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
});
