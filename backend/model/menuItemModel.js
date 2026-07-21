const { custom } = require("joi");
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
async function createMenuItem(stallId, itemDesc, itemPrice, itemCategory) {
    const query =
        "INSERT INTO MenuItem (stall_id, item_code, item_desc, item_price, item_category)  OUTPUT inserted.item_code, inserted.stall_id, inserted.item_desc, inserted.item_price, inserted.item_category VALUES (@stallId, NEWID(), @itemDesc, @itemPrice, @itemCategory);";
    const pool = await poolPromise;
    const result = await pool.request()
        .input("stallId", stallId)
        .input("itemDesc", itemDesc)
        .input("itemPrice", itemPrice)
        .input("itemCategory", itemCategory)
        .query(query);

    return result.recordset[0];
}

// Update menu item
async function updateMenuItem(menuItemData) {
    const query = "UPDATE MenuItem SET item_desc = COALESCE(@itemDesc, item_desc), item_price = COALESCE(@itemPrice, item_price), item_category = COALESCE(@itemCategory, item_category) WHERE stall_id = @stallId AND item_code = @itemCode;";
    const pool = await poolPromise;
    await pool.request()
        .input("stallId", menuItemData.stall_id)
        .input("itemCode", menuItemData.item_code)
        .input("itemDesc", menuItemData.item_desc)
        .input("itemPrice", menuItemData.item_price)
        .input("itemCategory", menuItemData.item_category)
        .query(query);

    return await getMenuItemsByStallIdAndItemCode(menuItemData.stall_id, menuItemData.item_code);
}

// Delete menu item
async function deleteMenuItem(stallId, itemCode) { // NOTE: might need to add checks here instead of deleting items
    try {
        const deleteMenuItemCuisineQuery = "DELETE FROM MenuItemCuisine WHERE stall_id = @stallId AND item_code = @itemCode"
        const query = "DELETE FROM MenuItem WHERE stall_id = @stallId AND item_code = @itemCode";
        const pool = await poolPromise;
        await pool.request().input("stallId", stallId).input("itemCode", itemCode).query(deleteMenuItemCuisineQuery);
        await pool.request().input("stallId", stallId).input("itemCode", itemCode).query(query);
        return true;
    }
    catch (e) {
        return false;
    }
}

// Get all menu item likes by customer
async function getMenuItemLikesByCustomer(customerId) {
    const query = "SELECT * FROM MenuItemLikes WHERE customer_id = @customerId";
    const pool = await poolPromise;
    const result = await pool.request().input("customerId", customerId).query(query);
    return result.recordset;
}

// Create menu item like
async function createMenuItemLike(stallId, itemCode, customerId) {
    const query =
        `INSERT INTO MenuItemLikes
            OUTPUT inserted.item_code, inserted.stall_id, inserted.customer_id 
            VALUES (@stallId, @itemCode, @customerId)`;
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("stallId", stallId)
        .input("itemCode", itemCode)
        .input("customerId", customerId)
        .query(query);

    return result.recordset[0];
}

// Delete menu item like
async function deleteMenuItemLike(stallId, itemCode, customerId) {
    const query =
        `DELETE FROM MenuItemLikes 
            WHERE stall_id = @stallId AND item_code = @itemCode AND customer_id = @customerId`;
    const pool = await poolPromise;
    await pool
        .request()
        .input("stallId", stallId)
        .input("itemCode", itemCode)
        .input("customerId", customerId)
        .query(query);
}

module.exports = {
    getAllMenuItems,
    getMenuItemsByStallId,
    getMenuItemsByStallIdAndItemCode,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemLikesByCustomer,
    createMenuItemLike,
    deleteMenuItemLike,
};

