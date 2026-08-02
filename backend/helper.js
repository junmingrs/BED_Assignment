function getTimeFilter(timeframe, dateProperty) {
    if (!timeframe) return "";
    let timeFilter = "";

    const sgtOrderDate = `(${dateProperty} AT TIME ZONE 'UTC' AT TIME ZONE 'Singapore Standard Time')`;
    const sgtNow = `(SYSDATETIMEOFFSET() AT TIME ZONE 'Singapore Standard Time')`;

    // Cast to DATE to safely work with DATEPART and integer math
    const sgtDateOnly = `CAST(${sgtNow} AS DATE)`;

    switch (timeframe) {
        case "today":
            timeFilter = `
                AND ${sgtOrderDate} >= ${sgtDateOnly} 
                AND ${sgtOrderDate} < DATEADD(day, 1, ${sgtDateOnly})
            `;
            break;

        case "this_month":
            timeFilter = `
                AND ${sgtOrderDate} >= DATEADD(month, DATEDIFF(month, 0, ${sgtDateOnly}), 0) 
                AND ${sgtOrderDate} < DATEADD(month, DATEDIFF(month, 0, ${sgtDateOnly}) + 1, 0)
            `;
            break;

        case "this_week":
        default:
            // assumes monday is start of week
            timeFilter = `
                AND ${sgtOrderDate} >= DATEADD(day, 1 - DATEPART(dw, DATEADD(day, -1, ${sgtDateOnly})), ${sgtDateOnly})
                AND ${sgtOrderDate} < DATEADD(day, 8 - DATEPART(dw, DATEADD(day, -1, ${sgtDateOnly})), ${sgtDateOnly})
            `;
            break;
    }
    return timeFilter;
}

// for validation file
function handleValidationError(res, error) {
    const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
    return res.status(400).json({ message: errorMessage });
}

module.exports = { getTimeFilter, handleValidationError };
