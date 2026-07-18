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
    const result = await pool.request()
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
            JOIN Account a ON v.vendor_id = a.vendor_id
            WHERE s.stall_id = @stallId
        `);

    return result.recordset[0];
};

// GET /stalls - get all stalls
const getAllStalls = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .query(`
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
}
module.exports = {
  getStallInfo,
  getStallIdByVendorId,
  getStallInfo,
  updateStall,
  getAllStalls,
};
