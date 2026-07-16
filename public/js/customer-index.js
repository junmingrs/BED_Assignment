import { getCustomerIdFromToken, statusStyle } from "./helper.js";
import { LS_KEYS } from "./const.js";
const token = localStorage.getItem(LS_KEYS.authToken);

const ordersContainer = document.getElementById("orders-container");
const orders = await getOrders();
loadOrders();

async function getOrders() {
    const customerId = getCustomerIdFromToken(token);
    try {
        // TODO: make this work for multiple status
        const response = await fetch(
            `/customer/${customerId}/orders?status=Pending`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            },
        );

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

function loadOrders() {
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
        orders.length >= 2 ? "grid gap-6 lg:grid-cols-2" : "flex";

    const orderCards = orders.map((order) => {
        const formattedDate = new Date(order.order_date).toLocaleString("en-SG", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
        const card = `
        <article class="flex-1 rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
            <div class="border-b p-6">
                <div class="flex items-start justify-between">
                    <div>
                        <p class="text-sm text-gray-500">Queue Number</p>
                        <h3 class="mt-1 text-3xl font-bold">${order.queue_number}</h3>
                    </div>
                <span class="inline-block mt-3 text-xs font-medium px-2 py-1 rounded-full ${statusStyle(order.status)}">
                    ${order.status}
                </span>
                </div>

            <p class="mt-3 text-sm text-gray-500">Ordered at ${formattedDate}</p>
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

            <div class="flex items-center justify-between border-t bg-gray-50 px-6 py-4 rounded-xl">
                <div>
                    <p class="text-sm text-gray-500">Total</p>
                    <p class="text-xl font-bold">$${order.total_amount.toFixed(2)}</p>
                </div>
            </div>
        </article>
    `;
        return card;
    });
    ordersContainer.innerHTML = orderCards.join("");
}
