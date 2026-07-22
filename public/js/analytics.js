import { getStallId, getIdFromToken, formatHour } from "./helper.js";

const kpiElements = {
    totalRevenue: document.getElementById("kpi-revenue"),
    orderCount: document.getElementById("kpi-orders"),
    averageOrderValue: document.getElementById("kpi-aov"),
};

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

function createTopItemsChart() {
    const ctxTopItems = document.getElementById("topItemsChart").getContext("2d");
    new Chart(ctxTopItems, {
        type: "doughnut",
        data: {
            labels: [
                "Chicken Rice",
                "Laksa",
                "Ice Lemon Tea",
                "Wonton Mee",
                "Spring Rolls",
            ],
            datasets: [
                {
                    data: [120, 85, 70, 45, 30],
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

async function loadUI() {
    const kpiData = await fetchAPI(`/vendor/analytics/kpi/${stallId}`);
    for (const [item, container] of Object.entries(kpiElements)) {
        if (item == "orderCount") {
            container.textContent = kpiData[item];
        } else {
            container.textContent = "$" + kpiData[item].toFixed(2);
        }
    }
    const hourlySales = await fetchAPI(
        `/vendor/analytics/hourly-sales/${stallId}`,
    );
    createSalesChart(hourlySales ?? []);
}

loadUI();
