const complaintModel = require("../model/complaintModel");
const { getCustomerByAccountId } = require("../model/customerModel");
const { poolPromise } = require("../db");

// GET /stalls/:stallId/complaints - get complaints for a stall
const getComplaints = async (req, res) => {
    try {
        const { stallId } = req.params;
        const result = await complaintModel.getComplaintsByStallId(stallId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getComplaints:", error);
        res.status(500).json({ error: error.message });
    }
};

// POST /stalls/:stallId/complaints - submit a complaint
const submitComplaint = async (req, res) => {
    try {
        const { stallId } = req.params;
        const { subject, description } = req.body;
        const accountId = req.user.id;

        if (!subject || !description) {
            return res.status(400).json({
                error: "Missing required fields: subject, description"
            });
        }

        const pool = await poolPromise;
        const stallCheck = await pool.request()
            .input("stallId", stallId)
            .query("SELECT stall_id FROM Stall WHERE stall_id = @stallId");

        if (stallCheck.recordset.length === 0) {
            return res.status(404).json({ error: "Stall not found" });
        }

        const customer = await getCustomerByAccountId(accountId);
        if (!customer) {
            return res.status(404).json({ error: "Customer profile not found" });
        }

        const result = await complaintModel.createComplaint(
            stallId,
            customer.customer_id,
            subject,
            description
        );

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in submitComplaint:", error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /complaints/:complaintId - delete a complaint
const deleteComplaint = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const customerId = req.user.id;

        const result = await complaintModel.deleteComplaint(complaintId, customerId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in deleteComplaint:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getComplaints,
    submitComplaint,
    deleteComplaint
};