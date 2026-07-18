const feedbackModel = require("../model/feedbackModel");
const { poolPromise } = require("../db");

// get feedback for a stall
const getFeedback = async (req, res) => {
    try {
        const { stallId } = req.params;
        const result = await feedbackModel.getFeedbackByStallId(stallId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getFeedback:", error);
        res.status(500).json({ error: error.message });
    }
};

// submit feedback
const submitFeedback = async (req, res) => {
    try {
        const { stallId } = req.params;
        const { description } = req.body;
        const accountId = req.user.id;

        if (!description) {
            return res.status(400).json({ error: "Missing required field: description" });
        }

        const pool = await poolPromise;
        const stallCheck = await pool.request()
            .input("stallId", stallId)
            .query("SELECT stall_id FROM Stall WHERE stall_id = @stallId");

        if (stallCheck.recordset.length === 0) {
            return res.status(404).json({ error: "Stall not found" });
        }

        const result = await feedbackModel.createFeedback(
            stallId,
            accountId,
            description
        );

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in submitFeedback:", error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /feedback/:feedbackId - delete feedback
const deleteFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const customerId = req.user.id;

        const result = await feedbackModel.deleteFeedback(feedbackId, customerId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in deleteFeedback:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getFeedback,
    submitFeedback,
    deleteFeedback
};