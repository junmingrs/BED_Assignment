const { poolPromise } = require("../db");
const menuItemModel = require("./menuItemModel");

async function getTotalAmount(stallId, items) {
    const pricePromises = items.map(async (item) => {
        const menuItem = await menuItemModel.getMenuItemsByStallIdAndItemCode(
            stallId,
            item.itemCode,
        );
        return menuItem.item_price * item.quantity;
    });

    const itemPrices = await Promise.all(pricePromises);
    return itemPrices.reduce((s, c) => s + c, 0);
}

async function getItemsFromOrder(orderId) {
    const query = `
        SELECT
            oi.item_code,
            oi.quantity,
            mi.item_desc,
            mi.item_price,
            mi.item_category
        FROM OrderItem oi
        INNER JOIN MenuItem mi
            ON oi.stall_id = mi.stall_id
            AND oi.item_code = mi.item_code
        WHERE oi.order_id = @id;
    `;
    const pool = await poolPromise;
    const result = await pool.request().input("id", orderId).query(query);
    return result.recordset;
}

async function getOrderById(orderId) {
    const query = `SELECT * FROM Orders WHERE order_id= @id`;
    const pool = await poolPromise;
    const result = await pool.request().input("id", orderId).query(query);

    if (result.recordset.length === 0) return null;
    const order = result.recordset[0];
    order.items = await getItemsFromOrder(orderId);

    return order;
}

async function getOrdersByCustomer(customerId, status) {
    const query = `SELECT * FROM Orders WHERE customer_id= @id AND status=@status`;
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("id", customerId)
        .input("status", status)
        .query(query);

    if (result.recordset.length === 0) return null;

    const orders = result.recordset;

    await Promise.all(
        orders.map(async (order) => {
            order.items = await getItemsFromOrder(order.order_id);
        }),
    );

    return orders;
}

async function getOrderByStallId(stallId) {
    const query = `SELECT order_id, stall_id, customer_id, order_date, total_amount, status, queue_number, is_eco_friendly_packaging FROM Orders WHERE stall_id= @id`;
    const pool = await poolPromise;
    const result = await pool.request().input("id", stallId).query(query);

    if (result.recordset.length === 0) return null;
    return result.recordset;
}

async function getNextQueueNum(stallId) {
    const query = `
        SELECT MAX(queue_number) AS max_queue FROM Orders WHERE stall_id = @stall_id
    `;
    const pool = await poolPromise;
    const result = await pool.request().input("stall_id", stallId).query(query);

    if (result.recordset.length === 0) return 1;
    return parseInt(result.recordset[0].max_queue) + 1;
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
        .input("stall_id", item.stallId)
        .input("item_code", item.itemCode)
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
        .input("status", "Pending")
        .input("queue_number", queueNumber)
        .input("is_eco", is_eco)
        .query(query);

    return orderId;
}

async function updateOrderStatus(orderId, status) {
    const query = `
        UPDATE Orders
        SET status = @status
        WHERE order_id = @orderId;
    `;
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("status", status)
        .input("orderId", orderId)
        .query(query);

    return result.rowsAffected[0] > 0;
}

module.exports = {
    createOrder,
    createOrderItem,
    getTotalAmount,
    getOrdersByCustomer,
    getOrderById,
    getOrderByStallId,
    updateOrderStatus,
};
