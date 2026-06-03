function activateAuthTab(panelId) {
    const tabButtons = document.querySelectorAll(".auth-tab-button");
    const tabContents = document.querySelectorAll(".auth-tab-content");

    tabButtons.forEach(function (button) {
        button.classList.remove("active-tab");
    });

    tabContents.forEach(function (content) {
        content.classList.add("hidden");
    });

    const selectedButton = document.querySelector('[data-auth-tab="' + panelId + '"]');
    const selectedPanel = document.getElementById(panelId);

    if (selectedButton && selectedPanel) {
        selectedButton.classList.add("active-tab");
        selectedPanel.classList.remove("hidden");
    }
}

function activateAuthTabFromUrl() {
    if (window.location.hash === "#register") {
        activateAuthTab("registerPanel");
        return;
    }

    activateAuthTab("loginPanel");
}

function setupAuthTabs() {
    const tabButtons = document.querySelectorAll(".auth-tab-button");

    tabButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const selectedPanelId = button.dataset.authTab;
            activateAuthTab(selectedPanelId);

            if (selectedPanelId === "registerPanel") {
                history.replaceState(null, "", "login.html#register");
            } else {
                history.replaceState(null, "", "login.html");
            }
        });
    });

    const openRegisterLink = document.getElementById("openRegisterLink");
    const openLoginLink = document.getElementById("openLoginLink");

    if (openRegisterLink) {
        openRegisterLink.addEventListener("click", function (event) {
            event.preventDefault();
            activateAuthTab("registerPanel");
            history.replaceState(null, "", "login.html#register");
        });
    }

    if (openLoginLink) {
        openLoginLink.addEventListener("click", function (event) {
            event.preventDefault();
            activateAuthTab("loginPanel");
            history.replaceState(null, "", "login.html");
        });
    }
}

function setupLoginLanguageSelect() {
    const languageSelect = document.getElementById("loginLanguageSelect");

    if (!languageSelect) {
        return;
    }

    languageSelect.value = getLanguage();

    languageSelect.addEventListener("change", function () {
        const selectedLanguage = languageSelect.value;

        setLanguage(selectedLanguage);
        applyTranslations();

        languageSelect.value = selectedLanguage;
    });
}

document.addEventListener("DOMContentLoaded", function () {
    setupLoginLanguageSelect();
    setupAuthTabs();
    activateAuthTabFromUrl();
});
