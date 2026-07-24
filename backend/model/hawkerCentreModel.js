const sql = require("mssql");
const { poolPromise } = require("../db");

// Get all hawker centres
async function getAllHawkerCentres() {
  const query = "SELECT * FROM HawkerCentre";
  const pool = await poolPromise;
  const result = await pool.request().query(query);
  return result.recordset;
}

// Get a single hawker centre by id
async function getHawkerCentreById(hawkerCentreId) {
  const query = "SELECT * FROM HawkerCentre WHERE hawker_centre_id = @hawker_centre_id";
  const pool = await poolPromise;
  const result = await pool.request()
    .input("hawker_centre_id", hawkerCentreId)
    .query(query);
  return result.recordset.length === 0 ? null : result.recordset[0];
}

// Get all stalls under a specific hawker centre
async function getStallsByHawkerCentreId(hawkerCentreId) {
  const query = "SELECT * FROM Stall WHERE hawker_centre_id = @hawker_centre_id";
  const pool = await poolPromise;
  const result = await pool.request()
    .input("hawker_centre_id", hawkerCentreId)
    .query(query);
  return result.recordset;
}

module.exports = {
  getAllHawkerCentres,
  getHawkerCentreById,
  getStallsByHawkerCentreId,
};