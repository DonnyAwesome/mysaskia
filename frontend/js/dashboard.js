const DASHBOARD_API_BASE_URL = "http://127.0.0.1:5000/api";

function getDashboardToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function dashboardEscapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function statCardHtml(label, value) {
    return `
        <article class="dashboard-stat-card">
            <div class="dashboard-stat-value">${dashboardEscapeHtml(value)}</div>
            <div class="dashboard-stat-label">${dashboardEscapeHtml(label)}</div>
        </article>
    `;
}

function renderStats(container, stats, summary) {
    if (!container) {
        return;
    }

    container.innerHTML = stats.map((stat) => {
        return statCardHtml(stat.label, summary[stat.key] ?? 0);
    }).join("");
}

async function loadDashboardSummary() {
    const token = getDashboardToken();
    const message = document.getElementById("dashboardMessage");
    const userStatsGrid = document.getElementById("userStatsGrid");
    const adminStatsSection = document.getElementById("adminStatsSection");
    const adminStatsGrid = document.getElementById("adminStatsGrid");

    if (!userStatsGrid) {
        return;
    }

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (adminStatsSection) {
        adminStatsSection.style.display = "none";
    }

    userStatsGrid.innerHTML = `<div class="empty-state">Statistik wird geladen...</div>`;

    try {
        const response = await fetch(`${DASHBOARD_API_BASE_URL}/dashboard/summary`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            userStatsGrid.innerHTML = "";

            if (message) {
                message.textContent = data.error || data.message || "Dashboard-Zahlen konnten nicht geladen werden.";
                message.className = "status-message error";
            }

            if (response.status === 401) {
                window.location.href = "login.html";
            }

            return;
        }

        if (message) {
            message.textContent = "";
            message.className = "status-message";
        }

        const userStats = [
            { key: "my_items_count", label: "Meine Inserate" },
            { key: "my_active_items_count", label: "Aktive Inserate" },
            { key: "my_sold_items_count", label: "Verkaufte Inserate" },
            { key: "my_orders_count", label: "Meine Käufe" },
            { key: "my_sales_count", label: "Meine Verkäufe" },
            { key: "my_open_sales_count", label: "Offene Verkaufsanfragen" },
            { key: "my_tickets_count", label: "Meine Tickets" },
            { key: "my_open_tickets_count", label: "Offene Tickets" }
        ];

        renderStats(userStatsGrid, userStats, data);

        if (Object.prototype.hasOwnProperty.call(data, "total_users")) {
            const adminStats = [
                { key: "total_users", label: "Nutzer" },
                { key: "total_items", label: "Inserate gesamt" },
                { key: "active_items", label: "Aktive Inserate" },
                { key: "sold_items", label: "Verkaufte Inserate" },
                { key: "total_orders", label: "Kaufanfragen gesamt" },
                { key: "open_orders", label: "Offene Kaufanfragen" },
                { key: "total_tickets", label: "Tickets gesamt" },
                { key: "open_tickets", label: "Offene Tickets" }
            ];

            if (adminStatsSection) {
                adminStatsSection.style.display = "block";
            }

            renderStats(adminStatsGrid, adminStats, data);
        }
    } catch (error) {
        userStatsGrid.innerHTML = "";

        if (message) {
            message.textContent = "Server nicht erreichbar. Läuft dein Flask-Backend?";
            message.className = "status-message error";
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.page === "dashboard") {
        loadDashboardSummary();
    }
});
