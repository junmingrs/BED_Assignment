function getTimeFilter(timeframe, dateProperty) {
    if (!timeframe) return "";

    let timeFilter = "";
    // convert dates to sg bc idk why sql timings are in some weird timezone
    const sgtOrderDate = `(${dateProperty} AT TIME ZONE 'UTC' AT TIME ZONE 'Singapore Standard Time')`;
    const sgtNow = `(SYSDATETIMEOFFSET() AT TIME ZONE 'Singapore Standard Time')`;

    switch (timeframe) {
        case "today":
            timeFilter = `
                    AND ${sgtOrderDate} >= CAST(${sgtNow} AS DATE)
                    AND ${sgtOrderDate} < DATEADD(day, 1, CAST(${sgtNow} AS DATE))
                `;
            break;

        case "this_month":
            timeFilter = `
                    AND ${sgtOrderDate} >= DATEADD(month, DATEDIFF(month, 0, ${sgtNow}), 0)
                    AND ${sgtOrderDate} < DATEADD(month, DATEDIFF(month, 0, ${sgtNow}) + 1, 0)
                `;
            break;

        case "this_week":
        default:
            timeFilter = `
                    AND ${sgtOrderDate} >= DATEADD(week, DATEDIFF(week, 0, ${sgtNow}), 0)
                    AND ${sgtOrderDate} < DATEADD(week, DATEDIFF(week, 0, ${sgtNow}) + 1, 0)
                `;
            break;
    }
    return timeFilter;
}

module.exports = { getTimeFilter };
