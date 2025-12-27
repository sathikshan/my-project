const sql = require('mssql/msnodesqlv8');
const config = require("../../../config/dbConfig");
const reUsableFun = require('../../../utils/reUsableFun');

async function getNextWorkingShiftDateAndShift(
  currentDate,
  shiftName,
  line,
  config
) {
  const pool = await sql.connect(config);
  const skuCategoryResult = await pool
    .request()
    .input("line", sql.NVarChar, line)
    .query("SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID = @line");
  
  const SKUCategoryCode =
    skuCategoryResult.recordset.length > 0
      ? skuCategoryResult.recordset[0].SKUCategoryCode
      : null;

  if (!currentDate || isNaN(new Date(currentDate))) {
    logger.customerLogger.error(`Invalid date value: ${currentDate} in getNextWorkingShiftDateAndShift method.`);
    throw new Error(`Invalid date value: ${currentDate}`);
  }

  const shiftOrder = ["N_A", "N_B", "N_C"];
  let nextDateObj = new Date(`${currentDate}T00:00:00Z`);
  let nextShiftIndex = shiftOrder.indexOf(shiftName) + 1;
  let foundWorkingShift = false;
  let nextShift, nextDate, nextShiftId;

  while (!foundWorkingShift) {
    if (nextShiftIndex >= shiftOrder.length) {
      nextDateObj.setDate(nextDateObj.getDate() + 1);
      nextShiftIndex = 0;
    }

    nextShift = shiftOrder[nextShiftIndex];
    nextDate = nextDateObj.toISOString().split("T")[0];

    const shiftResult = await pool
      .request()
      .input("ShiftCode", sql.NVarChar, nextShift)
      .query("SELECT ShiftId FROM ShiftHeader WHERE ShiftCode = @ShiftCode");
    
    nextShiftId =
      shiftResult.recordset.length > 0
        ? shiftResult.recordset[0].ShiftId
        : null;

    const isWorking = await reUsableFun.getIsWorkingStatus(
      nextDate,
      nextShiftId,
      SKUCategoryCode,
      config
    );

    if (isWorking) {
      foundWorkingShift = true;
      break;
    }

    nextShiftIndex++;
  }
  return { nextDate, nextShiftId };
}

exports.nextShiftDetails = async(req, res) => {
  const pool = await sql.connect(config);
  const startTime = Date.now();
  let { currentDate, currentTime, shift, line } = req.body.header;
  const processedDieSets = [];

  try {
    // Parse current date and time safely
    let currentDateObj = new Date(`${currentDate}T${currentTime}Z`);

    // Check if the date is valid
    if (isNaN(currentDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid date or time format" });
    }

    // Get the ShiftCode and ShiftId from the ShiftHeader table
    const shiftQuery = `
            SELECT ShiftCode, ShiftId, ShiftEndTime
            FROM [dbo].[ShiftHeader] 
            WHERE ShiftId = @shift;
        `;
    const shiftResult = await pool
      .request()
      .input("shift", sql.Int, shift)
      .query(shiftQuery);

    const shiftCode = shiftResult.recordset[0]?.ShiftCode;
    const shiftId = shiftResult.recordset[0]?.ShiftId;
    const shiftEndTime = shiftResult.recordset[0]?.ShiftEndTime;

//     if(shiftCode === "N_C"){
//       //const currentDate = '2025-06-23';

// // Convert to Date object
// const date = new Date(currentDate);

// // Subtract one day (1 day = 24 * 60 * 60 * 1000 ms)
// date.setDate(date.getDate() - 1);

// // Format back to 'YYYY-MM-DD'
// const year = date.getFullYear();
// const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
// const day = String(date.getDate()).padStart(2, '0');

// const previousDate = `${year}-${month}-${day}`;

// console.log(previousDate); // Output: '2025-06-22'
// currentDate = previousDate;

//     }
if (shiftCode === "N_C") {
  // Get current time in HH:MM:SS
  const now = new Date();
  const currentTime = now.toTimeString().split(" ")[0]; // e.g., "00:15:00"

  // If current time is >= 00:00:00 (which it always is) but we want:
  // If current time is in range 00:00:00 to shift end time (e.g., "07:00:00")
  // OR simply: if current time is less than shift start time ("23:45:00"),
  // it means it crossed midnight.

  if (currentTime >= "00:00:00" && currentTime < "23:45:00") {
    // Subtract one day from currentDate
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    currentDate = `${year}-${month}-${day}`;
    console.log("Adjusted date in next shift:",currentDate);
  }
}


    if (!shiftCode || !shiftId || !shiftEndTime) {
      return res.status(400).json({ error: "Invalid shift details." });
    }

    // Determine the next shift and date based on ShiftCode
    let nextShift, nextDate, nextShiftId;

    ({ nextDate, nextShiftId } =
          await getNextWorkingShiftDateAndShift(
            currentDate,
            shiftCode,
            line,
            config
          ));
    nextShift = nextShiftId;

    // Get ShiftGroupName using the reusable function
    const { shiftGroupName, shiftCellColor } = await reUsableFun.getShiftGroupName(
      nextShift, currentDate, line, config
    );

    const { shiftName, skuCategoryCode } = await reUsableFun.getShiftAndSKUCategory(
      nextShift,
      line,
      config
    );

    // Query PatternActualData table for status 'Queued' and 'In Progress'
    const patternActualDataQuery = `
         SELECT *
         FROM [SSPCSdbo].[PatternActualData]
         WHERE [Date] = @currentDate
             AND [ShiftID] = @shift
             AND [LineID] = @line
             AND [Status] IN (2, 4)
         ORDER BY [PartSeq] ASC;
     `;

    const patternActualDataResult = await pool
      .request()
      .input("currentDate", sql.Date, currentDate)
      .input("shift", sql.Int, shift)
      .input("line", sql.Int, line)
      .query(patternActualDataQuery);

    // Populate grid with data from PatternActualData
    const grid = [];

    for (const record of patternActualDataResult.recordset) {
      const planEndTimeObj = new Date(`${currentDate}T${record.PlanEndTime}Z`);

      // Include only if PlanEndTime is greater than ShiftEndTime
      if (planEndTimeObj > new Date(`${currentDate}T${shiftEndTime}Z`)) {
        const { bomType: bomType, dieStorageBay } = await reUsableFun.getBOMTypeDetails(
          record.DieSetID
        );
    processedDieSets.push(bomType);

        // Calculate pallets
        const qpc = (await reUsableFun.getQPC(bomType));

        const lotSize = record.PatternLotSize
          ? record.PatternLotSize
          : record.PlanLotsize;
        const pallets = Math.floor(lotSize / qpc);
        const status = reUsableFun.ActionTypesReverse[8];
        const { rowColor, statusTextColor, statusTextBgColor } =
          await reUsableFun.getRowColorsByStatus(reUsableFun.ActionTypes[status]);

        // Query to get KitItemID(s) and PerUnitQuantity from KitBOM using bomType
        const kitItemIDQuery = `
                SELECT [KitItemID], [BOMSequence], [PerUnitQuantity] 
                FROM [dbo].[KitBOM] 
                WHERE [BOMType] = @bomType
            `;

        const kitItemIDResult = await pool
          .request()
          .input("bomType", sql.VarChar, bomType)
          .query(kitItemIDQuery);

        for (const kitItem of kitItemIDResult.recordset) {
          const skuQuery = `
                        SELECT [SKUCode] 
                        FROM [dbo].[SKU] 
                        WHERE [SKUID] = @kitItemID
                `;

          const skuResult = await pool
            .request()
            .input("kitItemID", sql.Int, kitItem.KitItemID)
            .query(skuQuery);

          const childPart =
            skuResult.recordset[0]?.SKUCode || "Unknown SKUCode";

          grid.push({
            ptns: record.PatternNo,
            seq: record.PartSeq,
            planStartAndEnd: `${record.PlanStartTime} - ${record.PlanEndTime}`,
            loadTime: record.LoadTime,
            ptnLotSize: `${pallets}(${lotSize})`,
            dieSet: bomType,
            dieBay: dieStorageBay,
            childPart: childPart,
            status: status,
            bomQty: kitItem.PerUnitQuantity, // Placeholder for bomQty, as not present in PatternActualData
            bomSeq: kitItem.BOMSequence,
            rowColor: rowColor,
            statusTextColor: statusTextColor,
            statusTextBgColor: statusTextBgColor,
            reason: record.Reason || "NA", // Include reason if available
          });
        }
      }

      //}
    }

    // Check if data exists in PatternActualData table
const actualDataQuery = `
SELECT *
FROM [SSPCSdbo].[PatternActualData] 
WHERE [Date] = @nextDate
  AND [ShiftID] = @nextShift
  AND [LineID] = @line
`;

const actualDataResult = await pool
.request()
.input("nextDate", sql.Date, nextDate)
.input("nextShift", sql.Int, nextShift)
.input("line", sql.Int, line)
.query(actualDataQuery);

let patternQuery;
if (actualDataResult.recordset.length > 0) {
// Fetch from PatternActualData if data exists
patternQuery = `
  SELECT 
      *
  FROM [SSPCSdbo].[PatternActualData]
  WHERE [Date] = @nextDate
      AND [ShiftID] = @nextShift
      AND [LineID] = @line
      ORDER BY [PartSeq] ASC
`;
} else {
// Fetch from PatternDataInterpretation if no data in PatternActualData
patternQuery = `
  SELECT 
      [PatternInterpretationID],
      [PatternUploadID],
      [ScheduledDate],
      [LineID],
      [ShiftID],
      [PatternNo],
      [PartSeq],
      [PatternStartTime],
      [PatternEndTime],
      [PatternLoadTime],
      [DieSetID]
  FROM [SSPCSdbo].[PatternDataInterpretation]
  WHERE [ScheduledDate] = @nextDate
      AND [ShiftID] = @nextShift
      AND [LineID] = @line
`;
}

const patternResult = await pool
.request()
.input("nextDate", sql.Date, nextDate)
.input("nextShift", sql.Int, nextShift)
.input("line", sql.Int, line)
.query(patternQuery);

for (const record of patternResult.recordset) {
const { bomType, dieStorageBay } = await reUsableFun.getBOMTypeDetails(
  record.DieSetID
);

// Convert PatternLoadTime from seconds to minutes
const loadTime = record.LoadTime 
  ? Math.floor(record.LoadTime / 60) 
  : (record.PatternLoadTime ? Math.floor(record.PatternLoadTime / 60) : 0);


// Query to get PatternLotSize from PatternRawDataUpload using bomType
const patternLotSizeQuery = `SELECT [RoundUpLotSize] FROM [SSPCSdbo].[PatternRawDataUpload] WHERE [DieSet] = @bomType AND [PatternUploadID] = @patternUploadID`;

      const patternLotSizeResult = await pool
        .request()
        .input("bomType", sql.VarChar, bomType)
        .input("patternUploadID", sql.Int, record.PatternUploadID)
        .query(patternLotSizeQuery);

const ptnLotSize =
  patternLotSizeResult.recordset[0]?.RoundUpLotSize ||
  record.PatternLotSize;

// Calculate pallets
const qpc = (await reUsableFun.getQPC(bomType));
const pallets = Math.floor(ptnLotSize / qpc);

// Query to get KitItemID(s) and PerUnitQuantity from KitBOM using bomType
const kitItemIDQuery = `
  SELECT [KitItemID], [PerUnitQuantity], [BOMSequence]
  FROM [dbo].[KitBOM] 
  WHERE [BOMType] = @bomType
`;

const kitItemIDResult = await pool
  .request()
  .input("bomType", sql.VarChar, bomType)
  .query(kitItemIDQuery);

for (const kitItem of kitItemIDResult.recordset) {
  const skuQuery = `
      SELECT [SKUCode] 
      FROM [dbo].[SKU] 
      WHERE [SKUID] = @kitItemID
  `;

  const skuResult = await pool
      .request()
      .input("kitItemID", sql.Int, kitItem.KitItemID)
      .query(skuQuery);

  const childPart = skuResult.recordset[0]?.SKUCode || "Unknown SKUCode";
  const status = record.Status ?? 7;

  grid.push({
      ptns: record.PatternNo,
      seq: record.PartSeq,
      planStartAndEnd: record.PlanStartTime && record.PlanEndTime 
      ? `${record.PlanStartTime} - ${record.PlanEndTime}` 
      : `${record.PatternStartTime} - ${record.PatternEndTime}`,
      loadTime: loadTime,
      ptnLotSize: `${pallets}(${ptnLotSize})`,
      dieSet: bomType,
      dieBay: dieStorageBay,
      childPart: childPart,
      status: reUsableFun.ActionTypesReverse[status],
      bomQty: kitItem.PerUnitQuantity,
      bomSeq: kitItem.BOMSequence,
      rowColor: "#fff",
      statusTextColor: "#000",
      statusTextBgColor: "#e9e8eb",
  });
}
}


    // Create the response
    res.send({
      header: {
        currentDate: nextDate,
        currentTime: currentTime,
        shift: shiftName,
        line: skuCategoryCode,
        lineID: line,
        shiftGroup: shiftGroupName,
        shiftCellColor: shiftCellColor,
      },
      grid: grid,
    });
    //console.log('Next shift dieSets', processedDieSets);
    console.log(
      `nextShift Execution time: ${(Date.now() - startTime) / 1000} seconds`
    );
  } catch (error) {
    console.error("Error fetching next shift details:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching next shift details" });
  }
}