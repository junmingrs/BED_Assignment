const { wsMessages } = require("../../public/js/const.js");
const orderModel = require("../model/orderModel");
const { broadcast } = require("../ws");
const crypto = require("crypto");
const {
    addCustomerLoyaltyPoints,
    getCustomerByAccountId,
    subtractCustomerLoyaltyPoints,
} = require("../model/customerModel.js");
const { sendReceipt } = require("../model/emailModel.js");
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
        const orders = await orderModel.getOrdersByCustomer(
            customerId,
            statuses,
        );
        return res.status(200).json(orders);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getOrderByStallId(req, res) {
    const { stallId } = req.params;
    const timeframe = req.query.timeframe || null;
    try {
        const orders = await orderModel.getOrderByStallId(stallId, timeframe);
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
    const { cart, customerId, loyaltyPoints = 0 } = req.body;
    const { isGuest } = req.user;

    try {
        const pool = await poolPromise;
        const customerResult = await pool
            .request()
            .input("customerId", customerId)
            .query(
                `SELECT account_email FROM Account WHERE account_id = @customerId`,
            );

        const customerEmail = customerResult.recordset[0]?.account_email;
        const orderPromises = Object.keys(cart).map(async (stallId) => {
            const orderId = crypto.randomUUID();
            const items = cart[stallId].items;
            const isEco = cart[stallId].isEco || false;

            let total = await orderModel.getTotalAmount(items);
            if (isEco) total += 0.3;

            await orderModel.createOrder(
                orderId,
                stallId,
                customerId,
                total,
                isEco,
            );

            const itemPromises = items.map(async (item) => {
                await orderModel.createOrderItem(orderId, { ...item, stallId });
            });

            await Promise.all(itemPromises);

            return { stallId, orderId };
        });

        const createdOrders = await Promise.all(orderPromises);
        const ordersMap = createdOrders.reduce((map, current) => {
            map[current.stallId] = current.orderId;

            broadcast({
                type: wsMessages.newOrder,
                stallId: current.stallId,
                orderId: current.orderId,
            });

            return map;
        }, {});

        // ===== 发送收据邮件 =====
        let totalAmount = 0;
        if (customerEmail && !isGuest) {
            const allItems = [];

            for (const stallId of Object.keys(cart)) {
                const items = cart[stallId].items;
                const isEco = cart[stallId].isEco || false;
                let stallTotal = 0;

                for (const item of items) {
                    const menuItemResult = await pool
                        .request()
                        .input("stallId", stallId)
                        .input("itemCode", item.itemCode)
                        .query(
                            `SELECT item_desc, item_price FROM MenuItem WHERE stall_id = @stallId AND item_code = @itemCode`,
                        );

                    const menuItem = menuItemResult.recordset[0];
                    const price =
                        menuItem?.item_price ||
                        item.item_price ||
                        item.price ||
                        0;

                    const qty = item.quantity || 1;
                    stallTotal += price * qty;

                    allItems.push({
                        name: menuItem?.item_desc || "Item",
                        quantity: qty,
                        price: price,
                    });
                }

                if (isEco) stallTotal += 0.3;
                totalAmount += stallTotal;
            }

            if (loyaltyPoints > 0) {
                const customer = await getCustomerByAccountId(customerId);
                const pointsUsed = Math.min(
                    loyaltyPoints,
                    customer?.loyalty_points || 0,
                );
                const discount = Math.min(pointsUsed * 0.1, totalAmount);
                totalAmount -= discount;
                if (pointsUsed > 0) {
                    await subtractCustomerLoyaltyPoints(customerId, pointsUsed);
                }
            }

            console.log(
                " Sending receipt items:",
                JSON.stringify(allItems, null, 2),
            );
            console.log(" Total amount:", totalAmount);

            console.log(
                " Sending receipt items:",
                JSON.stringify(allItems, null, 2),
            );
            console.log(" Total amount:", totalAmount);

            sendReceipt(customerEmail, {
                order_id: Object.values(ordersMap).join(", "),
                items: allItems,
                total: totalAmount,
            }).then((result) => {
                if (result) {
                    console.log(" Receipt sent to:", customerEmail);
                } else {
                    console.log(" Failed to send receipt");
                }
            });
        }
        await addCustomerLoyaltyPoints(customerId, Math.ceil(totalAmount / 10));

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
