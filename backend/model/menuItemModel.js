const { poolPromise } = require("../db");

// Get all menu items
async function getAllMenuItems() {
  const query = "SELECT * FROM MenuItem";
  const pool = await poolPromise;
  const result = await pool.request().input("email", email).query(query);
  if (result.recordset.length === 0) return null; // User not found
  return result.recordset;
}

// Get all menu items in specific stall
async function getMenuItemsByStallId(stallId) {
  const query = "SELECT * FROM Users WHERE stall_id = @stall_id";
  const pool = await poolPromise;
  const result = await pool.request().input("stall_id", stallId).query(query);

  return result.recordset.length === 0 ? null : result.recordset[0];
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
    .input("stall_id", menuItem.stallId)
    .input("item_code", menuItem.itemCode)
    .input("@item_desc", menuItem.itemDesc)
    .input("@item_price", menuItem.itemPrice)
    .input("@item_category", menuItem.itemCategory)
    .query(query);

  const newMenuItemId = { stallId: result.recordset[0].stallId, itemCode: result.recordset[0].itemCode };
  return await getMenuItemsByStallIdAndItemCode(newMenuItemId.stallId, newMenuItemId.itemCode);
}

// Update menu item
async function updateMenuItem(menuItemData) {
  connection = await sql.connect(dbConfig);
  const query = "UPDATE MenuItem SET item_desc = COALESCE(@itemDesc, item_desc), item_price = COALESCE(@itemPrice, item_price), item_category = COALESCE(@itemCategory, item_category) WHERE stall_id = @stallId AND item_code = @itemCode;";
  const pool = await poolPromise;
  const result = await pool.request()
    .input("stall_id", menuItemData.stallId)
    .input("item_code", menuItemData.itemCode)
    .input("@item_desc", menuItemData.itemDesc)
    .input("@item_price", menuItemData.itemPrice)
    .input("@item_category", menuItemData.itemCategory)
    .query(query);

  const newMenuItemId = { stallId: result.recordset[0].stallId, itemCode: result.recordset[0].itemCode };
  return await getMenuItemsByStallIdAndItemCode(newMenuItemId.stallId, newMenuItemId.itemCode);
}

// Delete menu item
async function deleteMenuItem(stallId, itemCode) {
  const query = "DELETE FROM MenuItem WHERE stall_id = @stall_id AND item_code = @item_code";
  const pool = await poolPromise;
  await pool.request().input("stall_id", stallId).input("item_code", itemCode).query(query);
  // return true NOTE: maybe needed
}

module.exports = {
  getAllMenuItems,
  getMenuItemsByStallId,
  getMenuItemsByStallIdAndItemCode,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};

