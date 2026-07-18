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

async function createRefreshToken(account_id, refresh_token) {
    const query = `INSERT INTO RefreshToken (account_id, refresh_token) VALUES (@account_id, @refresh_token)`;
    const pool = await poolPromise;
    await pool
        .request()
        .input("account_id", account_id)
        .input("refresh_token", refresh_token)
        .query(query);
}

async function updateRefreshToken(account_id, refresh_token) {
    const query = `UPDATE RefreshToken SET refresh_token = @refresh_token WHERE account_id = @account_id`;
    const pool = await poolPromise;
    await pool
        .request()
        .input("account_id", account_id)
        .input("refresh_token", refresh_token)
        .query(query);
}

async function createCustomer(account_id, name) {
    const query = `INSERT INTO Customer (customer_id, customer_name) VALUES (@id, @name)`;
    const pool = await poolPromise;
    await pool.request().input("id", account_id).input("name", name).query(query);
}

async function createVendor(account_id) {
    const query = `INSERT INTO Vendor (vendor_id) VALUES (@id)`;
    const pool = await poolPromise;
    await pool.request().input("id", account_id).query(query);
}

async function createOperator(account_id) {
    const query = `INSERT INTO Operator (operator_id) VALUES (@id)`;
    const pool = await poolPromise;
    await pool.request().input("id", account_id).query(query);
}

async function createNEA(account_id) {
    const query = `INSERT INTO NEA (nea_id) VALUES (@id)`;
    const pool = await poolPromise;
    await pool.request().input("id", account_id).query(query);
}

async function findRefreshToken(refresh_token) {
    const query = `SELECT EXISTS (SELECT 1 FROM RefreshToken WHERE refresh_token = @refresh_token)`;
    const pool = await poolPromise;
    const exists = await pool.request().input("refresh_token", refresh_token).query(query);
    console.log(exists);
    return exists.recordset[0];
}

module.exports = {
    createAccount,
    getAccountById,
    getAccountByEmail,
    createCustomer,
    createVendor,
    createOperator,
    createNEA,
    createRefreshToken,
    updateRefreshToken,
    findRefreshToken,
};
