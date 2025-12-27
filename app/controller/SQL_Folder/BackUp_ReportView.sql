-- INSERT INTO [PALMS-TKM-DB-UAT].[dbo].[ViewScreenMapping]
-- ( [ViewName], [CreatedBy], [CreatedDate], [ScreenID], [ScreenName], [ViewDisplayName])
-- VALUES
-- ('SSPCSCustomReports.v_SheetWashingView', 1, '2024-10-30 23:03:43.840', 440, NULL, 'SheetWashingView');
-- INSERT INTO [PALMS-TKM-DB-UAT].[dbo].[ViewScreenMapping]
-- ( [ViewName], [CreatedBy], [CreatedDate], [ScreenID], [ScreenName], [ViewDisplayName])
-- VALUES
-- ('SSPCSCustomReports.v_MaterialLoadingView', 1, '2024-10-30 23:03:43.840', 440, NULL, 'MaterialLoadingView');

-- USE [PALMS-TKM-DB-UAT]
-- GO

-- SET ANSI_NULLS ON
-- GO

-- SET QUOTED_IDENTIFIER ON
-- GO


 
-- -- Create the new view
-- CREATE OR ALTER VIEW [SSPCSCustomReports].[v_SheetWashingView] AS
-- WITH MaxLotSizeCTE AS (
--     -- Get the maximum LotSize for each SKUID
--     SELECT 
--         SKUID, 
--         MAX(LotSize) AS MaxLotSize
--     FROM 
--         [PALMS-TKM-DB-UAT].[dbo].[PurchaseLotSize]
--     GROUP BY 
--         SKUID
-- ),
-- SkidData AS (
--     -- Fetch relevant SKU, inventory, and stock data along with max LotSize
--     SELECT 
--         SKU.Model,
--         SKU.SKUCode AS Part,
--         StockBucket.StockBucketCode,
--         SKUStock.BucketQuantityInStorageUOM,
--         MLS.MaxLotSize
--     FROM 
--         [PALMS-TKM-DB-UAT].[dbo].[SKU] AS SKU
--     JOIN 
--         [PALMS-TKM-DB-UAT].[dbo].[SKUInventory] AS SKUInventory 
--         ON SKU.SKUID = SKUInventory.SKUID
--     JOIN 
--         [PALMS-TKM-DB-UAT].[dbo].[SKUCOST] AS SKUCOST 
--         ON SKUInventory.SKUInventoryID = SKUCOST.SKUInventoryID
--     JOIN 
--         [PALMS-TKM-DB-UAT].[dbo].[SKUStock] AS SKUStock 
--         ON SKUCOST.SKUCOSTID = SKUStock.SKUCostID
--     JOIN 
--         [PALMS-TKM-DB-UAT].[dbo].[StockBucket] AS StockBucket 
--         ON SKUStock.StockBucketID = StockBucket.StockBucketID
--     JOIN 
--         MaxLotSizeCTE AS MLS
--         ON SKU.SKUID = MLS.SKUID
--     WHERE 
--         StockBucket.StockBucketCode IN ('OnHand', 'WashingWIP', 'Washed') -- Filter for calculation
-- ),
-- FullSkidCTE AS (
--     -- Calculate total full skids using the max LotSize
--     SELECT 
--         Part,
--         StockBucketCode,
--         SUM(CASE 
--             WHEN BucketQuantityInStorageUOM >= MaxLotSize THEN FLOOR(BucketQuantityInStorageUOM / MaxLotSize) * MaxLotSize 
--             ELSE 0 
--         END) AS TotalFullSkid
--     FROM 
--         SkidData
--     GROUP BY 
--         Part, StockBucketCode
	
	
-- ),
-- PartialSkidCTE AS (
--     -- Calculate total partial skids (remaining quantities)
--     SELECT 
--         Part,
--         StockBucketCode,
--         SUM(CASE 
--             WHEN BucketQuantityInStorageUOM < MaxLotSize THEN BucketQuantityInStorageUOM
--             ELSE BucketQuantityInStorageUOM % MaxLotSize 
--         END) AS TotalPartialSkid
--     FROM 
--         SkidData
--     GROUP BY 
--         Part, StockBucketCode
-- )
-- -- Main SELECT to get the data along with full and partial skid calculations
-- SELECT 
--     SKU.Model AS [Model], 
--     SKU.SKUCode AS [Part],
--     CAST(ISNULL(FS.TotalFullSkid, 0) AS INT) AS [TotalFullSkid], -- Full skids per bucket as integer
--     CAST(ISNULL(PS.TotalPartialSkid, 0) AS INT) AS [TotalPartialSkid], -- Partial skids per bucket as integer
--     CAST(ISNULL(FS.TotalFullSkid, 0) + ISNULL(PS.TotalPartialSkid, 0) AS INT) AS [TotalSkid], -- Sum of Full and Partial skids as integer
--     CAST(SUM(CASE 
--         WHEN StockBucket.StockBucketCode = 'Washed' THEN SKUStock.BucketQuantityInStorageUOM 
--         ELSE 0 
--     END) AS INT) AS [SheetWashed], -- Total washed sheets as integer
--     StockBucket.StockBucketCode AS [BucketCode],
--     CASE
--         WHEN StockBucket.StockBucketCode = 'OnHand' THEN 'Next'
--         WHEN StockBucket.StockBucketCode = 'WashingWIP' THEN 'In Progress'
--         WHEN StockBucket.StockBucketCode = 'Washed' THEN 'Completed'
--         ELSE 'Unknown'
--     END AS [Status] -- Status explanation
-- FROM 
--     [PALMS-TKM-DB-UAT].[dbo].[SKU] AS SKU 
-- JOIN 
--     [PALMS-TKM-DB-UAT].[dbo].[SKUInventory] AS SKUInventory 
--     ON SKU.SKUID = SKUInventory.SKUID 
-- JOIN 
--     [PALMS-TKM-DB-UAT].[dbo].[SKUCOST] AS SKUCOST 
--     ON SKUInventory.SKUInventoryID = SKUCOST.SKUInventoryID 
-- JOIN 
--     [PALMS-TKM-DB-UAT].[dbo].[SKUStock] AS SKUStock 
--     ON SKUCOST.SKUCOSTID = SKUStock.SKUCostID -- Join SKUStock with SKUCOST
-- JOIN 
--     [PALMS-TKM-DB-UAT].[dbo].[StockBucket] AS StockBucket 
--     ON SKUStock.StockBucketID = StockBucket.StockBucketID 
-- LEFT JOIN 
--     FullSkidCTE AS FS 
--     ON FS.Part = SKU.SKUCode
--     AND FS.StockBucketCode = StockBucket.StockBucketCode
-- LEFT JOIN 
--     PartialSkidCTE AS PS 
--     ON PS.Part = SKU.SKUCode
--     AND PS.StockBucketCode = StockBucket.StockBucketCode
-- JOIN 
--     [PALMS-TKM-DB-UAT].[SSPCSdbo].[BOMTypeMaster] AS BOMTypeMaster 
--     ON SKU.SKUCode COLLATE SQL_Latin1_General_CP1_CI_AS = BOMTypeMaster.DieSet COLLATE SQL_Latin1_General_CP1_CI_AS -- Joining BOMTypeMaster on SKUCode
-- JOIN 
--     [PALMS-TKM-DB-UAT].[SSPCSdbo].[PatternActualData] AS PatternActualData 
--     ON PatternActualData.DieSetID = BOMTypeMaster.DieSetID -- Joining PatternActualData on DieSetID
-- WHERE 
--     StockBucket.StockBucketCode IN ( 'OnHand', 'WashingWIP', 'Washed') AND
--     CAST(PatternActualData.Date AS DATE) = CAST(GETDATE() AS DATE) -- Filter for current date
-- GROUP BY 
--     SKU.Model, SKU.SKUCode, StockBucket.StockBucketCode, FS.TotalFullSkid, PS.TotalPartialSkid
-- GO


-- USE [PALMS-TKM-DB-UAT]
-- GO

-- /****** Object:  View [SSPCSCustomReports].[v_ProductMaterialProductionView]    Script Date: 30-10-2024 12:39:15 ******/
-- DROP VIEW [SSPCSCustomReports].[v_MaterialLoadingView]

-- GO

-- /****** Object:  View [SSPCSCustomReports].[v_ProductMaterialProductionView]    Script Date: 30-10-2024 12:39:15 ******/
-- SET ANSI_NULLS ON
-- GO

-- SET QUOTED_IDENTIFIER ON
-- GO


-- ---- Create the view

-- CREATE VIEW [SSPCSCustomReports].[v_MaterialLoadingView] AS

-- SELECT 

--     SKU.Model AS [MODEL],  -- Select the model of the product

--     SKU.SKUCode AS [MATERIAL],  -- Select the SKU code of the product
 
--     -- Sum quantities for Finished Material (F/M) and Raw Material (R/M), cast as integer

--     CAST(SUM(CASE 
--         WHEN StockBucket.StockBucketCode = 'AwaitingPress' THEN SKUStock.BucketQuantityInStorageUOM  -- R/M
--         WHEN StockBucket.StockBucketCode = 'OnHand' THEN SKUStock.BucketQuantityInStorageUOM  -- F/M
--         ELSE 0  -- Count as 0 for any other stock bucket
--     END) AS INT) AS Total,  -- Total for Finished Materials and Raw Materials as integer
 
--     -- Sum quantities for Washed materials, cast as integer

--     CAST(SUM(CASE 
--         WHEN StockBucket.StockBucketCode = 'Washed' THEN SKUStock.BucketQuantityInStorageUOM  -- S/W
--         ELSE 0  -- Count as 0 for any other stock bucket
--     END) AS INT) AS SheetWashing , -- Total for Washed materials as integer
 
-- 	ENUMERATION.EnumerationName AS ProductionStatus,

-- 	PatternActualData.Status,

-- 	-- Determine the next status based on the current status
-- 	CASE 
-- 		WHEN PatternActualData.Status IN (1, 2, 7) THEN 'Next'  -- 'To be Scheduled', 'Queued', 'Planned'
-- 		WHEN PatternActualData.Status = 4 THEN 'In Progress'  -- 'In Progress'
-- 		WHEN PatternActualData.Status = 6 THEN 'Completed'  -- 'Completed'
-- 		ELSE 'Unknown'  -- Default for other statuses
-- 	END AS NextStatus
 
-- FROM 

--     [PALMS-TKM-DB-UAT].[dbo].[SKU] AS SKU  -- Starting from the SKU table

-- JOIN 

--     [PALMS-TKM-DB-UAT].[dbo].[SKUInventory] AS SKUInventory ON SKU.SKUID = SKUInventory.SKUID  -- Joining SKUInventory table

-- JOIN 

--     [PALMS-TKM-DB-UAT].[dbo].[SKUCOST] AS SKUCOST ON SKUInventory.SKUInventoryID = SKUCOST.SKUInventoryID  -- Joining SKUCOST table

-- JOIN 

--     [PALMS-TKM-DB-UAT].[dbo].[SKUStock] AS SKUStock ON SKUCOST.SKUCOSTID = SKUStock.SKUCostID  -- Joining SKUStock table

-- JOIN 

--     [PALMS-TKM-DB-UAT].[dbo].[StockBucket] AS StockBucket ON SKUStock.StockBucketID = StockBucket.StockBucketID  -- Joining StockBucket table

-- JOIN 

--     [PALMS-TKM-DB-UAT].[SSPCSdbo].[BOMTypeMaster] AS BOMTypeMaster ON SKU.SKUCode COLLATE SQL_Latin1_General_CP1_CI_AS = BOMTypeMaster.DieSet COLLATE SQL_Latin1_General_CP1_CI_AS  -- Joining BOMTypeMaster on SKUCode

-- JOIN 

--     [PALMS-TKM-DB-UAT].[SSPCSdbo].[PatternActualData] AS PatternActualData ON PatternActualData.DieSetID = BOMTypeMaster.DieSetID  -- Joining PatternActualData on DieSetID

-- LEFT JOIN

--      [PALMS-TKM-DB-UAT].[dbo].[Enumeration] AS ENUMERATION ON
-- 	 PatternActualData.Status = ENUMERATION.EnumerationValue
-- 	 AND EnumerationType = 'ActionTypeML'

-- WHERE 

--     StockBucket.StockBucketCode IN ('AwaitingPress', 'OnHand', 'Washed')  -- Filtering for specific stock buckets

--     AND PatternActualData.Date = CONVERT(DATE, GETDATE())  -- Filtering for today's date

-- GROUP BY 

--     SKU.Model, SKU.SKUCode,
-- 	ENUMERATION.EnumerationName,
-- 	PatternActualData.Status;  -- Grouping results by model and SKU code

-- GO


BEGIN TRY
    BEGIN TRANSACTION;

    -- Check if the view already exists
    IF NOT EXISTS (SELECT * FROM sys.views WHERE schema_id = SCHEMA_ID(N'SSPCSCustomReports') AND name = N'v_MaterialLoadingView')
    BEGIN
        -- Create the view
        EXEC('
            CREATE VIEW [SSPCSCustomReports].[v_MaterialLoadingView] AS
            SELECT
                SKU.Model AS [MODEL],  -- Select the model of the product
                SKU.SKUCode AS [MATERIAL],  -- Select the SKU code of the product
                CAST(SUM(CASE
                    WHEN StockBucket.StockBucketCode = ''AwaitingPress'' THEN SKUStock.BucketQuantityInStorageUOM  -- R/M
                    WHEN StockBucket.StockBucketCode = ''OnHand'' THEN SKUStock.BucketQuantityInStorageUOM  -- F/M
                    ELSE 0  -- Count as 0 for any other stock bucket
                END) AS INT) AS Total,  -- Total for Finished Materials and Raw Materials as integer
                CAST(SUM(CASE
                    WHEN StockBucket.StockBucketCode = ''Washed'' THEN SKUStock.BucketQuantityInStorageUOM  -- S/W
                    ELSE 0  -- Count as 0 for any other stock bucket
                END) AS INT) AS SheetWashing,  -- Total for Washed materials as integer
                ENUMERATION.EnumerationName AS ProductionStatus,
                PatternActualData.Status,
                CASE
                    WHEN PatternActualData.Status IN (1, 2, 7) THEN ''Next''  -- ''To be Scheduled'', ''Queued'', ''Planned''
                    WHEN PatternActualData.Status = 4 THEN ''In Progress''  -- ''In Progress''
                    WHEN PatternActualData.Status = 6 THEN ''Completed''  -- ''Completed''
                    ELSE ''Unknown''  -- Default for other statuses
                END AS NextStatus
            FROM
                [PALMS-TKM-DB-UAT].[dbo].[SKU] AS SKU
            JOIN
                [PALMS-TKM-DB-UAT].[dbo].[SKUInventory] AS SKUInventory ON SKU.SKUID = SKUInventory.SKUID
            JOIN
                [PALMS-TKM-DB-UAT].[dbo].[SKUCOST] AS SKUCOST ON SKUInventory.SKUInventoryID = SKUCOST.SKUInventoryID
            JOIN
                [PALMS-TKM-DB-UAT].[dbo].[SKUStock] AS SKUStock ON SKUCOST.SKUCOSTID = SKUStock.SKUCostID
            JOIN
                [PALMS-TKM-DB-UAT].[dbo].[StockBucket] AS StockBucket ON SKUStock.StockBucketID = StockBucket.StockBucketID
            JOIN
                [PALMS-TKM-DB-UAT].[SSPCSdbo].[BOMTypeMaster] AS BOMTypeMaster ON SKU.SKUCode COLLATE SQL_Latin1_General_CP1_CI_AS = BOMTypeMaster.DieSet COLLATE SQL_Latin1_General_CP1_CI_AS
            JOIN
                [PALMS-TKM-DB-UAT].[SSPCSdbo].[PatternActualData] AS PatternActualData ON PatternActualData.DieSetID = BOMTypeMaster.DieSetID
            LEFT JOIN
                [PALMS-TKM-DB-UAT].[dbo].[Enumeration] AS ENUMERATION ON PatternActualData.Status = ENUMERATION.EnumerationValue
                AND EnumerationType = ''ActionTypeML''
            WHERE
                StockBucket.StockBucketCode IN (''AwaitingPress'', ''OnHand'', ''Washed'')
                AND PatternActualData.Date = CONVERT(DATE, GETDATE())
                AND PatternActualData.Status IN (1, 2, 4, 6, 7)
            GROUP BY
                SKU.Model, SKU.SKUCode,
                ENUMERATION.EnumerationName,
                PatternActualData.Status;
        ');

        -- Insert into ViewScreenMapping table
        INSERT INTO [PALMS-TKM-DB-UAT].[dbo].[ViewScreenMapping]
            ([ViewName], [CreatedBy], [CreatedDate], [ScreenID], [ScreenName], [ViewDisplayName])
        VALUES
            ('SSPCSCustomReports.v_MaterialLoadingView', 1, GETDATE(), 440, NULL, 'MaterialLoadingView');
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    -- Handle errors by rolling back the transaction
    ROLLBACK TRANSACTION;
    -- Raise an error with details
    THROW;
END CATCH;
