SELECT
    SYSDATETIMEOFFSET() AS raw_now,
    SYSDATETIMEOFFSET() AT TIME ZONE 'Singapore Standard Time' AS sgt_now,
    DATEDIFF(week, 0, CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Singapore Standard Time' AS DATETIME2)) AS week_diff,
    DATEADD(week, DATEDIFF(week, 0, CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Singapore Standard Time' AS DATETIME2)), 0) AS week_start;


SELECT TOP 5
    order_id,
    order_date,
    order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Singapore Standard Time' AS sgt_order_date
FROM Orders
WHERE stall_id = 'DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD'
ORDER BY order_date DESC;