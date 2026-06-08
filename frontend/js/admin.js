const ADMIN_API_BASE_URL = "http://127.0.0.1:5000/api";

function getAdminToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function escapeAdminHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatAdminPrice(price) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
    }).format(Number(price) || 0);
}

function formatAdminDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value || "";
    }

    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function adminStateHtml(title, text, type = "") {
    return `
        <div class="empty-state ${type}">
            <div class="empty-state-icon">${type === "loading-state" ? "..." : type === "error-state" ? "!" : "Admin"}</div>
            <strong>${escapeAdminHtml(title)}</strong>
            ${text ? `<p>${escapeAdminHtml(text)}</p>` : ""}
        </div>
    `;
}

function adminCardHtml(title, rows, actions = "") {
    return `
        <article class="review-card">
            <div class="review-card-header">
                <strong>${escapeAdminHtml(title)}</strong>
            </div>
            <dl class="admin-detail-list">
                ${rows.map((row) => `
                    <div>
                        <dt>${escapeAdminHtml(row.label)}</dt>
                        <dd>${escapeAdminHtml(row.value)}</dd>
                    </div>
                `).join("")}
            </dl>
            ${actions}
        </article>
    `;
}

async function adminFetch(path, options = {}) {
    const token = getAdminToken();

    const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            "Authorization": `Bearer ${token}`
        }
    });
    const data = await response.json();

    if (response.status === 401) {
        window.location.href = "login.html";
    }

    return { response, data };
}

function setAdminAccessDenied(message, text) {
    const adminMessage = document.getElementById("adminMessage");

    if (adminMessage) {
        adminMessage.innerHTML = adminStateHtml(message, text, "error-state");
        adminMessage.className = "status-message";
    }

    [
        "adminOverviewSection",
        "adminUsersSection",
        "adminItemsSection",
        "adminTicketsSection",
        "adminOrdersSection"
    ].forEach((sectionId) => {
        const section = document.getElementById(sectionId);

        if (section) {
            section.style.display = "none";
        }
    });
}

function renderOverview(users, items, tickets, orders) {
    const container = document.getElementById("adminOverviewGrid");

    if (!container) {
        return;
    }

    const openTickets = tickets.filter((ticket) => ticket.status !== "geloest").length;
    const openOrders = orders.filter((order) => order.status === "angefragt").length;

    container.innerHTML = [
        ["Nutzer", users.length],
        ["Inserate", items.length],
        ["Support-Tickets", tickets.length],
        ["Offene Tickets", openTickets],
        ["Orders", orders.length],
        ["Offene Orders", openOrders]
    ].map(([label, value]) => `
        <article class="dashboard-stat-card">
            <div class="dashboard-stat-value">${escapeAdminHtml(value)}</div>
            <div class="dashboard-stat-label">${escapeAdminHtml(label)}</div>
        </article>
    `).join("");
}

function renderUsers(users) {
    const container = document.getElementById("adminUsersList");

    if (!container) {
        return;
    }

    container.innerHTML = users.length
        ? users.map((user) => adminCardHtml(
            `${user.first_name} ${user.last_name}`,
            [
                { label: "ID", value: user.id },
                { label: "E-Mail", value: user.email },
                { label: "Admin", value: user.is_admin === true || user.is_admin === 1 ? "Ja" : "Nein" },
                { label: "Erstellt am", value: formatAdminDate(user.created_at) }
            ]
        )).join("")
        : adminStateHtml("Keine Nutzer gefunden", "");
}

function renderItems(items) {
    const container = document.getElementById("adminItemsList");

    if (!container) {
        return;
    }

    container.innerHTML = items.length
        ? items.map((item) => adminCardHtml(
            item.title,
            [
                { label: "Tierart", value: item.species || "-" },
                { label: "Rasse", value: item.breed || "-" },
                { label: "Preis", value: formatAdminPrice(item.price) },
                { label: "Status", value: item.status },
                { label: "Verkäufer", value: item.seller_name || item.seller_email || "-" },
                { label: "Erstellt am", value: formatAdminDate(item.created_at) }
            ],
            `<div class="item-card-actions">
                <a class="btn secondary" href="item.html?id=${encodeURIComponent(item.id)}">Details öffnen</a>
            </div>`
        )).join("")
        : adminStateHtml("Keine Inserate vorhanden", "");
}

function ticketStatusControls(ticket) {
    const statuses = ["offen", "in_bearbeitung", "geloest"];

    return `
        <div class="admin-status-row">
            <select id="adminTicketStatus-${ticket.id}">
                ${statuses.map((status) => `
                    <option value="${status}" ${ticket.status === status ? "selected" : ""}>${status}</option>
                `).join("")}
            </select>
            <button class="btn" type="button" onclick="updateAdminTicketStatus(${ticket.id})">Status speichern</button>
        </div>
        <div id="adminTicketMessage-${ticket.id}" class="status-message"></div>
    `;
}

function renderTickets(tickets) {
    const container = document.getElementById("adminTicketsList");

    if (!container) {
        return;
    }

    container.innerHTML = tickets.length
        ? tickets.map((ticket) => adminCardHtml(
            ticket.subject,
            [
                { label: "ID", value: ticket.id },
                { label: "Von", value: `${ticket.first_name} ${ticket.last_name} (${ticket.email})` },
                { label: "Status", value: ticket.status },
                { label: "Nachricht", value: ticket.message },
                { label: "Erstellt am", value: formatAdminDate(ticket.created_at) }
            ],
            ticketStatusControls(ticket)
        )).join("")
        : adminStateHtml("Keine Tickets gefunden", "");
}

function renderOrders(orders) {
    const container = document.getElementById("adminOrdersList");

    if (!container) {
        return;
    }

    container.innerHTML = orders.length
        ? orders.map((order) => adminCardHtml(
            order.item_title,
            [
                { label: "ID", value: order.id },
                { label: "Käufer", value: order.buyer_name || order.buyer_email || "-" },
                { label: "Verkäufer", value: order.seller_name || order.seller_email || "-" },
                { label: "Status", value: order.status },
                { label: "Erstellt am", value: formatAdminDate(order.created_at) }
            ]
        )).join("")
        : adminStateHtml("Keine Orders gefunden", "");
}

async function updateAdminTicketStatus(ticketId) {
    const select = document.getElementById(`adminTicketStatus-${ticketId}`);
    const message = document.getElementById(`adminTicketMessage-${ticketId}`);

    if (!select) {
        return;
    }

    try {
        const { response, data } = await adminFetch("/admin/tickets/status", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticket_id: ticketId,
                status: select.value
            })
        });

        if (message) {
            message.textContent = data.error || data.message || "";
            message.className = `status-message ${response.ok ? "success" : "error"}`;
        }
    } catch (error) {
        if (message) {
            message.textContent = "Server nicht erreichbar.";
            message.className = "status-message error";
        }
    }
}

async function setupAdminPage() {
    const token = getAdminToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const loadingHtml = adminStateHtml("Admin-Daten werden geladen", "Einen Moment bitte.", "loading-state");
    ["adminUsersList", "adminItemsList", "adminTicketsList", "adminOrdersList"].forEach((containerId) => {
        const container = document.getElementById(containerId);

        if (container) {
            container.innerHTML = loadingHtml;
        }
    });

    try {
        const profileResult = await adminFetch("/profile");

        if (!profileResult.response.ok) {
            setAdminAccessDenied(
                "Admin-Bereich nicht verfügbar",
                profileResult.data.error || profileResult.data.message || "Bitte melde dich erneut an."
            );
            return;
        }

        const profile = profileResult.data;

        if (!(profile.is_admin === true || profile.is_admin === 1)) {
            setAdminAccessDenied(
                "Keine Admin-Rechte",
                "Diese Seite ist nur für Administratoren verfügbar."
            );
            return;
        }

        const [usersResult, itemsResult, ticketsResult, ordersResult] = await Promise.all([
            adminFetch("/accounts"),
            adminFetch("/admin/items"),
            adminFetch("/admin/tickets"),
            adminFetch("/admin/orders")
        ]);

        const results = [usersResult, itemsResult, ticketsResult, ordersResult];
        const forbiddenResult = results.find((result) => result.response.status === 403);

        if (forbiddenResult) {
            setAdminAccessDenied(
                "Keine Admin-Rechte",
                forbiddenResult.data.error || forbiddenResult.data.message || "Diese Seite ist nur für Administratoren verfügbar."
            );
            return;
        }

        const failedResult = results.find((result) => !result.response.ok);

        if (failedResult) {
            setAdminAccessDenied(
                "Admin-Daten konnten nicht geladen werden",
                failedResult.data.error || failedResult.data.message || "Bitte versuche es erneut."
            );
            return;
        }

        const users = Array.isArray(usersResult.data) ? usersResult.data : [];
        const items = Array.isArray(itemsResult.data.items) ? itemsResult.data.items : [];
        const tickets = Array.isArray(ticketsResult.data) ? ticketsResult.data : [];
        const orders = Array.isArray(ordersResult.data.orders) ? ordersResult.data.orders : [];

        renderOverview(users, items, tickets, orders);
        renderUsers(users);
        renderItems(items);
        renderTickets(tickets);
        renderOrders(orders);
    } catch (error) {
        setAdminAccessDenied(
            "Server nicht erreichbar",
            "Prüfe, ob das Flask-Backend läuft."
        );
    }
}

document.addEventListener("DOMContentLoaded", setupAdminPage);
