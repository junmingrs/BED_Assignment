const { poolPromise } = require("../db");

async function getAccountByEmail(email) {
    const query = `SELECT account_id, account_name, account_email, password_hash, role FROM Account WHERE account_email= @email`;
    const pool = await poolPromise;
    const result = await pool.request().input("email", email).query(query);

    if (result.recordset.length === 0) return null; // User not found
    return result.recordset[0];
}

async function getAccountById(id) {
    const query = `SELECT account_id, account_name, account_email, password_hash, role FROM Account WHERE account_id= @id`;
    const pool = await poolPromise;
    const result = await pool.request().input("id", id).query(query);

    if (result.recordset.length === 0) return null; // User not found
    return result.recordset[0];
}

async function createAccount(account) {
    const query = `INSERT INTO Account (account_name, account_email, password_hash, role) VALUES (@account_name, @account_email, @password_hash, @role); SELECT SCOPE_IDENTITY() AS user_id;`;
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("account_name", account.name)
        .input("account_email", account.email)
        .input("password_hash", account.passwordHash)
        .input("role", account.role)
        .query(query);

    const newId = result.recordset[0].account_id;
    return await getAccountById(newId);
}

module.exports = { createAccount, getAccountById, getAccountByEmail };
