// model/stallModel.js
const { poolPromise } = require("../db");

// GET /stalls/:stallId - get stall info (only stall details)
const getStallInfo = async (stallId) => {
    const pool = await poolPromise;

    // 1. Get stall basic info
    const stallResult = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT 
                s.stall_id,
                s.stall_name,
                s.stall_unit_no,
                v.vendor_id,
                a.account_email
            FROM Stall s
            JOIN Vendor v ON s.vendor_id = v.vendor_id
            JOIN Account a ON v.vendor_id = a.account_id
            WHERE s.stall_id = @stallId
        `);

    if (stallResult.recordset.length === 0) {
        throw new Error("Stall not found");
    }

    const stall = stallResult.recordset[0];

    // 4. Get ratings
    const ratingsResult = await pool.request()
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

    // 5. Get complaints
    const complaintsResult = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT 
                complaint_id,
                subject,
                description,
                status,
                created_at
            FROM Complaint
            WHERE stall_id = @stallId
            ORDER BY created_at DESC
        `);

    return {
        stall: stall,
        ratings: ratingsResult.recordset,
        complaints: complaintsResult.recordset
    };
};

// PUT /stalls/:stallId - update stall info
const updateStall = async (stallId, accountId, updateData) => {
    const { stall_name, stall_unit_no } = updateData;
    const pool = await poolPromise;

    // Check if stall exists and belongs to this vendor
    const stallCheck = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT s.stall_id, v.vendor_id
            FROM Stall s
            JOIN Vendor v ON s.vendor_id = v.vendor_id
            WHERE s.stall_id = @stallId
        `);

    if (stallCheck.recordset.length === 0) {
        throw new Error("Stall not found");
    }

    if (stallCheck.recordset[0].account_id !== accountId) {
        throw new Error("You are not authorized to update this stall");
    }

    // Build dynamic update query
    let updateQuery = "UPDATE Stall SET ";
    const updates = [];
    const request = pool.request();
    request.input("stallId", stallId);

    if (stall_name !== undefined) {
        updates.push("stall_name = @stallName");
        request.input("stallName", stall_name);
    }
    if (stall_unit_no !== undefined) {
        updates.push("stall_unit_no = @stallUnitNo");
        request.input("stallUnitNo", stall_unit_no);
    }

    if (updates.length === 0) {
        throw new Error("No fields to update");
    }

    updateQuery += updates.join(", ");
    updateQuery += " WHERE stall_id = @stallId";

    await request.query(updateQuery);

    // Return updated stall
    const result = await pool.request().input("stallId", stallId).query(`
            SELECT 
                s.stall_id,
                s.stall_name,
                s.stall_unit_no,
                v.vendor_id,
                a.account_email
            FROM Stall s
            JOIN Vendor v ON s.vendor_id = v.vendor_id
            JOIN Account a ON v.vendor_id = a.vendor_id
            WHERE s.stall_id = @stallId
        `);

    return result.recordset[0];
};

// GET /stalls - get all stalls
const getAllStalls = async () => {
    const pool = await poolPromise;

    const result = await pool.request().query(`
            SELECT 
                s.stall_id,
                s.stall_name,
                s.stall_unit_no,
                v.vendor_id
            FROM Stall s
            JOIN Vendor v ON s.vendor_id = v.vendor_id
            ORDER BY s.stall_name
        `);

    return result.recordset;
};

const getStallIdByVendorId = async (vendorId) => {
    const pool = await poolPromise;

    const stallResult = await pool.request().input("vendorId", vendorId).query(`
            SELECT
                s.stall_id
            FROM Stall s
            WHERE s.vendor_id = @vendorId
        `);

    if (stallResult.recordset.length === 0) {
        throw new Error("Stall not found");
    }

    return stallResult.recordset[0];
};

const getStallById = async (stallId) => {
    const query = "SELECT * FROM Stall WHERE stall_id = @stall_id";
    const pool = await poolPromise;
    const stallResult = await pool.request().input("stall_id", stallId).query(query);
    return stallResult.recordset[0];
}

// POST /stalls/:stallId/complaints - submit complaint
const submitComplaint = async (stallId, customerId, complaintData) => {
    const { subject, description } = complaintData;
    const pool = await poolPromise;

    const result = await pool.request()
        .input("stallId", stallId)
        .input("customerId", customerId)
        .input("subject", subject)
        .input("description", description)
        .query(`
            INSERT INTO Complaint (stall_id, customer_id, subject, description, status)
            VALUES (@stallId, @customerId, @subject, @description, 'Open')
        `);

    // Return the newly created complaint
    const newComplaint = await pool.request()
        .input("stallId", stallId)
        .input("customerId", customerId)
        .query(`
            SELECT TOP 1 
                complaint_id,
                stall_id,
                customer_id,
                subject,
                description,
                status,
                created_at
            FROM Complaint
            WHERE stall_id = @stallId AND customer_id = @customerId
            ORDER BY created_at DESC
        `);

    return newComplaint.recordset[0];
};

// POST /stalls/:stallId/ratings - submit rating
const submitRating = async (stallId, customerId, ratingData) => {
    const { rating, comment } = ratingData;
    const pool = await poolPromise;

    const result = await pool.request()
        .input("stallId", stallId)
        .input("customerId", customerId)
        .input("rating", rating)
        .input("comment", comment || null)
        .query(`
            INSERT INTO Rating (stall_id, customer_id, rating, comment)
            VALUES (@stallId, @customerId, @rating, @comment)
        `);

    // Return the newly created rating
    const newRating = await pool.request()
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

    return newRating.recordset[0];
};

module.exports = {
    getStallInfo,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    submitComplaint,
    submitRating
};
