import { formatDate, getIdFromToken, statusStyle } from "./helper.js";
import { getSocket } from "./websocket.js";
const token = localStorage.getItem(LS_KEYS.authToken);
const customerId = getIdFromToken(token);

const ordersContainer = document.getElementById("orders-container");
await loadOrders();

const socket = getSocket();
socket.addEventListener("message", async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type == wsMessages.updateOrder && msg.customerId == customerId)
        await loadOrders();
});

async function getOrders() {
    try {
        const params = new URLSearchParams();
        params.append("status", "Pending");
        params.append("status", "Preparing");
        params.append("status", "Ready");
        const response = await fetch(`/customer/${customerId}/orders?${params}`, {
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

function loadItems(items) {
    let cards = "";
    items.map((item) => {
        cards += `
        <div class="flex justify-between">  
            <div>
                <p class="font-medium">${item.item_desc}</p>
                <p class="text-sm text-gray-500">x${item.quantity}</p>
            </div>
            <span class="font-medium">$${item.item_price.toFixed(2)}</span>
        </div>`;
    });
    return cards;
}

async function cancelOrder(orderId) {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
        const response = await fetch(`/orders/${orderId}/Cancelled`, {
            method: "PATCH",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();
        console.log(data);
        if (response.ok) {
            alert("Order cancelled successfully");
        } else {
            console.error(data.message);
            alert("Unable to cancel order, please try again later.");
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadOrders() {
    const orders = await getOrders();
    if (!orders || orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="flex items-center justify-center rounded-xl border border-dashed py-12">
                <p class="text-sm text-gray-500">
                    No active orders.
                </p>
            </div>
        `;
        return;
    }

    ordersContainer.className =
        orders.length >= 2 ? "grid gap-6 items-start lg:grid-cols-2" : "flex";

    const orderCards = orders.map((order) => {
        const card = `
        <article class="flex-1 rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
            <div class="border-b p-6">
                <div class="flex items-start justify-between">
                    <div>
                        <p class="text-sm text-gray-500">Queue Number</p>
                        <h3 class="mt-1 text-3xl font-bold">${order.queue_number}</h3>
                    </div>
                <span class="inline-block mt-3 text-xs font-medium px-2 py-1 rounded-xl ${statusStyle(order.status)}">
                    ${order.status}
                </span>
                </div>

                <p class="mt-3 text-sm text-gray-500">Ordered at ${formatDate(order.order_date)}</p>
            </div>

            <div class="space-y-3 p-6">
                ${loadItems(order.items)}

                <div class="border-t pt-4">
                    <div class="flex items-center justify-between text-sm">
                        <span class="${order.is_eco_friendly_packaging ? "text-green-600" : "text-red-600"}">
                            Eco-friendly packaging
                        </span>

                        <span class="font-medium ${order.is_eco_friendly_packaging ? "text-green-600" : "text-red-600"}">
                            ${order.is_eco_friendly_packaging ? "✓" : "✕"}
                        </span>
                    </div>
                </div>
            </div>
            <div class="flex justify-between border-t bg-gray-50 px-6 py-4 rounded-b-xl">
                <div>
                    <p class="text-sm text-gray-500">Total</p>
                    <p class="text-xl font-bold">$${order.total_amount.toFixed(2)}</p>
                </div>


                ${order.status === "Pending"
                ? `
                        <button
                            class="rounded-lg bg-red-600 px-3 py-0 text-sm font-medium text-white transition hover:bg-red-700"
                            onclick="cancelOrder('${order.order_id}')"
                        >
                            Cancel Order
                        </button>
                        `
                : ""
            }
            </div>
        </article>
    `;
        return card;
    });
    ordersContainer.innerHTML = orderCards.join("");
}

window.cancelOrder = cancelOrder;
