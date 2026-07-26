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

module.exports = { getAllCustomers, getCustomerByAccountId };
