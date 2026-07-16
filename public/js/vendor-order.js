import { getIdFromToken, statusStyle } from "./helper.js";
import { LS_KEYS } from "./const.js";
const token = localStorage.getItem(LS_KEYS.authToken);
const orderTable = document.getElementById("order-table");
const statusFilter = document.getElementById("statusFilter");

async function getStallId(vendorId) {
    try {
        const response = await fetch(`/vendors/${vendorId}/stall`, {
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

async function getOrders() {
    const vendorId = getIdFromToken(token);
    const stallId = await getStallId(vendorId);

    try {
        const response = await fetch(`/stalls/${stallId}/orders`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const orders = await response.json();
        return orders;
    } catch (err) {
        console.error(err);
    }
}

function formatItems(items) {
    const itemDetails = items.map((item) => {
        return `${item.item_desc} x${item.quantity}`;
    });
    return itemDetails.join(", ");
}

function loadOrders(status) {
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

const orders = await getOrders();
loadOrders("All");

statusFilter.addEventListener("change", () => {
    const status = statusFilter.value;
    loadOrders(status);
});
