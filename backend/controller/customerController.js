const customerModel = require("../model/customerModel.js");

async function getCustomerByAccountId(req, res) {
    try {
        const { customerId } = req.params;
        const customer = await customerModel.getCustomerByAccountId(customerId);
        res.status(200).json(customer);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch customer", details: err.message });
    }
}

async function addCustomerLoyaltyPoints(req, res) {
    try {
        const { customerId } = req.params;
        const { points } = req.body;
        const customer = await customerModel.addCustomerLoyaltyPoints(customerId, points);
        res.status(200).json(customer);
    } catch (err) {
        res.status(500).json({ error: "Failed to add customer loyalty points ", details: err.message });
    }
}

async function subtractCustomerLoyaltyPoints(req, res) {
    try {
        const { customerId } = req.params;
        const { points } = req.body;
        const customer = await customerModel.subtractCustomerLoyaltyPoints(customerId, points);
        res.status(200).json(customer);
    } catch (err) {
        res.status(500).json({ error: "Failed to subtract customer loyalty points", details: err.message });
    }
}

module.exports = { getCustomerByAccountId, addCustomerLoyaltyPoints, subtractCustomerLoyaltyPoints }

