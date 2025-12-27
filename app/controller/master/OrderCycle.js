const sql = require('mssql/msnodesqlv8');
const path = require('path');
const constant = require('../../config/constant');
const logger = require("../../utils/logger");
const reUsableFun = require("../../utils/reUsableFun");
const csv = require('csv-parser');
const { Readable } = require('stream');
const config = require("../../config/dbConfig");
exports.CSVUploadOrderCycle = async (req, res) => {
    // Checking the file availability
    if (!req.file || !req.file.buffer) {
        logger.customerLogger.error(constant.fileNotFound);
        return res.send(constant.fileNotFound);
    }
    let { palmsid } = req.headers;
    // if (!palmsid) {
    //     return res.send("User Logged In Id Not Found");
    // }
    try {
        const filename = req.file.originalname;
        const extension = path.extname(filename).toLowerCase();
        // Validation of the uploaded file extension.
        if (extension !== '.csv') {
            return res.send(constant.inValidFileType);
        }
        // Path to save the uploaded file.
        const savePath = path.join(constant.orderCycle + '/_' + reUsableFun.getFormattedDate() + "_" + filename);
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
                const mandatoryFields = ['LineName', 'OrderCycle', 'Shift', 'StartTime', 'EndTime'];
                const missingFields = mandatoryFields.filter(field => !headers.includes(field));

                if (missingFields.length) {
                    return res.send(`Missing headers: ` + " " + missingFields.join(', ') + constant.missingColumn);
                }

                const bodyData = results.map(el => ({
                    'LineName': el['LineName'],
                    "OrderCycle": el['OrderCycle'],
                    "Shift": el['Shift'],
                    "StartTime": el['StartTime'] ? el['StartTime'].replace(/['"]/g, '') : null,
                    "EndTime": el['EndTime'] ? el['EndTime'].replace(/['"]/g, '') : null,
                    "CreatedBy": 1,
                    "CreatedDateTime": reUsableFun.getISTDate(),
                    "ModifiedBy": 1,
                    "ModifiedDateTime": reUsableFun.getISTDate(),
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

                const pool = await sql.connect(config);
                const ShiftResult = await pool.request()
                    .input('LineName', sql.NVarChar, bodyData[0].LineName)
                    .query(
                        ` WITH SKUCategoryCTE AS ( SELECT DISTINCT SKUCategoryCode FROM SKUCategory ),  
                          ShiftMAppingCTE AS ( SELECT DISTINCT ShiftCode, ShiftID FROM SSPCSdbo.PatternShiftMapping 
                            WHERE LineName = @LineName
                        )
                        SELECT * 
                        FROM SKUCategoryCTE 
                        LEFT JOIN ShiftMAppingCTE ON 1 = 1;
                    `
                    );
                let ShiftList = [], lineNameList = [];
                if (ShiftResult.recordset.length > 0) {
                    ShiftResult.recordset.forEach((el, index) => {
                        ShiftList.push(el.ShiftCode);
                        lineNameList.push(el.SKUCategoryCode);
                    })
                }
                if (!lineNameList.includes(bodyData[0].LineName)) {
                    return res.send("Invalid LineName in row: 2. Expected one of " + lineNameList.join(', ') + constant.checkAndModifyFile);
                }
                ShiftList = [...new Set(ShiftList)];
                // Acceptable data types for each header in a CSV file
                let mandatoryFieldDataTypes = ['string', 'string', 'string', "time", "time"];
                const specificValueChecks = {
                    Shift: ShiftList,
                    LineName: lineNameList
                };
                // Function to validate each row for correct data types, value constraints, and nullability of each column.
                const invalidColumnCheck = await reUsableFun.checkInvalidColumn(bodyData, mandatoryFields, mandatoryFieldDataTypes, specificValueChecks);
                if (invalidColumnCheck) {
                    return res.send(invalidColumnCheck.error + constant.missingColumn);
                }
                lineName = [...new Set(lineName)];
                if (lineName.length > 1) {
                    return res.send("Please provide one LineName per Upload. " + constant.checkAndModifyFile);
                }

                let checkEndTimeIsGreaterThanStartTime = await reUsableFun.EndtimeIsGreaterThanStartTime(bodyData);
                if (checkEndTimeIsGreaterThanStartTime.length > 0) {
                    res.send("In the following row numbers: " + checkEndTimeIsGreaterThanStartTime.join(", ") + "EndTime must be greater than StartTime. " + constant.checkAndModifyFile);
                }
                // checking current start time is overlap with previous order end time
                const checkTimeOverlap = (current, previous) => {
                    if (!current.StartTime || !previous.EndTime) return false;

                    const currentStart = current.StartTime.split(':').map(Number);
                    const previousEnd = previous.EndTime.split(':').map(Number);

                    const currentStartTotalMinutes = currentStart[0] * 60 + currentStart[1];
                    const previousEndTotalMinutes = previousEnd[0] * 60 + previousEnd[1];

                    return currentStartTotalMinutes < previousEndTotalMinutes;
                };

                const InsertOrUpdateDataToDb = async (rowData, savePath, palmsid) => {
                    const pool = await sql.connect(config);
                    const transaction = new sql.Transaction(pool);
                    let ShiftCodeNotAvailable = [], excelData = [], i = 0;
                    for (let data of rowData) {
                        if (data.SKUCategoryCode !== null) {
                            const ShiftFilter = ShiftResult.recordset.filter(category => category.ShiftCode === data.Shift)
                            if (ShiftFilter.length === 0) {
                                ShiftCodeNotAvailable.push(data.Shift);
                            } else {
                                data.ShiftID = ShiftFilter[0].ShiftID;
                                i += 1;
                                excelData.push({ "Sl.No": i, LineName: data.LineName, OrderCycle: data.OrderCycle, Shift: data.Shift, StartTime: data.StartTime, EndTime: data.EndTime })
                            }
                        }
                    }
                    if (ShiftCodeNotAvailable.length > 0) {
                        res.send("these Shift Code values are the not Available in ShiftHeader: " + ShiftCodeNotAvailable.join(",") + constant.checkAndModifyFile);
                    }
                    try {
                        await transaction.begin();

                        for (const [index, data] of rowData.entries()) {
                            const request = new sql.Request(transaction);
                            const previousData = rowData[index - 1];
                            // if (previousData && checkTimeOverlap(data, previousData)) {
                            //     await transaction.rollback();
                            //     return res.send(`Time overlap detected for OrderCycle: ${data.OrderCycle}`);
                            // }
                            // Checking for existing data
                            const existingRecordQuery = `
                            SELECT COUNT(*) AS count
                            FROM SSPCSdbo.OrderCycleMaster
                            WHERE OrderCycle = @OrderCycle AND LineName=@LineName
                    `;
                            request.input('OrderCycle', sql.NVarChar, data.OrderCycle)
                            .input("LineName", sql.NVarChar, data.LineName);
                            const result = await request.query(existingRecordQuery);

                            if (result.recordset[0].count > 0) {
                                // Update existing record
                                const updateQuery = `
                                            UPDATE SSPCSdbo.OrderCycleMaster
                                            SET LineName = @LineName,
                                            ShiftID = @ShiftID,
                                                StartTime = @StartTime,
                                                EndTime = @EndTime,
                                                ReferenceFileName = @ReferenceFileName,
                                                ModifiedBy = @ModifiedBy,
                                                ModifiedDateTime = @ModifiedDateTime
                                            WHERE OrderCycle = @OrderCycle
                                        `;
                               // request.input('LineName', sql.NVarChar, data.LineName);
                                request.input('ShiftID', sql.Int, data.ShiftID);
                                request.input('StartTime', sql.NVarChar, data.StartTime);
                                request.input('EndTime', sql.NVarChar, data.EndTime);
                                request.input('ReferenceFileName', sql.NVarChar, savePath);
                                request.input('ModifiedBy', sql.Int, Number(palmsid)? Number(palmsid) : 1);
                                request.input('ModifiedDateTime', sql.DateTime, data.ModifiedDateTime);

                                await request.query(updateQuery);
                            } else {
                                // Insert new record
                                const insertQuery = `
                                            INSERT INTO SSPCSdbo.OrderCycleMaster (
                                               LineName, OrderCycle, ShiftID, StartTime, EndTime, ReferenceFileName,
                                                CreatedBy, CreatedDateTime
                                            ) VALUES (
                                              @LineName, @OrderCycle, @ShiftID, @StartTime, @EndTime, @ReferenceFileName,
                                                @CreatedBy, @CreatedDateTime
                                            )
                                        `;
                               // request.input('LineName', sql.NVarChar, data.LineName);
                                request.input('ShiftID', sql.Int, data.ShiftID);
                                request.input('StartTime', sql.NVarChar, data.StartTime);
                                request.input('EndTime', sql.NVarChar, data.EndTime);
                                request.input('ReferenceFileName', sql.NVarChar, savePath);
                                request.input('CreatedBy', sql.Int, Number(palmsid)? Number(palmsid) : 1);
                                request.input('CreatedDateTime', sql.DateTime, data.CreatedDateTime);
                                await request.query(insertQuery);
                            }
                        }
                        await transaction.commit();
                        // Saving the data in CSV format to the specified path.
                        reUsableFun.SaveJsonToCsvFile(excelData, savePath)
                        console.log('Data inserted/updated successfully');
                        res.send(filename + constant.successResponse);
                    } catch (error) {
                        await transaction.rollback();
                        logger.customerLogger.error(error.message);
                        return res.send(constant.serverError)
                    }
                };
                await InsertOrUpdateDataToDb(bodyData, savePath, palmsid);
            });
    } catch (error) {
        logger.customerLogger.error('Unexpected error:', error);
        res.status(500).send('Internal server error');
    }
}