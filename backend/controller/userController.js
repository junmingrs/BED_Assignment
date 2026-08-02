const customerModel = require("../model/customerModel.js");

async function getCustomerByAccountId(req, res) {
    try {
        const { customerId } = req.params;
        console.log(customerId);
        const customer = await customerModel.getCustomerByAccountId(customerId);
        res.status(200).json(customer);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch promotions", details: err.message });
    }
}

module.exports = { getCustomerByAccountId }

