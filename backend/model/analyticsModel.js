const { poolPromise } = require("../db");

async function getKPI(stallId) {
    const query = `SELECT ISNULL(SUM(total_amount), 0) AS totalRevenue, COUNT(order_id) AS orderCount, ISNULL(AVG(total_amount), 0.00) AS averageOrderValue FROM Orders WHERE stall_id = @id`;
    const pool = await poolPromise;
    const result = await pool.request().input("id", stallId).query(query);

    if (result.recordset.length === 0) return null;
    return result.recordset[0];
}

module.exports = { getKPI };
