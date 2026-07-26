// keys for local storage so don't accidentally forget to change 1 of them
const LS_KEYS = {
    cart: "HAWKER_CENTRE_CART",
    createdOrderIds: "created_orderIds",
};

const SS_KEYS = {
    accessToken: "token",
}

const wsMessages = {
    newOrder: "newOrder",
    updateOrder: "updateOrder",
    newComplaint: "newComplaint",
};

if (typeof module !== "undefined" && module.exports) {
    // backend
    module.exports = { LS_KEYS, SS_KEYS, wsMessages };
} else {
    // frontend
    window.LS_KEYS = LS_KEYS;
    window.SS_KEYS = SS_KEYS;
    window.wsMessages = wsMessages;
}
