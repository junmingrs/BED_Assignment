const { poolPromise } = require("../db");

// NEW: schedule a future inspection (no score/grade yet)
const scheduleInspection = async (stallId, neaId, inspectionDate) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("stallId", stallId)
        .input("neaId", neaId)
        .input("inspectionDate", inspectionDate)
        .query(`
            INSERT INTO Inspection (stall_id, nea_id, inspection_date, status)
            VALUES (@stallId, @neaId, @inspectionDate, 'Scheduled')
        `);

    const result = await pool
        .request()
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
                hygiene_grade,
                status
            FROM Inspection
            WHERE stall_id = @stallId AND nea_id = @neaId AND status = 'Scheduled'
            ORDER BY inspection_date DESC
        `);

    return result.recordset[0];
};

// NEW: complete a previously scheduled inspection (fills in score/grade, flips status)
const completeInspection = async (inspectionId, score, remarks, hygieneGrade) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("inspectionId", inspectionId)
        .input("score", score)
        .input("remarks", remarks || null)
        .input("hygieneGrade", hygieneGrade)
        .query(`
            UPDATE Inspection
            SET score = @score,
                remarks = @remarks,
                hygiene_grade = @hygieneGrade,
                status = 'Completed'
            WHERE inspection_id = @inspectionId
        `);

    const result = await pool
        .request()
        .input("inspectionId", inspectionId)
        .query(`
            SELECT
                inspection_id,
                stall_id,
                nea_id,
                inspection_date,
                score,
                remarks,
                hygiene_grade,
                status
            FROM Inspection
            WHERE inspection_id = @inspectionId
        `);

    return result.recordset[0];
};

// NEW: get scheduled (upcoming) inspections for a stall - used for vendor calendar sync
const getScheduledInspectionsByStallId = async (stallId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("stallId", stallId)
        .query(`
            SELECT
                inspection_id,
                stall_id,
                inspection_date,
                status
            FROM Inspection
            WHERE stall_id = @stallId AND status = 'Scheduled'
            ORDER BY inspection_date ASC
        `);

    return result.recordset;
};

module.exports = {
    scheduleInspection,
    completeInspection,
    getScheduledInspectionsByStallId,
};