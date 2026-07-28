<<<<<<< Updated upstream
const { poolPromise } = require("../db");

const getCustomerByAccountId = async (accountId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("accountId", accountId)
        .query(`
            SELECT customer_id, customer_name
            FROM Customer
            WHERE customer_id = @accountId
        `);

    if (result.recordset.length === 0) return null;
    return result.recordset[0];
};

module.exports = { getAllCustomers, getCustomerByAccountId };
=======
// customerModel.js
const { poolPromise } = require("../db");

async function getCustomerByAccountId(accountId) {
    const query = `SELECT customer_id, account_id, customer_name FROM Customer WHERE account_id = @accountId`;
    const pool = await poolPromise;
    const result = await pool.request().input("accountId", accountId).query(query);
    if (result.recordset.length === 0) return null;
    return result.recordset[0];
}

module.exports = { getCustomerByAccountId };
>>>>>>> Stashed changes
