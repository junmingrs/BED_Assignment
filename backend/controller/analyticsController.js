const analyticsModel = require("../model/analyticsModel");
const orderModel = require("../model/orderModel");
const feedbackModel = require("../model/feedbackModel");
const ratingModel = require("../model/ratingModel");
const complaintModel = require("../model/complaintModel");

async function getKPI(req, res) {
    const { stallId } = req.params;
    const timeframe = req.query.timeframe || "this_week";
    try {
        const stats = await analyticsModel.getKPI(stallId, timeframe);
        return res.status(200).json(stats);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getHourlySales(req, res) {
    // NOTE: only for today
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
    const timeframe = req.query.timeframe || "this_week";
    try {
        const topItems = await analyticsModel.getTopItems(stallId, timeframe);
        return res.status(200).json(topItems);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getAISummary(req, res) {
    const { stallId } = req.params;
    const timeframe = req.query.timeframe || "this_week";
    try {
        const [ratings, complaints, feedback, orders] = await Promise.all([
            ratingModel.getRatingsByStallId(stallId, timeframe),
            complaintModel.getComplaintsByStallId(stallId, timeframe),
            feedbackModel.getFeedbackByStallId(stallId, timeframe),
            orderModel.getOrderByStallId(stallId, timeframe),
        ]);

        const summary = await analyticsModel.getAISummary({
            ratings,
            complaints,
            feedback,
            orders,
        });

        return res.status(200).json(summary);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { getKPI, getHourlySales, getTopItems, getAISummary };
