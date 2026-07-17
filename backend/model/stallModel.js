// model/stallModel.js
const { poolPromise } = require("../db");

// GET /stalls/:stallId - get stall info
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

module.exports = {
  getStallInfo,
  getStallIdByVendorId
};
