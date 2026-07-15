// model/complaintModel.js
const { poolPromise } = require("../db");

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

const updateComplaintStatus = async (complaintId, status) => {
    const pool = await poolPromise;

    await pool.request()
        .input("complaintId", complaintId)
        .input("status", status)
        .query(`
            UPDATE Complaint
            SET status = @status
            WHERE complaint_id = @complaintId
        `);

    const result = await pool.request()
        .input("complaintId", complaintId)
        .query(`
            SELECT 
                complaint_id,
                stall_id,
                customer_id,
                subject,
                description,
                status,
                created_at
            FROM Complaint
            WHERE complaint_id = @complaintId
        `);

    return result.recordset[0];
};

module.exports = {
    createComplaint,
    getComplaintsByStallId,
    updateComplaintStatus
};