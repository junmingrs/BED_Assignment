const inspectionModel = require("../model/inspectionModel");
const { poolPromise } = require("../db");

// get inspections for a stall
const getInspections = async (req, res) => {
    try {
        const { stallId } = req.params;
        const result = await inspectionModel.getInspectionsByStallId(stallId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getInspections:", error);
        res.status(500).json({ error: error.message });
    }
};

// create an inspection
const createInspection = async (req, res) => {
    try {
        const { stallId } = req.params;
        const { score, remarks, hygiene_grade } = req.body;
        const neaId = req.user.id;

        if (score === undefined || !hygiene_grade) {
            return res.status(400).json({ 
                error: "Missing required fields: score, hygiene_grade" 
            });
        }

        if (score < 0 || score > 100) {
            return res.status(400).json({ 
                error: "Score must be between 0 and 100" 
            });
        }

        if (!['A', 'B', 'C', 'D'].includes(hygiene_grade)) {
            return res.status(400).json({ 
                error: "Hygiene grade must be A, B, C, or D" 
            });
        }

        // Check if stall exists
        const pool = await poolPromise;
        const stallCheck = await pool.request()
            .input("stallId", stallId)
            .query("SELECT stall_id FROM Stall WHERE stall_id = @stallId");

        if (stallCheck.recordset.length === 0) {
            return res.status(404).json({ error: "Stall not found" });
        }

        const result = await inspectionModel.createInspection(
            stallId,
            neaId,
            score,
            remarks,
            hygiene_grade
        );

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in createInspection:", error);
        res.status(500).json({ error: error.message });
    }
};

// delete an inspection
const deleteInspection = async (req, res) => {
    try {
        const { inspectionId } = req.params;

        const result = await inspectionModel.deleteInspection(inspectionId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in deleteInspection:", error);
        res.status(500).json({ error: error.message });
    }
};
// get a single inspection by inspectionid
const getInspectionById = async (req, res) => {
    try {
        const { inspectionId } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input("inspectionId", inspectionId)
            .query(`
                SELECT 
                    i.inspection_id,
                    i.stall_id,
                    i.inspection_date,
                    i.score,
                    i.remarks,
                    i.hygiene_grade
                FROM Inspection i
                WHERE i.inspection_id = @inspectionId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Inspection not found" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        console.error("Error in getInspectionById:", error);
        res.status(500).json({ error: error.message });
    }
};

// add an inspection by id
const updateInspection = async (req, res) => {
    try {
        const { inspectionId } = req.params;
        const { score, remarks, hygiene_grade } = req.body;
        const neaId = req.user.id;

        const pool = await poolPromise;

        const checkResult = await pool.request()
            .input("inspectionId", inspectionId)
            .query("SELECT * FROM Inspection WHERE inspection_id = @inspectionId");

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: "Inspection not found" });
        }

        await pool.request()
            .input("inspectionId", inspectionId)
            .input("score", score)
            .input("remarks", remarks || null)
            .input("hygiene_grade", hygiene_grade)
            .query(`
                UPDATE Inspection
                SET score = @score,
                    remarks = @remarks,
                    hygiene_grade = @hygiene_grade
                WHERE inspection_id = @inspectionId
            `);

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

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        console.error("Error in updateInspection:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getInspections,
    createInspection,
    deleteInspection,
    getInspectionById,
    updateInspection
};