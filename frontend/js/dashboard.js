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

function statCardHtml(label, value, href) {
    const tagName = href ? "a" : "article";
    const hrefAttribute = href ? ` href="${dashboardEscapeHtml(href)}"` : "";

    return `
        <${tagName} class="dashboard-stat-card"${hrefAttribute}>
            <div class="dashboard-stat-value">${dashboardEscapeHtml(value)}</div>
            <div class="dashboard-stat-label">${dashboardEscapeHtml(label)}</div>
        </${tagName}>
    `;
}

function renderStats(container, stats, summary) {
    if (!container) {
        return;
    }

    container.innerHTML = stats.map((stat) => {
        return statCardHtml(stat.label, summary[stat.key] ?? 0, stat.href);
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
            { key: "my_items_count", label: "Meine Inserate", href: "my-items.html" },
            { key: "my_active_items_count", label: "Aktive Inserate", href: "my-items.html" },
            { key: "my_sold_items_count", label: "Verkaufte Inserate", href: "my-items.html" },
            { key: "my_orders_count", label: "Meine Käufe", href: "orders.html" },
            { key: "my_sales_count", label: "Meine Verkäufe", href: "sales.html" },
            { key: "my_open_sales_count", label: "Offene Verkaufsanfragen", href: "sales.html" },
            { key: "my_tickets_count", label: "Support-Tickets", href: "support.html" },
            { key: "my_open_tickets_count", label: "Offene Tickets", href: "support.html" }
        ];

        renderStats(userStatsGrid, userStats, data);

        if (Object.prototype.hasOwnProperty.call(data, "total_users")) {
            const adminStats = [
                { key: "total_users", label: "Nutzer gesamt" },
                { key: "total_items", label: "Inserate gesamt", href: "admin.html" },
                { key: "active_items", label: "Aktive Inserate", href: "admin.html" },
                { key: "sold_items", label: "Verkaufte Inserate", href: "admin.html" },
                { key: "total_orders", label: "Kaufanfragen gesamt" },
                { key: "open_orders", label: "Offene Kaufanfragen" },
                { key: "total_tickets", label: "Tickets gesamt", href: "support.html" },
                { key: "open_tickets", label: "Offene Tickets", href: "support.html" }
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
