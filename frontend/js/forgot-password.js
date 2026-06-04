const PASSWORD_RESET_API_URL = "http://127.0.0.1:5000/api/password-reset";

function showForgotPasswordMessage(text, type = "", resetToken = "") {
    const message = document.getElementById("forgotPasswordMessage");

    if (!message) {
        return;
    }

    message.className = `auth-message ${type}`.trim();
    message.textContent = text;

    if (resetToken) {
        const linkParagraph = document.createElement("p");
        const resetLink = document.createElement("a");
        resetLink.href = `reset-password.html?token=${encodeURIComponent(resetToken)}`;
        resetLink.textContent = "Passwort jetzt zurücksetzen";
        linkParagraph.appendChild(resetLink);
        message.appendChild(linkParagraph);
    }
}

async function requestPasswordReset(email) {
    const button = document.getElementById("requestResetButton");

    if (button) {
        button.disabled = true;
        button.textContent = "Reset wird vorbereitet...";
    }

    try {
        const response = await fetch(`${PASSWORD_RESET_API_URL}/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });
        const data = await response.json();

        if (!response.ok) {
            showForgotPasswordMessage(data.message || "Reset konnte nicht vorbereitet werden.", "error");
            return;
        }

        showForgotPasswordMessage(
            data.message || "Wenn die E-Mail existiert, wurde ein Reset vorbereitet.",
            "success",
            data.reset_token || ""
        );
    } catch (error) {
        showForgotPasswordMessage("Server nicht erreichbar. Läuft dein Flask-Backend?", "error");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Reset-Link anfordern";
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("forgotPasswordForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        requestPasswordReset(form.email.value.trim());
    });
});
