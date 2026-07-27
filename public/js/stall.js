import { getIdFromToken } from "./helper.js";

const token = sessionStorage.getItem(SS_KEYS.accessToken);
const menuContainer = document.getElementById("menuContainer");
const customerId = getIdFromToken(token);

const infoElements = {
    stall_name: document.getElementById("stallName"),
    stall_unit_no: document.getElementById("stallUnitNo"),
};

const urlParams = new URLSearchParams(window.location.search);
const stallId =
    urlParams.get("stallId") || "DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD";

let globalMenuItems = [];

function getCart() {
    return JSON.parse(localStorage.getItem(LS_KEYS.cart) ?? "{}");
}

function saveCart(cart) {
    localStorage.setItem(LS_KEYS.cart, JSON.stringify(cart));
}

async function getMenuItemLikes() {
    try {
        const response = await fetch(`/menuitem/likes/${customerId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();
        return data;
    } catch (e) {
        alert("ERROR FETCHING", e);
    }
}

async function updateMenuItemLike(like, stallId, itemCode) {
    if (!like) {
        try {
            await fetch(`/menuitem/likes/${customerId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ stallId, itemCode }),
            });
        } catch (e) {
            alert("Theres something wrong with liking this menu item");
        }
    } else {
        try {
            await fetch(`/menuitem/likes/${customerId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ stallId, itemCode }),
            });
        } catch (e) {
            alert("Theres something wrong with unliking this menu item");
        }
    }
}

function itemIndexInCart(cart, stallId, itemCode) {
    if (cart[stallId]) {
        return cart[stallId].items.findIndex((i) => i.itemCode === itemCode);
    }
    return -1;
}

function addToCart(stallId, itemCode, cart) {
    const item = { stallId, itemCode, quantity: 1 };

    if (!cart[stallId]) {
        cart[stallId] = { items: [], isEco: false };
    }

    cart[stallId].items.push(item);
    saveCart(cart);
    loadMenuItems(globalMenuItems, menuItemLikes);
}

function changeQuantity(stallId, itemCode, delta, cart) {
    const stallCart = cart[stallId];
    if (!stallCart) return;

    const itemIndex = stallCart.items.findIndex((i) => i.itemCode === itemCode);
    if (itemIndex === -1) return;

    stallCart.items[itemIndex].quantity += delta;

    if (stallCart.items[itemIndex].quantity <= 0) {
        stallCart.items.splice(itemIndex, 1);
        if (stallCart.items.length === 0) delete cart[stallId];
    }

    saveCart(cart);
    loadMenuItems(globalMenuItems, menuItemLikes);
}

function deleteItem(stallId, itemCode, cart) {
    const stallCart = cart[stallId];
    if (!stallCart) return;

    stallCart.items = stallCart.items.filter((i) => i.itemCode !== itemCode);
    if (stallCart.items.length === 0) delete cart[stallId];

    saveCart(cart);
    loadMenuItems(globalMenuItems, menuItemLikes);
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

async function loadMenuItems(menuItems, menuItemLikes) {
    const cart = getCart();

    const itemPromises = menuItems.map(async (item) => {
        const itemIndex = itemIndexInCart(cart, item.stall_id, item.item_code);
        const currentQty =
            itemIndex !== -1 ? cart[item.stall_id].items[itemIndex].quantity : 0;
        const like = menuItemLikes.find(
            (l) => l.stall_id === item.stall_id && l.item_code === item.item_code,
        )
            ? true
            : false;
        const cuisineContent = await loadCuisines(item.stall_id, item.item_code);

        const actionControl =
            itemIndex === -1
                ? `
                <button
                    class="add-btn w-fit inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-50 shadow-sm transition-colors hover:bg-slate-800"
                    data-stall-id="${item.stall_id}"
                    data-item-code="${item.item_code}">
                    + Add
                </button>
              `
                : `
                <div class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 shadow-sm w-fit">
                    <button
                        class="minus-btn text-xs font-semibold text-slate-600 hover:text-slate-900 px-1"
                        data-stall-id="${item.stall_id}"
                        data-item-code="${item.item_code}">
                        −
                    </button>

                    <span class="text-xs font-semibold text-slate-800 w-4 text-center">
                        ${currentQty}
                    </span>

                    <button
                        class="plus-btn text-xs font-semibold text-slate-600 hover:text-slate-900 px-1"
                        data-stall-id="${item.stall_id}"
                        data-item-code="${item.item_code}">
                        +
                    </button>
                </div>
              `;

        return `
            <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <div class="flex flex-col justify-between w-full space-y-2.5 pr-3">
                    <div class="flex gap-3">
                      <span class="inline-flex rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        ${item.item_category}
                      </span>
                        ${cuisineContent}
                    </div>
                    <h3 class="text-base text-slate-900 line-clamp-2">
                        ${item.item_desc}
                    </h3>
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-base font-semibold">$${item.item_price.toFixed(2)}</span>
                    </div>
                    <div class="flex gap-5">
                        ${actionControl}
                        <button class="like-btn"
                            data-stall-id="${item.stall_id}"
                            data-item-code="${item.item_code}"
                            data-liked="${like}">
                        <i data-lucide="heart" ${like ? 'stroke="red" fill="red"' : ""}></i></button>
                    </div>
                </div>
                <div class="shrink-0">
                    <img src="https://pupswithchopsticks.com/wp-content/uploads/kimchi-fried-rice-1-720x1080.jpg"
                        alt="${item.item_desc}" class="h-24 w-24 rounded-lg object-cover" />
                </div>
            </div>
        `;
    });

    const itemCards = await Promise.all(itemPromises);
    menuContainer.innerHTML = itemCards.join("");
    lucide.createIcons();
}

function loadStallInfo(stallInfo) {
    if (!stallInfo) return;
    for (const [key, container] of Object.entries(infoElements)) {
        if (container) container.textContent = stallInfo[key] ?? "";
    }
}

async function likeMenuItem(likeBtn, stallId, itemCode) {
    const heartIcon = likeBtn.querySelector("svg");
    const liked = likeBtn.dataset.liked === "true";
    likeBtn.dataset.liked = (!liked).toString();
    heartIcon.setAttribute("fill", liked ? "none" : "red");
    heartIcon.setAttribute("stroke", liked ? "currentColor" : "red");
    updateMenuItemLike(liked, stallId, itemCode);
}

async function init() {
    const stallData = await fetchAPI(`/stalls/${stallId}`);
    if (stallData?.stall) loadStallInfo(stallData.stall);

    globalMenuItems = (await fetchAPI(`/menuitemsbystall/${stallId}`)) ?? [];
    await loadMenuItems(globalMenuItems, menuItemLikes);
}

menuContainer.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const cart = getCart();
    const { itemCode, stallId } = button.dataset;

    if (button.classList.contains("plus-btn")) {
        changeQuantity(stallId, itemCode, 1, cart);
    } else if (button.classList.contains("minus-btn")) {
        changeQuantity(stallId, itemCode, -1, cart);
    } else if (button.classList.contains("delete")) {
        deleteItem(stallId, itemCode, cart);
    } else if (button.classList.contains("add-btn")) {
        addToCart(stallId, itemCode, cart);
    } else if (button.classList.contains("like-btn")) {
        likeMenuItem(button, stallId, itemCode);
    }
});

const menuItemLikes = await getMenuItemLikes();
init();
