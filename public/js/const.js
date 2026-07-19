// keys for local storage so don't accidentally forget to change 1 of them
const LS_KEYS = {
    cart: "HAWKER_CENTRE_CART",
    authToken: "token",
    createdOrderIds: "created_orderIds",
};

const wsMessages = {
    newOrder: "NEW_ORDER",
    updateOrder: "ORDER_UPDATED",
};

if (typeof module !== "undefined" && module.exports) {
    // backend
    module.exports = { LS_KEYS, wsMessages };
} else {
    // frontend
    window.LS_KEYS = LS_KEYS;
    window.wsMessages = wsMessages;
}
