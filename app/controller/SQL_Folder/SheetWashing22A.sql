
WITH MaxLotSizeCTE AS (
    -- Get the maximum LotSize for each SKUID
    SELECT
        SKUID,
        MAX(LotSize) AS MaxLotSize
    FROM
        [dbo].[PurchaseLotSize] as MLS
    GROUP BY
        SKUID
)
,
SkidData AS (
    -- Fetch relevant SKU, inventory, and stock data along with max LotSize
    SELECT
        SKU.Model,
        SKU.SKUCode AS Part,
        CASE
        WHEN StockBucket.StockBucketCode IN ('OnHand','WashingWIP') THEN StockBucket.StockBucketCode
        ELSE NULL
    END AS StockBucketCode,
          CASE
        WHEN StockBucket.StockBucketCode IS NULL THEN 0
        ELSE SKUStock.BucketQuantityInStorageUOM
    END AS BucketQuantityInStorageUOM,
        MLS.MaxLotSize
    FROM
        [dbo].[SKU] AS SKU
    JOIN
        [dbo].[SKUInventory] AS SKUInventory
        ON SKU.SKUID = SKUInventory.SKUID
    LEFT JOIN
        [dbo].[SKUCOST] AS SKUCOST
        ON SKUInventory.SKUInventoryID = SKUCOST.SKUInventoryID
    JOIN
        [dbo].[SKUStock] AS SKUStock
        ON SKUCOST.SKUCOSTID = SKUStock.SKUCostID
    LEFT JOIN
        [dbo].[StockBucket] AS StockBucket
        ON SKUStock.StockBucketID = StockBucket.StockBucketID
		AND StockBucket.StockBucketCode IN ('OnHand','WashingWIP') 
    JOIN
        MaxLotSizeCTE AS MLS
        ON SKU.SKUID = MLS.SKUID
    WHERE
               (StockBucket.StockBucketCode IS NOT NULL OR StockBucket.StockBucketCode IS NULL)
),
FullSkidCTE AS (
    -- Calculate total full skids using the max LotSize
    SELECT
        Part,
        StockBucketCode,
        SUM(CASE
            WHEN BucketQuantityInStorageUOM >= MaxLotSize THEN FLOOR(BucketQuantityInStorageUOM / MaxLotSize) * MaxLotSize
            ELSE 0
        END) AS TotalFullSkid
    FROM
        SkidData
    GROUP BY
        Part, StockBucketCode
),
PartialSkidCTE AS (
    -- Calculate total partial skids (remaining quantities)
    SELECT
        Part,
        StockBucketCode,
        SUM(CASE
            WHEN BucketQuantityInStorageUOM < MaxLotSize THEN BucketQuantityInStorageUOM
            ELSE BucketQuantityInStorageUOM % MaxLotSize
        END) AS TotalPartialSkid
    FROM
        SkidData
    GROUP BY
        Part, StockBucketCode
),
SheetWashedCTE AS(

  SELECT
        SKU.SKUID,
		COUNT(DISTINCT SKUStock.LocationID) AS NoOfSkids,
       SUM(CAST(SKUStock.BucketQuantityInStorageUOM AS INT)) AS WashedQuantity,
	   StockBucket.StockBucketCode
   FROM
        [dbo].[SKUStock] AS SKUStock
    JOIN
        [dbo].[StockBucket] AS StockBucket ON SKUStock.StockBucketID = StockBucket.StockBucketID
     JOIN
        [dbo].[SKUCOST] AS SKUCOST ON SKUStock.SKUCostID = SKUCOST.SKUCOSTID  -- Link SKUStock to SKUCOST using SKUCostID
    JOIN
        [dbo].[SKUInventory] AS SKUInventory ON SKUCost.SKUInventoryID = SKUInventory.SKUInventoryID
	join
	   [dbo].SKU as sku on SKUInventory.SKUID=SKU.SKUID
	   WHERE StockBucket.StockBucketCode IN( 'Washed')
    GROUP BY
        SKU.SKUID,StockBucket.StockBucketCode
 
),

ShiftDetails AS (
    SELECT TOP 1
    CurrentShift.ShiftId AS CurrentShiftID,
    CurrentShift.ShiftCode AS CurrentShiftCode,
    CAST(CASE
        WHEN CurrentShift.ShiftStartTime > CurrentShift.ShiftEndTime 
            AND CONVERT(TIME, GETDATE()) < CurrentShift.ShiftEndTime
            THEN DATEADD(DAY, -1, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftStartTime AS DATETIME))
        ELSE CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftStartTime AS DATETIME)
    END AS DATE) AS CurrentShiftDate,
    CAST(CASE
        WHEN CurrentShift.ShiftStartTime > CurrentShift.ShiftEndTime 
            AND CONVERT(TIME, GETDATE()) < CurrentShift.ShiftEndTime
            THEN DATEADD(DAY, -1, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftStartTime AS DATETIME))
        ELSE CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftStartTime AS DATETIME)
    END AS DATETIME) AS CurrentShiftStartDateTime,
    CAST(CASE
        WHEN CurrentShift.ShiftStartTime > CurrentShift.ShiftEndTime
            THEN DATEADD(DAY, 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftEndTime AS DATETIME))
        ELSE CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftEndTime AS DATETIME)
    END AS DATETIME) AS CurrentShiftEndDateTime,

    -- Previous Shift Calculations (Same logic as your original)
    CAST(CASE
        WHEN PreviousShift.ShiftStartTime > PreviousShift.ShiftEndTime
            THEN DATEADD(DAY, -1,
                CASE
                    WHEN CONVERT(TIME, GETDATE()) BETWEEN '00:00:00' AND '14:45:00'
                        THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME)
                    ELSE DATEADD(DAY, 0, CAST(CAST(GETDATE() AS DATE) AS DATETIME))
                END + CAST(PreviousShift.ShiftStartTime AS DATETIME))
        ELSE DATEADD(DAY,
                CASE
                    WHEN CONVERT(TIME, GETDATE()) BETWEEN '00:00:00' AND '14:45:00'
                        THEN -1
                    ELSE 0
                END, CAST(CAST(GETDATE() AS DATE) AS DATETIME))
                + CAST(PreviousShift.ShiftStartTime AS DATETIME)
    END AS DATETIME) AS PreviousShiftStartDateTime,
    
    CAST(CASE
        WHEN PreviousShift.ShiftStartTime > PreviousShift.ShiftEndTime
            THEN CASE
                    WHEN CONVERT(TIME, GETDATE()) BETWEEN '00:00:00' AND '14:45:00'
                        THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME)
                    ELSE DATEADD(DAY, -1, CAST(CAST(GETDATE() AS DATE) AS DATETIME))
                 END + CAST(PreviousShift.ShiftEndTime AS DATETIME)
        ELSE DATEADD(DAY,
                CASE
                    WHEN CONVERT(TIME, GETDATE()) BETWEEN '00:00:00' AND '14:45:00'
                        THEN -1
                    ELSE 0
                END, CAST(CAST(GETDATE() AS DATE) AS DATETIME))
                + CAST(PreviousShift.ShiftEndTime AS DATETIME)
    END AS DATETIME) AS PreviousShiftEndDateTime,

    CAST(CASE
        WHEN CONVERT(TIME, GETDATE()) BETWEEN '00:00:00' AND '14:45:00'
            THEN DATEADD(DAY, -1, CAST(GETDATE() AS DATE))
        ELSE CAST(GETDATE() AS DATE)
    END AS DATE) AS PreviousShiftDate,
    PreviousShift.ShiftId AS PreviousShiftID,
CAST(CASE
    WHEN NextShift.ShiftId = 3 AND CurrentShift.ShiftId != 2
        THEN DATEADD(DAY, 
            CASE
                WHEN CONVERT(TIME, GETDATE()) BETWEEN '23:45:01' AND '23:59:59'
                    THEN 1  -- Add 1 day if time is between 23:45:01 and 23:59:59
                ELSE 0  -- Otherwise, use the current date
            END, 
            CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftStartTime AS DATETIME))
    WHEN NextShift.ShiftId = 3 AND CurrentShift.ShiftId = 2
        THEN DATEADD(DAY, 
            CASE
                WHEN CONVERT(TIME, GETDATE()) BETWEEN '23:45:01' AND '23:59:59'
                    THEN 1  -- Add 1 day if time is between 23:45:01 and 23:59:59
                ELSE 0  -- Otherwise, use the current date
            END, 
            CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftStartTime AS DATETIME))
    ELSE DATEADD(DAY, 
            CASE
                WHEN CONVERT(TIME, GETDATE()) BETWEEN '23:45:01' AND '23:59:59'
                    THEN 1  -- Add 1 day if time is between 23:45:01 and 23:59:59
                ELSE 0  -- Otherwise, use the current date
            END, 
            CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftStartTime AS DATETIME))
END AS DATETIME) AS NextShiftStartDateTime,

CAST(CASE
    WHEN NextShift.ShiftId = 3 AND CurrentShift.ShiftId != 2
        THEN DATEADD(DAY, 
            CASE
                WHEN CONVERT(TIME, GETDATE()) BETWEEN '23:45:01' AND '23:59:59'
                    THEN 1  -- Add 1 day if time is between 23:45:01 and 23:59:59
                ELSE 0  -- Otherwise, use the current date
            END, 
            CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftEndTime AS DATETIME))
    WHEN NextShift.ShiftId = 3 AND CurrentShift.ShiftId = 2
        THEN DATEADD(DAY, 
            CASE
                WHEN CONVERT(TIME, GETDATE()) BETWEEN '23:45:01' AND '23:59:59'
                    THEN 1  -- Add 1 day if time is between 23:45:01 and 23:59:59
                ELSE 0  -- Otherwise, use the current date
            END, 
            CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftEndTime AS DATETIME))
    ELSE DATEADD(DAY, 
            CASE
                WHEN CONVERT(TIME, GETDATE()) BETWEEN '23:45:01' AND '23:59:59'
                    THEN 1  -- Add 1 day if time is between 23:45:01 and 23:59:59
                ELSE 0  -- Otherwise, use the current date
            END, 
            CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftEndTime AS DATETIME))
END AS DATETIME) AS NextShiftEndDateTime,

CAST(CASE
    WHEN NextShift.ShiftId = 3 AND CurrentShift.ShiftId != 2
        THEN DATEADD(DAY, 
            CASE
                WHEN CONVERT(TIME, GETDATE()) BETWEEN '23:45:01' AND '23:59:59'
                    THEN 1  -- Add 1 day if time is between 23:45:01 and 23:59:59
                ELSE 0  -- Otherwise, use the current date
            END, 
            CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftStartTime AS DATETIME))
    WHEN NextShift.ShiftId = 3 AND CurrentShift.ShiftId = 2
        THEN DATEADD(DAY, 
            CASE
                WHEN CONVERT(TIME, GETDATE()) BETWEEN '23:45:01' AND '23:59:59'
                    THEN 1  -- Add 1 day if time is between 23:45:01 and 23:59:59
                ELSE 0  -- Otherwise, use the current date
            END, 
            CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftStartTime AS DATETIME))
    ELSE DATEADD(DAY, 
            CASE
                WHEN CONVERT(TIME, GETDATE()) BETWEEN '23:45:01' AND '23:59:59'
                    THEN 1  -- Add 1 day if time is between 23:45:01 and 23:59:59
                ELSE 0  -- Otherwise, use the current date
            END, 
            CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(CurrentShift.ShiftStartTime AS DATETIME))
END AS DATE) AS NextShiftDate
,

-- Next Shift ID (Same logic as previous)
NextShift.ShiftId AS NextShiftID

FROM
    ShiftHeader AS CurrentShift
CROSS JOIN
    (SELECT
        ShiftId, ShiftName, ShiftCode, ShiftStartTime, ShiftEndTime
     FROM ShiftHeader
     WHERE ShiftId = (
         CASE
             WHEN EXISTS (   
                 SELECT 1
                 FROM ShiftHeader
                 WHERE ShiftId = 1
                   AND (CONVERT(TIME, GETDATE()) BETWEEN ShiftStartTime AND ShiftEndTime
                    OR ShiftStartTime > ShiftEndTime AND
                       (CONVERT(TIME, GETDATE()) >= ShiftStartTime OR CONVERT(TIME, GETDATE()) < ShiftEndTime))
             ) THEN 3
             WHEN EXISTS (
                 SELECT 1
                 FROM ShiftHeader
                 WHERE ShiftId = 2
                   AND (CONVERT(TIME, GETDATE()) BETWEEN ShiftStartTime AND ShiftEndTime
                    OR ShiftStartTime > ShiftEndTime AND
                       (CONVERT(TIME, GETDATE()) >= ShiftStartTime OR CONVERT(TIME, GETDATE()) < ShiftEndTime))
             ) THEN 1
             WHEN EXISTS (
                 SELECT 1
                 FROM ShiftHeader
                 WHERE ShiftId = 3
                   AND (CONVERT(TIME, GETDATE()) BETWEEN ShiftStartTime AND ShiftEndTime
                    OR ShiftStartTime > ShiftEndTime AND
                       (CONVERT(TIME, GETDATE()) >= ShiftStartTime OR CONVERT(TIME, GETDATE()) < ShiftEndTime))
             ) THEN 2
             ELSE NULL
         END
     )) AS PreviousShift
CROSS JOIN
    (SELECT
        ShiftId, ShiftName, ShiftCode, ShiftStartTime, ShiftEndTime
     FROM ShiftHeader
     WHERE ShiftId = (
         CASE
             WHEN EXISTS (   
                 SELECT 1
                 FROM ShiftHeader
                 WHERE ShiftId = 1
                   AND (CONVERT(TIME, GETDATE()) BETWEEN ShiftStartTime AND ShiftEndTime
                    OR ShiftStartTime > ShiftEndTime AND
                       (CONVERT(TIME, GETDATE()) >= ShiftStartTime OR CONVERT(TIME, GETDATE()) < ShiftEndTime))
             ) THEN 2
             WHEN EXISTS (
                 SELECT 1
                 FROM ShiftHeader
                 WHERE ShiftId = 2
                   AND (CONVERT(TIME, GETDATE()) BETWEEN ShiftStartTime AND ShiftEndTime
                    OR ShiftStartTime > ShiftEndTime AND
                       (CONVERT(TIME, GETDATE()) >= ShiftStartTime OR CONVERT(TIME, GETDATE()) < ShiftEndTime))
             ) THEN 3
             WHEN EXISTS (
                 SELECT 1
                 FROM ShiftHeader
                 WHERE ShiftId = 3
                   AND (CONVERT(TIME, GETDATE()) BETWEEN ShiftStartTime AND ShiftEndTime
                    OR ShiftStartTime > ShiftEndTime AND
                       (CONVERT(TIME, GETDATE()) >= ShiftStartTime OR CONVERT(TIME, GETDATE()) < ShiftEndTime))
             ) THEN 1
             ELSE NULL
         END
     )) AS NextShift
WHERE
    (CONVERT(TIME, GETDATE()) BETWEEN CurrentShift.ShiftStartTime AND CurrentShift.ShiftEndTime)
    OR
    (CurrentShift.ShiftStartTime > CurrentShift.ShiftEndTime AND
     (CONVERT(TIME, GETDATE()) >= CurrentShift.ShiftStartTime OR CONVERT(TIME, GETDATE()) < CurrentShift.ShiftEndTime))

),
NextShiftData as(select 
ShiftID,
ScheduledDate,
DieSetID
from SSPCSdbo.PatternDataInterpretation AS PI
join
 ShiftDetails as SD ON
 SD.NextShiftDate=PI.ScheduledDate
 AND
 SD.NextShiftID = PI.ShiftID)
SELECT
    SKU.Model AS [Model],
    SKU.SKUCode AS [Part],
	SKU.SKUID,
     SHIFTHEADER.ShiftName AS SHIFT,
    PatternActual.Date,
	PatternActual.PartSeq,
	PatternActual.DiesetId,
	MLS.MaxLotSize,
CONCAT(
    CASE
        WHEN StockBucket.StockBucketCode = 'Washed' THEN '0'
        ELSE ISNULL(CAST(COUNT(DISTINCT CASE 
                                          WHEN SKUStock.BucketQuantityInStorageUOM = MLS.MaxLotSize THEN SKUStock.LocationID
                                          ELSE NULL 
                                        END) AS DECIMAL(18,0)), 0)
    END,
    '(',
    ISNULL(CAST(FS.TotalFullSkid AS INT), 0),  -- This is the value for TotalFullSkid
    ')'
) AS FullSkidData,
CONCAT(
    CASE
        WHEN StockBucket.StockBucketCode = 'Washed' THEN '0'
        ELSE ISNULL(CAST(COUNT(DISTINCT CASE 
                                          WHEN SKUStock.BucketQuantityInStorageUOM < MLS.MaxLotSize THEN SKUStock.LocationID
                                          ELSE NULL 
                                        END) AS DECIMAL(18,0)), 0)
    END,
    '(',
    ISNULL(CAST(PS.TotalPartialSkid AS INT), 0),  -- This is the value for TotalPartialSkid
    ')'
) AS PartialSkidData,
    CONCAT(
        ISNULL(CAST(SW.NoOfSkids AS DECIMAL(18,0)), 0),
        '(',
        ISNULL(SW.WashedQuantity, 0),
        ')'
    ) AS SheetWashed,
CASE 
    WHEN StockBucket.StockBucketCode = 'Washed' THEN
        -- For Completed (Washed) rows, take only SheetWashed data
        CONCAT(
            ISNULL(CAST(SW.NoOfSkids AS DECIMAL(18,0)), 0),
            '(',
            ISNULL(SW.WashedQuantity, 0),
            ')'
        )
    ELSE 
        -- For non-Washed rows (OnHand, WashingWIP), calculate FullSkid + PartialSkid
        CONCAT(
            ISNULL(CAST(COUNT(DISTINCT CASE 
                WHEN SKUStock.BucketQuantityInStorageUOM = MLS.MaxLotSize THEN SKUStock.LocationID
                ELSE NULL 
            END) AS DECIMAL(18,0)), 0)
            + ISNULL(CAST(COUNT(DISTINCT CASE 
                WHEN SKUStock.BucketQuantityInStorageUOM < MLS.MaxLotSize THEN SKUStock.LocationID
                ELSE NULL 
            END) AS DECIMAL(18,0)), 0),
            '(',
            CASE 
                WHEN ISNULL(FS.TotalFullSkid, 0) + ISNULL(PS.TotalPartialSkid, 0) = 
                     FLOOR(ISNULL(FS.TotalFullSkid, 0) + ISNULL(PS.TotalPartialSkid, 0)) 
                THEN CAST(ISNULL(FS.TotalFullSkid, 0) + ISNULL(PS.TotalPartialSkid, 0) AS INT)
                ELSE CAST(ISNULL(FS.TotalFullSkid, 0) + ISNULL(PS.TotalPartialSkid, 0) AS DECIMAL(18,0))
            END,
            ')'
        )
END AS TotalSkid,
    StockBucket.StockBucketCode AS [BucketCode],
    CASE
	WHEN StockBucket.StockBucketCode = 'OnHand' THEN 'Next' 

        WHEN StockBucket.StockBucketCode = 'WashingWIP' THEN 'In Progress'
        WHEN StockBucket.StockBucketCode = 'Washed' THEN 'Completed'
        ELSE 'Next'
    END AS [Status],
	SKUMaster.ISSheetWashRequired
FROM 
   SSPCSdbo.PatternActualData as PatternActual 

JOIN 
    SSPCSdbo.BOMTypeMaster ON BOMTypeMaster.DieSetID = PatternActual.DieSetID
JOIN 
    KitBOM ON KitBOM.BOMType = SSPCSdbo.BOMTypeMaster.DieSet 
JOIN 
    SKU ON SKU.SKUID = KitBOM.KitID
JOIN 
    [dbo].[SKUInventory] AS SKUInventory ON SKU.SKUID = SKUInventory.SKUID
LEFT JOIN 
    [dbo].[SKUCOST] AS SKUCOST ON SKUInventory.SKUInventoryID = SKUCOST.SKUInventoryID
LEFT JOIN 
    [dbo].[SKUStock] AS SKUStock ON SKUCOST.SKUCOSTID = SKUStock.SKUCostID  
	AND SKUStock.StockBucketID IN (select StockBucketID FROM StockBucket WHERE StockBucketCode IN ('OnHand','WashingWIP', 'Washed'))
	--AND SKUStock.StockBucketID IN(3,86,87)
LEFT JOIN 
    [dbo].[StockBucket] AS StockBucket ON SKUStock.StockBucketID = StockBucket.StockBucketID
	--	AND 
--StockBucket.StockBucketCode IN ('OnHand', 'WashingWIP', 'Washed')
LEFT JOIN 
    FullSkidCTE AS FS ON SKU.SKUCode = FS.Part AND StockBucket.StockBucketCode = FS.StockBucketCode
LEFT JOIN 
    PartialSkidCTE AS PS ON SKU.SKUCode = PS.Part AND StockBucket.StockBucketCode = PS.StockBucketCode
LEFT  join 
    SheetWashedCTE AS SW ON SKU.SKUID = SW.SKUID AND StockBucket.StockBucketCode = SW.StockBucketCode 
LEFT JOIN 
    [SSPCSdbo].[SKUMaster] AS SKUMaster ON SKUMaster.SKUID = KitBOM.KitID
join
    [dbo].[ShiftHeader] AS SHIFTHEADER ON SHIFTHEADER.ShiftId=PatternActual.ShiftID
	
LEFT JOIN
    MaxLotSizeCTE AS MLS ON SKU.SKUID = MLS.SKUID
JOIN 
    ShiftDetails AS ShiftData 
    ON (
        PatternActual.ShiftID = ShiftData.PreviousShiftID 
        AND PatternActual.Date = ShiftData.PreviousShiftDate
    )
    OR (
        PatternActual.ShiftID = ShiftData.CurrentShiftID 
        AND PatternActual.Date = ShiftData.CurrentShiftDate
    )

WHERE
     PatternActual.LINEID = 3
    AND SKUMaster.ISSheetWashRequired = 1
	AND (
        (StockBucket.StockBucketCode = 'OnHand' AND PatternActual.ShiftID = ShiftData.NextShiftID)
        OR
        (StockBucket.StockBucketCode != 'OnHand' OR NOT EXISTS (
            SELECT 1
            FROM [SSPCSdbo].[PatternDataInterpretation] AS subPattern
            --JOIN [dbo].[StockBucket] AS subStockBucket 
            --    ON subPattern.ShiftID = subStockBucket.ShiftID
            WHERE 
                subPattern.DieSetID = PatternActual.DieSetID
                AND StockBucket.StockBucketCode = 'OnHand'
                AND subPattern.ShiftID = ShiftData.NextShiftID
                AND subPattern.ScheduledDate = ShiftData.NextShiftDate
        ))
    )
GROUP BY
    SKU.Model, SKU.SKUCode, StockBucket.StockBucketCode, FS.TotalFullSkid, PS.TotalPartialSkid, PatternActual.ShiftID, PatternActual.Date,
	PatternActual.PartSeq,SHIFTHEADER.ShiftName,PatternActual.DiesetId,SW.NoOfSkids,SW.WashedQuantity,
	SKUMaster.ISSheetWashRequired,MLS.MaxLotSize,SKU.SKUID,
	ShiftData.CurrentShiftID,ShiftData.PreviousShiftID,ShiftData.NextShiftID
	
UNION ALL
SELECT
    SKU.Model AS [Model],
    SKU.SKUCode AS [Part],
	SKU.SKUID,
     SHIFTHEADER.ShiftName AS SHIFT,
    PatternDataInterpretation.ScheduledDate,
	PatternDataInterpretation.PartSeq,
	PatternDataInterpretation.DiesetId,
	MLS.MaxLotSize,
CONCAT(
    CASE
        WHEN StockBucket.StockBucketCode = 'Washed' THEN '0'
        ELSE ISNULL(CAST(COUNT(DISTINCT CASE 
                                          WHEN SKUStock.BucketQuantityInStorageUOM = MLS.MaxLotSize THEN SKUStock.LocationID
                                          ELSE NULL 
                                        END) AS DECIMAL(18,0)), 0)
    END,
    '(',
    ISNULL(CAST(FS.TotalFullSkid AS INT), 0),  -- This is the value for TotalFullSkid
    ')'
) AS FullSkidData,
CONCAT(
    CASE
        WHEN StockBucket.StockBucketCode = 'Washed' THEN '0'
        ELSE ISNULL(CAST(COUNT(DISTINCT CASE 
                                          WHEN SKUStock.BucketQuantityInStorageUOM < MLS.MaxLotSize THEN SKUStock.LocationID
                                          ELSE NULL 
                                        END) AS DECIMAL(18,0)), 0)
    END,
    '(',
    ISNULL(CAST(PS.TotalPartialSkid AS INT), 0),  -- This is the value for TotalPartialSkid
    ')'
) AS PartialSkidData,
    CONCAT(
        ISNULL(CAST(SW.NoOfSkids AS DECIMAL(18,0)), 0),
        '(',
        ISNULL(SW.WashedQuantity, 0),
        ')'
    ) AS SheetWashed,
CASE 
    WHEN StockBucket.StockBucketCode = 'Washed' THEN
        -- For Completed (Washed) rows, take only SheetWashed data
        CONCAT(
            ISNULL(CAST(SW.NoOfSkids AS DECIMAL(18,0)), 0),
            '(',
            ISNULL(SW.WashedQuantity, 0),
            ')'
        )
    ELSE 
        -- For non-Washed rows (OnHand, WashingWIP), calculate FullSkid + PartialSkid
        CONCAT(
            ISNULL(CAST(COUNT(DISTINCT CASE 
                WHEN SKUStock.BucketQuantityInStorageUOM = MLS.MaxLotSize THEN SKUStock.LocationID
                ELSE NULL 
            END) AS DECIMAL(18,0)), 0)
            + ISNULL(CAST(COUNT(DISTINCT CASE 
                WHEN SKUStock.BucketQuantityInStorageUOM < MLS.MaxLotSize THEN SKUStock.LocationID
                ELSE NULL 
            END) AS DECIMAL(18,0)), 0),
            '(',
            CASE 
                WHEN ISNULL(FS.TotalFullSkid, 0) + ISNULL(PS.TotalPartialSkid, 0) = 
                     FLOOR(ISNULL(FS.TotalFullSkid, 0) + ISNULL(PS.TotalPartialSkid, 0)) 
                THEN CAST(ISNULL(FS.TotalFullSkid, 0) + ISNULL(PS.TotalPartialSkid, 0) AS INT)
                ELSE CAST(ISNULL(FS.TotalFullSkid, 0) + ISNULL(PS.TotalPartialSkid, 0) AS DECIMAL(18,0))
            END,
            ')'
        )
END AS TotalSkid,
    StockBucket.StockBucketCode AS [BucketCode],
    CASE
	WHEN StockBucket.StockBucketCode = 'OnHand' THEN 'Next' 

        WHEN StockBucket.StockBucketCode = 'WashingWIP' THEN 'In Progress'
        WHEN StockBucket.StockBucketCode = 'Washed' THEN 'Completed'
        ELSE 'Next'
    END AS [Status],
	SKUMaster.ISSheetWashRequired
FROM 
[SSPCSdbo].[PatternDataInterpretation] as PatternDataInterpretation
JOIN 
    SSPCSdbo.BOMTypeMaster ON BOMTypeMaster.DieSetID = PatternDataInterpretation.DieSetID
JOIN 
    KitBOM ON KitBOM.BOMType = SSPCSdbo.BOMTypeMaster.DieSet 
JOIN 
    SKU ON SKU.SKUID = KitBOM.KitID
JOIN 
    [dbo].[SKUInventory] AS SKUInventory ON SKU.SKUID = SKUInventory.SKUID
LEFT JOIN 
    [dbo].[SKUCOST] AS SKUCOST ON SKUInventory.SKUInventoryID = SKUCOST.SKUInventoryID
LEFT JOIN 
    [dbo].[SKUStock] AS SKUStock ON SKUCOST.SKUCOSTID = SKUStock.SKUCostID  
	AND SKUStock.StockBucketID IN (select StockBucketID FROM StockBucket WHERE StockBucketCode IN ('OnHand','WashingWIP', 'Washed'))
LEFT JOIN 
    [dbo].[StockBucket] AS StockBucket ON SKUStock.StockBucketID = StockBucket.StockBucketID

LEFT JOIN 
    FullSkidCTE AS FS ON SKU.SKUCode = FS.Part AND StockBucket.StockBucketCode = FS.StockBucketCode
LEFT JOIN 
    PartialSkidCTE AS PS ON SKU.SKUCode = PS.Part AND StockBucket.StockBucketCode = PS.StockBucketCode
LEFT  join 
    SheetWashedCTE AS SW ON SKU.SKUID = SW.SKUID AND StockBucket.StockBucketCode = SW.StockBucketCode 
LEFT JOIN 
    [SSPCSdbo].[SKUMaster] AS SKUMaster ON SKUMaster.SKUID = KitBOM.KitID
join
    [dbo].[ShiftHeader] AS SHIFTHEADER ON SHIFTHEADER.ShiftId=PatternDataInterpretation.ShiftID
	
LEFT JOIN
    MaxLotSizeCTE AS MLS ON SKU.SKUID = MLS.SKUID
JOIN 
    ShiftDetails AS ShiftData 
    ON (
        PatternDataInterpretation.ShiftID = ShiftData.NextShiftID 
        AND PatternDataInterpretation.ScheduledDate = ShiftData.NextShiftDate
    )

WHERE
     PatternDataInterpretation.LINEID = 3
    AND SKUMaster.ISSheetWashRequired = 1
	--AND 
   -- StockBucket.StockBucketCode IN ('OnHand', 'WashingWIP', 'Washed')
     AND (
        (StockBucket.StockBucketCode = 'OnHand' AND PatternDataInterpretation.ShiftID = ShiftData.NextShiftID)
        OR
        (StockBucket.StockBucketCode != 'OnHand' OR NOT EXISTS (
            SELECT 1
            FROM [SSPCSdbo].[PatternDataInterpretation] AS subPattern
            --JOIN [dbo].[StockBucket] AS subStockBucket 
            --    ON subPattern.ShiftID = subStockBucket.ShiftID
            WHERE 
                subPattern.DieSetID = PatternDataInterpretation.DieSetID
                AND StockBucket.StockBucketCode = 'OnHand'
                AND subPattern.ShiftID = ShiftData.NextShiftID
                AND subPattern.ScheduledDate = ShiftData.NextShiftDate
        ))


    )

GROUP BY
    SKU.Model, SKU.SKUCode, StockBucket.StockBucketCode, FS.TotalFullSkid, PS.TotalPartialSkid, PatternDataInterpretation.ShiftID, PatternDataInterpretation.ScheduledDate,
	PatternDataInterpretation.PartSeq,SHIFTHEADER.ShiftName,PatternDataInterpretation.DiesetId,SW.NoOfSkids,SW.WashedQuantity,
	SKUMaster.ISSheetWashRequired,MLS.MaxLotSize,SKU.SKUID,
	ShiftData.CurrentShiftID,ShiftData.PreviousShiftID,ShiftData.NextShiftID

