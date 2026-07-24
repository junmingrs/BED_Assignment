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
const avgRatingContainer = document.getElementById("avg-rating-container");
const feedbackContainer = document.getElementById("feedback-feed-container");
const openComplaintsCount = document.getElementById("open-complaints-badge");
const maxMenuItemCount = document.getElementById("max-menu-item");
const timeframeSelect = document.getElementById("timeframe");

let hourlyChartInstance = null;
let itemsChartInstance = null;
let currentReqTimeframe = null;

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

    const ctxHourly = document
        .getElementById("hourlySalesChart")
        .getContext("2d");
    if (hourlyChartInstance) hourlyChartInstance.destroy();

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = "#64748b";
    hourlyChartInstance = new Chart(ctxHourly, {
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
    if (itemsChartInstance) itemsChartInstance.destroy();
    itemsChartInstance = new Chart(ctxTopItems, {
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

    if (complaints.length == 0) {
        complaintTable.innerHTML = `
            <tr>
                <td colspan="100%" class="text-center py-4 text-slate-500">
                    There are no complaints.
                </td>
            </tr>
        `;
        openComplaintsCount.textContent = "0 Pending";
    } else {
        complaintTable.innerHTML = complaintRows.join("");
        openComplaintsCount.textContent = totalPending.toString() + " Pending";
    }
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
    if (ratingCount > 0) {
        avgRatingContainer.classList.remove("hidden");
        const averageRating = (totalRatings / ratingCount).toFixed(1);
        avgRatingText.textContent = `${averageRating}/5.0`;
    } else {
        avgRatingContainer.classList.add("hidden");
    }

    if (list.length == 0) {
        feedbackContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-center text-slate-500 rounded-lg border border-dashed border-slate-200">
                <p class="text-sm ">There are no feedbacks or ratings so far.</p>
            </div>
        `;
    } else {
        feedbackContainer.innerHTML = content.join("");
    }

    lucide.createIcons();
}

function handleTimeChange(timeframe) {
    switch (timeframe) {
        case "today":
            break;
        case "this_week":
            break;
        case "this_month":
            break;
    }
    loadUI(timeframe);
}

async function loadUI(timeframe = "this_week") {
    currentReqTimeframe = timeframe;

    const kpiData = await fetchAPI(
        `/vendor/analytics/kpi/${stallId}?timeframe=${timeframe}`,
    );
    loadKPI(kpiData);

    const hourlySales = await fetchAPI(
        `/vendor/analytics/hourly-sales/${stallId}`,
    );
    createSalesChart(hourlySales ?? []);

    const topItems = await fetchAPI(
        `/vendor/analytics/top-items/${stallId}?timeframe=${timeframe}`,
    );
    createTopItemsChart(topItems ?? []);

    // reset ai summary text
    for (const [_, container] of Object.entries(summaryItems)) {
        container.textContent = "Loading...";
    }

    // so that the rest is not stuck behind this async
    fetchAPI(
        `/vendor/analytics/ai-summary/${stallId}?timeframe=${timeframe}`,
    ).then((summary) => {
        if (currentReqTimeframe == timeframe) {
            loadAISummary(summary);
        }
    });

    const complaints = await fetchAPI(
        `/stalls/${stallId}/complaints?timeframe=${timeframe}`,
    );
    loadComplaints(complaints);

    const feedback = await fetchAPI(
        `/stalls/${stallId}/feedback?timeframe=${timeframe}`,
    );
    const ratings = await fetchAPI(
        `/stalls/${stallId}/ratings?timeframe=${timeframe}`,
    );
    const taggedFeedback = feedback.map((item) => ({
        ...item,
        type: "feedback",
    }));
    const taggedRatings = ratings.map((item) => ({ ...item, type: "ratings" }));
    const combinedList = [...taggedFeedback, ...taggedRatings];
    combinedList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    loadFeedbacks(combinedList);
}

timeframeSelect.addEventListener("change", (event) => {
    const selectedVal = event.target.value;
    handleTimeChange(selectedVal);
});
document.onload = loadUI();
