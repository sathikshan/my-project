const sql = require('mssql/msnodesqlv8');
const csv = require('csv-parser');
const reUsableFun = require('../../utils/reUsableFun');
const config = require("../../config/dbConfig");
const { log } = require('winston');

exports.getInspectionReportData = async (req, res) => {
    try {
        const pool = await sql.connect(config);
        console.log('start time', new Date());
        let modelBomQuery = `
          WITH pqCTE AS (
                    SELECT Variant, MAX(PullRatePerSec) AS PullRatePerSec, NoOfSecOfSafetyStock FROM SSPCSdbo.PQDataUpload GROUP BY Variant, NoOfSecOfSafetyStock
                ),
                skuCTE AS (
                    select distinct SKUStock.SKUCostID as SKUCostIDFromSKUStock,SKU.SKUCode, SKUCost.SKUCostID, SKU.Model from SKUStock
                    JOIN SKUCost ON SKUStock.SKUCostID = SKUCost.SKUCostID
                    JOIN SKUInventory ON SKUCost.SKUInventoryID = SKUInventory.SKUInventoryID
                    JOIN SKU ON SKUInventory.SKUID = SKU.SKUID
                    where StockBucketID IN (SELECT StockBucketID from StockBucket where StockBucketCode IN ('RepairWIP','PartsBadLot','PartsNG','OnHoldOKParts'))
                ),
				stockCTE AS(
				select SKUStock.BucketQuantityInStorageUOM, SKU.SKUCode from SKUStock
				JOIN SKUCost ON SKUStock.SKUCostID = SKUCost.SKUCostID
				JOIN SKUInventory ON SKUCost.SKUInventoryID = SKUInventory.SKUInventoryID
				JOIN SKU ON SKUInventory.SKUID = SKU.SKUID
			    where  StockBucketID in (select StockBucketID from StockBucket where StockBucketCode IN ('PartsOK', 'PartsStorage'))
				)
                SELECT DISTINCT 
                    skuCTE.Model,
                    skuCTE.SKUCode, 
                    skuCTE.SKUCostID, 
                    pqCTE.PullRatePerSec,
                    pqCTE.NoOfSecOfSafetyStock,
					SUM(stockCTE.BucketQuantityInStorageUOM) AS Stock
                FROM skuCTE
                JOIN pqCTE ON skuCTE.SKUCode COLLATE SQL_Latin1_General_CP1_CI_AS = pqCTE.Variant COLLATE SQL_Latin1_General_CP1_CI_AS
				JOIN stockCTE ON skuCTE.SKUCode = stockCTE.SKUCode
				GROUP BY skuCTE.Model,
                    skuCTE.SKUCode, 
                    skuCTE.SKUCostID, 
                    pqCTE.PullRatePerSec,
                    pqCTE.NoOfSecOfSafetyStock
`
        const modelBomResult = await pool.request().query(modelBomQuery);

        // Extract unique models and BOMTypes
        const models = [...new Set(modelBomResult.recordset.map(row => row.Model))];
        const bomTypes = [...new Set(modelBomResult.recordset.map(row => row.SKUCode))];
        let bomtype = bomTypes.join(',');
        let model = models.join(',')
        const dncPalletResult = await pool.request()
            .input('modelList', sql.NVarChar, model)
            .input('bomTypeList', sql.NVarChar, bomtype)
            .query(
                `SELECT
                    ISNULL(SUM(CASE 
                                WHEN StockBucket.StockBucketCode IN ('PartsOK', 'PartsStorage') 
                                THEN SKUStock.BucketQuantityInStorageUOM 
                                ELSE 0 
                            END), 0) AS GPQ,
                    
                    ISNULL(SUM(CASE 
                                WHEN StockBucket.StockBucketCode IN ('RepairWIP', 'PartsBadLot','PartsNG', 'OnHoldOKParts') 
                                THEN SKUStock.BucketQuantityInStorageUOM 
                                ELSE 0 
                            END), 0) AS Repair,
                    
                    ISNULL(SUM(CASE 
                                WHEN StockBucket.StockBucketCode IN ('PartsOK', 'PartsStorage') 
                                THEN SKUStock.BucketQuantityInStorageUOM 
                                ELSE 0 
                            END), 0) +
                    ISNULL(SUM(CASE 
                                WHEN StockBucket.StockBucketCode IN ('RepairWIP', 'PartsBadLot','PartsNG', 'OnHoldOKParts')
                                THEN SKUStock.BucketQuantityInStorageUOM 
                                ELSE 0 
                            END), 0) AS Total,
                    
                    SKUStock.LocationID,
                    SKU.SKUCode,
                    SKU.Model,
                    Location.LocationCode AS DNCPalletLocation,
                    SKUStock.CreatedDate
                FROM 
                    SKUStock
                JOIN 
                    StockBucket ON SKUStock.StockBucketID = StockBucket.StockBucketID
                JOIN SKUCost ON SKUStock.SKUCostID = SKUCost.SKUCostID
                JOIN SKUInventory ON SKUCost.SKUInventoryID = SKUInventory.SKUInventoryID
                JOIN SKU ON SKUInventory.SKUID = SKU.SKUID
                JOIN Location ON SKUStock.LocationID = Location.LocationID
                WHERE 
                    StockBucket.StockBucketCode IN ('PartsOK', 'PartsStorage','RepairWIP', 'PartsBadLot','PartsNG', 'OnHoldOKParts') 
                    AND SKU.SKUCode COLLATE SQL_Latin1_General_CP1_CI_AS IN (
                        SELECT DISTINCT Variant COLLATE SQL_Latin1_General_CP1_CI_AS FROM SSPCSdbo.PQDataUpload
                    )
                GROUP BY 
                    SKUStock.LocationID,
                    SKUStock.StockBucketID,
                    SKUStock.SKUCostID,
                    SKU.Model,
                    SKU.SKUCode,
                    Location.LocationCode,
                    SKUStock.CreatedDate
                ORDER BY SKUStock.CreatedDate DESC;
`
            );
        const productionResult = await pool.request()
            .input('modelList', sql.NVarChar, model)
            .input('bomTypeList', sql.NVarChar, bomtype)
            .query(
                `
                  WITH ShiftDetails AS (
                        SELECT 
                            ShiftCode,
                            ShiftStartTime,
                            ShiftEndTime,
                            ShiftId
                        FROM ShiftHeader
                        WHERE ShiftCode IN (SELECT DISTINCT ShiftCode FROM SSPCSdbo.PatternShiftMapping)
                    ),
                   MainData AS (
						SELECT *
						FROM (
							SELECT 
								SKUStock.LocationID,
								SKUStock.StockBucketID,
								CONVERT(VARCHAR, SKUStock.CreatedDate, 120) AS CreatedDateStr, 
								SKU.Model,
								SKU.SKUCode,
								Pack.PackTypeID,
								spm.Quantity AS PalletQuantity,
								sd.ShiftCode, 
								sd.ShiftId,
								StockTransaction.Remarks,
								StockLedger_Warm.CreatedDate,
								ROW_NUMBER() OVER (PARTITION BY SKUStock.LocationID ORDER BY StockLedger_Warm.CreatedDate DESC) AS rn
							FROM SKUStock
							JOIN SKUCost ON SKUStock.SKUCostID = SKUCost.SKUCostID
							JOIN SKUInventory ON SKUCost.SKUInventoryID = SKUInventory.SKUInventoryID
							JOIN SKU ON SKUInventory.SKUID = SKU.SKUID
							JOIN Pack ON SKUStock.LocationID = Pack.LocationID
							JOIN SKUPackMapping spm ON Pack.PackTypeID = spm.PackTypeID AND SKU.SKUID = spm.SKUID
							OUTER APPLY (
								SELECT TOP 1 slw.CreatedDate
								FROM StockLedger_Warm slw
								WHERE slw.SKUBatchID = SKUStock.SKUBatchID
									AND slw.ToLocationID = SKUStock.LocationID
								ORDER BY slw.CreatedDate
							) AS StockLedger_Warm
							LEFT JOIN ShiftDetails sd ON (
								(sd.ShiftStartTime < sd.ShiftEndTime 
									AND CAST(StockLedger_Warm.CreatedDate AS TIME) BETWEEN sd.ShiftStartTime AND sd.ShiftEndTime)
								OR (sd.ShiftStartTime > sd.ShiftEndTime 
									AND (
										CAST(StockLedger_Warm.CreatedDate AS TIME) BETWEEN sd.ShiftStartTime AND '23:59:59'
										OR CAST(StockLedger_Warm.CreatedDate AS TIME) BETWEEN '00:00:00' AND sd.ShiftEndTime
									)
								)
							)
							LEFT JOIN StockTransaction (NOLOCK) ON
								StockTransaction.ToStockBucketID = SKUStock.StockBucketID 
								AND StockTransaction.WarehouseID = SKUStock.WarehouseID
								AND StockTransaction.PrimaryCompanyID = SKUStock.PrimaryCompanyID
								AND StockTransaction.ToLocationID = SKUStock.LocationID
								AND StockTransaction.StockChangeInstructionID = SKUStock.StockChangeInstructionID
							WHERE SKU.SKUCode COLLATE SQL_Latin1_General_CP1_CI_AS IN 
								(SELECT DISTINCT Variant COLLATE SQL_Latin1_General_CP1_CI_AS 
								 FROM SSPCSdbo.PQDataUpload)
						) x
						WHERE rn = 1
					)

                    SELECT 
                        md.*,
                        Calendar.Date AS CalendarDate,
                        Calendar.ShiftGroupId,
                        sg.ShiftGroupCode
                    FROM MainData md
                    LEFT JOIN Calendar 
                        ON md.ShiftId = Calendar.ShiftId 
                        AND CAST(md.CreatedDate AS DATE) = Calendar.Date
                        AND Calendar.Line = '22A'
                    LEFT JOIN ShiftGroup sg ON sg.ShiftGroupId = Calendar.ShiftGroupId;

                `
            )
        const dieSetDetailsMap = new Map();
        models.forEach(model => {
            dieSetDetailsMap.set(model, {
                repairWidget: model,
                data: []
            });
        });

        for (let row of modelBomResult.recordset) {
            dieSetDetailsMap.get(row.Model).data.push({
                id: dieSetDetailsMap.get(row.Model).data.length + 1,
                bomType: row.SKUCode,
                stock: row.Stock,
                PullRatePerSec: row.PullRatePerSec,
                noOfHrsOfSaftyStock: Number(row.NoOfSecOfSafetyStock) / 3600
            });
        };

        let dieSetDetails = Array.from(dieSetDetailsMap.values());
        dieSetDetails.forEach(item => {
            const seen = new Set();
            item.data = item.data.filter(sub => {
                if (seen.has(sub.bomType.trim())) {
                    return false;
                }
                seen.add(sub.bomType.trim());
                return true;
            });
        });
        let SorteddieSetDetails = dieSetDetails.sort((b, a) => a.data.length - b.data.length);

        const getGPQDetailsForAllPart = await getGPQForAllPart(pool);

        const dncPalletDetailsMap = new Map();
        models.forEach(model => {
            dncPalletDetailsMap.set(model, {
                model: model,
                dncRecord: []
            });
        });

        dncPalletResult.recordset.forEach(row => {
            if (Number(row.Repair) > 0)
                dncPalletDetailsMap.get(row.Model)?.dncRecord.push({
                    model: row.Model,
                    partNo: row.SKUCode || 'N/A',
                    gpq: Number(row.GPQ) || 0,
                    repair: Number(row.Repair) || 0,
                    total: Number(row.Total) || 0,
                    dncPallets: row.DNCPalletLocation || 'N/A',
                    locationId: row.LocationID
                });
        });

        let dncPalletDetails = Array.from(dncPalletDetailsMap.values());
        const productionDetailsMap = new Map();

        if (productionResult.recordset.length > 0) {
            productionResult.recordset.forEach(row => {
                const palletKey = row.LocationID;

                if (!productionDetailsMap.has(palletKey)) {
                    productionDetailsMap.set(palletKey, {
                        id: productionDetailsMap.size + 1,
                        palletId: palletKey, //`P${palletKey}`,
                        records: []
                    });
                }

                const palletGroup = productionDetailsMap.get(palletKey);
                palletGroup.records.push({
                    id: palletGroup.records.length + 1,
                    date: getFormattedDateAndTimeIst(row.CreatedDate),
                    model: row.Model,
                    partNo: row.SKUCode,
                    palletQty: row.PalletQuantity,
                    shift: row.ShiftCode,
                    remarks: row.Remarks,
                    shiftGroup: row.ShiftGroupCode
                });
            });
        }
        const formattedProductionDetails = Array.from(productionDetailsMap.values());

        dncPalletDetails = await getUniqueRecordForSameLocationAndSumOfStock(dncPalletDetails);
        console.log('end time', new Date());
        res.json({
            dieSetDetails: SorteddieSetDetails.length > 0 ? SorteddieSetDetails : [{ repairWidget: 'N/A', data: [] }],
            dncPalletDetails: dncPalletDetails.length > 0 ? dncPalletDetails : [{ model: 'N/A', dncRecord: [] }],
            productionDetails: {
                productionDetails: formattedProductionDetails
            },
            GPQDetailsForAllPart: getGPQDetailsForAllPart
        });

    } catch (error) {
        console.error('Error in getInspectionReportData:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch inspection report data'
        });
    }
};
async function getGPQForAllPart(pool) {
    const existingRecord = await pool.request()
        .query(`
                    WITH SKUStockCTE AS (
                    SELECT SKU.SKUCode, SUM(SKUStock.BucketQuantityInStorageUOM) AS GPQ
                    FROM SKUStock
                    JOIN SKUCost ON SKUStock.SKUCostID = SKUCost.SKUCostID
                    JOIN SKUInventory ON SKUCost.SKUInventoryID = SKUInventory.SKUInventoryID
                    JOIN SKU ON SKUInventory.SKUID = SKU.SKUID
                    WHERE SKUStock.StockBucketID IN (
                        SELECT StockBucketID
                        FROM StockBucket
                        WHERE StockBucketCode IN ('PartsOK', 'PartsStorage')
                    ) 
                    GROUP BY SKU.SKUCode
                )
                SELECT SKU.SKUCode, SKUStockCTE.GPQ
                FROM SKU LEFT JOIN SKUStockCTE ON SKU.SKUCode = SKUStockCTE.SKUCode
                WHERE SKU.SKUCode LIKE '%P-%';
                  `);
    return existingRecord.recordset;
};

async function getUniqueRecordForSameLocationAndSumOfStock(dncPalletDetails) {
    const mergedDncPalletDetails = dncPalletDetails.map(({ model, dncRecord }) => {
        const recordMap = new Map();

        dncRecord.forEach(record => {
            const key = record.locationId ; //+ "_" + record.partNo;

            if (recordMap.has(key)) {
                const existing = recordMap.get(key);
                existing.repair += record.repair;
                existing.total += record.total;
                // You can also sum gpq here if needed: existing.gpq += record.gpq;
            } else {
                recordMap.set(key, { ...record }); // Use first record as base
            }
        });

        return {
            model,
            dncRecord: Array.from(recordMap.values())
        };
    });
    return mergedDncPalletDetails;
}

function getFormattedDateAndTimeIst(dateStr) {
    let date = new Date(dateStr);
    const offset = 5.5 * 60 * 60 * 1000; // in milliseconds
    date = new Date(date.getTime() - offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}