const ratingModel = require("../model/ratingModel");
const { getCustomerByAccountId } = require("../model/customerModel");
const { poolPromise } = require("../db");

// GET /stalls/:stallId/ratings - get ratings for a stall
const getRatings = async (req, res) => {
    try {
        const { stallId } = req.params;
        const result = await ratingModel.getRatingsByStallId(stallId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getRatings:", error);
        res.status(500).json({ error: error.message });
    }
};

// POST /stalls/:stallId/ratings - submit a rating
const submitRating = async (req, res) => {
    try {
        const { stallId } = req.params;
        const { rating, comment } = req.body;
        const accountId = req.user.id;

        if (!rating) {
            return res.status(400).json({ error: "Missing required field: rating" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
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

        const result = await ratingModel.createRating(
            stallId,
            customer.customer_id,
            rating,
            comment
        );

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in submitRating:", error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /ratings/:ratingId - delete a rating
const deleteRating = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const customerId = req.user.id;

        const result = await ratingModel.deleteRating(ratingId, customerId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in deleteRating:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getRatings,
    submitRating,
    deleteRating
};