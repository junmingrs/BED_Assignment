const analyticsModel = require("../model/analyticsModel");

async function getKPI(req, res) {
    const { stallId } = req.params;
    try {
        const stats = await analyticsModel.getKPI(stallId);
        return res.status(200).json(stats);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getHourlySales(req, res) {
    const { stallId } = req.params;
    try {
        const hourlySales = await analyticsModel.getHourlySales(stallId);
        return res.status(200).json(hourlySales);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getTopItems(req, res) {
    const { stallId } = req.params;
    try {
        const topItems = await analyticsModel.getTopItems(stallId);
        return res.status(200).json(topItems);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { getKPI, getHourlySales, getTopItems };
