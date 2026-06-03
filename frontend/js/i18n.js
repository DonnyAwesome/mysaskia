const translations = {
    de: {
        navHome: "Home",
        navAbout: "Über mich",
        navSupport: "Support",
        navProfile: "Profil",
        navDashboard: "Dashboard",
        navLogin: "Login",
        navLogout: "Logout",

dashboardTitle: "Dashboard",
dashboardWelcome: "Willkommen.",
dashboardProfileTitle: "Mein Profil",
dashboardProfileText: "Verwalte deine persönlichen Daten, deinen Namen und deine Kontoeinstellungen.",
dashboardViewProfile: "Profil ansehen",
dashboardEditProfile: "Profil bearbeiten",
dashboardSettings: "Einstellungen",
dashboardAccountTitle: "Account-Verwaltung",
dashboardAccountText: "Admin-Bereich zum Anzeigen und Verwalten von Accounts.",
dashboardLoadAccounts: "Alle Accounts anzeigen",

supportTitle: "Support-Tickets",
supportSubtitle: "Erstelle neue Support-Anfragen und verfolge deine bestehenden Tickets.",
supportCreateTitle: "Neues Ticket erstellen",
supportSubjectLabel: "Betreff",
supportSubjectPlaceholder: "Betreff",
supportMessageLabel: "Nachricht",
supportMessagePlaceholder: "Nachricht",
supportCreateButton: "Ticket erstellen",
supportMyTicketsTitle: "Meine Tickets",
supportNoTicketsLoaded: "Noch keine Tickets geladen.",
supportAllTicketsTitle: "Alle Tickets (Admin)",
supportAdminOnly: "Nur sichtbar für Admins.",

loginTitle: "Login",
loginSubtitle: "Bitte melde dich mit deiner E-Mail und deinem Passwort an, um auf dein Dashboard zuzugreifen.",
password: "Passwort",
loginButton: "Login",
noAccountYet: "Noch kein Account?",
registerHere: "Hier registrieren",

loginBrandText: "Dein persönlicher Bereich für Profil, Support und Account-Verwaltung.",
forgotPassword: "Passwort vergessen?",
comingSoon: "Kommt später",

homeHeroTitle: "Willkommen bei MySaskia",
homeHeroText: "Dein persönlicher Bereich für Profil, Support-Tickets, Einstellungen und Account-Verwaltung.",
homeLoginButton: "Einloggen",
homeRegisterButton: "Account erstellen",
homeAboutTitle: "Was ist MySaskia?",
homeAboutText: "MySaskia ist ein lokales Server-Lernprojekt mit Apache, Flask, REST API, SQLite, Login-System, Profilen, Admin-Rechten und Support-Tickets.",
homeFeaturesTitle: "Funktionen",
homeFeatureProfileTitle: "Profil",
homeFeatureProfileText: "Verwalte deine persönlichen Daten und Einstellungen.",
homeFeatureSupportTitle: "Support",
homeFeatureSupportText: "Erstelle Tickets und verfolge den Bearbeitungsstatus.",
homeFeatureAdminTitle: "Admin",
homeFeatureAdminText: "Verwalte Accounts und Support-Anfragen im Admin-Bereich.",

loginAreaTitle: "Zugang",
loginAreaSubtitle: "Melde dich an oder erstelle einen neuen Account.",
registerButton: "Registrieren",
alreadyRegistered: "Schon registriert?",
loginHere: "Hier einloggen",

tabSecurity: "Sicherheit",
securityTitle: "Sicherheit",
securityDescription: "Ändere hier dein Passwort.",
currentPassword: "Aktuelles Passwort",
newPassword: "Neues Passwort",
confirmPassword: "Neues Passwort wiederholen",
changePasswordButton: "Passwort ändern",
passwordFieldsRequired: "Bitte alle Passwort-Felder ausfüllen.",
passwordTooShort: "Das neue Passwort muss mindestens 6 Zeichen lang sein.",
passwordsDoNotMatch: "Die neuen Passwörter stimmen nicht überein.",
changePasswordSuccess: "Passwort wurde geändert.",
changePasswordError: "Passwort konnte nicht geändert werden.",

        profileTitle: "Mein Profil",
        profileSubtitle: "Verwalte deine Account-Daten und persönlichen Einstellungen.",

        tabOverview: "Übersicht",
        tabEditProfile: "Profil bearbeiten",
        tabSettings: "Einstellungen",

        overviewTitle: "Account-Übersicht",
        firstName: "Vorname",
        lastName: "Nachname",
        email: "E-Mail",
        role: "Rolle",
        createdAt: "Erstellt am",

        editTitle: "Profil bearbeiten",
        editDescription: "Du kannst hier deinen Vor- und Nachnamen ändern.",
        saveProfileButton: "Profil speichern",

        settingsTitle: "Einstellungen",
        settingsDescription: "Hier kannst du persönliche Einstellungen für dein Konto auswählen.",
        language: "Sprache",
        german: "Deutsch",
        english: "Englisch",
        design: "Design",
        systemDefault: "Systemstandard",
        light: "Hell",
        dark: "Dunkel",
        saveSettingsButton: "Einstellungen speichern",

        profileSaved: "Profil wurde gespeichert.",
        settingsSaved: "Einstellungen wurden gespeichert.",
        profileLoadError: "Profil konnte nicht geladen werden.",
        profileSaveError: "Profil konnte nicht gespeichert werden.",
        serverError: "Fehler beim Verbinden mit dem Server.",
        requiredNameError: "Bitte Vorname und Nachname ausfüllen."
    },

    en: {
        navHome: "Home",
        navAbout: "About me",
        navSupport: "Support",
        navProfile: "Profile",
        navDashboard: "Dashboard",
        navLogin: "Login",
        navLogout: "Logout",

dashboardTitle: "Dashboard",
dashboardWelcome: "Welcome.",
dashboardProfileTitle: "My Profile",
dashboardProfileText: "Manage your personal data, name and account settings.",
dashboardViewProfile: "View profile",
dashboardEditProfile: "Edit profile",
dashboardSettings: "Settings",
dashboardAccountTitle: "Account Management",
dashboardAccountText: "Admin area for viewing and managing accounts.",
dashboardLoadAccounts: "Show all accounts",

supportTitle: "Support tickets",
supportSubtitle: "Create new support requests and track your existing tickets.",
supportCreateTitle: "Create new ticket",
supportSubjectLabel: "Subject",
supportSubjectPlaceholder: "Subject",
supportMessageLabel: "Message",
supportMessagePlaceholder: "Message",
supportCreateButton: "Create ticket",
supportMyTicketsTitle: "My tickets",
supportNoTicketsLoaded: "No tickets loaded yet.",
supportAllTicketsTitle: "All tickets (Admin)",
supportAdminOnly: "Only visible for admins.",

loginTitle: "Login",
loginSubtitle: "Please sign in with your email and password to access your dashboard.",
password: "Password",
loginButton: "Login",
noAccountYet: "No account yet?",
registerHere: "Register here",

loginBrandText: "Your personal area for profile, support and account management.",
forgotPassword: "Forgot password?",
comingSoon: "Coming soon",

homeHeroTitle: "Welcome to MySaskia",
homeHeroText: "Your personal area for profile, support tickets, settings and account management.",
homeLoginButton: "Sign in",
homeRegisterButton: "Create account",
homeAboutTitle: "What is MySaskia?",
homeAboutText: "MySaskia is a local server learning project with Apache, Flask, REST API, SQLite, login system, profiles, admin permissions and support tickets.",
homeFeaturesTitle: "Features",
homeFeatureProfileTitle: "Profile",
homeFeatureProfileText: "Manage your personal data and settings.",
homeFeatureSupportTitle: "Support",
homeFeatureSupportText: "Create tickets and track their processing status.",
homeFeatureAdminTitle: "Admin",
homeFeatureAdminText: "Manage accounts and support requests in the admin area.",

loginAreaTitle: "Access",
loginAreaSubtitle: "Sign in or create a new account.",
registerButton: "Register",
alreadyRegistered: "Already registered?",
loginHere: "Sign in here",

tabSecurity: "Security",
securityTitle: "Security",
securityDescription: "Change your password here.",
currentPassword: "Current password",
newPassword: "New password",
confirmPassword: "Repeat new password",
changePasswordButton: "Change password",
passwordFieldsRequired: "Please fill in all password fields.",
passwordTooShort: "The new password must be at least 6 characters long.",
passwordsDoNotMatch: "The new passwords do not match.",
changePasswordSuccess: "Password changed.",
changePasswordError: "Password could not be changed.",

        profileTitle: "My Profile",
        profileSubtitle: "Manage your account data and personal settings.",

        tabOverview: "Overview",
        tabEditProfile: "Edit profile",
        tabSettings: "Settings",

        overviewTitle: "Account Overview",
        firstName: "First name",
        lastName: "Last name",
        email: "Email",
        role: "Role",
        createdAt: "Created at",

        editTitle: "Edit Profile",
        editDescription: "You can change your first and last name here.",
        saveProfileButton: "Save profile",

        settingsTitle: "Settings",
        settingsDescription: "Choose your personal account settings here.",
        language: "Language",
        german: "German",
        english: "English",
        design: "Theme",
        systemDefault: "System default",
        light: "Light",
        dark: "Dark",
        saveSettingsButton: "Save settings",

        profileSaved: "Profile saved.",
        settingsSaved: "Settings saved.",
        profileLoadError: "Profile could not be loaded.",
        profileSaveError: "Profile could not be saved.",
        serverError: "Could not connect to the server.",
        requiredNameError: "Please fill in first name and last name."
    }
};

function getLanguage() {
    return localStorage.getItem("language") || "de";
}

function setLanguage(language) {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
}

function t(key) {
    const language = getLanguage();

    if (translations[language] && translations[language][key]) {
        return translations[language][key];
    }

    if (translations.de[key]) {
        return translations.de[key];
    }

    return key;
}

function applyTranslations() {
    document.documentElement.lang = getLanguage();

    const textElements = document.querySelectorAll("[data-i18n]");

    textElements.forEach(function (element) {
        const key = element.getAttribute("data-i18n");
        element.textContent = t(key);
    });

    const placeholderElements = document.querySelectorAll("[data-i18n-placeholder]");

    placeholderElements.forEach(function (element) {
        const key = element.getAttribute("data-i18n-placeholder");
        element.placeholder = t(key);
    });
}
