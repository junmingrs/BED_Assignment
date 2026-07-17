const { poolPromise } = require("../db");

// GET /stalls/:stallId/complaints - get complaints for a stall
const getComplaintsByStallId = async (stallId) => {
    const pool = await poolPromise;

    const result = await pool.request()
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

    return result.recordset;
};

// POST /stalls/:stallId/complaints - create a complaint
const createComplaint = async (stallId, customerId, subject, description) => {
    const pool = await poolPromise;

    await pool.request()
        .input("stallId", stallId)
        .input("customerId", customerId)
        .input("subject", subject)
        .input("description", description)
        .query(`
            INSERT INTO Complaint (stall_id, customer_id, subject, description, status)
            VALUES (@stallId, @customerId, @subject, @description, 'Open')
        `);

    const result = await pool.request()
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

    return result.recordset[0];
};

// DELETE /complaints/:complaintId - delete a complaint
const deleteComplaint = async (complaintId, customerId) => {
    const pool = await poolPromise;

    // Check if complaint exists and belongs to this customer
    const checkResult = await pool.request()
        .input("complaintId", complaintId)
        .input("customerId", customerId)
        .query(`
            SELECT complaint_id FROM Complaint 
            WHERE complaint_id = @complaintId AND customer_id = @customerId
        `);

    if (checkResult.recordset.length === 0) {
        throw new Error("Complaint not found or you are not authorized to delete it");
    }

    await pool.request()
        .input("complaintId", complaintId)
        .query("DELETE FROM Complaint WHERE complaint_id = @complaintId");

    return { message: "Complaint deleted successfully" };
};

module.exports = {
    getComplaintsByStallId,
    createComplaint,
    deleteComplaint
};