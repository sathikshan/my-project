const sql = require('mssql/msnodesqlv8');
const constant = require('../../config/constant');
const logger = require("../../utils/logger");
const reUsableFun = require("../../utils/reUsableFun");
const config = require("../../config/dbConfig");
const { error } = require('winston');
const { NVarChar } = require('msnodesqlv8');
const status = {
    ToBeOrdered: constant.ToBeOrderedMP,
    Skipped: constant.SkippedMP,
    Cancelled: constant.CancelledMP,
    Ordered: constant.OrderedMP,
    Received: constant.ReceivedMP
}

exports.getLineOrderCycleOptions = async (req, res) => {
    const { LineId } = req.body;
    const pool = await sql.connect(config);
    try {
        let date = new Date(), ShiftStartDateAndTime, ShiftEndDateAndTime, shiftStart, shiftEnd;
        const hour = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const Sec = String(date.getSeconds()).padStart(2, '0');
        if (Number(hour) * 60 + Number(minutes) < 345) {
            date = date.setDate(date.getDate() - 1);
        }
        date = new Date(date);

        let DateAndTimeStr = reUsableFun.getFormattedSeperateDateAndTime(date);
        let getCurrentShiftDetails = await reUsableFun.getCurrentShiftDetails(DateAndTimeStr.timeStr, LineId, config);
        if (reUsableFun.getTimeStringToSec(getCurrentShiftDetails.ShiftStartTime) > reUsableFun.getTimeStringToSec(getCurrentShiftDetails.ShiftEndTime)) {
            let nextWorkingDate = new Date(date);
            nextWorkingDate = nextWorkingDate.setDate(nextWorkingDate.getDate() + 1)
            let nextWorkingDay = await reUsableFun.getNextWorkngDay(nextWorkingDate, getCurrentShiftDetails.LineName, config);
            ShiftStartDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftStartTime;
            ShiftEndDateAndTime = nextWorkingDay + " " + getCurrentShiftDetails.ShiftEndTime;
            shiftStart = getCurrentShiftDetails.ShiftStartTime;
            shiftEnd = getCurrentShiftDetails.ShiftEndTime;
        } else {
            ShiftStartDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftStartTime;
            ShiftEndDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftEndTime;
            shiftStart = getCurrentShiftDetails.ShiftStartTime;
            shiftEnd = getCurrentShiftDetails.ShiftEndTime;
        }

        const lineResult = await pool.request()
            .input("LineId", sql.Int, LineId)
            .input('ShiftStartDateAndTime', sql.NVarChar, ShiftStartDateAndTime)
            .input('ShiftEndDateAndTime', sql.NVarChar, ShiftEndDateAndTime)
            .input('shiftStart', sql.NVarChar, shiftStart)
            .input('shiftEnd', sql.NVarChar, shiftEnd)
            .input('ShiftId', sql.Int, getCurrentShiftDetails.ShiftId)
            .query(`
            select DISTINCT * from SSPCSdbo.OrderCycleMaster where LineName=(select SKUCategoryCode from SKUCategory where SKUCategoryID= @LineId)and ShiftId = @ShiftId
            `);
        const lineOptions = lineResult.recordset.map(row => ({
            id: row.OrderCycleID,
            code: row.OrderCycle + "-" + row.StartTime + "-" + row.EndTime
        }));

        // Return line options for the dropdown
        res.status(200).json(lineOptions);

    } catch (error) {
        console.error('Error fetching order cycle options:', error);
        res.status(500).send('Server error');
    }
}
exports.MaterialToBeOrdered = async (req, res) => {
    let { LineId, OrderCycleID } = req.body;
    const pool = await sql.connect(config);

    try {
        let date = new Date(), ShiftStartDateAndTime, ShiftEndDateAndTime;

        const hour = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const Sec = String(date.getSeconds()).padStart(2, '0');
        if (Number(hour) * 60 + Number(minutes) < 345) {
            date = date.setDate(date.getDate() - 1);
        }
        date = new Date(date);

        let DateAndTimeStr = reUsableFun.getFormattedSeperateDateAndTime(date);
        let getCurrentShiftDetails = await reUsableFun.getCurrentShiftDetails(DateAndTimeStr.timeStr, LineId, config);
        if (reUsableFun.getTimeStringToSec(getCurrentShiftDetails.ShiftStartTime) > reUsableFun.getTimeStringToSec(getCurrentShiftDetails.ShiftEndTime)) {
            let nextWorkingDate = new Date(date);
            nextWorkingDate = nextWorkingDate.setDate(nextWorkingDate.getDate() + 1)
            let nextWorkingDay = await reUsableFun.getNextWorkngDay(nextWorkingDate, getCurrentShiftDetails.LineName, config);
            ShiftStartDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftStartTime;
            ShiftEndDateAndTime = nextWorkingDay + " " + getCurrentShiftDetails.ShiftEndTime;
        } else {
            ShiftStartDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftStartTime;
            ShiftEndDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftEndTime;
        }
        let query = `
        
               IF EXISTS (SELECT 1 FROM Calendar WHERE Date = @dateStr AND Line = ((select  SKUCategoryCode from SKUCategory where SKUCategoryID=@LineId)) and ShiftId=@ShiftId and IsWorking=1)
                            BEGIN
                WITH PtnCTE AS (
    SELECT * 
    FROM SSPCSdbo.PatternDataInterpretation  
    WHERE ProjectedOrderingTime BETWEEN @ShiftStartDateAndTime AND @ShiftEndDateAndTime 
    AND LineID = @LineId and ProjectedOrderCycleID IN (
    SELECT OrderCycleID 
    FROM (
        SELECT @OrderCycle AS OrderCycleID
        WHERE @OrderCycle IS NOT NULL

        UNION

        SELECT DISTINCT OrderCycleID 
        FROM SSPCSdbo.OrderCycleMaster 
        WHERE @OrderCycle IS NULL
        AND LineName = (SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID = @LineId) 
        AND ShiftID = @ShiftId
    ) AS OrderCycleList
)
),
BOMTypeCTE AS (
    SELECT BOM.*, 
        (
            SELECT MIN(PL.LotSize)  
            FROM PurchaseLotSize PL 
            WHERE PL.PurchaseOrderingUOMID IN (
                SELECT UOM.UOMID 
                FROM UOM 
                WHERE UOM.UOMID IN (
                    SELECT PurchaseOrderingUOMID 
                    FROM PurchaseLotSize 
                    WHERE SKUID = (
                        SELECT TOP(1) KitID 
                        FROM KitBOM 
                        WHERE BOMType = BOM.DieSet  
                    )
                ) 
                AND UOM.UOMCode = 'NOS'
            ) 
            AND PL.SKUID = (
                SELECT TOP(1) KitID 
                FROM KitBOM 
                WHERE BOMType = BOM.DieSet 
            )
        ) AS SkidQty,
        (
            SELECT STRING_AGG(SKU.SKUCode, ', ')  
            FROM SKU   
            WHERE SKUID IN (  
                SELECT KitID 
                FROM KitBOM  
                WHERE BOMType = BOM.DieSet 
            )
        ) AS SKUCodes 
    FROM SSPCSdbo.BOMTypeMaster BOM
    INNER JOIN PtnCTE Ptn
    ON BOM.DieSetID = Ptn.DieSetID
)
SELECT DISTINCT 
    Ptn.PatternInterpretationID, 
    Ptn.PatternUploadID, 
    Ptn.ScheduledDate, 
    Ptn.LineID, 
    Ptn.ShiftID, 
    Ptn.PatternStartTime, 
    Ptn.PatternEndTime, 
    Ptn.ProjectedOrderingTime, 
    Ptn.ProjectedOrderCycleID,
    BOM.DieSetID, 
    BOM.DieSet, 
    BOM.MaterialOrderTriggerInSec, 
    PRD.LineName, 
    PRD.RoundUpLotSize, 
    PRD.TotalMaterialKanbanInCirculation,
    BOM.SKUCodes, 
    BOM.SkidQty,
    PRD.EffectiveFrom,
    PRD.EffectiveTo
FROM PtnCTE Ptn 
INNER JOIN BOMTypeCTE BOM
ON Ptn.DieSetID = BOM.DieSetID
INNER JOIN SSPCSdbo.PatternRawDataUpload PRD
ON Ptn.PatternUploadID = PRD.PatternUploadID
ORDER BY Ptn.ScheduledDate, Ptn.PatternStartTime;
                END
                ELSE
                BEGIN

                WITH PtnCTE AS (
                    SELECT * 
                    FROM SSPCSdbo.PatternDataInterpretation  
                    WHERE ProjectedOrderingTime BETWEEN @ShiftStartDateAndTime AND @ShiftEndDateAndTime 
                    AND LineID = 3 and ProjectedOrderCycleID IN (select DISTINCT OrderCycleID from SSPCSdbo.OrderCycleMaster where LineName = (SELECT SKUCategoryCode from  SKUCategory WHERE SKUCategoryID=@LineId) and ShiftID=@ShiftId)
                ),
                BOMTypeCTE AS (
                    SELECT BOM.*, 
                        (
                            SELECT MIN(PL.LotSize)  
                            FROM PurchaseLotSize PL 
                            WHERE PL.PurchaseOrderingUOMID IN (
                                SELECT UOM.UOMID 
                                FROM UOM 
                                WHERE UOM.UOMID IN (
                                    SELECT PurchaseOrderingUOMID 
                                    FROM PurchaseLotSize 
                                    WHERE SKUID = (
                                        SELECT TOP(1) KitID 
                                        FROM KitBOM 
                                        WHERE BOMType = BOM.DieSet  
                                    )
                                ) 
                                AND UOM.UOMCode = 'NOS'
                            ) 
                            AND PL.SKUID = (
                                SELECT TOP(1) KitID 
                                FROM KitBOM 
                                WHERE BOMType = BOM.DieSet 
                            )
                        ) AS SkidQty,
                        (
                            SELECT STRING_AGG(SKU.SKUCode, ', ')  
                            FROM SKU   
                            WHERE SKUID IN (  
                                SELECT KitID 
                                FROM KitBOM  
                                WHERE BOMType = BOM.DieSet 
                            )
                        ) AS SKUCodes 
                    FROM SSPCSdbo.BOMTypeMaster BOM
                    INNER JOIN PtnCTE Ptn
                    ON BOM.DieSetID = Ptn.DieSetID
                )
                SELECT DISTINCT 
                    Ptn.PatternInterpretationID, 
                    Ptn.PatternUploadID, 
                    Ptn.ScheduledDate, 
                    Ptn.LineID, 
                    Ptn.ShiftID, 
                    Ptn.PatternStartTime, 
                    Ptn.PatternEndTime, 
                    Ptn.ProjectedOrderingTime, 
                    Ptn.ProjectedOrderCycleID,
                    BOM.DieSetID, 
                    BOM.DieSet, 
                    BOM.MaterialOrderTriggerInSec, 
                    PRD.LineName, 
                    PRD.RoundUpLotSize, 
                    PRD.TotalMaterialKanbanInCirculation,
                    BOM.SKUCodes, 
                    BOM.SkidQty,
                    PRD.EffectiveFrom,
                    PRD.EffectiveTo
                FROM PtnCTE Ptn 
                INNER JOIN BOMTypeCTE BOM
                ON Ptn.DieSetID = BOM.DieSetID
                INNER JOIN SSPCSdbo.PatternRawDataUpload PRD
                ON Ptn.PatternUploadID = PRD.PatternUploadID
                where 1=0
                ORDER BY Ptn.ScheduledDate, Ptn.PatternStartTime
                END
        `
        // let query = quey1; //  OrderCycleID ? quey2 :
        const lineResult = await pool.request()
            .input("LineId", sql.Int, Number(LineId))
            .input('ShiftStartDateAndTime', sql.NVarChar, ShiftStartDateAndTime)
            .input('ShiftEndDateAndTime', sql.NVarChar, ShiftEndDateAndTime)
            .input('OrderCycle', sql.Int, OrderCycleID)
            .input('ShiftId', sql.Int, getCurrentShiftDetails.ShiftId)
            .input('dateStr', sql.NVarChar, DateAndTimeStr.dateStr + " 00:00:00")
            .query(query);

        let grid = [], recommendationCalculations = [], addOtherMaterial = [];

        await InsertOrUpdateDataToDb(lineResult.recordset, ShiftStartDateAndTime, ShiftEndDateAndTime, LineId, res);
        let orderList = await getOderListDetailsToBeOrdered(ShiftStartDateAndTime, ShiftEndDateAndTime, LineId, OrderCycleID, getCurrentShiftDetails.ShiftId, DateAndTimeStr.dateStr + " 00:00:00");
        ///orderList = await orderList.sort((a,b)=> new Date(b.PatternStartDateAndTime) - new Date(a.PatternStartDateAndTime));
        orderList = OrderCycleID ? await orderList.filter(data => data.OrderCycleID === OrderCycleID) : orderList;
        let shiftStart = new Date(ShiftStartDateAndTime), shiftEnd = new Date(ShiftEndDateAndTime);
        let DieSetList = [], idList = [];
        if (orderList.length > 0) {
            for (let data of orderList) {
                let { stock, onOrderStock, kbsReturnStock } = await getSKUStock(data.Material);
                let createdDateTime = new Date(data.CreatedDateTime);
                createdDateTime = reUsableFun.getUniversalDateFromISTDate(createdDateTime);
                if ([1, 2].includes(data.Status) && shiftStart < createdDateTime && shiftEnd > createdDateTime) {
                    let formatedDateTime = data.PatternStartDateAndTime ? reUsableFun.getFormattedDateAndTime(reUsableFun.getUniversalDateFromISTDate(data.PatternStartDateAndTime)) : data.PatternStartDateAndTime;
                    if (data.Status !== 2) {
                        DieSetList.push(data.DieSet?.trim().toLowerCase());
                    }
                    grid.push({
                        id1: data.OrderedListID,
                        id2: data.PatternInterpretationID,
                        dieSet: data.DieSet,
                        ptnLotSize: data.PatternLotSize,
                        ptnStart: formatedDateTime,
                        poTriggerHr: (data.POTriggerSec / 3600).toFixed(0),
                        material: data.Material,
                        skidQty: data.SkidQty,
                        recQty: data.MaterialKanbanInCirculation - Math.floor((onOrderStock + stock) / data.SkidQty) + "(" + data.SkidQty * (data.MaterialKanbanInCirculation - Math.floor((onOrderStock + stock) / data.SkidQty)) + ")",
                        orderedQty: data.OrderedQty / data.SkidQty + "(" + data.OrderedQty + ")",
                        gapCellColor: "#e9e8eb",
                        gapTextColor: "#000",
                        rowColor: "#bbc4bc",
                        rowHighlightColor: "#29452e",
                        status: Object.keys(status).find(key => status[key] === data.Status) === "ToBeOrdered" ? "To Be Ordered" : Object.keys(status).find(key => status[key] === data.Status),
                        recommQtyValue: data.SkidQty * (data.MaterialKanbanInCirculation - Math.floor((onOrderStock + stock) / data.SkidQty)),
                        orderedQtyValue: data.OrderedQty,
                        adjustmentKanbans: data.AdjustmentKanbans,
                        prevAdjustmentKanbans: data.AdjustmentKanbans,
                        stock: stock,
                        statusTextColorTBO: Object.keys(status).find(key => status[key] === data.Status) === "ToBeOrdered" ? "#3eed6c" : "#e8745d"
                    })
                    if (!idList.includes(data.OrderedListID)) {
                        recommendationCalculations.push(
                            {
                                id: data.OrderedListID,
                                material: data.Material,
                                kanbansInCirculation: data.MaterialKanbanInCirculation + "(" + data.SkidQty * data.MaterialKanbanInCirculation + ")",
                                onOrder: onOrderStock,
                                stock: stock,
                                kanbansReturned: kbsReturnStock,
                                recOrder: data.MaterialKanbanInCirculation - Math.floor((onOrderStock + stock) / data.SkidQty) + "(" + data.SkidQty * (data.MaterialKanbanInCirculation - Math.floor((onOrderStock + stock) / data.SkidQty)) + ")",
                                onOrderQty: onOrderStock
                            }
                        )
                        idList.push(data.OrderedListID);
                    }
                }
            };
        }
        let flvtDetails = await getFLVTDetails(DieSetList, LineId, getCurrentShiftDetails.ShiftId, DateAndTimeStr.dateStr + " 00:00:00", DateAndTimeStr.dateStr);
        addOtherMaterial = await getAddOtherPartsDetails(DieSetList, LineId, getCurrentShiftDetails.ShiftId, DateAndTimeStr.dateStr + " 00:00:00");
        res.send({
            grid: [...new Set(grid)],
            flvtPartsAndPartsBelowSafetyStock: flvtDetails ? flvtDetails : null,
            addOtherMaterial: addOtherMaterial,
            recommendationCalculations: recommendationCalculations,
            header: {
                date: DateAndTimeStr.dateStr,
                line: LineId,
                orderCycle: OrderCycleID
            },
        })
    } catch (err) {
        res.send(err.message);
    }
}

exports.MaterialOrdered = async (req, res) => {
    let { LineId, OrderCycleID } = req.body;
    const pool = await sql.connect(config);
    try {
        let date = new Date(), ShiftStartDateAndTime, ShiftEndDateAndTime;

        const hour = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const Sec = String(date.getSeconds()).padStart(2, '0');
        if (Number(hour) * 60 + Number(minutes) < 345) {
            date = date.setDate(date.getDate() - 1);
        }
        date = new Date(date);

        let DateAndTimeStr = reUsableFun.getFormattedSeperateDateAndTime(date);
        let getCurrentShiftDetails = await reUsableFun.getCurrentShiftDetails(DateAndTimeStr.timeStr, LineId, config);
        if (reUsableFun.getTimeStringToSec(getCurrentShiftDetails.ShiftStartTime) > reUsableFun.getTimeStringToSec(getCurrentShiftDetails.ShiftEndTime)) {
            let nextWorkingDate = new Date(date);
            nextWorkingDate = nextWorkingDate.setDate(nextWorkingDate.getDate() + 1)
            let nextWorkingDay = await reUsableFun.getNextWorkngDay(nextWorkingDate, getCurrentShiftDetails.LineName, config);
            ShiftStartDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftStartTime;
            ShiftEndDateAndTime = nextWorkingDay + " " + getCurrentShiftDetails.ShiftEndTime;
        } else {
            ShiftStartDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftStartTime;
            ShiftEndDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftEndTime;
        }
        let grid = [], sapOrderDetails = [], recommendationCalculations = [], orderedIdList = [];

        let orderList = await getOderListDetailsOrdered(ShiftStartDateAndTime, ShiftEndDateAndTime, LineId, OrderCycleID, getCurrentShiftDetails.ShiftId, DateAndTimeStr.dateStr + " 00:00:00");
        //orderList = await orderList.sort((a,b)=> new Date(b.OrderDateAndTime) - new(Date(a.OrderDateAndTime)));
        if (orderList.length > 0) {
            let shiftStart = new Date(ShiftStartDateAndTime), shiftEnd = new Date(ShiftEndDateAndTime);
            let SapOrderDetails = await getSapOrderDetails();
            for (const data of orderList) {
                let createdDateTime = new Date(data.CreatedDateTime);
                createdDateTime = reUsableFun.getUniversalDateFromISTDate(createdDateTime);
                if ([3, 4].includes(data.Status) && shiftStart < createdDateTime && shiftEnd > createdDateTime) {
                    let formatedDateTime = data.PatternStartDateAndTime ? reUsableFun.getFormattedDateAndTime(reUsableFun.getUniversalDateFromISTDate(data.PatternStartDateAndTime)) : data.PatternStartDateAndTime;
                    let formattedOrderDateTime = reUsableFun.getFormattedDateAndTime(reUsableFun.getUniversalDateFromISTDate(data.OrderDateAndTime));
                    let poDetails = await getPoDetails(data.Material, DateAndTimeStr.dateStr, getCurrentShiftDetails.ShiftStartTime, getCurrentShiftDetails.ShiftEndTime);
                    let sapOrderFilteredData = await SapOrderDetails.filter(el => el.OrderedListID === data.OrderedListID);
                    let sumOfSapDetails = sapOrderFilteredData.length > 0 ? await sapOrderFilteredData.reduce((sum, item) => sum + Number(item.SAPPORefQty), 0) : 0;
                    //let sumOfSapDetails = 0;

                    grid.push({
                        id1: data.OrderedListID,
                        id2: data.PatternInterpretationID,
                        dieSet: data.DieSet,
                        ptnLotSize: data.PatternLotSize,
                        ptnStart: formatedDateTime,
                        poTriggerHr: (data.POTriggerSec / 3600).toFixed(0),
                        material: data.Material,
                        skidQty: data.SkidQty,
                        recQty: data.RecommQty / data.SkidQty + "( " + data.RecommQty + " )",
                        orderDateAndTime: formattedOrderDateTime,
                        adjustmentKanbans: data.AdjustmentKanbans,
                        orderedQty: data.OrderedQty / data.SkidQty + "( " + data.OrderedQty + " )",
                        //gapCellColor: (sumOfSapDetails - data.OrderedQty) > 0 ? "#ffff1a" : "#e8745d",
                        gapTextColor: (sumOfSapDetails - data.OrderedQty) < 0 ? "#ff0000" : (sumOfSapDetails - data.OrderedQty) > 0 ? "#0000ff" : "#008000",
                        statusCellColor: Object.keys(status).find(key => status[key] === data.Status) === "Cancelled" ? "#fff" : sumOfSapDetails === 0 ? "#fff" : "#3c38b5",
                        statusTextColor: Object.keys(status).find(key => status[key] === data.Status) === "Cancelled" ? "#e8745d" : sumOfSapDetails === 0 ? "#000" : "#fff",
                        //statusCellColor: Object.keys(status).find(key => status[key] === data.Status) === "Cancelled" ? "#e8745d" : sumOfSapDetails === 0 ? "fff" : "#3c38b5",
                        //statusTextColor: Object.keys(status).find(key => status[key] === data.Status) === "Cancelled" ? "#000" : sumOfSapDetails === 0 ? "#000" : "#fff",
                        rowColor: "#bbc4bc",
                        rowHighlightColor: "#29452e",
                        status: Object.keys(status).find(key => status[key] === data.Status),
                        gap: (sumOfSapDetails - data.OrderedQty),
                        refPOQty: sumOfSapDetails,//poDetails.poRecList,
                        flag: (sumOfSapDetails - data.OrderedQty) > 0 ? "More" : (sumOfSapDetails - data.OrderedQty) < 0 ? 'Less' : "Ok", //(data.OrderedQty / data.SkidQty) - poDetails.poRecList > 0 ? "Excess" : (data.OrderedQty / data.SkidQty) - poDetails.poRecList < 0 ? "Miss" : "tally",
                        orderedQtyValue: data.OrderedQty,
                        flagTextColor: (sumOfSapDetails - data.OrderedQty) < 0 ? "#ff0000" : (sumOfSapDetails - data.OrderedQty) > 0 ? "#0000ff" : "#008000"
                    })

                    if (sapOrderFilteredData.length > 0) {
                        sapOrderFilteredData.forEach(el => {
                            if (data.OrderedListID === el.OrderedListID) {
                                poDetails.poNoList.push({ refPONo: el.SAPPORefNo, refPOQty: el.SAPPORefQty });
                                sapOrderDetails.push(
                                    {
                                        id: data.OrderedListID,
                                        material: data.Material,
                                        orderedQty: data.OrderedQty / data.SkidQty + "(" + data.OrderedQty + ")",
                                        poNoList: poDetails.poNoList,
                                        refPOQty: el.SAPPORefQty,
                                        gap: sumOfSapDetails - (data.OrderedQty),
                                        gapCellColor: "#e9e8eb",
                                        gapTextColor: "#000",
                                        rowColor: "red",
                                        rowColor: "#fff",
                                        refPONo: el.SAPPORefNo,
                                    }
                                )
                            }
                            else {
                                sapOrderDetails.push(
                                    {
                                        id: data.OrderedListID,
                                        material: data.Material,
                                        orderedQty: data.OrderedQty / data.SkidQty + "( " + data.OrderedQty + " )",
                                        poNoList: poDetails.poNoList,
                                        refPOQty: 0,
                                        gap: sumOfSapDetails - (data.OrderedQty),
                                        gapCellColor: "#e9e8eb",
                                        gapTextColor: "#000",
                                        rowColor: "red",
                                        rowColor: "#fff"
                                    }
                                )
                            }
                            //sumOfSapDetails += el.SAPPORefQty;

                        })

                    } else {
                        sapOrderDetails.push(
                            {
                                id: data.OrderedListID,
                                material: data.Material,
                                orderedQty: data.OrderedQty / data.SkidQty + "( " + data.OrderedQty + " )",
                                poNoList: poDetails.poNoList,
                                refPOQty: 0,
                                gap: sumOfSapDetails - (data.OrderedQty),
                                gapCellColor: "#e9e8eb",
                                gapTextColor: "#000",
                                rowColor: "red",
                                rowColor: "#fff"
                            }
                        )
                    }



                    if (!orderedIdList.includes(data.OrderedListID)) {
                        recommendationCalculations.push(
                            {
                                id: data.OrderedListID,
                                material: data.Material,
                                kanbansInCirculation: data.MaterialKanbanInCirculation + "(" + data.SkidQty * data.MaterialKanbanInCirculation + ")",
                                onOrder: data.OnOrder,
                                stock: data.Stock,
                                kanbansReturned: data.KBsReturned,
                                recOrder: data.RecommQty / data.SkidQty + "(" + data.RecommQty + ")",
                                adjustment: data.AdjustmentKanbans,
                                ordered: data.OrderedQty / data.SkidQty + "(" + data.OrderedQty + ")"
                            }
                        )
                        orderedIdList.push(data.OrderedListID);
                    }
                }
            }
            res.send({
                grid: grid,
                sapOrderDetails: sapOrderDetails,
                recommendationCalculations: [...new Set(recommendationCalculations)],
                header: {
                    date: DateAndTimeStr.dateStr,
                    line: LineId,
                    orderCycle: OrderCycleID
                },
            })
        }
        else {
            return res.send([]);
        }
    } catch (err) {
        res.send(err.message);
    }


}

exports.UpdateMaterialOrderedStatus = async (req, res) => {
    const { OrderedListID, Status, Material, OrderedQty, reason, recommQty, onOrder, kanbansReturned, updateStatus } = req.body;
    const pool = await sql.connect(config);
    let orderDateTime = reUsableFun.getISTDate();
    if (Status === 2) {
        try {
            const result = await pool.request()
                .input("OrderedListID", sql.Int, OrderedListID)
                .input('Status', sql.Int, Status)
                .input("ordereDateTime", sql.DateTime, Status === 4 ? orderDateTime : null)
                .input("reasonToSkip", sql.NVarChar, reason ? reason : "")
                .input('ModifiedBy', sql.Int, 1)
                .input('ModifiedDateTime', sql.DateTime, reUsableFun.getISTDate())
                .input('Material', sql.NVarChar, Material)
                .query(`
              UPDATE SSPCSdbo.OrderedList SET Status=@Status, ModifiedBy=@ModifiedBy, ModifiedDateTime=@ModifiedDateTime,reasonToSkip=@reasonToSkip  where OrderedListID=@OrderedListID AND Status NOT IN (2,3,4) AND Material=@Material;
            `)
            if (result.rowsAffected[0] > 0) {
                return res.send("Material " + Material + " " + Object.keys(status).find(key => status[key] === Status) + " Successfully.");
            } else {
                return res.send("Material " + Material + " is already Skipped!");
            }

        } catch (err) {
            logger.customerLogger.error(err.message);
            return res.send(err.message);
        }
    } else if (Status === 4 && !updateStatus) {
        try {
            const result = await pool.request()
                .input("OrderedListID", sql.Int, OrderedListID)
                .input('Material', sql.NVarChar, Material.trim())// Status=@Status,
                .query(` 
              SELECT * FROM SSPCSdbo.OrderedList  where OrderedListID=@OrderedListID AND  Material=@Material;
            `);

            if (![2, 3, 4, 5].includes(result.recordset[0].Status) && result.recordset[0].OrderDateAndTime === null) {
                await handleMaterialOrderTransaction(req, res);
            } else {
                return res.send([{
                    success: false,
                    message: "Material " + Material + " is already Skipped!"
                }]);
            }

        } catch (err) {
            logger.customerLogger.error(err.message);
            return res.send(err.message);
        }
    } else if (Status === 4 && updateStatus) {
        let { stock, onOrderStock, kbsReturnStock } = await getSKUStock(Material);
        try {
            const result = await pool.request()
                .input("OrderedListID", sql.Int, OrderedListID)
                .input('Status', sql.Int, Status)
                .input("ordereDateTime", sql.DateTime, Status === 4 ? orderDateTime : null)
                .input('ModifiedBy', sql.Int, 1)
                .input('ModifiedDateTime', sql.DateTime, reUsableFun.getISTDate())
                .input('Material', sql.NVarChar, Material)
                .input('OrderedQty', sql.NVarChar, OrderedQty)
                .input('recommQty', sql.NVarChar, recommQty)
                .input('OnOrder', sql.Int, onOrder + OrderedQty) // Status=@Status,
                .input("KBsReturned", sql.Int, kbsReturnStock)
                .query(` 
              UPDATE SSPCSdbo.OrderedList SET Status=@Status, OrderDateAndTime=@ordereDateTime, OnOrder=@OnOrder, RecommQty=@recommQty,ModifiedBy=@ModifiedBy, ModifiedDateTime=@ModifiedDateTime, KBsReturned=@KBsReturned  where OrderedListID=@OrderedListID AND Status NOT IN (2,3,4) AND Material=@Material;
            `)
            if (result.rowsAffected.length > 0) {
                return res.send({
                    success: true,
                    message: "Material " + Material + " " + Object.keys(status).find(key => status[key] === Status) + " Successfully."
                });
            } else {
                return res.send([{
                    success: false,
                    message: "Material " + Material + " is already Skipped!"
                }]);
            }

        } catch (err) {
            logger.customerLogger.error(err.message);
            return res.send([{
                success: false,
                message: err.message
            }]);
        }
    }
}

exports.UpdateMaterialOrderedCancel = async (req, res) => {
    const { OrderedListID, Status, Material, OrderedQty, cancelled, reason } = req.body;
    const pool = await sql.connect(config);
    let ordereDateTime = reUsableFun.getISTDate();
    try {
        if (!cancelled) {
            const result = await pool.request()
                .input("OrderedListID", sql.Int, OrderedListID)
                .input('Material', sql.NVarChar, Material)
                .query(`
              SELECT * FROM SSPCSdbo.OrderedList   WHERE OrderedListID=@OrderedListID AND Status NOT IN (1,2,3) AND Material=@Material;
            `)
            if (result.recordset.length > 0) {
                if (result.recordset[0].Status === status["Ordered"]) {
                    await CancellSkuTransaction(req, res, pool);
                } else {
                    return res.send("Material is already " + Object.keys(status).find(key => status[key] === result.recordset[0].Status) + "!");
                }
            } else {
                return res.send("Material is already cancelled!");
            }
        } else {

            let SKUStock = await getSKUStock(Material);

            const result = await pool.request()
                .input("OrderedListID", sql.Int, OrderedListID)
                .input('Status', sql.Int, Status)
                .input("CancelledDateAndTime", sql.DateTime, ordereDateTime)
                .input("reasonToCancel", sql.NVarChar, reason)
                .input('ModifiedBy', sql.Int, 1)
                .input('ModifiedDateTime', sql.DateTime, reUsableFun.getISTDate())
                .input('Material', sql.NVarChar, Material)
                .input('OnOrder', sql.Int, SKUStock.onOrderStock)
                .input('Stock', sql.Int, SKUStock.stock)
                .input('KanBansRtn', sql.Int, SKUStock.kbsReturnStock)
                .query(`
              UPDATE SSPCSdbo.OrderedList SET Status=@Status, CancelledDateAndTime=@CancelledDateAndTime, OnOrder=@OnOrder, Stock=@Stock, KBsReturned=@KanBansRtn, ModifiedBy=@ModifiedBy, ModifiedDateTime=@ModifiedDateTime, reasonToCancel=@reasonToCancel  where OrderedListID=@OrderedListID AND Status NOT IN (1,2,3) AND Material=@Material;
            `)
            if (result.rowsAffected.length > 0) {
                return res.send("Material " + Material + " successfully cancelled!");
            }
            else {
                return res.send("Something went wrong. Please try again!");
            }
        }

    } catch (err) {
        logger.customerLogger.error(err.message);
        return res.send(err.message);
    }
}

exports.addToOrder = async (req, res) => {
    const { id, DieSet, LineId, OrderCycleID } = req.body;
    const pool = await sql.connect(config);
    let materialExist = [];
    try {
        const shiftDetails = await getCurrentShiftStartANDEndDetails(LineId);
        const result = await pool.request()
            .input('PQDataID', sql.Int, id)
            .input('DieSet', sql.NVarChar, DieSet)
            .input('LineID', sql.Int, LineId)
            .query(`
                WITH pqCTE AS (  SELECT * FROM SSPCSdbo.PQDataUpload WHERE DieSet = @DieSet AND EffectiveFrom = (SELECT TOP(1) EffectiveFrom FROM SSPCSdbo.PQDataUpload WHERE PQDataID = @PQDataID) AND LineName=(SELECT SKUCategoryCode From SKUCategory WHERE SKUCategoryID=@LineID)),
                    lineCTE AS ( SELECT * FROM SKUCategory),
                    BOMTypeCTE AS ( SELECT BOM.*, (
                        SELECT MIN(PL.LotSize) FROM PurchaseLotSize PL WHERE PL.PurchaseOrderingUOMID IN (SELECT UOM.UOMID FROM UOM WHERE UOM.UOMID IN ( SELECT PurchaseOrderingUOMID FROM PurchaseLotSize 
                        WHERE SKUID = ( SELECT TOP(1) KitID FROM KitBOM  WHERE BOMType = BOM.DieSet )) AND UOM.UOMCode = 'NOS' ) 
                        AND PL.SKUID = (SELECT TOP(1) KitID FROM KitBOM WHERE BOMType = BOM.DieSet ) ) AS SkidQty  FROM SSPCSdbo.BOMTypeMaster BOM),
                        skuCodes AS ( SELECT BOM.DieSet AS DieSet, STRING_AGG(SKU.SKUCode, ', ') AS SKUCode 
                        FROM SKU 
                        INNER JOIN KitBOM ON SKU.SKUID = KitBOM.KitID 
                        INNER JOIN BOMTypeCTE BOM ON KitBOM.BOMType = BOM.DieSet
                        GROUP BY BOM.DieSet
                    ),
                    uniqueDieSetCTE AS ( SELECT pq.*, BOM.MaterialOrderTriggerInSec, BOM.DieSetID,line.SKUCategoryID,BOM.SkidQty, ROW_NUMBER() OVER (PARTITION BY pq.DieSet ORDER BY pq.PQDataID) AS row_num FROM pqCTE pq
                        INNER JOIN BOMTypeCTE BOM ON pq.DieSet = BOM.DieSet
                        INNER JOIN lineCTE line ON pq.LineName = line.SKUCategoryCode
                    ),
                    rowDataCTE AS(
					  select DieSet as PtrDieSet,TotalMaterialKanbanInCirculation as PtrMaterialKanbanInCirculation, RoundUpLotSize as ptrLotSize from SSPCSdbo.PatternRawDataUpload where LineName=(select  SKUCategoryCode from SKUCategory where SKUCategoryID=@LineID)
					  and EffectiveFrom=(select top(1) EffectiveFrom from SSPCSdbo.PatternRawDataUpload where LineName=(select  SKUCategoryCode from SKUCategory where SKUCategoryID=@LineID) ORDER BY EffectiveFrom DESC)
					),
                    ptrIntCTE AS(
					  SELECT TOP 1 ScheduledDate as intScheduledDate,PatternStartTime as intPatternStartTime
						FROM SSPCSdbo.PatternDataInterpretation
						WHERE 
							(ScheduledDate > CAST(GETDATE() AS DATE) 
							OR (ScheduledDate = CAST(GETDATE() AS DATE) AND PatternStartTime > CAST(GETDATE() AS TIME))) 
							AND DieSetID = (SELECT DieSetID FROM SSPCSdbo.BOMTypeMaster WHERE DieSet = @DieSet)
							AND LineID = @LineID
						ORDER BY ScheduledDate, PatternStartTime
					)
                    SELECT DISTINCT *, rowd.PtrDieSet, rowd.PtrMaterialKanbanInCirculation, rowd.ptrLotSize, ptrIntCTE.* FROM uniqueDieSetCTE  LEFT JOIN skuCodes ON uniqueDieSetCTE.DieSet = skuCodes.DieSet
					LEFT JOIN rowDataCTE rowd ON skuCodes.DieSet = rowd.PtrDieSet
                    LEFT JOIN ptrIntCTE ON 1=1
                    WHERE row_num = 1
            `);

        for (let data of result.recordset) {
            let SkuCodeArr = data.SKUCode.split(',');
            SkuCodeArr = [...new Set(SkuCodeArr.map(item => item?.trim()))];
            if (data.FLVTLotSize === 0 && (!data?.PtrMaterialKanbanInCirculation || !data.ptrLotSize)) {
                return res.send('The FLVT LotSize for DieSet ' + DieSet + ' is 0 and was not included in the PatternRawdataUpload. Please update the FLVTLotSize in PQDataUpload or upload the PatternRawdataUpload including this DieSet.')
            }
            let MaterialKanbanInCirculation = data.FLVTLotSize === 0 ? data.PtrMaterialKanbanInCirculation[0] : data.TotalFLVTMaterialKanbanInCirculation;
            let LotSize = data.FLVTLotSize === 0 ? data.ptrLotSize[0] : data.FLVTLotSize;
            let formatedDate = data.intScheduledDate ? reUsableFun.getFormattedOnlyDate(data.intScheduledDate[0]) : "";
            let PatternStartDateAndTime = data.intScheduledDate ? formatedDate + " " + data.intPatternStartTime[0] : null;
            PatternStartDateAndTime = PatternStartDateAndTime !== null ? reUsableFun.getIstDateFromUniversalDate(PatternStartDateAndTime) : null;
            for (let part of SkuCodeArr) {
                try {

                    const isMaterialExist = await CheckMaterialExist(part, LineId, shiftDetails.ShiftStartDateAndTime, shiftDetails.ShiftEndDateAndTime, 1, OrderCycleID, config);
                    if (isMaterialExist.length > 0) {
                        materialExist.push(part);

                    } else {

                        let { stock, onOrderStock, kbsReturnStock } = await getSKUStock(part);

                        const insertQuery = `
                        INSERT INTO SSPCSdbo.OrderedList (
                               PatternInterpretationID, DieSetID, LineID, OrderCycleID,Material,MaterialKanbanInCirculation, OrderDateAndTime, PatternLotSize, PatternStartDateAndTime, POTriggerSec,SkidQty,RecommQty,AdjustmentKanbans,OrderedQty,CreatedBy,CreatedDateTime,Status,Stock,OnOrder
                            ) VALUES (
                              @PatternInterpretationID, @DieSetID, @LineID, @OrderCycleID, @Material, @MaterialKanbanInCirculation, @OrderDateAndTime, @PatternLotSize, @PatternStartDateAndTime, @POTriggerSec, @SkidQty,@RecommQty, @AdjustmentKanbans, @OrderedQty, @CreatedBy,@CreatedDateTime,@Status, @Stock, @OnOrder
                            ) 
                    `;

                        await pool.request()
                            .input('PatternInterpretationID', sql.Int, null)
                            .input('LineID', sql.Int, data.SKUCategoryID)
                            .input('DieSetID', sql.Int, data.DieSetID)
                            .input('OrderCycleID', sql.Int, OrderCycleID)
                            .input('Material', sql.NVarChar, part)
                            .input('OrderDateAndTime', sql.DateTime, null)
                            .input('PatternLotSize', sql.Int, LotSize)
                            .input('PatternStartDateAndTime', sql.DateTime, PatternStartDateAndTime)
                            .input('POTriggerSec', sql.Int, data.MaterialOrderTriggerInSec)
                            .input('SkidQty', sql.Int, data.SkidQty)
                            .input('RecommQty', sql.Int, 0)
                            .input('AdjustmentKanbans', sql.Int, 0)
                            .input('OrderedQty', sql.Int, data.SkidQty * (Number(MaterialKanbanInCirculation) - Math.floor((onOrderStock + stock) / data.SkidQty)))
                            .input('CreatedBy', sql.Int, 1)
                            .input('CreatedDateTime', sql.DateTime, reUsableFun.getISTDate())
                            .input('Status', sql.Int, 1)
                            .input('MaterialKanbanInCirculation', sql.Int, MaterialKanbanInCirculation)
                            .input('OnOrder', sql.Int, onOrderStock)
                            .input('Stock', sql.Int, stock)
                            .query(insertQuery);
                    }
                } catch (err) {
                    logger.customerLogger.error(`Error processing SKU ${part}: ${err.message}`);
                    return err.message;
                }
            }
        }
        if (materialExist.length > 0) {
            return res.send('Material: ' + materialExist.join(', ') + ' already exist in the grid, Please reload screen and check!');
        }
        //await transaction.commit();
        res.send("DieSet " + DieSet + " successfully added to the Material Procurement Grid!");
    } catch (error) {
        // await transaction.rollback();
        logger.customerLogger.error(`Transaction failed: ${error.message}`);
        res.send(constant.serverError);
    }
};

exports.UpdateMaterialOrderedQtyAndKanbans = async (req, res) => {
    const { OrderedListID, OrderedQty, AdjustmentKanbans } = req.body;
    const pool = await sql.connect(config);
    let ordereDateTime = reUsableFun.getISTDate();
    try {
        const result = await pool.request()
            .input("OrderedListID", sql.Int, OrderedListID)
            .input('OrderedQty', sql.Int, OrderedQty)
            .input("AdjustmentKanbans", sql.Int, AdjustmentKanbans)
            .input('ModifiedBy', sql.Int, 1)
            .input('ModifiedDateTime', sql.DateTime, reUsableFun.getISTDate())
            .query(`
              UPDATE SSPCSdbo.OrderedList SET OrderedQty=@OrderedQty, AdjustmentKanbans=@AdjustmentKanbans, ModifiedBy=@ModifiedBy, ModifiedDateTime=@ModifiedDateTime  where OrderedListID=@OrderedListID AND Status NOT IN (2,3,4,5);
            `)
        if (result.rowsAffected[0] > 0) {
            return res.send("Material OrderedQty successfully adjusted! ");
        } else {
            return res.send("Material OrderedQty Only can be Adjusted if the Status is ToOrdered!");
        }

    } catch (err) {
        logger.customerLogger.error(err.message);
        return res.send(err.message);
    }
}
exports.addOtherPartsMaterialProcurement = async (req, res) => {
    const { DieSet, OrderedQty, LineID, EffectiveFrom, OrderCycle } = req.body;
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);
    let materialExist = [];
    try {
        await transaction.begin();
        const shiftDetails = await getCurrentShiftStartANDEndDetails(LineID);
        let eff = await reUsableFun.getFormattedOnlyDate(EffectiveFrom);
        const result = await pool.request()
            .input('LineID', sql.Int, LineID)
            .input('DieSet', sql.NVarChar, DieSet)
            .input('EffectiveFrom', sql.Date, eff)
            .query(`
                    with pqCTE AS (
                    select * from SSPCSdbo.PQDataUpload where DieSet=@DieSet and LineName= ( select SKUCategoryCode from SKUCategory where SKUCategoryID=@LineID)
					and EffectiveFrom= @EffectiveFrom
                    ),
                    lineCTE AS ( select * from SKUCategory ),
                    BOMTypeCTE AS ( SELECT BOM.*,
                    (    SELECT MIN(PL.LotSize)  FROM PurchaseLotSize PL WHERE PL.PurchaseOrderingUOMID IN ( SELECT UOM.UOMID FROM UOM WHERE UOM.UOMID IN ( SELECT PurchaseOrderingUOMID FROM PurchaseLotSize 
                    WHERE SKUID = ( SELECT TOP(1) KitID FROM KitBOM WHERE BOMType = BOM.DieSet  ) ) -- Using BOMType from BOMTypeMaster
                        AND UOM.UOMCode = 'NOS' ) 
                        AND PL.SKUID = ( SELECT TOP(1) KitID FROM KitBOM WHERE BOMType = BOM.DieSet ) ) AS SkidQty,
						(
                            SELECT STRING_AGG(SKU.SKUCode, ',') FROM SKU WHERE SKUID IN ( SELECT KitID FROM KitBOM WHERE BOMType = BOM.DieSet )
                        ) AS SKUCodes 
						FROM SSPCSdbo.BOMTypeMaster BOM
                    ),
                    PatternRowCTE AS(
					select  top(1) DieSet,TotalMaterialKanbanInCirculation as PtrMaterialKanbanInCirculation, RoundUpLotSize as ptrLotSize from SSPCSdbo.PatternRawDataUpload where LineName=(select SKUCategoryCode from SKUCategory where SKUCategoryID=@LineID) and DieSet=@DieSet Order by CreatedDateTime desc
					),
                     ptrIntCTE AS(
					  SELECT TOP 1 ScheduledDate as intScheduledDate,PatternStartTime as intPatternStartTime
						FROM SSPCSdbo.PatternDataInterpretation
						WHERE 
							(ScheduledDate > CAST(GETDATE() AS DATE) 
							OR (ScheduledDate = CAST(GETDATE() AS DATE) AND PatternStartTime > CAST(GETDATE() AS TIME))) 
							AND DieSetID = (SELECT DieSetID FROM SSPCSdbo.BOMTypeMaster WHERE DieSet = @DieSet)
							AND LineID = @LineID ORDER BY ScheduledDate, PatternStartTime
					),
					uniqueDieSetCTE AS (
						SELECT pq.*, BOM.MaterialOrderTriggerInSec, BOM.DieSetID, line.SKUCategoryID, BOM.SkidQty,BOM.SKUCodes, ROW_NUMBER() OVER (PARTITION BY pq.DieSet ORDER BY pq.EffectiveFrom DESC) AS row_num, ptr.PtrMaterialKanbanInCirculation, ptr.ptrLotSize, ptrIntCTE.*
						FROM pqCTE pq INNER JOIN BOMTypeCTE BOM ON pq.DieSet = BOM.DieSet 
						INNER JOIN lineCTE line ON pq.LineName = line.SKUCategoryCode
                        LEFT JOIN PatternRowCTE ptr On pq.DieSet=ptr.DieSet
                        LEFT JOIN ptrIntCTE ON 1=1
						)
					SELECT * FROM uniqueDieSetCTE WHERE row_num = 1;
                `);
        result.recordset = [...new Set(result.recordset)];
        for (let data of result.recordset) {
            let skuCodeList = data.SKUCodes.split(',');
            let MaterialKanbanInCirculation = data.FLVTLotSize === 0 ? data.PtrMaterialKanbanInCirculation : data.TotalFLVTMaterialKanbanInCirculation;
            let LotSize = data.FLVTLotSize === 0 ? data.ptrLotSize : data.FLVTLotSize;
            let formatedDate = data.intScheduledDate ? reUsableFun.getFormattedOnlyDate(data.intScheduledDate) : "";
            let PatternStartDateAndTime = data.intScheduledDate ? formatedDate + " " + data.intPatternStartTime : null;
            PatternStartDateAndTime = PatternStartDateAndTime !== null ? reUsableFun.getIstDateFromUniversalDate(PatternStartDateAndTime) : null;
            for (material of skuCodeList) {
                const isMaterialExist = await CheckMaterialExist(material, LineID, shiftDetails.ShiftStartDateAndTime, shiftDetails.ShiftEndDateAndTime, 1, OrderCycle, config);
                if (isMaterialExist.length > 0) {
                    materialExist.push(material);

                } else {
                    let { stock, onOrderStock, kbsReturnStock } = await getSKUStock(material);
                    const insertQuery = `
                            INSERT INTO SSPCSdbo.OrderedList (
                               PatternInterpretationID, DieSetID, LineID, OrderCycleID,Material,MaterialKanbanInCirculation, OrderDateAndTime, PatternLotSize, PatternStartDateAndTime, POTriggerSec,SkidQty,RecommQty,AdjustmentKanbans,OrderedQty,CreatedBy,CreatedDateTime,Status,Stock,OnOrder
                            ) VALUES (
                              @PatternInterpretationID, @DieSetID, @LineID, @OrderCycleID, @Material, @MaterialKanbanInCirculation, @OrderDateAndTime, @PatternLotSize, @PatternStartDateAndTime, @POTriggerSec, @SkidQty,@RecommQty, @AdjustmentKanbans, @OrderedQty, @CreatedBy,@CreatedDateTime,@Status,@Stock,@OnOrder
                            ) 
                        `;
                    pool.request()
                        .input('PatternInterpretationID', sql.Int, null)
                        .input('LineID', sql.Int, data.SKUCategoryID)
                        .input('DieSetID', sql.Int, data.DieSetID)
                        .input('OrderCycleID', sql.Int, OrderCycle)
                        .input('Material', sql.NVarChar, material)
                        .input('OrderDateAndTime', sql.DateTime, null)
                        .input('PatternLotSize', sql.Int, LotSize)
                        .input('PatternStartDateAndTime', sql.DateTime, PatternStartDateAndTime)
                        .input('POTriggerSec', sql.Int, data.MaterialOrderTriggerInSec)
                        .input('SkidQty', sql.Int, data.SkidQty)
                        .input('RecommQty', sql.Int, 0)
                        .input('AdjustmentKanbans', sql.Int, 0)
                        .input('OrderedQty', sql.Int, Math.ceil(OrderedQty / data.SkidQty) * data.SkidQty)
                        .input('CreatedBy', sql.Int, 1)
                        .input('CreatedDateTime', sql.DateTime, reUsableFun.getISTDate())
                        .input('Status', sql.Int, 1)
                        .input('MaterialKanbanInCirculation', sql.Int, MaterialKanbanInCirculation)
                        .input('OnOrder', sql.Int, onOrderStock)
                        .input('Stock', sql.Int, stock)
                        .query(insertQuery);

                }
            }
        }
        if (materialExist.length > 0) {
            return res.send('Material: ' + materialExist.join(', ') + ' already exist in the grid, Please reload screen and check!');
        }
        res.send("DieSet " + DieSet + " successfully added to the Material Procurement Grid!");
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        logger.customerLogger.error(error.message);
        return res.send(constant.serverError)
    }
};

exports.materialSKUTransaction = async (req, res) => {
    const { ProductionOrder, KitID } = req.body;
    try {
        const pool = await sql.connect(config);
        const WarehouseID = 1;
        const PrimaryCompanyID = 1;
        const WarehousePrimaryCompanyID = 1;
        const CostBucketID = 1;

        // Query for stock records
        const customSearchQuery = `SELECT SKUID, SKUCode, SKUCostID, SKUBatchID, LocationID, 
          BucketQuantityInStorageUOM, ShippingModeID, TradeTermID, CustomerID
          FROM SSPCSCustomSearchViews.v_SearchSKUStockCustomSearchView
          WHERE SKUID = @KitID AND StockBucketCode = 'KbsReturned';
          `;

        const customSearchResult = await pool
            .request()
            .input("KitID", sql.Int, KitID)
            .query(customSearchQuery);

        const stockRecords = customSearchResult.recordset;

        const packQuery = `SELECT PackTypeID FROM PackType WHERE PackTypeCategory = 'pack';`;
        const packResult = await pool.request().query(packQuery);
        const pack = packResult.recordset[0]?.PackTypeID;

        // Sum AvailableQuantityInStorageUOM for all records
        const availableQuantity = stockRecords.reduce(
            (sum, record) => sum + record.BucketQuantityInStorageUOM,
            0
        );

        let transactionTypeCode = "PurchaseOrderCreation";

        const transactionTypeQuery = `
        SELECT TransactionTypeID
        FROM [dbo].[TransactionType]
        WHERE TransactionTypeCode = @TransactionTypeCode;
      `;
        const transactionTypeResult = await pool
            .request()
            .input("TransactionTypeCode", sql.VarChar, transactionTypeCode)
            .query(transactionTypeQuery);

        const TransactionTypeID =
            transactionTypeResult.recordset[0]?.TransactionTypeID;

        const response = {
            WarehouseID,
            PrimaryCompanyID,
            WarehousePrimaryCompanyID,
            CostBucketID,
            SKUCode: stockRecords[0].SKUCode,
            SKUBatchID: null, // stockRecords[0].SKUBatchID,
            InvoicedSKUCostID: stockRecords[0].SKUCostID,
            FromLocationID: stockRecords[0].LocationID,
            StockTransferQuantityInStorageUOM: ProductionOrder,
            TransactionTypeOrderToLineID: TransactionTypeID,
            AvailableQuantityInStorageUOM: ProductionOrder,
            transactionTypeCode: 'kbs',
            ToLocationID: null
        };
        return res.send(response);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
}

exports.saveSapOrderDetails = async (req, res) => {
    let bodyData = req.body;
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        let SAPPORefNoNotAvailable = [];
        const recordFromTable = await pool.request()
            .input('OrderLstID', sql.Int, bodyData[0].OrderedListID)
            .query(`
                            select * from SSPCSdbo.OrderedListCalculationsDetails where OrderedListID=@OrderLstID
                    `);
        if (recordFromTable.recordset.length > 0) {
            await recordFromTable.recordset.forEach(async el => {
                let filteredRecord = await bodyData.filter(e => e.SAPPORefNo === el.SAPPORefNo);
                if (filteredRecord.length === 0) {
                    SAPPORefNoNotAvailable.push(el.SAPPORefNo);
                }
            })
        }
        if (SAPPORefNoNotAvailable.length > 0) {
            await SAPPORefNoNotAvailable.forEach(async el => {
                let deleteRecord = await pool.request()
                    .input('OrderedListID', sql.Int, bodyData[0].OrderedListID)
                    .input('SAPPORefNoValue', sql.NVarChar, el)
                    .query(`
                            delete from SSPCSdbo.OrderedListCalculationsDetails where OrderedListID=@OrderedListID and SAPPORefNo = @SAPPORefNoValue
                    `);
            })
        }
        for (const data of bodyData) {
            const result = await transaction.request()
                .input('OrderedListID', sql.Int, data.OrderedListID)
                .input('SAPPORefNo', sql.NVarChar, data.SAPPORefNo)
                .query(`
                            select * from SSPCSdbo.OrderedListCalculationsDetails where OrderedListID=@OrderedListID and SAPPORefNo =@SAPPORefNo
                    `);

            if (result.recordset.length === 0) {
                const insertQuery = `
                                INSERT INTO SSPCSdbo.OrderedListCalculationsDetails (
                                   OrderedListID, SAPPORefNo, SAPPORefQty
                                ) VALUES (
                                  @OrderedListID, @SAPPORefNo, @SAPPORefQty
                                ) 
                            `;
                await transaction.request()
                    .input('OrderedListID', sql.Int, data.OrderedListID)
                    .input('SAPPORefNo', sql.NVarChar, data.SAPPORefNo)
                    .input('SAPPORefQty', sql.Int, data.SAPPORefQty)
                    .query(insertQuery);
            } else {
                await transaction.request()
                    .input('OrderedListID', sql.Int, data.OrderedListID)
                    .input('SAPPORefNo', sql.NVarChar, data.SAPPORefNo)
                    .input('SAPPORefQty', sql.Int, data.SAPPORefQty)
                    .query(`
                            Update SSPCSdbo.OrderedListCalculationsDetails SET SAPPORefQty=@SAPPORefQty WHERE SAPPORefNo=@SAPPORefNo AND OrderedListID=@OrderedListID
                            `);
            }

        }
        await transaction.commit();
        res.send("The SAP order details have been successfully saved.")
    } catch (error) {
        await transaction.rollback();
        logger.customerLogger.error(error.message);
        return error.message = constant.serverError;
    }
}

exports.removePoListFromOrderedListCalculationDetails = async (req, res) => {
    const pool = await sql.connect(config);
    const orderedListID = req.body.orderedListID;
    try {
        if (!orderedListID) {
            const result = await pool.request()
                .input("orderedListID", sql.Int, orderedListID)
                .query(`
        DELETE FROM SSPCSdbo.OrderedListCalculationsDetails WHERE OrderedListID = @orderedListID
        `)
            if (result.rowsAffected[0] > 0) {
                res.send("success");
            } else {
                res.send("failed");
            }
        } else {
            res.send("Please Pass OrderedCycleId to delete records");
        }
    } catch (err) {
        console.log("error", err.message);
        logger.customerLogger.error(err.message);
        return res.send(err.message);
    }
}

async function InsertOrUpdateDataToDb(rowData, ShiftStartDateAndTime, ShiftEndDateAndTime, LineId, res) {
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        for (const [index, data] of rowData.entries()) {
            let SkuCodeArr = data.SKUCodes.split(', ');
            SkuCodeArr = [...new Set(SkuCodeArr.map(item => item?.trim()))]
            for (let record of SkuCodeArr) {
                const result = await pool.request()
                    .input('PatternInterpretationID', sql.Int, data.PatternInterpretationID)
                    .input('LineID', sql.Int, data.LineID)
                    .input('DieSetID', sql.Int, data.DieSetID)
                    .input('OrderCycleID', sql.Int, data.ProjectedOrderCycleID)
                    .input('Material', sql.NVarChar, record)
                    .input('ShiftStartDateAndTime', sql.NVarChar, ShiftStartDateAndTime)
                    .input('ShiftEndDateAndTime', sql.NVarChar, ShiftEndDateAndTime)
                    .query(`
                        select * from SSPCSdbo.OrderedList where PatternInterpretationID=@PatternInterpretationID and LineID =@LineID and OrderCycleID=@OrderCycleID and DieSetID= @DieSetID and Material= @Material and CreatedDateTime between @ShiftStartDateAndTime and @ShiftEndDateAndTime
                `);

                if (result.recordset.length === 0) {
                    let { stock, onOrderStock, kbsReturnStock } = await getSKUStock(record);
                    let PatternStartDateAndTime = reUsableFun.getFormattedOnlyDate(data.ScheduledDate) + " " + data.PatternStartTime;
                    PatternStartDateAndTime = reUsableFun.getIstDateFromUniversalDate(PatternStartDateAndTime);
                    const insertQuery = `
                            INSERT INTO SSPCSdbo.OrderedList (
                               PatternInterpretationID, DieSetID, LineID, OrderCycleID,Material, MaterialKanbanInCirculation, OrderDateAndTime, PatternLotSize, PatternStartDateAndTime, POTriggerSec,SkidQty, OnOrder,Stock, CreatedBy,CreatedDateTime,Status,RecommQty,AdjustmentKanbans,OrderedQty
                            ) VALUES (
                              @PatternInterpretationID, @DieSetID, @LineID, @OrderCycleID, @Material, @MaterialKanbanInCirculation, @OrderDateAndTime, @PatternLotSize, @PatternStartDateAndTime, @POTriggerSec, @SkidQty, @OnOrder, @Stock, @CreatedBy,@CreatedDateTime,@Status,@RecommQty,@AdjustmentKanbans,@OrderedQty
                            ) 
                        `;
                    pool.request()
                        .input('PatternInterpretationID', sql.Int, data.PatternInterpretationID)
                        .input('LineID', sql.Int, data.LineID)
                        .input('DieSetID', sql.Int, data.DieSetID)
                        .input('OrderCycleID', sql.Int, data.ProjectedOrderCycleID)
                        .input('Material', sql.NVarChar, record)
                        .input('OrderDateAndTime', sql.DateTime, null)
                        .input('PatternLotSize', sql.Int, data.RoundUpLotSize)
                        .input('PatternStartDateAndTime', sql.DateTime, PatternStartDateAndTime)
                        .input('POTriggerSec', sql.Int, data.MaterialOrderTriggerInSec)
                        .input('SkidQty', sql.Int, data.SkidQty)
                        .input('RecommQty', sql.Int, 0)
                        .input('AdjustmentKanbans', sql.Int, 0)
                        .input('OrderedQty', sql.Int, data.SkidQty * (data.TotalMaterialKanbanInCirculation - Math.floor((onOrderStock + stock) / data.SkidQty)))
                        .input('OnOrder', sql.Int, onOrderStock)
                        .input('Stock', sql.Int, stock)
                        .input('CreatedBy', sql.Int, 1)
                        .input('CreatedDateTime', sql.DateTime, reUsableFun.getISTDate())
                        .input('Status', sql.Int, 1)
                        .input('MaterialKanbanInCirculation', sql.Int, data.TotalMaterialKanbanInCirculation)
                        .query(insertQuery);
                }
            }

        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        logger.customerLogger.error(error.message);
        return error.message = constant.serverError;
    }
};


async function getFLVTDetails(DieSetList, LineId, ShiftId, dateStr, OnlyDateStr) {
    const pool = await sql.connect(config);

    // Run SQL query
    const flvtResult = await pool.request()
        .input("LineID", sql.Int, LineId)
        .input("ShiftId", sql.Int, ShiftId)
        .input("dateStr", sql.NVarChar, dateStr)
        .input('OnlyDateStr', sql.NVarChar, OnlyDateStr)
        .query(`
           IF EXISTS (SELECT 1 FROM Calendar WHERE Date = @dateStr AND Line = ((select  SKUCategoryCode from SKUCategory where SKUCategoryID=@LineID)) and ShiftId=@ShiftId and IsWorking=1)
             BEGIN
             WITH pqCTE AS (
                    SELECT DISTINCT * 
                    FROM SSPCSdbo.PQDataUpload 
                    WHERE LineName = (SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID = @LineID)
                    AND EffectiveFrom = (SELECT TOP 1 EffectiveFrom 
                         FROM SSPCSdbo.PQDataUpload 
                         WHERE LineName = (SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID = @LineID) AND EffectiveTo >= @OnlyDateStr
                         ORDER BY EffectiveFrom DESC) AND PMSP= 0
                            ),
                            bomCTE AS (
                                SELECT * 
                                FROM SSPCSdbo.BOMTypeMaster
                            ),
                            skuCodes AS (
                                SELECT BOM.DieSet AS DieSet, STRING_AGG(SKU.SKUCode, ', ') AS SKUCode 
                                FROM SKU
                                INNER JOIN KitBOM ON SKU.SKUID = KitBOM.KitID 
                                INNER JOIN bomCTE BOM ON KitBOM.BOMType = BOM.DieSet
                                GROUP BY BOM.DieSet
                            ),
                            dedupedPQ AS (
                                SELECT *, ROW_NUMBER() OVER (PARTITION BY DieSet ORDER BY PQDataID) AS row_num 
                                FROM pqCTE
                            )
                            SELECT PQ.*, BOM.MaterialOrderTriggerInSec, BOM.ProductionTriggerInSec, BOM.DieStorageBay, skuCodes.SKUCode
                            FROM dedupedPQ PQ
                            INNER JOIN bomCTE BOM ON PQ.DieSet = BOM.DieSet
                            LEFT JOIN skuCodes ON PQ.DieSet = skuCodes.DieSet
                            WHERE PQ.row_num = 1;

                 END
                 ELSE
                 BEGIN
                 WITH pqCTE AS (
                    SELECT DISTINCT * 
                    FROM SSPCSdbo.PQDataUpload 
                    WHERE LineName = (SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID = @LineID)
                    AND EffectiveFrom = (SELECT TOP 1 EffectiveFrom 
                         FROM SSPCSdbo.PQDataUpload 
                         WHERE LineName = (SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID = @LineID) AND EffectiveTo >= @OnlyDateStr
                         ORDER BY EffectiveFrom DESC) AND PMSP= 0
                            ),
                            bomCTE AS (
                                SELECT * 
                                FROM SSPCSdbo.BOMTypeMaster
                            ),
                            skuCodes AS (
                                SELECT BOM.DieSet AS DieSet, STRING_AGG(SKU.SKUCode, ', ') AS SKUCode 
                                FROM SKU
                                INNER JOIN KitBOM ON SKU.SKUID = KitBOM.KitID 
                                INNER JOIN bomCTE BOM ON KitBOM.BOMType = BOM.DieSet
                                GROUP BY BOM.DieSet
                            ),
                            dedupedPQ AS (
                                SELECT *, ROW_NUMBER() OVER (PARTITION BY DieSet ORDER BY PQDataID) AS row_num 
                                FROM pqCTE
                            )
                            SELECT PQ.*, BOM.MaterialOrderTriggerInSec, BOM.ProductionTriggerInSec, BOM.DieStorageBay, skuCodes.SKUCode
                            FROM dedupedPQ PQ
                            INNER JOIN bomCTE BOM ON PQ.DieSet = BOM.DieSet
                            LEFT JOIN skuCodes ON PQ.DieSet = skuCodes.DieSet
                            WHERE PQ.row_num = 1 AND 1=0;
              END
        `);

    if (flvtResult.recordset.length === 0) return [];

    const flvtList = [];
    const partList = [];
    const partsToFetchStock = [];

    // Collect unique parts
    flvtResult.recordset.forEach(item => {
        let childPart = item.SKUCode.split(",");
        childPart = [...new Set(childPart.map(part => part?.trim().toLowerCase()))];
        childPart.forEach(el => {
            partsToFetchStock.push({ part: el, dieSet: item.DieSet })
        })

        // partsToFetchStock.push(...childPart);
    });
    let LineName = flvtResult.recordset[0].LineName;
    const stockData = await Promise.all(partsToFetchStock.map(part => getSKUPartStock(part.part, part.dieSet, LineName)));

    // Map stock data to parts
    const stockMap = stockData.reduce((acc, stock, index) => {
        acc[partsToFetchStock[index].dieSet + '-' + partsToFetchStock[index].part] = stock;
        return acc;
    }, {});

    let getYZANoOfMaterial = await reUsableFun.getYZANoOfMaterial(pool);
    if (typeof (getYZANoOfMaterial) === "string") {
        return res.send("something went wrong, please try again!");
    }
    getYZANoOfMaterial = getYZANoOfMaterial.sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate))
    flvtResult.recordset.forEach(item => {
        let childPart = item.SKUCode.split(",");
        childPart = [...new Set(childPart.map(part => part?.trim().toLowerCase()))];

        childPart.forEach(part => {
            if (!DieSetList.includes(item.DieSet?.trim().toLowerCase())) {
                const { stock, mtrStock, onOrderStock, kbsReturnStock, minStockSkuCode, pullRate } = stockMap[item.DieSet + '-' + part];

                let PullRatePerHrs = Number(item.DayVolume) === 1 ? Number(pullRate) : (Number(pullRate) * 3600).toFixed(1);
                if (PullRatePerHrs == 0) {
                    PullRatePerHrs = 0;
                }
                const projectedStock = PullRatePerHrs === 0 ? 0 : stock / PullRatePerHrs; //  (stock - (item.PullRatePerSec * item.ProductionTriggerInSec));
                let YZANo = getYZANoOfMaterial.filter(el => el.SKUCode?.trim().toLowerCase() === part?.trim().toLowerCase());
                const entry = {
                    pqId: item.PQDataID,
                    dieSet: item.DieSet?.trim(),
                    //  bomSeq: item.BOMSequence,
                    childPart: part.toUpperCase(),
                    currentStock: mtrStock,
                    pullRate: PullRatePerHrs,
                    poTriggerHr: (item.MaterialOrderTriggerInSec / 3600).toFixed(0),
                    safetyStock: item.RoundUpSafetyStock,
                    projectedStock: `${stock}(${projectedStock.toFixed(1)})`, //`${projectedStock.toFixed(2)}(${(projectedStock / (item.PullRatePerSec * 3600).toFixed(4)).toFixed(2)})`,    //`${(projectedStock / (item.PullRatePerSec * 3600).toFixed(4)).toFixed(2)}`,
                    FLVTLotSize: item.FLVTLotSize,
                    rowHighlightColor: Number(item.DayVolume) == 1 ? "#baf0c1ff" : item.FLVTLotSize == 0 ? (stock <= item.RoundUpSafetyStock ? "#EFA5AA" : "#e9e8eb") : (stock <= item.RoundUpSafetyStock ? "#F8C68A" : "#e9e8eb"),       //projectedStock < stock ? "#ffb9b9" : "#fff",
                    projectedStockCellColor: Number(item.DayVolume) == 1 ? (stock <= item.RoundUpSafetyStock ? "#5ee975ff" : "#d6e6d8ff") : item.FLVTLotSize == 0 ? (stock <= item.RoundUpSafetyStock ? "#a81622" : "#e9e8eb") : (stock <= item.RoundUpSafetyStock ? "#F48805" : "#e9e8eb"), // projectedStock < stock ? "#a81622" : "#e9e8eb", // #F48805
                    projectedStockTextColor: stock <= item.RoundUpSafetyStock ? "#fff" : "#000",
                    proStock: projectedStock.toFixed(1),
                    YZANo: YZANo.length > 0 ? YZANo[0].UOMName : ""
                };

                flvtList.push(entry);
                partList.push(part);
            }
        });
    });

    // Sort the data
    const filteredPtrData = flvtList.filter(el => el.rowHighlightColor === "#EFA5AA").sort((a, b) => a.proStock - b.proStock);
    const filteredFlvtData = flvtList.filter(el => el.rowHighlightColor === "#F8C68A").sort((a, b) => a.proStock - b.proStock);
    const serviceData = flvtList.filter(el => el.rowHighlightColor === "#e9e8eb").sort((a, b) => a.proStock - b.proStock);
    const servicePart = flvtList.filter(el => el.rowHighlightColor === "#baf0c1ff").sort((a, b) => a.proStock - b.proStock);
    const servicehightProjectedStock = flvtList.filter(el => el.rowHighlightColor === "#e4ebe5ff").sort((a, b) => a.proStock - b.proStock);

    return [...filteredPtrData, ...filteredFlvtData, ...serviceData, ...servicePart, ...servicehightProjectedStock];
}

async function getFLVTDetailsWithout(LineId) {

}

async function getOderListDetailsToBeOrdered(fromDate, toDate, LineID, OrderCycleID, ShiftId, dateStr) {
    const pool = await sql.connect(config);
    let query = `
    IF EXISTS (SELECT 1 FROM Calendar WHERE Date = @dateStr AND Line = ((select  SKUCategoryCode from SKUCategory where SKUCategoryID=@LineID)) and ShiftId=@ShiftId and IsWorking=1)
    BEGIN
            with OrderCTE AS (
                select distinct * from SSPCSdbo.OrderedList where CreatedDateTime between @fromDate and @toDate AND LineID=@LineID AND (@OrderCycleID IS NULL OR OrderCycleID = @OrderCycleID) AND Status IN (1,2)
                ),
                BOMTypeCTE AS(
                select * from SSPCSdbo.BOMTypeMaster
                )
                select list.*, BOM.DieSet from OrderCTE list
                INNER JOIN BOMTypeCTE BOM ON list.DieSetID = BOM.DieSetID
                Order BY CASE WHEN list.PatternStartDateAndTime IS NULL THEN 1 ELSE 0 END,
                list.PatternStartDateAndTime,CreatedDateTime asc
     END 
     ELSE 
     BEGIN
       with OrderCTE AS (
                select distinct * from SSPCSdbo.OrderedList where CreatedDateTime between @fromDate and @toDate AND LineID=@LineID AND (@OrderCycleID IS NULL OR OrderCycleID = @OrderCycleID) AND Status IN (1,2)
                ),
                BOMTypeCTE AS(
                select * from SSPCSdbo.BOMTypeMaster
                )
                select list.*, BOM.DieSet from OrderCTE list
                INNER JOIN BOMTypeCTE BOM ON list.DieSetID = BOM.DieSetID
                where 1=0
                Order BY CASE WHEN list.PatternStartDateAndTime IS NULL THEN 1 ELSE 0 END,
                list.PatternStartDateAndTime,CreatedDateTime asc
     END
    `
    let result = await pool.request()
        .input('fromDate', sql.NVarChar, fromDate)
        .input('toDate', sql.NVarChar, toDate)
        .input("LineID", sql.Int, LineID)
        .input("OrderCycleID", sql.Int, OrderCycleID)
        .input("ShiftId", sql.Int, ShiftId)
        .input('dateStr', sql.NVarChar, dateStr)
        .query(query);
    return result.recordset;
}

async function getOderListDetailsOrdered(fromDate, toDate, LineID, OrderCycleID, ShiftId, dateStr) {
    const pool = await sql.connect(config);

    let query = `
    IF EXISTS (SELECT 1 FROM Calendar WHERE Date = @dateStr AND Line = ((select  SKUCategoryCode from SKUCategory where SKUCategoryID=@LineID)) and ShiftId=@ShiftId and IsWorking=1)
    BEGIN
            with OrderCTE AS (
                select distinct * from SSPCSdbo.OrderedList where CreatedDateTime between @fromDate and @toDate AND LineID=@LineID AND (@OrderCycleID IS NULL OR OrderCycleID = @OrderCycleID) AND Status IN (3,4)
                ),
                BOMTypeCTE AS(
                select * from SSPCSdbo.BOMTypeMaster
                )
                select list.*, BOM.DieSet from OrderCTE list
                INNER JOIN BOMTypeCTE BOM ON list.DieSetID = BOM.DieSetID
                Order BY CASE WHEN list.PatternStartDateAndTime IS NULL THEN 1 ELSE 0 END,
                list.PatternStartDateAndTime,CreatedDateTime asc
     END 
     ELSE 
     BEGIN
       with OrderCTE AS (
                select distinct * from SSPCSdbo.OrderedList where CreatedDateTime between @fromDate and @toDate AND LineID=@LineID AND (@OrderCycleID IS NULL OR OrderCycleID = @OrderCycleID) AND Status IN (3,4)
                ),
                BOMTypeCTE AS(
                select * from SSPCSdbo.BOMTypeMaster
                )
                select list.*, BOM.DieSet from OrderCTE list
                INNER JOIN BOMTypeCTE BOM ON list.DieSetID = BOM.DieSetID
                where 1=0
                Order BY CASE WHEN list.PatternStartDateAndTime IS NULL THEN 1 ELSE 0 END,
                list.PatternStartDateAndTime,CreatedDateTime asc
     END
    `
    let result = await pool.request()
        .input('fromDate', sql.NVarChar, fromDate)
        .input('toDate', sql.NVarChar, toDate)
        .input("LineID", sql.Int, LineID)
        .input("OrderCycleID", sql.Int, OrderCycleID)
        .input("ShiftId", sql.Int, ShiftId)
        .input('dateStr', sql.NVarChar, dateStr)
        .query(query);
    return result.recordset;
}

async function getAddOtherPartsDetails(DieSetList, LineId, ShiftId, dateStr) {
    let listOfDieSet = DieSetList;
    const pool = await sql.connect(config);
    let result = await pool.request()
        .input('DieSetValues', sql.VarChar(sql.MAX), listOfDieSet.join(','))
        .input("LineID", sql.Int, LineId)
        .input("ShiftId", sql.NVarChar, ShiftId)
        .input("dateStr", sql.NVarChar, dateStr)
        .query(`
           IF EXISTS (SELECT 1 FROM Calendar WHERE Date = @dateStr AND Line =(select  SKUCategoryCode from SKUCategory where SKUCategoryID=@LineID) and ShiftId=@ShiftId and IsWorking=1)
                BEGIN
                WITH pqCTE AS (
					SELECT * FROM SSPCSdbo.PQDataUpload WHERE LineName=(SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID=@LineID) AND EffectiveFrom = ( SELECT TOP(1) EffectiveFrom FROM SSPCSdbo.PQDataUpload WHERE LineName=(SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID=@LineID) ORDER BY EffectiveFrom DESC)
					),
					bomCTE AS (
					 SELECT * FROM SSPCSdbo.BOMTypeMaster
					)
					SELECT PQ.DieSet AS dieSet, BOM.DieStorageBay AS dieStorageBay, PQ.EffectiveFrom FROM pqCTE PQ
					INNER JOIN bomCTE BOM ON PQ.DieSet = BOM.DieSet

             END
             ELSE
             BEGIN
             WITH pqCTE AS (
					SELECT * FROM SSPCSdbo.PQDataUpload WHERE LineName=(SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID=@LineID) AND EffectiveFrom = ( SELECT TOP(1) EffectiveFrom FROM SSPCSdbo.PQDataUpload WHERE LineName=(SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID=@LineID) ORDER BY EffectiveFrom DESC)
					),
					bomCTE AS (
					 SELECT * FROM SSPCSdbo.BOMTypeMaster
					)
					SELECT PQ.DieSet AS dieSet, BOM.DieStorageBay AS dieStorageBay, PQ.EffectiveFrom FROM pqCTE PQ
					INNER JOIN bomCTE BOM ON PQ.DieSet = BOM.DieSet where 1=0

            END
        `)
    //[...new Set(childPart.map(item => item.trim()))]
    let results = [];
    for (data of result.recordset) {
        if (!listOfDieSet.includes(data.dieSet?.trim().toLowerCase())) {
            results.push(data);
            listOfDieSet.push(data.dieSet?.trim().toLowerCase());
        }
    }
    return results;
}

async function getSKUStock(material) {
    // for (let data of recommendationCalculations) {
    try {
        const pool = await sql.connect(config);
        let result = await pool.request()
            .input('material', sql.NVarChar, material)
            .query(`
                WITH StockBucketMapping AS (
                    SELECT 
                        StockBucketID,
                        CASE 
                            WHEN StockBucketCode IN ('OnHand', 'AwaitingPress', 'WashingWIP', 'Washed', 'PressWIP') THEN 'stock'
                            WHEN StockBucketCode IN ('OnOrder') THEN 'onOrderStock'
                            WHEN StockBucketCode IN ('KBsReturned') THEN 'kbsRtnStock'
                            ELSE NULL
                        END AS bucketType
                    FROM StockBucket
                ),
                FilteredSKU AS (
                    SELECT TOP(1) SKUCostID
                    FROM SKUCost
                    WHERE SKUInventoryID = (
                        SELECT TOP(1) SKUID
                        FROM SKUInventory
                        WHERE SKUID = (
                            SELECT TOP(1) SKUID
                            FROM SKU
                            WHERE SKUCode = @material
                        )
                    )
                )
                SELECT 
                    SUM(CASE WHEN sbm.bucketType = 'stock' THEN ss.BucketQuantityInStorageUOM ELSE 0 END) AS stock,
                    SUM(CASE WHEN sbm.bucketType = 'onOrderStock' THEN ss.BucketQuantityInStorageUOM ELSE 0 END) AS onOrderStock,
                    SUM(CASE WHEN sbm.bucketType = 'kbsRtnStock' THEN ss.BucketQuantityInStorageUOM ELSE 0 END) AS kbsReturnStock
                FROM SKUStock ss
                JOIN StockBucketMapping sbm ON ss.StockBucketID = sbm.StockBucketID
                WHERE ss.SKUCostID = (SELECT SKUCostID FROM FilteredSKU);
                `)
        return {
            stock: result.recordset[0]?.stock || 0,
            onOrderStock: result.recordset[0]?.onOrderStock || 0,
            kbsReturnStock: result.recordset[0]?.kbsReturnStock || 0
        }

    } catch (err) {
        console.log(err.message);
    }

}

async function getSKUPartStock(material, dieSet, LineName) {
    // for (let data of recommendationCalculations) {
    try {
        const pool = await sql.connect(config);
        let result = await pool.request()
            .input('material', sql.NVarChar, material)
            .input('LineName', sql.NVarChar, LineName)
            .input('dieSet', sql.NVarChar, dieSet)
            .query(`
                WITH SKUStockDetails AS (
                    SELECT 
                        SKU.SKUID,
                        COALESCE(SUM(SKUStock.BucketQuantityInStorageUOM), 0) AS stocks
                    FROM SKU
                    LEFT JOIN SKUInventory ON SKU.SKUID = SKUInventory.SKUID
                    LEFT JOIN SKUCost ON SKUInventory.SKUInventoryID = SKUCost.SKUInventoryID
                    LEFT JOIN (
                        SELECT * 
                        FROM SKUStock 
                        WHERE StockBucketID IN (
                            SELECT StockBucketID 
                            FROM StockBucket 
                            WHERE StockBucketCode IN ('PartsOK', 'PartsStorage', 'RepairWIP', 'PartsBadLot', 'PartsNG', 'OnHoldOKParts')
                        )
                    ) AS SKUStock ON SKUStock.SKUCostID = SKUCost.SKUCostID
                    GROUP BY SKU.SKUID
                ),
                partsDetails AS (
                    SELECT 
                        SKUID, 
                        SKUCode 
                    FROM SKU 
                    WHERE SKUID IN (
                        SELECT KitItemID 
                        FROM KitBOM 
                        WHERE KitID = (
                            SELECT SKUID 
                            FROM SKU 
                            WHERE SKUCode = @material
                        ) and BOMType=@dieSet
                    )
                ),
                StockBucketMapping AS (
                    SELECT 
                        StockBucketID,
                        CASE 
                            WHEN StockBucketCode IN ('OnHand', 'AwaitingPress', 'WashingWIP', 'Washed', 'PressWIP') THEN 'stock'
                            WHEN StockBucketCode IN ('OnOrder') THEN 'onOrderStock'
                            WHEN StockBucketCode IN ('KBsReturned') THEN 'kbsRtnStock'
                            ELSE NULL
                        END AS bucketType
                    FROM StockBucket
                ),
                FilteredSKU AS (
                    SELECT TOP(1) SKUCostID
                    FROM SKUCost
                    WHERE SKUInventoryID = (
                        SELECT TOP(1) SKUInventoryID
                        FROM SKUInventory
                        WHERE SKUID = (
                            SELECT TOP(1) SKUID
                            FROM SKU
                            WHERE SKUCode = @material
                        )
                    )
                ),
                MaterialStockSummary AS (
                    SELECT 
                        SUM(CASE WHEN sbm.bucketType = 'stock' THEN ss.BucketQuantityInStorageUOM ELSE 0 END) AS MaterialStock,
                        SUM(CASE WHEN sbm.bucketType = 'onOrderStock' THEN ss.BucketQuantityInStorageUOM ELSE 0 END) AS OnOrderStock,
                        SUM(CASE WHEN sbm.bucketType = 'kbsRtnStock' THEN ss.BucketQuantityInStorageUOM ELSE 0 END) AS KbsReturnStock
                    FROM SKUStock ss
                    JOIN StockBucketMapping sbm ON ss.StockBucketID = sbm.StockBucketID
                    WHERE ss.SKUCostID = (SELECT SKUCostID FROM FilteredSKU)
                ),
                MinPartStockDetail AS (
                    SELECT TOP(1)
                        pd.SKUCode AS MinPartSKUCode,
                        ssd.stocks AS MinPartStock
                    FROM SKUStockDetails ssd
                    JOIN partsDetails pd ON ssd.SKUID = pd.SKUID
                    ORDER BY ssd.stocks ASC
                )

                SELECT 
                    mps.MinPartStock,
                    mps.MinPartSKUCode,
                    ms.MaterialStock,
                    ms.OnOrderStock,
                    ms.KbsReturnStock,
                    pq.PullRatePerSec
                FROM MaterialStockSummary ms
                CROSS JOIN MinPartStockDetail mps
                LEFT JOIN SSPCSdbo.PQDataUpload pq
                    ON pq.Variant COLLATE SQL_Latin1_General_CP1_CI_AS = mps.MinPartSKUCode COLLATE SQL_Latin1_General_CP1_CI_AS
                    AND pq.LineName COLLATE SQL_Latin1_General_CP1_CI_AS = @LineName COLLATE SQL_Latin1_General_CP1_CI_AS
                    AND pq.EffectiveFrom = (
                        SELECT TOP(1) EffectiveFrom 
                        FROM SSPCSdbo.PQDataUpload 
                        WHERE LineName COLLATE SQL_Latin1_General_CP1_CI_AS = @LineName COLLATE SQL_Latin1_General_CP1_CI_AS
                        ORDER BY EffectiveFrom DESC
                    );
                `);
        return {
            stock: result.recordset[0]?.MinPartStock || 0,
            mtrStock: result.recordset[0]?.MaterialStock || 0,
            onOrderStock: result.recordset[0]?.OnOrderStock || 0,
            kbsReturnStock: result.recordset[0]?.KbsReturnStock || 0,
            minStockSkuCode: result.recordset[0]?.MinPartSKUCode,
            pullRate: result.recordset[0]?.PullRatePerSec || 0
        }

    } catch (err) {
        console.log(err.message);
    }

}

async function handleMaterialOrderTransaction(req, res) {
    const { OrderedListID, Status, Material, OrderedQty, recommQty, onOrder, kanbansReturned } = req.body;
    const pool = await sql.connect(config);

    let response = [];

    if (kanbansReturned === 0) {
        const result = await pool
            .request()
            .input("Material", sql.NVarChar, Material) // KbsReturned to KbsReturnedFromPressWIP
            .query(`
                SELECT DISTINCT sku.SKUID, skuInv.SKUInventoryID, skuCost.SKUCostID, packType.PackTypeID AS pack, uomMapping.UOMID AS BillingUOMID, transType.TransactionTypeID,transType.TransactionTypeCode, location.LocationID 
                FROM  SKU AS sku 
                LEFT JOIN  SKUInventory AS skuInv ON sku.SKUID = skuInv.SKUID
                LEFT JOIN SKUCost AS skuCost ON skuInv.SKUInventoryID = skuCost.SKUInventoryID
                LEFT JOIN (SELECT TOP 1 PackTypeID FROM PackType WHERE PackTypeCategory = 'pack') AS packType ON 1 = 1
                CROSS APPLY (SELECT TOP 1 UOMID FROM SKUUOMMapping WHERE SKUID = sku.SKUID ORDER BY UOMID) AS uomMapping
                LEFT JOIN (SELECT TransactionTypeID, TransactionTypeCode FROM TransactionType WHERE TransactionTypeCode = 'PurchaseOrderCreationExcessOrdering') AS transType ON 1 = 1
                LEFT JOIN (SELECT LocationID FROM Location WHERE CumulativeLocationCode = 'KbsReturnedFromPressWIP') AS location ON 1 = 1
                WHERE  sku.SKUCode = @Material;
                `);

        if (result.recordset.length > 0) {
            const recordResponse = {
                WarehouseID: constant.WarehouseID,
                PrimaryCompanyID: constant.PrimaryCompanyID,
                WarehousePrimaryCompanyID: constant.WarehousePrimaryCompanyID,
                CostBucketID: constant.CostBucketID,
                BillingUOMID: result.recordset[0].BillingUOMID,
                TotalOfLineAmountsInLocalCurrency: constant.TotalOfLineAmountsInCustomerCurrency,
                UnitPriceOfBillingUOMInLocalCurrency: constant.UnitPriceOfBillingUOMInLocalCurrency,
                IsFOC: constant.IsFOC,
                PackTypeID1: result.recordset[0].pack,
                ReceivedSKUCostID: result.recordset[0].SKUCostID,
                TransactionTypeID: result.recordset[0].TransactionTypeID,
                ReceivedQuantityInBillingUOM: OrderedQty,
                ToLocationID: result.recordset[0].LocationID,
                transactionTypeCode: result.recordset[0].TransactionTypeCode,
                KitID: result.recordset[0].SKUID,
                ProductionOrder: OrderedQty,
                success: true
            }
            response.push(recordResponse);
        }
    }
    else {
        // Query for stock records
        const customSearchResult = await pool
            .request()
            .input("Material", sql.NVarChar, Material)
            .query(`
                SELECT SKUID, SKUCode, SKUCostID, SKUBatchID, LocationID, 
                BucketQuantityInStorageUOM, ShippingModeID, TradeTermID, CustomerID
                FROM SSPCSCustomSearchViews.v_SearchSKUStockCustomSearchView
                WHERE  StockBucketCode = 'KBsReturned' AND SKUID = (SELECT SKUID FROM SKU WHERE SKUCode= @Material);
        `);

        const stockRecords = customSearchResult.recordset;

        const UnderlyingBatchIDs = stockRecords
            .map((record) => record.SKUBatchID)
            .join(", ");

        // Sum AvailableQuantityInStorageUOM for all records
        const availableQuantity = stockRecords.reduce(
            (sum, record) => sum + record.BucketQuantityInStorageUOM,
            0
        );

        let InvoicedQuantityInBillingUOM,
            ReceivedQuantityInBillingUOM,
            StockTransferQuantityInStorageUOM;
        let transactionTypeCode, skuTransactionType;

        if (OrderedQty === kanbansReturned) {
            StockTransferQuantityInStorageUOM = OrderedQty;
            transactionTypeCode = "PurchaseOrderCreation";
        } else if (OrderedQty > kanbansReturned) {
            ReceivedQuantityInBillingUOM = OrderedQty - availableQuantity;
            StockTransferQuantityInStorageUOM = OrderedQty;
            transactionTypeCode = "PurchaseOrderCreationExcessOrdering";
            skuTransactionType = 'PurchaseOrderCreation';
        } else {
            InvoicedQuantityInBillingUOM = availableQuantity - OrderedQty;
            StockTransferQuantityInStorageUOM = OrderedQty;
            transactionTypeCode = "RemovingExcessKbs";
            skuTransactionType = 'PurchaseOrderCreation';
        }


        const transactionTypeResult = await pool
            .request()
            .input("TransactionTypeCode", sql.VarChar, transactionTypeCode)
            .input("Material", sql.VarChar, Material)
            .query(`
                WITH trans AS ( SELECT TransactionTypeID FROM [dbo].[TransactionType] WHERE TransactionTypeCode = @TransactionTypeCode),
                    pack AS (SELECT TOP 1 PackTypeID FROM PackType WHERE PackTypeCategory = 'pack'),
                    uomID AS (SELECT TOP 1 UOMID FROM [dbo].[SKUUOMMapping] WHERE SKUID = (SELECT SKUID FROM SKU WHERE SKUCode=@Material)),
                    preFetchedTransactionID as (SELECT TransactionTypeID as preFetchedTransID  FROM [dbo].[TransactionType] WHERE TransactionTypeCode = @TransactionTypeCode)
                    select tr.*, pck.*,uom.UOMID,transID.* from trans tr
                    LEFT JOIN pack pck ON 1 = 1
                    LEFT JOIN uomID uom ON 1=1
                    LEFT JOIN preFetchedTransactionID transID ON 1=1;
                `);
        let tranDetails, skuTransactionID;
        if (skuTransactionType) {
            tranDetails = await reUsableFun.getTransactionDetails(config);
            tranDetails.forEach(trans => {
                if (trans.transCode === "PurchaseOrderCreation") {
                    skuTransactionID = trans.transID;
                }
            })

        }

        const recordResponse = {
            WarehouseID: constant.WarehouseID,
            PrimaryCompanyID: constant.PrimaryCompanyID,
            WarehousePrimaryCompanyID: constant.WarehousePrimaryCompanyID,
            CostBucketID: constant.CostBucketID,
            SKUBatchID: transactionTypeCode === "PurchaseOrderCreation" ? null : stockRecords[0].SKUBatchID,
            InvoicedSKUCostID: stockRecords[0].SKUCostID,
            TransactionTypeID: transactionTypeResult.recordset[0]?.TransactionTypeID,
            TransactionTypeOrderToLineID: transactionTypeResult.recordset[0]?.preFetchedTransID, // Pre-fetched OrderToLine TransactionTypeID
            SKUCode: stockRecords[0].SKUCode,
            ReceivedSKUCostID: stockRecords[0].SKUCostID,
            ReceivedQuantityInBillingUOM: ReceivedQuantityInBillingUOM,
            AvailableQuantityInStorageUOM: availableQuantity,
            InvoicedQuantityInBillingUOM, // Result from logic above
            StockTransferQuantityInStorageUOM: StockTransferQuantityInStorageUOM, // Separate attribute for ProductionOrder
            BillingUOMID: transactionTypeResult.recordset[0]?.UOMID,
            TotalOfLineAmountsInLocalCurrency: constant.TotalOfLineAmountsInLocalCurrency,
            UnitPriceOfBillingUOMInLocalCurrency: constant.UnitPriceOfBillingUOMInLocalCurrency,
            FromLocationID: stockRecords[0].LocationID,
            PackTypeID1: transactionTypeResult.recordset[0]?.PackTypeID,
            UnderlyingBatchIDs: UnderlyingBatchIDs,
            ToLocationID: transactionTypeCode === "PurchaseOrderCreation" ? null : stockRecords[0].LocationID,
            ShippingModeID: stockRecords[0].ShippingModeID,
            TradeTermID: stockRecords[0].TradeTermID,
            CustomerID: stockRecords[0].CustomerID,
            IsFOC: constant.IsFOC,
            TotalOfLineAmountsInCustomerCurrency: constant.TotalOfLineAmountsInCustomerCurrency,
            IsShippedSeparately: constant.IsShippedSeparately,
            InvoiceLineNo: constant.InvoiceLineNo,
            UnitSalesPriceOfStorageUOMInCustomerCurrency: constant.UnitSalesPriceOfStorageUOMInCustomerCurrency,
            transactionTypeCode,
            skuTransactionType,
            skuTransactionID,
            success: true
        };

        response.push(recordResponse); // Store the response
    }
    res.send(response);
}

async function CancellSkuTransaction(req, res, pool) {
    const { OrderedListID, Status, Material, OrderedQty } = req.body;
    try {
        const result = await pool
            .request()
            .input("Material", sql.NVarChar, Material) // KbsReturned to KbsReturnedFromPressWIP
            .query(`
                    SELECT DISTINCT sku.SKUID, skuInv.SKUInventoryID, skuCost.SKUCostID, packType.PackTypeID AS pack, uomMapping.UOMID AS BillingUOMID, transType.TransactionTypeID,transType.TransactionTypeCode, location.LocationID 
                    FROM  SKU AS sku 
                    LEFT JOIN  SKUInventory AS skuInv ON sku.SKUID = skuInv.SKUID
                    LEFT JOIN SKUCost AS skuCost ON skuInv.SKUInventoryID = skuCost.SKUInventoryID
                    LEFT JOIN (SELECT TOP 1 PackTypeID FROM PackType WHERE PackTypeCategory = 'pack') AS packType ON 1 = 1
                    CROSS APPLY (SELECT TOP 1 UOMID FROM SKUUOMMapping WHERE SKUID = sku.SKUID ORDER BY UOMID) AS uomMapping
                    LEFT JOIN (SELECT TransactionTypeID, TransactionTypeCode FROM TransactionType WHERE TransactionTypeCode = 'CancelMaterial') AS transType ON 1 = 1
                    LEFT JOIN (SELECT LocationID FROM Location WHERE CumulativeLocationCode = 'KbsReturnedFromPressWIP') AS location ON 1 = 1
                    WHERE  sku.SKUCode = @Material;
                    `);
        const response = [];

        if (result.recordset.length > 0) {
            const recordResponse = {
                WarehouseID: constant.WarehouseID,
                PrimaryCompanyID: constant.PrimaryCompanyID,
                WarehousePrimaryCompanyID: constant.WarehousePrimaryCompanyID,
                CostBucketID: constant.CostBucketID,
                BillingUOMID: result.recordset[0].BillingUOMID,
                TotalOfLineAmountsInLocalCurrency: constant.TotalOfLineAmountsInCustomerCurrency,
                UnitPriceOfBillingUOMInLocalCurrency: constant.UnitPriceOfBillingUOMInLocalCurrency,
                IsFOC: constant.IsFOC,
                PackTypeID1: result.recordset[0].pack,
                ReceivedSKUCostID: result.recordset[0].SKUCostID,
                TransactionTypeID: result.recordset[0].TransactionTypeID,
                ReceivedQuantityInBillingUOM: OrderedQty,
                ToLocationID: result.recordset[0].LocationID,
                transactionTypeCode: result.recordset[0].TransactionTypeCode,
                KitID: result.recordset[0].SKUID,
                //ProductionOrder: OrderedQty + onOrder,
                success: true
            }
            response.push(recordResponse);
        }
        return res.send(response);

    } catch (error) {
        console.error("Failed to Cancell SKUTransaction:", error.message);
        res.status(500).send("Server error");
    }
};

async function getPoDetails(Material, CurrDate, ShiftStartTime, ShiftEndTime) {
    const pool = await sql.connect(config);
    let date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    let dateCurr = `${year}-${month}-${day}` + " 00:00:00";

    let prevDate = reUsableFun.getISTDate();
    prevDate = prevDate.setDate(prevDate.getDate() - 1);
    prevDate = reUsableFun.getFormattedOnlyDate(prevDate);
    prevDate = prevDate + " 00:00:000";

    let result = await pool.request()
        .input('material', sql.NVarChar, Material)
        .input('date', sql.NVarChar, dateCurr)
        .input('prevDate', sql.NVarChar, prevDate)
        .input('ShiftStartTime', sql.NVarChar, ShiftStartTime)
        .input('ShiftEndTime', sql.NVarChar, ShiftEndTime)
        .query(`
            select top(2) *from SSPCSdbo.PurchaseOrder where YZAPartNo IN(
            select  UOMCode from UOM where UOMID IN (select  UOMID from SKUUOMMapping where SKUID=(select SKUID from SKU where SKUID =(select SKUID from SKU where SKUCode=@material)))
            and UOMCode NOT IN ('kg','NOS') ) AND OrderReleaseDate IN (@date,@prevDate) AND ReleaseNo not in (
            select oderDtls.SAPPORefNo from SSPCSdbo.OrderedList AS OrderedList
			JOIN SSPCSdbo.OrderedListCalculationsDetails AS oderDtls ON oderDtls.OrderedListID = OrderedList.OrderedListID
			WHERE OrderedList.Material = @material
            ) ORDER BY CreatedDate DESC;
            `)

    // select *from SSPCSdbo.PurchaseOrder where YZAPartNo IN(
    //     select  UOMCode from UOM where UOMID IN (select  UOMID from SKUUOMMapping where SKUID=(select SKUID from SKU where SKUID =(select SKUID from SKU where SKUCode=@material)))
    //     and UOMCode NOT IN ('kg','NOS') ) ORDER BY CreatedDate DESC;

    let poNoList = [];
    let poRecList = 0;
    if (result.recordset.length > 0) {
        async function sortByDateDesc(arr) {
            return arr.sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate));
        }
        let sortedData = await sortByDateDesc(result.recordset);
        for (let data of sortedData) {
            //poRecList += data.Quantity;
            poNoList.push({ refPONo: data.ReleaseNo, refPOQty: data.Quantity });
        }
    }
    return {
        //poRecList: poRecList,
        poNoList: poNoList
    };
}

async function getSapOrderDetails() {
    const pool = await sql.connect(config);
    let result = await pool.request()
        .query(`
            select * from SSPCSdbo.OrderedListCalculationsDetails
            `);

    return result.recordset;
}

async function getCurrentShiftStartANDEndDetails(LineId) {
    let date = new Date(), ShiftStartDateAndTime, ShiftEndDateAndTime, shiftStart, shiftEnd;
    let DateAndTimeStr = reUsableFun.getFormattedSeperateDateAndTime(date);
    let getCurrentShiftDetails = await reUsableFun.getCurrentShiftDetails(DateAndTimeStr.timeStr, LineId, config);
    if (reUsableFun.getTimeStringToSec(getCurrentShiftDetails.ShiftStartTime) > reUsableFun.getTimeStringToSec(getCurrentShiftDetails.ShiftEndTime)) {
        let nextWorkingDate = new Date(date);
        nextWorkingDate = nextWorkingDate.setDate(nextWorkingDate.getDate() + 1)
        let nextWorkingDay = await reUsableFun.getNextWorkngDay(nextWorkingDate, getCurrentShiftDetails.LineName, config);
        ShiftStartDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftStartTime;
        ShiftEndDateAndTime = nextWorkingDay + " " + getCurrentShiftDetails.ShiftEndTime;
        shiftStart = getCurrentShiftDetails.ShiftStartTime;
        shiftEnd = getCurrentShiftDetails.ShiftEndTime;
    } else {
        ShiftStartDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftStartTime;
        ShiftEndDateAndTime = DateAndTimeStr.dateStr + " " + getCurrentShiftDetails.ShiftEndTime;
        shiftStart = getCurrentShiftDetails.ShiftStartTime;
        shiftEnd = getCurrentShiftDetails.ShiftEndTime;
    }

    return {
        ShiftStartDateAndTime,
        ShiftEndDateAndTime,
        shiftStart,
        shiftEnd
    }
}

async function CheckMaterialExist(material, lineID, startStrDate, endStrDate, status, orderCycleID, config) {
    const pool = await sql.connect(config);
    let result = await pool.request()
        .input('material', sql.NVarChar, material)
        .input('lineID', sql.Int, lineID)
        .input('startStrDate', sql.NVarChar, startStrDate)
        .input('endStrDate', sql.NVarChar, endStrDate)
        .input('status', sql.Int, status)
        .input('orderCycleID', sql.Int, orderCycleID)
        .query(`
            select * from SSPCSdbo.OrderedList where LineID=@lineID and Material=@material and CreatedDateTime between @startStrDate and @endStrDate and Status=@status and OrderCycleID=@orderCycleID
            `);

    return result.recordset;
}


