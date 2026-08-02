import { getIdFromToken, getIsGuest } from "./helper.js";

// 获取翻译函数
const t = window.i18n ? window.i18n.t : (key) => key;

const cartContainer = document.getElementById("container");
const paymentContainer = document.getElementById("payment-container");
const cartTotal = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutFailBtn = document.getElementById("checkout-fail-btn");
const promotionContainer = document.getElementById("promotion-container");
const promotionInput = document.getElementById("promotion-input");
const promotionBtn = document.getElementById("promotion-btn");
const promotionMsg = document.getElementById("promotion-msg");
const promotionValids = document.getElementById("promotion-valids");

const token = sessionStorage.getItem(SS_KEYS.accessToken);
let cartMap = JSON.parse(localStorage.getItem(LS_KEYS.cart) ?? "{}");
let appliedPromos = [];

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

async function getStallInfo(stallId) {
    try {
        const response = await fetch(`/stalls/${stallId}`, {
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

async function getAllPromotions() {
    try {
        const response = await fetch(`/promotion`, {
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
        console.error("Error:", err);
    }
}

async function getCuisine(stallId, itemCode) {
    const i = await fetchAPI(`/menuItemCuisine/${stallId}/${itemCode}`);
    return i.cuisines;
}

async function loadCuisines(stallId, itemCode) {
    const cuisines = await getCuisine(stallId, itemCode);

    const cuisineCards = cuisines.map((item) => {
        return `
            <span class="w-fit inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-normal text-slate-500 border border-slate-200/60">
                ${item.cuisine_name}
            </span>
        `;
    });
    return cuisineCards.join("");
}

async function renderCartItems() {
    cartMap = JSON.parse(localStorage.getItem(LS_KEYS.cart) ?? "{}");
    let totalAmount = 0;
    const cards = await Promise.all(
        Object.keys(cartMap).map(async (stallId) => {
            const stallInfo = await getStallInfo(stallId);
            const stallName = stallInfo.stall.stall_name;
            const stallItems = cartMap[stallId].items;
            const isEco = cartMap[stallId].isEco === true;

            if (isEco) totalAmount += 0.3;
            const itemCards = await Promise.all(
                stallItems.map(async (item) => {
                    const menuItem = await getItemById(item.stallId, item.itemCode);

                    const cuisineContent = await loadCuisines(
                        item.stallId,
                        item.itemCode,
                    );

                    const matchedPromo = appliedPromos.find(
                        (p) =>
                            p.item_code === menuItem.item_code &&
                            p.stall_id === menuItem.stall_id,
                    );

                    let priceHtml;
                    if (matchedPromo) {
                        const discountedPrice =
                            menuItem.item_price * (1 - matchedPromo.discount / 100);
                        priceHtml = `<p class="mt-3 text-lg font-bold text-green-600">
                        $${discountedPrice.toFixed(2)}
                        <span class="ml-2 text-sm font-normal text-gray-500 line-through">$${menuItem.item_price.toFixed(2)}</span>
                        <span class="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">${matchedPromo.discount}% OFF</span>
                    </p>`;
                        menuItem.item_price = discountedPrice;
                    } else {
                        priceHtml = `<p class="mt-3 text-lg font-bold text-green-600">$${menuItem.item_price.toFixed(2)}</p>`;
                    }

                    item.itemPrice = menuItem.item_price;
                    totalAmount += menuItem.item_price * item.quantity;

                    return `
                    <div class="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <img
                        src="https://pupswithchopsticks.com/wp-content/uploads/kimchi-fried-rice-1-720x1080.jpg"
                        alt="${menuItem.item_desc}"
                        class="size-24 rounded-lg object-cover"
                      />

                      <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-1.5">
                          <span class="inline-flex rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                            ${menuItem.item_category}
                          </span>
                          
                          ${cuisineContent}
                        </div>

                        <h2 class="mt-2 text-lg font-semibold">
                          ${menuItem.item_desc}
                        </h2>

                        ${priceHtml}
                      </div>

                      <div class="flex items-center gap-4">
                        <button class="minus rounded-md border px-3 py-2" data-stall-id="${item.stallId}" data-item-code="${item.itemCode}">−</button>
                        <span>${item.quantity}</span>
                        <button class="plus rounded-md border px-3 py-2" data-stall-id="${item.stallId}" data-item-code="${item.itemCode}">+</button>
                      </div>

                      <button class="delete ml-4 rounded-md border border-red-200 px-3 py-2 text-red-600 transition-colors hover:bg-red-50" data-stall-id="${item.stallId}" data-item-code="${item.itemCode}">
                        ${t('delete')}
                      </button>
                    </div>
                `;
                }),
            );

            return `
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold">${stallName}</h2>
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
                            ${t('eco_friendly')}
                        </p>
                        <p class="mt-1 text-xs text-gray-500">
                            ${t('eco_description')}
                        </p>
                    </div>
                </label>
                <p class="text-sm font-semibold text-gray-900">
                    ${t('plus_030')}
                </p>
            </div>
        </section>
        `;
        }),
    );

    cartContainer.innerHTML = cards.join("");
    if (cartContainer.innerHTML === "") {
        cartContainer.innerHTML =
            `<p class="text-sm text-gray-500 text-center py-8">${t('cart_empty')}</p>`;
        paymentContainer.classList.add("hidden");
    } else {
        paymentContainer.classList.remove("hidden");
    }

    cartTotal.textContent = "$" + totalAmount.toFixed(2);
}

async function checkout() {
    const customerId = getIdFromToken(token);
    if (Object.keys(cartMap).length == 0) {
        alert(t('checkout_empty_error'));
        return;
    }

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
        alert(t(data.message) || data.message);
        if (response.ok) {
            const itemPromises = [];

            Object.keys(cartMap).forEach((stallId) => {
                const isEco = cartMap[stallId].isEco == true;
                cartMap[stallId].items.forEach((item) => {
                    itemPromises.push(
                        (async () => {
                            const menuItem = await getItemById(item.stallId, item.itemCode);

                            return {
                                name: menuItem?.item_desc || "Item",
                                quantity: item.quantity,
                                price: menuItem?.item_price || 0,
                            };
                        })(),
                    );
                });
                if (isEco) {
                    itemPromises.push({
                        name: t('eco_packaging_label'),
                        quantity: 1,
                        price: 0.3,
                    });
                }
            });
            const items = await Promise.all(itemPromises);
            const total = cartTotal.textContent.replace("$", "");
            sessionStorage.setItem(
                "orderSummary",
                JSON.stringify({ items, total: parseFloat(total) }),
            );

            if (getIsGuest(token)) {
                const guestOrders = JSON.parse(
                    localStorage.getItem(LS_KEYS.createdOrderIds) ?? "[]",
                );
                const statuses = {};
                Object.values(data.orderIds).forEach((orderId) => {
                    statuses[orderId] = "Pending";
                });
                guestOrders.push({
                    orderIds: data.orderIds,
                    items,
                    total: parseFloat(total),
                    date: new Date().toISOString(),
                    statuses,
                });
                localStorage.setItem(
                    LS_KEYS.createdOrderIds,
                    JSON.stringify(guestOrders),
                );
            }

            const orderIds = Object.values(data.orderIds).join(", ");
            const encodedOrderIds = encodeURIComponent(orderIds);
            window.location.href = `/customer/payment-success.html?orderIds=${encodedOrderIds}&total=${total}`;
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
    item.quantity = Math.max(item.quantity + amount, 1);
}

function deleteItem(stallId, itemCode) {
    if (!cartMap[stallId]) return;

    cartMap[stallId].items = cartMap[stallId].items.filter(
        (item) => item.itemCode != itemCode,
    );

    if (cartMap[stallId].items.length === 0) {
        delete cartMap[stallId];
    }
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

promotionBtn.addEventListener("click", async () => {
    const code = promotionInput.value.trim();
    promotionMsg.classList.add("hidden");

    if (!code) {
        showMsg(t('promo_enter_error'), "error");
        return;
    }

    const allPromos = await getAllPromotions();
    if (!Array.isArray(allPromos)) {
        showMsg(t('promo_verify_error'), "error");
        return;
    }

    const codeLower = code.toLowerCase();
    const matchedPromo = allPromos.find(
        (p) => p.promo_code && p.promo_code.toLowerCase() === codeLower,
    );

    if (!matchedPromo) {
        showMsg(`${code} ${t('promo_invalid')}`, "error");
        return;
    }

    if (appliedPromos.includes(matchedPromo)) {
        showMsg(`${code} ${t('promo_already_applied')}`, "error");
        return;
    }

    const today = new Date();
    const start = new Date(matchedPromo.start_date);
    const end = new Date(matchedPromo.end_date);
    end.setHours(23, 59, 59, 999);

    if (today < start || today > end) {
        showMsg(`${code} ${t('promo_inactive')}`, "error");
        return;
    }

    appliedPromos.push(matchedPromo);
    showMsg(`${code} ${t('promo_applied', { discount: matchedPromo.discount })}`, "success");
    promotionInput.value = "";
    renderCartItems();
});

function showMsg(text, type) {
    promotionMsg.innerText = text;
    promotionMsg.className =
        type === "error"
            ? "rounded-xl p-3 border bg-red-300 grow"
            : "rounded-xl p-3 border bg-green-300 grow";
    promotionMsg.classList.remove("hidden");
}