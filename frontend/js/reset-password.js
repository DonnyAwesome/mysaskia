const PASSWORD_RESET_CONFIRM_API_URL = "http://127.0.0.1:5000/api/password-reset/confirm";

function showResetPasswordMessage(text, type = "", showLoginLink = false) {
    const message = document.getElementById("resetPasswordMessage");

    if (!message) {
        return;
    }

    message.className = `auth-message ${type}`.trim();
    message.textContent = text;

    if (showLoginLink) {
        const linkParagraph = document.createElement("p");
        const loginLink = document.createElement("a");
        loginLink.href = "login.html";
        loginLink.textContent = "Jetzt einloggen";
        linkParagraph.appendChild(loginLink);
        message.appendChild(linkParagraph);
    }
}

async function confirmPasswordReset(token, newPassword) {
    const button = document.getElementById("confirmResetButton");

    if (button) {
        button.disabled = true;
        button.textContent = "Passwort wird gespeichert...";
    }

    try {
        const response = await fetch(PASSWORD_RESET_CONFIRM_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token,
                new_password: newPassword
            })
        });
        const data = await response.json();

        if (!response.ok) {
            showResetPasswordMessage(data.message || "Passwort konnte nicht geändert werden.", "error");
            return;
        }

        const form = document.getElementById("resetPasswordForm");

        if (form) {
            form.classList.add("hidden");
        }

        showResetPasswordMessage(data.message || "Passwort wurde erfolgreich geändert.", "success", true);
    } catch (error) {
        showResetPasswordMessage("Server nicht erreichbar. Läuft dein Flask-Backend?", "error");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Neues Passwort speichern";
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("resetPasswordForm");
    const tokenInput = document.getElementById("resetToken");

    if (!form || !tokenInput) {
        return;
    }

    tokenInput.value = new URLSearchParams(window.location.search).get("token") || "";

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const newPassword = form.new_password.value;
        const confirmPassword = form.confirm_password.value;

        if (newPassword.length < 6) {
            showResetPasswordMessage("Das neue Passwort muss mindestens 6 Zeichen lang sein.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showResetPasswordMessage("Die Passwörter stimmen nicht überein.", "error");
            return;
        }

        confirmPasswordReset(form.token.value.trim(), newPassword);
    });
});
