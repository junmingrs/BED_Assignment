import { LS_KEYS } from "./const.js";
const cartContainer = document.getElementById("container");
const cartTotal = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutFailBtn = document.getElementById("checkout-fail-btn");

const token = localStorage.getItem(LS_KEYS.authToken);
const cart = JSON.parse(localStorage.getItem(LS_KEYS.cart) ?? "[]");

const cartMap = cart.reduce((map, item) => {
    const stallId = item.stallId;
    if (!map[stallId]) map[stallId] = [];
    map[stallId].push(item);
    return map;
}, {});

async function getItemById(stallId, itemCode) {
    try {
        const response = await fetch(
            `/menuitem?stallId=${encodeURIComponent(stallId)}&itemCode=${encodeURIComponent(itemCode)}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        const menuItem = await response.json();
        return menuItem;
    } catch (err) {
        console.error(err);
    }
}

async function loadUI() {
    // TODO: store images?
    // src = "${item.image}";

    let totalAmount = 0;
    const cards = await Promise.all(
        Object.keys(cartMap).map(async (stallId) => {
            const itemCards = await Promise.all(
                cartMap[stallId].map(async (item) => {
                    const menuItem = await getItemById(item.stallId, item.itemCode);
                    totalAmount += menuItem.item_price * item.quantity;

                    return `
                <div class="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <img
                    src="https://pupswithchopsticks.com/wp-content/uploads/kimchi-fried-rice-1-720x1080.jpg"
                    alt="${menuItem.item_desc}"
                    class="size-24 rounded-lg object-cover"
                  />

                  <div class="flex-1">
                    <span class="inline-flex rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      ${menuItem.item_category}
                    </span>

                    <h2 class="mt-2 text-lg font-semibold">
                      ${menuItem.item_desc}
                    </h2>

                    <p class="mt-3 text-lg font-bold text-green-600">
                      $${menuItem.item_price.toFixed(2)}
                    </p>
                  </div>

                  <div class="flex items-center gap-4">
                    <button class="minus rounded-md border px-3 py-2">−</button>
                    <span>${item.quantity}</span>
                    <button class="plus rounded-md border px-3 py-2">+</button>
                  </div>

                  <button class="delete ml-4 rounded-md border border-red-200 px-3 py-2 text-red-600 transition-colors hover:bg-red-50">
                    Delete
                  </button>
                </div>
                `;
                }),
            );

            // TODO: get stall name by id
            return `
            <section class="space-y-4">
                <h2 class="text-2xl font-semibold">Stall Name (TODO)</h2>
                ${itemCards.join("")}
            </section>
        `;
        }),
    );

    cartContainer.innerHTML = cards.join("");
    cartTotal.textContent = "$" + totalAmount.toFixed(2);
}

function getCustomerIdFromToken(token) {
    // splits the token back to header, payload, signature and decodes it back from base64
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
}

async function checkout() {
    const customerId = getCustomerIdFromToken(token);
    try {
        const response = await fetch(`/checkout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                cart: cartMap,
                customerId,
            }),
        });

        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            window.location.href = "/customer/order-status.html?success=true";
        } else {
            console.error(data);
        }
    } catch (err) {
        console.error(err);
    }
}

window.addEventListener("load", loadUI);
checkoutBtn.addEventListener("click", checkout);
checkoutFailBtn.addEventListener("click", () => {
    window.location.href = "/customer/order-status.html?success=false";
});
