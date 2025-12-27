const sql = require('mssql/msnodesqlv8');
const path = require('path');
const constant = require('../../config/constant');
const logger = require("../../utils/logger");
const reUsableFun = require("../../utils/reUsableFun");
const csv = require('csv-parser');
const { Readable } = require('stream');
const config = require("../../config/dbConfig");
exports.CSVUploadSKUMaster = async (req, res) => {
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
        const savePath = path.join(constant.skuMater + '/_' + reUsableFun.getFormattedDate() + "_" + filename);
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
                const mandatoryFields = ['SKUCode', 'ISSheetWashRequired'];
                const missingFields = mandatoryFields.filter(field => !headers.includes(field));

                if (missingFields.length) {
                    return res.send(`Missing headers: ` + missingFields.join(', ') + constant.checkAndModifyFile);
                }
                const bodyData = results.map(el => ({
                    // "SKUName": el['SKUName'],
                    "SKUCode": el['SKUCode'],
                    "ISSheetWashRequired": reUsableFun.stringToBoolean(el['ISSheetWashRequired'])
                }));
                let skuCodeDuplicate = reUsableFun.findDuplicateColumn(bodyData, 'SKUCode');
                if (skuCodeDuplicate.length > 0) {
                    return res.send("Duplicate SKUCode values " + skuCodeDuplicate.join(', ' + constant.checkAndModifyFile));
                }
                // Acceptable data types for each header in a CSV file
                let mandatoryFieldDataTypes = ['string', "boolean"];
                const specificValueChecks = {

                };
                // Function to validate each row for correct data types, value constraints, and nullability of each column.
                const invalidColumnCheck = await reUsableFun.checkInvalidColumn(bodyData, mandatoryFields, mandatoryFieldDataTypes, specificValueChecks);
                if (invalidColumnCheck) {
                    return res.send(invalidColumnCheck.error);
                }
                // SQL query to retrieve SKUCode, SKUName, and SKUID from the SKU table to validate the SKUCode in the uploaded file.
                const pool = await sql.connect(config);
                const query = `
                                 select  DISTINCT SKUCode,SKUName,SKUID from SKU`;

                const SKUResult = await pool.request().query(query);

                const insertOrUpdateDataToDb = async (rowData, savePath, filename, palmsid) => {
                    try {

                        let skuCodeNotAvailable = [];
                        let excelData = [], i = 0;
                        for (let data of rowData) {
                            if (data.SKUCode !== null) {
                                const SKUCategoryFilter = await SKUResult.recordset.filter(category => category.SKUCode === data.SKUCode)
                                if (SKUCategoryFilter.length === 0) {
                                    skuCodeNotAvailable.push(data.SKUCode);

                                } else {
                                    data.SKUID = SKUCategoryFilter[0].SKUID;
                                    data.SKUName = SKUCategoryFilter[0].SKUName;
                                    i += 1;
                                    excelData.push({
                                        "Sl.No": i, SKUName: data.SKUName, SKUCode: data.SKUCode, ISSheetWashRequired: data.ISSheetWashRequired
                                    })
                                }
                            }
                        }

                        if (skuCodeNotAvailable.length > 0) {
                            return res.send("these SKUCode values are not Available in SKU table, " + skuCodeNotAvailable.join(",") + constant.checkAndModifyFile);
                        } else {
                            for (let data of rowData) {
                                if (data.SKUCode !== null) {
                                    // Checking for existing data
                                    const { SKUCode, ISSheetWashRequired } = data;
                                    const existingRecord = await pool.request()
                                        .input('SKUID', sql.Int, data.SKUID)
                                        .query(`
                                          SELECT COUNT(*) AS count
                                          FROM SSPCSdbo.SKUMaster
                                          WHERE SKUID = @SKUID
                                      `);

                                    if (existingRecord.recordset[0].count > 0) {
                                        // Updating records
                                        await pool.request()
                                            .input('SKUID', sql.Int, data.SKUID)
                                            .input('SKUName', sql.NVarChar, data.SKUName)
                                            .input('SKUCode', sql.NVarChar, SKUCode)
                                            .input('ISSheetWashRequired', sql.Bit, ISSheetWashRequired)
                                            .input('ReferenceFilename', sql.NVarChar, savePath)
                                            .input('ModifiedBy', sql.Int, Number(palmsid)? Number(palmsid) : 1 )
                                            .input('ModifiedDateTime', sql.DateTime, reUsableFun.getISTDate())
                                            .query(`
                                              UPDATE SSPCSdbo.SKUMaster
                                              SET SKUName = @SKUName,
                                                  SKUCode = @SKUCode,
                                                  ISSheetWashRequired = @ISSheetWashRequired,
                                                  ReferenceFilename = @ReferenceFilename,
                                                  ModifiedBy = @ModifiedBy,
                                                  ModifiedDateTime = @ModifiedDateTime
                                              WHERE SKUID = @SKUID
                                          `);
                                    } else {
                                        // Insert new record
                                        await pool.request()
                                            .input('SKUID', sql.Int, data.SKUID)
                                            .input('SKUName', sql.NVarChar, data.SKUName)
                                            .input('SKUCode', sql.NVarChar, SKUCode)
                                            .input('ISSheetWashRequired', sql.Bit, ISSheetWashRequired)
                                            .input('ReferenceFilename', sql.NVarChar, savePath)
                                            .input('CreatedBy', sql.Int, Number(palmsid)? Number(palmsid) : 1)
                                            .input('CreatedDateTime', sql.DateTime, new Date())
                                            .query(`
                                              INSERT INTO SSPCSdbo.SKUMaster (
                                                  SKUID, SKUName, SKUCode, ISSheetWashRequired,ReferenceFilename, CreatedBy, CreatedDateTime
                                              ) VALUES (
                                                  @SKUID, @SKUName, @SKUCode, @ISSheetWashRequired,@ReferenceFilename, @CreatedBy, @CreatedDateTime
                                              );
                                          `);
                                    }
                                }
                            }
                            // Saving the data in CSV format to the specified path.
                            reUsableFun.SaveJsonToCsvFile(excelData, savePath);
                            res.send(filename + " File uploaded and processed successfully.")
                        }
                    } catch (error) {
                        logger.customerLogger.error(error.message);
                        res.status(500).send('Error processing file.');
                    }
                };
                await insertOrUpdateDataToDb(bodyData, savePath, filename, palmsid);
            });

    } catch (error) {
        logger.customerLogger.error('Unexpected error:', error);
        res.status(500).send('Internal server error');
    }
};