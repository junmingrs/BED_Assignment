const sql = require("mssql");
const { poolPromise } = require("../config/db"); // adjust path to match your db config

async function createPromotion({ stallId, title, description, startDate, endDate }) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("stallId", sql.Int, stallId)
    .input("title", sql.VarChar, title)
    .input("description", sql.VarChar, description)
    .input("startDate", sql.Date, startDate)
    .input("endDate", sql.Date, endDate)
    .query(`INSERT INTO Promotion (stallId, title, description, startDate, endDate)
            OUTPUT INSERTED.*
            VALUES (@stallId, @title, @description, @startDate, @endDate)`);
  return result.recordset[0];
}

async function getPromotionsByStallId(stallId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("stallId", sql.Int, stallId)
    .query("SELECT * FROM Promotion WHERE stallId = @stallId");
  return result.recordset;
}

async function updatePromotion({ promotionId, title, description, startDate, endDate }) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("promotionId", sql.Int, promotionId)
    .input("title", sql.VarChar, title)
    .input("description", sql.VarChar, description)
    .input("startDate", sql.Date, startDate)
    .input("endDate", sql.Date, endDate)
    .query(`UPDATE Promotion
            SET title = @title, description = @description,
                startDate = @startDate, endDate = @endDate
            OUTPUT INSERTED.*
            WHERE promotionId = @promotionId`);
  return result.recordset[0];
}

async function deletePromotion(promotionId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("promotionId", sql.Int, promotionId)
    .query("DELETE FROM Promotion OUTPUT DELETED.* WHERE promotionId = @promotionId");
  return result.recordset[0];
}

module.exports = { createPromotion, getPromotionsByStallId, updatePromotion, deletePromotion };