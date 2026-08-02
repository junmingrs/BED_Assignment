const { poolPromise } = require("../db");

// save (or overwrite) a vendor's Google tokens
const saveTokens = async (vendorId, tokens) => {
    const pool = await poolPromise;

    // upsert: delete existing row for this vendor, then insert fresh
    await pool
        .request()
        .input("vendorId", vendorId)
        .query("DELETE FROM VendorGoogleToken WHERE vendor_id = @vendorId");

    await pool
        .request()
        .input("vendorId", vendorId)
        .input("accessToken", tokens.access_token)
        .input("refreshToken", tokens.refresh_token ?? null)
        .input("tokenExpiry", tokens.expiry_date ? new Date(tokens.expiry_date) : null)
        .query(`
            INSERT INTO VendorGoogleToken (vendor_id, access_token, refresh_token, token_expiry)
            VALUES (@vendorId, @accessToken, @refreshToken, @tokenExpiry)
        `);
};

// get a vendor's stored tokens
const getTokens = async (vendorId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("vendorId", vendorId)
        .query("SELECT * FROM VendorGoogleToken WHERE vendor_id = @vendorId");

    return result.recordset.length === 0 ? null : result.recordset[0];
};

// disconnect - remove a vendor's stored tokens
const deleteTokens = async (vendorId) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("vendorId", vendorId)
        .query("DELETE FROM VendorGoogleToken WHERE vendor_id = @vendorId");
};

module.exports = { saveTokens, getTokens, deleteTokens };