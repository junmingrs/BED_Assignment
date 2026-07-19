import { LS_KEYS } from "./const.js";

// TODO: make it work for all buttons
const addCartBtn = document.querySelector(".addToCartBtn");

function ifItemInCart(cart, item) {
    if (cart[item.stallId]) {
        if (cart[item.stallId].items.find((i) => i.itemCode == item.itemCode))
            return true;
    }
    return false;
}

async function addToCart() {
    // TODO: GET the menu item details by id. ie for each button in the data- there's an attribute to store the id of that menu item so can GET /menuItemByStallCodeAndItemCode
    const item = {
        stallId: "DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD",
        itemCode: "DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD'",
        quantity: 1,
    };

    // if item already exists in cart, don't add it
    let cart = JSON.parse(localStorage.getItem(LS_KEYS.cart) ?? "{}");
    const isExist = ifItemInCart(cart, item);
    if (isExist) {
        alert(
            "Cannot add to cart as item is already in cart. Go to cart and increase the quantity",
        );
        return;
    }

    if (cart[item.stallId]) cart[item.stallId].items.push(item);
    else cart[item.stallId] = { items: [item], isEco: false };
    localStorage.setItem(LS_KEYS.cart, JSON.stringify(cart));

    alert("Added to cart!");
}

// TODO: once clicked, there should be "+" and "-"  buttons instead -> update quantity
// load the addToCartBtn in js
addCartBtn.addEventListener("click", addToCart);
