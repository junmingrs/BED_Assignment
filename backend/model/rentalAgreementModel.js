const sql = require("mssql");
const { poolPromise } = require("../db");

// Get all rental agreements for a specific stall
async function getRentalAgreementsByStallId(stallId) {
  const query = "SELECT * FROM RentalAgreement WHERE stall_id = @stall_id";
  const pool = await poolPromise;
  const result = await pool.request().input("stall_id", stallId).query(query);
  return result.recordset;
}

// Get a single rental agreement by id
async function getRentalAgreementById(rentalAgreementId) {
  const query = "SELECT * FROM RentalAgreement WHERE rental_agreement_id = @rental_agreement_id";
  const pool = await poolPromise;
  const result = await pool.request().input("rental_agreement_id", rentalAgreementId).query(query);
  return result.recordset.length === 0 ? null : result.recordset[0];
}

// Create new rental agreement
async function createRentalAgreement(agreement) {
  const query = `
    INSERT INTO RentalAgreement (stall_id, operator_id, start_date, end_date, rental_fee, status)
    OUTPUT INSERTED.*
    VALUES (@stall_id, @operator_id, @start_date, @end_date, @rental_fee, @status)
  `;
  const pool = await poolPromise;
  const result = await pool.request()
    .input("stall_id", agreement.stallId)
    .input("operator_id", agreement.operatorId)
    .input("start_date", agreement.startDate)
    .input("end_date", agreement.endDate)
    .input("rental_fee", agreement.rentalFee)
    .input("status", agreement.status || "Active")
    .query(query);

  return result.recordset[0];
}

// Update rental agreement
async function updateRentalAgreement(agreement) {
  const query = `
    UPDATE RentalAgreement
    SET start_date = COALESCE(@start_date, start_date),
        end_date = COALESCE(@end_date, end_date),
        rental_fee = COALESCE(@rental_fee, rental_fee),
        status = COALESCE(@status, status)
    OUTPUT INSERTED.*
    WHERE rental_agreement_id = @rental_agreement_id
  `;
  const pool = await poolPromise;
  const result = await pool.request()
    .input("rental_agreement_id", agreement.rentalAgreementId)
    .input("start_date", agreement.startDate)
    .input("end_date", agreement.endDate)
    .input("rental_fee", agreement.rentalFee)
    .input("status", agreement.status)
    .query(query);

  return result.recordset.length === 0 ? null : result.recordset[0];
}

module.exports = {
  getRentalAgreementsByStallId,
  getRentalAgreementById,
  createRentalAgreement,
  updateRentalAgreement,
};