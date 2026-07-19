import { formatDate, getIdFromToken, getOrders, getStallId } from "./helper.js";
import { getSocket } from "./websocket.js";

const pendingContainer = document.getElementById("pending-container");
const preparingContainer = document.getElementById("preparing-container");
const readyContainer = document.getElementById("ready-container");
const pendingCount = document.getElementById("pending-count");
const preparingCount = document.getElementById("preparing-count");
const readyCount = document.getElementById("ready-count");
const token = localStorage.getItem(LS_KEYS.authToken);

const sections = [
    {
        status: "Pending",
        nextStatus: "Preparing",
        container: pendingContainer,
        count: pendingCount,
    },
    {
        status: "Preparing",
        nextStatus: "Ready",
        container: preparingContainer,
        count: preparingCount,
    },
    {
        status: "Ready",
        nextStatus: "Completed",
        container: readyContainer,
        count: readyCount,
    },
];

function formatItems(items) {
    const itemDetails = items.map((item) => {
        return `<div>${item.item_desc} x${item.quantity}</div>`;
    });
    return itemDetails.join("");
}

function loadOrderSection(orders, status, container, countElement) {
    const filtered = orders.filter((o) => o.status == status);
    const cards = filtered.map((order) => {
        return `
        <article class="grid grid-cols-[30px_1fr_auto] gap-x-5 border-b border-slate-200 p-5">
            <div class="flex items-center justify-center">
                <span class="text-2xl font-bold text-slate-900">${order.queue_number}</span>
            </div>
            <div class="flex flex-col justify-between">
                <div class="space-y-1 text-sm text-slate-800">
                    ${formatItems(order.items)}
                </div>

                <div class="mt-4 text-xs text-slate-500">
                    Created at
                    <span class="font-medium">${formatDate(order.order_date)}</span>
                </div>
            </div>
            <div class="flex flex-col items-end justify-between gap-2">
                <div class="flex items-center gap-2">
                    ${order.is_eco_friendly_packaging ? `<i data-lucide="leaf" class="h-4 w-4 text-emerald-600" ></i>` : ``}

                    <span class="text-lg font-semibold">$${order.total_amount.toFixed(2)}</span>
                </div>

                <button
                    data-order-id=${order.order_id}
                    class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                    Done
                </button>
            </div>
        </article>
    `;
    });

    container.innerHTML = cards.join("");
    countElement.innerHTML = filtered.length;
}

async function updateStatus(orderId, status) {
    try {
        const response = await fetch(`/orders/${orderId}/${status}`, {
            method: "PATCH",
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

async function loadSections() {
    const orders = await getOrders(token);
    sections.forEach((section) => {
        loadOrderSection(orders, section.status, section.container, section.count);
    });
}

// main
await loadSections();
const vendorId = await getIdFromToken(token);
const stallId = await getStallId(vendorId, token);

// web socket
const socket = getSocket();
socket.addEventListener("message", async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type != wsMessages.newOrder && msg.type != wsMessages.updateOrder)
        return;
    if (msg.stallId != stallId) return;
    await loadSections();
});

sections.forEach((section) => {
    section.container.addEventListener("click", async (e) => {
        const button = e.target.closest("button");
        if (!button) return;
        const { orderId } = button.dataset;

        await updateStatus(orderId, section.nextStatus);
        await loadSections();
    });
});

lucide.createIcons();
