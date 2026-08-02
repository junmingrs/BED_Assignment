const { poolPromise } = require("../db");

const getAllCustomers = async () => {
    const query = "SELECT * FROM Customer;";
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    return result.recordset;
}

const getCustomerByAccountId = async (accountId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("accountId", accountId)
        .query(`
            SELECT *
            FROM Customer
            WHERE customer_id = @accountId
        `);

    if (result.recordset.length === 0) return null;
    return result.recordset[0];
};

const addCustomerLoyaltyPoints = async (accountId, points) => {
    const pool = await poolPromise;

    console.log(accountId)
    const pointsResult = await pool.request().input("accountId", accountId).query(`
        SELECT loyalty_points FROM Customer WHERE customer_id = @accountId;
    `);
    const currentPoints = pointsResult.recordset[0].loyalty_points;

    await pool.request().input("accountId", accountId).input("updatedPoints", currentPoints + points).query(`
        UPDATE Customer SET loyalty_points = @updatedPoints WHERE customer_id = @accountId;
    `);
    const result = await getCustomerByAccountId(accountId);
    return result;
};

const subtractCustomerLoyaltyPoints = async (accountId, points) => {
    const pool = await poolPromise;

    const pointsResult = await pool.request().input("accountId", accountId).query(`
        SELECT loyalty_points FROM Customer WHERE customer_id = @accountId;
    `);
    const currentPoints = pointsResult.recordset[0].loyalty_points;
    await pool.request().input("accountId", accountId).input("updatedPoints", Math.max(currentPoints - points, 0)).query(`
        UPDATE Customer SET loyalty_points = @updatedPoints WHERE customer_id = @accountId;
    `);
    const result = await getCustomerByAccountId(accountId);
    return result;
};

module.exports = { getAllCustomers, getCustomerByAccountId, addCustomerLoyaltyPoints, subtractCustomerLoyaltyPoints };
