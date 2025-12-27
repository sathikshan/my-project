const sql = require('mssql/msnodesqlv8');
const fs = require("fs");
const path = require('path');
const constant = require('../../config/constant');
const logger = require("../../utils/logger");
const reUsableFun = require("../../utils/reUsableFun");
const csv = require('csv-parser');
const { Readable } = require('stream');
const config = require("../../config/dbConfig");

exports.productionDashboard = async (req, res) => {
    let { currentDate, currentTime, line, shift } = req.body;

    // Validate request body parameters
    if (!currentDate || !currentTime || !shift || !line) {
        return res.status(400).send('Please provide currentDate, currentTime, shift, and line');
    }

    try {
        // Get shift name and SKU category (treat skuCategoryCode as line and shiftName as shift)
        const { shiftName, skuCategoryCode } = await reUsableFun.getShiftAndSKUCategory(shift, line, config);
        const { shiftGroupName, shiftCellColor } = await reUsableFun.getShiftGroupName(shift, currentDate, line, config);


        if (shiftName === "N_C") {
            currentDate = await reUsableFun.getAdjustedDateForNightShift(currentDate, currentTime, shift, config);
            console.log("Adjusted Date:", currentDate);
        }

        // Connect to the SQL database
        await sql.connect(config);

        // Fetch current shift data
        const productionRequest = new sql.Request();
        productionRequest.input('currentDate', sql.Date, new Date(currentDate));
        productionRequest.input('currentTime', sql.Time, currentTime);
        productionRequest.input('shift', sql.Int, shift);
        productionRequest.input('line', sql.Int, line);

        const currentShiftQuery = `
            SELECT TOP (1000)
                [DieSetID], [PartSeq], [PatternNo], [PlanStartTime], [PlanEndTime],
                [LoadTime], [DieStorageBay], [PatternLotSize], [RecLotSize], [PlanLotSize],
                [LotNo], [Status], [ActualStartTime], [ActualEndTime], [ActualLoadTime],
                [ActualLotsize], [ActualOrderingTime], [ActualOrderCycleID], [Reason], [PatternActualDataID],[QueuedTime]
            FROM [SSPCSdbo].[PatternActualData]
            WHERE [Date] = @currentDate
                AND [ShiftID] = @shift
                AND [LineID] = @line
            ORDER BY [PartSeq] ASC;
        `;

        const currentShiftResult = await productionRequest.query(currentShiftQuery);


        // Merge previous and current shift data into the grid
        const allRecords = [...currentShiftResult.recordset];
        const grid = [];

        let totalProdOrderRaw = 0;
        let totalProdOrderFinal = 0;
        let totalActualLotRaw = 0;

        for (const record of allRecords) {
            // Additional logic (e.g., BOM type details, row colors, etc.) would go here
            const { bomType: BOMType, dieStorageBay } = await reUsableFun.getBOMTypeDetails(record.DieSetID, config);

            // Calculate pallets
            const qpc = await reUsableFun.getQPC(BOMType, config);
            if (isNaN(qpc)) {
                logger.customerLogger.error("Qpc not found for DieSet: " + BOMType);
                return res.send("Qpc not found for DieSet: " + BOMType);
            }
            const lotSize = record.PatternLotSize || 0;
            const pallets = Math.floor(record.PlanLotSize / qpc);
            const ptnPallets = Math.floor(record.PatternLotSize / qpc);
            const recPallets = Math.floor(record.RecLotSize / qpc);

            // Fetch child part (similar to the nextShiftDetails method)
            const kitItemIDRequest = new sql.Request(); // New request for each query
            const kitItemIDQuery = `
                SELECT [KitItemID], [PerUnitQuantity]
                FROM [dbo].[KitBOM]
                WHERE [BOMType] = @bomType
            `;
            const kitItemIDResult = await kitItemIDRequest
                .input('bomType', sql.VarChar, BOMType)
                .query(kitItemIDQuery);

            for (const kitItem of kitItemIDResult.recordset) {
                const skuRequest = new sql.Request(); // Another new request
                const skuQuery = `
                    SELECT [SKUCode]
                    FROM [dbo].[SKU]
                    WHERE [SKUID] = @kitItemID
                `;
                const skuResult = await skuRequest
                    .input('kitItemID', sql.Int, kitItem.KitItemID)
                    .query(skuQuery);

                const childPart = skuResult.recordset[0]?.SKUCode || 'Unknown SKUCode';

                const { rowColor, statusTextColor, statusTextBgColor } = await reUsableFun.getRowColorsByStatus(record.Status, config);

                const loadTime = record.LoadTime
                    ? Math.floor(record.LoadTime / 60) // Convert seconds to minutes, round down
                    : 0;

                // Fetch recLotSize and prodOrder from PlanLotsizeCalculation
                const planLotSizeRequest = new sql.Request();
                const planLotSizeQuery = `
                    SELECT [RecomendedOrder], [ProductionOrder], [ActualLotSize]
                    FROM [SSPCSdbo].[PlanLotsizeCalculation]
                    WHERE [kitItemId] = @kitItemId AND [PatternActualDataID] = @patternActualDataID
                `;
                const planLotSizeResult = await planLotSizeRequest
                    .input('kitItemId', sql.Int, kitItem.KitItemID)
                    .input('patternActualDataID', sql.Int, record.PatternActualDataID)
                    .query(planLotSizeQuery);

                const recLotSize = planLotSizeResult.recordset[0]?.RecomendedOrder || 0;
                const prodOrder = planLotSizeResult.recordset[0]?.ProductionOrder || 0;
                const actualLotSize = planLotSizeResult.recordset[0]?.ActualLotSize || 0;

                // Calculate the floor of recLotSize and prodOrder divided by qpc
                const recLotSizeFinal = Math.floor(recLotSize / qpc);
                const prodOrderFinal = Math.floor(prodOrder / qpc);

                let ptnLotSize = `${ptnPallets}(${record.PatternLotSize})`;
                let recLotSizeStr = `${recPallets}(${record.RecLotSize})`;
                if (record.PlanType === 2) {
                    ptnLotSize = '-';
                    recLotSizeStr = '-';
                }
                const actualStatus = record.Status;
                const actualLoadTime = record.ActualLoadTime ? Math.floor(record.ActualLoadTime / 60) : 0;

                const plannedLineStopsQuery = `
                SELECT
                    PlannedLineStopMaster.LineID,
                    PlannedLineStopMaster.ShiftID,
                    PlannedLineStopMaster.FromDateTime,
                    PlannedLineStopMaster.ToDateTime,
                    PlannedLineStopMaster.Reason,
                    CAST(PatternActualData.Date AS DATETIME) + CAST(PatternActualData.PlanStartTime AS DATETIME) AS StartDateTime,
                    CAST(PatternActualData.Date AS DATETIME) + CAST(PatternActualData.PlanEndTime AS DATETIME) AS EndDateTime
                FROM [SSPCSdbo].[PlannedLineStopMaster]
                JOIN [SSPCSdbo].[PatternActualData]
                    ON PlannedLineStopMaster.LineID = PatternActualData.LineID
                JOIN [SSPCSdbo].[BOMTypeMaster]
                    ON PatternActualData.DieSetID = BOMTypeMaster.DieSetID
                WHERE
                    BOMTypeMaster.DieSet = @dieSet
                    AND PlannedLineStopMaster.LineID = (SELECT SKUCategoryID FROM [dbo].[SKUCategory] WHERE SKUCategoryCode = @skuCategoryCode)
                    AND CAST(PatternActualData.Date AS DATE) = CAST(GETDATE() AS DATE)
                    AND CAST(PatternActualData.Date AS DATETIME) + CAST(PatternActualData.PlanStartTime AS DATETIME) <= PlannedLineStopMaster.FromDateTime
                    AND CAST(PatternActualData.Date AS DATETIME) + CAST(PatternActualData.PlanEndTime AS DATETIME) >= PlannedLineStopMaster.FromDateTime;
            `;

                const plannedLineRequest = new sql.Request(); // Create a new request object
                const plannedLineResult = await plannedLineRequest
                    .input("dieSet", sql.VarChar, BOMType)
                    .input("skuCategoryCode", sql.VarChar, skuCategoryCode)
                    .query(plannedLineStopsQuery);

                const plannedLineStops = plannedLineResult.recordset;
                const linestop = plannedLineStops.map(record => {
                    const formattedFromDateTime = new Date(record.FromDateTime).toISOString().split('T')[1].split('.')[0]; // HH:mm:ss
                    const formattedToDateTime = new Date(record.ToDateTime).toISOString().split('T')[1].split('.')[0]; // HH:mm:ss

                    return `${formattedFromDateTime} - ${formattedToDateTime} Reason: ${record.Reason}`;
                });


                const deviationUnits = (prodOrder || 0) - (actualLotSize || 0);
                const deviationPallets = Math.floor(deviationUnits / qpc);
                const deviation = `${deviationPallets}(${deviationUnits})`;



                // Accumulate totals for grid2 summary:
                if (Number(actualStatus) === 5 || Number(actualStatus) === 6) {
                    totalProdOrderRaw += prodOrder;
                    totalProdOrderFinal += Math.floor(prodOrder / qpc);
                }
                if (Number(actualStatus) === 5 || Number(actualStatus) === 6) {
                    totalActualLotRaw += actualLotSize;
                }

                grid.push({
                    ptns: record.PatternNo || "-",
                    seq: record.PartSeq || "NA",
                    planStartAndEnd: record.PlanStartTime === null && record.PlanEndTime === null ? "0-0" : `${record.PlanStartTime} - ${record.PlanEndTime}`,
                    loadTime: loadTime,
                    dieSet: BOMType || "Unknown BOMType",
                    ptnLotSize,
                    childPart: childPart,
                    recLotSize: `${recLotSizeFinal}(${recLotSize})`, // Use the calculated recLotSize here
                    prodOrder: `${prodOrderFinal}(${prodOrder})`, // Use the calculated prodOrder here
                    planLotSize: `${pallets}(${record.PlanLotSize})`,
                    status: reUsableFun.ActionTypesReverse[actualStatus] || "NA",
                    lotNo: record.LotNo || "NA",
                    actualLotSize: actualLotSize || "NA",
                    actualStartAndEnd: record.ActualStartTime ? `${record.ActualStartTime} - ${record.ActualEndTime || "--:--:--"}` : "NA",
                    actualLoadTime: actualLoadTime || "NA",
                    rowColor,
                    statusTextColor,
                    statusTextBgColor,
                    delay: record.ActualLoadTime ? actualLoadTime - loadTime : "NA",
                    queuedTime: record.QueuedTime || "NA",
                    plannedlineStop: linestop.join(', ') || "---",
                    reason: record.Reason || "--:--:--",
                    deviation: deviation
                });

            }
        }


        grid.push({
            ptns: "Total",
            seq: "",
            planStartAndEnd: '',
            loadTime: '',
            dieSet: '',
            ptnLotSize: '',
            childPart: '',
            recLotSize: '', // Use the calculated recLotSize here
            prodOrder: `${totalProdOrderFinal}(${totalProdOrderRaw})`, // Use the calculated prodOrder here
            planLotSize: '',
            status: '',
            lotNo: '',
            actualLotSize: totalActualLotRaw || 0,
            actualStartAndEnd: '',
            actualLoadTime: '',
            rowColor: '#bdb1ae',
            statusTextColor: '#000000',
            statusTextBgColor: '',
            delay: '',
            queuedTime: '',
            plannedlineStop: '',
            reason: '',
            deviation: ''
        });
        // Create the response
        res.json({
            header: {
                currentDate,
                currentTime,
                shift: shiftName,
                line: skuCategoryCode,
                lineID: line,
                shiftGroup: shiftGroupName,
                shiftCellColor: shiftCellColor
            },
            grid
        });

    } catch (error) {
        console.error('Error fetching production dashboard data:', error);
        res.status(500).json({ error: 'An error occurred while fetching production dashboard details' });
    }
};