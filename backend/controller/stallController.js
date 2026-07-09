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

const addMenuItem = async (req, res) => {
    try {
        const { stallId } = req.params;
        const { item_code, item_desc, item_price, item_category, cuisine_ids } = req.body;

        // Basic validation
        if (!item_code || !item_price || !item_category) {
            return res.status(400).json({
                error: "Missing required fields: item_code, item_price, item_category"
            });
        }

        const result = await stallModel.addMenuItem(stallId, {
            item_code,
            item_desc,
            item_price,
            item_category,
            cuisine_ids
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in addMenuItem:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateMenuItem = async (req, res) => {
    try {
        const { stallId, itemId } = req.params;
        const { item_desc, item_price, item_category, cuisine_ids } = req.body;

        const result = await stallModel.updateMenuItem(stallId, itemId, {
            item_desc,
            item_price,
            item_category,
            cuisine_ids
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error in updateMenuItem:", error);
        res.status(500).json({ error: error.message });
    }
};

const deleteMenuItem = async (req, res) => {
    try {
        const { stallId, itemId } = req.params;
        await stallModel.deleteMenuItem(stallId, itemId);
        res.status(204).send(); 
    } catch (error) {
        console.error("Error in deleteMenuItem:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getStallInfo,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
};