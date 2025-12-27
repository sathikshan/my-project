
    const sql = require('mssql/msnodesqlv8');
    const fs = require("fs");
    const path = require('path');
    const constant = require('../../config/constant');
    const logger = require("../../utils/logger");
    const reUsableFun = require("../../utils/reUsableFun");
    const csv = require('csv-parser');
    const { Readable } = require('stream');
    const config = require("../../config/dbConfig");
    
   
    const moment = require('moment');

  exports.partorder = async (req, res) => {
    const { date, line, shift } = req.body;

    // Validate request body parameters
    if (!date || !line || !shift) {
        return res.send('Please provide date, line, and shift');
    }

    try {
        const requestDate = moment(date, 'YYYY-MM-DD');
        const currentDate = moment().startOf('day'); // Get today's date without time
        const currentTime = moment(); // Get the current time

        // Connect to the SQL database
        await sql.connect(config);

        // Create a new request for the SQL query
        const shiftRequest = new sql.Request();
        shiftRequest.input('shift', sql.Int, shift);

        // Fetch shift details to validate against current time
        const shiftResult = await shiftRequest.query(`
                SELECT ShiftId, ShiftStartTime, ShiftEndTime
                FROM [dbo].[ShiftHeader]
                WHERE ShiftId = @shift
            `);

        if (shiftResult.recordset.length === 0) {
            return res.send('Invalid shift ID provided');
        }

        const shiftData = shiftResult.recordset[0];
        const shiftStartTime = moment(shiftData.ShiftStartTime, 'HH:mm:ss');
        const shiftEndTime = moment(shiftData.ShiftEndTime, 'HH:mm:ss');

        // Check for future dates (no future data allowed)
        if (requestDate.isAfter(currentDate)) {
            return res.send('Future date and shift are not allowed');
        }

        // Check for the current day
        if (requestDate.isSame(currentDate, 'day')) {
            // Check if the current shift is running and prevent fetching data for it
            if (currentTime.isBetween(shiftStartTime, shiftEndTime) && shiftData.ShiftId === shift) {
                return res.send('Current shift data is not allowed');
            }

            // If the shift is after the current time, prevent future shifts on the same day
            if (shiftStartTime.isAfter(currentTime) && shiftData.ShiftId === shift) {
                return res.send('Future shift data is not allowed');
            }
        }

        // If the date is in the past, allow the request for any shift
        // If requestDate is in the past, we don't check for the shift timing; we allow access to it.

        // Get shift name and SKU category (treat skuCategoryCode as line and shiftName as shift)
        //const { shiftName, skuCategoryCode } = await reUsableFun.getShiftAndSKUCategory(shift, line, config);
        const [{ shiftName, skuCategoryCode }, { shiftGroupName,shiftCellColor }] =
                  await Promise.all([
                reUsableFun.getShiftAndSKUCategory(shift, line, config),
                reUsableFun.getShiftGroupName(shift, date, line, config),
        
              ]);

        // Prepare the SQL request with parameters
        const partOrderRequest = new sql.Request();
        partOrderRequest.input('date', sql.Date, new Date(date));
        partOrderRequest.input('line', sql.Int, line);
        partOrderRequest.input('shift', sql.Int, shift);

        const partOrderDataQuery = `
                SELECT 
                    [PatternNo],
                    [PartSeq],
                    [PlanStartTime],
                    [PlanEndTime],
                    [LoadTime],
                    [DieStorageBay],
                    [DieSetID],
                    [PatternLotSize],
                    [PlanLotsize],
                    [RecLotSize],
                    [LotNo],
                    [Status],
                    [ActualStartTime],
                    [ActualEndTime],
                    [ActualLoadTime],
                    [ActualLotsize],
                    [Reason],
                    [PatternActualDataID]
                FROM [SSPCSdbo].[PatternActualData]
                WHERE CAST([Date] AS DATE) = @date
                    AND [LineID] = @line
                    AND [ShiftID] = @shift
                    order  by PartSeq asc;
            `;

        const partOrderDataResult = await partOrderRequest.query(partOrderDataQuery);

        let totalProdOrderRaw = 0;
        let totalProdOrderFinal = 0;
        let totalActualLotRaw=0;

        // Initialize the grid array
        const grid = [];

        for (const record of partOrderDataResult.recordset) {
            // Get BOM type details
            const { bomType: BOMType, dieStorageBay } = await reUsableFun.getBOMTypeDetails(record.DieSetID, config);

            const { rowColor, statusTextColor, statusTextBgColor } = await reUsableFun.getRowColorsByStatusForPartOrder(record.Status, config);

            // Calculate pallets and format lot sizes
            const qpc = await reUsableFun.getQPC(BOMType, config) || 1;
            const lotSize = record.PatternLotSize || 0;
            const pallets = Math.floor(record.PlanLotsize / qpc);

            const ptnPallets = Math.floor(record.PatternLotSize / qpc);
            const recPallets = Math.floor(record.RecLotSize / qpc);
            // console.log("pallets",recPallets)
            // console.log("planlotsize",record.RecLotSize)




            let loadTimeInMinutes = "NA";  // Default value for LoadTime

            if (record.LoadTime && !isNaN(record.LoadTime)) {
                loadTimeInMinutes = Math.round(record.LoadTime / 60); // Convert to minutes and round to nearest integer
            }

            let actualloadTimeInMinutes = "NA";  // Default value for LoadTime

            if (record.ActualLoadTime && !isNaN(record.ActualLoadTime)) {
                actualloadTimeInMinutes = Math.round(record.ActualLoadTime / 60); // Convert to minutes and round to nearest integer
            }


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

                ////childpart
                const childPart = skuResult.recordset[0]?.SKUCode || 'Unknown SKUCode';


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

                const loadTime = record.LoadTime ? Math.round(record.LoadTime / 60) : 0;
                const actualLoadTime = record.ActualLoadTime ? Math.floor(record.ActualLoadTime / 60) : 0;

                const deviationUnits = (prodOrder || 0) - (actualLotSize || 0);
                const deviationPallets = Math.floor(deviationUnits / qpc);
                const deviation = `${deviationPallets}(${deviationUnits})`;



                if (record.Status === 5 || record.Status === 6) {
                    totalProdOrderRaw += prodOrder;
                    totalProdOrderFinal += Math.floor(prodOrder / qpc);
                }
                if (record.Status === 5 || record.Status === 6 ) {
                    totalActualLotRaw += actualLotSize;
                }




                // Push data to grid
                grid.push({
                    line: skuCategoryCode || "NA",     
                    shift: shiftName || "NA",   
                    shiftgroup: shiftGroupName  || "NA",
                    ptns: record.PatternNo || "NA",
                    seq: record.PartSeq || "NA",
                    planStartAndEnd: `${record.PlanStartTime} - ${record.PlanEndTime}`,
                    loadTime: loadTimeInMinutes,
                    dieBay: dieStorageBay || "NA",
                    dieSet: BOMType || "NA",
                    childPart: childPart,
                    ptnLotSize,
                    recLotSize: `${recLotSizeFinal}(${recLotSize})`,
                    planLotSize: `${prodOrderFinal}(${prodOrder})`,
                    status: reUsableFun.ActionTypesReverse[record.Status],
                    lotNo: record.LotNo || "NA",
                    actualLotSize: actualLotSize || "NA",
                    actualStartAndEnd: `${record.ActualStartTime} - ${record.ActualEndTime}` || "---:---:--",
                    actualLoadTime: actualloadTimeInMinutes,
                    reason: record.Reason || "----",
                    rowColor,
                    statusTextColor,
                    statusTextBgColor,
                    delay: record.ActualLoadTime ? actualLoadTime - loadTime : "NA",
                    deviation: deviation
                });
            }
        }

        grid.push({
            line: "",      
            shift: '',   
            shiftgroup: '',
            ptns: "Total",
            seq: "",
            planStartAndEnd: '',
            loadTime: '',
            dieSet: '',
            dieBay:'',
            ptnLotSize: '',
            childPart: '',
            recLotSize: '', // Use the calculated recLotSize here
            prodOrder: '', // Use the calculated prodOrder here
            planLotSize: `${totalProdOrderFinal}(${totalProdOrderRaw})`,
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

        // Format the response, using shiftName as shift and skuCategoryCode as line
        const response = {
            header: {
                date: date,
                line: skuCategoryCode, // Use skuCategoryCode as line
                shift: shiftName // Use shiftName as shift
            },
            grid: grid
        };

        // Send the response
        res.json(response);

    } catch (error) {
        console.error('Error fetching part order data:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching part order details' });
    }
};

    

exports.getShift=async(req, res)=> {
 
    try {
        const pool = await sql.connect(config);
        const { lineId } = req.body; // Get lineId from the request body
 
        // Query to fetch distinct LineName and ShiftCode based on lineId
        const lineQuery = `
            SELECT DISTINCT
                LineName,
                ShiftCode
            FROM
                SSPCSdbo.PatternShiftMapping
            WHERE
                LineName = (
                    SELECT TOP(1)
                        SKUCategoryCode
                    FROM
                        SKUCategory
                    WHERE
                        SKUCategoryID = @lineId
                )
        `;
 
        // Execute the query for line data
        const lineResult = await pool.request()
            .input('lineId', sql.Int, lineId) // Assuming lineId is an integer
            .query(lineQuery);
       
        const lineData = lineResult.recordset;
 
        // Log the line data to check the results
        console.log('Line Data:', lineData);
 
        // Check if there are no line data found
        if (lineData.length === 0) {
            return res.status(404).json({ message: 'No line data found for the provided lineId.' });
        }
 
        // Extract the shift codes from line data
        const shiftCodes = lineData.map(line => line.ShiftCode);
 
        // Query to fetch the shifts based on the ShiftCodes found in line data
        const ShiftsQuery = `
            SELECT
                [ShiftId],
                [ShiftName],
                [ShiftCode],
                [ShiftStartTime],
                [ShiftEndTime],
                [CreatedBy],
                [CreatedDate],
                [ModifiedBy],
                [ModifiedDate]
            FROM  
                [dbo].[ShiftHeader]
            WHERE
                ShiftCode IN (${shiftCodes.map(code => `'${code}'`).join(', ')})
            ORDER BY
                [ShiftStartTime]
        `;
 
        // Execute the query for shifts
        const ShiftsResult = await pool.request().query(ShiftsQuery);
        const Shifts = ShiftsResult.recordset;
 
        // Check if there are no shifts found
        if (Shifts.length === 0) {
            return res.status(404).json({ message: 'No shifts available for the specified line.' });
        }
 
        // Return only the shifts array in the response
        res.status(200).json(Shifts);
 
    }
    catch (error) {
        console.error('Error fetching shift details:', error);
        res.status(500).send('Server error');
    }
}
