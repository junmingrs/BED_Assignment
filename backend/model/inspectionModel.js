const { poolPromise } = require("../db");

// get inspections for a stall 
const getInspectionsByStallId = async (stallId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT 
                i.inspection_id,
                i.inspection_date,
                i.score,
                i.remarks,
                i.hygiene_grade,
                i.status,
                a.account_email AS nea_email
            FROM Inspection i
            JOIN NEA n ON i.nea_id = n.nea_id
            JOIN Account a ON n.nea_id = a.account_id
            WHERE i.stall_id = @stallId
            ORDER BY i.inspection_date DESC
        `);

    return result.recordset;
};

// create an inspection 
const createInspection = async (stallId, neaId, score, remarks, hygieneGrade) => {
    const pool = await poolPromise;

    await pool.request()
        .input("stallId", stallId)
        .input("neaId", neaId)
        .input("score", score)
        .input("remarks", remarks || null)
        .input("hygieneGrade", hygieneGrade)
        .query(`
            INSERT INTO Inspection (stall_id, nea_id, score, remarks, hygiene_grade)
            VALUES (@stallId, @neaId, @score, @remarks, @hygieneGrade)
        `);

    const result = await pool.request()
        .input("stallId", stallId)
        .input("neaId", neaId)
        .query(`
            SELECT TOP 1
                inspection_id,
                stall_id,
                nea_id,
                inspection_date,
                score,
                remarks,
                hygiene_grade
            FROM Inspection
            WHERE stall_id = @stallId AND nea_id = @neaId
            ORDER BY inspection_date DESC
        `);

    return result.recordset[0];
};

// delete an inspection 
const deleteInspection = async (inspectionId) => {
    const pool = await poolPromise;

    const checkResult = await pool.request()
        .input("inspectionId", inspectionId)
        .query(`
            SELECT inspection_id FROM Inspection 
            WHERE inspection_id = @inspectionId
        `);

    if (checkResult.recordset.length === 0) {
        throw new Error("Inspection not found");
    }

    await pool.request()
        .input("inspectionId", inspectionId)
        .query("DELETE FROM Inspection WHERE inspection_id = @inspectionId");

    return { message: "Inspection deleted successfully" };
};

// get a single inspection 
const getInspectionById = async (inspectionId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("inspectionId", inspectionId)
        .query(`
            SELECT 
                inspection_id,
                stall_id,
                inspection_date,
                score,
                remarks,
                hygiene_grade
            FROM Inspection
            WHERE inspection_id = @inspectionId
        `);

    if (result.recordset.length === 0) return null;
    return result.recordset[0];
};

// update an inspection 
const updateInspection = async (inspectionId, updateData) => {
    const { score, remarks, hygiene_grade } = updateData;
    const pool = await poolPromise;

    let updateQuery = "UPDATE Inspection SET ";
    const updates = [];
    const request = pool.request();
    request.input("inspectionId", inspectionId);

    if (score !== undefined) {
        updates.push("score = @score");
        request.input("score", score);
    }
    if (remarks !== undefined) {
        updates.push("remarks = @remarks");
        request.input("remarks", remarks || null);
    }
    if (hygiene_grade !== undefined) {
        updates.push("hygiene_grade = @hygiene_grade");
        request.input("hygiene_grade", hygiene_grade);
    }

    if (updates.length === 0) {
        throw new Error("No fields to update");
    }

    updateQuery += updates.join(", ");
    updateQuery += " WHERE inspection_id = @inspectionId";

    await request.query(updateQuery);

    const result = await pool.request()
        .input("inspectionId", inspectionId)
        .query(`
            SELECT 
                inspection_id,
                stall_id,
                inspection_date,
                score,
                remarks,
                hygiene_grade
            FROM Inspection
            WHERE inspection_id = @inspectionId
        `);

    return result.recordset[0];
};

module.exports = {
    getInspectionsByStallId,
    createInspection,
    deleteInspection,      
    getInspectionById,
    updateInspection
};