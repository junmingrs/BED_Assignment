const stallModel = require("../model/stallModel");
const { getCustomerByAccountId } = require("../model/customerModel");
const { poolPromise } = require("../db");  

const getStallInfo = async (req, res) => {
    try {
        const { stallId } = req.params;
        const result = await stallModel.getStallInfo(stallId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getStallInfo:", error);
        res.status(500).json({ error: error.message });
    }
};

<<<<<<< Updated upstream
const getStallIdByVendorId = async (req, res) => {
    const { vendorId } = req.params;
    try {
        const result = await stallModel.getStallIdByVendorId(vendorId);
        res.status(200).json(result.stall_id);
    } catch (error) {
        console.error("Error in getStallIdByVendorId:", error);
=======
// POST /stalls/:stallId/complaints - submit complaint
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

        // Check if stall exists - 使用 poolPromise
        const pool = await poolPromise;
        const stallCheck = await pool.request()
            .input("stallId", stallId)
            .query("SELECT stall_id FROM Stall WHERE stall_id = @stallId");

        if (stallCheck.recordset.length === 0) {
            return res.status(404).json({ error: "Stall not found" });
        }

        // Get customer_id from account_id
        const customer = await getCustomerByAccountId(accountId);
        console.log(accountId)
        if (!customer) {
            return res.status(404).json({ error: "Customer profile not found" });
        }

        const result = await stallModel.submitComplaint(stallId, customer.customer_id, {
            subject,
            description
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in submitComplaint:", error);
        res.status(500).json({ error: error.message });
    }
};

// POST /stalls/:stallId/ratings
const submitRating = async (req, res) => {
    try {
        const { stallId } = req.params;
        const { rating, comment } = req.body;
        const accountId = req.user.id;

        if (!rating) {
            return res.status(400).json({
                error: "Missing required field: rating"
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                error: "Rating must be between 1 and 5"
            });
        }

        // Check if stall exists - 使用 poolPromise
        const pool = await poolPromise;
        const stallCheck = await pool.request()
            .input("stallId", stallId)
            .query("SELECT stall_id FROM Stall WHERE stall_id = @stallId");

        if (stallCheck.recordset.length === 0) {
            return res.status(404).json({ error: "Stall not found" });
        }

        // Get customer_id from account_id
        const customer = await getCustomerByAccountId(accountId);
        if (!customer) {
            return res.status(404).json({ error: "Customer profile not found" });
        }

        const result = await stallModel.submitRating(stallId, customer.customer_id, {
            rating,
            comment
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in submitRating:", error);
>>>>>>> Stashed changes
        res.status(500).json({ error: error.message });
    }
};

const getAllStalls = async (req, res) => {
    try {
        const result = await stallModel.getAllStalls();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getAllStalls:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateStall = async (req, res) => {
    try {
        const { stallId } = req.params;
        const { stall_name, stall_unit_no } = req.body;
        const accountId = req.user.id;

        if (!stall_name && !stall_unit_no) {
            return res.status(400).json({
                error:
                    "At least one field to update is required: stall_name, stall_unit_no",
            });
        }

        // Check if stall exists and user has permission
        // (Only Vendor who owns the stall or Operator can update)
        const result = await stallModel.updateStall(stallId, accountId, {
            stall_name,
            stall_unit_no,
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error in updateStall:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getStallInfo,
<<<<<<< Updated upstream
    getAllStalls,
    updateStall,
    getStallIdByVendorId,
};
=======
    submitComplaint,
    submitRating
};
>>>>>>> Stashed changes
