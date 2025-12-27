const sql = require('mssql/msnodesqlv8');
const path = require('path');
const constant = require('../../config/constant');
const logger = require("../../utils/logger");
const reUsableFun = require("../../utils/reUsableFun");
const csv = require('csv-parser');
const { Readable } = require('stream');
const config = require("../../config/dbConfig");
exports.CSVUploadPQData = async (req, res) => {
    // Checking the file availability
    if (!req.file || !req.file.buffer) {
        logger.customerLogger.error(constant.fileNotFound);
        return res.status(400).send(constant.fileNotFound);
    }
    let { palmsid } = req.headers;
    try {
        const filename = req.file.originalname;
        const extension = path.extname(filename).toLowerCase();
        // Validation of the uploaded file extension.
        if (extension !== '.csv') {
            return res.send(constant.inValidFileType);
        }
        // Path to save the uploaded file.
        const savePath = path.join(constant.pqDataUpload + '/_' + reUsableFun.getFormattedDate() + "_" + filename);
        const results = [];
        let headers = [];
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);
        bufferStream
            .pipe(csv())
            .on('headers', (headerList) => {
                headers = headerList;
            })
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                if (results.length === 0) {
                    logger.customerLogger.error(filename + " " + constant.fileEmpty);
                    return res.send(filename + " " + constant.fileEmpty);
                }
                // Mandatory csv file headers
                const mandatoryFields = ['LineName', 'EffectiveFrom', 'DieSet', 'Variant', 'PerDayVolume', 'NoOfWeldWorkingSecPerDay', 'NoOfSecOfSafetyStock', 'FLVTLotSize', 'TotalPartKanbansInCirculation', 'TotalFLVTMaterialKanbanInCirculation', 'SPS', 'DayVolume', 'PMSP'];
                const missingFields = mandatoryFields.filter(field => !headers.includes(field));

                if (missingFields.length) {
                    return res.send(`Missing headers: ` + missingFields.join(', ') + " " + constant.missingColumn);
                }
                const bodyData = results.map(el => ({
                    LineName: el['LineName'],
                    EffectiveFrom: reUsableFun.convertDateDDMMYYtoYYMMDD(el['EffectiveFrom']),
                    DieSet: el['DieSet'].trim(),
                    Variant: el['Variant'],
                    PerDayVolume: Number(el['PerDayVolume'] === '' ? undefined : el['PerDayVolume']),
                    NoOfWeldWorkingSecPerDay: Number(el['NoOfWeldWorkingSecPerDay'] === '' ? undefined : el['NoOfWeldWorkingSecPerDay']),
                    NoOfSecOfSafetyStock: Number(el['NoOfSecOfSafetyStock'] === '' ? undefined : el['NoOfSecOfSafetyStock']),
                    FLVTLotSize: Number(el['FLVTLotSize'] === '' ? undefined : el['FLVTLotSize']),
                    TotalPartKanbansInCirculation: Number(el['TotalPartKanbansInCirculation'] === '' ? undefined : el['TotalPartKanbansInCirculation']),
                    TotalFLVTMaterialKanbanInCirculation: Number(el['TotalFLVTMaterialKanbanInCirculation'] === '' ? undefined : el['TotalFLVTMaterialKanbanInCirculation']),
                    SPS: Number(el["SPS"] === '' ? undefined : el["SPS"]),
                    PMSP: reUsableFun.stringToBoolean(el['PMSP']),
                    DayVolume: reUsableFun.stringToBoolean(el['DayVolume'])
                }));
                const pool = new sql.ConnectionPool(config);
                await pool.connect();
                let SKUCategoryList = [], BOMTypeList = [];
                let SKUCategoryAndBomTypeResult = await pool.request()
                    .query(`
                             WITH SKUCategoryCTE AS (
                                    SELECT DISTINCT SKUCategoryCode FROM SKUCategory
                                    ),
                                    BOMTypeMasterCTE AS (
                                    SELECT DISTINCT DieSet FROM SSPCSdbo.BOMTypeMaster 
                                    )
                                    SELECT * FROM SKUCategoryCTE, BOMTypeMasterCTE;
                        `)
                if (SKUCategoryAndBomTypeResult.recordset.length > 0) {
                    SKUCategoryAndBomTypeResult.recordset.forEach(el => {
                        SKUCategoryList.push(el.SKUCategoryCode);
                        BOMTypeList.push(el.DieSet);
                    })
                } else {
                    return res.send("No records found in BOMTypeMaster. Please Upload BOMType Master before uploading PQData.");
                }
                SKUCategoryList = [...new Set(SKUCategoryList)];
                BOMTypeList = [...new Set(BOMTypeList)];
                // Acceptable data types for each header in a CSV file
                let mandatoryFieldDataTypes = ['string', 'dateOnly', "string", "string", "integer", "integer", "integer", "integer", "integer", "integer", "number", 'boolean', 'boolean'];
                const specificValueChecks = {
                    LineName: SKUCategoryList
                };
                // Function to validate each row for correct data types, value constraints, and nullability of each column.
                const invalidColumnCheck = await reUsableFun.checkInvalidColumn(bodyData, mandatoryFields, mandatoryFieldDataTypes, specificValueChecks);
                if (invalidColumnCheck) {
                    return res.send(invalidColumnCheck.error + constant.missingColumn);
                }
                let body = [], excelData = [], i = 1, partQpcNotAvailable = [];

                let notAvailableBomtype = [], varientNotAvailable = [], EffectiveFromList = [], lineNameList = [], dieSetHavingNoOfWeldWorkingSecPerDayIsZero = [];
                const getQpcDetails = await getQpcForAllPart(pool);
                for (let data of bodyData) {
                    EffectiveFromList.push(data.EffectiveFrom);
                    lineNameList.push(data.LineName);
                    excelData.push({ "SI No": i, LineName: data.LineName, EffectiveFrom: data.EffectiveFrom, DieSet: data.DieSet, Variant: data.Variant, PerDayVolume: data.PerDayVolume, NoOfWeldWorkingSecPerDay: data.NoOfWeldWorkingSecPerDay, NoOfSecOfSafetyStock: data.NoOfSecOfSafetyStock, TotalPartKanbansInCirculation: data.TotalPartKanbansInCirculation, FLVTLotSize: data.FLVTLotSize, TotalFLVTMaterialKanbanInCirculation: data.TotalFLVTMaterialKanbanInCirculation, SPS: data.SPS })
                    i += 1;
                    let filtereData = SKUCategoryAndBomTypeResult.recordset.filter(el => el.DieSet?.toLowerCase().trim() === data.DieSet.toLowerCase().trim());
                    if (filtereData.length === 0) {
                        notAvailableBomtype.push(data.DieSet);
                    }
                    else {
                        let checkQpcForPart = await getQpcDetails.filter(col => col.SKUCode.trim().toLowerCase() === data.Variant.trim().toLowerCase());
                        if (checkQpcForPart[0]?.Quantity === null) {
                            partQpcNotAvailable.push(data.Variant);
                        } else {
                            let existingRecord = await pool.request()
                                .input('DieSet', sql.NVarChar, data.DieSet)
                                .query(`
                                  WITH SKUCodeCTE AS (
									select SKUCode from SKU where SKUID IN (select KitItemID from KitBOM where BOMType=@DieSet)
									), QtyPerPalletCTE AS (
									SELECT MIN(Quantity) AS QtyPerPallet FROM SKUPackMapping  WHERE SKUID = (SELECT Top(1) KitItemID FROM KitBOM WHERE BOMType = @DieSet ) AND IsDefault>0
									) Select * from SKUCodeCTE,QtyPerPalletCTE;
                        `)
                            if (existingRecord.recordset.length == 0) {
                                notAvailableBomtype.push(data.DieSet);
                                data.PullRatePerSec = data.PerDayVolume / data.NoOfWeldWorkingSecPerDay;
                                data.SafetyStock = data.PullRatePerSec * data.NoOfSecOfSafetyStock;
                                data.RoundUpSafetyStock = 0;
                            } else {
                                if (data.NoOfWeldWorkingSecPerDay === 0) {
                                    dieSetHavingNoOfWeldWorkingSecPerDayIsZero.push('DieSet: ' + data.DieSet);
                                }
                                let varientFiltedData = existingRecord.recordset.filter(el => el.SKUCode.trim().toLowerCase() === data.Variant.trim().toLowerCase());
                                if (varientFiltedData.length === 0) {
                                    varientNotAvailable.push("DieSet: " + data.DieSet + " Varient: " + data.Variant);
                                } else {
                                    data.PullRatePerSec = data.PerDayVolume / data.NoOfWeldWorkingSecPerDay;
                                    data.SafetyStock = data.PullRatePerSec * data.NoOfSecOfSafetyStock;
                                    data.RoundUpSafetyStock = Math.ceil(data.SafetyStock / existingRecord.recordset[0].QtyPerPallet) * existingRecord.recordset[0].QtyPerPallet;
                                    data.QtyPerPallet = existingRecord.recordset[0].QtyPerPallet;
                                }
                            }
                        }
                    }
                }
                lineNameList = [...new Set(lineNameList)];
                EffectiveFromList = [...new Set(EffectiveFromList)];
                dieSetHavingNoOfWeldWorkingSecPerDayIsZero = [...new Set(dieSetHavingNoOfWeldWorkingSecPerDayIsZero)];

                if (EffectiveFromList.length > 1) {
                    return res.send("Please provide one EffectiveFrom date for each PQData upload" + constant.checkAndModifyFile)
                } else if (lineNameList.length > 1) {
                    return res.send("Please provide one LineName  for each PQData upload" + constant.checkAndModifyFile)
                } else if (dieSetHavingNoOfWeldWorkingSecPerDayIsZero.length > 0) {
                    return res.send('The NoOfWeldWorkingSecPerDay for the following dieSets, ' + dieSetHavingNoOfWeldWorkingSecPerDayIsZero.join(', ') + ', is currently set to 0, which is not allowed' + constant.checkAndModifyFile);
                } else if (notAvailableBomtype.length > 0) {
                    return res.send("Thease DieSet values are not available in KitBOM Table " + notAvailableBomtype.join(",") + constant.checkAndModifyFile);
                } else if (partQpcNotAvailable.length > 0) {
                    return res.send("Quantity per pallet Not found for the following Variant: " + partQpcNotAvailable.join(",") + constant.checkAndModifyFile);
                } else if (varientNotAvailable.length > 0) {
                    return res.send("Thease Varient values are not available in PQData csv file " + varientNotAvailable.join(",") + constant.checkAndModifyFile);
                }

                let date = bodyData[0].EffectiveFrom;
                // isDateGreaterOrEqual for ContinueFromPatternNo
                let isValid = reUsableFun.isDateGreater(date);
                // if (!isValid) {
                //     return res.send("Please update future EffectiveFrom Date.");
                // }
                let chechDateIsWorking = await reUsableFun.checkHolidyForEntirePlan(date, 0, 0, bodyData[0].LineName, config);
                if (typeof (chechDateIsWorking) === 'string') {
                    let nextDate = new Date()
                    nextDate.setDate(nextDate.getDate() + 10);
                    nextDate = reUsableFun.getFormattedOnlyDate(nextDate);
                    return res.send("No working days found in the calendar for Line " + bodyData[0].LineName + " between " + bodyData[0].EffectiveFrom + " and " + nextDate + ". Please Check the Calender and Add the Woring Day");
                }
                date = await reUsableFun.getNextWorkngDay(date, bodyData[0].LineName, config);
                const InsertOrUpdateDataToDb = async (rowData, Eff_From, savePath, palmsid) => {
                    const pool = await sql.connect(config);
                    const transaction = new sql.Transaction(pool);
                    try {
                        await transaction.begin();

                        for (let data of rowData) {
                            const { LineName, EffectiveFrom, DieSet, Variant, PerDayVolume, NoOfWeldWorkingSecPerDay, NoOfSecOfSafetyStock, TotalPartKanbansInCirculation, TotalFLVTMaterialKanbanInCirculation,
                                FLVTLotSize, QtyPerPallet, RoundUpSafetyStock, SafetyStock, PullRatePerSec, SPS } = data;

                            // Check for existing record in the database for each row
                            const existingRecord = await pool.request()
                                .input('LineName', sql.NVarChar, LineName)
                                .input('DieSet', sql.NVarChar, DieSet)
                                .input('Variant', sql.NVarChar, Variant)
                                .input('EffectiveFrom', sql.Date, date)
                                .query(`
                                    SELECT LineName, DieSet, Variant
                                    FROM SSPCSdbo.PQDataUpload
                                    WHERE LineName = @LineName AND DieSet = @DieSet AND Variant = @Variant AND EffectiveFrom = @EffectiveFrom
                                `);

                            if (existingRecord.recordset.length > 0) {
                                // Update existing record
                                await pool.request()
                                    .input('LineName', sql.NVarChar, LineName)
                                    .input('EffectiveFrom', sql.Date, Eff_From)
                                    .input('DieSet', sql.NVarChar, DieSet)
                                    .input('Variant', sql.NVarChar, Variant)
                                    .input('PerDayVolume', sql.Int, PerDayVolume)
                                    .input('NoOfWeldWorkingSecPerDay', sql.Int, NoOfWeldWorkingSecPerDay)
                                    .input('NoOfSecOfSafetyStock', sql.Int, NoOfSecOfSafetyStock)
                                    .input('FLVTLotSize', sql.Int, FLVTLotSize)
                                    .input('TotalPartKanbansInCirculation', sql.Int, TotalPartKanbansInCirculation)
                                    .input('TotalFLVTMaterialKanbanInCirculation', sql.NVarChar, TotalFLVTMaterialKanbanInCirculation)
                                    .input('PullRatePerSec', sql.Decimal(10, 5), PullRatePerSec)
                                    .input('SafetyStock', sql.Decimal(10, 5), SafetyStock)
                                    .input('RoundUpSafetyStock', sql.Int, RoundUpSafetyStock)
                                    .input('ReferenceFileName', sql.NVarChar, savePath)
                                    .input('ModifiedBy', sql.Int, Number(palmsid) ? Number(palmsid) : 1)
                                    .input('ModifiedDateTime', sql.DateTime, reUsableFun.getISTDate())
                                    .input('SPS', sql.Decimal(10, 5), SPS)
                                    .input('DayVolume', sql.Bit, data.DayVolume)
                                    .input('PMSP', sql.Bit, data.PMSP)
                                    .query(`
                                        UPDATE SSPCSdbo.PQDataUpload
                                        SET PerDayVolume = @PerDayVolume,
                                            NoOfWeldWorkingSecPerDay = @NoOfWeldWorkingSecPerDay,
                                            NoOfSecOfSafetyStock = @NoOfSecOfSafetyStock,
                                            FLVTLotSize = @FLVTLotSize,
                                            TotalPartKanbansInCirculation = @TotalPartKanbansInCirculation,
                                            TotalFLVTMaterialKanbanInCirculation = @TotalFLVTMaterialKanbanInCirculation,
                                            PullRatePerSec = @PullRatePerSec,
                                            SafetyStock = @SafetyStock,
                                            RoundUpSafetyStock = @RoundUpSafetyStock,
                                            SPS = @SPS,
                                            ReferenceFileName = @ReferenceFileName,
                                            ModifiedBy = @ModifiedBy,
                                            ModifiedDateTime = @ModifiedDateTime,
                                            PMSP = @PMSP,
                                            DayVolume  @DayVolume
                                        WHERE LineName = @LineName AND DieSet = @DieSet AND Variant = @Variant AND EffectiveFrom = @EffectiveFrom
                                    `);
                            } else {
                                // Insert new record
                                await pool.request()
                                    .input('LineName', sql.NVarChar, LineName)
                                    .input('EffectiveFrom', sql.Date, Eff_From)
                                    .input('DieSet', sql.NVarChar, DieSet)
                                    .input('Variant', sql.NVarChar, Variant)
                                    .input('PerDayVolume', sql.Int, PerDayVolume)
                                    .input('NoOfWeldWorkingSecPerDay', sql.Int, NoOfWeldWorkingSecPerDay)
                                    .input('NoOfSecOfSafetyStock', sql.Int, NoOfSecOfSafetyStock)
                                    .input('FLVTLotSize', sql.Int, FLVTLotSize)
                                    .input('TotalPartKanbansInCirculation', sql.Int, TotalPartKanbansInCirculation)
                                    .input('TotalFLVTMaterialKanbanInCirculation', sql.NVarChar, TotalFLVTMaterialKanbanInCirculation)
                                    .input('PullRatePerSec', sql.Decimal(10, 5), PullRatePerSec)
                                    .input('SafetyStock', sql.Decimal(10, 5), SafetyStock)
                                    .input('RoundUpSafetyStock', sql.Int, RoundUpSafetyStock)
                                    .input('ReferenceFileName', sql.NVarChar, savePath)
                                    .input('CreatedBy', sql.Int, Number(palmsid) ? Number(palmsid) : 1)
                                    .input('CreatedDateTime', sql.DateTime, reUsableFun.getISTDate())
                                    .input('SPS', sql.Decimal(10, 5), SPS)
                                    .input('DayVolume', sql.Bit, data.DayVolume)
                                    .input('PMSP', sql.Bit, data.PMSP)
                                    .query(`
                                        INSERT INTO SSPCSdbo.PQDataUpload (
                                            LineName, EffectiveFrom, DieSet, Variant, PerDayVolume,
                                            NoOfWeldWorkingSecPerDay, NoOfSecOfSafetyStock, FLVTLotSize,
                                            TotalPartKanbansInCirculation, TotalFLVTMaterialKanbanInCirculation,
                                            PullRatePerSec, SafetyStock, RoundUpSafetyStock,
                                            ReferenceFileName, CreatedBy, CreatedDateTime,SPS,PMSP,DayVolume
                                        ) VALUES (
                                            @LineName, @EffectiveFrom, @DieSet, @Variant, @PerDayVolume,
                                            @NoOfWeldWorkingSecPerDay, @NoOfSecOfSafetyStock, @FLVTLotSize,
                                            @TotalPartKanbansInCirculation, @TotalFLVTMaterialKanbanInCirculation,
                                            @PullRatePerSec, @SafetyStock, @RoundUpSafetyStock,
                                            @ReferenceFileName, @CreatedBy, @CreatedDateTime,@SPS, @PMSP, @DayVolume
                                        )
                                    `);
                            }
                        }

                        await transaction.commit();
                    } catch (err) {
                        await transaction.rollback();
                        logger.customerLogger.error('Unexpected error:', err.message);
                        return err.message;
                    }
                };


                await InsertOrUpdateDataToDb(bodyData, date, savePath, palmsid);
                // Saving the data in CSV format to the specified path.
                reUsableFun.SaveJsonToCsvFile(excelData, savePath);
                console.log('Data inserted/updated successfully');
                res.send(filename + constant.successResponse)
            });
    } catch (error) {
        logger.customerLogger.error('Unexpected error:', error.message);
        res.send(error.message);
    }
};

async function getQpcForAllPart(pool) {
    try {
        const result = await pool.request()
            .query(`
                   SELECT SKU.SKUCode, CASE  WHEN spm.Quantity IS NOT NULL THEN spm.Quantity  ELSE NULL 
                    END AS Quantity
                    FROM SKU
                    LEFT JOIN SKUPackMapping spm 
                        ON SKU.SKUID = spm.SKUID
                        AND spm.IsDefault = 1 
                        AND spm.Quantity > 0
                    WHERE SKU.SKUCode LIKE '%P-%'
                    `);
        return result.recordset;

    } catch (error) {
        return error.message;
    }
} 
