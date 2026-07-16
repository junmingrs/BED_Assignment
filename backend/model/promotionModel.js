const sql = require("mssql");
const { poolPromise } = require("../db");

async function getPromotionsByStallId(stallId) {
  const query = "SELECT * FROM Promotion WHERE stall_id = @stall_id";
  const pool = await poolPromise;
  const result = await pool.request().input("stall_id", stallId).query(query);
  return result.recordset;
}

async function getPromotionById(promotionId) {
  const query = "SELECT * FROM Promotion WHERE promotion_id = @promotion_id";
  const pool = await poolPromise;
  const result = await pool.request().input("promotion_id", promotionId).query(query);
  return result.recordset.length === 0 ? null : result.recordset[0];
}

async function createPromotion(promo) {
  const query = `
    INSERT INTO Promotion (stall_id, title, description, start_date, end_date)
    OUTPUT INSERTED.*
    VALUES (@stall_id, @title, @description, @start_date, @end_date)
  `;
  const pool = await poolPromise;
  const result = await pool.request()
    .input("stall_id", promo.stallId)
    .input("title", promo.title)
    .input("description", promo.description)
    .input("start_date", promo.startDate)
    .input("end_date", promo.endDate)
    .query(query);

  return result.recordset[0];
}

async function updatePromotion(promo) {
  const query = `
    UPDATE Promotion
    SET title = COALESCE(@title, title),
        description = COALESCE(@description, description),
        start_date = COALESCE(@start_date, start_date),
        end_date = COALESCE(@end_date, end_date)
    OUTPUT INSERTED.*
    WHERE promotion_id = @promotion_id
  `;
  const pool = await poolPromise;
  const result = await pool.request()
    .input("promotion_id", promo.promotionId)
    .input("title", promo.title)
    .input("description", promo.description)
    .input("start_date", promo.startDate)
    .input("end_date", promo.endDate)
    .query(query);

  return result.recordset.length === 0 ? null : result.recordset[0];
}

async function deletePromotion(promotionId) {
  const query = "DELETE FROM Promotion OUTPUT DELETED.* WHERE promotion_id = @promotion_id";
  const pool = await poolPromise;
  const result = await pool.request().input("promotion_id", promotionId).query(query);
  return result.recordset.length === 0 ? null : result.recordset[0];
}

module.exports = {
  getPromotionsByStallId,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
};