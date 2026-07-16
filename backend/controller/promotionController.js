const promotionModel = require("../model/promotionModel");

async function createPromotion(req, res) {
  try {
    const { stallId, title, description, startDate, endDate } = req.body;
    if (!stallId || !title || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const promo = await promotionModel.createPromotion(req.body);
    res.status(201).json(promo);
  } catch (err) {
    res.status(500).json({ error: "Failed to create promotion", details: err.message });
  }
}

async function getPromotionsByStallId(req, res) {
  try {
    const { stallId } = req.query;
    if (!stallId) return res.status(400).json({ error: "stallId is required" });
    const promos = await promotionModel.getPromotionsByStallId(stallId);
    res.status(200).json(promos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch promotions", details: err.message });
  }
}

async function updatePromotion(req, res) {
  try {
    const { promotionId } = req.body;
    if (!promotionId) return res.status(400).json({ error: "promotionId is required" });
    const updated = await promotionModel.updatePromotion(req.body);
    if (!updated) return res.status(404).json({ error: "Promotion not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update promotion", details: err.message });
  }
}

async function deletePromotion(req, res) {
  try {
    const { promotionId } = req.body;
    if (!promotionId) return res.status(400).json({ error: "promotionId is required" });
    const deleted = await promotionModel.deletePromotion(promotionId);
    if (!deleted) return res.status(404).json({ error: "Promotion not found" });
    res.status(200).json({ message: "Promotion deleted", deleted });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete promotion", details: err.message });
  }
}

module.exports = { createPromotion, getPromotionsByStallId, updatePromotion, deletePromotion };