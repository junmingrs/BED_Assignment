const { poolPromise } = require("../db");

// get feedback for a stall
const getFeedbackByStallId = async (stallId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT 
                feedback_id,
                description,
                created_at
            FROM Feedback
            WHERE stall_id = @stallId
            ORDER BY created_at DESC
        `);

    return result.recordset;
};

// create feedback
const createFeedback = async (stallId, customerId, description) => {
    const pool = await poolPromise;

    await pool.request()
        .input("stallId", stallId)
        .input("customerId", customerId)
        .input("description", description)
        .query(`
            INSERT INTO Feedback (stall_id, customer_id, description)
            VALUES (@stallId, @customerId, @description)
        `);

    const result = await pool.request()
        .input("stallId", stallId)
        .input("customerId", customerId)
        .query(`
            SELECT TOP 1
                feedback_id,
                stall_id,
                customer_id,
                description,
                created_at
            FROM Feedback
            WHERE stall_id = @stallId AND customer_id = @customerId
            ORDER BY created_at DESC
        `);

    return result.recordset[0];
};

// DELETE /feedback/:feedbackId - delete feedback
const deleteFeedback = async (feedbackId, customerId) => {
    const pool = await poolPromise;

    // Check if feedback exists and belongs to this customer
    const checkResult = await pool.request()
        .input("feedbackId", feedbackId)
        .input("customerId", customerId)
        .query(`
            SELECT feedback_id FROM Feedback 
            WHERE feedback_id = @feedbackId AND customer_id = @customerId
        `);

    if (checkResult.recordset.length === 0) {
        throw new Error("Feedback not found or you are not authorized to delete it");
    }

    await pool.request()
        .input("feedbackId", feedbackId)
        .query("DELETE FROM Feedback WHERE feedback_id = @feedbackId");

    return { message: "Feedback deleted successfully" };
};

module.exports = {
    getFeedbackByStallId,
    createFeedback,
    deleteFeedback
};