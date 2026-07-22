// TODO: make it work for all buttons
const addCartBtn = document.querySelector(".addToCartBtn");
const likeBtn = document.getElementById("likeBtn");
const token = localStorage.getItem(LS_KEYS.authToken);
const customerId = getIdFromToken(token);
// TODO: find a way to get stallid and item
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

/**
    @param like boolean
*/
async function updateMenuItemLike(like, item) {
    if (like) {
        const response = await fetch(`/menuitemlike/${customerId}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ stallId: item.stall_id, itemCode: item.item_code })
        })
        if (!response.ok) {
            console.log("theres something wrong with liking this menu item")
        }
    } else {
        await fetch(`/menuitemlike/${customerId}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ stallId: item.stall_id, itemCode: item.item_code })
        })
    }
}

async function likeMenuItem() {
    const heartIcon = document.querySelector("svg");
    const liked = likeBtn.dataset.liked === "true";
    updateMenuItemLike(liked, item);
    likeBtn.dataset.liked = (!liked).toString();
    heartIcon.setAttribute("fill", liked ? "none" : "red");
    heartIcon.setAttribute("stroke", liked ? "currentColor" : "red");
}

// TODO: once clicked, there should be "+" and "-"  buttons instead -> update quantity
// load the addToCartBtn in js
addCartBtn.addEventListener("click", addToCart);
likeBtn.addEventListener("click", likeMenuItem);
lucide.createIcons()
