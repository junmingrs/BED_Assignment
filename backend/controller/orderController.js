const orderModel = require("../model/orderModel");

// TODO: delete placeholder
// {
//     cart: [
//         {
//             stall_id: "",
//             item_code: "M001",
//             quantity: 3,
//             is_eco: false, // cart is sorted by stalls, and under each one you can tick if you want eco friendly packaging (like shopee)
//         },
//     ],
// };

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

async function checkoutCart(req, res) {
    const { cart, customerId } = req.body;
    const cartParsed = typeof cart == "string" ? JSON.parse(cart) : cart; // array

    // {stall_id: [item]}
    const cartMap = cartParsed.reduce((map, item) => {
        const stallId = item.stall_id;
        if (!map[stallId]) map[stallId] = [];
        map[stallId].push(item);
        return map;
    }, {});

    try {
        const orderPromises = Object.keys(cartMap).map(async (stallId) => {
            const orderId = crypto.randomUUID();
            const items = cartMap[stallId]; // []
            const total = await orderModel.getTotalAmount(stallId, items);
            const isEco = items[0]?.is_eco || false;

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

module.exports = { checkoutCart, getOrderById, getOrderByStallId };
