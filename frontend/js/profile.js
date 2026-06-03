const API_URL = "http://127.0.0.1:5000/api";

function getToken() {
    return localStorage.getItem("token");
}

function safeGetLanguage() {
    if (typeof getLanguage === "function") {
        return getLanguage();
    }

    return localStorage.getItem("language") || "de";
}

function safeSetLanguage(language) {
    if (typeof setLanguage === "function") {
        setLanguage(language);
        return;
    }

    localStorage.setItem("language", language);
}

function safeTranslate(key, fallback) {
    if (typeof t === "function") {
        return t(key);
    }

    return fallback;
}

function safeApplyTranslations() {
    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
}

function saveStoredUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

function translateRole(role) {
    if (role === "Admin") {
        return "Admin";
    }

    return "User";
}

function fillProfileView(user) {
    const firstNameEl = document.getElementById("profileFirstName");
    const lastNameEl = document.getElementById("profileLastName");
    const emailEl = document.getElementById("profileEmail");
    const roleEl = document.getElementById("profileRole");
    const createdAtEl = document.getElementById("profileCreatedAt");

    const editFirstNameEl = document.getElementById("editFirstName");
    const editLastNameEl = document.getElementById("editLastName");

    if (firstNameEl) {
        firstNameEl.textContent = user.first_name || "-";
    }

    if (lastNameEl) {
        lastNameEl.textContent = user.last_name || "-";
    }

    if (emailEl) {
        emailEl.textContent = user.email || "-";
    }

    if (roleEl) {
        roleEl.textContent = translateRole(user.role);
    }

    if (createdAtEl) {
        createdAtEl.textContent = user.created_at || "-";
    }

    if (editFirstNameEl) {
        editFirstNameEl.value = user.first_name || "";
    }

    if (editLastNameEl) {
        editLastNameEl.value = user.last_name || "";
    }
}

async function loadProfile() {
    const token = getToken();
    const messageBox = document.getElementById("profileMessage");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(API_URL + "/profile", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (messageBox) {
                messageBox.textContent = data.error || safeTranslate("profileLoadError", "Profil konnte nicht geladen werden.");
            }

            if (response.status === 401) {
                logout();
            }

            return;
        }

        fillProfileView(data);

    } catch (error) {
        console.error("Profil-Fehler:", error);

        if (messageBox) {
            messageBox.textContent = safeTranslate("serverError", "Fehler beim Verbinden mit dem Server.");
        }
    }
}

async function updateProfile(event) {
    event.preventDefault();

    const token = getToken();
    const messageBox = document.getElementById("profileEditMessage");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const firstName = document.getElementById("editFirstName").value.trim();
    const lastName = document.getElementById("editLastName").value.trim();

    if (!firstName || !lastName) {
        messageBox.textContent = safeTranslate("requiredNameError", "Bitte Vorname und Nachname ausfüllen.");
        return;
    }

    try {
        const response = await fetch(API_URL + "/profile", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName
            })
        });

        const data = await response.json();

        if (!response.ok) {
            messageBox.textContent = data.error || safeTranslate("profileSaveError", "Profil konnte nicht gespeichert werden.");

            if (response.status === 401) {
                logout();
            }

            return;
        }

        fillProfileView(data.user);
        saveStoredUser(data.user);

        messageBox.textContent = safeTranslate("profileSaved", "Profil wurde gespeichert.");

    } catch (error) {
        console.error("Profil-Speicherfehler:", error);
        messageBox.textContent = safeTranslate("serverError", "Fehler beim Verbinden mit dem Server.");
    }
}

async function changePassword(event) {
    event.preventDefault();

    const token = getToken();
    const messageBox = document.getElementById("changePasswordMessage");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        messageBox.textContent = safeTranslate("passwordFieldsRequired", "Bitte alle Passwort-Felder ausfüllen.");
        return;
    }

    if (newPassword.length < 6) {
        messageBox.textContent = safeTranslate("passwordTooShort", "Das neue Passwort muss mindestens 6 Zeichen lang sein.");
        return;
    }

    if (newPassword !== confirmPassword) {
        messageBox.textContent = safeTranslate("passwordsDoNotMatch", "Die neuen Passwörter stimmen nicht überein.");
        return;
    }

    try {
        const response = await fetch(API_URL + "/change_password", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            messageBox.textContent = data.error || safeTranslate("changePasswordError", "Passwort konnte nicht geändert werden.");

            if (response.status === 401) {
                logout();
            }

            return;
        }

        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";

        messageBox.textContent = safeTranslate("changePasswordSuccess", "Passwort wurde geändert.");

    } catch (error) {
        console.error("Passwort-Fehler:", error);
        messageBox.textContent = safeTranslate("serverError", "Fehler beim Verbinden mit dem Server.");
    }
}

function activateTab(tabId) {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".profile-tab-content");

    tabButtons.forEach(function (button) {
        button.classList.remove("active-tab");
    });

    tabContents.forEach(function (content) {
        content.classList.add("hidden");
    });

    const selectedButton = document.querySelector('[data-tab="' + tabId + '"]');
    const selectedContent = document.getElementById(tabId);

    if (selectedButton && selectedContent) {
        selectedButton.classList.add("active-tab");
        selectedContent.classList.remove("hidden");
    }
}

function updateProfileUrl(tabId) {
    if (tabId === "overviewTab") {
        history.replaceState(null, "", "profile.html");
    }

    if (tabId === "editTab") {
        history.replaceState(null, "", "profile.html#edit");
    }

    if (tabId === "securityTab") {
        history.replaceState(null, "", "profile.html#security");
    }

    if (tabId === "settingsTab") {
        history.replaceState(null, "", "profile.html#settings");
    }
}

function setupTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");

    tabButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const selectedTabId = button.dataset.tab;
            activateTab(selectedTabId);
            updateProfileUrl(selectedTabId);
        });
    });
}

function activateTabFromUrl() {
    const hash = window.location.hash;

    if (hash === "#edit") {
        activateTab("editTab");
        return;
    }

    if (hash === "#security") {
        activateTab("securityTab");
        return;
    }

    if (hash === "#settings") {
        activateTab("settingsTab");
        return;
    }

    activateTab("overviewTab");
}

function loadSettings() {
    const languageSelect = document.getElementById("languageSelect");
    const themeSelect = document.getElementById("themeSelect");

    const savedLanguage = safeGetLanguage();
    const savedTheme = localStorage.getItem("theme") || "system";

    if (languageSelect) {
        languageSelect.value = savedLanguage;
    }

    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
}

function saveSettings(event) {
    event.preventDefault();

    const language = document.getElementById("languageSelect").value;
    const theme = document.getElementById("themeSelect").value;
    const settingsMessage = document.getElementById("settingsMessage");

    safeSetLanguage(language);
    localStorage.setItem("theme", theme);

    safeApplyTranslations();

    if (typeof applySavedTheme === "function") {
        applySavedTheme();
    }

    if (settingsMessage) {
        settingsMessage.textContent = safeTranslate("settingsSaved", "Einstellungen wurden gespeichert.");
    }

    loadProfile();
}

document.addEventListener("DOMContentLoaded", function () {
    safeApplyTranslations();

    setupTabs();
    loadSettings();

    if (typeof applySavedTheme === "function") {
        applySavedTheme();
    }

    activateTabFromUrl();

    const profileForm = document.getElementById("profileForm");
    const settingsForm = document.getElementById("settingsForm");
    const changePasswordForm = document.getElementById("changePasswordForm");

    if (profileForm) {
        profileForm.addEventListener("submit", updateProfile);
    }

    if (settingsForm) {
        settingsForm.addEventListener("submit", saveSettings);
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", changePassword);
    }

    loadProfile();
});
