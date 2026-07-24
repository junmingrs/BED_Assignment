import { getIdFromToken } from "./helper.js";
const cartContainer = document.getElementById("container");
const paymentContainer = document.getElementById("payment-container");
const cartTotal = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutFailBtn = document.getElementById("checkout-fail-btn");

const token = sessionStorage.getItem(SS_KEYS.accessToken);
let cartMap = JSON.parse(localStorage.getItem(LS_KEYS.cart) ?? "{}");

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

async function renderCartItems() {
    // TODO: store images?
    // src = "${item.image}";

    cartMap = JSON.parse(localStorage.getItem(LS_KEYS.cart) ?? "{}");
    let totalAmount = 0;
    const cards = await Promise.all(
        Object.keys(cartMap).map(async (stallId) => {
            const stallItems = cartMap[stallId].items;
            const isEco = cartMap[stallId].isEco === true;
            if (isEco) totalAmount += 0.3;
            const itemCards = await Promise.all(
                stallItems.map(async (item) => {
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
                    <button class="minus rounded-md border px-3 py-2" data-stall-id="${item.stallId}" data-item-code="${item.itemCode}">−</button>
                    <span>${item.quantity}</span>
                    <button class="plus rounded-md border px-3 py-2" data-stall-id="${item.stallId}" data-item-code="${item.itemCode}">+</button>
                  </div>

                  <button class="delete ml-4 rounded-md border border-red-200 px-3 py-2 text-red-600 transition-colors hover:bg-red-50" data-stall-id="${item.stallId}" data-item-code="${item.itemCode}" >
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
                <div class="mt-2 flex justify-between items-center">
                    <label class="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            class="eco-checkbox size-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
                            data-stall-id="${stallId}"
                            ${isEco ? "checked" : ""}
                        />
                        <div>
                            <p class="text-sm font-medium leading-none">
                                Eco-friendly packaging
                            </p>
                            <p class="mt-1 text-xs text-gray-500">
                                Use paper containers and reduce plastic where possible.
                            </p>
                        </div>
                    </label>
                    <p class="text-sm font-semibold text-gray-900">
                        +$0.30
                    </p>
                </div>
            </section>
        `;
        }),
    );

    cartContainer.innerHTML = cards.join("");
    if (cartContainer.innerHTML == "") {
        cartContainer.innerHTML =
            '<p class="text-sm text-gray-500 text-center py-8">No items added in cart</p>';
        paymentContainer.classList.add("hidden");
    } else {
        paymentContainer.classList.remove("hidden");
    }

    cartTotal.textContent = "$" + totalAmount.toFixed(2);
}

async function checkout() {
    const customerId = getIdFromToken(token);
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
            sessionStorage.setItem(
                LS_KEYS.createdOrderIds,
                JSON.stringify(data.orderIds),
            );
            window.location.href = "/customer/order-status.html?success=true";
            localStorage.setItem(LS_KEYS.cart, "{}");
        } else {
            console.error(data);
        }
    } catch (err) {
        console.error(err);
    }
}

function changeQuality(stallId, itemCode, amount) {
    const item = cartMap[stallId].items.find((item) => item.itemCode == itemCode);
    // min is 1, because if it's 0 then they should delete it
    item.quantity = Math.max(item.quantity + amount, 1);
}

function deleteItem(stallId, itemCode) {
    cartMap = cartMap[stallId].items.filter((item) => item.itemCode != itemCode);
}

function setEcoOption(stallId, checked) {
    let currentTotal = parseFloat(cartTotal.textContent.split("$")[1]);
    if (checked) {
        currentTotal += 0.3;
    } else {
        currentTotal -= 0.3;
    }
    cartMap[stallId].isEco = checked;
    cartTotal.textContent = "$" + currentTotal.toFixed(2);
}

checkoutBtn.addEventListener("click", checkout);
checkoutFailBtn.addEventListener("click", () => {
    window.location.href = "/customer/order-status.html?success=false";
});

await renderCartItems();
cartContainer.addEventListener("click", async (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const { stallId, itemCode } = button.dataset;

    if (button.classList.contains("plus")) {
        changeQuality(stallId, itemCode, 1);
    } else if (button.classList.contains("minus")) {
        changeQuality(stallId, itemCode, -1);
    } else if (button.classList.contains("delete")) {
        deleteItem(stallId, itemCode);
    }

    localStorage.setItem(
        LS_KEYS.cart,
        JSON.stringify(Object.keys(cartMap).length == 0 ? {} : cartMap),
    );
    await renderCartItems();
});

cartContainer.addEventListener("change", (e) => {
    const checkbox = e.target.closest('input[type="checkbox"]');
    if (!checkbox) return;

    setEcoOption(checkbox.dataset.stallId, checkbox.checked);
});
