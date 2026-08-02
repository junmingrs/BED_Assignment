const { Ollama } = require("ollama");
const { poolPromise } = require("../db");
const { getAllHawkerCentres } = require("./hawkerCentreModel.js");
const { getAllCuisines } = require("./menuItemModel.js");

async function getRelevantContext() {
    const pool = await poolPromise;
    const ctx = { hawkerCentres: [], stalls: [], popularItems: [], menuItems: [], cuisines: [] };
    const hawkerResult = await getAllHawkerCentres();
    ctx.hawkerCentres = hawkerResult;
    const stallsResult = await pool.request().query(`
        SELECT s.stall_id, s.stall_name, s.stall_unit_no,
            ISNULL(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.rating_id) AS rating_count
        FROM Stall s
        LEFT JOIN Rating r ON s.stall_id = r.stall_id
        GROUP BY s.stall_id, s.stall_name, s.stall_unit_no
    `);
    ctx.stalls = stallsResult.recordset;
    const popularResult = await pool.request().query(`
        SELECT TOP 10 CAST(mi.item_desc AS NVARCHAR(255)) AS item_name,
            mi.item_price, mi.stall_id, SUM(oi.quantity) AS total_ordered
        FROM OrderItem oi
        JOIN MenuItem mi ON oi.stall_id = mi.stall_id AND oi.item_code = mi.item_code
        GROUP BY mi.stall_id, mi.item_code, CAST(mi.item_desc AS NVARCHAR(255)), mi.item_price
        ORDER BY total_ordered DESC
    `);
    ctx.popularItems = popularResult.recordset;
    const menuResult = await pool.request().query(`
        SELECT mi.stall_id, mi.item_code,
            CAST(mi.item_desc AS NVARCHAR(255)) AS item_desc,
            mi.item_price, mi.item_category
        FROM MenuItem mi
    `);
    ctx.menuItems = menuResult.recordset;
    const cuisineResult = await getAllCuisines();
    ctx.cuisines = cuisineResult;
    return ctx;
}

async function getChatResponse(history, context) {
    const systemPrompt = `
        You are a friendly food recommendation assistant for Hawker Ups, a Singapore hawker centre food ordering platform.
        ALL HAWKER CENTRES:
        ${JSON.stringify(context.hawkerCentres, null, 2)}
        AVAILABLE STALLS (with ratings):
        ${JSON.stringify(context.stalls, null, 2)}
        ALL MENU ITEMS:
        ${JSON.stringify(context.menuItems, null, 2)}
        ALL CUISINES ITEMS:
        ${JSON.stringify(context.cuisines, null, 2)}
        MOST POPULAR ITEMS:
        ${JSON.stringify(context.popularItems, null, 2)}
        GUIDELINES:
        - Recommend food based on the user's preferences using the data above.
        - Be concise, friendly, and helpful.
        - If the user asks about something not in the menu, politely let them know.
        - No need to state IDs.
        - Never use table format, it will not be formatted properly on text.
        To ADD items to the user's cart, append a JSON block at the end of your reply:
        \`\`\`json
        {"actions": [{"type": "addToCart", "stallId": "<stall_id>", "itemCode": "<item_code>", "itemName": "<item_desc>"}]}
        \`\`\`
        To let the user view a stall's full menu, include:
        \`\`\`json
        {"actions": [{"type": "viewStall", "stallId": "<stall_id>"}]}
        \`\`\`
        CRITICAL: Always write your conversational reply first, then optionally add the JSON block. Never output the JSON block alone without text.
        `;
    try {
        const ollama = new Ollama({
            host: "https://ollama.com",
            headers: {
                Authorization: "Bearer " + process.env.OLLAMA_API_KEY,
            },
        });
        const response = await ollama.chat({
            model: "minimax-m3",
            messages: [
                { role: "system", content: systemPrompt.trim() },
                // { role: "user", content: "test" },
                ...history
            ]
        });
        const rawContent = response.message.content.trim();
        const jsonMatch = rawContent.match(/```json\n?([\s\S]*?)```/);
        let reply = rawContent;
        let actions = [];
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1].trim());
                actions = parsed.actions || [];
            } catch (e) {
                // console.error("Failed to parse action JSON:", e);
            }
            reply = rawContent.replace(/```json\n?[\s\S]*?```/, "").trim();
        }
        return { reply, actions };
    } catch (err) {
        return {
            reply: "Sorry, I'm having trouble connecting. Please try again later.",
            actions: [],
        };
    }
}
module.exports = { getRelevantContext, getChatResponse };
