const { poolPromise } = require("../db");

async function getAccountByEmail(email) {
    const query = `SELECT account_id, account_email, password_hash, role FROM Account WHERE account_email= @email`;
    const pool = await poolPromise;
    const result = await pool.request().input("email", email).query(query);

    if (result.recordset.length === 0) return null; // User not found
    return result.recordset[0];
}

async function getAccountById(id) {
    const query = `SELECT account_id, account_email, password_hash, role FROM Account WHERE account_id= @id`;
    const pool = await poolPromise;
    const result = await pool.request().input("id", id).query(query);

    if (result.recordset.length === 0) return null; // User not found
    return result.recordset[0];
}

async function createAccount(account) {
    const query = `INSERT INTO Account (account_email, password_hash, role) 
        OUTPUT INSERTED.account_id
        VALUES (@account_email, @password_hash, @role);`;
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("account_email", account.email)
        .input("password_hash", account.passwordHash)
        .input("role", account.role)
        .query(query);

    const newId = result.recordset[0].account_id;
    return newId;
}

async function createCustomer(account_id, name) {
    const query = `INSERT INTO Customer (account_id, customer_name) VALUES (@account_id, @name)`;
    const pool = await poolPromise;
    await pool
        .request()
        .input("account_id", account_id)
        .input("name", name)
        .query(query);
}

async function createVendor(account_id) {
    const query = `INSERT INTO Vendor (account_id) VALUES (@account_id)`;
    const pool = await poolPromise;
    await pool.request().input("account_id", account_id).query(query);
}

async function createOperator(account_id) {
    const query = `INSERT INTO Operator (account_id) VALUES (@account_id)`;
    const pool = await poolPromise;
    await pool.request().input("account_id", account_id).query(query);
}

async function createNEA(account_id) {
    const query = `INSERT INTO NEA (account_id) VALUES (@account_id)`;
    const pool = await poolPromise;
    await pool.request().input("account_id", account_id).query(query);
}

module.exports = {
    createAccount,
    getAccountById,
    getAccountByEmail,
    createCustomer,
    createVendor,
    createOperator,
    createNEA,
};
