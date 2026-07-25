const promotionModel = require("../model/promotionModel");

async function getAllPromotions(req, res) {
    try {
        const promos = await promotionModel.getAllPromotions();
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch promotions", details: err.message });
    }
}

async function getPromotionByStallId(req, res) {
    try {
        const { stallId } = req.params;
        console.log(stallId)
        const promos = await promotionModel.getPromotionByStallId(stallId);
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch promotions", details: err.message });
    }
}

async function createPromotion(req, res) {
    try {
        const { promotion } = req.body;
        if (!promotion) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const promo = await promotionModel.createPromotion(promotion);
        res.status(201).json(promo);
    } catch (err) {
        res.status(500).json({ error: "Failed to create promotion", details: err.message });
    }
}

async function getPromotionByCode(req, res) {
    try {
        const { promotionCode } = req.params;
        if (!promotionCode) return res.status(400).json({ error: "Promo code is required" });
        const promo = await promotionModel.getPromotionByCode(stallId);
        res.status(200).json(promo);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch promotions", details: err.message });
    }
}

async function getActivePromotions(req, res) {
    try {
        const promos = await promotionModel.getActivePromotions();
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch promotions", details: err.message });
    }
}

async function updatePromotion(req, res) {
    try {
        const { promotion } = req.body;
        if (!promotion) return res.status(400).json({ error: "Promotion is required" });
        const updated = await promotionModel.updatePromotion(promotion);
        if (!updated) return res.status(404).json({ error: "Promotion not found" });
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update promotion", details: err.message });
    }
}

async function deletePromotion(req, res) {
    try {
        const { promotionCode } = req.body;
        if (!promotionCode) return res.status(400).json({ error: "promotionCode is required" });
        const deleted = await promotionModel.deletePromotion(promotionCode);
        if (!deleted) return res.status(404).json({ error: "Promotion not found" });
        res.status(200).json({ message: "Promotion deleted", deleted });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete promotion", details: err.message });
    }
}

module.exports = { getAllPromotions, getActivePromotions, getPromotionByStallId, createPromotion, getPromotionByCode, updatePromotion, deletePromotion };
