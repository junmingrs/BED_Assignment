import {
    getIdFromToken,
    getOrders,
    getStallId,
    statusStyle,
} from "./helper.js";
import { getSocket } from "./websocket.js";
const token = sessionStorage.getItem(SS_KEYS.accessToken);
const orderTable = document.getElementById("order-table");
const statusFilter = document.getElementById("statusFilter");

function formatItems(items) {
    const itemDetails = items.map((item) => {
        return `${item.item_desc} x${item.quantity}`;
    });
    return itemDetails.join(", ");
}

async function loadOrders(status) {
    const orders = await getOrders(token);
    const orderRows = orders.map((order) => {
        if (order.status != status && status != "All") return;
        const row = `
          <tr class="transition-colors hover:bg-slate-50">
            <td class="px-5 py-4 text-lg font-bold text-slate-900">${order.queue_number}</td>

            <td class="px-5 py-4">
              <span
                class="block max-w-36 truncate font-mono text-xs text-slate-500"
              >
                ${order.order_id}
              </span>
            </td>

            <td class="px-5 py-4">
              <span
                class="block max-w-36 truncate font-mono text-xs text-slate-500"
              >
                ${order.customer_id}
              </span>
            </td>

            <td class="px-5 py-4 text-slate-700">${formatItems(order.items)}</td>

            <td class="px-5 py-4 text-right font-medium text-slate-900"> $${order.total_amount.toFixed(2)} </td>

            <td class="px-5 py-4 text-center">
              <i
                data-lucide="${order.is_eco_friendly_packaging ? "circle-check" : "circle-x"}"
                class="mx-auto h-5 w-5 ${order.is_eco_friendly_packaging
                ? "text-emerald-600"
                : "text-slate-300"
            }"
              ></i>
            </td>

            <td class="px-5 py-4">
                <span class="inline-block mt-3 text-xs font-medium px-2 py-1 rounded-full ${statusStyle(order.status)}">
                ${order.status}
                </span>
            </td>
          </tr>
        `;
        return row;
    });

    orderTable.innerHTML = orderRows.join("");

    lucide.createIcons();
}

const vendorId = await getIdFromToken(token);
const stallId = await getStallId(vendorId, token);
await loadOrders("All");

// web socket
const socket = getSocket();
socket.addEventListener("message", async (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type != wsMessages.newOrder && msg.type != wsMessages.updateOrder)
        return;
    if (msg.stallId != stallId) return;
    await loadOrders("All");
});

statusFilter.addEventListener("change", () => {
    const status = statusFilter.value;
    loadOrders(status);
});
