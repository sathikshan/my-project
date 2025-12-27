const sql = require('mssql/msnodesqlv8');
const path = require('path');
const constant = require('../../config/constant');
const logger = require("../../utils/logger");
const reUsableFun = require("../../utils/reUsableFun");
const csv = require('csv-parser');
const { Readable } = require('stream');
const config = require("../../config/dbConfig");
exports.CSVShiftChangeover = async (req, res) => {
    // Checking the file availability
    if (!req.file || !req.file.buffer) {
        logger.customerLogger.error(constant.fileNotFound);
        return res.send(constant.fileNotFound);
    }
    let { palmsid } = req.headers;
    // if(!palmsid){
    //   return res.send("LoggedIn user ID not found!")
    // }

    try {
        const filename = req.file.originalname;
        const extension = path.extname(filename).toLowerCase();
        // Validation of the uploaded file extension.
        if (extension !== '.csv') {
            return res.send(constant.inValidFileType);
        }
        // Path to save the uploaded file.
        const savePath = path.join(constant.shiftChangeOver + '/_' + reUsableFun.getFormattedDate() + "_" + filename);
        const results = [];
        let headers = [];
        // Create custom readable streams to read a file.
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
                const mandatoryFields = ['LineName', 'DieSet', 'Variant', 'ShiftChangeoverKanbans', 'FromDate', 'FromShift', 'ToDate', 'ToShift'];
                const missingFields = mandatoryFields.filter(field => !headers.includes(field));

                if (missingFields.length) {
                    return res.send(`Missing headers: ` + missingFields.join(', ') + constant.missingColumn);
                }
                const bodyData = results.map(el => ({
                    "LineName": el['LineName'],
                    "DieSet": el['DieSet'].trim(),
                    "Variant": el["Variant"].trim(),
                    "ShiftChangeoverKanbans": Number(el['ShiftChangeoverKanbans'] === '' ? undefined : el['ShiftChangeoverKanbans']),
                    "FromDate": reUsableFun.convertDateDDMMYYtoYYMMDD(el['FromDate']),
                    "FromShift": el['FromShift'],
                    "ToDate": reUsableFun.convertDateDDMMYYtoYYMMDD(el['ToDate']),
                    "ToShift": el['ToShift']
                }));
                let lineName = [], lineNameEmpt = [];
                bodyData.forEach((el, index) => {
                    lineName.push(el.LineName);
                    if (el.LineName === "") {
                        lineNameEmpt.push("Row No: " + (index + 2));
                    }
                })
                if (lineNameEmpt.length > 0) {
                    return res.send("In the following Rows LineName is empty " + lineNameEmpt.join(", ") + " " + constant.checkAndModifyFile);
                }
                lineName = [...new Set(lineName)];

                const pool = await sql.connect(config);
                const SKUCategoryResult = await pool.request()
                    .input("LineName", sql.NVarChar, bodyData[0].LineName)
                    .query(`WITH SKUCategoryCTE AS (
                        SELECT DISTINCT SKUCategoryCode FROM SKUCategory
                    ),
                    ShiftheaderCTE AS (
                        SELECT DISTINCT ShiftCode 
                        FROM SSPCSdbo.PatternShiftMapping 
                        WHERE LineName = @LineName
                    ),
                    DieSetCTE AS (
                        SELECT DISTINCT DieSet, Variant
                        FROM SSPCSdbo.PQDataUpload
                        WHERE EffectiveFrom = (
                            SELECT TOP (1) EffectiveFrom 
                            FROM SSPCSdbo.PQDataUpload 
                            WHERE LineName = @LineName
                            ORDER BY EffectiveFrom DESC
                        )
                    )
                    SELECT  SKUCategoryCTE.SKUCategoryCode, ShiftheaderCTE.ShiftCode, DieSetCTE.DieSet, DieSetCTE.Variant
                    FROM SKUCategoryCTE
                    CROSS JOIN ShiftheaderCTE
                    CROSS JOIN DieSetCTE`);
                let SKUCategoryList = [], ShiftList = [];
                if (SKUCategoryResult.recordset.length > 0) {
                    SKUCategoryResult.recordset.forEach((el, index) => {
                        SKUCategoryList.push(el.SKUCategoryCode);
                        ShiftList.push(el.ShiftCode);
                    })
                }
                SKUCategoryList = [...new Set(SKUCategoryList)]
                ShiftList = [...new Set(ShiftList)];
                if (!SKUCategoryList.includes(bodyData[0].LineName)) {
                    return res.send("Invalid LineName in row: 2. Expected one of " + SKUCategoryList.join(', ') + constant.checkAndModifyFile);
                }

                if (ShiftList.length <= 2) {
                    return res.send("Add the ShiftCode for the specified LineName in the SSPCSdbo.PatternShiftMapping table." + constant.checkAndModifyFile);
                }
                // Acceptable data types for each header in a CSV file
                let mandatoryFieldDataTypes = ['string', 'string', 'string', 'integer', "dateOnly", "string", "dateOnly", "string"];
                const specificValueChecks = {
                    LineName: SKUCategoryList,
                    FromShift: ShiftList,
                    ToShift: ShiftList
                };
                // Function to validate each row for correct data types, value constraints, and nullability of each column.
                const invalidColumnCheck = await reUsableFun.checkInvalidColumn(bodyData, mandatoryFields, mandatoryFieldDataTypes, specificValueChecks);
                if (invalidColumnCheck) {
                    return res.send(invalidColumnCheck.error + constant.missingColumn);
                }
                if (lineName.length > 1) {
                    return res.send("Please provide one LineName per Upload. " + constant.checkAndModifyFile);
                }
                let dateNotGreaterThanCurrDate = [], toDateLessThanFromDate = [];
                for (let i = 0; i < bodyData.length; i++) {
                    let isValidFromDate = await reUsableFun.isDateGreaterOrEqual(bodyData[i].FromDate);
                    let isValidToDate = await reUsableFun.isDateGreaterOrEqual(bodyData[i].ToDate);
                    // Validate that FromDate and ToDate are greater than or equal to the current date.
                    if (!isValidFromDate) {
                        dateNotGreaterThanCurrDate.push("FromDate: row no " + (i + 2))
                    }
                    if (!isValidToDate) {
                        dateNotGreaterThanCurrDate.push("ToDate: row no " + (i + 2))
                    }
                    if (bodyData[i].ToDate <= bodyData[i].FromDate) {
                        toDateLessThanFromDate.push(i + 2);
                    }
                }
                if (dateNotGreaterThanCurrDate.length > 0) {
                    return res.send("In the following [" + dateNotGreaterThanCurrDate.join(", ") + "] date Shoud be greater than current date");
                }
                if (toDateLessThanFromDate.length > 0) {
                    return res.send("In the following rows [" + toDateLessThanFromDate.join(", ") + "] ToDate should be greater than FromDate");
                }
                const InsertOrUpdateDataToDb = async (rowData, savePath, filename, palmsid) => {
                    const pool = await sql.connect(config);
                    let excelData = [], i = 0;
                    let notAvailableBomtype = [], notAvailableFromShift = [], notAvailableToShift = [];
                    for (let data of rowData) {
                        // Validating the availability of DieSet in the KitBOM table and FromShift & ToShift in the ShiftHeader table.
                        let DieSetFilteredRecord = await SKUCategoryResult.recordset.filter(el => el.DieSet.trim().toLowerCase() === data.DieSet.trim().toLowerCase() && el.Variant.trim().toLowerCase() === data.Variant.trim().toLowerCase())
                        if (DieSetFilteredRecord.length === 0) {
                            notAvailableBomtype.push(data.DieSet + ":" + data.Variant);
                        }
                    }
                    let errMessage = "";
                    if (notAvailableBomtype.length > 0) {
                        return res.send("these DieSet:Variant values not available in SSPCSdbo.PQDATA table for Line: " + rowData[0].lineName + ", " + notAvailableBomtype.join(",") + constant.checkAndModifyFile);
                    }
                    for (let data of rowData) {
                        const { LineName, DieSet, Variant, FromDate, FromShift, ToDate, ToShift, ShiftChangeoverKanbans } = data;
                        i += 1;
                        excelData.push({ "Sl.No": i, LineName: LineName, DieSet: DieSet, Variant: Variant, ShiftChangeoverKanbans: ShiftChangeoverKanbans, FromDate: FromDate, FromShift: FromShift, ToDate: ToDate, ToShift: ToShift })
                        // Checking the record into SSPCSdbo.ShiftChangeoverStockMaster.
                        const existingRecord = await pool.request()
                            .input('LineName', sql.NVarChar, LineName)
                            .input('DieSet', sql.NVarChar, DieSet)
                            .input('Variant', sql.NVarChar, Variant)
                            .input('FromDate', sql.Date, FromDate)
                            .input('FromShift', sql.NVarChar, FromShift)
                            .input('ToDate', sql.Date, ToDate)
                            .input('ToShift', sql.NVarChar, ToShift)
                            .query(`
                        SELECT COUNT(*) AS count
                        FROM SSPCSdbo.ShiftChangeoverStockMaster
                        WHERE DieSet = @DieSet
                          AND FromDate = @FromDate
                          AND FromShift = @FromShift
                          AND ToDate = @ToDate
                          AND ToShift = @ToShift
                          AND LineName = @LineName
                          AND Variant = @Variant
                    `);

                        if (existingRecord.recordset[0].count > 0) {
                            // updating
                            await pool.request()
                                .input('LineName', sql.NVarChar, LineName)
                                .input('DieSet', sql.NVarChar, DieSet)
                                .input('Variant', sql.NVarChar, Variant)
                                .input('ShiftChangeoverKanbans', sql.Int, ShiftChangeoverKanbans)
                                .input('FromDate', sql.Date, FromDate)
                                .input('FromShift', sql.NVarChar, FromShift)
                                .input('ToDate', sql.Date, ToDate)
                                .input('ToShift', sql.NVarChar, ToShift)
                                .input('ReferenceFileName', sql.NVarChar, savePath)
                                .input('ModifiedBy', sql.Int, Number(palmsid) ? Number(palmsid) : 1)
                                .input('ModifiedDateTime', sql.DateTime, reUsableFun.getISTDate())

                                .query(`
                            UPDATE SSPCSdbo.ShiftChangeoverStockMaster
                            SET ShiftChangeoverKanbans = @ShiftChangeoverKanbans,
                                ReferenceFileName = @ReferenceFileName,
                                ModifiedBy = @ModifiedBy,
                                ModifiedDateTime = @ModifiedDateTime
                                
                            WHERE DieSet = @DieSet
                              AND FromDate = @FromDate
                              AND FromShift = @FromShift
                              AND ToDate = @ToDate
                              AND ToShift = @ToShift
                              AND LineName = @LineName
                              AND Variant = @Variant
                        `);
                        } else {
                            // Inserting new records
                            await pool.request()
                                .input('LineName', sql.NVarChar, LineName)
                                .input('DieSet', sql.NVarChar, DieSet)
                                .input('Variant', sql.NVarChar, Variant)
                                .input('ShiftChangeoverKanbans', sql.Int, ShiftChangeoverKanbans)
                                .input('FromDate', sql.Date, FromDate)
                                .input('FromShift', sql.NVarChar, FromShift)
                                .input('ToDate', sql.Date, ToDate)
                                .input('ToShift', sql.NVarChar, ToShift)
                                .input('ReferenceFileName', sql.NVarChar, savePath)
                                .input('CreatedBy', sql.Int, Number(palmsid) ? Number(palmsid) : 1)
                                .input('CreatedDateTime', sql.DateTime, reUsableFun.getISTDate())
                                .query(`
                            INSERT INTO SSPCSdbo.ShiftChangeoverStockMaster (
                               LineName, DieSet, Variant, ShiftChangeoverKanbans, FromDate, FromShift, ToDate, ToShift, ReferenceFileName, CreatedBy, CreatedDateTime
                            ) VALUES (
                               @LineName,  @DieSet, @Variant, @ShiftChangeoverKanbans, @FromDate, @FromShift, @ToDate, @ToShift, @ReferenceFileName,@CreatedBy, @CreatedDateTime
                            )
                        `);
                        }
                    }

                    console.log('Data inserted/updated successfully');
                    // Saving the data in CSV format to the specified path.
                    reUsableFun.SaveJsonToCsvFile(excelData, savePath);
                    res.send(filename + constant.successResponse);
                };
                await InsertOrUpdateDataToDb(bodyData, savePath, filename, palmsid);
            });

    } catch (error) {
        logger.customerLogger.error('Unexpected error:', error);
        res.send(error.messsage);
    }
};