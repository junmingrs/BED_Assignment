const sql = require("mssql");
const { poolPromise } = require("../db");

async function getAllPromotions() {
    const query = "SELECT * FROM Promotion";
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    return result.recordset;
}

async function getActivePromotions() {
    const now = new Date();
    const query = "SELECT * FROM Promotion WHERE start_date <= @now AND end_date >= @now";
    const pool = await poolPromise;
    const result = await pool.request().input("now", now).query(query);
    return result.recordset;
}

async function getPromotionByCode(promotionCode) {
    const query = "SELECT * FROM Promotion WHERE promo_code = @promotionCode";
    const pool = await poolPromise;
    const result = await pool.request().input("promotionCode", promotionCode).query(query);
    return result.recordset.length === 0 ? null : result.recordset[0];
}

async function getPromotionByStallId(stallId) {
    const query = "SELECT * FROM Promotion WHERE stall_id = @stallId";
    const pool = await poolPromise;
    const result = await pool.request().input("stallId", stallId).query(query);
    return result.recordset;
}

async function createPromotion(promo) {
    const query = `
    INSERT INTO Promotion
    OUTPUT INSERTED.*
    VALUES (@promotionCode, @stallId, @itemCode, @discount, @start_date, @end_date)
  `;
    const pool = await poolPromise;
    const result = await pool.request()
        .input("promotionCode", promo.promotionCode)
        .input("stallId", promo.stallId)
        .input("itemCode", promo.itemCode)
        .input("discount", promo.discount)
        .input("start_date", promo.startDate)
        .input("end_date", promo.endDate)
        .query(query);

    return result.recordset[0];
}

async function updatePromotion(promo) {
    const query = `
    UPDATE Promotion
    SET discount = COALESCE(@discount, discount),
        start_date = COALESCE(@start_date, start_date),
        end_date = COALESCE(@end_date, end_date)
    OUTPUT INSERTED.*
    WHERE promo_code = @promotionCode
  `;
    const pool = await poolPromise;
    const result = await pool.request()
        .input("promotionCode", promo.promotionCode)
        .input("discount", promo.discount)
        .input("start_date", promo.startDate)
        .input("end_date", promo.endDate)
        .query(query);

    return result.recordset.length === 0 ? null : result.recordset[0];
}

async function deletePromotion(promotionCode) {
    const query = "DELETE FROM Promotion OUTPUT DELETED.* WHERE promo_code = @promotionCode";
    const pool = await poolPromise;
    const result = await pool.request().input("promotionCode", promotionCode).query(query);
    return result.recordset.length === 0 ? null : result.recordset[0];
}

module.exports = {
    getAllPromotions,
    getPromotionByCode,
    getActivePromotions,
    getPromotionByStallId,
    createPromotion,
    updatePromotion,
    deletePromotion,
};
