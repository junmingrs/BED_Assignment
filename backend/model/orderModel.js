const { poolPromise } = require("../db");

async function getTotalAmount(order_id) {
    // TODO: use sql magic and do SUM on the menu items with all the item_code then x quantity
    return 0;
}

async function getNextQueueNum(stall_id) {
    // TODO: use sql magic or js to find out the current number now. or maybe create a queue table idk
    // get the max queue number from all orders from this stall (sql magic) and + 1
    // vendor will get from min queue number from ^
    return 0;
}

async function createOrderItem(orderId, item) {
    const query = `
        INSERT INTO OrderItem (order_id, stall_id, item_code, quantity) 
        VALUES (@order_id, @stall_id, @item_code, @quantity)
    `;
    const pool = await poolPromise;
    await pool
        .request()
        .input("order_id", orderId)
        .input("stall_id", item.stall_id)
        .input("item_code", item.item_code)
        .input("quantity", item.quantity)
        .query(query);

    return;
}

// NOTE: when user checks out, it will create multiple order instances for diff stalls
async function createOrder(orderId, stallId, customerId, totalAmount, is_eco) {
    const query = `
        INSERT INTO Orders (order_id, stall_id, customer_id, order_date, total_amount, status, queue_number, is_eco_friendly_packaging) 
        OUTPUT INSERTED.order_id
        VALUES (@order_id, @stall_id, @customer_id, GETDATE(), @total_amount, @status, @queue_number, @is_eco)
    `;
    const queueNumber = await getNextQueueNum(stallId);

    const pool = await poolPromise;
    await pool
        .request()
        .input("order_id", orderId)
        .input("stall_id", stallId)
        .input("customer_id", customerId)
        .input("total_amount", totalAmount)
        .input("status", "Pending") // NOTE: when will the status update like from pending -> preparing...
        .input("queue_number", queueNumber)
        .input("is_eco", is_eco)
        .query(query);

    return orderId;
}

module.exports = { createOrder, createOrderItem, getTotalAmount };
