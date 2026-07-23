const { wsMessages } = require("../../public/js/const.js");
const orderModel = require("../model/orderModel");
const { broadcast } = require("../ws");
const crypto = require('crypto');
const { sendReceipt } = require("../config/email");
const { poolPromise } = require("../db");

async function getOrderById(req, res) {
    const { orderId } = req.params;
    try {
        const order = await orderModel.getOrderById(orderId);
        return res.status(200).json(order);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getOrdersByCustomer(req, res) {
    const { customerId } = req.params;
    const statuses = Array.isArray(req.query.status)
        ? req.query.status
        : req.query.status
            ? [req.query.status]
            : [];

    try {
        const orders = await orderModel.getOrdersByCustomer(customerId, statuses);
        return res.status(200).json(orders);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getOrderByStallId(req, res) {
    const { stallId } = req.params;
    try {
        const orders = await orderModel.getOrderByStallId(stallId);
        return res.status(200).json(orders);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function updateOrderStatus(req, res) {
    const { orderId, status } = req.params;
    try {
        const updated = await orderModel.updateOrderStatus(orderId, status);
        if (!updated) {
            return res.status(404).json({ message: "Order not found" });
        }
        const newOrder = await orderModel.getOrderById(orderId);

        broadcast({
            type: wsMessages.updateOrder,
            customerId: newOrder.customer_id,
            stallId: newOrder.stall_id,
            orderId: newOrder.order_id,
        });

        return res
            .status(200)
            .json({ message: "Order status updated successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function checkoutCart(req, res) {
    const { cart, customerId } = req.body;
    const cartMap = typeof cart == "string" ? JSON.parse(cart) : cart;

    try {
        const pool = await poolPromise;
        const customerResult = await pool.request()
            .input("customerId", customerId)
            .query(`SELECT account_email FROM Account WHERE account_id = @customerId`);

        const customerEmail = customerResult.recordset[0]?.account_email;
        const orderPromises = Object.keys(cartMap).map(async (stallId) => {
            const orderId = crypto.randomUUID();
            const items = cartMap[stallId].items; // []
            const isEco = cartMap[stallId].isEco || false;
            let total = await orderModel.getTotalAmount(stallId, items);
            if (isEco) total += 0.3; // extra fee for eco friendly packaging

            await orderModel.createOrder(orderId, stallId, customerId, total, isEco);

            const itemPromises = items.map(async (item) => {
                await orderModel.createOrderItem(orderId, { ...item, stallId });
            });

            // to avoid timing issues from async
            await Promise.all(itemPromises);

            return { stallId, orderId };
        });

        const createdOrders = await Promise.all(orderPromises);
        // {stallId: orderId}
        const ordersMap = createdOrders.reduce((map, current) => {
            map[current.stallId] = current.orderId;

            // broadcast to web socket
            broadcast({
                type: wsMessages.newOrder,
                stallId: current.stallId,
                orderId: current.orderId,
            });

            return map;
        }, {});
        if (customerEmail) {
            // 收集所有订单的商品
            const allItems = [];
            Object.keys(cartMap).forEach(stallId => {
                cartMap[stallId].items.forEach(item => {
                    allItems.push({
                        name: item.item_desc || item.name || 'Item',
                        quantity: item.quantity || 1,
                        price: item.item_price || item.price || 0
                    });
                });
            });

            // 计算总价（加上 eco 费用）
            let totalAmount = 0;
            Object.keys(cartMap).forEach(stallId => {
                const items = cartMap[stallId].items;
                const isEco = cartMap[stallId].isEco || false;
                let stallTotal = 0;
                items.forEach(item => {
                    stallTotal += (item.item_price || item.price || 0) * (item.quantity || 1);
                });
                if (isEco) stallTotal += 0.3;
                totalAmount += stallTotal;
            });

            sendReceipt(customerEmail, {
                order_id: Object.values(ordersMap).join(', '),
                items: allItems,
                total: totalAmount
            }).then(result => {
                if (result) {
                    console.log('✅ Receipt sent to:', customerEmail);
                } else {
                    console.log('❌ Failed to send receipt');
                }
            });
        }

        return res.status(200).json({
            message: "Orders placed successfully. Food is now being prepared",
            orderIds: ordersMap,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    checkoutCart,
    getOrderById,
    getOrderByStallId,
    updateOrderStatus,
    getOrdersByCustomer,
};
