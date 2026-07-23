import {
    getStallId,
    getIdFromToken,
    formatHour,
    complaintStatusStyle,
    formatDate,
} from "./helper.js";

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

const complaintTable = document.getElementById("complaints-table-body");
const avgRatingText = document.getElementById("avg-rating-text");
const feedbackContainer = document.getElementById("feedback-feed-container");
const openComplaintsCount = document.getElementById("open-complaints-badge");
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

function loadComplaints(complaints) {
    let totalPending = 0;

    const complaintRows = complaints.map((complaint) => {
        if (complaint.status === "Open" || complaint.status === "Investigating") {
            totalPending++;
        }
        const row = `
        <tr class="transition-colors hover:bg-slate-50/50">
            <td class="p-2 align-middle">
                <div class="font-medium text-slate-900">
                    ${complaint.subject}
                </div>
                <p class="text-xs text-slate-600 line-clamp-1 mt-0.5">
                    ${complaint.description}
                </p>
                <div class="text-[11px] text-slate-400 mt-1">
                    ${formatDate(complaint.created_at)}
                </div>
            </td>
            <td class="p-2 align-middle text-right">
                <span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${complaintStatusStyle(complaint.status)}">
                    ${complaint.status}
                </span>
           </td>
        </tr>
        `;
        return row;
    });

    complaintTable.innerHTML = complaintRows.join("");
    openComplaintsCount.textContent = totalPending.toString() + " Pending";
}

function loadFeedbacks(list) {
    let totalRatings = 0;
    let ratingCount = 0;
    const content = list.map((item) => {
        let row;
        if (item.type == "feedback") {
            const feedback = item;
            row = `
                <div class="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-1.5">
                    <div class="flex items-center justify-between">
                        <span
                            class="inline-flex items-center rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                            General Feedback
                        </span>
                        <span class="text-[11px] text-slate-400">${formatDate(feedback.created_at)}</span>
                    </div>
                    <p class="text-xs text-slate-700 leading-normal">
                        "${feedback.description}"
                    </p>
                </div>
                `;
        }
        if (item.type == "ratings") {
            const ratings = item;
            totalRatings += ratings.rating;
            ratingCount++;
            const stars = Array.from({ length: 5 }).map((_, i) => {
                if (i < ratings.rating)
                    return `<i data-lucide="star" class="size-3.5 fill-amber-400 text-amber-400"></i>`;
                else
                    return `<i data-lucide="star" class="size-3.5 text-slate-300"></i>`;
            });

            row = `
                <div class="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-1.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-1">
                            ${stars.join("")}
                            <span class="text-xs font-medium text-slate-700 ml-1.5">${ratings.rating}/5 Rating</span>
                        </div>
                        <span class="text-[11px] text-slate-400">${formatDate(ratings.created_at)}</span>
                    </div>
                <p class="text-xs text-slate-700 leading-normal">
                    "${ratings.comment}"
                </p>
                </div>
            `;
        }
        return row;
    });
    feedbackContainer.innerHTML = content.join("");
    const averageRating = (totalRatings / ratingCount).toFixed(1);
    avgRatingText.textContent = ratingCount > 0 ? `${averageRating}/5.0` : "";
    lucide.createIcons();
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

    // so that the rest is not stuck behind this async
    fetchAPI(`/vendor/analytics/ai-summary/${stallId}`).then((summary) => {
        loadAISummary(summary);
    });

    const complaints = await fetchAPI(`/stalls/${stallId}/complaints`);
    loadComplaints(complaints);

    const feedback = await fetchAPI(`/stalls/${stallId}/feedback`);
    const ratings = await fetchAPI(`/stalls/${stallId}/ratings`);
    const taggedFeedback = feedback.map((item) => ({
        ...item,
        type: "feedback",
    }));
    const taggedRatings = ratings.map((item) => ({ ...item, type: "ratings" }));
    const combinedList = [...taggedFeedback, ...taggedRatings];
    combinedList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    loadFeedbacks(combinedList);
}

document.onload = loadUI();
