const API_URL = "http://127.0.0.1:5000/api";

let token = localStorage.getItem("token") || null;

async function authFetch(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }

    if (token) {
        options.headers["Authorization"] = "Bearer " + token;
    }

    const response = await fetch(url, options);

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    return {
        ok: response.ok,
        status: response.status,
        data: data
    };
}

async function login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await response.json();

    if (response.ok) {
        token = data.token;

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        window.location.href = "dashboard.html";
    } else {
        alert(data.message || "Login fehlgeschlagen.");
    }
}

async function register(firstName, lastName, email, password) {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password
        })
    });

    const data = await response.json();

    if (response.ok) {
        alert("Registrierung erfolgreich. Du kannst dich jetzt einloggen.");
        window.location.href = "login.html";
    } else {
        alert(data.message || "Registrierung fehlgeschlagen.");
    }
}

function getLoggedInUser() {
    const userText = localStorage.getItem("user");

    if (!userText) {
        return null;
    }

    try {
        return JSON.parse(userText);
    } catch (error) {
        return null;
    }
}

function isAdmin() {
    const user = getLoggedInUser();

    if (!user) {
        return false;
    }

    return user.is_admin === true || user.is_admin === 1;
}

function protectDashboard() {
    const isDashboard = document.body.classList.contains("dashboard-page");

    if (!isDashboard) {
        return;
    }

    if (!token) {
        alert("Du musst eingeloggt sein, um das Dashboard zu sehen.");
        window.location.href = "login.html";
        return;
    }

    const user = getLoggedInUser();

    if (!user) {
        alert("Login-Daten fehlen. Bitte erneut einloggen.");
        logout();
        return;
    }

    const welcomeText = document.getElementById("welcomeText");
    const adminInfo = document.getElementById("adminInfo");

    if (welcomeText) {
        welcomeText.textContent = `Willkommen, ${user.first_name || ""} ${user.last_name || ""} (${user.email})`;
    }

    if (adminInfo) {
        if (isAdmin()) {
            adminInfo.innerHTML = `<span class="admin-badge">ADMIN-MODUS AKTIV</span>`;
        } else {
            adminInfo.textContent = "Du bist als normaler Benutzer angemeldet.";
        }
    }
}

function protectSupportPage() {
    const isSupport = document.body.classList.contains("support-page");

    if (!isSupport) {
        return;
    }

    if (!token) {
        alert("Du musst eingeloggt sein, um Support-Tickets zu nutzen.");
        window.location.href = "login.html";
        return;
    }

    const adminTicketsSection = document.getElementById("adminTicketsSection");

    if (adminTicketsSection && !isAdmin()) {
        adminTicketsSection.style.display = "none";
    }
}

async function loadAccounts() {
    const container = document.getElementById("accountsList");

    if (!container) {
        return;
    }

    container.innerHTML = "<p>Accounts werden geladen...</p>";

    const result = await authFetch(`${API_URL}/accounts`);

    if (!result.ok) {
        container.innerHTML = "<p>Accounts konnten nicht geladen werden. Bitte neu einloggen.</p>";
        return;
    }

    const accounts = result.data;

    container.innerHTML = "";

    if (!Array.isArray(accounts) || accounts.length === 0) {
        container.innerHTML = "<p>Keine Accounts gefunden.</p>";
        return;
    }

    accounts.forEach(function(account) {
        const card = document.createElement("div");
        card.className = "account-card";

        const topLine = document.createElement("div");
        topLine.className = "account-topline";

        const nameLine = document.createElement("strong");
        nameLine.textContent = account.first_name + " " + account.last_name;

        topLine.appendChild(nameLine);

        if (account.is_admin === true || account.is_admin === 1) {
            const badge = document.createElement("span");
            badge.className = "admin-badge";
            badge.textContent = "ADMIN";
            topLine.appendChild(badge);
        }

        const emailLine = document.createElement("p");
        emailLine.textContent = account.email;

        const idLine = document.createElement("small");
        idLine.textContent = "User-ID: " + account.id;

        card.appendChild(topLine);
        card.appendChild(emailLine);
        card.appendChild(idLine);

        const accountIsAdmin = account.is_admin === true || account.is_admin === 1;

        if (isAdmin() && !accountIsAdmin) {
            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Account löschen";
            deleteButton.onclick = function() {
                deleteAccount(account.id);
            };

            card.appendChild(document.createElement("br"));
            card.appendChild(deleteButton);
        }

        if (isAdmin() && accountIsAdmin) {
            const protectedText = document.createElement("p");
            protectedText.className = "protected-text";
            protectedText.textContent = "Dieser Admin-Account ist geschützt.";
            card.appendChild(protectedText);
        }

        container.appendChild(card);
    });
}

async function deleteAccount(accountId) {
    const confirmed = confirm("Willst du diesen Account wirklich löschen?");

    if (!confirmed) {
        return;
    }

    const result = await authFetch(`${API_URL}/delete_account`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: accountId
        })
    });

    if (result.ok) {
        alert("Account wurde gelöscht.");
        loadAccounts();
    } else {
        alert(result.data.message || "Account konnte nicht gelöscht werden.");
    }
}

async function createTicket(subject, message) {
    const result = await authFetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            subject: subject,
            message: message
        })
    });

    if (result.ok) {
        alert("Ticket wurde erstellt.");
        loadMyTickets();

        if (isAdmin()) {
            loadAllTickets();
        }
    } else {
        alert(result.data.message || "Ticket konnte nicht erstellt werden.");
    }
}

async function loadMyTickets() {
    const container = document.getElementById("myTicketsList");

    if (!container) {
        return;
    }

    container.innerHTML = "<p>Tickets werden geladen...</p>";

    const result = await authFetch(`${API_URL}/my_tickets`);

    if (!result.ok) {
        container.innerHTML = "<p>Tickets konnten nicht geladen werden.</p>";
        return;
    }

    const tickets = result.data;

    container.innerHTML = "";

    if (!Array.isArray(tickets) || tickets.length === 0) {
        container.innerHTML = "<p>Du hast noch keine Tickets erstellt.</p>";
        return;
    }

    tickets.forEach(function(ticket) {
        const card = document.createElement("div");
        card.className = "account-card";

        card.innerHTML = `
            <div class="account-topline">
                <strong>${ticket.subject}</strong>
                <span class="admin-badge">${ticket.status}</span>
            </div>
            <p>${ticket.message}</p>
            <small>Erstellt am: ${ticket.created_at}</small>
        `;

        container.appendChild(card);
    });
}

async function loadAllTickets() {
    const container = document.getElementById("allTicketsList");

    if (!container) {
        return;
    }

    if (!isAdmin()) {
        container.innerHTML = "<p>Nur Admins können alle Tickets sehen.</p>";
        return;
    }

    container.innerHTML = "<p>Alle Tickets werden geladen...</p>";

    const result = await authFetch(`${API_URL}/admin/tickets`);

    if (!result.ok) {
        container.innerHTML = "<p>Alle Tickets konnten nicht geladen werden.</p>";
        return;
    }

    const tickets = result.data;

    container.innerHTML = "";

    if (!Array.isArray(tickets) || tickets.length === 0) {
        container.innerHTML = "<p>Keine Tickets gefunden.</p>";
        return;
    }

    tickets.forEach(function(ticket) {
        const card = document.createElement("div");
        card.className = "account-card";

        card.innerHTML = `
            <div class="account-topline">
                <strong>${ticket.subject}</strong>
                <span class="admin-badge">${ticket.status}</span>
            </div>
            <p>${ticket.message}</p>
            <p><strong>Von:</strong> ${ticket.first_name} ${ticket.last_name} (${ticket.email})</p>
            <small>Erstellt am: ${ticket.created_at}</small>
            <br>
            <button onclick="changeTicketStatus(${ticket.id}, 'offen')">Offen</button>
            <button onclick="changeTicketStatus(${ticket.id}, 'in_bearbeitung')">In Bearbeitung</button>
            <button onclick="changeTicketStatus(${ticket.id}, 'geloest')">Gelöst</button>
        `;

        container.appendChild(card);
    });
}

async function changeTicketStatus(ticketId, newStatus) {
    const result = await authFetch(`${API_URL}/admin/tickets/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ticket_id: ticketId,
            status: newStatus
        })
    });

    if (result.ok) {
        alert("Ticket-Status wurde geändert.");
        loadMyTickets();
        loadAllTickets();
    } else {
        alert(result.data.message || "Status konnte nicht geändert werden.");
    }
}

function logout() {
    token = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", function() {
    protectDashboard();
    protectSupportPage();

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();

            login(
                loginForm.email.value,
                loginForm.password.value
            );
        });
    }

    const regForm = document.getElementById("regForm");

    if (regForm) {
        regForm.addEventListener("submit", function(event) {
            event.preventDefault();

            register(
                regForm.first_name.value,
                regForm.last_name.value,
                regForm.email.value,
                regForm.password.value
            );
        });
    }

    const accountsButton = document.getElementById("loadAccountsBtn");

    if (accountsButton) {
        accountsButton.addEventListener("click", loadAccounts);
    }

    const ticketForm = document.getElementById("ticketForm");

    if (ticketForm) {
        ticketForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const subject = document.getElementById("ticketSubject").value;
            const message = document.getElementById("ticketMessage").value;

            createTicket(subject, message);

            ticketForm.reset();
        });

        loadMyTickets();

        if (isAdmin()) {
            loadAllTickets();
        }
    }
});
