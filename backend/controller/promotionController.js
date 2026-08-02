const promotionModel = require("../model/promotionModel");
const customerModel = require("../model/customerModel.js");
const accountModel = require("../model/accountModel.js");
const stallModel = require("../model/stallModel.js");
const hawkerCentreModel = require("../model/hawkerCentreModel.js");
const menuItemModel = require("../model/menuItemModel.js");
const email = require("../model/emailModel.js");

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
        const promos = await promotionModel.getPromotionByStallId(stallId);
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch promotions by stall id", details: err.message });
    }
}

async function sendPromotionEmail(promotion) {
    const customers = await customerModel.getAllCustomers();
    let emails = [];
    customers.forEach(async (customer) => {
        emails.push(await accountModel.getAccountById(customer.customer_id));
    });
    // convert promocode, stallid, itemcode, discount, startdate, enddate to
    // hawkername, stallname, itemname, discount, promocode, startdate, enddate
    const stall = await stallModel.getStallById(promotion.stall_id);
    const hawkerCentre = await hawkerCentreModel.getHawkerCentreById(stall.hawker_centre_id);
    const item = await menuItemModel.getMenuItemsByStallIdAndItemCode(promotion.stall_id, promotion.item_code);
    const promoData = {
        stallName: stall.stall_name,
        itemName: item.item_desc,
        promoCode: promotion.promo_code,
        discount: promotion.discount,
        hawkerCentre: hawkerCentre.centre_name,
        endDate: promotion.end_date,
    }
    emails.forEach(async (e) => {
        await email.sendPromotion(e.account_email, promoData);
    });
}

async function createPromotion(req, res) {
    try {
        const { promotion } = req.body;
        const promo = await promotionModel.createPromotion(promotion);
        await sendPromotionEmail(promo)
        res.status(201).json(promo);
    } catch (err) {
        res.status(500).json({ error: "Failed to create promotion", details: err.message });
    }
}

async function getPromotionByCode(req, res) {
    try {
        const { promotionCode } = req.params;
        const promo = await promotionModel.getPromotionByCode(promotionCode);
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
        const updated = await promotionModel.updatePromotion(promotion);
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update promotion", details: err.message });
    }
}

async function deletePromotion(req, res) {
    try {
        const { promotionCode } = req.body;
        const deleted = await promotionModel.deletePromotion(promotionCode);
        res.status(200).json({ message: "Promotion deleted", deleted });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete promotion", details: err.message });
    }
}

module.exports = { getAllPromotions, getActivePromotions, getPromotionByStallId, createPromotion, getPromotionByCode, updatePromotion, deletePromotion };
