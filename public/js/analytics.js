import { getStallId, getIdFromToken, formatHour } from "./helper.js";

const kpiElements = {
    totalRevenue: document.getElementById("kpi-revenue"),
    orderCount: document.getElementById("kpi-orders"),
    averageOrderValue: document.getElementById("kpi-aov"),
};
const summaryItems = {
    highlights: document.getElementById("ai-highlights"),
    flags: document.getElementById("ai-flags"),
    actions: document.getElementById("ai-actions"),
};

const maxMenuItemCount = document.getElementById("max-menu-item");

const token = localStorage.getItem(LS_KEYS.authToken);
const vendorId = await getIdFromToken(token);
const stallId = await getStallId(vendorId, token);

async function fetchAPI(url) {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        return await response.json();
    } catch (err) {
        console.error(err);
    }
}

function createSalesChart(hourlySales) {
    let labels = [];
    let data = [];
    hourlySales.forEach((item) => {
        labels.push(formatHour(item.sales_hour));
        data.push(item.totalRevenue.toFixed(2));
    });

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = "#64748b";

    const ctxHourly = document
        .getElementById("hourlySalesChart")
        .getContext("2d");
    new Chart(ctxHourly, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Sales ($)",
                    data,
                    backgroundColor: "#0f172a",
                    borderRadius: 4,
                    borderSkipped: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    titleFont: { family: "'Inter', sans-serif" },
                    bodyFont: { family: "'IBM Plex Mono', monospace" },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { family: "'IBM Plex Mono', monospace", size: 11 },
                        callback: function(value) {
                            return "$" + value;
                        },
                    },
                    grid: { color: "#f1f5f9" },
                    border: { dash: [4, 4], display: false },
                },
                x: {
                    ticks: {
                        font: { family: "'IBM Plex Mono', monospace", size: 11 },
                    },
                    grid: { display: false },
                    border: { display: false },
                },
            },
        },
    });
}

function createTopItemsChart(topItems) {
    const limit = 3;
    maxMenuItemCount.textContent = Math.min(limit, topItems.length);
    let others = {
        itemName: "Others",
        totalSold: 0,
        totalRevenue: 0,
    };
    for (let i = limit; i < topItems.length; i++) {
        others.totalSold += topItems[i].totalSold;
        others.totalRevenue += topItems[i].totalRevenue;
    }
    let items = topItems.slice(0, limit);
    if (topItems.length > limit) items.push(others);

    let labels = [];
    let data = [];
    // TODO: add filter by top order count or top revenue
    items.forEach((item) => {
        labels.push(item.itemName);
        data.push(item.totalSold);
    });

    const ctxTopItems = document.getElementById("topItemsChart").getContext("2d");
    new Chart(ctxTopItems, {
        type: "doughnut",
        data: {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: [
                        "#0f172a",
                        "#334155",
                        "#64748b",
                        "#94a3b8",
                        "#cbd5e1",
                    ],
                    borderWidth: 2,
                    borderColor: "#ffffff",
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 8,
                        boxHeight: 8,
                        usePointStyle: true,
                        padding: 16,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12,
                        },
                    },
                },
                tooltip: {
                    titleFont: { family: "'Inter', sans-serif" },
                    bodyFont: { family: "'IBM Plex Mono', monospace" },
                },
            },
            cutout: "70%",
        },
    });
}

function loadKPI(kpiData) {
    for (const [item, container] of Object.entries(kpiElements)) {
        if (item == "orderCount") {
            container.textContent = kpiData[item];
        } else {
            container.textContent = "$" + kpiData[item].toFixed(2);
        }
    }
}

function loadAISummary(summary) {
    for (const [item, container] of Object.entries(summaryItems)) {
        const content = summary[item];
        container.innerHTML = marked.parse(content);
    }
}

async function loadUI() {
    const kpiData = await fetchAPI(`/vendor/analytics/kpi/${stallId}`);
    loadKPI(kpiData);

    const hourlySales = await fetchAPI(
        `/vendor/analytics/hourly-sales/${stallId}`,
    );
    createSalesChart(hourlySales ?? []);

    const topItems = await fetchAPI(`/vendor/analytics/top-items/${stallId}`);
    createTopItemsChart(topItems ?? []);

    const summary = await fetchAPI(`/vendor/analytics/ai-summary/${stallId}`);
    loadAISummary(summary);
}

document.onload = loadUI();
