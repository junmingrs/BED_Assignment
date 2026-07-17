const orderModel = require("../model/orderModel");

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
        const orderPromises = Object.keys(cartMap).map(async (stallId) => {
            const orderId = crypto.randomUUID();
            const items = cartMap[stallId].items; // []
            const total = await orderModel.getTotalAmount(stallId, items);
            const isEco = cartMap[stallId].isEco || false;

            await orderModel.createOrder(orderId, stallId, customerId, total, isEco);

            const itemPromises = items.map(async (item) => {
                await orderModel.createOrderItem(orderId, item);
            });

            // to avoid timing issues from async
            await Promise.all(itemPromises);

            return { stallId, orderId };
        });

        const createdOrders = await Promise.all(orderPromises);
        // {stallId: orderId}
        const ordersMap = createdOrders.reduce((map, current) => {
            map[current.stallId] = current.orderId;
            return map;
        }, {});

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
