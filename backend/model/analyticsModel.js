const { Ollama } = require("ollama");
const { poolPromise } = require("../db");

async function getKPI(stallId) {
    // TODO: filter by week. this is currently for "this week"
    const query = `
        SELECT 
            ISNULL(SUM(total_amount), 0) AS totalRevenue, 
            COUNT(order_id) AS orderCount, 
            ISNULL(AVG(total_amount), 0.00) AS averageOrderValue 
        FROM Orders 
        WHERE stall_id = @id 
          AND order_date >= DATEADD(week, DATEDIFF(week, 0, GETDATE()), 0)
          AND order_date < DATEADD(week, DATEDIFF(week, 0, GETDATE()) + 1, 0);
        `;
    const pool = await poolPromise;
    const result = await pool.request().input("id", stallId).query(query);

    if (result.recordset.length === 0) return null;
    return result.recordset[0];
}

async function getHourlySales(stallId) {
    // TODO: filter by week. this is currently for "this week"
    const query = `
SELECT 
    DATEPART(hour, order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Singapore Standard Time') AS sales_hour,
    ISNULL(SUM(total_amount), 0) AS totalRevenue
FROM Orders
WHERE stall_id = @id
  AND CAST(order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Singapore Standard Time' AS DATE) = CAST(GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Singapore Standard Time' AS DATE)
GROUP BY DATEPART(hour, order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Singapore Standard Time')
ORDER BY sales_hour ASC;
        `;
    const pool = await poolPromise;
    const result = await pool.request().input("id", stallId).query(query);

    if (result.recordset.length === 0) return null;
    return result.recordset;
}

async function getTopItems(stallId) {
    // TODO: filter by week. this is currently for "this week"
    const query = `
        SELECT 
            CAST(m.item_desc AS NVARCHAR(255)) AS itemName,
            SUM(oi.quantity) AS totalSold,
            SUM(oi.quantity * m.item_price) AS totalRevenue
        FROM OrderItem oi
        INNER JOIN Orders o 
            ON oi.order_id = o.order_id
        INNER JOIN MenuItem m 
            ON oi.stall_id = m.stall_id 
           AND oi.item_code = m.item_code
        WHERE 
            o.stall_id = @id
            AND o.status = 'Completed'
            AND (o.order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Singapore Standard Time') >= DATEADD(day, -7, CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Singapore Standard Time' AS DATE))
        GROUP BY 
            CAST(m.item_desc AS NVARCHAR(255))
        ORDER BY 
            totalSold DESC;
        `;
    const pool = await poolPromise;
    const result = await pool.request().input("id", stallId).query(query);

    if (result.recordset.length === 0) return null;
    return result.recordset;
}

async function getAISummary({ ratings, complaints, feedback, orders }) {
    // TODO: filter by week. this is currently for "this week"
    // TODO: update prompt for inspections

    const systemPrompt = `
        You are an expert AI Food Stall Operations Consultant. 
        Analyze the provided JSON operational data (orders, ratings, complaints, feedback) for a food stall for this week.

        Output your summary strictly as a JSON object with 3 key fields matching these exact card requirements:
        1. "highlights": Key sales achievements, popular items, or revenue growth (1-2 sentences).
        2. "flags": Active complaints, low rating trends, or operational warnings. If there are no issues, warnings, or complaints, simply state "Everything is looking good! No warnings or complaints flagged."
        3. "actions": 2 prioritized, actionable steps for the vendor today. If no immediate action is required, it is completely okay to say "Everything is on track. No urgent action required today."

        CRITICAL: Return ONLY raw, valid JSON. Do not write introductory text, markdown code blocks (like \`\`\`json), or explanations

        Rules:
        - Be concise, professional, and encouraging.
        - Use bullet points and bold key stats/numbers for readability.
        - Only base your response on the provided data. Do not make up facts.
    `;

    const userPrompt = `
        Operational Data for this week:
        - Orders & Revenue: ${JSON.stringify(orders)}
        - Customer Ratings: ${JSON.stringify(ratings)}
        - Active Complaints: ${JSON.stringify(complaints)}
        - Recent Customer Feedback: ${JSON.stringify(feedback)}
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
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });
        const rawContent = response.message.content.trim();
        // in case it accidentally returns the ```json
        const cleanedJsonString = rawContent.replace(/^```json\s*|\s*```$/g, "");
        return JSON.parse(cleanedJsonString);
    } catch (err) {
        console.error("Error generating or parsing AI summary:", err);

        // fallback content
        return {
            highlights: "Cannot generate AI summary at this time. Please try again.",
            flags: "Cannot generate AI summary at this time. Please try again.",
            actions: "Cannot generate AI summary at this time. Please try again.",
        };
    }
}

module.exports = { getKPI, getHourlySales, getTopItems, getAISummary };
