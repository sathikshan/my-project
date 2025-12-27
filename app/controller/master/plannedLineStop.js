const sql = require('mssql/msnodesqlv8');
const path = require('path');
const constant = require('../../config/constant');
const logger = require("../../utils/logger");
const reUsableFun = require("../../utils/reUsableFun");
const csv = require('csv-parser');
const { Readable } = require('stream');
const config = require("../../config/dbConfig");
exports.CSVPlannedLineStop = async (req, res) => {
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
        const savePath = path.join(constant.plannedLineStop + '/_' + reUsableFun.getFormattedDate() + "_" + filename);
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
                const mandatoryFields = ['LineName', 'Shift', 'FromDate', 'FromTime', 'ToDate', 'ToTime', 'Reason', 'isActive'];
                const missingFields = mandatoryFields.filter(field => !headers.includes(field));

                if (missingFields.length) {
                    return res.send(`Missing headers: ` + missingFields.join(', ') + " " + constant.missingColumn);
                }

                const bodyData = results.map(el => ({
                    LineName: el['LineName'],
                    Shift: el['Shift'],
                    FromDate: reUsableFun.convertDateDDMMYYtoYYMMDD(el['FromDate']),
                    FromTime: el['FromTime'],
                    ToDate: reUsableFun.convertDateDDMMYYtoYYMMDD(el['ToDate']),
                    ToTime: el['ToTime'],
                    Reason: el['Reason'],
                    isActive: reUsableFun.stringToBoolean(el['isActive'])
                }));
                let lineName = [];
                bodyData.forEach(el => {
                    lineName.push(el.LineName);
                })
                lineName = [...new Set(lineName)];
                // if (lineName.length > 1) {
                //     return res.send("Please enter only one LineName per upload: " + constant.checkAndModifyFile);
                // }
                const pool = await sql.connect(config);
                const SKUCategoryResult = await pool.request()
                    .input('lineName', sql.NVarChar, lineName[0])
                    .query(`
                                 WITH SKUCategoryCTE AS (
                            select DISTINCT SKUCategoryCode,SKUCategoryID FROM SKUCategory 
                            ),  ShiftMAppingCTE AS (
                            SELECT DISTINCT ShiftCode, ShiftID FROM SSPCSdbo.PatternShiftMapping WHERE LineName=@lineName
                            ), shiftHeaderDtl AS ( SELECT ShiftStartTime,ShiftEndTime,ShiftCode as sCode FROM ShiftHeader
							 )
                            SELECT * FROM SKUCategoryCTE,ShiftMAppingCTE AS skuCTE
							JOIN shiftHeaderDtl dtl ON skuCTE.ShiftCode = dtl.sCode;`
                    );
                let SKUCategoryList = [], ShiftList = [], ShiftCideTimeDtl = [], seen = new Set();;
                if (SKUCategoryResult.recordset.length > 0) {
                    SKUCategoryResult.recordset.forEach((el, index) => {
                        SKUCategoryList.push(el.SKUCategoryCode);
                        ShiftList.push(el.ShiftCode);
                        const uniqueKey = `${el.ShiftStartTime}-${el.ShiftEndTime}-${el.ShiftCode}`;
                        if (!seen.has(uniqueKey)) {
                            ShiftCideTimeDtl.push({
                                ShiftStartTime: el.ShiftStartTime,
                                ShiftEndTime: el.ShiftEndTime,
                                ShiftCode: el.ShiftCode
                            })
                            seen.add(uniqueKey);
                        }

                    })
                }
                SKUCategoryList = [...new Set(SKUCategoryList)]
                ShiftList = [...new Set(ShiftList)];
                ShiftCideTimeDtl = [...new Set(ShiftCideTimeDtl)];
                // Acceptable data types for each header in a CSV file
                let mandatoryFieldDataTypes = ['string', 'string', "dateOnly", "time", "dateOnly", "time", "string", "boolean"];
                const specificValueChecks = {
                    LineName: SKUCategoryList,
                    Shift: ShiftList
                };
                // Function to validate each row for correct data types, value constraints, and nullability of each column.
                const invalidColumnCheck = await reUsableFun.checkInvalidColumn(bodyData, mandatoryFields, mandatoryFieldDataTypes, specificValueChecks);
                if (invalidColumnCheck) {
                    return res.send(invalidColumnCheck.error + constant.missingColumn);
                }
                let dateNotValidList = [], toDateNotGreaterThanFromDate = [], duplicateElement = [], nonDuplicateElement = [], ShiftCodeNotValid = [];
                let dublicateData = await reUsableFun.getDuplicateElement(bodyData, ["LineName", "Shift", "FromDate", "FromTime", "ToDate", "ToTime"]);
                if (dublicateData.length > 0) {
                    return res.send(constant.duplicateRecord);
                }
                // Validation for FromDate FromTime, ToDate, ToTime is greate than current date and time 
                for (let i = 0; i < bodyData.length; i++) {
                    let FromDateTime = await reUsableFun.convertDateAndTimeToDateTime(bodyData[i].FromDate, bodyData[i].FromTime);
                    let ToDateTime = await reUsableFun.convertDateAndTimeToDateTime(bodyData[i].ToDate, bodyData[i].ToTime);
                    let newDate = new Date();
                    let newDateDetail = await reUsableFun.convertDateToSerialDateTime(newDate);
                    if (FromDateTime.serialDate < newDateDetail.serialDate) {
                        dateNotValidList.push(`row no ${i + 2} FromDate`);
                    } else if (FromDateTime.serialDate === newDateDetail.serialDate && FromDateTime.timeStrToSec <= newDateDetail.timeStrToSec) {
                        dateNotValidList.push(`row no ${i + 2} FromTime`);
                    }
                    if (ToDateTime.serialDate < newDateDetail.serialDate) {
                        dateNotValidList.push(`row no ${i + 2} ToDate`);
                    } else if (ToDateTime.serialDate === newDateDetail.serialDate && ToDateTime.timeStrToSec <= newDateDetail.timeStrToSec) {
                        dateNotValidList.push(`row no ${i + 2} ToTime`);
                    }
                    if (dateNotValidList.length === 0) {
                        if (ToDateTime.serialDate <= FromDateTime.serialDate && ToDateTime.timeStrToSec <= FromDateTime.timeStrToSec) {
                            toDateNotGreaterThanFromDate.push(`${i + 2}`)
                        }
                    }
                    let isValidShift = await reUsableFun.validateShiftCode(ShiftCideTimeDtl, bodyData[i].FromTime, bodyData[i].Shift);
                    if (!isValidShift) {
                        ShiftCodeNotValid.push("row: " + (i + 2) + " Shift: " + bodyData[i].Shift);
                    }


                }
                let checkDuplicateTimeInRow = reUsableFun.checkTimeOverlap(bodyData);
                if(checkDuplicateTimeInRow){
                    return res.send( checkDuplicateTimeInRow.join(", ") + constant.checkAndModifyFile);
                }
                if (dateNotValidList.length > 0) {
                    return res.send("The specified date must be greater than or equal to the current date, and the time must be greater than the current time. " + dateNotValidList.join(", ") + constant.checkAndModifyFile);
                }
                if (toDateNotGreaterThanFromDate.length > 0) {
                    return res.send("In the following rows, ToDate and ToTime must be greater than FromDate And FromTime: row numbers: " + toDateNotGreaterThanFromDate.join(", ") + constant.checkAndModifyFile);
                }

                if (ShiftCodeNotValid.length > 0) {
                    return res.send("As Per FromTime time Shift is not Valid: row numbers: " + ShiftCodeNotValid.join(", ") + constant.checkAndModifyFile);
                }
                const InsertOrUpdateDataToDb = async (rowData, savePath, filename, palmsid) => {
                    const pool = await sql.connect(config);
                    const excelData = [];
                    let skuCodeNotAvailable = [];
                    let i = 0;
                    for (let data of rowData) {
                        if (data.LineName !== null && data.Shift !== null) {
                            const SKUCategoryFilter = SKUCategoryResult.recordset.filter(category => category.SKUCategoryCode === data.LineName && category.ShiftCode === data.Shift)
                            if (SKUCategoryFilter.length === 0) {
                                skuCodeNotAvailable.push({ Shift: data.Shift, LineName: data.LineName });
                            } else {
                                data.LineID = SKUCategoryFilter[0].SKUCategoryID;
                                data.ShiftID = SKUCategoryFilter[0].ShiftID
                                i += 1;
                                excelData.push({ "Sl.No": i, LineName: data.LineName, Shift: data.Shift, FromDateT: data.FromDate, FromTime: data.FromTime, ToDate: data.ToDate, ToTime: data.ToTime, Reason: data.Reason })
                            }
                        }
                    }
                    if (skuCodeNotAvailable.length > 0) {
                        return res.send("The following LineName or Shift values are not available in the SKUCategory or ShiftHeader tables. " + JSON.stringify(skuCodeNotAvailable) + constant.checkAndModifyFile);
                    }
                    else {
                        for (let data of rowData) {
                            let FromDateTime = await reUsableFun.convertFromDateAndTimeToDateTime(data.FromDate, data.FromTime);
                            let ToDateTime = await reUsableFun.convertFromDateAndTimeToDateTime(data.ToDate, data.ToTime);
                            // Checking for existing record
                            const existingRecord = await pool.request()
                                .input('LineID', sql.Int, data.LineID)
                                .input('ShiftID', sql.Int, data.ShiftID)
                                .input('FromDateTime', sql.DateTime, FromDateTime)
                                .input('ToDateTime', sql.DateTime, ToDateTime)
                                .query(`
                                        SELECT COUNT(*) AS count
                                        FROM SSPCSdbo.PlannedLineStopMaster
                                        WHERE LineID = @LineID
                                        AND ShiftID = @ShiftID
                                        AND FromDateTime = @FromDateTime
                                        AND ToDateTime = @ToDateTime
                        `);
                            if (existingRecord.recordset[0].count > 0) {
                                // Update existing record
                                await pool.request()
                                    .input('LineID', sql.Int, data.LineID)
                                    .input('ShiftID', sql.Int, data.ShiftID)
                                    .input('FromDateTime', sql.DateTime, FromDateTime)
                                    .input('ToDateTime', sql.DateTime, ToDateTime)
                                    .input('ReferenceFilename', sql.NVarChar, savePath)
                                    .input('Reason', sql.NVarChar, data.Reason)
                                    .input('isActive', sql.Bit, data.isActive)
                                    .input('ModifiedBy', sql.Int, Number(palmsid)? Number(palmsid) : 1)
                                    .input('ModifiedDateTime', sql.DateTime, reUsableFun.getISTDate())
                                    .query(`
                                UPDATE SSPCSdbo.PlannedLineStopMaster
                                SET Reason = @Reason,
                                    ModifiedBy = @ModifiedBy,
                                    ModifiedDateTime = @ModifiedDateTime,
                                    ReferenceFilename = @ReferenceFilename,
                                    isActive = @isActive
                                WHERE LineID = @LineID
                                  AND ShiftID = @ShiftID
                                  AND FromDateTime = @FromDateTime
                                  AND ToDateTime = @ToDateTime
                            `);
                            } else {
                                // Insert new record
                                await pool.request()
                                    .input('LineID', sql.Int, data.LineID)
                                    .input('ShiftID', sql.Int, data.ShiftID)
                                    .input('FromDateTime', sql.DateTime, FromDateTime)
                                    .input('ToDateTime', sql.DateTime, ToDateTime)
                                    .input('Reason', sql.NVarChar, data.Reason)
                                    .input('isActive', sql.Bit, data.isActive)
                                    .input('ReferenceFilename', sql.NVarChar, savePath)
                                    .input('CreatedBy', sql.Int,Number(palmsid)? Number(palmsid) : 1)
                                    .input('CreatedDateTime', sql.DateTime, reUsableFun.getISTDate())

                                    .query(`
                                INSERT INTO SSPCSdbo.PlannedLineStopMaster (
                                    LineID, ShiftID, FromDateTime, ToDateTime, Reason, isActive , ReferenceFilename, CreatedBy, CreatedDateTime
                                ) VALUES (
                                    @LineID, @ShiftID, @FromDateTime, @ToDateTime, @Reason, @isActive, @ReferenceFilename, @CreatedBy, @CreatedDateTime
                                )
                            `);
                            }
                        }
                        // Saving the data in CSV format to the specified path.
                        reUsableFun.SaveJsonToCsvFile(excelData, savePath);
                        res.send(filename + constant.successResponse)
                    }
                    //     let operatioTimeDetails = await reUsableFun.getBreakTime(config);
                    //     if (typeof (operatioTimeDetails) === "string") {
                    //         res.send(operatioTimeDetails);
                    //     }
                    //     let operationTime = operatioTimeDetails.operationTime;
                    //     let breakTime = operatioTimeDetails.breakTime;
                    //     breakTime = JSON.stringify(breakTime);
                    //     if (operationTime.length === 0) {
                    //         return res.send("Please Add the Operation time ot the ShiftLine table.")
                    //     }
                    //     // Funtion to get list of plan line stop between EffectiveFrom Date to EffectiveTo Date
                    //     let getPlanLineStopDetails = await reUsableFun.getPlanLineStop(rowData[0].EffectiveFrom, planDateString[planDateString.length - 1], rowData[0].LineName, config);
                    //     if (typeof (getPlanLineStopDetails) === 'string') {
                    //         return res.send(getPlanLineStopDetails);
                    //     }
                };
                await InsertOrUpdateDataToDb(bodyData, savePath, filename, palmsid);
            });

    } catch (error) {
        logger.customerLogger.error('Unexpected error:', error.message);
        res.status(500).send('Internal server error');
    }
};