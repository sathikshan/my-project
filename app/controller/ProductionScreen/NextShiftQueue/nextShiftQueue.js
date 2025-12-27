const sql = require('mssql/msnodesqlv8');
const config = require("../../../config/dbConfig");
const reUsableFun = require('../../../utils/reUsableFun');
const logger = require("../../../utils/logger");
let globalIdCounter = 1;
let globalEmptyPalletsIdCounter = 1; 
let globalPartIdCounter = 1;
let globalLoadTimeCounter = 1;
let globalLotAdjustmentCounter = 1;
let globalPlannedLineCounter = 1;


async function fetchMaterialsDetailForDieSet(dieSet, idCounter) {
  const pool = await sql.connect(config);
  const startTime = Date.now();
  const materials = [];

  const query = `
    SELECT 
        kb.KitID,
        si.SKUInventoryID,
        sku.SKUCode,
        sc.SKUCostID,
        ISNULL((
            SELECT SUM(s.BucketQuantityInStorageUOM)
            FROM [dbo].[SKUStock] s
            JOIN [dbo].[StockBucket] b ON s.StockBucketID = b.StockBucketID
            WHERE s.SKUCostID = sc.SKUCostID 
            AND b.StockBucketCode IN ('OnHand', 'AwaitingPress', 'WashingWIP', 'Washed', 'PressWIP')
        ), 0) AS TotalStockQuantity,
        ISNULL((
            SELECT SUM(s.BucketQuantityInStorageUOM)
            FROM [dbo].[SKUStock] s
            JOIN [dbo].[StockBucket] b ON s.StockBucketID = b.StockBucketID
            WHERE s.SKUCostID = sc.SKUCostID 
            AND b.StockBucketCode IN ('MaterialOnhold', 'ReceivedOnHold', 'WashingOnHold')
        ), 0) AS TotalHoldQuantity,
        ISNULL((
            SELECT SUM(s.BucketQuantityInStorageUOM)
            FROM [dbo].[SKUStock] s
            JOIN [dbo].[StockBucket] b ON s.StockBucketID = b.StockBucketID
            WHERE s.SKUCostID = sc.SKUCostID 
            AND b.StockBucketCode = 'OnOrder'
        ), 0) AS OnOrderQuantity,
        ISNULL(skm.Quantity, 0) AS SkidQuantity
    FROM 
        [dbo].[KitBOM] kb
        INNER JOIN [dbo].[SKUInventory] si ON kb.KitID = si.SKUID
        INNER JOIN [dbo].[SKU] sku ON si.SKUID = sku.SKUID
        INNER JOIN [dbo].[SKUCost] sc ON si.SKUInventoryID = sc.SKUInventoryID
        LEFT JOIN [dbo].[SKUPackMapping] skm ON skm.SKUID = si.SKUID
    WHERE 
        kb.BOMType = @dieSet
    GROUP BY 
        kb.KitID, si.SKUInventoryID, sku.SKUCode, sc.SKUCostID, skm.Quantity;
  `;

  const result = await pool
    .request()
    .input("dieSet", sql.VarChar, dieSet)
    .query(query);

  result.recordset.forEach((record) => {
    materials.push({
      id: idCounter++, // Increment the global ID counter
      stock: record.TotalStockQuantity,
      skidQty: record.SkidQuantity,
      onHold: record.TotalHoldQuantity,
      onOrder: record.OnOrderQuantity, // Now correctly populating OnOrder
      bomType: dieSet, // Using dieSet as bomType here
      material: record.SKUCode,
    });
  });

  console.log(
    `Fetch Material Execution time: ${(Date.now() - startTime) / 1000} seconds`
  );

  return materials;
}

async function fetchLoadTimeCalculationsForDieSet(dieSet, skuCategoryCode,ShiftID,actualDate,actualID,idCounter) {
  try {
    const pool = await sql.connect(config);
    const startTime = Date.now();
 
const loadTimeQuery = `
select * from SSPCSdbo.PatternRawDataUpload where PatternUploadID in (
select PatternUploadID from SSPCSdbo.PatternDataInterpretation where PatternInterpretationID in (
select PatternInterpretationID from SSPCSdbo.PatternActualData where LineID=(select SKUCategoryID from SKUCategory where SKUCategoryCode=@skuCategoryCode)
and DieSetID = (select DieSetID from SSPCSdbo.BOMTypeMaster where DieSet = @dieSet)
and Date=@actualDate and ShiftID=@ShiftID
)
)
`;

    const loadTimeResult = await pool
      .request()
      .input("dieSet", sql.VarChar, dieSet)
      .input("skuCategoryCode", sql.VarChar, skuCategoryCode)
      .input("actualDate", sql.VarChar, actualDate)
     .input("ShiftID", sql.Int, ShiftID)
      .query(loadTimeQuery);
 
let loadTimeCalculationsArr =[];
if(loadTimeResult.recordset.length > 0){
  for(record of loadTimeResult.recordset) {
    loadTimeCalculations = {
      id: idCounter++, // Increment the idCounter for each record
      udTime: parseFloat((record.UDTime / 60).toFixed(1)),
      ctTime: parseFloat((record.CTTime / 60).toFixed(1)),
      qcTime: parseFloat((record.QCTime / 60).toFixed(1)),
      mct: parseFloat((record.MaterialChangeoverTimePerChangeover / 60).toFixed(1)),
      pct: parseFloat((record.PalletChangeoverTimePerChangeover / 60).toFixed(1)),
      sdTime: parseFloat((record.SDTime / 60).toFixed(1)),
      spm: parseFloat((record.SPS * 60).toFixed(1)),
      efficiency: record.Efficiency,
      lineProdTime: parseFloat((record.LineProductionTime / 60).toFixed(1)),
      totalProdTime: parseFloat((record.TotalProductionTime / 60).toFixed(1)),
      sdWaitTime: parseFloat((record.SDWaitTime / 60).toFixed(1)),
      sdLineProdTime: parseFloat((record.SDLineProductionTime / 60).toFixed(1)),
      efficiencyPT: parseFloat((record.EfficiencyPT / 60).toFixed(1)),
      bomType: record.DieSet,
  };
  
      //console.log("mct:",mct);
      console.log("Efficiency PT",Math.floor(record.EfficiencyPT/60));
      console.log("DieSet", record.DieSet);
      loadTimeCalculationsArr.push(loadTimeCalculations);
    };

}else{
let result = await reUsableFun.getLoadTimeDetails(dieSet, skuCategoryCode, actualID, config);
loadTimeCalculations = {
  id: idCounter++, // Increment the idCounter for each record
  udTime: parseFloat((result.UDTime / 60).toFixed(1)),
  ctTime: parseFloat((result.CTTime / 60).toFixed(1)),
  qcTime: parseFloat((result.QCTime / 60).toFixed(1)),
  mct: parseFloat((result.MaterialChangeoverTimePerChangeOverTime / 60).toFixed(1)),
  pct: parseFloat((result.PalletChangeoverTimePerChangeover / 60).toFixed(1)),
  sdTime: parseFloat((result.SDTime / 60).toFixed(1)),
  spm: parseFloat((result.SPS * 60).toFixed(1)),
  efficiency: result.Efficiency,
  lineProdTime: parseFloat((result.LineProductionTime / 60).toFixed(1)),
  totalProdTime: parseFloat((result.TotalProductionTime / 60).toFixed(1)),
  sdWaitTime: parseFloat((result.SDWaitTime / 60).toFixed(1)),
  sdLineProdTime: parseFloat((result.SDLineProductionTime / 60).toFixed(1)),
  efficiencyPT: parseFloat((result.EfficiencyPT / 60).toFixed(1)),
  bomType: dieSet,
};

loadTimeCalculationsArr.push(loadTimeCalculations);

}
    console.log(
      `Load Time Execution time: ${(Date.now() - startTime) / 1000} seconds`
    );
    // Return the array of load time calculations
    return loadTimeCalculationsArr;
  } catch (error) {
    console.error("Error fetching load time calculations for dieSet:", error);
    throw error;
  }
}

async function fetchLotAdjustmentsForDieSet(
    dieSet,
    actualID,
    globalLotAdjustmentCounter,
    ptnLotSize,
    planLotSize
  ) {
    const pool = await sql.connect(config);
    try {
      const startTime = Date.now();
      const lotAdjustments = [];
  
      // Step 1: Query to get kitItemID(s) from KitBOM
      const kitBOMQuery = `
              SELECT KitItemID,  BOMSequence
              FROM KitBOM
              WHERE BOMType = @dieSet
          `;
  
      const kitBOMResult = await pool
        .request()
        .input("dieSet", sql.VarChar, dieSet)
        .query(kitBOMQuery);
  
      //const kitItemIDs = kitBOMResult.recordset.map((record) => record.KitItemID);
      const kitItemIDs = kitBOMResult.recordset;
  
      if (kitItemIDs.length === 0) {
        throw new Error(`No kitItemID found for BOMType: ${dieSet}`);
      }
      const qpc = await reUsableFun.getQPC(dieSet,config);
  
      // Step 2: For each kitItemID, query to get SKUCode from SKU
      for (const kitItem of kitItemIDs) {
        const { KitItemID, BOMSequence } = kitItem;
        const skuQuery = `
                  SELECT SKUCode
                  FROM SKU
                  WHERE SKUID = @KitItemID
              `;
  
        const skuResult = await pool
          .request()
          .input("kitItemID", sql.Int, KitItemID)
          .query(skuQuery);
  
        const childPart = skuResult.recordset[0]?.SKUCode || "Unknown SKUCode";
  
        const planLotsizeQuery = `
                  SELECT RecomendedOrder, ProductionOrder
                  FROM [SSPCSdbo].[PlanLotsizeCalculation]
                  WHERE PatternActualDataID = @actualID AND kitItemId = @KitItemID;
              `;
  
        const planLotsizeResult = await pool
          .request()
          .input("actualID", sql.Int, actualID)
          .input("KitItemID", sql.Int, KitItemID)
          .query(planLotsizeQuery);
  
        const { RecomendedOrder, ProductionOrder } =
          planLotsizeResult.recordset[0] || {};
        console.log(RecomendedOrder, ProductionOrder);
  
        const recOrderPallets = Math.floor(RecomendedOrder / qpc);
        const prodOrderPallets = Math.floor(ProductionOrder / qpc);
        console.log(recOrderPallets, prodOrderPallets);
  
        const recOrderFormatted = `${recOrderPallets}(${RecomendedOrder})`;
        const prodOrderFormatted = `${prodOrderPallets}(${ProductionOrder})`;
        console.log(recOrderFormatted, prodOrderFormatted);
  
        // Create a unique ID for each record
        const uniqueId = globalLotAdjustmentCounter++;
  
        // Create the lot adjustment record
        const lotAdjustmentRecord = {
          id: uniqueId,
          parts: childPart,
          kitItemID:KitItemID,
          bomSeq: BOMSequence, //hardcoded value
          dieSet: dieSet,
          qpc: qpc,
          ptnLotSize: ptnLotSize,
          recOrder: recOrderFormatted,
          planLotSize: planLotSize,
          prodOrder: prodOrderFormatted,
        };
  
        // Add the record to the array
        lotAdjustments.push(lotAdjustmentRecord);
      }
      console.log(
        `Lot Adjustments Execution time: ${
          (Date.now() - startTime) / 1000
        } seconds`
      );
      // Return the lot adjustments array
      return lotAdjustments;
    } catch (error) {
      console.error("Error fetching lot adjustments for dieSet:", error);
      throw error;
    }
}

async function fetchPalletsDetailForDieSet(dieSet, idCounter) {
  const pool = await sql.connect(config);
    const startTime = Date.now();
    const emptyPallets = [];

    const kitItemAndPackTypeQuery = `SELECT DISTINCT 
      kb.KitItemID,
      spm.PackTypeID,
      pt.PackTypeName AS palletType,
      SUM(CASE 
          WHEN s.StockBucketID IS NULL THEN 1 
          ELSE 0 
      END) AS emptyCount,
      SUM(CASE 
          WHEN b.StockBucketCode IN ('WeldReturnNG', 'RepairedPartsNG', 'WeldReturnPartsNG', 'PartsNG', 'PartsBadLot', 'RepairWIP') THEN 1 
          ELSE 0 
      END) AS onHoldCount,
      SUM(CASE 
          WHEN b.StockBucketCode = 'WeldWIP' THEN 1 
          ELSE 0 
      END) AS wipCount
  FROM [dbo].[KitBOM] kb
  JOIN [dbo].[SKUPackMapping] spm ON kb.KitItemID = spm.SKUID
  JOIN [dbo].[PackType] pt ON spm.PackTypeID = pt.PackTypeID
  LEFT JOIN [dbo].[Pack] p ON p.PackTypeID = spm.PackTypeID
  LEFT JOIN [dbo].[SKUStock] s ON p.LocationID = s.LocationID
  LEFT JOIN [dbo].[StockBucket] b ON s.StockBucketID = b.StockBucketID
  WHERE kb.BOMType = @dieSet
  GROUP BY 
      kb.KitItemID,
      spm.PackTypeID,
      pt.PackTypeName;
  `;
  
    const kitItemAndPackTypeResult = await pool
      .request()
      .input("dieSet", sql.VarChar, dieSet)
      .query(kitItemAndPackTypeQuery);
  
    // Step 2: Process each record from the combined query
    for (const record of kitItemAndPackTypeResult.recordset) {
      const { palletType, emptyCount, onHoldCount, wipCount } = record;
  
      // Add to the emptyPallets array
      emptyPallets.push({
        id: idCounter++, // Increment the ID counter for uniqueness
        palletType: palletType,
        empty: emptyCount || 0,
        onHold: onHoldCount || 0,
        wip: wipCount || 0,
        bomType: dieSet,
      });
    }
    console.log(
      `Fetch Pallets Execution time: ${(Date.now() - startTime) / 1000} seconds`
    );
    return emptyPallets;
}

async function fetchPartsDetailForDieSet(
  dieSet,
  actualID,
  idCounter,
  shiftName,
  skuCategoryCode,
  currentDate,
  user
) {
  const pool = await sql.connect(config);
  console.log("Parts Details:", shiftName, skuCategoryCode, currentDate);

  // Step 1: Fetch the status
  const statusQuery = `
    SELECT [PlanLotSize], [RecLotSize], [PlanType], [Status]
    FROM [SSPCSdbo].[PatternActualData]
    WHERE [PatternActualDataID] = @actualID;
  `;

  const statusResult = await pool
    .request()
    .input("actualID", sql.Int, actualID)
    .query(statusQuery);

  let status, planLotSize, recLotSize, planType;
  if (statusResult.recordset.length > 0) {
    status = statusResult.recordset[0].Status;
    planLotSize = statusResult.recordset[0].PlanLotSize;
    recLotSize = statusResult.recordset[0].RecLotSize;
    planType = statusResult.recordset[0].PlanType;
    console.log(
      "Status planLotsize, recLotSize, planType, user",
      status,
      planLotSize,
      recLotSize,
      planType,
      user
    );
  } else {
    throw new Error("No data found for the given actualID.");
  }

  if (planType === 1) {
    // Step 2: Check the status and call the appropriate function
    if (status === reUsableFun.ActionTypes["To be Scheduled"]) {
      return await handleToBeScheduled(
        dieSet,
        actualID,
        idCounter,
        planLotSize,
        recLotSize,
        shiftName,
        skuCategoryCode,
        currentDate,
        user
      );
    } else if (
      status === reUsableFun.ActionTypes["Queued"] ||
      status === reUsableFun.ActionTypes["Skipped"] ||
      status === reUsableFun.ActionTypes["In Progress"] ||
      status === reUsableFun.ActionTypes["Discontinued"] ||
      status === reUsableFun.ActionTypes["Completed"]
    ) {
      return await handleOtherStatuses(dieSet, actualID, idCounter, user);
    }
  }

  if (planType === 2) {
    if(status === reUsableFun.ActionTypes["To be Scheduled"]){
      return await handleToBeScheduled(
        dieSet,
        actualID,
        idCounter,
        planLotSize,
        recLotSize,
        shiftName,
        skuCategoryCode,
        currentDate,
        user
      );
    }else if (
      status === reUsableFun.ActionTypes["Queued"] ||
      status === reUsableFun.ActionTypes["Skipped"] ||
      status === reUsableFun.ActionTypes["In Progress"] ||
      status === reUsableFun.ActionTypes["Discontinued"] ||
      status === reUsableFun.ActionTypes["Completed"]
    ) {
      return await handleOtherStatuses(dieSet, actualID, idCounter, user);
    }
    
  }

  if (planType === 3) {
    if(status === reUsableFun.ActionTypes["To be Scheduled"]){
      return await handleToBeScheduled(
        dieSet,
        actualID,
        idCounter,
        planLotSize,
        recLotSize,
        shiftName,
        skuCategoryCode,
        currentDate,
        user
      );
  }else if (
    status === reUsableFun.ActionTypes["Queued"] ||
    status === reUsableFun.ActionTypes["Skipped"] ||
    status === reUsableFun.ActionTypes["In Progress"] ||
    status === reUsableFun.ActionTypes["Discontinued"] ||
    status === reUsableFun.ActionTypes["Completed"]
  ) {
    return await handleOtherStatuses(dieSet, actualID, idCounter, user);
  }
  }

  // If no action is needed
  console.log("No action needed for this status.");
  return [];
}

async function handleAddOtherParts(
  dieSet,
  actualID,
  idCounter,
  planLotSize,
  RecLotSize,
  shiftName,
  skuCategoryCode,
  currentDate,
  user,
  status
) {
  const pool = await sql.connect(config);
  const parts = [];
  const partsByBomSequence = {};

  const partsDetailQuery = `
     SELECT 
      k.KitItemID,
      k.BOMSequence,
      s.SKUCode AS part,
      si.SKUInventoryID,
      sc.SKUCostID,
      spm.Quantity AS qpc,
      SUM(CASE 
        WHEN sb.StockBucketCode IN ('PartsStorage', 'PartsOK', 'PartsBadLot') THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS stock,
      SUM(CASE 
        WHEN sb.StockBucketCode IN ('WeldReturnNG', 'RepairedPartsNG', 'WeldReturnPartsNG', 'PartsNG', 'PartsBadLot', 'RepairWIP', 'OnHoldOKParts') THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS onHold,
      SUM(CASE 
        WHEN sb.StockBucketCode = 'KBsReturned' THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS kbsReturned,
      SUM(CASE 
        WHEN sb.StockBucketCode = 'OnOrder' THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS onOrder
    FROM [dbo].[KitBOM] k
    JOIN [dbo].[SKU] s ON k.KitItemID = s.SKUID
    JOIN [dbo].[SKUInventory] si ON s.SKUID = si.SKUID
    JOIN [dbo].[SKUCost] sc ON si.SKUInventoryID = sc.SKUInventoryID
    LEFT JOIN [dbo].[SKUStock] ss ON sc.SKUCostID = ss.SKUCostID
    LEFT JOIN [dbo].[StockBucket] sb ON ss.StockBucketID = sb.StockBucketID
    LEFT JOIN [dbo].[SKUPackMapping] spm ON s.SKUID = spm.SKUID AND spm.IsDefault = 1
    WHERE k.BOMType = @dieSet
    GROUP BY 
      k.KitItemID,
      k.BOMSequence,
      s.SKUCode,
      si.SKUInventoryID,
      sc.SKUCostID,
      spm.Quantity
  `;

  const partsDetailResult = await pool
    .request()
    .input("dieSet", sql.VarChar, dieSet)
    .query(partsDetailQuery);
  console.log("Add Other parts:",partsDetailResult.recordset.length);

  const { DieSetID } = await reUsableFun.getBOMIDDetails(dieSet, config);

  for (const record of partsDetailResult.recordset) {
    const qpc = record.qpc || 1;
    const originalStock = record.stock || 0;
    const stock = Math.floor(originalStock / qpc);

    const kanbansQuery = `
      SELECT TOP 1 TotalPartKanbansInCirculation 
      FROM [SSPCSdbo].[PQDataUpload]
      WHERE Variant = @part
      ORDER BY EffectiveFrom DESC;
    `;

    const kanbansResult = await pool
      .request()
      .input("part", sql.VarChar, record.part)
      .query(kanbansQuery);

    let totalKanbansInCirculation =
      kanbansResult.recordset.length > 0
        ? kanbansResult.recordset[0].TotalPartKanbansInCirculation
        : 0;

    // Additional query to get ShiftChangeoverKanbans
    const shiftChangeoverQuery = `
     SELECT ShiftChangeoverKanbans 
FROM [SSPCSdbo].[ShiftChangeoverStockMaster]
WHERE 
  LineName = @skuCategoryCode
  AND [Variant] = @variant
  AND @currentDate BETWEEN FromDate AND ToDate
  AND (
    -- For the starting date, only shifts from FromShift onward
    (@currentDate = FromDate AND @shiftName >= FromShift)
    
    -- For the ending date, only shifts up to ToShift
    OR (@currentDate = ToDate AND @shiftName <= ToShift)
    
    -- For intermediate dates, all shifts are valid
    OR (@currentDate > FromDate AND @currentDate < ToDate)
  );

   `;
    const shiftChangeoverResult = await pool
      .request()
      .input("shiftName", sql.VarChar, shiftName)
      .input("currentDate", sql.DateTime, currentDate)
      .input("skuCategoryCode", sql.VarChar, skuCategoryCode)
      .input("variant", sql.VarChar, record.part)
      .query(shiftChangeoverQuery);

    if (shiftChangeoverResult.recordset.length > 0) {
      const shiftChangeoverKanbans =
        shiftChangeoverResult.recordset[0].ShiftChangeoverKanbans || 0;
      totalKanbansInCirculation += shiftChangeoverKanbans;
    }

    const onOrderKanban = record.onOrder ? Math.floor(record.onOrder / qpc) : 0;
    const kbsReturnedKanban = record.kbsReturned
      ? Math.floor(record.kbsReturned / qpc)
      : 0;
    const stockKanban = Math.floor(record.stock / qpc);

    if(RecLotSize === null){
      const totalCalculatedKanban = onOrderKanban + stockKanban;
      const recOrderKanban = totalKanbansInCirculation - totalCalculatedKanban;
      const recOrder = recOrderKanban * qpc;

      console.log("RecOrder:", recOrder);

      // Initialize or add to the BOMSequence group
      if (!partsByBomSequence[record.BOMSequence]) {
        partsByBomSequence[record.BOMSequence] = [];
      }
      partsByBomSequence[record.BOMSequence].push(recOrder);

      // Debug current state of partsByBomSequence
      console.log("Parts by BOMSequence:", partsByBomSequence);

      // Initialize `calculatedRecOrder` for fresh computation
      calculatedRecOrder = 0;

      // Check if there's only one BOMSequence
      if (Object.keys(partsByBomSequence).length === 1) {
        const bomSequenceKey = Object.keys(partsByBomSequence)[0];
        console.log("Single BOMSequence Key:", bomSequenceKey);

        if (partsByBomSequence[bomSequenceKey].length === 1) {
          calculatedRecOrder = partsByBomSequence[bomSequenceKey][0];
        } else {
          calculatedRecOrder = Math.max(...partsByBomSequence[bomSequenceKey]);
        }

        console.log(
          "Calculated Rec Order with single BOMSequence:",
          calculatedRecOrder
        );
      } else {
        // Multiple BOMSequences - calculate sum of max values
        for (const [bomSeq, recOrders] of Object.entries(partsByBomSequence)) {
          const maxRecOrder = Math.max(...recOrders);
          console.log(`BOMSequence: ${bomSeq}, Max RecOrder: ${maxRecOrder}`);
          calculatedRecOrder += maxRecOrder;
        }

        console.log(
          "Calculated Rec Order with multiple BOMSequences:",
          calculatedRecOrder
        );
      }

      // Final result
      console.log("Final Calculated Rec Order:", calculatedRecOrder);

      console.log("KitItemID,", record.KitItemID);
      // Update PatternActualData table
      const updateActualDataQuery = `
        UPDATE [SSPCSdbo].[PatternActualData]
        SET 
          [RecLotSize] = @calculatedRecOrder,
          [PlanLotSize] = @calculatedRecOrder,
          [ModifiedBy] = @ModifiedBy,
          [ModifiedDate] = @ModifiedDate
        WHERE [PatternActualDataID] = @actualID;
      `;
      await pool
        .request()
        .input("calculatedRecOrder", sql.Int, calculatedRecOrder)
        .input("actualID", sql.Int, actualID)
        .input("ModifiedBy", sql.Int, user)
        .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
        .query(updateActualDataQuery);

      // Check if record exists in PlanLotsizeCalculation
      const checkExistQuery = `
        SELECT 1
        FROM [SSPCSdbo].[PlanLotsizeCalculation]
        WHERE [PatternActualDataID] = @actualID
        AND [DieSetID] = @DieSetID
        AND [kitItemId] = @kitItemId;
      `;

      const checkExistResult = await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .input("DieSetID", sql.Int, DieSetID)
        .input("kitItemId", sql.Int, record.KitItemID)
        .query(checkExistQuery);

      if (checkExistResult.recordset.length === 0) {
        const saveQuery = `
          INSERT INTO [SSPCSdbo].[PlanLotsizeCalculation] (
            [PatternActualDataID],
            [DieSetID],
            [kitItemId],
            [RecomendedOrder],
            [ProductionOrder],
            [TotalKanbanInCirculation],
            [Stock],
            [KanbanReturned],
            [OnOrder],
            [Adjustment],
            [CreatedBy],
            [CreatedDate]
          ) VALUES (
            @actualID,
            @DieSetID,
            @kitItemId,
            @RecomendedOrder,
            @ProductionOrder,
            @TotalKanbanInCirculation,
            @Stock,
            @KanbanReturned,
            @OnOrder,
            @Adjustment,
            @CreatedBy,
            @CreatedDate
          );
        `;
        await pool
          .request()
          .input("actualID", sql.Int, actualID)
          .input("DieSetID", sql.Int, DieSetID)
          .input("kitItemId", sql.Int, record.KitItemID)
          .input("RecomendedOrder", sql.Int, recOrder || 0)
          .input("ProductionOrder", sql.Int, recOrder || 0)
          .input(
            "TotalKanbanInCirculation",
            sql.Int,
            totalKanbansInCirculation || 0
          )
          .input("Stock", sql.Int, record.stock || 0)
          .input("KanbanReturned", sql.Int, kbsReturnedKanban || 0)
          .input("OnOrder", sql.Int, onOrderKanban)
          .input("Adjustment", sql.Int, 0)
          .input("CreatedBy", sql.Int, user)
          .input("CreatedDate", sql.DateTime, reUsableFun.getISTDate())
          .query(saveQuery);
      } else {
        const updateQuery = `
          UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
          SET 
            [ProductionOrder] = @recOrder,
            [RecomendedOrder] = @recOrder,
            [TotalKanbanInCirculation] = @TotalKanbanInCirculation,
            [Adjustment] = @Adjustment,
            [ModifiedBy] = @ModifiedBy,
            [ModifiedDate] = @ModifiedDate
          WHERE [PatternActualDataID] = @actualID
          AND [DieSetID] = @DieSetID
          AND [kitItemId] = @kitItemId;
        `;
        await pool
          .request()
          .input("actualID", sql.Int, actualID)
          .input("DieSetID", sql.Int, DieSetID)
          .input("kitItemId", sql.Int, record.KitItemID)
          .input(
            "TotalKanbanInCirculation",
            sql.Int,
            totalKanbansInCirculation || 0
          )
          .input("calculatedRecOrder", sql.Int, calculatedRecOrder)
          .input("recOrder", sql.Int, recOrder)
          .input("Adjustment", sql.Int, 0)
          .input("ModifiedBy", sql.Int, user)
          .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
          .query(updateQuery);
      }

      parts.push({
        id: idCounter++,
        childPart: record.part,
        qpc,
        onHold: record.onHold || 0,
        stock: `${stock}(${originalStock})`,
        bomType: dieSet,
        bomSeqNo: record.BOMSequence,
        orderToLine: onOrderKanban,
        kbsInCirculation: totalKanbansInCirculation,
        kbsRtd: kbsReturnedKanban,
        recKBs: recOrderKanban,
        adj: 0,
        planLotSize: calculatedRecOrder,
        onOrder: onOrderKanban,
      });
      parts.forEach((part) => {
        part.planLotSize = calculatedRecOrder; // Use the computed value
      });
    }
    else if (
      (RecLotSize !== planLotSize || planLotSize === RecLotSize) &&
      ![
        reUsableFun.ActionTypes["Queued"],
        reUsableFun.ActionTypes["Skipped"],
        reUsableFun.ActionTypes["In Progress"],
        reUsableFun.ActionTypes["Discontinued"],
        reUsableFun.ActionTypes["Completed"],
      ].includes(status)
    ) {
      const recProdOrderQuery = `
        SELECT [RecomendedOrder], [ProductionOrder]
        FROM [SSPCSdbo].[PlanLotsizeCalculation]
        WHERE [PatternActualDataID] = @actualID
        AND [kitItemId] = @kitItemId;
      `;
      const recProdOrderResult = await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .input("kitItemId", sql.Int, record.KitItemID)
        .query(recProdOrderQuery);

      const recOrder = recProdOrderResult.recordset.length
        ? recProdOrderResult.recordset[0].RecomendedOrder
        : 0;
      const prodOrder = recProdOrderResult.recordset.length
        ? recProdOrderResult.recordset[0].ProductionOrder
        : 0;

      const adjustment = prodOrder - recOrder;
      const adjKb = adjustment === 0 ? 0 : adjustment / qpc;

      // Retrieve RecLotSize and PlanLotSize
      const lotSizeQuery = `
        SELECT [RecLotSize], [PlanLotSize]
        FROM [SSPCSdbo].[PatternActualData]
        WHERE [PatternActualDataID] = @actualID;
      `;
      const lotSizeResult = await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .query(lotSizeQuery);

      const recLotSize = lotSizeResult.recordset.length
        ? lotSizeResult.recordset[0].RecLotSize
        : 0;
      const updatedPlanLotSize = lotSizeResult.recordset.length
        ? lotSizeResult.recordset[0].PlanLotSize
        : 0;

      const updateQuery = `
        UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
        SET 
         [KanbanReturned] = @kbsReturned,
          [Adjustment] = @Adjustment,
          [ModifiedBy] = @ModifiedBy,
          [ModifiedDate] = @ModifiedDate
        WHERE [PatternActualDataID] = @actualID
        AND [DieSetID] = @DieSetID
        AND [kitItemId] = @kitItemId;
      `;
      await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .input("DieSetID", sql.Int, DieSetID)
        .input("kitItemId", sql.Int, record.KitItemID)
        .input("Adjustment", sql.Int, adjKb)
        .input("ModifiedBy", sql.Int, user)
        .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
        .input("kbsReturned",sql.Int,kbsReturnedKanban)
        .query(updateQuery);

      parts.push({
        id: idCounter++,
        childPart: record.part,
        qpc,
        onHold: record.onHold || 0,
        stock: `${stock}(${originalStock})`,
        bomType: dieSet,
        bomSeqNo: record.BOMSequence,
        orderToLine: Math.floor(record.onOrder / qpc),
        kbsInCirculation: totalKanbansInCirculation, // Assuming as not specified
        kbsRtd: Math.floor(record.kbsReturned / qpc),
        recKBs: Math.floor(recOrder / qpc),
        adj: adjKb,
        planLotSize: updatedPlanLotSize,
        onOrder: Math.floor(record.onOrder / qpc),
      });
      
    } 
    // else if (
    //   (planLotSize !== RecLotSize ||planLotSize === RecLotSize) &&
    //   [
    //     reUsableFun.ActionTypes["Queued"],
    //     reUsableFun.ActionTypes["Skipped"],
    //     reUsableFun.ActionTypes["In Progress"],
    //     reUsableFun.ActionTypes["Discontinued"],
    //     reUsableFun.ActionTypes["Completed"],
    //   ].includes(status)
    // ) {
    //   const recProdOrderQuery = `
    //     SELECT [RecomendedOrder], [ProductionOrder]
    //     FROM [SSPCSdbo].[PlanLotsizeCalculation]
    //     WHERE [PatternActualDataID] = @actualID
    //     AND [kitItemId] = @kitItemId;
    //   `;
    //   const recProdOrderResult = await pool
    //     .request()
    //     .input("actualID", sql.Int, actualID)
    //     .input("kitItemId", sql.Int, record.KitItemID)
    //     .query(recProdOrderQuery);

    //   const recOrder = recProdOrderResult.recordset.length
    //     ? recProdOrderResult.recordset[0].RecomendedOrder
    //     : 0;
    //   const prodOrder = recProdOrderResult.recordset.length
    //     ? recProdOrderResult.recordset[0].ProductionOrder
    //     : 0;

    //   const adjustment = prodOrder - recOrder;
    //   const adjKb = adjustment === 0 ? 0 : adjustment / qpc;

    //   // Retrieve RecLotSize and PlanLotSize
    //   const lotSizeQuery = `
    //     SELECT [RecLotSize], [PlanLotSize]
    //     FROM [SSPCSdbo].[PatternActualData]
    //     WHERE [PatternActualDataID] = @actualID;
    //   `;
    //   const lotSizeResult = await pool
    //     .request()
    //     .input("actualID", sql.Int, actualID)
    //     .query(lotSizeQuery);

    //   const recLotSize = lotSizeResult.recordset.length
    //     ? lotSizeResult.recordset[0].RecLotSize
    //     : 0;
    //   const updatedPlanLotSize = lotSizeResult.recordset.length
    //     ? lotSizeResult.recordset[0].PlanLotSize
    //     : 0;

    //   const updateQuery = `
    //     UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
    //     SET 
    //       [Adjustment] = @Adjustment,
    //       [ModifiedBy] = @ModifiedBy,
    //       [ModifiedDate] = @ModifiedDate
    //     WHERE [PatternActualDataID] = @actualID
    //     AND [DieSetID] = @DieSetID
    //     AND [kitItemId] = @kitItemId;
    //   `;
    //   await pool
    //     .request()
    //     .input("actualID", sql.Int, actualID)
    //     .input("DieSetID", sql.Int, DieSetID)
    //     .input("kitItemId", sql.Int, record.KitItemID)
    //     .input("Adjustment", sql.Int, adjKb)
    //     .input("ModifiedBy", sql.Int, user)
    //     .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
    //     .query(updateQuery);

    //   parts.push({
    //     id: idCounter++,
    //     childPart: record.part,
    //     qpc,
    //     onHold: record.onHold || 0,
    //     stock: `${stock}(${originalStock})`,
    //     bomType: dieSet,
    //     bomSeqNo: record.BOMSequence,
    //     orderToLine: Math.floor(record.onOrder / qpc),
    //     kbsInCirculation: totalKanbansInCirculation, // Assuming as not specified
    //     kbsRtd: Math.floor(record.kbsReturned / qpc),
    //     recKBs: Math.floor(recOrder / qpc),
    //     adj: adjKb,
    //     planLotSize: updatedPlanLotSize,
    //     onOrder: Math.floor(record.onOrder / qpc),
    //   });
    // }
  }

  return parts;
}

async function handleFLVTAndBelowSafetyStockParts(
  dieSet,
  actualID,
  idCounter,
  planLotSize,
  RecLotSize,
  shiftName,
  skuCategoryCode,
  currentDate,
  user,
  status
) {
  const pool = await sql.connect(config);
  const parts = [];
  const partsByBomSequence = {};

  const partsDetailQuery = `
     SELECT 
      k.KitItemID,
      k.BOMSequence,
      s.SKUCode AS part,
      si.SKUInventoryID,
      sc.SKUCostID,
      spm.Quantity AS qpc,
      SUM(CASE 
        WHEN sb.StockBucketCode IN ('PartsStorage', 'PartsOK', 'PartsBadLot') THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS stock,
      SUM(CASE 
        WHEN sb.StockBucketCode IN ('WeldReturnNG', 'RepairedPartsNG', 'WeldReturnPartsNG', 'PartsNG', 'PartsBadLot', 'RepairWIP', 'OnHoldOKParts') THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS onHold,
      SUM(CASE 
        WHEN sb.StockBucketCode = 'KBsReturned' THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS kbsReturned,
      SUM(CASE 
        WHEN sb.StockBucketCode = 'OnOrder' THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS onOrder
    FROM [dbo].[KitBOM] k
    JOIN [dbo].[SKU] s ON k.KitItemID = s.SKUID
    JOIN [dbo].[SKUInventory] si ON s.SKUID = si.SKUID
    JOIN [dbo].[SKUCost] sc ON si.SKUInventoryID = sc.SKUInventoryID
    LEFT JOIN [dbo].[SKUStock] ss ON sc.SKUCostID = ss.SKUCostID
    LEFT JOIN [dbo].[StockBucket] sb ON ss.StockBucketID = sb.StockBucketID
    LEFT JOIN [dbo].[SKUPackMapping] spm ON s.SKUID = spm.SKUID AND spm.IsDefault = 1
    WHERE k.BOMType = @dieSet
    GROUP BY 
      k.KitItemID,
      k.BOMSequence,
      s.SKUCode,
      si.SKUInventoryID,
      sc.SKUCostID,
      spm.Quantity
  `;

  const partsDetailResult = await pool
    .request()
    .input("dieSet", sql.VarChar, dieSet)
    .query(partsDetailQuery);

  const { DieSetID } = await reUsableFun.getBOMIDDetails(dieSet, config);

  for (const record of partsDetailResult.recordset) {
    const qpc = record.qpc || 1;
    const originalStock = record.stock || 0;
    const stock = Math.floor(originalStock / qpc);

    const kanbansQuery = `
      SELECT TOP 1 TotalPartKanbansInCirculation 
      FROM [SSPCSdbo].[PQDataUpload]
      WHERE Variant = @part
      ORDER BY EffectiveFrom DESC;
    `;

    const kanbansResult = await pool
      .request()
      .input("part", sql.VarChar, record.part)
      .query(kanbansQuery);

    let totalKanbansInCirculation =
      kanbansResult.recordset.length > 0
        ? kanbansResult.recordset[0].TotalPartKanbansInCirculation
        : 0;
    // Additional query to get ShiftChangeoverKanbans
    const shiftChangeoverQuery = `
    SELECT ShiftChangeoverKanbans 
FROM [SSPCSdbo].[ShiftChangeoverStockMaster]
WHERE 
 LineName = @skuCategoryCode
 AND [Variant] = @variant
 AND @currentDate BETWEEN FromDate AND ToDate
 AND (
   -- For the starting date, only shifts from FromShift onward
   (@currentDate = FromDate AND @shiftName >= FromShift)
   
   -- For the ending date, only shifts up to ToShift
   OR (@currentDate = ToDate AND @shiftName <= ToShift)
   
   -- For intermediate dates, all shifts are valid
   OR (@currentDate > FromDate AND @currentDate < ToDate)
 );

  `;
    const shiftChangeoverResult = await pool
      .request()
      .input("shiftName", sql.VarChar, shiftName) // Replace `shiftName` with your variable holding the shift name
      .input("currentDate", sql.DateTime, currentDate) // Replace `currentDate` with your variable holding the current date
      .input("skuCategoryCode", sql.VarChar, skuCategoryCode) // Replace `skuCategoryCode` with your variable holding the category code
      .input("variant", sql.VarChar, record.part)
      .query(shiftChangeoverQuery);

    if (shiftChangeoverResult.recordset.length > 0) {
      const shiftChangeoverKanbans =
        shiftChangeoverResult.recordset[0].ShiftChangeoverKanbans || 0;
      totalKanbansInCirculation += shiftChangeoverKanbans;
    }

    const onOrderKanban = record.onOrder ? Math.floor(record.onOrder / qpc) : 0;
    const kbsReturnedKanban = record.kbsReturned
      ? Math.floor(record.kbsReturned / qpc)
      : 0;
    const stockKanban = Math.floor(record.stock / qpc);

    if(RecLotSize === null){
      const totalCalculatedKanban = onOrderKanban + stockKanban;
      const recOrderKanban = totalKanbansInCirculation - totalCalculatedKanban;
      const recOrder = recOrderKanban * qpc;

      console.log("RecOrder:", recOrder);

      // Initialize or add to the BOMSequence group
      if (!partsByBomSequence[record.BOMSequence]) {
        partsByBomSequence[record.BOMSequence] = [];
      }
      partsByBomSequence[record.BOMSequence].push(recOrder);

      // Debug current state of partsByBomSequence
      console.log("Parts by BOMSequence:", partsByBomSequence);

      // Initialize `calculatedRecOrder` for fresh computation
      calculatedRecOrder = 0;

      // Check if there's only one BOMSequence
      if (Object.keys(partsByBomSequence).length === 1) {
        const bomSequenceKey = Object.keys(partsByBomSequence)[0];
        console.log("Single BOMSequence Key:", bomSequenceKey);

        if (partsByBomSequence[bomSequenceKey].length === 1) {
          calculatedRecOrder = partsByBomSequence[bomSequenceKey][0];
        } else {
          calculatedRecOrder = Math.max(...partsByBomSequence[bomSequenceKey]);
        }

        console.log(
          "Calculated Rec Order with single BOMSequence:",
          calculatedRecOrder
        );
      } else {
        // Multiple BOMSequences - calculate sum of max values
        for (const [bomSeq, recOrders] of Object.entries(partsByBomSequence)) {
          const maxRecOrder = Math.max(...recOrders);
          console.log(`BOMSequence: ${bomSeq}, Max RecOrder: ${maxRecOrder}`);
          calculatedRecOrder += maxRecOrder;
        }

        console.log(
          "Calculated Rec Order with multiple BOMSequences:",
          calculatedRecOrder
        );
      }

      // Final result
      console.log("Final Calculated Rec Order:", calculatedRecOrder);

      console.log("KitItemID,", record.KitItemID);
      // Update PatternActualData table
      const updateActualDataQuery = `
        UPDATE [SSPCSdbo].[PatternActualData]
        SET 
          [RecLotSize] = @calculatedRecOrder,
          [PlanLotSize] = @calculatedRecOrder,
          [ModifiedBy] = @ModifiedBy,
          [ModifiedDate] = @ModifiedDate
        WHERE [PatternActualDataID] = @actualID;
      `;
      await pool
        .request()
        .input("calculatedRecOrder", sql.Int, calculatedRecOrder)
        .input("actualID", sql.Int, actualID)
        .input("ModifiedBy", sql.Int, user)
        .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
        .query(updateActualDataQuery);

      // Check if record exists in PlanLotsizeCalculation
      const checkExistQuery = `
        SELECT 1
        FROM [SSPCSdbo].[PlanLotsizeCalculation]
        WHERE [PatternActualDataID] = @actualID
        AND [DieSetID] = @DieSetID
        AND [kitItemId] = @kitItemId;
      `;

      const checkExistResult = await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .input("DieSetID", sql.Int, DieSetID)
        .input("kitItemId", sql.Int, record.KitItemID)
        .query(checkExistQuery);

      if (checkExistResult.recordset.length === 0) {
        const saveQuery = `
          INSERT INTO [SSPCSdbo].[PlanLotsizeCalculation] (
            [PatternActualDataID],
            [DieSetID],
            [kitItemId],
            [RecomendedOrder],
            [ProductionOrder],
            [TotalKanbanInCirculation],
            [Stock],
            [KanbanReturned],
            [OnOrder],
            [Adjustment],
            [CreatedBy],
            [CreatedDate]
          ) VALUES (
            @actualID,
            @DieSetID,
            @kitItemId,
            @RecomendedOrder,
            @ProductionOrder,
            @TotalKanbanInCirculation,
            @Stock,
            @KanbanReturned,
            @OnOrder,
            @Adjustment,
            @CreatedBy,
            @CreatedDate
          );
        `;
        await pool
          .request()
          .input("actualID", sql.Int, actualID)
          .input("DieSetID", sql.Int, DieSetID)
          .input("kitItemId", sql.Int, record.KitItemID)
          .input("RecomendedOrder", sql.Int, recOrder || 0)
          .input("ProductionOrder", sql.Int, recOrder || 0)
          .input(
            "TotalKanbanInCirculation",
            sql.Int,
            totalKanbansInCirculation || 0
          )
          .input("Stock", sql.Int, record.stock || 0)
          .input("KanbanReturned", sql.Int, kbsReturnedKanban || 0)
          .input("OnOrder", sql.Int, onOrderKanban)
          .input("Adjustment", sql.Int, 0)
          .input("CreatedBy", sql.Int, user)
          .input("CreatedDate", sql.DateTime, reUsableFun.getISTDate())
          .query(saveQuery);
      } else {
        const updateQuery = `
          UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
          SET 
            [ProductionOrder] = @recOrder,
            [RecomendedOrder] = @recOrder,
            [TotalKanbanInCirculation] = @TotalKanbanInCirculation,
            [Adjustment] = @Adjustment,
            [ModifiedBy] = @ModifiedBy,
            [ModifiedDate] = @ModifiedDate
          WHERE [PatternActualDataID] = @actualID
          AND [DieSetID] = @DieSetID
          AND [kitItemId] = @kitItemId;
        `;
        await pool
          .request()
          .input("actualID", sql.Int, actualID)
          .input("DieSetID", sql.Int, DieSetID)
          .input("kitItemId", sql.Int, record.KitItemID)
          .input(
            "TotalKanbanInCirculation",
            sql.Int,
            totalKanbansInCirculation || 0
          )
          .input("calculatedRecOrder", sql.Int, calculatedRecOrder)
          .input("recOrder", sql.Int, recOrder)
          .input("Adjustment", sql.Int, 0)
          .input("ModifiedBy", sql.Int, user)
          .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
          .query(updateQuery);
      }

      parts.push({
        id: idCounter++,
        childPart: record.part,
        qpc,
        onHold: record.onHold || 0,
        stock: `${stock}(${originalStock})`,
        bomType: dieSet,
        bomSeqNo: record.BOMSequence,
        orderToLine: onOrderKanban,
        kbsInCirculation: totalKanbansInCirculation,
        kbsRtd: kbsReturnedKanban,
        recKBs: recOrderKanban,
        adj: 0,
        planLotSize: calculatedRecOrder,
        onOrder: onOrderKanban,
      });
      parts.forEach((part) => {
        part.planLotSize = calculatedRecOrder; // Use the computed value
      });
    }
    else if (
      (RecLotSize !== planLotSize || planLotSize === RecLotSize) &&
      ![
        reUsableFun.ActionTypes["Queued"],
        reUsableFun.ActionTypes["Skipped"],
        reUsableFun.ActionTypes["In Progress"],
        reUsableFun.ActionTypes["Discontinued"],
        reUsableFun.ActionTypes["Completed"],
      ].includes(status)
    ) {
      const recProdOrderQuery = `
        SELECT [RecomendedOrder], [ProductionOrder]
        FROM [SSPCSdbo].[PlanLotsizeCalculation]
        WHERE [PatternActualDataID] = @actualID
        AND [kitItemId] = @kitItemId;
      `;
      const recProdOrderResult = await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .input("kitItemId", sql.Int, record.KitItemID)
        .query(recProdOrderQuery);

      const recOrder = recProdOrderResult.recordset.length
        ? recProdOrderResult.recordset[0].RecomendedOrder
        : 0;
      const prodOrder = recProdOrderResult.recordset.length
        ? recProdOrderResult.recordset[0].ProductionOrder
        : 0;

      const adjustment = prodOrder - recOrder;
      const adjKb = adjustment === 0 ? 0 : adjustment / qpc;

      // Retrieve RecLotSize and PlanLotSize
      const lotSizeQuery = `
        SELECT [RecLotSize], [PlanLotSize]
        FROM [SSPCSdbo].[PatternActualData]
        WHERE [PatternActualDataID] = @actualID;
      `;
      const lotSizeResult = await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .query(lotSizeQuery);

      const recLotSize = lotSizeResult.recordset.length
        ? lotSizeResult.recordset[0].RecLotSize
        : 0;
      const updatedPlanLotSize = lotSizeResult.recordset.length
        ? lotSizeResult.recordset[0].PlanLotSize
        : 0;

      const updateQuery = `
        UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
        SET 
         [KanbanReturned] = @kbsReturned,
          [Adjustment] = @Adjustment,
          [ModifiedBy] = @ModifiedBy,
          [ModifiedDate] = @ModifiedDate
        WHERE [PatternActualDataID] = @actualID
        AND [DieSetID] = @DieSetID
        AND [kitItemId] = @kitItemId;
      `;
      await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .input("DieSetID", sql.Int, DieSetID)
        .input("kitItemId", sql.Int, record.KitItemID)
        .input("Adjustment", sql.Int, adjKb)
        .input("ModifiedBy", sql.Int, user)
        .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
        .input("kbsReturned",sql.Int,kbsReturnedKanban)
        .query(updateQuery);

      parts.push({
        id: idCounter++,
        childPart: record.part,
        qpc,
        onHold: record.onHold || 0,
        stock: `${stock}(${originalStock})`,
        bomType: dieSet,
        bomSeqNo: record.BOMSequence,
        orderToLine: Math.floor(record.onOrder / qpc),
        kbsInCirculation: totalKanbansInCirculation, // Assuming as not specified
        kbsRtd: Math.floor(record.kbsReturned / qpc),
        recKBs: Math.floor(recOrder / qpc),
        adj: adjKb,
        planLotSize: updatedPlanLotSize,
        onOrder: Math.floor(record.onOrder / qpc),
      });
      
    } 
    // else if (
    //   (planLotSize !== RecLotSize || planLotSize === RecLotSize ) &&
    //   [
    //     reUsableFun.ActionTypes["Queued"],
    //     reUsableFun.ActionTypes["Skipped"],
    //     reUsableFun.ActionTypes["In Progress"],
    //     reUsableFun.ActionTypes["Discontinued"],
    //     reUsableFun.ActionTypes["Completed"],
    //   ].includes(status)
    // ) {
    //   const recProdOrderQuery = `
    //     SELECT [RecomendedOrder], [ProductionOrder]
    //     FROM [SSPCSdbo].[PlanLotsizeCalculation]
    //     WHERE [PatternActualDataID] = @actualID
    //     AND [kitItemId] = @kitItemId;
    //   `;
    //   const recProdOrderResult = await pool
    //     .request()
    //     .input("actualID", sql.Int, actualID)
    //     .input("kitItemId", sql.Int, record.KitItemID)
    //     .query(recProdOrderQuery);

    //   const recOrder = recProdOrderResult.recordset.length
    //     ? recProdOrderResult.recordset[0].RecomendedOrder
    //     : 0;
    //   const prodOrder = recProdOrderResult.recordset.length
    //     ? recProdOrderResult.recordset[0].ProductionOrder
    //     : 0;

    //   const adjustment = prodOrder - recOrder;
    //   const adjKb = adjustment === 0 ? 0 : adjustment / qpc;

    //   // Retrieve RecLotSize and PlanLotSize
    //   const lotSizeQuery = `
    //     SELECT [RecLotSize], [PlanLotSize]
    //     FROM [SSPCSdbo].[PatternActualData]
    //     WHERE [PatternActualDataID] = @actualID;
    //   `;
    //   const lotSizeResult = await pool
    //     .request()
    //     .input("actualID", sql.Int, actualID)
    //     .query(lotSizeQuery);

    //   const recLotSize = lotSizeResult.recordset.length
    //     ? lotSizeResult.recordset[0].RecLotSize
    //     : 0;
    //   const updatedPlanLotSize = lotSizeResult.recordset.length
    //     ? lotSizeResult.recordset[0].PlanLotSize
    //     : 0;

    //   const updateQuery = `
    //     UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
    //     SET 
    //       [Adjustment] = @Adjustment,
    //       [ModifiedBy] = @ModifiedBy,
    //       [ModifiedDate] = @ModifiedDate
    //     WHERE [PatternActualDataID] = @actualID
    //     AND [DieSetID] = @DieSetID
    //     AND [kitItemId] = @kitItemId;
    //   `;
    //   await pool
    //     .request()
    //     .input("actualID", sql.Int, actualID)
    //     .input("DieSetID", sql.Int, DieSetID)
    //     .input("kitItemId", sql.Int, record.KitItemID)
    //     .input("Adjustment", sql.Int, adjKb)
    //     .input("ModifiedBy", sql.Int, user)
    //     .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
    //     .query(updateQuery);

    //   parts.push({
    //     id: idCounter++,
    //     childPart: record.part,
    //     qpc,
    //     onHold: record.onHold || 0,
    //     stock: `${stock}(${originalStock})`,
    //     bomType: dieSet,
    //     bomSeqNo: record.BOMSequence,
    //     orderToLine: Math.floor(record.onOrder / qpc),
    //     kbsInCirculation: totalKanbansInCirculation, // Assuming as not specified
    //     kbsRtd: Math.floor(record.kbsReturned / qpc),
    //     recKBs: Math.floor(recOrder / qpc),
    //     adj: adjKb,
    //     planLotSize: updatedPlanLotSize,
    //     onOrder: Math.floor(record.onOrder / qpc),
    //   });
    // }
  }

  return parts;
}

// async function handleToBeScheduled(
//   dieSet,
//   actualID,
//   idCounter,
//   planLotSize,
//   RecLotSize,
//   shiftName,
//   skuCategoryCode,
//   currentDate,
//   user
// ) {
//   const pool = await sql.connect(config);
//   const parts = [];
//   const partsByBomSequence = {};

//   const partsDetailQuery = `
//      SELECT 
//       k.KitItemID,
//       k.BOMSequence,
//       s.SKUCode AS part,
//       si.SKUInventoryID,
//       sc.SKUCostID,
//       spm.Quantity AS qpc,
//       SUM(CASE 
//         WHEN sb.StockBucketCode IN ('PartsOK', 'PartsStorage','PartsBadLot', 'OnHoldOKParts', 'PartsNG', 'RepairWIP') THEN ss.BucketQuantityInStorageUOM 
//         ELSE 0 
//       END) AS stock,
//       SUM(CASE 
//         WHEN sb.StockBucketCode IN ('WeldReturnNG', 'RepairedPartsNG', 'WeldReturnPartsNG', 'PartsNG', 'PartsBadLot', 'RepairWIP', 'OnHoldOKParts') THEN ss.BucketQuantityInStorageUOM 
//         ELSE 0 
//       END) AS onHold,
//       SUM(CASE 
//         WHEN sb.StockBucketCode = 'KBsReturned' THEN ss.BucketQuantityInStorageUOM 
//         ELSE 0 
//       END) AS kbsReturned,
//       SUM(CASE 
//         WHEN sb.StockBucketCode = 'OnOrder' THEN ss.BucketQuantityInStorageUOM 
//         ELSE 0 
//       END) AS onOrder
//     FROM [dbo].[KitBOM] k
//     JOIN [dbo].[SKU] s ON k.KitItemID = s.SKUID
//     JOIN [dbo].[SKUInventory] si ON s.SKUID = si.SKUID
//     JOIN [dbo].[SKUCost] sc ON si.SKUInventoryID = sc.SKUInventoryID
//     LEFT JOIN [dbo].[SKUStock] ss ON sc.SKUCostID = ss.SKUCostID
//     LEFT JOIN [dbo].[StockBucket] sb ON ss.StockBucketID = sb.StockBucketID
//     LEFT JOIN [dbo].[SKUPackMapping] spm ON s.SKUID = spm.SKUID AND spm.IsDefault = 1
//     WHERE k.BOMType = @dieSet
//     GROUP BY 
//       k.KitItemID,
//       k.BOMSequence,
//       s.SKUCode,
//       si.SKUInventoryID,
//       sc.SKUCostID,
//       spm.Quantity
//   `;

//   const partsDetailResult = await pool
//     .request()
//     .input("dieSet", sql.VarChar, dieSet)
//     .query(partsDetailQuery);

//   const { DieSetID } = await reUsableFun.getBOMIDDetails(dieSet, config);

//   const applyChangesResult = await pool
//       .request()
//       .input("actualID", sql.Int, actualID)
//       .query(`
//       SELECT [IsApplyChanges]
//       FROM [SSPCSdbo].[PatternActualData]
//       WHERE [PatternActualDataID] = @actualID;
//     `);


//       const IsApplyChanges =
//       applyChangesResult.recordset.length > 0
//         ? applyChangesResult.recordset[0].IsApplyChanges
//         : 0;

//   for (const record of partsDetailResult.recordset) {
//     const qpc = record.qpc || 1;
//     const originalStock = record.stock || 0;
//     const stock = Math.floor(originalStock / qpc);

//     const kanbansQuery = `
//       SELECT TOP 1 TotalPartKanbansInCirculation 
//       FROM [SSPCSdbo].[PQDataUpload]
//       WHERE Variant = @part
//       ORDER BY EffectiveFrom DESC;
//     `;

//     const kanbansResult = await pool
//       .request()
//       .input("part", sql.VarChar, record.part)
//       .query(kanbansQuery);

//     let totalKanbansInCirculation =
//       kanbansResult.recordset.length > 0
//         ? kanbansResult.recordset[0].TotalPartKanbansInCirculation
//         : 0;

//     // Additional query to get ShiftChangeoverKanbans
//     const shiftChangeoverQuery = `
//      SELECT ShiftChangeoverKanbans 
// FROM [SSPCSdbo].[ShiftChangeoverStockMaster]
// WHERE 
//   LineName = @skuCategoryCode
//   AND [Variant] = @variant
//   AND @currentDate BETWEEN FromDate AND ToDate
//   AND (
//     -- For the starting date, only shifts from FromShift onward
//     (@currentDate = FromDate AND @shiftName >= FromShift)
    
//     -- For the ending date, only shifts up to ToShift
//     OR (@currentDate = ToDate AND @shiftName <= ToShift)
    
//     -- For intermediate dates, all shifts are valid
//     OR (@currentDate > FromDate AND @currentDate < ToDate)
//   );

//    `;
//     const shiftChangeoverResult = await pool
//       .request()
//       .input("shiftName", sql.VarChar, shiftName) // Replace `shiftName` with your variable holding the shift name
//       .input("currentDate", sql.DateTime, currentDate) // Replace `currentDate` with your variable holding the current date
//       .input("skuCategoryCode", sql.VarChar, skuCategoryCode) // Replace `skuCategoryCode` with your variable holding the category code
//       .input("variant", sql.VarChar, record.part)
//       .query(shiftChangeoverQuery);

//     if (shiftChangeoverResult.recordset.length > 0) {
//       const shiftChangeoverKanbans =
//         shiftChangeoverResult.recordset[0].ShiftChangeoverKanbans || 0;
//       totalKanbansInCirculation += shiftChangeoverKanbans;
//     }

//     const onOrderKanban = record.onOrder? Math.floor(record.onOrder / qpc) : 0;
//     const kbsReturnedKanban = record.kbsReturned
//       ? Math.floor(record.kbsReturned / qpc)
//       : 0;
//     const stockKanban = Math.floor(record.stock / qpc);
//     console.log("OnOrder:",onOrderKanban)

//     if (IsApplyChanges === null) {
//       const totalCalculatedKanban = onOrderKanban + stockKanban;
//       const recOrderKanban = totalKanbansInCirculation - totalCalculatedKanban;
//       const recOrder = recOrderKanban * qpc;

//       console.log("RecOrder:", recOrder);

//       // Initialize or add to the BOMSequence group
//       if (!partsByBomSequence[record.BOMSequence]) {
//         partsByBomSequence[record.BOMSequence] = [];
//       }
//       partsByBomSequence[record.BOMSequence].push(recOrder);

//       // Debug current state of partsByBomSequence
//       console.log("Parts by BOMSequence:", partsByBomSequence);

//       // Initialize `calculatedRecOrder` for fresh computation
//       calculatedRecOrder = 0;

//       // Check if there's only one BOMSequence
//       if (Object.keys(partsByBomSequence).length === 1) {
//         const bomSequenceKey = Object.keys(partsByBomSequence)[0];
//         console.log("Single BOMSequence Key:", bomSequenceKey);

//         if (partsByBomSequence[bomSequenceKey].length === 1) {
//           calculatedRecOrder = partsByBomSequence[bomSequenceKey][0];
//         } else {
//           calculatedRecOrder = Math.max(...partsByBomSequence[bomSequenceKey]);
//         }

//         console.log(
//           "Calculated Rec Order with single BOMSequence:",
//           calculatedRecOrder
//         );
//       } else {
//         // Multiple BOMSequences - calculate sum of max values
//         for (const [bomSeq, recOrders] of Object.entries(partsByBomSequence)) {
//           const maxRecOrder = Math.max(...recOrders);
//           console.log(`BOMSequence: ${bomSeq}, Max RecOrder: ${maxRecOrder}`);
//           calculatedRecOrder += maxRecOrder;
//         }

//         console.log(
//           "Calculated Rec Order with multiple BOMSequences:",
//           calculatedRecOrder
//         );
//       }

//       // Final result
//       console.log("Final Calculated Rec Order:", calculatedRecOrder);

//       console.log("KitItemID,", record.KitItemID);
//       // Update PatternActualData table
//       const updateActualDataQuery = `
//         UPDATE [SSPCSdbo].[PatternActualData]
//         SET 
//           [RecLotSize] = @calculatedRecOrder,
//           [PlanLotSize] = @calculatedRecOrder,
//           [ModifiedBy] = @ModifiedBy,
//           [ModifiedDate] = @ModifiedDate
//         WHERE [PatternActualDataID] = @actualID;
//       `;
//       await pool
//         .request()
//         .input("calculatedRecOrder", sql.Int, calculatedRecOrder)
//         .input("actualID", sql.Int, actualID)
//         .input("ModifiedBy", sql.Int, user)
//         .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
//         .query(updateActualDataQuery);

//       // Check if record exists in PlanLotsizeCalculation
//       const checkExistQuery = `
//         SELECT 1
//         FROM [SSPCSdbo].[PlanLotsizeCalculation]
//         WHERE [PatternActualDataID] = @actualID
//         AND [DieSetID] = @DieSetID
//         AND [kitItemId] = @kitItemId
//       `;

//       const checkExistResult = await pool
//         .request()
//         .input("actualID", sql.Int, actualID)
//         .input("DieSetID", sql.Int, DieSetID)
//         .input("kitItemId", sql.Int, record.KitItemID)
//         .query(checkExistQuery);

//       if (checkExistResult.recordset.length === 0) {
//         const saveQuery = `
//           INSERT INTO [SSPCSdbo].[PlanLotsizeCalculation] (
//             [PatternActualDataID],
//             [DieSetID],
//             [kitItemId],
//             [RecomendedOrder],
//             [ProductionOrder],
//             [TotalKanbanInCirculation],
//             [Stock],
//             [KanbanReturned],
//             [OnOrder],
//             [Adjustment],
//             [CreatedBy],
//             [CreatedDate]
//           ) VALUES (
//             @actualID,
//             @DieSetID,
//             @kitItemId,
//             @RecomendedOrder,
//             @ProductionOrder,
//             @TotalKanbanInCirculation,
//             @Stock,
//             @KanbanReturned,
//             @OnOrder,
//             @Adjustment,
//             @CreatedBy,
//             @CreatedDate
//           );
//         `;
//         await pool
//           .request()
//           .input("actualID", sql.Int, actualID)
//           .input("DieSetID", sql.Int, DieSetID)
//           .input("kitItemId", sql.Int, record.KitItemID)
//           .input("RecomendedOrder", sql.Int, recOrder || 0)
//           .input("ProductionOrder", sql.Int, recOrder || 0)
//           .input(
//             "TotalKanbanInCirculation",
//             sql.Int,
//             totalKanbansInCirculation || 0
//           )
//           .input("Stock", sql.Int, record.stock || 0)
//           .input("KanbanReturned", sql.Int, kbsReturnedKanban || 0)
//           .input("OnOrder", sql.Int, onOrderKanban)
//           .input("Adjustment", sql.Int, 0)
//           .input("CreatedBy", sql.Int, user)
//           .input("CreatedDate", sql.DateTime, reUsableFun.getISTDate())
//           .query(saveQuery);
//       } else {
//         const updateQuery = `
//           UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
//           SET 
//             [ProductionOrder] = @recOrder,
//             [RecomendedOrder] = @recOrder,
//             [OnOrder] = @OnOrder,
//             [KanbanReturned] = @KanbanReturned,
//             [Stock] = @Stock,
//             [TotalKanbanInCirculation] = @TotalKanbanInCirculation,
//             [Adjustment] = @Adjustment,
//             [ModifiedBy] = @ModifiedBy,
//           [ModifiedDate] = @ModifiedDate
//           WHERE [PatternActualDataID] = @actualID
//           AND [DieSetID] = @DieSetID
//           AND [kitItemId] = @kitItemId;
//         `;
//         await pool
//           .request()
//           .input("actualID", sql.Int, actualID)
//           .input("DieSetID", sql.Int, DieSetID)
//           .input("kitItemId", sql.Int, record.KitItemID)
//           .input("OnOrder", sql.Int, onOrderKanban)
//           .input("KanbanReturned", sql.Int, kbsReturnedKanban || 0)
//           .input("Stock", sql.Int, record.stock || 0)
//           .input(
//             "TotalKanbanInCirculation",
//             sql.Int,
//             totalKanbansInCirculation || 0
//           )
//           .input("calculatedRecOrder", sql.Int, calculatedRecOrder)
//           .input("recOrder", sql.Int, recOrder)
//           .input("Adjustment", sql.Int, 0)
//           .input("ModifiedBy", sql.Int, user)
//           .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
//           .query(updateQuery);
//       }

//       parts.push({
//         id: idCounter++,
//         childPart: record.part,
//         qpc,
//         onHold: record.onHold || 0,
//         stock: `${stock}(${originalStock})`,
//         bomType: dieSet,
//         bomSeqNo: record.BOMSequence,
//         orderToLine: onOrderKanban,
//         kbsInCirculation: totalKanbansInCirculation,
//         kbsRtd: kbsReturnedKanban,
//         recKBs: recOrderKanban,
//         adj: 0,
//         planLotSize: calculatedRecOrder,
//         onOrder: onOrderKanban,
//       });
//       parts.forEach((part) => {
//         part.planLotSize = calculatedRecOrder; // Use the computed value
//       });
//     } else{
//       const recProdOrderQuery = `
//         SELECT [RecomendedOrder], [ProductionOrder]
//         FROM [SSPCSdbo].[PlanLotsizeCalculation]
//         WHERE [PatternActualDataID] = @actualID
//         AND [kitItemId] = @kitItemId;
//       `;
//       const recProdOrderResult = await pool
//         .request()
//         .input("actualID", sql.Int, actualID)
//         .input("kitItemId", sql.Int, record.KitItemID)
//         .query(recProdOrderQuery);

//       const recOrder = recProdOrderResult.recordset.length
//         ? recProdOrderResult.recordset[0].RecomendedOrder
//         : 0;
//       const prodOrder = recProdOrderResult.recordset.length
//         ? recProdOrderResult.recordset[0].ProductionOrder
//         : 0;

//       const adjustment = prodOrder - recOrder;
//       const adjKb = adjustment === 0 ? 0 : adjustment / qpc;

//       // Retrieve RecLotSize and PlanLotSize
//       const lotSizeQuery = `
//         SELECT [RecLotSize], [PlanLotSize]
//         FROM [SSPCSdbo].[PatternActualData]
//         WHERE [PatternActualDataID] = @actualID;
//       `;
//       const lotSizeResult = await pool
//         .request()
//         .input("actualID", sql.Int, actualID)
//         .query(lotSizeQuery);

//       const recLotSize = lotSizeResult.recordset.length
//         ? lotSizeResult.recordset[0].RecLotSize
//         : 0;
//       const updatedPlanLotSize = lotSizeResult.recordset.length
//         ? lotSizeResult.recordset[0].PlanLotSize
//         : 0;

//       const updateQuery = `
//         UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
//         SET 
//          [KanbanReturned] = @kbsReturned,
//           [Adjustment] = @Adjustment,
//           [ModifiedBy] = @ModifiedBy,
//           [ModifiedDate] = @ModifiedDate
//         WHERE [PatternActualDataID] = @actualID
//         AND [DieSetID] = @DieSetID
//         AND [kitItemId] = @kitItemId;
//       `;
//       await pool
//         .request()
//         .input("actualID", sql.Int, actualID)
//         .input("DieSetID", sql.Int, DieSetID)
//         .input("kitItemId", sql.Int, record.KitItemID)
//         .input("Adjustment", sql.Int, adjKb)
//         .input("ModifiedBy", sql.Int, user)
//         .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
//         .input("kbsReturned",sql.Int,kbsReturnedKanban)
//         .query(updateQuery);

//       parts.push({
//         id: idCounter++,
//         childPart: record.part,
//         qpc,
//         onHold: record.onHold || 0,
//         stock: `${stock}(${originalStock})`,
//         bomType: dieSet,
//         bomSeqNo: record.BOMSequence,
//         orderToLine: Math.floor(record.onOrder / qpc),
//         kbsInCirculation: totalKanbansInCirculation, // Assuming as not specified
//         kbsRtd: Math.floor(record.kbsReturned / qpc),
//         recKBs: Math.floor(recOrder / qpc),
//         adj: adjKb,
//         planLotSize: updatedPlanLotSize,
//         onOrder: Math.floor(record.onOrder / qpc),
//       });
//     }
//   }

//   return parts;
// }
async function handleToBeScheduled(
  dieSet,
  actualID,
  idCounter,
  planLotSize,
  RecLotSize,
  shiftName,
  skuCategoryCode,
  currentDate,
  user
) {
  const pool = await sql.connect(config);
  const parts = [];
  const partsByBomSequence = {};

  const partsDetailQuery = `
     SELECT 
      k.KitItemID,
      k.BOMSequence,
      s.SKUCode AS part,
      si.SKUInventoryID,
      sc.SKUCostID,
      spm.Quantity AS qpc,
      SUM(CASE 
        WHEN sb.StockBucketCode IN ('PartsOK', 'PartsStorage','PartsBadLot', 'OnHoldOKParts', 'PartsNG', 'RepairWIP') THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS stock,
      SUM(CASE 
        WHEN sb.StockBucketCode IN ('WeldReturnNG', 'RepairedPartsNG', 'WeldReturnPartsNG', 'PartsNG', 'PartsBadLot', 'RepairWIP', 'OnHoldOKParts') THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS onHold,
      SUM(CASE 
        WHEN sb.StockBucketCode = 'KBsReturned' THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS kbsReturned,
      SUM(CASE 
        WHEN sb.StockBucketCode = 'OnOrder' THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS onOrder
    FROM [dbo].[KitBOM] k
    JOIN [dbo].[SKU] s ON k.KitItemID = s.SKUID
    JOIN [dbo].[SKUInventory] si ON s.SKUID = si.SKUID
    JOIN [dbo].[SKUCost] sc ON si.SKUInventoryID = sc.SKUInventoryID
    LEFT JOIN [dbo].[SKUStock] ss ON sc.SKUCostID = ss.SKUCostID
    LEFT JOIN [dbo].[StockBucket] sb ON ss.StockBucketID = sb.StockBucketID
    LEFT JOIN [dbo].[SKUPackMapping] spm ON s.SKUID = spm.SKUID AND spm.IsDefault = 1
    WHERE k.BOMType = @dieSet
    GROUP BY 
      k.KitItemID,
      k.BOMSequence,
      s.SKUCode,
      si.SKUInventoryID,
      sc.SKUCostID,
      spm.Quantity
  `;

  const partsDetailResult = await pool
    .request()
    .input("dieSet", sql.VarChar, dieSet)
    .query(partsDetailQuery);

  const { DieSetID } = await reUsableFun.getBOMIDDetails(dieSet, config);

  const applyChangesResult = await pool
      .request()
      .input("actualID", sql.Int, actualID)
      .query(`
      SELECT [IsApplyChanges]
      FROM [SSPCSdbo].[PatternActualData]
      WHERE [PatternActualDataID] = @actualID;
    `);


      const IsApplyChanges =
      applyChangesResult.recordset.length > 0
        ? applyChangesResult.recordset[0].IsApplyChanges
        : 0;

  for (const record of partsDetailResult.recordset) {
    const qpc = record.qpc || 1;
    const originalStock = record.stock || 0;
    const stock = Math.floor(originalStock / qpc);

    const kanbansQuery = `
      SELECT TOP 1 TotalPartKanbansInCirculation 
      FROM [SSPCSdbo].[PQDataUpload]
      WHERE Variant = @part
      ORDER BY EffectiveFrom DESC;
    `;

    const kanbansResult = await pool
      .request()
      .input("part", sql.VarChar, record.part)
      .query(kanbansQuery);

    let totalKanbansInCirculation =
      kanbansResult.recordset.length > 0
        ? kanbansResult.recordset[0].TotalPartKanbansInCirculation
        : 0;

    // Additional query to get ShiftChangeoverKanbans
    const shiftChangeoverQuery = `
     SELECT ShiftChangeoverKanbans 
FROM [SSPCSdbo].[ShiftChangeoverStockMaster]
WHERE 
  LineName = @skuCategoryCode
  AND [Variant] = @variant
  AND @currentDate BETWEEN FromDate AND ToDate
  AND (
    -- For the starting date, only shifts from FromShift onward
    (@currentDate = FromDate AND @shiftName >= FromShift)
    
    -- For the ending date, only shifts up to ToShift
    OR (@currentDate = ToDate AND @shiftName <= ToShift)
    
    -- For intermediate dates, all shifts are valid
    OR (@currentDate > FromDate AND @currentDate < ToDate)
  );

   `;
    const shiftChangeoverResult = await pool
      .request()
      .input("shiftName", sql.VarChar, shiftName) // Replace `shiftName` with your variable holding the shift name
      .input("currentDate", sql.DateTime, currentDate) // Replace `currentDate` with your variable holding the current date
      .input("skuCategoryCode", sql.VarChar, skuCategoryCode) // Replace `skuCategoryCode` with your variable holding the category code
      .input("variant", sql.VarChar, record.part)
      .query(shiftChangeoverQuery);

    if (shiftChangeoverResult.recordset.length > 0) {
      const shiftChangeoverKanbans =
        shiftChangeoverResult.recordset[0].ShiftChangeoverKanbans || 0;
      totalKanbansInCirculation += shiftChangeoverKanbans;
    }
    const onOrderKanban = record.onOrder? Math.floor(record.onOrder / qpc) : 0;
    const kbsReturnedKanban = record.kbsReturned
      ? Math.floor(record.kbsReturned / qpc)
      : 0;
    const stockKanban = Math.floor(record.stock / qpc);
    console.log("OnOrder:",onOrderKanban)

    if (IsApplyChanges === null) {
      const totalCalculatedKanban = onOrderKanban + stockKanban;
      const recOrderKanban = totalKanbansInCirculation - totalCalculatedKanban;
      const recOrder = recOrderKanban * qpc;

      console.log("RecOrder:", recOrder);

      // Initialize or add to the BOMSequence group
      if (!partsByBomSequence[record.BOMSequence]) {
        partsByBomSequence[record.BOMSequence] = [];
      }
      partsByBomSequence[record.BOMSequence].push(recOrder);

      // Debug current state of partsByBomSequence
      console.log("Parts by BOMSequence:", partsByBomSequence);

      // Initialize `calculatedRecOrder` for fresh computation
      calculatedRecOrder = 0;

      // Check if there's only one BOMSequence
      if (Object.keys(partsByBomSequence).length === 1) {
        const bomSequenceKey = Object.keys(partsByBomSequence)[0];
        console.log("Single BOMSequence Key:", bomSequenceKey);

        if (partsByBomSequence[bomSequenceKey].length === 1) {
          calculatedRecOrder = partsByBomSequence[bomSequenceKey][0];
        } else {
          calculatedRecOrder = Math.max(...partsByBomSequence[bomSequenceKey]);
        }

        console.log(
          "Calculated Rec Order with single BOMSequence:",
          calculatedRecOrder
        );
      } else {
        // Multiple BOMSequences - calculate sum of max values
        for (const [bomSeq, recOrders] of Object.entries(partsByBomSequence)) {
          const maxRecOrder = Math.max(...recOrders);
          console.log(`BOMSequence: ${bomSeq}, Max RecOrder: ${maxRecOrder}`);
          calculatedRecOrder += maxRecOrder;
        }

        console.log(
          "Calculated Rec Order with multiple BOMSequences:",
          calculatedRecOrder
        );
      }

      // Final result
      console.log("Final Calculated Rec Order:", calculatedRecOrder);

      console.log("KitItemID,", record.KitItemID);
      // Update PatternActualData table
      const updateActualDataQuery = `
        UPDATE [SSPCSdbo].[PatternActualData]
        SET 
          [RecLotSize] = @calculatedRecOrder,
          [PlanLotSize] = @calculatedRecOrder,
          [ModifiedBy] = @ModifiedBy,
          [ModifiedDate] = @ModifiedDate
        WHERE [PatternActualDataID] = @actualID;
      `;
      await pool
        .request()
        .input("calculatedRecOrder", sql.Int, calculatedRecOrder)
        .input("actualID", sql.Int, actualID)
        .input("ModifiedBy", sql.Int, user)
        .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
        .query(updateActualDataQuery);

      // Check if record exists in PlanLotsizeCalculation
      const checkExistQuery = `
        SELECT 1
        FROM [SSPCSdbo].[PlanLotsizeCalculation]
        WHERE [PatternActualDataID] = @actualID
        AND [DieSetID] = @DieSetID
        AND [kitItemId] = @kitItemId
      `;

      const checkExistResult = await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .input("DieSetID", sql.Int, DieSetID)
        .input("kitItemId", sql.Int, record.KitItemID)
        .query(checkExistQuery);

      if (checkExistResult.recordset.length === 0) {
        const saveQuery = `
          INSERT INTO [SSPCSdbo].[PlanLotsizeCalculation] (
            [PatternActualDataID],
            [DieSetID],
            [kitItemId],
            [RecomendedOrder],
            [ProductionOrder],
            [TotalKanbanInCirculation],
            [Stock],
            [KanbanReturned],
            [OnOrder],
            [Adjustment],
            [CreatedBy],
            [CreatedDate]
          ) VALUES (
            @actualID,
            @DieSetID,
            @kitItemId,
            @RecomendedOrder,
            @ProductionOrder,
            @TotalKanbanInCirculation,
            @Stock,
            @KanbanReturned,
            @OnOrder,
            @Adjustment,
            @CreatedBy,
            @CreatedDate
          );
        `;
        await pool
          .request()
          .input("actualID", sql.Int, actualID)
          .input("DieSetID", sql.Int, DieSetID)
          .input("kitItemId", sql.Int, record.KitItemID)
          .input("RecomendedOrder", sql.Int, recOrder || 0)
          .input("ProductionOrder", sql.Int, recOrder || 0)
          .input(
            "TotalKanbanInCirculation",
            sql.Int,
            totalKanbansInCirculation || 0
          )
          .input("Stock", sql.Int, record.stock || 0)
          .input("KanbanReturned", sql.Int, kbsReturnedKanban || 0)
          .input("OnOrder", sql.Int, onOrderKanban)
          .input("Adjustment", sql.Int, 0)
          .input("CreatedBy", sql.Int, user)
          .input("CreatedDate", sql.DateTime, reUsableFun.getISTDate())
          .query(saveQuery);
      } else {
        const updateQuery = `
          UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
          SET 
            [ProductionOrder] = @recOrder,
            [RecomendedOrder] = @recOrder,
            [OnOrder] = @OnOrder,
            [KanbanReturned] = @KanbanReturned,
            [Stock] = @Stock,
            [TotalKanbanInCirculation] = @TotalKanbanInCirculation,
            [Adjustment] = @Adjustment,
            [ModifiedBy] = @ModifiedBy,
          [ModifiedDate] = @ModifiedDate
          WHERE [PatternActualDataID] = @actualID
          AND [DieSetID] = @DieSetID
          AND [kitItemId] = @kitItemId;
        `;
        await pool
          .request()
          .input("actualID", sql.Int, actualID)
          .input("DieSetID", sql.Int, DieSetID)
          .input("kitItemId", sql.Int, record.KitItemID)
          .input("OnOrder", sql.Int, onOrderKanban)
          .input("KanbanReturned", sql.Int, kbsReturnedKanban || 0)
          .input("Stock", sql.Int, record.stock || 0)
          .input(
            "TotalKanbanInCirculation",
            sql.Int,
            totalKanbansInCirculation || 0
          )
          .input("calculatedRecOrder", sql.Int, calculatedRecOrder)
          .input("recOrder", sql.Int, recOrder)
          .input("Adjustment", sql.Int, 0)
          .input("ModifiedBy", sql.Int, user)
          .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
          .query(updateQuery);
      }

      parts.push({
        id: idCounter++,
        childPart: record.part,
        qpc,
        onHold: record.onHold || 0,
        stock: `${stock}(${originalStock})`,
        bomType: dieSet,
        bomSeqNo: record.BOMSequence,
        orderToLine: onOrderKanban,
        kbsInCirculation: totalKanbansInCirculation,
        kbsRtd: kbsReturnedKanban,
        recKBs: recOrderKanban,
        adj: 0,
        planLotSize: calculatedRecOrder,
        onOrder: onOrderKanban,
      });
      parts.forEach((part) => {
        part.planLotSize = calculatedRecOrder; // Use the computed value
      });
    } else{
      const recProdOrderQuery = `
        SELECT [RecomendedOrder], [ProductionOrder]
        FROM [SSPCSdbo].[PlanLotsizeCalculation]
        WHERE [PatternActualDataID] = @actualID
        AND [kitItemId] = @kitItemId;
      `;
      const recProdOrderResult = await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .input("kitItemId", sql.Int, record.KitItemID)
        .query(recProdOrderQuery);

      // const recOrder = recProdOrderResult.recordset.length
      //   ? recProdOrderResult.recordset[0].RecomendedOrder
      //   : 0;

      const totalCalculatedKanban = onOrderKanban + stockKanban;
      const recOrderKanban = totalKanbansInCirculation - totalCalculatedKanban;
      let recOrder = recOrderKanban * qpc;

       if (!partsByBomSequence[record.BOMSequence]) {
        partsByBomSequence[record.BOMSequence] = [];
      }
      partsByBomSequence[record.BOMSequence].push(recOrder);

      // Debug current state of partsByBomSequence
      console.log("Parts by BOMSequence:", partsByBomSequence);

      // Initialize `calculatedRecOrder` for fresh computation
      let calculatedRecOrder = 0;

      // Check if there's only one BOMSequence
      if (Object.keys(partsByBomSequence).length === 1) {
        const bomSequenceKey = Object.keys(partsByBomSequence)[0];
        console.log("Single BOMSequence Key:", bomSequenceKey);

        if (partsByBomSequence[bomSequenceKey].length === 1) {
          calculatedRecOrder = partsByBomSequence[bomSequenceKey][0];
        } else {
          calculatedRecOrder = Math.max(...partsByBomSequence[bomSequenceKey]);
        }

        console.log(
          "Calculated Rec Order with single BOMSequence:",
          calculatedRecOrder
        );
      } else {
        // Multiple BOMSequences - calculate sum of max values
        for (const [bomSeq, recOrders] of Object.entries(partsByBomSequence)) {
          const maxRecOrder = Math.max(...recOrders);
          console.log(`BOMSequence: ${bomSeq}, Max RecOrder: ${maxRecOrder}`);
          calculatedRecOrder += maxRecOrder;
        }

        console.log(
          "Calculated Rec Order with multiple BOMSequences:",
          calculatedRecOrder
        );
      }
      
      const prodOrder = recProdOrderResult.recordset.length
        ? recProdOrderResult.recordset[0].ProductionOrder
        : 0;

      const adjustment = prodOrder - recOrder;
      const adjKb = adjustment === 0 ? 0 : adjustment / qpc;

      // Retrieve RecLotSize and PlanLotSize
      const lotSizeQuery = `
        SELECT [RecLotSize], [PlanLotSize]
        FROM [SSPCSdbo].[PatternActualData]
        WHERE [PatternActualDataID] = @actualID;
      `;
      const lotSizeResult = await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .query(lotSizeQuery);

      // const recLotSize = lotSizeResult.recordset.length
      //   ? lotSizeResult.recordset[0].RecLotSize
      //   : 0;

      const updatedPlanLotSize = lotSizeResult.recordset.length
        ? lotSizeResult.recordset[0].PlanLotSize
        : 0;

        const updateActualDataQuery = `
        UPDATE [SSPCSdbo].[PatternActualData]
        SET 
          [RecLotSize] = @calculatedRecOrder,
          [ModifiedBy] = @ModifiedBy,
          [ModifiedDate] = @ModifiedDate
        WHERE [PatternActualDataID] = @actualID;
      `;
      await pool
        .request()
        .input("calculatedRecOrder", sql.Int, calculatedRecOrder)
        .input("actualID", sql.Int, actualID)
        .input("ModifiedBy", sql.Int, user)
        .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
        .query(updateActualDataQuery);

      const updateQuery = `
        UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
        SET 
        [RecomendedOrder] = @recOrder,
            [OnOrder] = @OnOrder,
            [KanbanReturned] = @kbsReturned,
            [Stock] = @Stock,
          [Adjustment] = @Adjustment,
          [ModifiedBy] = @ModifiedBy,
          [ModifiedDate] = @ModifiedDate
        WHERE [PatternActualDataID] = @actualID
        AND [DieSetID] = @DieSetID
        AND [kitItemId] = @kitItemId;
      `;
      await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .input("DieSetID", sql.Int, DieSetID)
        .input("kitItemId", sql.Int, record.KitItemID)
        .input("Adjustment", sql.Int, adjKb)
        .input("ModifiedBy", sql.Int, user)
        .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
        .input("kbsReturned",sql.Int,kbsReturnedKanban)
        .input("recOrder", sql.Int, recOrder)
        .input("Stock", sql.Int, record.stock || 0)
        .input("OnOrder", sql.Int, onOrderKanban)
        .query(updateQuery);

      parts.push({
        id: idCounter++,
        childPart: record.part,
        qpc,
        onHold: record.onHold || 0,
        stock: `${stock}(${originalStock})`,
        bomType: dieSet,
        bomSeqNo: record.BOMSequence,
        orderToLine: Math.floor(record.onOrder / qpc),
        kbsInCirculation: totalKanbansInCirculation, // Assuming as not specified
        kbsRtd: Math.floor(record.kbsReturned / qpc),
        recKBs: Math.floor(recOrder / qpc),
        adj: adjKb,
        planLotSize: updatedPlanLotSize,
        onOrder: Math.floor(record.onOrder / qpc),
      });
    }
  }

  return parts;
}

async function handleOtherStatuses(dieSet, actualID, idCounter, user) {
  const pool = await sql.connect(config);
  const parts = [];

  // Query for parts detail
  const partsDetailQuery = `
     SELECT 
      k.KitItemID,
      k.BOMSequence,
      s.SKUCode AS part,
      si.SKUInventoryID,
      sc.SKUCostID,
      spm.Quantity AS qpc,
      SUM(CASE 
        WHEN sb.StockBucketCode IN ('PartsOK', 'PartsStorage','PartsBadLot', 'OnHoldOKParts', 'PartsNG', 'RepairWIP') THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS stock,
      SUM(CASE 
        WHEN sb.StockBucketCode IN ('WeldReturnNG', 'RepairedPartsNG', 'WeldReturnPartsNG', 'PartsNG', 'PartsBadLot', 'RepairWIP', 'OnHoldOKParts') THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS onHold,
      SUM(CASE 
        WHEN sb.StockBucketCode = 'KBsReturned' THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS kbsReturned,
      SUM(CASE 
        WHEN sb.StockBucketCode = 'OnOrder' THEN ss.BucketQuantityInStorageUOM 
        ELSE 0 
      END) AS onOrder
    FROM [dbo].[KitBOM] k
    JOIN [dbo].[SKU] s ON k.KitItemID = s.SKUID
    JOIN [dbo].[SKUInventory] si ON s.SKUID = si.SKUID
    JOIN [dbo].[SKUCost] sc ON si.SKUInventoryID = sc.SKUInventoryID
    LEFT JOIN [dbo].[SKUStock] ss ON sc.SKUCostID = ss.SKUCostID
    LEFT JOIN [dbo].[StockBucket] sb ON ss.StockBucketID = sb.StockBucketID
    LEFT JOIN [dbo].[SKUPackMapping] spm ON s.SKUID = spm.SKUID AND spm.IsDefault = 1
    WHERE k.BOMType = @dieSet
    GROUP BY 
      k.KitItemID,
      k.BOMSequence,
      s.SKUCode,
      si.SKUInventoryID,
      sc.SKUCostID,
      spm.Quantity
  `;

  const partsDetailResult = await pool
    .request()
    .input("dieSet", sql.VarChar, dieSet)
    .query(partsDetailQuery);

  const { DieSetID } = await reUsableFun.getBOMIDDetails(dieSet, config);

  for (const record of partsDetailResult.recordset) {
    const recPlanLotQuery = `
      SELECT [RecLotSize], [PlanLotSize]
      FROM [SSPCSdbo].[PatternActualData]
      WHERE [PatternActualDataID] = @actualID;
    `;

    const recPlanLotResult = await pool
      .request()
      .input("actualID", sql.Int, actualID)
      .query(recPlanLotQuery);

    const { RecLotSize, PlanLotSize } = recPlanLotResult.recordset[0] || {
      RecLotSize: 0,
      PlanLotSize: 0,
    };

    const adjustmentQuery = `
      SELECT [RecomendedOrder]
      ,[ProductionOrder]
      ,[TotalKanbanInCirculation]
      ,[Stock]
      ,[KanbanReturned]
      ,[OnOrder]
      ,[Adjustment]
      FROM [SSPCSdbo].[PlanLotsizeCalculation]
      WHERE [PatternActualDataID] = @actualID AND [KitItemID] = @kitItemID;
    `;

    const adjustmentResult = await pool
      .request()
      .input("actualID", sql.Int, actualID)
      .input("kitItemID", sql.Int, record.KitItemID)
      .query(adjustmentQuery);

    const adjustment =
      adjustmentResult.recordset.length > 0
        ? adjustmentResult.recordset[0].Adjustment
        : 0;

    let stock = adjustmentResult.recordset.length > 0? adjustmentResult.recordset[0].Stock:0;

    const qpc = record.qpc || 1; // Avoid division by zero
    const stockKanban = Math.floor( stock/ qpc);

    const onOrderKanban =
      adjustmentResult.recordset.length > 0
        ? adjustmentResult.recordset[0].OnOrder
        : 0;

    const totalKanbansInCirculation =
      adjustmentResult.recordset.length > 0
        ? adjustmentResult.recordset[0].TotalKanbanInCirculation
        : 0;

    const kbsReturnedKanban =
      adjustmentResult.recordset.length > 0
        ? adjustmentResult.recordset[0].KanbanReturned
        : 0;

    const recOrder =
      adjustmentResult.recordset.length > 0
        ? adjustmentResult.recordset[0].RecomendedOrder
        : 0;

    const recOrderKanban = Math.floor(recOrder / qpc);

    parts.push({
      id: idCounter++,
      childPart: record.part,
      qpc,
      onHold: record.onHold || 0,
      stock: `${stockKanban}(${stock})`,
      bomType: dieSet,
      bomSeqNo: record.BOMSequence,
      orderToLine: onOrderKanban,
      kbsInCirculation: totalKanbansInCirculation,
      kbsRtd: kbsReturnedKanban,
      recKBs: recOrderKanban,
      adj: adjustment,
      planLotSize: PlanLotSize,
      onOrder: onOrderKanban,
    });
  }

  return parts;
}

async function fetchPlannedLineStopForDieSet(dieSet, skuCategoryCode, idCounter) {
  try {
      const pool = await sql.connect(config);
 
      // SQL query to get planned line stops, where LineID corresponds to SKUCategoryID
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
              BOMTypeMaster.DieSet = @dieSet  -- Filter by dieSet
              AND PlannedLineStopMaster.LineID = (SELECT SKUCategoryID FROM [dbo].[SKUCategory] WHERE SKUCategoryCode = @skuCategoryCode)
              AND CAST(PatternActualData.Date AS DATE) = CAST(GETDATE() AS DATE)
              AND CAST(PatternActualData.Date AS DATETIME) + CAST(PatternActualData.PlanStartTime AS DATETIME) <= PlannedLineStopMaster.FromDateTime
              AND CAST(PatternActualData.Date AS DATETIME) + CAST(PatternActualData.PlanEndTime AS DATETIME) >= PlannedLineStopMaster.FromDateTime;
      `;
 
      // Execute the query with dieSet and skuCategoryCode as the input parameters
      const plannedLineResult = await pool
          .request()
          .input("dieSet", sql.VarChar, dieSet)
          .input("skuCategoryCode", sql.VarChar, skuCategoryCode)
          .query(plannedLineStopsQuery);
 
      // Array to hold processed line stops
      const plannedLineStops = [];
 
      // Loop through each record and get Shift and Line information
      for (const record of plannedLineResult.recordset) {
          // Get human-readable ShiftName and SKUCategoryCode for each line and shift
          const { shiftName, skuCategoryCode: fetchedSkuCategoryCode } = await reUsableFun.getShiftAndSKUCategory(
            record.ShiftID,
            record.LineID,
            config
          );
 
          // Add the processed record to the array with human-readable values
          plannedLineStops.push({
              id: idCounter++, // Increment the idCounter for each record
              lineNo: fetchedSkuCategoryCode, // Use the fetched SKUCategoryCode
              shift: shiftName, // Get ShiftName
              fromDateTime: record.FromDateTime,
              toDateTime: record.ToDateTime,
              remarks: record.Reason,
              bomType: dieSet,
          });
      }
 
      return plannedLineStops;
  } catch (error) {
      console.error("Error fetching planned line stops for dieSet:", error);
      throw error;
  }
}
 

async function getNextPatternSeqNo(shift,LineID, currentDate) {
  try {
    const pool = await sql.connect(config);
    // Query to get the current maximum PatternSeqNo
    const maxSeqNoQuery = `
            SELECT MAX([PartSeq]) AS maxSeqNo 
            FROM [SSPCSdbo].[PatternActualData] 
            WHERE [ShiftID] = @ShiftID AND [Date] = @currentDate AND [LineID]=@LineID;
        `;
    const maxSeqNoResult = await pool
      .request()
      .input("ShiftID", sql.Int, shift)
      .input("currentDate", sql.Date, currentDate)
      .input("LineID",sql.Int,LineID)
      .query(maxSeqNoQuery);

    // Determine the next PatternSeqNo
    const currentMaxSeqNo = maxSeqNoResult.recordset[0]?.maxSeqNo || 0;
    return currentMaxSeqNo + 1; // Return the next sequence number
  } catch (error) {
    console.error("Failed to get the next PatternSeqNo:", error);
    throw error; // Re-throw error for handling in the calling function
  }
}

async function getIsWorkingStatus(currentDate, shift, skuCategoryCode) {
  const pool = await sql.connect(config);
    const calendarResult = await pool
      .request()
      .input("currentDate", sql.Date, currentDate)
      .input("shift", sql.Int, shift)
      .input("skuCategoryCode", sql.NVarChar, skuCategoryCode).query(`
          SELECT [IsWorking]
          FROM [dbo].[Calendar]
          WHERE CONVERT(DATE, [Date]) = @currentDate
            AND [ShiftId] = @shift
            AND [Line] = @skuCategoryCode;
      `);
  
    return calendarResult.recordset[0]?.IsWorking;
}

async function addParts(DieSetID, ShiftId, date, SKUCategoryID, dieSet, loadTime, totalProdTime, lotSize, remarks, DieStorageBay, user, config){
  const pool = await sql.connect(config);
  const checkExistenceQuery = `
  SELECT [DieSetID], [ShiftID], [Date], [LineID], [Status]
  FROM [SSPCSdbo].[PatternActualData] 
  WHERE [DieSetID] = @DieSetID 
    AND [ShiftID] = @ShiftId 
    AND [Date] = @Date
    AND [LineID] = @LineID`;

const existenceResult = await pool
  .request()
  .input("DieSetID", sql.Int, DieSetID)
  .input("ShiftID", sql.Int, ShiftId)
  .input("Date", sql.Date, date)
  .input("LineID", sql.Int, SKUCategoryID)
  .query(checkExistenceQuery);

if (existenceResult.recordset.length > 0) {
  // Define the allowed statuses
  const allowedStatuses = [
    reUsableFun.ActionTypes['Skipped'],
    reUsableFun.ActionTypes['Completed'],
    reUsableFun.ActionTypes['Discontinued']
  ];

  // Check if all records have an allowed status
  const hasOnlyAllowedStatuses = existenceResult.recordset.every(record => 
    allowedStatuses.includes(record.Status)
  );

  // Return the message only if there are records with disallowed statuses
  if (!hasOnlyAllowedStatuses) {
    return "This DieSet already exists for the given shift and date.";
  }
}
  
      const qpc = await reUsableFun.getQPC(dieSet, config);
      console.log("QPC fetched:", qpc);
  
      if (!qpc) {
        return "Invalid QPC value.";
      }
  
      // Adjust the lotSize by dividing by qpc, rounding up, and multiplying back by qpc
      const adjustedLotSize = Math.ceil(lotSize / qpc) * qpc;
  
      // Get the next PatternSeqNo using the reusable function
      const nextSeqNo = await getNextPatternSeqNo(ShiftId, SKUCategoryID,date);
      console.log("Next Sequence Number:", nextSeqNo);
  
      // Construct and execute the SQL command with IF NOT EXISTS check and INSERT statement
      const query = `
                  INSERT INTO [SSPCSdbo].[PatternActualData] (
                      [DieSetID], [lineID], [ShiftID], [Date], [LoadTime], [TotalProdTime], [DieStorageBay], [PatternLotSize], [Reason],
                      [PlanStartTime], [PlanEndTime], [LotNo], [Status], 
                      [ActualLoadTime], [ActualLotsize], 
                      [ActualOrderingTime], [ActualOrderCycleID], [PartSeq], [PlanType],[CreatedBy], [CreatedDate]
                  ) VALUES (
                      @DieSetID, @SKUCategoryID, @ShiftID, @date, @LoadTime, @TotalProdTime, @DieStorageBay, @PatternLotSize, @remarks,
                      '00:00', '00:00', 'NA', 1,  
                      0, 0, @ActualOrderingTime, 1, @PartSeq, 2, @CreatedBy, @CreatedDate
                  );
          `;
  
      // Execute the SQL query with all necessary input parameters
      await pool
        .request()
        .input("DieSetID", sql.Int, DieSetID)
        .input("SKUCategoryID", sql.Int, SKUCategoryID)
        .input("ShiftID", sql.Int, ShiftId)
        .input("Date", sql.Date, date) // Correctly declaring and passing the Date parameter
        .input("LoadTime", sql.Int, loadTime) // Dummy value for Load Time
        .input("TotalProdTime", sql.Int, totalProdTime)
        .input("DieStorageBay", sql.NVarChar, DieStorageBay)
        .input("PatternLotSize", sql.Int, adjustedLotSize) // Pass the planLotsize from request body
        .input("remarks", sql.NVarChar, remarks)
        .input("ActualOrderingTime", sql.DateTime, new Date()) // Current Date/Time
        .input("PartSeq", sql.Int, nextSeqNo) // Use the next sequence number
        .input("CreatedBy", sql.Int, user)
        .input("CreatedDate", sql.DateTime, reUsableFun.getISTDate())
        .query(query);
  
      // Respond back
      reUsableFun.reCalculatePatternStartAndEndTime(date, SKUCategoryID, ShiftId, config);
      //res.send("Added to Plan!");
      return "Added to Plan!";
}

async function addFLVT(DieSetID, dieSet, flvtLotSize, ShiftId, SKUCategoryID, date, DieStorageBay, user, line, config){
  const pool = await sql.connect(config);

  const checkExistenceQuery = `
  SELECT [DieSetID], [ShiftID], [Date], [LineID], [Status]
  FROM [SSPCSdbo].[PatternActualData] 
  WHERE [DieSetID] = @DieSetID 
    AND [ShiftID] = @ShiftId 
    AND [Date] = @Date
    AND [LineID] = @LineID`;

const existenceResult = await pool
  .request()
  .input("DieSetID", sql.Int, DieSetID)
  .input("ShiftID", sql.Int, ShiftId)
  .input("Date", sql.Date, date)
  .input("LineID", sql.Int, SKUCategoryID)
  .query(checkExistenceQuery);

if (existenceResult.recordset.length > 0) {
  // Define the allowed statuses
  const allowedStatuses = [
    reUsableFun.ActionTypes['Skipped'],
    reUsableFun.ActionTypes['Completed'],
    reUsableFun.ActionTypes['Discontinued']
  ];

  // Check if all records have an allowed status
  const hasOnlyAllowedStatuses = existenceResult.recordset.every(record => 
    allowedStatuses.includes(record.Status)
  );

  // Return the message only if there are records with disallowed statuses
  if (!hasOnlyAllowedStatuses) {
    return "This DieSet already exists for the given shift and date.";
  }
}

  // Initialize variables
  let loadTime, totalProdTime;
  let patternLotSize = flvtLotSize;

  if (flvtLotSize === 0) {
    // Combine queries to minimize database round trips
    const combinedQuery = `
              SELECT 
                  TOP(1) [PatternLoadTime],
                  (SELECT TOP(1) [PatternLotSize] 
                   FROM [SSPCSdbo].[PatternRawDataUpload] 
                   WHERE [DieSet] = @dieSet) AS PatternLotSize 
              FROM [SSPCSdbo].[PatternDataInterpretation] 
              WHERE [DieSetID] = @DieSetID
          `;

    const combinedResult = await pool
      .request()
      .input("DieSetID", sql.Int, DieSetID)
      .input("dieSet", sql.VarChar, dieSet)
      .query(combinedQuery);

    loadTime = combinedResult.recordset[0]?.PatternLoadTime || 0;
    patternLotSize = combinedResult.recordset[0]?.PatternLotSize || 0;
    totalProdTime =  await reUsableFun.getTotalProdTime(dieSet, config);
    console.log("Total Production Time:", totalProdTime);
  } else {
    // Call function to calculate load time
    const { EfficiencyPT, TotalProductionTime} = await reUsableFun.calculateLoadTimeForDieSet(dieSet, line, flvtLotSize, config);
    loadTime = EfficiencyPT;
    totalProdTime = TotalProductionTime;
  }

  // Fetch the next PatternSeqNo
  const nextSeqNo = await getNextPatternSeqNo(ShiftId, SKUCategoryID,date);

  // Insert the record if not exists (use a MERGE statement for optimization)
  const insertQuery = `
    INSERT INTO [SSPCSdbo].[PatternActualData] 
        ([DieSetID], [LineID], [ShiftID], [Date], [LoadTime], [TotalProdTime], [DieStorageBay], [PatternLotSize],
         [PlanStartTime], [PlanEndTime], [LotNo], [Status], 
         [ActualLoadTime], [ActualLotsize], 
         [ActualOrderingTime], [ActualOrderCycleID], [PartSeq], [PlanType], [CreatedBy], [CreatedDate])
    VALUES 
        (@DieSetID, @SKUCategoryID, @ShiftId, @Date, @LoadTime, @TotalProdTime, @DieStorageBay, @patternLotSize, 
         '00:00', '00:00', 'NA', 1, 0, 0, @ActualOrderingTime, 1, @PatternSeqNo, 3, @CreatedBy, @CreatedDate);
`;


  // Execute the insert query
  await pool
    .request()
    .input("DieSetID", sql.Int, DieSetID)
    .input("SKUCategoryID", sql.Int, SKUCategoryID)
    .input("ShiftId", sql.Int, ShiftId)
    .input("Date", sql.Date, date)
    .input("LoadTime", sql.Int, loadTime) // Convert seconds to minutes
    .input("TotalProdTime", sql.Int, totalProdTime)
    .input("DieStorageBay", sql.NVarChar, DieStorageBay)
    .input("PatternLotSize", sql.Int, patternLotSize)
    .input("ActualOrderingTime", sql.DateTime, new Date()) // Current date/time
    .input("PatternSeqNo", sql.Int, nextSeqNo) // Next sequence number
    .input("CreatedBy", sql.Int, user)
    .input("CreatedDate", sql.DateTime, reUsableFun.getISTDate())
    .query(insertQuery);

  // Recalculate pattern start and end time (async)
  reUsableFun.reCalculatePatternStartAndEndTime(date, SKUCategoryID, ShiftId, config);

  // Success response
  return "Added to plan successfully.";
}

//  async function isWithinTwoHours(shiftEndTime) {
//   // Get current date and time
//   const now = new Date();

//   // Extract hours, minutes, seconds from shiftEndTime (assumed format: "HH:mm:ss")
//   const [shiftEndHours, shiftEndMinutes, shiftEndSeconds] = shiftEndTime.split(":").map(Number);

//   // Create a Date object for shiftEndTime (set to today's date)
//   const shiftEndDate = new Date(now);
//   shiftEndDate.setHours(shiftEndHours, shiftEndMinutes, shiftEndSeconds, 0);

//   // Calculate the threshold time (2 hours before shiftEndTime)
//   const thresholdTime = new Date(shiftEndDate);
//   thresholdTime.setHours(thresholdTime.getHours() - 2);

//   // Return true if current time is within the 2-hour window, otherwise false
//   return now >= thresholdTime;
// }
async function isWithinTwoHours(shiftEndTime) {
  const now = new Date();

  const [shiftEndHours, shiftEndMinutes, shiftEndSeconds] = shiftEndTime
    .split(":")
    .map(Number);

  // Build the shift end date starting from today
  const shiftEndDate = new Date(now);
  shiftEndDate.setHours(shiftEndHours, shiftEndMinutes, shiftEndSeconds, 0);

  // If shift end is "before" now, assume it's the next day (for night shifts)
  if (shiftEndDate < now) {
    shiftEndDate.setDate(shiftEndDate.getDate() + 1);
  }

  // Calculate threshold time (2 hours before shift end)
  const thresholdTime = new Date(shiftEndDate);
  thresholdTime.setHours(thresholdTime.getHours() - 2);

  // Return true if current time is within the 2-hour window before shift end
  return now >= thresholdTime && now <= shiftEndDate;
}


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

exports.nextShiftQueueGetLineOptions = async(req, res) => {
    try {
      const pool = await sql.connect(config);
      const lineQuery = `SELECT SKUCategoryID, SKUCategoryCode FROM SKUCategory`;
      const lineResult = await pool.request().query(lineQuery);
      const lineOptions = lineResult.recordset.map((row) => ({
        id: row.SKUCategoryID,
        code: row.SKUCategoryCode,
      }));
  
      // Return line options for the dropdown
      res.status(200).json(lineOptions);
    } catch (error) {
      console.error("Error fetching line options:", error);
      logger.customerLogger.error("Error fetching line options in getLineoptions method:", error)
      res.send("Server error");
    }
}

exports.nextShiftQueueGetShiftDetails = async(req, res) => {
  try {
    // const pool = await sql.connect(config);
    // const startTime = Date.now();
    // // Fetch current date and time
    // const currentDate = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD
    // const currentTime = new Date().toTimeString().split(" ")[0]; // Format as HH:MM:SS

    // // Extract line selection from the request body
    // const { lineId } = req.body;
    // console.log("Line to be Queued",lineId);

    // // Query to get ShiftID based on the current time
    // const shiftQuery = `
    //         SELECT TOP (1) [ShiftId]
    //         FROM [dbo].[ShiftHeader]
    //         WHERE (@currentTime >= [ShiftStartTime] AND @currentTime < [ShiftEndTime])
    //            OR ([ShiftStartTime] > [ShiftEndTime] AND (@currentTime >= [ShiftStartTime] OR @currentTime < [ShiftEndTime]))
    //     `;

    // const shiftResult = await pool.request()
    // .input('currentTime', sql.Time,currentTime)
    // .query(shiftQuery);



    // console.log(
    //   `Get Shift Execution time: ${(Date.now() - startTime) / 1000} seconds`
    // );
    // const shift = shiftResult.recordset[0]?.ShiftId || null;

    // if (!shift) {
    //   return res
    //     .status(400)
    //     .json({ message: "Unable to determine shift based on current time." });
    // }

    // // Create request body for currentShiftDetails API
    // const requestBody = {
    //   currentDate,
    //   currentTime,
    //   shift,
    //   line: lineId,
    // };

    // // Log the created request body
    // console.log("Request body for currentShiftDetails API:", requestBody);

    // // Return the created request body as response (or you can proceed to call the currentShiftDetails API)
    // res.status(200).json(requestBody);
    
        const pool = await sql.connect(config);
         const startTime = Date.now();
        // // Fetch current date and time
        // const currentDate = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD
        // const currentTime = new Date().toTimeString().split(" ")[0]; // Format as HH:MM:SS
        // logger.customerLogger.info("Current Time nextShiftQueue:",currentTime);
        let date = new Date();
    let DateAndTimeStr = reUsableFun.getFormattedSeperateDateAndTime(date);
    const currentDate = DateAndTimeStr.dateStr;
    const currentTime = DateAndTimeStr.timeStr;
    logger.customerLogger.info("Current Time:",currentTime);
    
        // Extract line selection from the request body
        const { lineId } = req.body;
    
        // Query to get ShiftID based on the current time
        const shiftQuery = `
                SELECT TOP (1) [ShiftId]
                FROM [dbo].[ShiftHeader]
                WHERE (@currentTime >= [ShiftStartTime] AND @currentTime < [ShiftEndTime])
                   OR ([ShiftStartTime] > [ShiftEndTime] AND (@currentTime >= [ShiftStartTime] OR @currentTime < [ShiftEndTime]))
            `;
    
        const shiftResult = await pool
          .request()
          .input("currentTime", sql.Time, currentTime)
          .query(shiftQuery);
    
        console.log(
          `Get Shift Execution time: ${(Date.now() - startTime) / 1000} seconds`
        );
        const shift = shiftResult.recordset[0]?.ShiftId || null;
        logger.customerLogger.info("Shift:",shift);
    
        if (!shift) {
          logger.customerLogger.error("Unable to determine shift based on current time.");
          return res
            .status(400)
            .json({ message: "Unable to determine shift based on current time." });
        }
    
        // Create request body for currentShiftDetails API
        const requestBody = {
          currentDate,
          currentTime,
          shift,
          line: lineId,
        };
        logger.customerLogger.info("RequestBody from getShiftDetails nextShiftQueue:",requestBody);
    
        // Log the created request body
        console.log("Request body for nextShiftQueueDetails API:", requestBody);
    
        // Return the created request body as response (or you can proceed to call the currentShiftDetails API)
        res.status(200).json(requestBody);
      
  } catch (error) {
    console.error("Error creating request body:", error);
    logger.customerLogger.error("Error creating request body in getShiftDetails method:", error)
    res.send("Server error");
  }
}

exports.nextShiftQueueDetails = async(req, res) => {
  const pool = await sql.connect(config);
  try {
    const startTime = Date.now();
    let response;
    let { currentDate, currentTime, shift, line, user } = req.body.header;

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

//       if(shiftCode === "N_C"){
//         //const currentDate = '2025-06-23';

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

//       }
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
  
    const [
      { shiftName, skuCategoryCode },
      { shiftGroupName, shiftCellColor },
      isWorking,
    ] = await Promise.all([
      reUsableFun.getShiftAndSKUCategory(nextShift, line,config),
      reUsableFun.getShiftGroupName(nextShift, currentDate, line, config),
      getIsWorkingStatus(currentDate, nextShift, line),
    ]);

    shift = nextShift;
    currentDate = nextDate;

     if(await isWithinTwoHours(shiftEndTime) ){

    // Query to get records from PatternDataInterpretation table
    const query = `
        SELECT [PatternInterpretationID],[PatternUploadID],[ScheduledDate],[LineID],[ShiftID],[PatternNo]
            ,[PartSeq],[DieSetID],[PatternLoadTime],[PatternStartTime],[PatternEndTime] FROM [SSPCSdbo].[PatternDataInterpretation]
            WHERE [ScheduledDate] = @currentDate AND [ShiftID] = @shift AND [LineID] = @line`;

    const dataResult = await pool
      .request()
      .input("currentDate", sql.Date, currentDate)
      .input("shift", sql.Int, shift)
      .input("line", sql.Int, line)
      .query(query);

    const grid = [];
    const globalDieSets = [];
    const globalActualIds = [];
    const globalDieSetsMap = new Map();

    for (const record of dataResult.recordset) {
      const { bomType, dieStorageBay } = await reUsableFun.getBOMTypeDetails(record.DieSetID, config);
      const totalProdTime = await reUsableFun.getTotalProdTime(bomType, config);

      //getQPC
      //const qpc = await getQPC(bomType) || 1;
      const status =
        isWorking === 0
          ? reUsableFun.ActionTypes["Skipped"]
          : reUsableFun.ActionTypes["To be Scheduled"];

      // Convert PatternLoadTime from seconds to minutes
      const loadTime = record.PatternLoadTime
        ? record.PatternLoadTime
        : 0;

      // Query to get PatternLotSize from PatternRawDataUpload using bomType
      const patternLotSizeQuery = `SELECT [RoundUpLotSize] FROM [SSPCSdbo].[PatternRawDataUpload] WHERE [DieSet] = @bomType AND [PatternUploadID] = @patternUploadID`;
      
            const patternLotSizeResult = await pool
              .request()
              .input("bomType", sql.VarChar, bomType)
              .input("patternUploadID", sql.Int, record.PatternUploadID)
              .query(patternLotSizeQuery);

      const ptnLotSize =
        patternLotSizeResult.recordset[0]?.RoundUpLotSize ||
        "Unknown PatternLotSize";

      const patternActualData = {
        PatternInterpretationID: record.PatternInterpretationID,
        PatternUploadID: record.PatternUploadID,
        BOMTypeID: record.DieSetID,
        Date: record.ScheduledDate,
        PatternSeqNo: record.PartSeq,
        PatternName: record.PatternNo,
        PlanStartTime: record.PatternStartTime,
        PlanEndTime: record.PatternEndTime,
        LoadTime: loadTime,
        TotalProductionTime: totalProdTime,
        DieStorageBay: dieStorageBay,
        PatternLotSize: ptnLotSize,
        RecLotSize: 0,
        PlanLotSize: 0,
        lotNo: "NA",
        Status: status,
        ActualStartTime: "NA", 
        ActualEndTime: "NA", 
        ActualLoadTime: 0, 
        ActualLotsize: 0, 
        ActualOrderingTime: new Date(), 
        ActualOrderCycleID: 1, 
      };

      // Check if the record exists
      const checkQuery = `SELECT COUNT(*) as count FROM [SSPCSdbo].[PatternActualData] WHERE [PatternInterpretationID] = @PatternInterpretationID AND [PatternUploadID] = @PatternUploadID`;
      const checkResult = await pool
        .request()
        .input(
          "PatternInterpretationID",
          sql.Int,
          patternActualData.PatternInterpretationID
        )
        .input("PatternUploadID", sql.Int, patternActualData.PatternUploadID)
        .query(checkQuery);

      const exists = checkResult.recordset[0].count > 0;

      if (!exists) {
        // Insert new record
        const insertQuery = `INSERT INTO [SSPCSdbo].[PatternActualData] ([PatternInterpretationID],[PatternUploadID],[DieSetID],[LineID],[ShiftID],
                    [Date],[PartSeq],[PatternNo],[PlanStartTime],[PlanEndTime],[LoadTime],[TotalProdTime],[DieStorageBay],[PatternLotSize],[RecLotSize],[PlanLotSize],[LotNo],
                    [Status],[ActualLoadTime],[ActualLotsize],[ActualOrderingTime],[ActualOrderCycleID],[PlanType],[CreatedBy]
      ,[CreatedDate])
                    VALUES (@PatternInterpretationID,@PatternUploadID,@BOMTypeID,@line,@shift,@Date,@PatternSeqNo,@PatternName,@PlanStartTime,@PlanEndTime,@LoadTime,@totalProdTime,@DieStorageBay,@PatternLotSize,@RecLotSize,@PlanLotsize,
                   @LotNo,@Status,@ActualLoadTime,@ActualLotsize,@ActualOrderingTime,@ActualOrderCycleID,1,@CreatedBy,@CreatedDate)`;
        await pool
          .request()
          .input(
            "PatternInterpretationID",
            sql.Int,
            patternActualData.PatternInterpretationID
          )
          .input("PatternUploadID", sql.Int, patternActualData.PatternUploadID)
          .input("BOMTypeID", sql.Int, patternActualData.BOMTypeID)
          .input("line", sql.Int, line)
          .input("shift", sql.Int, shift)
          .input("Date", sql.Date, patternActualData.Date)
          .input("PatternSeqNo", sql.Int, patternActualData.PatternSeqNo)
          .input("PatternName", sql.NVarChar, patternActualData.PatternName)
          .input("PlanStartTime", sql.NVarChar, patternActualData.PlanStartTime)
          .input("PlanEndTime", sql.NVarChar, patternActualData.PlanEndTime)
          .input("LoadTime", sql.Int, patternActualData.LoadTime)
          .input("totalProdTime", sql.Int, patternActualData.TotalProductionTime)
          .input("DieStorageBay", sql.NVarChar, patternActualData.DieStorageBay)
          .input("PatternLotSize", sql.Int, patternActualData.PatternLotSize)
          .input("RecLotSize", sql.Int, patternActualData.RecLotSize)
          .input("PlanLotsize", sql.Int, patternActualData.PlanLotSize)
          .input("LotNo", sql.NVarChar, patternActualData.lotNo)
          .input("Status", sql.NVarChar, patternActualData.Status)
          .input("ActualLoadTime", sql.Int, patternActualData.ActualLoadTime)
          .input("ActualLotsize", sql.Int, patternActualData.ActualLotsize)
          .input("ActualOrderingTime",sql.DateTime, patternActualData.ActualOrderingTime)
          .input("ActualOrderCycleID",sql.Int,patternActualData.ActualOrderCycleID)
          .input("CreatedBy", sql.Int,user)
          .input("CreatedDate", sql.DateTime,reUsableFun.getISTDate())
          .query(insertQuery);
      }
    }

    reUsableFun.reCalculatePatternStartAndEndTime( currentDate, line, shift, config);


    const patternActualQuery = `
                SELECT * 
                FROM [SSPCSdbo].[PatternActualData]
                WHERE [ShiftID] = @shift 
                  AND [Date] = @currentDate 
                  AND [LineID] = @line
                ORDER BY [PartSeq] ASC;
            `;

    const patternActualResult = await pool
      .request()
      .input("shift", sql.Int, shift)
      .input("currentDate", sql.Date, currentDate)
      .input("line", sql.Int, line)
      .query(patternActualQuery);

    // Process each record retrieved from PatternActualData
    for (const actualData of patternActualResult.recordset) {
      // Fetch BOMType and DieStorageBay using the reusable function
      const { bomType: BOMType, dieStorageBay } = await reUsableFun.getBOMTypeDetails(
        actualData.DieSetID,
        config
      );

      const qpc = (await reUsableFun.getQPC(BOMType,config));
      const pallets = Math.floor(actualData.PlanLotSize / qpc);
      const ptnPallets = Math.floor(actualData.PatternLotSize / qpc);
      const recPallets = Math.floor(actualData.RecLotSize / qpc);

      // Define variables for the lot sizes
      let ptnLotSize = `${ptnPallets}(${actualData.PatternLotSize})`;
      let recLotSize = `${recPallets}(${actualData.RecLotSize})`;


      // Add BOMType to globalDieSets if not already present

      globalDieSets.push(BOMType);
      globalActualIds.push(actualData.PatternActualDataID);

      // Get row colors based on the status
      let { rowColor, statusTextColor, statusTextBgColor } =
        await reUsableFun.getRowColorsByStatus(actualData.Status);
        let dieSetTextBgColor,dieSetTextColor;
      let MBSpecific = await reUsableFun.getMBSpecificValue(actualData.DieSetID);
      console.log("MBSpecific:",MBSpecific);
      if (MBSpecific){
        dieSetTextColor = '#050505';
        dieSetTextBgColor = '#ffa1a1';
      }
        if(actualData.PartSeq < 1){
          rowColor = "#fac16e";
        }
      const actualStatus = actualData.Status;
      let lotNumber;
      if(reUsableFun.ActionTypesReverse[actualStatus] === "Queued"){
        lotNumber = 'NA';
      }
      else{
        lotNumber = actualData.LotNo || "NA";
      }
      const totalProdTime = actualData.TotalProdTime?Math.floor(actualData.TotalProdTime/60):0;
      const loadTime = actualData.LoadTime?Math.floor(actualData.LoadTime/60):0;
      const actualLoadTime = actualData.ActualLoadTime?Math.floor(actualData.ActualLoadTime/60):0;

      patternNo = actualData.PatternNo;

      // Push the data into the grid array
      grid.push({
        actualID: actualData.PatternActualDataID,
        ptns: actualData.PatternNo || "-",
        seq: actualData.PartSeq || "NA",
        dieBay: dieStorageBay || "Unknown DieStorageBay",
        dieSet: BOMType || "Unknown BOMType",
        planStartAndEnd: actualData.PlanStartTime === null && actualData.PlanEndTime === null? "0-0":`${actualData.PlanStartTime} - ${actualData.PlanEndTime}`,
        loadTime: `${totalProdTime}(${loadTime})` || "NA",
        ptnLotSize,
        recLotSize,
        planLotSize: `${pallets}(${actualData.PlanLotSize})`,
        status: reUsableFun.ActionTypesReverse[actualStatus] || "NA",
        lotNo: lotNumber,
        actualLotSize: actualData.ActualLotsize || "NA",
        actualStartAndEnd:actualData.ActualStartTime? `${actualData.ActualStartTime} - ${actualData.ActualEndTime || "--:--:--"}`: "NA",
        actualLoadTime:actualLoadTime || "NA",
        delay: actualData.ActualLoadTime ? actualLoadTime - loadTime : "NA",
        rowColor,
        statusTextColor,
        statusTextBgColor,
        dieSetTextColor,
        dieSetTextBgColor,
        partsStock: [],
        materialStock: [],
        emptyPallets: [],
        loadTimeCalculations: [],
      });
    }

    let allMaterialsStock = [];

for (let i = 0; i < globalDieSets.length; i++) {
  const dieSet = globalDieSets[i];
  const materialsStockForDieSet = await fetchMaterialsDetailForDieSet(
    dieSet,
    globalIdCounter
  );
  allMaterialsStock = allMaterialsStock.concat(materialsStockForDieSet);
  globalIdCounter += materialsStockForDieSet.length;
  grid[i].materialStock = materialsStockForDieSet.map(
    (stock) => stock.id
  );
}


    let allEmptyPallets = [];
for (let i = 0; i < globalDieSets.length; i++) {
  const dieSet = globalDieSets[i];
  const emptyPalletsForDieSet = await fetchPalletsDetailForDieSet(
    dieSet,
    globalEmptyPalletsIdCounter
  );
  allEmptyPallets = allEmptyPallets.concat(emptyPalletsForDieSet);
  globalEmptyPalletsIdCounter += emptyPalletsForDieSet.length;
  grid[i].emptyPallets = emptyPalletsForDieSet.map(
    (pallet) => pallet.id
  );
}


    let allParts = [];
    for (let i = 0; i < globalDieSets.length; i++) {
      const dieSet = globalDieSets[i];
      const actualID = globalActualIds[i]; // Fetch the corresponding actualID
      const partsDetailForDieSet = await fetchPartsDetailForDieSet(
        dieSet,
        actualID,
        globalPartIdCounter,
        shiftName,
        skuCategoryCode,
        currentDate,
        user
      );
      allParts = allParts.concat(partsDetailForDieSet);
      globalPartIdCounter += partsDetailForDieSet.length;
      grid[i].partsStock = partsDetailForDieSet.map((part) => part.id);
    }

    const updatedPatternActualQuery = `
            SELECT * 
            FROM [SSPCSdbo].[PatternActualData]
            WHERE [ShiftID] = @shift AND [Date] = @currentDate AND [LineID] = @line
            ORDER BY [PartSeq] ASC;
        `;

    const updatedPatternActualResult = await pool
      .request()
      .input("shift", sql.Int, shift)
      .input("currentDate", sql.Date, currentDate)
      .input("line", sql.Int, line)
      .query(updatedPatternActualQuery);

    // Now update the grid with the updated data
    for (const actualData of updatedPatternActualResult.recordset) {
      const { bomType: dieSet, dieStorageBay } = await reUsableFun.getBOMTypeDetails(
        actualData.DieSetID,
        config
      );
      const qpc = await reUsableFun.getQPC(dieSet,config);
      const recLotSizePallets = Math.floor(actualData.RecLotSize / qpc);
      const planLotSizePallets = Math.floor(actualData.PlanLotSize / qpc);

      const gridRecord = grid.find(
        (gr) => gr.actualID === actualData.PatternActualDataID
      );
      if (gridRecord) {
        if(actualData.PlanType === 2){
          gridRecord.recLotSize = `${recLotSizePallets}(${actualData.RecLotSize})`;
          gridRecord.planLotSize = `${planLotSizePallets}(${actualData.PlanLotSize})`;
        }
        else{
          gridRecord.recLotSize = `${recLotSizePallets}(${actualData.RecLotSize})`;
          gridRecord.planLotSize = `${planLotSizePallets}(${actualData.PlanLotSize})`;
        }
        let ptnMatch = gridRecord.ptnLotSize.match(/\((\d+)\)/);
        let recMatch = gridRecord.recLotSize.match(/\((\d+)\)/);
        
        // Ensure match exists before accessing
        let ptnLotSizeValue = ptnMatch ? parseInt(ptnMatch[1], 10) : 0;
        let recLotSizeValue = recMatch ? parseInt(recMatch[1], 10) : 0;
        
        // Compare the extracted values
        if (recLotSizeValue > ptnLotSizeValue) {
            gridRecord.rowColor = "#cccccc";
        }

      }
    }

    let allLoadTimeCalculations = [];
    for (let i = 0; i < globalDieSets.length; i++) {
      const dieSet = globalDieSets[i];
      const actualID = globalActualIds[i]; // Fetch the corresponding actualID
      const loadTimeForDieSet = await fetchLoadTimeCalculationsForDieSet(
        dieSet,
        skuCategoryCode,
        shift,
        currentDate,
        actualID,
        globalLoadTimeCounter
      );
      allLoadTimeCalculations = 
        allLoadTimeCalculations.concat(loadTimeForDieSet);
      globalLoadTimeCounter += loadTimeForDieSet.length;
      grid[i].loadTimeCalculations = loadTimeForDieSet.map((loadTime) => loadTime.id);
    }
    
    let allPlannedLineStop = [];
for (let i = 0; i < globalDieSets.length; i++) {
  const dieSet = globalDieSets[i];
  const plannedLineStopForDieSet = await fetchPlannedLineStopForDieSet(
    dieSet,
    skuCategoryCode,
    globalPlannedLineCounter
  );
  allPlannedLineStop = allPlannedLineStop.concat(plannedLineStopForDieSet);
  globalPlannedLineCounter += plannedLineStopForDieSet.length;
  grid[i].plannedLine = plannedLineStopForDieSet.map((lineStop) => lineStop.id);
}


    let allLotAdjustments = [];
    for (let i = 0; i < grid.length; i++) {
      const dieSet = globalDieSets[i]; // Use the dieSet from globalDieSets
      const actualID = globalActualIds[i]; // Use the actualID from globalActualIds
    
      const lotAdjustmentsForDieSet = await fetchLotAdjustmentsForDieSet(
        dieSet,
        actualID,
        globalLotAdjustmentCounter,
        grid[i].ptnLotSize, // Access the record's properties from grid
        grid[i].planLotSize
      );
      
      allLotAdjustments = allLotAdjustments.concat(lotAdjustmentsForDieSet);
      globalLotAdjustmentCounter += lotAdjustmentsForDieSet.length;
    
      // Update the grid record with the matched lot adjustment IDs
      grid[i].lotAdjustments = lotAdjustmentsForDieSet.map(
        (adjustment) => adjustment.id
      );
      console.log("GRID :",grid[i].lotAdjustments);
    }
    


    // Query to get all BOMTypes from PQ for Add other parts
    const allBomTypesQuery = `WITH UniqueBOMTypes AS (
 SELECT DISTINCT [DieSet]
 FROM [SSPCSdbo].[PQDataUpload]
 WHERE [LineName] = @skuCategoryCode and EffectiveFrom = (SELECT DISTINCT top(1) EffectiveFrom FROM SSPCSdbo.PQDataUpload WHERE LineName= @skuCategoryCode
                  ORDER BY EffectiveFrom DESC)
)
SELECT u.[DieSet], b.[DieStorageBay]
FROM UniqueBOMTypes u
JOIN [SSPCSdbo].[BOMTypeMaster] b
 ON u.[DieSet] = b.[DieSet];`;

 const allBomTypesResult = await pool.request()
 .input('skuCategoryCode', sql.VarChar, skuCategoryCode) // Provide the input parameter
 .query(allBomTypesQuery);
const otherParts = allBomTypesResult.recordset.map((record) => ({
dieSet: record.DieSet,
dieStorageBay: record.DieStorageBay,
}));

    const flvtQuery = `
    SELECT 
        p.[DieSet], 
        p.[Variant], 
        p.[FLVTLotSize], 
        p.[SafetyStock], 
        p.[RoundUpSafetyStock], 
        p.[PullRatePerSec], 
        b.[ProductionTriggerInSec],
        b.[DieStorageBay] -- Include dieStorageBay from BOMTypeMaster
    FROM 
        [SSPCSdbo].[PQDataUpload] p
    INNER JOIN 
        [dbo].[Calendar] c 
        ON CONVERT(DATE, c.[Date]) = @currentDate 
        AND p.[LineName] = c.[Line] 
        AND c.[ShiftId] = @shift 
        AND c.[IsWorking] = 1
    LEFT JOIN 
        [SSPCSdbo].[BOMTypeMaster] b 
        ON p.[DieSet] = b.[DieSet] 
    WHERE 
        @currentDate BETWEEN p.[EffectiveFrom] AND p.[EffectiveTo]
        AND p.[LineName] = @skuCategoryCode;
`;
    const flvtResult = await pool
      .request()
      .input("currentDate", sql.Date, currentDate)
      .input("shift", sql.Int, shift)
      .input("skuCategoryCode", sql.VarChar, skuCategoryCode)
      .query(flvtQuery);

    const flvtParts = []; // Final array to hold sorted results

// Temporary arrays to categorize records based on conditions
const flvtSizeZeroAndBelowSafetyStock = [];
const flvtSizeGreaterAndBelowSafetyStock = [];
const flvtSizeGreaterOnly = [];

for (const record of flvtResult.recordset) {
  //if (!globalDieSetsMap.has(record.DieSet)) {
    const pullRate = record.PullRatePerSec; // 0.01

    // Get the stock for the variant
    const stock = await reUsableFun.getStockByVariant(record.DieSet, config);

      let partStock = await reUsableFun.getPartStockByVariant(
        record.Variant,
        config
      );

      const productionTriggerInSec = record.ProductionTriggerInSec || 0;

      partStock = partStock < 0 ? 0 : partStock;

      // Calculate stockDepletionTime
      let stockDepletionTime = 0.0;
      // if(partStock !==0){
      //   stockDepletionTime = Math.round(partStock / (pullRate * 3600));
      // }
      if (partStock !== 0) {
        const denominator = parseFloat((pullRate * 3600).toFixed(1));
        stockDepletionTime = partStock / (denominator > 0? denominator: 1);
        stockDepletionTime = parseFloat(stockDepletionTime.toFixed(1));
      }

    // Get material using getYZA function
    const { material } = await reUsableFun.getYZA(record.Variant, config);

    let rowHighlightColor = "#fff";
    let projectedStockCellColor = "#fff";
    let projectedStockTextColor = "#000";

    if (partStock <= record.RoundUpSafetyStock && record.FLVTLotSize === 0) {
      rowHighlightColor = "#FFB9B9";
      projectedStockCellColor = "#FF0000";
      projectedStockTextColor = "#ffffff";
    } else if(partStock <= record.RoundUpSafetyStock && record.FLVTLotSize > 0){
      rowHighlightColor = "#f7c988";
      projectedStockCellColor = "#f79c19";
      projectedStockTextColor = "#ffffff";
    }

    const dataToPush = {
      dieBay: record.DieStorageBay,
      dieSet: record.DieSet,
      childPart: record.Variant,
      flvtLotSize: record.FLVTLotSize === 0 ? "-" : record.FLVTLotSize,
      safetyStock: record.RoundUpSafetyStock,
      onOrder: 0,
      bomSeq: 1, // hardcoded value
      prodTriggerHr: parseFloat((productionTriggerInSec / 3600).toFixed(2)),
      stock: stock,
      projectedStock: `${partStock}(${stockDepletionTime.toFixed(1)})`,
      material: material,
      rowHighlightColor: rowHighlightColor,
      projectedStockCellColor: projectedStockCellColor,
      projectedStockTextColor: projectedStockTextColor,
    };

    // Categorize the records into respective arrays
    if (record.FLVTLotSize === 0 && partStock <= record.RoundUpSafetyStock) {
      flvtSizeZeroAndBelowSafetyStock.push(dataToPush);
    } else if (record.FLVTLotSize > 0 && partStock <= record.RoundUpSafetyStock) {
      flvtSizeGreaterAndBelowSafetyStock.push(dataToPush);
    } else if (record.FLVTLotSize > 0) {
      flvtSizeGreaterOnly.push(dataToPush);
    }
  //}
}

// Sort each array by stockDepletionTime in ascending order
flvtSizeZeroAndBelowSafetyStock.sort((a, b) => parseFloat(a.projectedStock.split('(')[1]) - parseFloat(b.projectedStock.split('(')[1]));
flvtSizeGreaterAndBelowSafetyStock.sort((a, b) => parseFloat(a.projectedStock.split('(')[1]) - parseFloat(b.projectedStock.split('(')[1]));
flvtSizeGreaterOnly.sort((a, b) => parseFloat(a.projectedStock.split('(')[1]) - parseFloat(b.projectedStock.split('(')[1]));

// Concatenate the arrays in the specified order
flvtParts.push(
  ...flvtSizeZeroAndBelowSafetyStock,
  ...flvtSizeGreaterAndBelowSafetyStock,
  ...flvtSizeGreaterOnly
);

    console.log(globalDieSetsMap);
    console.log("DieSet Array :",globalDieSets);
    console.log("Actual ID's", globalActualIds);

    // Build the response object
     response = {
      header: {
        currentDate,
        currentTime,
        shift: shiftName,
        line: skuCategoryCode,
        lineID: line,
        shiftGroup: shiftGroupName,
        shiftCellColor: shiftCellColor,
      },
      materialStock: allMaterialsStock,
      emptyPallets: allEmptyPallets,
      partsStock: allParts,
      loadTimeCalculations: allLoadTimeCalculations,
      plannedLine: allPlannedLineStop,
      lotAdjustments: allLotAdjustments,
      grid: grid,
      otherParts: otherParts,
      flvtParts: flvtParts,
    };

    //const endTime = Date.now(); // Track the end time

    // Send the response back to the client
    res.status(200).json(response);
    console.log(
      `CurrentShift Execution time: ${(Date.now() - startTime) / 1000} seconds`
    );
  }else{
    response = {
      header: {
        currentDate,
        currentTime,
        shift: shiftName,
        line: skuCategoryCode,
        lineID: line,
        shiftGroup: shiftGroupName,
        shiftCellColor: shiftCellColor,
      },
      materialStock: [],
      emptyPallets: [],
      partsStock: [],
      loadTimeCalculations: [],
      plannedLine: [],
      lotAdjustments: [],
      grid: [],
      otherParts: [],
      flvtParts: [],
    };

    res.send(response);
  }
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
}

exports.nextShiftQueueAddFLVTAndPartsBelowSafetyStock = async(req, res) => {
  try {
    const pool = await sql.connect(config);
    const { dieSet, date, shift, line, flvtLotSize, user } = req.body;
    console.log("Add FLVT user", user);

    const { ShiftId, SKUCategoryID } = await reUsableFun.getShiftAndSKUCategoryDetails(
      shift,
      line,
      config
    );
    const { DieSetID, DieStorageBay } = await reUsableFun.getBOMIDDetails(dieSet,config);

    if (!DieSetID) {
      return res.status(400).send("Invalid BOM Type.");
    }

    //const shiftEndTime = await getShiftEndTime(shift);
    const { shiftStartTime, shiftEndTime } = await reUsableFun.getShiftTimes(shift, config);
    console.log("ShiftEndTime fetched:", shiftEndTime);

    if (!shiftEndTime) {
      return res.status(400).send("Invalid Shift specified.");
    }

    const lastRecordQuery = `SELECT * FROM [SSPCSdbo].[PatternActualData] WHERE [ShiftID] = @ShiftId and [LineID] =@LineID AND [Date] =@date
      ORDER BY [PartSeq] DESC;`;

    const lastRecordResult = await pool
      .request()
      .input("ShiftId", sql.Int, ShiftId)
      .input("LineID",sql.Int,SKUCategoryID)
      .input("date",sql.Date,date)
      .query(lastRecordQuery);
    
    let lastPlanEndTime, status,partSeq;
    
    if (lastRecordResult.recordset.length > 0) {
      lastPlanEndTime = lastRecordResult.recordset[0].PlanEndTime;
      status = lastRecordResult.recordset[0].Status;
    
      partSeq = lastRecordResult.recordset[0].PartSeq;
      console.log("LastPlanENdTime:",lastPlanEndTime);
      while (lastPlanEndTime === null ) {
        console.log("Current record skipped or PlanEndTime null. Checking previous record...");
    
        const secondLastRecordQuery = `
          SELECT TOP 1 [PlanEndTime], [Status], [PartSeq]
          FROM [SSPCSdbo].[PatternActualData]
          WHERE [ShiftID] = @ShiftId AND [Date] = @date AND [LineID] = @LineID
          AND [PartSeq] < @PartSeq
          ORDER BY [PartSeq] DESC;
        `;
    
        const secondLastRecordResult = await pool
          .request()
          .input("ShiftId", sql.Int, ShiftId)
          .input("LineID", sql.Int, SKUCategoryID)
          .input("date", sql.Date, date)
          .input("PartSeq", sql.Int, partSeq)
          .query(secondLastRecordQuery);
    
        if (secondLastRecordResult.recordset.length > 0) {
          lastPlanEndTime = secondLastRecordResult.recordset[0].PlanEndTime;
          status = secondLastRecordResult.recordset[0].Status;
          partSeq = secondLastRecordResult.recordset[0].PartSeq;
    
          console.log("Checking previous record:", lastPlanEndTime);
        } else {
          // No more records to check
          //return res.send("No previous valid PlanEndTime found.");
          const result = await addFLVT(DieSetID, dieSet, flvtLotSize, ShiftId, SKUCategoryID, date, DieStorageBay, user, line, config);
          return res.send(result);
        }
      }
    } else {
      console.log("No previous records found.");
    }
    
    // Adjust shiftEndTime if it crosses midnight
    let adjustedShiftEndTime = new Date(`${date}T${shiftEndTime}Z`);
    const shiftStartTimeObj = new Date(`${date}T${shiftStartTime}Z`);
    
    if (adjustedShiftEndTime < shiftStartTimeObj) {
      // Increment shiftEndTime to the next day
      adjustedShiftEndTime.setDate(adjustedShiftEndTime.getDate() + 1);
    }
    
    // Fetch overtime details for the current shift
    const overtimeQuery = `SELECT FromTime, ToTime FROM Overtime WHERE ShiftID = @ShiftId 
      AND Line = @line AND CONVERT(DATE, Date) = @date;`;

    const overtimeResult = await pool
      .request()
      .input("ShiftId", sql.Int, ShiftId)
      .input("line", sql.VarChar, line)
      .input("date",sql.Date, date)
      .query(overtimeQuery);
    
    if (overtimeResult.recordset.length > 0) {
      overtimeResult.recordset.forEach(overtime => {
        const fromTime = new Date(`${date}T${overtime.FromTime}Z`);
        const toTime = new Date(`${date}T${overtime.ToTime}Z`);
    
        // Adjust the `ToTime` if it crosses midnight
        if (toTime < fromTime) {
          toTime.setDate(toTime.getDate() + 1);
        }
    
        // Add the overtime duration to the shiftEndTime
        adjustedShiftEndTime = new Date(adjustedShiftEndTime.getTime() + (toTime - fromTime));
      });
    }
    
    console.log("Adjusted ShiftEndTime with overtime:", adjustedShiftEndTime);
    
    try {
      if (lastPlanEndTime) {
        // Ensure lastPlanEndTime is a valid date string
        console.log("Inside",lastPlanEndTime);
        let lastPlanEndTimeObj = new Date(`${date}T${lastPlanEndTime}Z`);
        
        // Check if the created date is valid
        if (isNaN(lastPlanEndTimeObj.getTime())) {
          throw new Error("Invalid lastPlanEndTime format");
        }
    
        // Adjust lastPlanEndTime to handle overlap into the next day
        const shiftStartTimeObj = new Date(`${date}T${shiftStartTime}Z`);
        if (lastPlanEndTimeObj < shiftStartTimeObj) {
          lastPlanEndTimeObj.setDate(lastPlanEndTimeObj.getDate() + 1);
        }
    
        console.log(
          "Comparing lastPlanEndTimeObj and adjustedShiftEndTime:",
          lastPlanEndTimeObj,
          adjustedShiftEndTime
        );
    
        if (lastPlanEndTimeObj > adjustedShiftEndTime) {
          return res.send(
            "Cannot add part: The last planned end time exceeds the adjusted shift end time."
          );
        }
      } else {
        console.log("lastPlanEndTime is null or undefined, skipping comparison.");
      }
    } catch (validationError) {
      console.error("Validation error:", validationError.message);
      return res.status(400).send(`Validation error: ${validationError.message}`);
    }

    const result = await addFLVT(DieSetID, dieSet, flvtLotSize, ShiftId, SKUCategoryID, date, DieStorageBay, user, line, config);
    return res.send(result);
  } catch (error) {
    console.error("Failed to add FLVT and parts below safety stock:", error);
    logger.customerLogger.error("Failed to add FLVT and parts below safety stock:", error);
    res.send("Server error");
  }
}

exports.nextShiftQueueAddOtherParts = async(req, res) => {
  const pool = await sql.connect(config);
  try {
    const { dieSet, date, shift, line, lotSize, remarks, user} = req.body;
    console.log("Add Other Parts user", user);

    const { EfficiencyPT: loadTime, TotalProductionTime: totalProdTime } = await reUsableFun.calculateLoadTimeForDieSet(dieSet, line, lotSize, config);

    const { ShiftId, SKUCategoryID } = await reUsableFun.getShiftAndSKUCategoryDetails(
      shift,
      line,
      config
    );

    // Retrieve BOM type details
    const { DieSetID, DieStorageBay } = await reUsableFun.getBOMIDDetails(dieSet,config);

    if (!DieSetID) {
      return res.status(400).send("Invalid BOM Type.");
    }

    //const shiftEndTime = await getShiftEndTime(shift);
    const { shiftStartTime, shiftEndTime } = await reUsableFun.getShiftTimes(shift,config);
    console.log("ShiftEndTime fetched:", shiftEndTime);

    if (!shiftEndTime) {
      return res.status(400).send("Invalid Shift specified.");
    }

    const lastRecordQuery = `SELECT * FROM [SSPCSdbo].[PatternActualData] WHERE [ShiftID] = @ShiftId and [LineID] =@LineID AND [Date] = @date
      ORDER BY [PartSeq] DESC;`;
    
    const lastRecordResult = await pool
      .request()
      .input("ShiftId", sql.Int, ShiftId)
      .input("LineID", sql.Int, SKUCategoryID)
      .input("date",sql.Date,date)
      .query(lastRecordQuery);

    let lastPlanEndTime, status, partSeq;

    if (lastRecordResult.recordset.length > 0) {
      lastPlanEndTime = lastRecordResult.recordset[0].PlanEndTime;
      status = lastRecordResult.recordset[0].Status;
      partSeq = lastRecordResult.recordset[0].PartSeq;
      console.log("LastPlanENdTime:",lastPlanEndTime);
      while (lastPlanEndTime === null ) {
        console.log("Current record skipped or PlanEndTime null. Checking previous record...");

        const secondLastRecordQuery = `SELECT TOP 1 [PlanEndTime], [Status], [PartSeq] FROM [SSPCSdbo].[PatternActualData]
          WHERE [ShiftID] = @ShiftId AND [Date] = @date AND [LineID] = @LineID AND [PartSeq] < @PartSeq ORDER BY [PartSeq] DESC;`;

        const secondLastRecordResult = await pool
          .request()
          .input("ShiftId", sql.Int, ShiftId)
          .input("LineID", sql.Int, SKUCategoryID)
          .input("date", sql.Date, date)
          .input("PartSeq", sql.Int, partSeq)
          .query(secondLastRecordQuery);

        if (secondLastRecordResult.recordset.length > 0) {
          lastPlanEndTime = secondLastRecordResult.recordset[0].PlanEndTime;
          status = secondLastRecordResult.recordset[0].Status;
          partSeq = secondLastRecordResult.recordset[0].PartSeq;

          console.log("Checking previous record:", lastPlanEndTime);
        } else {
          // No more records to check
          //return res.send("No previous valid PlanEndTime found.");
          const result = await addParts(DieSetID,ShiftId,date,SKUCategoryID,dieSet,loadTime, totalProdTime,lotSize, remarks, DieStorageBay,user,config);
          return res.send(result);
        }
      }
    } else {
        console.log("No previous records found.");
    }

// Adjust shiftEndTime if it crosses midnight
let adjustedShiftEndTime = new Date(`${date}T${shiftEndTime}Z`);
const shiftStartTimeObj = new Date(`${date}T${shiftStartTime}Z`);

if (adjustedShiftEndTime < shiftStartTimeObj) {
  // Increment shiftEndTime to the next day
  adjustedShiftEndTime.setDate(adjustedShiftEndTime.getDate() + 1);
}

// Fetch overtime details for the current shift
const overtimeQuery = `
    SELECT FromTime, ToTime
FROM Overtime
WHERE ShiftID = @ShiftId 
  AND Line = @line 
  AND CONVERT(DATE, Date) = @date;

`;
const overtimeResult = await pool
  .request()
  .input("ShiftId", sql.Int, ShiftId)
  .input("line", sql.VarChar, line)
  .input("date",sql.Date, date)
  .query(overtimeQuery);

if (overtimeResult.recordset.length > 0) {
  overtimeResult.recordset.forEach(overtime => {
    const fromTime = new Date(`${date}T${overtime.FromTime}Z`);
    const toTime = new Date(`${date}T${overtime.ToTime}Z`);

    // Adjust the `ToTime` if it crosses midnight
    if (toTime < fromTime) {
      toTime.setDate(toTime.getDate() + 1);
    }

    // Add the overtime duration to the shiftEndTime
    adjustedShiftEndTime = new Date(adjustedShiftEndTime.getTime() + (toTime - fromTime));
  });
}

console.log("Adjusted ShiftEndTime with overtime:", adjustedShiftEndTime);

try {
  if (lastPlanEndTime) {
    // Ensure lastPlanEndTime is a valid date string
    
    let lastPlanEndTimeObj = new Date(`${date}T${lastPlanEndTime}Z`);
    
    // Check if the created date is valid
    if (isNaN(lastPlanEndTimeObj.getTime())) {
      throw new Error("Invalid lastPlanEndTime format");
    }

    // Adjust lastPlanEndTime to handle overlap into the next day
    const shiftStartTimeObj = new Date(`${date}T${shiftStartTime}Z`);
    if (lastPlanEndTimeObj < shiftStartTimeObj) {
      lastPlanEndTimeObj.setDate(lastPlanEndTimeObj.getDate() + 1);
    }

    console.log(
      "Comparing lastPlanEndTimeObj and adjustedShiftEndTime:",
      lastPlanEndTimeObj,
      adjustedShiftEndTime
    );

    if (lastPlanEndTimeObj > adjustedShiftEndTime) {
      return res.send(
        "Cannot add part: The last planned end time exceeds the adjusted shift end time."
      );
    }
  } else {
    console.log("lastPlanEndTime is null or undefined, skipping comparison.");
  }
} catch (validationError) {
  console.error("Validation error:", validationError.message);
  return res.status(400).send(`Validation error: ${validationError.message}`);
}

  const result = await addParts(DieSetID,ShiftId,date,SKUCategoryID,dieSet,loadTime, totalProdTime, lotSize, remarks, DieStorageBay,user,config);
  return res.send(result);
   
  } catch (error) {
    console.error("Failed to add other parts:", error);
    logger.customerLogger.error("Failed to add other parts:", error);
    res.send("Server error");
  }
}

exports.nextShiftQueueUpdatePatternStatus = async(req, res) => {
  const pool = await sql.connect(config);
  //const transaction = new sql.Transaction(pool);
  try {
    //await transaction.begin();
    const { action, dieSet, line, shift, date, reason, user, actualID} = req.body;
    console.log("Updated Pattern Status USer", user);
    console.log("Actual ID:", actualID);

    // Get the status value from ActionTypes
    const statusValue = reUsableFun.ActionTypes[action];

    // If the action does not match any key in ActionTypes, return an error
    if (!statusValue) {
      return res.status(400).send("Invalid action specified.");
    }

    // Define whether to include the reason field
    const includeReason =
      statusValue === reUsableFun.ActionTypes["Skipped"] ||
      statusValue === reUsableFun.ActionTypes["Discontinued"];


    // Logic for status 'Queued'
    if (statusValue === reUsableFun.ActionTypes["Queued"]) {
      try {
        const now = new Date();

        // Extract hours, minutes, and seconds
        const hours = String(now.getHours()).padStart(2, '0'); // Add leading zero if necessary
        const minutes = String(now.getMinutes()).padStart(2, '0'); // Add leading zero if necessary
        const seconds = String(now.getSeconds()).padStart(2, '0'); // Add leading zero if necessary
    
        // Format time as 'HH:MM:SS'
        const time = `${hours}:${minutes}:${seconds}`;
    
            const updateQueuedQuery = `
                    UPDATE [SSPCSdbo].[PatternActualData]
                    SET [Status] = @Status,
                        [Reason] = @Reason,
                        [ModifiedBy] = @ModifiedBy,
                        [QueuedTime] = @time,
            [ModifiedDate] = @ModifiedDate
                    WHERE [PatternActualDataID]=@actualID;
                `;
    
            await pool
              .request()
              .input("Status", sql.Int, statusValue) // Store the numeric value for 'Queued'
              .input("Reason", sql.NVarChar, includeReason ? reason || null : null) // Add reason only if includeReason is true
              .input("ModifiedBy", sql.Int, user)
              .input("time", sql.NVarChar, time)
              .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
              .input("actualID",sql.Int,actualID)
              .query(updateQueuedQuery);
    

        // Call the helper function to fetch the required details for 'Queued' status

        return res.send("Ordered to Line!");
      } catch (error) {
        return res.status(500).send("Failed!");
      }
    }

    // Logic for non-Queued statuses: Update only
    const updateQuery = `
            UPDATE [SSPCSdbo].[PatternActualData]
            SET [Status] = @Status,
                [Reason] = @Reason,
                [ModifiedBy] = @ModifiedBy,
        [ModifiedDate] = @ModifiedDate
            WHERE [PatternActualDataID] = @actualID;
        `;

    // Set up the request with the required parameters for non-Queued actions
    await pool
      .request()
      .input("Status", sql.Int, statusValue) // Store the numeric value for the status
      .input("Reason", sql.NVarChar, includeReason ? reason || null : null) // Add reason only if includeReason is true
      .input("ModifiedBy", sql.Int, user)
      .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
      .input("actualID",sql.Int,actualID)
      .query(updateQuery);

    if (statusValue === reUsableFun.ActionTypes["Skipped"] || reUsableFun.ActionTypes["Discontinued"]) {
      const { ShiftId, SKUCategoryID } = await reUsableFun.getShiftAndSKUCategoryDetails(
        shift,
        line,
        config
      );
      await reUsableFun.reCalculatePatternStartAndEndTime(date, SKUCategoryID, ShiftId,config);
    }

    // Respond with success for non-Queued actions
    res.send("Status Updated successfully!");
  } catch (error) {
    logger.customerLogger.error("Failed to update pattern status in nextShiftQueue tab:", error);
    console.error("Failed to update pattern status:", error);
    res.status(500).send("Server error");
  }
}

exports.nextShiftQueueFetchDetailsForQueuedStatus = async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const { action, dieSet, line, shift, date, actualID, user } = req.body;
    const { ShiftId, SKUCategoryID } =
      await reUsableFun.getShiftAndSKUCategoryDetails(shift, line, config);
    const statusValue = reUsableFun.ActionTypes[action];
    const inputRecords = [];
    const qpc = await reUsableFun.getQPC(dieSet, config);

    const currentRecordResult = await pool
      .request()
      .input("actualID", sql.Int, actualID).query(`
    SELECT * FROM [SSPCSdbo].[PatternActualData]
    WHERE PatternActualDataID = @actualID;
  `);

    if (currentRecordResult.recordset.length === 0) {
      return res.send("No records!");
    }

    const currentRecord = currentRecordResult.recordset[0];

    if (!currentRecord) {
      return res.send("Current record not found.");
    }

    const currentPartSeq = currentRecord.PartSeq;
    const CreatedBy = currentRecord.CreatedBy;
    const CreatedDate = currentRecord.CreatedDate;
    const ModifiedBy  = currentRecord.ModifiedBy;
    const ModifiedDate =  currentRecord.ModifiedDate;

    const WarehouseID = 1;
    const PrimaryCompanyID = 1;
    const WarehousePrimaryCompanyID = 1;
    const CostBucketID = 1;
    const IsFOC = true;
    const TotalOfLineAmountsInCustomerCurrency = 1;
    const IsShippedSeparately = false;
    const InvoiceLineNo = 1;
    const TotalOfLineAmountsInLocalCurrency = 0.0;
    const UnitPriceOfBillingUOMInLocalCurrency = 1;
    const UnitSalesPriceOfStorageUOMInCustomerCurrency = 0;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0"); 
    const minutes = String(now.getMinutes()).padStart(2, "0"); 
    const seconds = String(now.getSeconds()).padStart(2, "0"); 

    // Format time as 'HH:MM:SS'
    const time = `${hours}:${minutes}:${seconds}`;
 

    if (statusValue === reUsableFun.ActionTypes[action]) {
      if (currentPartSeq > 1) {
        const previousRecordsResult = await pool
          .request()
          .input("CurrentPartSeq", sql.Int, currentPartSeq)
          .input("Line", sql.Int, SKUCategoryID)
          .input("Shift", sql.Int, ShiftId)
          .input("Date", sql.Date, date).query(`
    SELECT COUNT(*) AS StatusOneCount
    FROM [SSPCSdbo].[PatternActualData]
    WHERE [PartSeq] < @CurrentPartSeq
      AND [LineID] = @Line
      AND [ShiftID] = @Shift
      AND [Date] = @Date
      AND [Status] = 1;
  `);

        const { StatusOneCount } = previousRecordsResult.recordset[0] || {};

        if (StatusOneCount > 0) {
          return res.send(
            "Cannot order to line because the previous plan is not ordered. Please re-sequence and then proceed to order to line."
          );
        }
      }
    }

    // Query KitItemIDs from KitBOM for the given dieSet
    const kitItemIDsResult = await pool
      .request()
      .input("dieSet", sql.VarChar, dieSet).query(`
    SELECT KitItemID
    FROM [dbo].[KitBOM]
    WHERE BOMType = @dieSet;
  `);

    const kitItemIDs = kitItemIDsResult.recordset;

    // Pre-fetch the TransactionTypeID for OrderToLine
    const orderToLineTransactionTypeResult = await pool.request().query(`
    SELECT TransactionTypeID
    FROM [dbo].[TransactionType]
    WHERE TransactionTypeCode = 'OrderToLine';
  `);

    const TransactionTypeOrderToLineID =
      orderToLineTransactionTypeResult.recordset[0]?.TransactionTypeID;

    // Loop through each KitItemID and process the data
    for (const kitItem of kitItemIDs) {
      const KitItemID = kitItem.KitItemID;

      // Fetch ProductionOrder and KanbanReturned
      const planLotsizeResult = await pool
        .request()
        .input("actualID", sql.Int, actualID)
        .input("KitItemID", sql.Int, KitItemID).query(`
    SELECT [RecomendedOrder], [ProductionOrder], [KanbanReturned]
    FROM [SSPCSdbo].[PlanLotsizeCalculation]
    WHERE PatternActualDataID = @actualID
      AND kitItemId = @KitItemID;
  `);

      const { RecomendedOrder, ProductionOrder, KanbanReturned } = planLotsizeResult.recordset[0];
      if(ProductionOrder > 0){

      if(KanbanReturned === 0){
        const inputRecord = {
          WarehouseID,
          PrimaryCompanyID,
          WarehousePrimaryCompanyID,
          CostBucketID,

          AvailableQuantityInStorageUOM: null,
        
          SKUBatchID: null,
          SKUCostID: null,
        
          FromLocationID: null,
          ToLocationID: null,

          StockTransferQuantityInStorageUOM: ProductionOrder,
          TransactionTypeID:TransactionTypeOrderToLineID,
        
          SKUCode: null,
          CustomFields: {
            TransactionTypeCode:"OrderToLine",
            KanbanReturned:KanbanReturned*qpc,
            ActualID: actualID,
            KitItemID,
            Status: statusValue,
            //ModifiedDate,
            ModifiedBy,
            //CreatedDate,
            //CreatedBy,
            Reason: null,
            QueuedTime: time,
            ActualEndTime: null,
            ActualLoadTime: null,
          },
        };
        inputRecords.push(inputRecord);
      }
      else{

      const customSearchResult = await pool
        .request()
        .input("KitItemID", sql.Int, KitItemID)
        .query(`
      SELECT SKUID, SKUCode, SKUCostID, SKUBatchID, LocationID, 
             BucketQuantityInStorageUOM, ShippingModeID, TradeTermID, CustomerID
      FROM SSPCSCustomSearchViews.v_SearchPalletStockCustomSearchView
      WHERE SKUID = @KitItemID AND StockBucketCode = 'KBsReturned' AND BucketQuantityInStorageUOM > 0;
    `);

      const stockRecords = customSearchResult.recordset;

      const availableQuantity = stockRecords.reduce(
        (sum, record) => sum + record.BucketQuantityInStorageUOM,
        0
      );

        const inputRecord = {
          WarehouseID,
          PrimaryCompanyID,
          WarehousePrimaryCompanyID,
          CostBucketID,

          AvailableQuantityInStorageUOM: availableQuantity,
        
          SKUBatchID: stockRecords[0].SKUBatchID,
          SKUCostID: stockRecords[0].SKUCostID,
        
          FromLocationID: stockRecords[0].LocationID,
          ToLocationID: stockRecords[0].LocationID,

          StockTransferQuantityInStorageUOM: ProductionOrder,
          TransactionTypeID:TransactionTypeOrderToLineID,
        
          SKUCode: stockRecords[0].SKUCode,
          CustomFields: {
            TransactionTypeCode:"OrderToLine",
            KanbanReturned:KanbanReturned * qpc,
            ActualID: actualID,
            KitItemID,
            Status: statusValue,
            //ModifiedDate,
            ModifiedBy,
            //CreatedDate,
            //CreatedBy,
            Reason: null,
            QueuedTime: time,
            ActualEndTime: null,
            ActualLoadTime: null,
          },
        };
       inputRecords.push(inputRecord);
      }
    }
    }
    logger.customerLogger.info(
      "From FetchDetailsForQueuedStatus inputRecords:",
      inputRecords
    );
    console.log("Input Records:", inputRecords);
    return res.send(inputRecords);
  } catch (error) {
    logger.customerLogger.error(
      "Error in FetchDetailsForQueuedStatus method:",
      error
    );
    console.error("Error in FetchDetailsForQueuedStatus:", error);
    res.status(500).send("Server error");
  }
};

exports.nextShiftQueueUpdatePartSeq = async (req, res) => {
  const pool = await sql.connect(config);
  const startTime = Date.now();
  const { date, shift, line, updatedSeqData, user } = req.body;
  console.log("updatePartSeq user", user);

  const { ShiftId, SKUCategoryID } =
    await reUsableFun.getShiftAndSKUCategoryDetails(shift, line, config);

  if (!updatedSeqData || !Array.isArray(updatedSeqData) || updatedSeqData.length === 0) {
    return res.status(400).send("Invalid data format.");
  }

  try {
    // Create a single bulk update query using CASE WHEN
    let updateQuery = `
      UPDATE [SSPCSdbo].[PatternActualData]
      SET PartSeq = CASE PatternActualDataID `;

    updatedSeqData.forEach(({ actualID, seq }) => {
      if (!actualID || !seq) {
        throw new Error("Invalid actualID or seq value.");
      }
      updateQuery += ` WHEN ${actualID} THEN ${seq} `;
    });

    updateQuery += ` END, 
      ModifiedBy = @ModifiedBy,
      ModifiedDate = @ModifiedDate
      WHERE PatternActualDataID IN (${updatedSeqData.map(({ actualID }) => actualID).join(",")})`;

    // Execute the update query
    await pool.request()
      .input("ModifiedBy", sql.Int, user)
      .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
      .query(updateQuery);

    // Recalculate pattern start and end times
    await reUsableFun.reCalculatePatternStartAndEndTime(
      date,
      SKUCategoryID,
      ShiftId,
      config
    );

    console.log(
      `update part seq Execution time: ${(Date.now() - startTime) / 1000} seconds`
    );

    res.send("PartSeq updated successfully!");
  } catch (error) {
    logger.customerLogger.error("Error updating PartSeq: in nextShiftQueue tab.", error);
    console.error("Error updating PartSeq:", error);
    res.status(500).send("Failed to update PartSeq.");
  }
}

exports.nextShiftQueueApplyChanges = async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const {
      dieSet,
      shift,
      line,
      date,
      planLotSize,
      user,
      actualID,
      prodOrderByKitItemID,
    } = req.body;
  
    let loadTime, totalProdTime;
    console.log("Set",prodOrderByKitItemID)

    const { EfficiencyPT, TotalProductionTime } =
      await reUsableFun.calculateLoadTimeForDieSet(
        dieSet,
        line,
        planLotSize,
        config
      );

    loadTime = EfficiencyPT;
    totalProdTime = TotalProductionTime;

    const { ShiftId, SKUCategoryID } =
      await reUsableFun.getShiftAndSKUCategoryDetails(shift, line, config);

    if (!ShiftId || !SKUCategoryID) {
      return res.send("Invalid shift or line specified.");
    }

    
const planLotSizeCalculationResult = await pool
  .request()
  .input("PatternActualID", sql.Int, actualID)
  .query(`
  SELECT [PlanLotsizeCalculationID], [KitItemId]
  FROM [SSPCSdbo].[PlanLotsizeCalculation]
  WHERE PatternActualDataID = @PatternActualID;
`);


const planLotsizeCalculationSet = planLotSizeCalculationResult.recordset.map(row => ({
  PlanLotsizeCalculationID: row.PlanLotsizeCalculationID,
  KitItemID: row.KitItemId
}));

console.log("planLotSizeCalculation set:",planLotsizeCalculationSet);

    for (let i = 0; i < planLotsizeCalculationSet.length; i++) {

      const {PlanLotsizeCalculationID, KitItemID } = planLotsizeCalculationSet[i];

      const match = prodOrderByKitItemID.find(item => item.kitItemID === KitItemID);
    
      const updatePlanLotSizeCalculationQuery = `
          UPDATE [SSPCSdbo].[PlanLotsizeCalculation]
          SET ProductionOrder = @ProductionOrder,
              [ModifiedBy] = @ModifiedBy,
              [ModifiedDate] = @ModifiedDate
          WHERE PlanLotsizeCalculationID = @PlanLotsizeCalculationID;
      `;

      const updateResult = await pool
        .request()
        .input("ProductionOrder", sql.Int, match.numericProdOrder)
        .input("PlanLotsizeCalculationID", sql.Int, PlanLotsizeCalculationID)
        .input("ModifiedBy", sql.Int, user)
        .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
        .query(updatePlanLotSizeCalculationQuery);
      
    }

    // Construct the update query
    const updateQuery = `
            UPDATE [SSPCSdbo].[PatternActualData]
            SET [PlanLotSize] = @PlanLotSize,
            [ModifiedBy] = @ModifiedBy,
        [ModifiedDate] = @ModifiedDate, [LoadTime] = @loadTime, [TotalProdTime] = @totalProdTime, [IsApplyChanges] = @IsApplyChanges
            WHERE [PatternActualDataID] = @actualID;
        `;

    // Set up the request with the required parameters

    const request = pool
      .request()
      .input("PlanLotSize", sql.Int, planLotSize)
      .input("actualID", sql.Int, actualID)
      .input("loadTime", sql.Int, loadTime)
      .input("totalProdTime", sql.Int, totalProdTime)
      .input("ModifiedBy", sql.Int, user)
      .input("ModifiedDate", sql.DateTime, reUsableFun.getISTDate())
      .input("IsApplyChanges", sql.Bit, 1);

    // Execute the query
    const result = await request.query(updateQuery);
    reUsableFun.reCalculatePatternStartAndEndTime(
      date,
      SKUCategoryID,
      ShiftId,
      config
    );

    res.send("PlanLotSize updated successfully.");
  } catch (error) {
    logger.customerLogger.error("Error in applyChanges method", error);
    console.error("Error in applyChanges:", error);
    res.status(500).send("Server error");
  }
};

exports.nextShiftQueueSKUTransaction = async(req,res) => {

  try{
    const pool = await sql.connect(config);
    const {KitItemID,ProductionOrder} = req.body;
    const WarehouseID = 1;
    const PrimaryCompanyID = 1;
    const WarehousePrimaryCompanyID = 1;
    const CostBucketID = 1;

    // Query for stock records
    const customSearchQuery = `SELECT SKUID, SKUCode, SKUCostID, SKUBatchID, LocationID, 
        BucketQuantityInStorageUOM, ShippingModeID, TradeTermID, CustomerID
        FROM SSPCSCustomSearchViews.v_SearchPalletStockCustomSearchView
        WHERE SKUID = @KitItemID AND StockBucketCode = 'KBsReturned';
        `;

    const customSearchResult = await pool
      .request()
      .input("KitItemID", sql.Int, KitItemID)
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

    let transactionTypeCode = "OrderToLine";

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
      SKUBatchID: stockRecords[0].SKUBatchID,
      InvoicedSKUCostID: stockRecords[0].SKUCostID,
      FromLocationID:stockRecords[0].LocationID,
      StockTransferQuantityInStorageUOM: ProductionOrder,
      TransactionTypeOrderToLineID:TransactionTypeID,
      AvailableQuantityInStorageUOM: ProductionOrder,
      transactionTypeCode: 'kbs'
      };
      console.log("SKU Transaction response", response);
      logger.customerLogger.info("From SKU transaction:",response);
    return res.send(response);
  }
  catch(error){
    logger.customerLogger.error("Error in nextShiftQueue tab SKUTransaction:",error);
    console.error(error);
    res.status(500).send("Server error");
  }
}
