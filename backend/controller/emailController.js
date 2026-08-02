// backend/controller/emailController.js
const { sendReceipt } = require("../model/emailModel");

// POST /send-receipt - send email receipt via Resend API
const sendReceiptEmail = async (req, res) => {
    try {
        const { orderId, email, items, total } = req.body;

        // 验证
        if (!email || !orderId || !items || items.length === 0) {
            return res.status(400).json({
                error: "Missing required fields: email, orderId, items"
            });
        }

        const result = await sendReceipt(email, {
            order_id: orderId,
            items: items.map(item => ({
                name: item.name || item.item_desc || 'Item',
                quantity: item.quantity || 1,
                price: item.price || item.item_price || 0
            })),
            total: total || 0
        });

        if (result) {
            res.status(200).json({
                message: "Receipt sent successfully",
                sentTo: email
            });
        } else {
            res.status(500).json({ error: "Failed to send receipt" });
        }
    } catch (error) {
        console.error("Error in sendReceiptEmail:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { sendReceiptEmail };