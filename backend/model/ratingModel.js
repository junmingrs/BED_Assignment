const { poolPromise } = require("../db");

// GET /stalls/:stallId/ratings - get ratings for a stall
const getRatingsByStallId = async (stallId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT 
                rating_id,
                rating,
                comment,
                created_at
            FROM Rating
            WHERE stall_id = @stallId
            ORDER BY created_at DESC
        `);

    return result.recordset;
};

// POST /stalls/:stallId/ratings - create a rating
const createRating = async (stallId, customerId, rating, comment) => {
    const pool = await poolPromise;

    await pool.request()
        .input("stallId", stallId)
        .input("customerId", customerId)
        .input("rating", rating)
        .input("comment", comment || null)
        .query(`
            INSERT INTO Rating (stall_id, customer_id, rating, comment)
            VALUES (@stallId, @customerId, @rating, @comment)
        `);

    const result = await pool.request()
        .input("stallId", stallId)
        .input("customerId", customerId)
        .query(`
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

module.exports = {
    getRatingsByStallId,
    createRating
};