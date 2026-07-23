const menuItemModel = require("../model/menuItemModel.js");

async function getAllMenuItems(req, res) {
    try {
        const menuItems = await menuItemModel.getAllMenuItems();
        return res.json(menuItems);
    } catch (error) {
        console.error("Controller error:", error);
        return res.status(500).json({ message: "Error retrieving menu items" });
    }
}

async function getMenuItemsByStallId(req, res) {
    try {
        const stallId = req.params.stallId;
        const menuItems = await menuItemModel.getMenuItemsByStallId(stallId);
        return res.json(menuItems);
    } catch (error) {
        console.error("Controller error:", error);
        return res.status(500).json({ message: "Error retrieving menu items in stall" });
    }
}

async function getMenuItemsByStallIdAndItemCode(req, res) {
    try {
        const { stallId, itemCode } = req.query;
        const menuItem = await menuItemModel.getMenuItemsByStallIdAndItemCode(
            stallId,
            itemCode,
        );
        if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        return res.json(menuItem);
    } catch (error) {
        console.error("Controller error:", error);
        return res
            .status(500)
            .json({ message: "Error retrieving specific menu item in stall" });
    }
}

async function createMenuItem(req, res) {
    try {
        const newMenuItem = await menuItemModel.createMenuItem(req.body);
        return res.status(201).json(newMenuItem);
    } catch (error) {
        console.error("Controller error:", error);
        return res.status(500).json({ message: "Error creating menu item" });
    }
}

async function updateMenuItem(req, res) {
    try {
        const item = req.body;
        const updatedMenuItem = await menuItemModel.updateMenuItem(item);
        return res.status(201).json(updatedMenuItem);
    } catch (error) {
        console.error("Controller error:", error);
        return res.status(500).json({ message: "Error updating menu item" });
    }
}

// Delete existing book
async function deleteMenuItem(req, res) {
    try {
        const { stallId, itemCode } = req.body;
        const success = await menuItemModel.deleteMenuItem(stallId, itemCode);
        if (!success) {
            return res.status(500).json({ message: "Theres still orders with this menu item" });
        }
        return res.status(201).json({ success: "true" });
    } catch (error) {
        console.error("Controller error:", error);
        return res.status(500).json({ message: "Error deleting menu item" });
    }
}

module.exports = {
    getAllMenuItems,
    getMenuItemsByStallId,
    getMenuItemsByStallIdAndItemCode,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
};
