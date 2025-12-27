const sql = require('mssql/msnodesqlv8');
const fs = require("fs");
const path = require('path');
const constant = require('../../config/constant');
const logger = require("../../utils/logger");
const reUsableFun = require("../../utils/reUsableFun");
const csv = require('csv-parser');
const { Readable } = require('stream');
const config = require("../../config/dbConfig");
exports.CSVLineEffieciency = async (req, res) => {
    // Checking the file availability
    if (!req.file || !req.file.buffer) {
        logger.customerLogger.error(constant.fileNotFound);
        return res.send(constant.fileNotFound);
    }
    let { palmsid } = req.headers;
    // if (!palmsid) {
    //     return res.send("LoggedIn user ID not found!")
    // }
    try {
        const filename = req.file.originalname;
        const extension = path.extname(filename).toLowerCase();
        // Validation of the uploaded file extension.
        if (extension !== '.csv') {
            return res.send(constant.inValidFileType);
        }
        // Path to save the uploaded file.
        const savePath = path.join(constant.lineEfficiency + '/_' + reUsableFun.getFormattedDate() + "_" + filename);
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
                const mandatoryFields = ['LineName', 'Efficiency'];
                const missingFields = mandatoryFields.filter(field => !headers.includes(field));
                if (missingFields.length) {
                    logger.customerLogger.error(`Missing headers: ` + missingFields.join(', ') + constant.missingColumn)
                    return res.send(`Missing headers: ` + missingFields.join(', ') + constant.missingColumn);
                }
                const bodyData = results.map(el => ({
                    "LineName": el['LineName'],
                    "Efficiency": Number(el['Efficiency'] === '' ? undefined : el['Efficiency']),
                }));
                const pool = await sql.connect(config);
                const query1 = `
                select DISTINCT SKUCategoryCode,SKUCategoryID from SKUCategory`;
                const SKUCategoryResult = await pool.request().query(query1);
                let SKUCategoryList = [];
                if (SKUCategoryResult.recordset.length > 0) {
                    SKUCategoryResult.recordset.forEach((el, index) => {
                        SKUCategoryList.push(el.SKUCategoryCode);
                    })
                }
                let mandatoryFieldDataTypes = ['string', 'number'];
                const specificValueChecks = {
                    LineName: SKUCategoryList
                };
                // Function to validate each row for correct data types, value constraints, and nullability of each column.
                const invalidColumnCheck = await reUsableFun.checkInvalidColumn(bodyData, mandatoryFields, mandatoryFieldDataTypes, specificValueChecks);
                if (invalidColumnCheck) {
                    logger.customerLogger.error(invalidColumnCheck.error + constant.missingColumn)
                    return res.send(invalidColumnCheck.error + constant.missingColumn);
                }
                let EfficiencyListBelowZeroAndAboveHumdred = [];
                bodyData.forEach((el, index) => {
                    if (el.Efficiency < 0 || el.Efficiency > 100) {
                        EfficiencyListBelowZeroAndAboveHumdred.push("Row No: " + (index + 2) + "(Efficiency: " + el.Efficiency + ") ")
                    }
                })
                if (EfficiencyListBelowZeroAndAboveHumdred.length > 0) {
                    return res.send("Efficiency must be between 0 and 100. The following rows have efficiency values greater than 100: " + EfficiencyListBelowZeroAndAboveHumdred.join(", ") + " " + constant.checkAndModifyFile);
                }
                const insertOrUpdateDataToDb = async (rowData, savePath, filename, palmsid) => {
                    const transaction = new sql.Transaction(pool);
                    try {
                        await transaction.begin();
                        let SKUCategoryCodeNotAvailable = [], excelData = [], i = 0;
                        for (let data of rowData) {
                            if (data.LineName !== null) {
                                const SKUCategoryFilter = await SKUCategoryResult.recordset.filter(category => category.SKUCategoryCode === data.LineName)

                                if (SKUCategoryFilter.length === 0) {
                                    SKUCategoryCodeNotAvailable.push(data.LineName);
                                } else {
                                    data.SKUCategoryID = SKUCategoryFilter[0].SKUCategoryID;
                                    i += 1;
                                    excelData.push({ "Sl.No": i, LineName: data.LineName, Efficiency: data.Efficiency })
                                }
                            }
                        }
                        if (SKUCategoryCodeNotAvailable.length > 0) {
                            logger.customerLogger.error("These LineName values are not Available in SKUCategory master, " + SKUCategoryCodeNotAvailable.join(",") + constant.checkAndModifyFile);
                            return res.send("These LineName values are not Available in SKUCategory master, " + SKUCategoryCodeNotAvailable.join(",") + constant.checkAndModifyFile);

                        }
                        for (let data of rowData) {
                            if (data.LineName !== null) {
                                const { LineName, Efficiency } = data;
                                // Checking the existing records
                                const existingRecord = await pool.request()
                                    .input('LineID', sql.Int, data.SKUCategoryID)
                                    .query(`
                                    SELECT COUNT(*) AS count
                                    FROM SSPCSdbo.LineEfficencyMaster
                                    WHERE LineID = @LineID
                                `);

                                if (existingRecord.recordset[0].count > 0) {
                                    // Updating record
                                    await pool.request()
                                        .input('LineID', sql.Int, data.SKUCategoryID)
                                        .input('LineName', sql.NVarChar, LineName)
                                        .input('Efficiency', sql.Decimal(10, 2), Efficiency)
                                        .input('ReferenceFileName', sql.NVarChar, savePath)
                                        .input('ModifiedBy', sql.Int, Number(palmsid)? Number(palmsid) : 1)
                                        .input('ModifiedDateTime', sql.DateTime, reUsableFun.getISTDate())
                                        .query(`
                                        UPDATE SSPCSdbo.LineEfficencyMaster
                                        SET LineName = @LineName,
                                            Efficiency = @Efficiency,
                                            ReferenceFileName=@ReferenceFileName,
                                            ModifiedBy = @ModifiedBy,
                                            ModifiedDateTime = @ModifiedDateTime
                                        WHERE LineID = @LineID
                                    `);
                                } else {
                                    // Insert new record
                                    await pool.request()
                                        .input('LineID', sql.Int, data.SKUCategoryID)
                                        .input('LineName', sql.NVarChar, LineName)
                                        .input('Efficiency', sql.Decimal(10, 2), Efficiency)
                                        .input('ReferenceFileName', sql.NVarChar, savePath)
                                        .input('CreatedBy', sql.Int, Number(palmsid)? Number(palmsid) : 1)
                                        .input('CreatedDateTime', sql.DateTime, reUsableFun.getISTDate())
                                        .query(`
                                        INSERT INTO SSPCSdbo.LineEfficencyMaster (
                                            LineID, LineName, Efficiency, ReferenceFileName, CreatedBy, CreatedDateTime
                                        ) VALUES (
                                            @LineID, @LineName, @Efficiency, @ReferenceFileName, @CreatedBy, @CreatedDateTime
                                        );
                                    `);
                                }
                            }
                        }
                        await transaction.commit();
                        // Saving the data in CSV format to the specified path.
                        reUsableFun.SaveJsonToCsvFile(excelData, savePath);
                        res.send(filename + constant.successResponse);
                        logger.customerLogger.info(filename + constant.successResponse);
                    } catch (error) {
                        logger.customerLogger.error(error);
                        return res.send(constant.serverError);
                    }
                };

                await insertOrUpdateDataToDb(bodyData, savePath, filename, palmsid);

            });

    } catch (error) {
        logger.customerLogger.error('Unexpected error:', error);
        res.status(500).send('Internal server error');
    }
};




