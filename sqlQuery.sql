IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'SSPCSdbo')
BEGIN
    EXEC ('CREATE SCHEMA SSPCSdbo');
END
 

IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'ShiftChangeoverStockMaster')
BEGIN
    CREATE TABLE SSPCSdbo.ShiftChangeoverStockMaster (
        ChangeoverID INT PRIMARY KEY IDENTITY(1,1),
        LineName NVARCHAR(50) NOT NULL, 
        DieSet NVARCHAR(50) NOT NULL, 
        Variant NVARCHAR(50) NOT NULL,        
        ShiftChangeoverKanbans INT NULL,
        FromDate DATE NULL,                    
        FromShift NVARCHAR(25) NULL,              
        ToDate DATE NOT NULL,                      
        ToShift NVARCHAR(25) NOT NULL,
        ReferenceFileName NVARCHAR(150) NOT NULL,              
        CreatedBy INT NOT NULL,
        CreatedDateTime DATETIME NOT NULL,
        ModifiedBy INT NULL,
        ModifiedDateTime DATETIME NULL
    );
END
 
-- Create OrderCycleMaster Table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'OrderCycleMaster')
BEGIN
    CREATE TABLE SSPCSdbo.OrderCycleMaster (
        OrderCycleID INT PRIMARY KEY IDENTITY(1,1),
        OrderCycle NVARCHAR(25) NOT NULL,
        LineName NVARCHAR(50) NOT NULL ,
        ShiftID INT NOT NULL,     
        StartTime NVARCHAR(8) NOT NULL,      
        EndTime NVARCHAR(8) NOT NULL,
        ReferenceFileName NVARCHAR(150) Not Null,
        CreatedBy INT NOT NULL,
        CreatedDateTime DATETIME NOT NULL,
        ModifiedBy INT  NULL,
        ModifiedDateTime DATETIME  NULL
    );
END
 
 
-- Create LineEfficiencyMaster Table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'LineEfficencyMaster')
BEGIN
    CREATE TABLE SSPCSdbo.LineEfficencyMaster (
        LineID INT PRIMARY KEY,
        LineName NVARCHAR(50) NOT NULL UNIQUE,    
        Efficiency DECIMAL(10,2) NOT NULL,
        ReferenceFileName NVARCHAR(150) NOT NULL,
        CreatedBy INT NULL,
        CreatedDateTime DATETIME NULL,
        ModifiedBy INT NULL,
        ModifiedDateTime DATETIME NULL
    );
END
 
 
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'PQDataUpload')
BEGIN
    CREATE TABLE SSPCSdbo.PQDataUpload (
        PQDataID INT PRIMARY KEY IDENTITY(1,1),
        LineName NVARCHAR(50) NOT NULL, 
        EffectiveFrom DATE NOT NULL,
        EffectiveTo DATE NULL,
        DieSet NVARCHAR(50) NOT NULL,  
        Variant NVARCHAR(50) NULL,  
        PerDayVolume INT NOT NULL,
        NoOfWeldWorkingSecPerDay INT NOT NULL,
        NoOfSecOfSafetyStock INT NOT NULL,
        FLVTLotSize INT NOT NULL,
        TotalPartKanbansInCirculation INT NOT NULL,
        TotalFLVTMaterialKanbanInCirculation INT NOT NULL,
        PullRatePerSec DECIMAL(10,5) NOT NULL,
        SafetyStock DECIMAL(10,5) NOT NULL,
        RoundUpSafetyStock INT NOT NULL,
        SPS DECIMAL(10,5) NOT NULL,
        ReferenceFileName NVARCHAR(150) NOT NULL,  
        CreatedBy NVARCHAR(50) NULL,  
        CreatedDateTime DATETIME NULL,
        ModifiedBy NVARCHAR(50) NULL,  
        ModifiedDateTime DATETIME NULL
    );
END
 
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'PlannedLineStopMaster')
BEGIN
    CREATE TABLE SSPCSdbo.PlannedLineStopMaster (
        LineStopID INT PRIMARY KEY IDENTITY(1,1),
        LineID INT NOT NULL,
        ShiftID INT NOT NULL,
        FromDateTime DATETIME NOT NULL,
        ToDateTime DATETIME NOT NULL,
        Reason NVARCHAR(200) NOT NULL,
        isActive BIT NOT NULL,
        ReferenceFileName NVARCHAR(150) NOT NULL,
        CreatedBy INT NULL,
        CreatedDateTime DATETIME NULL,
        ModifiedBy INT NULL,
        ModifiedDateTime DATETIME NULL,
        CONSTRAINT FK_PlannedLineStopMaster_LineEfficencyMaster FOREIGN KEY (LineID)
            REFERENCES SSPCSdbo.LineEfficencyMaster(LineID)
    );
END
 
-- Create PatternRawDataUpload Table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'PatternRawDataUpload')
BEGIN
    CREATE TABLE SSPCSdbo.PatternRawDataUpload (
        PatternUploadID INT PRIMARY KEY IDENTITY(1,1),
        LineName NVARCHAR(50) NOT NULL, 
        PatternNo NVARCHAR(50) NOT NULL,
        PartSeq INT NOT NULL,
        DieSet NVARCHAR(50) NOT NULL,  
        DieStorageBay NVARCHAR(10) NOT NULL,  
        LotCycle INT NOT NULL,
        PatternLotSize INT NOT NULL,
        SPS DECIMAL(10,5) NOT NULL,
        AppendOrOverwrite NVARCHAR(20) NOT NULL,  
        EffectiveFrom DATE NOT NULL,
        EffectiveTo DATE NULL,
        TotalMaterialKanbanInCirculation INT NOT NULL,
        UDTime INT NOT NULL,
        CTTime DECIMAL(10,2) NOT NULL,
        QCTime INT NOT NULL,
        MaterialChangeoverTimePerChangeover DECIMAL(10,2) NOT NULL,
        PalletChangeoverTimePerChangeover DECIMAL(10,2) NOT NULL,
        SDTime INT NOT NULL,
        NoOfPalletPerCycle INT NOT NULL,
        MaterialOrderTriggerInSec INT NOT NULL,
        ProductionTriggerInSec INT NOT NULL,
        Efficiency DECIMAL(10,2) NOT NULL,
        RoundUpKanbanQty INT NULL,
        RoundUpLotSize INT NULL,
        NoOfSkids INT NULL,
        CycleTime DECIMAL(10,5) NOT NULL,
        MaterialChangeTimeInSec INT NULL,
        PalletChangeTimeInSec INT NULL,
        LineProductionTime DECIMAL(10,2) NULL,
        TotalProductionTime DECIMAL(10,2) NULL,
        SDWaitTime DECIMAL(10,2) NULL,
        SDLineProductionTime DECIMAL(10,2) NULL,
        EfficiencyPT DECIMAL(10,2) NULL,
        GSPS DECIMAL(10,5) NULL,
        ReferenceFileName VARCHAR(150) NULL,  
        CreatedBy INT NULL,  
        CreatedDateTime DATETIME NULL,
        ModifiedBy INT NULL,  
        ModifiedDateTime DATETIME NULL
    );
END
 
 
-- Create PatternDataInterpretation Table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'PatternDataInterpretation')
BEGIN
    CREATE TABLE SSPCSdbo.PatternDataInterpretation (
        PatternInterpretationID INT PRIMARY KEY IDENTITY(1,1),
        PatternUploadID INT NOT NULL,
        ScheduledDate DATE NOT NULL,
        LineID INT NOT NULL,
        ShiftID INT NOT NULL,
        PatternNo NVARCHAR(50) NOT NULL,  
        PartSeq INT NOT NULL,
        DieSetID INT NOT NULL,
        PatternStartTime NVARCHAR(8) NULL,  
        PatternEndTime NVARCHAR(8) NULL,
        PatternLoadTime INT NULL,
        ProjectedOrderingTime DATETIME NULL,
        ProjectedOrderCycleID INT NULL,
        CreatedBy INT NULL,  
        CreatedDateTime DATETIME NULL,
        ModifiedBy INT NULL,  
        ModifiedDateTime DATETIME NULL,
        CONSTRAINT FK_PatternDataInterpretation_PatternRawDataUpload FOREIGN KEY (PatternUploadID)
            REFERENCES SSPCSdbo.PatternRawDataUpload(PatternUploadID),
        CONSTRAINT FK_PatternDataInterpretation_LineEfficencyMaster FOREIGN KEY (LineID)
            REFERENCES SSPCSdbo.LineEfficencyMaster(LineID)
    );
END
 
 
-- Create SKUMaster Table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'SKUMaster')
BEGIN
    CREATE TABLE SSPCSdbo.SKUMaster (
        SKUID INT PRIMARY KEY,
        SKUName NVARCHAR(50) NOT NULL,
        SKUCode NVARCHAR(50) NOT NULL UNIQUE,
        ISSheetWashRequired BIT NOT NULL,
        ReferenceFileName NVARCHAR(150) NOT NULL,
        CreatedBy INT NULL,
        CreatedDateTime DATETIME NULL,
        ModifiedBy INT NULL,
        ModifiedDateTime DATETIME NULL
    );
END
 
 
-- Create BOMTypeMaster Table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'BOMTypeMaster')
BEGIN
    CREATE TABLE SSPCSdbo.BOMTypeMaster (
        DieSetID INT PRIMARY KEY NOT NULL IDENTITY(1,1),
        DieSet NVARCHAR(300) NOT NULL,
        DieID INT NULL,
        NoOfProcess INT NULL,
        UDTime INT NULL,
        CTTime DECIMAL(10,2) NULL,
        QCTime INT NULL,
        MaterialChangeoverTimePerChangeOverTime DECIMAL(10,2) NULL,
        PalletChangeoverTimePerChangeover DECIMAL(10,2) NULL,
        DieStorageBay NVARCHAR(10) NOT NULL,
        SDTime INT NULL,
        NoOfPalletPerCycle INT NULL,
        MaterialOrderTriggerInSec INT NULL,
        ProductionTriggerInSec INT NULL,
        MBSpecific BIT NOT NULL,
        ReferenceFileName NVARCHAR(150) NOT NULL,
        CreatedBy INT NULL,
        CreatedDateTime DATETIME NULL,
        ModifiedBy INT NULL,
        ModifiedDateTime DATETIME NULL
    );
END
 
---------- Procurrement Screen
 
-- Create OrderedList Table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'OrderedList')
BEGIN
    CREATE TABLE SSPCSdbo.OrderedList (
        OrderedListID INT PRIMARY KEY IDENTITY(1,1),
        PatternInterpretationID INT NULL,
        DieSetID INT NULL,
        LineID INT NULL,
        OrderCycleID  INT NULL,
        Material NVARCHAR(50) NULL,
        MaterialKanbanInCirculation INT NULL,
        OrderDateAndTime DATETIME NULL,
        CancelledDateAndTime DATETIME NULL,
        PatternLotSize INT NULL,
        PatternStartDateAndTime DATETIME NULL,
        POTriggerSec INT NULL,
        SkidQty INT NULL,
        Status INT NULL,
        RecommQty INT NULL,
        AdjustmentKanbans INT NULL,
        OrderedQty INT NULL,
        Stock INT NULL,
        OnOrder INT NULL,
        KBsReturned INT NULL,
        reasonToCancel NVARCHAR(150) NULL,
        reasonToSkip NVARCHAR(150) NULL,
        CreatedBy INT NULL,  
        CreatedDateTime DATETIME NULL,
        ModifiedBy INT NULL,  
        ModifiedDateTime DATETIME NULL,
        CONSTRAINT FK_OrderedList_BOMTypeMaster FOREIGN KEY (DieSetID)
            REFERENCES SSPCSdbo.BOMTypeMaster(DieSetID),
        CONSTRAINT FK_OrderedList_LineEfficencyMaster FOREIGN KEY (LineID)
            REFERENCES SSPCSdbo.LineEfficencyMaster(LineID),
        CONSTRAINT FK_OrderedList_OrderCycleMaster FOREIGN KEY (OrderCycleID)
            REFERENCES SSPCSdbo.OrderCycleMaster(OrderCycleID)
    );
END
 
-- Create OrderedListCalculations Table if it does not exist
-- IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'OrderedListCalculations')
-- BEGIN
--     CREATE TABLE SSPCSdbo.OrderedListCalculations (
--         OrderedListCalculationsID INT PRIMARY KEY IDENTITY(1,1),
--         KitItemID INT NULL,
--         OrderedListID INT NULL,
--         SkidQty INT NULL,
--         RecommQty INT NULL,
--         AdjustmentKanbans INT NULL,
--         OrderdQty INT NULL,
--         OrderStatus NVARCHAR(50) NULL,
--         CONSTRAINT FK_OrderedListCalculations_OrderedList FOREIGN KEY (OrderedListID)
--             REFERENCES SSPCSdbo.OrderedList(OrderedListID)
--     );
-- END
 
 
-- Create OrderedListCalculationsDetails Table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'OrderedListCalculationsDetails')
BEGIN
    CREATE TABLE SSPCSdbo.OrderedListCalculationsDetails (
        OrderedListCalculationsDetailsID INT PRIMARY KEY IDENTITY(1,1),
        SAPPORefNo NVARCHAR(50) NULL,
        SAPPORefQty INT NULL,
        OrderedListID INT NULL,
        CONSTRAINT FK_OrderedList_OrderedListCalculations FOREIGN KEY(OrderedListID)
         REFERENCES SSPCSdbo.OrderedList(OrderedListID)
    );
END


-- Create the PatternActualData Table without PlanLotsizeCalculationID
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'PatternActualData')
BEGIN
    CREATE TABLE SSPCSdbo.PatternActualData (
        PatternActualDataID INT PRIMARY KEY IDENTITY(1,1),
        PatternInterpretationID INT NULL,
        PatternUploadID INT  NULL,
        DieSetID INT NOT NULL,
        LineID INT NOT NULL,
        ShiftID INT NOT NULL,
        Date DATE NOT NULL,
        PartSeq INT NULL,
        PatternNo NVARCHAR(8) NULL,
        PlanStartTime NVARCHAR(8)  NULL,  
        PlanEndTime NVARCHAR(8)  NULL,  
        LoadTime INT NOT NULL,
        TotalProdTime INT NOT NULL,
        DieStorageBay NVARCHAR(10) NOT NULL,
        PatternLotSize INT NULL,
        RecLotSize INT NULL,
        PlanLotSize INT NULL,
        LotNo NVARCHAR(50) NOT NULL,  
        Status INT NOT NULL,
        QueuedTime NVARCHAR(8) NULL,
        DiscontinuedID INT NULL,
        ActualStartTime NVARCHAR(8) NULL,
        ActualEndTime NVARCHAR(8) NULL,
        ActualLoadTime INT NULL,
        ActualLotsize INT NULL,
        ActualOrderingTime DATETIME NULL,
        ActualOrderCycleID INT NULL,
        PlanType INT NOT NULL,
        Reason NVARCHAR(500) NULL,
        CreatedBy INT NULL,
        CreatedDate DATETIME NULL,
        ModifiedBy INT NULL,
        ModifiedDate DATETIME NULL
        CONSTRAINT FK_PatternActualData_BOMTypeMaster FOREIGN KEY (DieSetID)
            REFERENCES SSPCSdbo.BOMTypeMaster(DieSetID)
    );
END;


IF NOT EXISTS (SELECT * FROM sys.views WHERE schema_id = SCHEMA_ID(N'SSPCSCustomReports') AND name = N'v_ModelWiseReport')
BEGIN
    EXEC('CREATE VIEW [SSPCSCustomReports].[v_ModelWiseReport] AS
    SELECT
        FORMAT(CAST(PAD.[Date] AS DATE), ''yyyy-MM-dd'') AS [Date],
        SH.[ShiftName] AS [Shift],
        LEM.[LineName] AS [Line],
        SKU.[Model] AS [Model],
        BTM.[DieSet] AS [BOMType],
        PAD.[PlanLotSize] AS [PlanLotSize],
        PAD.[ActualLotsize] AS [ActualLotSize],
        CAST(ROUND(CAST(PAD.[LoadTime] AS DECIMAL(10,2)) / 60, 0) AS INT) AS [ProductionTimePlan],
        CAST(ROUND(CAST(PAD.[ActualLoadTime] AS DECIMAL(10,2)) / 60, 0) AS INT) AS [ActualProductionTime]
    FROM
        [SSPCSdbo].[PatternActualData] AS PAD
    LEFT JOIN
        [dbo].[ShiftHeader] AS SH
        ON PAD.ShiftID = SH.ShiftID
    LEFT JOIN
        [SSPCSdbo].[LineEfficencyMaster] AS LEM
        ON PAD.LineID = LEM.LineID
    LEFT JOIN
        [SSPCSdbo].[BOMTypeMaster] AS BTM
        ON PAD.DieSetID = BTM.DieSetID
    LEFT JOIN
        [dbo].[SKU] AS SKU
        ON BTM.DieSet COLLATE SQL_Latin1_General_CP1_CI_AS = SKU.SKUCode COLLATE SQL_Latin1_General_CP1_CI_AS
    WHERE
        PAD.[Status] IS NOT NULL
    GROUP BY
        FORMAT(CAST(PAD.[Date] AS DATE), ''yyyy-MM-dd''),
        SH.[ShiftName],
        LEM.[LineName],
        SKU.[Model],
        BTM.[DieSet],
        PAD.[PlanLotSize],
        PAD.[ActualLotsize],
        PAD.[LoadTime],
        PAD.[ActualLoadTime]')
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[ViewScreenMapping]
               WHERE [ViewName] = 'SSPCSCustomReports.v_ModelWiseReport')
BEGIN
    INSERT INTO [dbo].[ViewScreenMapping]
    ([ViewName], [CreatedBy], [CreatedDate], [ScreenID], [ScreenName], [ViewDisplayName])
    VALUES
    ('SSPCSCustomReports.v_ModelWiseReport', 1, GETDATE(), 440, NULL, 'ModelWiseReport')
END

-- -- Create PlanLotsizeCalculation Table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID(N'SSPCSdbo') AND name = N'PlanLotsizeCalculation')
BEGIN
    CREATE TABLE SSPCSdbo.PlanLotsizeCalculation (
        PlanLotsizeCalculationID INT PRIMARY KEY IDENTITY(1,1),
        PatternActualDataID INT NOT NULL,
        DieSetID INT NULL,
        kitItemId INT NULL,
        RecomendedOrder INT NULL,
        ProductionOrder INT NULL,
        ActualLotSize INT NULL,
        TotalKanbanInCirculation INT NULL,
        Stock INT NULL,
        OnOrder INT NULL,
        KanbanReturned INT NULL,
        Adjustment INT NULL,
        CreatedBy INT NULL,
        CreatedDate DATETIME NULL,
        ModifiedBy INT NULL,
        ModifiedDate DATETIME NULL,
        CONSTRAINT FK_PlanLotsizeCalculation_PatternActualData FOREIGN KEY (PatternActualDataID)
            REFERENCES SSPCSdbo.PatternActualData(PatternActualDataID),
        CONSTRAINT FK_PlanLotsizeCalculation_BOMTypeMaster FOREIGN KEY (DieSetID)
            REFERENCES SSPCSdbo.BOMTypeMaster(DieSetID)
    );
END;



IF NOT EXISTS (SELECT * FROM sys.views WHERE schema_id = SCHEMA_ID(N'SSPCSCustomReports') AND name = N'v_ModelWiseReport')
BEGIN
    EXEC('CREATE VIEW [SSPCSCustomReports].[v_ModelWiseReport] AS
    SELECT
        FORMAT(CAST(PAD.[Date] AS DATE), ''yyyy-MM-dd'') AS [Date],
        SH.[ShiftName] AS [Shift],
        LEM.[LineName] AS [Line],
        SKU.[Model] AS [Model],
        BTM.[DieSet] AS [BOMType],
        PAD.[PlanLotSize] AS [PlanLotSize],
        PAD.[ActualLotsize] AS [ActualLotSize],
        PAD.[LoadTime] AS [ProductionTimePlan],
        PAD.[ActualLoadTime] AS [ActualProductionTime]
    FROM
        [SSPCSdbo].[PatternActualData] AS PAD
    LEFT JOIN
        [dbo].[ShiftHeader] AS SH
        ON PAD.ShiftID = SH.ShiftID
    LEFT JOIN
        [SSPCSdbo].[LineEfficencyMaster] AS LEM
        ON PAD.LineID = LEM.LineID
    LEFT JOIN
        [SSPCSdbo].[BOMTypeMaster] AS BTM
        ON PAD.DieSetID = BTM.DieSetID
    LEFT JOIN
        [dbo].[SKU] AS SKU
        ON BTM.DieSet COLLATE SQL_Latin1_General_CP1_CI_AS = SKU.SKUCode COLLATE SQL_Latin1_General_CP1_CI_AS
    WHERE
        PAD.[Status] IS NOT NULL
    GROUP BY
        FORMAT(CAST(PAD.[Date] AS DATE), ''yyyy-MM-dd''),
        SH.[ShiftName],
        LEM.[LineName],
        SKU.[Model],
        BTM.[DieSet],
        PAD.[PlanLotSize],
        PAD.[ActualLotsize],
        PAD.[LoadTime],
        PAD.[ActualLoadTime]')
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[ViewScreenMapping]
               WHERE [ViewName] = 'SSPCSCustomReports.v_ModelWiseReport')
BEGIN
    INSERT INTO [dbo].[ViewScreenMapping]
    ( [ViewName], [CreatedBy], [CreatedDate], [ScreenID], [ScreenName], [ViewDisplayName])
    VALUES
    ('SSPCSCustomReports.v_ModelWiseReport', 1, GETDATE(), 440, NULL, 'ModelWiseReport')
END




