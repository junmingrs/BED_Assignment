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
        const { stallId } = req.params;
        const menuItems = await menuItemModel.getMenuItemsByStallId(stallId);
        return res.status(201).json(menuItems);
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
        const { menuItem, cuisines } = req.body
        const existingCuisines = await menuItemModel.getAllCuisines();
        cuisines.forEach(cuisine => {
            const exists = existingCuisines.some(c => c.cuisine_name.toLowerCase() === cuisine.toLowerCase());
            if (!exists) {
                menuItemModel.createCuisine(cuisine)
            }
        });
        const newMenuItem = await menuItemModel.createMenuItem(menuItem, cuisines);
        return res.status(201).json(newMenuItem);
    } catch (error) {
        console.error("Controller error:", error);
        return res.status(500).json({ message: "Error creating menu item" });
    }
}

async function updateMenuItem(req, res) {
    try {
        const { menuItem, cuisines } = req.body;
        let cuisinesToUpdate = [];
        const existingCuisines = await menuItemModel.getAllCuisines();
        const menuItemCuisines = await menuItemModel.getMenuItemCuisine(menuItem.stall_id, menuItem.item_code);

        const normalize = (name) => name.toLowerCase().trim();

        cuisines.forEach(cuisine => {
            const cuisineLower = normalize(cuisine);
            const existsInDb = existingCuisines.some(c => normalize(c.cuisine_name) === cuisineLower);
            const hasInMenuItem = menuItemCuisines.some(c => normalize(c.cuisine_name) === cuisineLower);

            if (!existsInDb) {
                menuItemModel.createCuisine(cuisine);
            }
            if (!hasInMenuItem) {
                cuisinesToUpdate.push(cuisine);
            }
        });

        menuItemCuisines.forEach(cuisine => {
            const cuisineLower = normalize(cuisine.cuisine_name);
            const stillExists = cuisines.some(c => normalize(c) === cuisineLower);
            if (!stillExists) {
                menuItemModel.deleteMenuItemCuisine(menuItem.stall_id, menuItem.item_code, cuisine.cuisine_name);
            }
        });

        cuisinesToUpdate.forEach(cuisine => {
            menuItemModel.createMenuItemCuisine(menuItem.stall_id, menuItem.item_code, cuisine);
        });

        const updatedMenuItem = await menuItemModel.updateMenuItem(menuItem);
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

async function getMenuItemCuisine(req, res) {
    try {
        const { stallId, itemCode } = req.params;
        const cuisines = await menuItemModel.getMenuItemCuisine(stallId, itemCode);
        return res.status(201).json({ cuisines });
    } catch (error) {
        console.error("Controller error:", error);
        return res.status(500).json({ message: "Error getting cuisines for menu item" });
    }
}

module.exports = {
    getAllMenuItems,
    getMenuItemsByStallId,
    getMenuItemsByStallIdAndItemCode,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemCuisine,
};
