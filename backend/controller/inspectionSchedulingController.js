const inspectionSchedulingModel = require("../model/inspectionSchedulingModel");
const { poolPromise } = require("../db");

// POST /stalls/:stallId/inspections/schedule - NEA schedules a future inspection
const scheduleInspection = async (req, res) => {
    try {
        const { stallId } = req.params;
        const { inspection_date } = req.body;
        const neaId = req.user.id;

        if (!inspection_date) {
            return res.status(400).json({ error: "Missing required field: inspection_date" });
        }

        const parsedDate = new Date(inspection_date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: "Invalid inspection_date" });
        }

        // Check stall exists
        const pool = await poolPromise;
        const stallCheck = await pool
            .request()
            .input("stallId", stallId)
            .query("SELECT stall_id FROM Stall WHERE stall_id = @stallId");

        if (stallCheck.recordset.length === 0) {
            return res.status(404).json({ error: "Stall not found" });
        }

        const result = await inspectionSchedulingModel.scheduleInspection(
            stallId,
            neaId,
            parsedDate,
        );

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in scheduleInspection:", error);
        res.status(500).json({ error: error.message });
    }
};

// PATCH /inspections/:inspectionId/complete - NEA fills in score/grade after visiting
const completeInspection = async (req, res) => {
    try {
        const { inspectionId } = req.params;
        const { score, remarks, hygiene_grade } = req.body;

        if (score === undefined || !hygiene_grade) {
            return res.status(400).json({
                error: "Missing required fields: score, hygiene_grade",
            });
        }

        if (score < 0 || score > 100) {
            return res.status(400).json({ error: "Score must be between 0 and 100" });
        }

        if (!["A", "B", "C", "D"].includes(hygiene_grade)) {
            return res.status(400).json({ error: "Hygiene grade must be A, B, C, or D" });
        }

        const result = await inspectionSchedulingModel.completeInspection(
            inspectionId,
            score,
            remarks,
            hygiene_grade,
        );

        if (!result) {
            return res.status(404).json({ error: "Inspection not found" });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error in completeInspection:", error);
        res.status(500).json({ error: error.message });
    }
};

// GET /stalls/:stallId/inspections/scheduled - used by vendor calendar sync
const getScheduledInspections = async (req, res) => {
    try {
        const { stallId } = req.params;
        const result = await inspectionSchedulingModel.getScheduledInspectionsByStallId(stallId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getScheduledInspections:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    scheduleInspection,
    completeInspection,
    getScheduledInspections,
};