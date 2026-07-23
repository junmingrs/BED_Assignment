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

        // Validation
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
        const neaId = req.user.id;

        const result = await inspectionModel.deleteInspection(inspectionId, neaId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in deleteInspection:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getInspections,
    createInspection,
    deleteInspection
};