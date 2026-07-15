// model/stallModel.js
const { poolPromise } = require("../db");

// GET /stalls/:stallId - get stall info
const getStallInfo = async (stallId) => {
    const pool = await poolPromise;

    // 1. Get stall basic info
    const stallResult = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT 
                s.stall_id,
                s.stall_name,
                s.stall_unit_no,
                v.vendor_id,
                a.account_email
            FROM Stall s
            JOIN Vendor v ON s.vendor_id = v.vendor_id
            JOIN Account a ON v.account_id = a.account_id
            WHERE s.stall_id = @stallId
        `);

    if (stallResult.recordset.length === 0) {
        throw new Error("Stall not found");
    }

    const stall = stallResult.recordset[0];

    // 2. Get menu items with their cuisines
    const menuResult = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT 
                m.item_code,
                m.item_desc,
                m.item_price,
                m.item_category,
                STRING_AGG(c.cuisine_desc, ', ') AS cuisines
            FROM MenuItem m
            LEFT JOIN MenuItemCuisine mc ON m.stall_id = mc.stall_id AND m.item_code = mc.item_code
            LEFT JOIN Cuisine c ON mc.cuisine_id = c.cuisine_id
            WHERE m.stall_id = @stallId
            GROUP BY m.item_code, m.item_desc, m.item_price, m.item_category
            ORDER BY m.item_code
        `);

    // 3. Get orders
    const ordersResult = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT 
                order_id,
                order_date,
                total_amount,
                status
            FROM Orders
            WHERE stall_id = @stallId
            ORDER BY order_date DESC
        `);

    // 4. Get ratings
    const ratingsResult = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT 
                rating_id,
                rating,
                comment,
                created_at
            FROM Rating
            WHERE stall_id = @stallId
            ORDER BY created_at DESC
        `);

    // 5. Get complaints
    const complaintsResult = await pool.request()
        .input("stallId", stallId)
        .query(`
            SELECT 
                complaint_id,
                subject,
                description,
                status,
                created_at
            FROM Complaint
            WHERE stall_id = @stallId
            ORDER BY created_at DESC
        `);

    return {
        stall: stall,
        menu: menuResult.recordset,
        orders: ordersResult.recordset,
        ratings: ratingsResult.recordset,
        complaints: complaintsResult.recordset
    };
};

// POST /stalls/:stallId/menu - add menu item
const addMenuItem = async (stallId, menuData) => {
    const { item_code, item_desc, item_price, item_category, cuisine_ids } = menuData;
    const pool = await poolPromise;

    // Check if stall exists
    const stallCheck = await pool.request()
        .input("stallId", stallId)
        .query("SELECT stall_id FROM Stall WHERE stall_id = @stallId");

    if (stallCheck.recordset.length === 0) {
        throw new Error("Stall not found");
    }

    // Check if item_code already exists for this stall
    const duplicateCheck = await pool.request()
        .input("stallId", stallId)
        .input("itemCode", item_code)
        .query("SELECT item_code FROM MenuItem WHERE stall_id = @stallId AND item_code = @itemCode");

    if (duplicateCheck.recordset.length > 0) {
        throw new Error(`Item code '${item_code}' already exists for this stall`);
    }

    // Insert menu item
    await pool.request()
        .input("stallId", stallId)
        .input("itemCode", item_code)
        .input("itemDesc", item_desc || null)
        .input("itemPrice", item_price)
        .input("itemCategory", item_category)
        .query(`
            INSERT INTO MenuItem (stall_id, item_code, item_desc, item_price, item_category)
            VALUES (@stallId, @itemCode, @itemDesc, @itemPrice, @itemCategory)
        `);

    // Insert cuisines if provided
    if (cuisine_ids && cuisine_ids.length > 0) {
        for (const cuisineId of cuisine_ids) {
            await pool.request()
                .input("stallId", stallId)
                .input("itemCode", item_code)
                .input("cuisineId", cuisineId)
                .query(`
                    INSERT INTO MenuItemCuisine (stall_id, item_code, cuisine_id)
                    VALUES (@stallId, @itemCode, @cuisineId)
                `);
        }
    }

    // Return the newly created item
    const result = await pool.request()
        .input("stallId", stallId)
        .input("itemCode", item_code)
        .query(`
            SELECT 
                m.item_code,
                m.item_desc,
                m.item_price,
                m.item_category,
                STRING_AGG(c.cuisine_desc, ', ') AS cuisines
            FROM MenuItem m
            LEFT JOIN MenuItemCuisine mc ON m.stall_id = mc.stall_id AND m.item_code = mc.item_code
            LEFT JOIN Cuisine c ON mc.cuisine_id = c.cuisine_id
            WHERE m.stall_id = @stallId AND m.item_code = @itemCode
            GROUP BY m.item_code, m.item_desc, m.item_price, m.item_category
        `);

    return result.recordset[0];
};

// PUT /stalls/:stallId/menu/:itemId - update menu item
const updateMenuItem = async (stallId, itemId, updateData) => {
    const { item_desc, item_price, item_category, cuisine_ids } = updateData;
    const pool = await poolPromise;

    // Check if menu item exists and belongs to this stall
    const checkResult = await pool.request()
        .input("stallId", stallId)
        .input("itemId", itemId)
        .query("SELECT * FROM MenuItem WHERE stall_id = @stallId AND item_code = @itemId");

    if (checkResult.recordset.length === 0) {
        throw new Error("Menu item not found or does not belong to this stall");
    }

    // Build dynamic update query
    let updateQuery = "UPDATE MenuItem SET ";
    const updates = [];
    const request = pool.request();
    request.input("stallId", stallId);
    request.input("itemId", itemId);

    if (item_desc !== undefined) {
        updates.push("item_desc = @itemDesc");
        request.input("itemDesc", item_desc);
    }
    if (item_price !== undefined) {
        updates.push("item_price = @itemPrice");
        request.input("itemPrice", item_price);
    }
    if (item_category !== undefined) {
        updates.push("item_category = @itemCategory");
        request.input("itemCategory", item_category);
    }

    if (updates.length === 0) {
        throw new Error("No fields to update");
    }

    updateQuery += updates.join(", ");
    updateQuery += " WHERE stall_id = @stallId AND item_code = @itemId";

    await request.query(updateQuery);

    // Update cuisines if provided
    if (cuisine_ids !== undefined) {
        // Delete existing cuisines
        await pool.request()
            .input("stallId", stallId)
            .input("itemId", itemId)
            .query("DELETE FROM MenuItemCuisine WHERE stall_id = @stallId AND item_code = @itemId");

        // Insert new cuisines
        if (cuisine_ids.length > 0) {
            for (const cuisineId of cuisine_ids) {
                await pool.request()
                    .input("stallId", stallId)
                    .input("itemId", itemId)
                    .input("cuisineId", cuisineId)
                    .query(`
                        INSERT INTO MenuItemCuisine (stall_id, item_code, cuisine_id)
                        VALUES (@stallId, @itemId, @cuisineId)
                    `);
            }
        }
    }

    // Return updated item
    const result = await pool.request()
        .input("stallId", stallId)
        .input("itemId", itemId)
        .query(`
            SELECT 
                m.item_code,
                m.item_desc,
                m.item_price,
                m.item_category,
                STRING_AGG(c.cuisine_desc, ', ') AS cuisines
            FROM MenuItem m
            LEFT JOIN MenuItemCuisine mc ON m.stall_id = mc.stall_id AND m.item_code = mc.item_code
            LEFT JOIN Cuisine c ON mc.cuisine_id = c.cuisine_id
            WHERE m.stall_id = @stallId AND m.item_code = @itemId
            GROUP BY m.item_code, m.item_desc, m.item_price, m.item_category
        `);

    return result.recordset[0];
};

// DELETE /stalls/:stallId/menu/:itemId - delete menu item
const deleteMenuItem = async (stallId, itemId) => {
    const pool = await poolPromise;

    // Check if menu item exists and belongs to this stall
    const checkResult = await pool.request()
        .input("stallId", stallId)
        .input("itemId", itemId)
        .query("SELECT * FROM MenuItem WHERE stall_id = @stallId AND item_code = @itemId");

    if (checkResult.recordset.length === 0) {
        throw new Error("Menu item not found or does not belong to this stall");
    }

    // Delete from MenuItemCuisine first (foreign key constraint)
    await pool.request()
        .input("stallId", stallId)
        .input("itemId", itemId)
        .query("DELETE FROM MenuItemCuisine WHERE stall_id = @stallId AND item_code = @itemId");

    // Delete from MenuItem
    await pool.request()
        .input("stallId", stallId)
        .input("itemId", itemId)
        .query("DELETE FROM MenuItem WHERE stall_id = @stallId AND item_code = @itemId");
};

// getallStalls 
const getAllStalls = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .query(`
            SELECT 
                s.stall_id,
                s.stall_name,
                s.stall_unit_no,
                v.vendor_id
            FROM Stall s
            JOIN Vendor v ON s.vendor_id = v.vendor_id
            ORDER BY s.stall_name
        `);

    return result.recordset;
};
module.exports = {
    getStallInfo,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getAllStalls
};