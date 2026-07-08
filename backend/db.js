const sql = require("mssql");
const dbConfig = require("./dbConfig");

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL");
    return pool;
  })
  .catch((err) => {
    console.log("Database connection failed. Error: ", err);
    throw err
  });

module.exports = { poolPromise };
