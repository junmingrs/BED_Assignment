const { poolPromise } = require("../db");

// Get all menu items
async function getAllMenuItems() {
    const query = "SELECT * FROM MenuItem";
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    if (result.recordset.length === 0) return null; // User not found
    return result.recordset;
}

// Get all menu items in specific stall
async function getMenuItemsByStallId(stallId) {
    const query = "SELECT * FROM MenuItem WHERE stall_id = @stall_id";
    const pool = await poolPromise;
    const result = await pool.request().input("stall_id", stallId).query(query);

    return result.recordset.length === 0 ? null : result.recordset;
}

// Get specific menu item in specific stall
async function getMenuItemsByStallIdAndItemCode(stallId, itemCode) {
    const query = "SELECT * FROM MenuItem WHERE stall_id = @stall_id AND item_code = @item_code";
    const pool = await poolPromise;
    const result = await pool.request().input("stall_id", stallId).input("item_code", itemCode).query(query);

    return result.recordset.length === 0 ? null : result.recordset[0];
}

// Create new menu item
async function createMenuItem(menuItem) {
    const query =
        "INSERT INTO MenuItem VALUES (@stallId, @itemCode, @itemDesc, @itemPrice, @itemCategory);";
    const pool = await poolPromise;
    const result = await pool.request()
        .input("stallId", menuItem.stallId)
        .input("itemCode", menuItem.itemCode)
        .input("itemDesc", menuItem.itemDesc)
        .input("itemPrice", menuItem.itemPrice)
        .input("itemCategory", menuItem.itemCategory)
        .query(query);

    const newMenuItemId = { stallId: result.recordset[0].stallId, itemCode: result.recordset[0].itemCode };
    return await getMenuItemsByStallIdAndItemCode(newMenuItemId.stallId, newMenuItemId.itemCode);
}

// Update menu item
async function updateMenuItem(menuItemData) {
    const query = "UPDATE MenuItem SET item_desc = COALESCE(@itemDesc, item_desc), item_price = COALESCE(@itemPrice, item_price), item_category = COALESCE(@itemCategory, item_category) WHERE stall_id = @stallId AND item_code = @itemCode;";
    const pool = await poolPromise;
    const result = await pool.request()
        .input("stallId", menuItemData.stallId)
        .input("itemCode", menuItemData.itemCode)
        .input("itemDesc", menuItemData.itemDesc)
        .input("itemPrice", menuItemData.itemPrice)
        .input("itemCategory", menuItemData.itemCategory)
        .query(query);

    return await getMenuItemsByStallIdAndItemCode(menuItemData.stallId, menuItemData.itemCode);
}

// Delete menu item
async function deleteMenuItem(stallId, itemCode) {
    const deleteMenuItemCuisineQuery = "DELETE FROM MenuItemCuisine WHERE stall_id = @stallId AND item_code = @itemCode"
    const query = "DELETE FROM MenuItem WHERE stall_id = @stallId AND item_code = @itemCode";
    const pool = await poolPromise;
    await pool.request().input("stallId", stallId).input("itemCode", itemCode).query(deleteMenuItemCuisineQuery);
    await pool.request().input("stallId", stallId).input("itemCode", itemCode).query(query);
}

module.exports = {
    getAllMenuItems,
    getMenuItemsByStallId,
    getMenuItemsByStallIdAndItemCode,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
};

