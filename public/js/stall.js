import { LS_KEYS } from "./const.js";

// TODO: make it work for all buttons
const addCartBtn = document.querySelector(".addToCartBtn");

async function addToCart() {
    // TODO: GET the menu item details by id. ie for each button in the data- there's an attribute to store the id of that menu item so can GET /menuItemByStallCodeAndItemCode
    const item = {
        stallId: "DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD",
        itemCode: "M001",
        // TODO: update the quantity
        quantity: 2,
    };

    let cart = JSON.parse(localStorage.getItem(LS_KEYS.cart) ?? "{}");
    if (cart[item.stallId]) cart[item.stallId].push(item);
    else cart[item.stallId] = [item];
    localStorage.setItem(LS_KEYS.cart, JSON.stringify(cart));

    alert("Added to cart!");
}

// TODO: once clicked, there should be "+" and "-"  buttons instead
// load the addToCartBtn in via js
addCartBtn.addEventListener("click", addToCart);
