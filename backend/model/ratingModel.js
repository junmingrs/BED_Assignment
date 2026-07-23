const { poolPromise } = require("../db");
const { getTimeFilter } = require("../helper");

// GET /stalls/:stallId/ratings - get ratings for a stall
const getRatingsByStallId = async (stallId, timeframe = null) => {
    const pool = await poolPromise;
    const timeFilter = getTimeFilter(timeframe, "created_at");

    const result = await pool.request().input("stallId", stallId).query(`
            SELECT 
                rating_id,
                rating,
                comment,
                created_at
            FROM Rating
            WHERE stall_id = @stallId ${timeFilter}
            ORDER BY created_at DESC
        `);

    return result.recordset;
};

// POST /stalls/:stallId/ratings - create a rating
const createRating = async (stallId, customerId, rating, comment) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("stallId", stallId)
        .input("customerId", customerId)
        .input("rating", rating)
        .input("comment", comment || null).query(`
            INSERT INTO Rating (stall_id, customer_id, rating, comment)
            VALUES (@stallId, @customerId, @rating, @comment)
        `);

    const result = await pool
        .request()
        .input("stallId", stallId)
        .input("customerId", customerId).query(`
            SELECT TOP 1
                rating_id,
                stall_id,
                customer_id,
                rating,
                comment,
                created_at
            FROM Rating
            WHERE stall_id = @stallId AND customer_id = @customerId
            ORDER BY created_at DESC
        `);

    return result.recordset[0];
};

// DELETE /ratings/:ratingId - delete a rating
const deleteRating = async (ratingId, customerId) => {
    const pool = await poolPromise;

    // Check if rating exists and belongs to this customer
    const checkResult = await pool
        .request()
        .input("ratingId", ratingId)
        .input("customerId", customerId).query(`
            SELECT rating_id FROM Rating 
            WHERE rating_id = @ratingId AND customer_id = @customerId
        `);

    if (checkResult.recordset.length === 0) {
        throw new Error("Rating not found or you are not authorized to delete it");
    }

    await pool
        .request()
        .input("ratingId", ratingId)
        .query("DELETE FROM Rating WHERE rating_id = @ratingId");

    return { message: "Rating deleted successfully" };
};

module.exports = {
    getRatingsByStallId,
    createRating,
    deleteRating,
};
