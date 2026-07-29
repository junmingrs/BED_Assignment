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
async function getMenuItemsByStallId(stall_id) {
    const query = "SELECT * FROM MenuItem WHERE stall_id = @stall_id";
    const pool = await poolPromise;
    const result = await pool.request().input("stall_id", stall_id).query(query);
    return result.recordset;
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
        const query = "INSERT INTO MenuItemCuisine OUTPUT inserted.stall_id, inserted.item_code, inserted.cuisine_name  VALUES (@stallId, @itemCode, @cuisineName)";
        const res = await pool
            .request()
            .input("stallId", menuItem.stall_id)
            .input("itemCode", result.menuItem.item_code)
            .input("cuisineName", cuisine)
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
            OUTPUT inserted.*
            VALUES (@stallId, @itemCode, @customerId)`;
    const pool = await poolPromise;
    const result = await pool.request()
        .input("stallId", stallId)
        .input("itemCode", itemCode)
        .input("customerId", customerId)
        .query(query);
    return result.recordset[0];
}

// Get specific menu item cuisine
async function getMenuItemCuisine(stallId, itemCode) {
    const query = "SELECT * FROM MenuItemCuisine WHERE stall_id = @stallId AND item_code = @itemCode";
    const pool = await poolPromise;
    const result = await pool.request().input("stallId", stallId).input("itemCode", itemCode).query(query);

    return result.recordset;
}

async function getAllCuisines() {
    const query = "SELECT * FROM Cuisine";
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    return result.recordsets;
}

async function createCuisine(cuisineName) {
    const query = "INSERT INTO Cuisine OUTPUT inserted.cuisine_name VALUES (@cuisineName)";
    const pool = await poolPromise;
    const result = await pool.request().input("cuisineName", cuisineName).query(query);
    return result.recordset[0];
}

async function createMenuItemCuisine(stallId, itemCode, cuisineName) {
    const query =
        "INSERT INTO MenuItemCuisine OUTPUT inserted.stall_id, inserted.item_code, inserted.cuisine_name VALUES (@stallId, @itemCode, @cuisineName)"
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("stallId", stallId)
        .input("itemCode", itemCode)
        .input("cuisineName", cuisineName)
        .query(query);

    return result.recordset[0];
}

// Delete menu item like
async function deleteMenuItemLike(stallId, itemCode, customerId) {
    const query =
        `DELETE FROM MenuItemLikes 
            WHERE stall_id = @stallId AND item_code = @itemCode AND customer_id = @customerId`;
    const pool = await poolPromise;
    await pool.request()
        .input("stallId", stallId)
        .input("itemCode", itemCode)
        .input("customerId", customerId)
        .query(query)
}

async function deleteMenuItemCuisine(stallId, itemCode, cuisineName) {
    const query =
        "DELETE FROM MenuItemCuisine WHERE stall_id = @stallId AND item_code = @itemCode AND cuisine_name = @cuisineName";
    const pool = await poolPromise;
    await pool
        .request()
        .input("stallId", stallId)
        .input("itemCode", itemCode)
        .input("cuisineName", cuisineName)
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
    getMenuItemCuisine,
    getAllCuisines,
    createCuisine,
    createMenuItemCuisine,
    deleteMenuItemCuisine,
};

