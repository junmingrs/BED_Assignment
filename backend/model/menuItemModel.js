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
async function createMenuItem(menuItem, cuisines) {
    const query =
        "INSERT INTO MenuItem (stall_id, item_code, item_desc, item_price, item_category)  OUTPUT inserted.item_code, inserted.stall_id, inserted.item_desc, inserted.item_price, inserted.item_category VALUES (@stallId, NEWID(), @itemDesc, @itemPrice, @itemCategory);";
    const pool = await poolPromise;
    let result = { menuItem: null, cuisines: [] }
    const res = await pool.request()
        .input("stallId", menuItem.stall_id)
        .input("itemDesc", menuItem.item_desc)
        .input("itemPrice", menuItem.item_price)
        .input("itemCategory", menuItem.item_category)
        .query(query);
    result.menuItem = res.recordset[0];

    cuisines.forEach(async (cuisine) => {
        const query = "INSERT INTO MenuItemCuisine OUTPUT inserted.stall_id, inserted.item_code, inserted.cuisine  VALUES (@stallId, @itemCode, @cuisine)";
        const res = await pool
            .request()
            .input("stallId", stallId)
            .input("itemCode", itemCode)
            .input("cuisine", cuisine)
            .query(query);
        result.cuisines.push(res.recordset[0])
    });

    return result;
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
async function deleteMenuItem(stallId, itemCode) {
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

// Get specific menu item cuisine
async function getMenuItemCuisine(stallId, itemCode) {
    const query = "SELECT * FROM MenuItemCuisine WHERE stall_id = @stallId AND item_code = @itemCode";
    const pool = await poolPromise;
    const result = await pool.request().input("stallId", stallId).input("itemCode", itemCode).query(query);

    return result.recordset[0];
}

async function getAllCuisines() {
    const query = "SELECT * FROM Cuisine";
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    return result.recordset[0];
}

async function createCuisine(cuisineName) {
    const query = "INSERT INTO Cuisine OUTPUT inserted.cuisine_name VALUES (@cuisineName)";
    const pool = await poolPromise;
    const result = await pool.request().input("cuisineName", cuisineName).query(query);
    return result.recordset[0];
}

module.exports = {
    getAllMenuItems,
    getMenuItemsByStallId,
    getMenuItemsByStallIdAndItemCode,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemCuisine,
    getAllCuisines,
    createCuisine,
};

