// stallController.js
const stallModel = require("../model/stallModel");

const getStallInfo = async (req, res) => {
    try {
        const { stallId } = req.params;
        const result = await stallModel.getStallInfo(stallId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getStallInfo:", error);
        res.status(500).json({ error: error.message });
    }
};

const getAllStalls = async (req, res) => {
    try {
        const result = await stallModel.getAllStalls();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getAllStalls:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getStallInfo,
    getAllStalls
};