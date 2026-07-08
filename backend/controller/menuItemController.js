const menuItemModel = require("../model/menuItemModel.js");

async function getAllMenuItems(req, res) {
  try {
    const menuItems = await menuItemModel.getAllMenuItems();
    res.json(menuItems);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error retrieving menu items" });
  }
}

async function getMenuItemsByStallId(req, res) {
  try {
    const stallId = parseInt(req.params.stallId);
    const menuItems = await menuItemModel.getMenuItemsByStallId(stallId);
    if (!menuItems) {
      return res.status(404).json({ message: "Menu items not found" });
    }
    res.json(menuItems);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error retrieving menu items in stall" });
  }
}

async function getMenuItemsByStallIdAndItemCode(req, res) {
  try {
    const { stallId, itemCode } = req.body;
    const menuItem = await menuItemModel.getMenuItemsByStallIdAndItemCode(stallId, itemCode);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.json(menuItem);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error retrieving specific menu item in stall" });
  }
}

async function createMenuItem(req, res) {
  try {
    const newMenuItem = await menuItemModel.createMenuItem(req.body);
    res.status(201).json(newMenuItem);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error creating menu item" });
  }
}

async function updateMenuItem(req, res) {
  try {
    const updatedMenuItem = await menuItemModel.updateMenuItem(req.body);
    res.status(201).json(updatedMenuItem);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error updating menu item" });
  }
}

// Delete existing book
async function deleteMenuItem(req, res) {
  try {
    const { stallId, itemCode } = req.body;
    await menuItemModel.deleteMenuItem(stallId, itemCode);
    res.status(201).json({ "success": "true" });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error deleting menu item" });
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

