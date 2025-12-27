const sql = require('mssql/msnodesqlv8');
const XLSX = require('xlsx');
const fs = require("fs");
const { parse } = require('json2csv');
const logger = require("./logger");
const constant = require("../config/constant");
function isDateGreater(dateString) {
    const inputDate = new Date(dateString);
    inputDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inputDate > today;
}
function isDateGreaterOrEqual(dateString) {
    const inputDate = new Date(dateString);
    inputDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inputDate >= today;
}
function getFormattedDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}
function getFormattedDateAndTime(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
function getNoPlanDay(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();
    const getDay = date.getDate()
    const lastDay = new Date(year, month + 1, 0);
    return lastDay.getDate() - getDay + 1;
}
async function isHoliday(date, SKUCategoryCode, config) {
    try {
        const pool = await sql.connect(config);
        date = new Date(date);
        let formatedDate = await getFormattedOnlyDate(date);
        let dateString = formatedDate + "T" + "00:00:00Z"   // 2024-080-20T00:00:00Z
        date.setHours(0, 0, 0, 0);
        const existingRecord = await pool.request()
            .input('EffectiveFromDate', sql.DateTime, dateString)
            .input('SKUCategoryCode', sql.NVarChar, SKUCategoryCode)
            .query(`
                         select  * from Calendar where Date= @EffectiveFromDate AND Line= @SKUCategoryCode AND IsWorking=1;
                      `);

        if (existingRecord.recordset.length === 3) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        logger.customerLogger.error(error.message);
        return error.message;
    }
}
async function getEndTime(loadTime, date, startTime, breakTime, planLineStop) {
    breakTime = JSON.parse(breakTime);
    let obj = extractTimeComponents(startTime);
    date = new Date(date);
    let startDateTime = date.setHours(obj.hours);
    startDateTime = date.setMinutes(obj.minutes);
    startDateTime = date.setSeconds(obj.seconds);
    startDateTime = new Date(startDateTime);
    let patternTime = loadTime;
    const hours = Math.floor(patternTime / 3600);
    const minutes = Math.floor((patternTime % 3600) / 60);
    const secs = patternTime % 60;

    let EndDateTime = startDateTime.setHours(startDateTime.getHours() + hours)
    EndDateTime = startDateTime.setMinutes(startDateTime.getMinutes() + minutes)
    EndDateTime = startDateTime.setSeconds(startDateTime.getSeconds() + secs)
    EndDateTime = new Date(EndDateTime);
    let endHours = EndDateTime.getHours(), endMinutes = EndDateTime.getMinutes(), endSeconds = EndDateTime.getSeconds();
    const formattedHours = String(endHours).padStart(2, '0');
    const formattedMinutes = String(endMinutes).padStart(2, '0');
    const formattedSeconds = String(endSeconds).padStart(2, '0');
    let endTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    let newStartEndTime;
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    let formatedDate = `${year}-${month}-${day}`
    if (planLineStop) {
        let filterData = await planLineStop.filter(el => el.StartDate === formatedDate)
        let planLineStopmArr = [];
        if (filterData.length > 0) {
            await filterData.forEach(el => {
                planLineStopmArr.push({
                    fromSequence: el.StartTime,
                    toSequence: el.EndTime,
                    difference: el.difference
                })
            })
            await breakTime.forEach(el => {
                planLineStopmArr.push(el);
            })

            let planLineStopmArrNew = removeCoveredOrMergeBreakTimeOrPlanLineStop(planLineStopmArr);
            newStartEndTime = await getStartAndEndTime(startTime, endTime, planLineStopmArrNew);
        } else {
            let UpdateBreakTime = await removeCoveredOrMergeBreakTimeOrPlanLineStop(breakTime);
            newStartEndTime = await getStartAndEndTime(startTime, endTime, UpdateBreakTime);
        }
    } else {
        let UpdateBreakTime = await removeCoveredOrMergeBreakTimeOrPlanLineStop(breakTime);
        newStartEndTime = await getStartAndEndTime(startTime, endTime, UpdateBreakTime);
    }
    return newStartEndTime;

}
async function getBreakTime(LineID, config) {
    try {
        const pool = await sql.connect(config);
        const existingRecord = await pool.request()
            .input('LineID', sql.Int, LineID)
            .query(`
                  SELECT * 
                    FROM ShiftLine 
                    WHERE ShiftId IN (
                        SELECT DISTINCT ShiftID 
                        FROM SSPCSdbo.PatternShiftMapping 
                        WHERE LineName = ( SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID=@LineID)
                    ) 
                    ORDER BY ShiftId, OperationStartTime ASC;
                      `);

        if (existingRecord.recordset.length > 0) {
            await existingRecord.recordset.forEach(element => {
                element.ShiftSequence = Number(element.ShiftSequence);
            })
            const parseTime = (timeStr) => { // 05:30:00  Convert to minutes
                const [hours, minutes, seconds] = timeStr.split(':').map(Number);
                return hours * 60 + minutes + (seconds / 60);
            };

            // Function to calculate difference in minutes, accounting for day change
            const calculateTimeDifference = (end, start) => {
                const endInMinutes = parseTime(end);
                const startInMinutes = parseTime(start);
                //  mid night
                if (startInMinutes < endInMinutes) {
                    return (1440 - endInMinutes) + startInMinutes; // 1440 minutes in a day
                }
                return startInMinutes - endInMinutes;
            };

            existingRecord.recordset.sort((a, b) => a.ShiftId - b.ShiftId || a.ShiftSequence - b.ShiftSequence);

            const differences = [];

            for (let i = 0; i < existingRecord.recordset.length - 1; i++) {
                const current = existingRecord.recordset[i];
                const next = existingRecord.recordset[i + 1];

                if (current.ShiftId === next.ShiftId) {
                    const difference = calculateTimeDifference(current.OperationEndTime, next.OperationStartTime);

                    if (difference > 0) {
                        differences.push({
                            fromSequence: current.OperationEndTime,
                            toSequence: next.OperationStartTime,
                            difference: difference
                        });
                    }
                }
            }
            return {
                breakTime: differences,
                operationTime: existingRecord.recordset
            };
        }
    } catch (error) {
        logger.customerLogger.error(error.message);
        return error.message;
    }
}
function extractTimeComponents(timeString) {
    const [hours, minutes, seconds] = timeString.split(':');
    const hourNum = parseInt(hours, 10);
    const minuteNum = parseInt(minutes, 10);
    const secondNum = parseInt(seconds, 10);
    return {
        hours: hourNum,
        minutes: minuteNum,
        seconds: secondNum
    };
}
async function getWorkingDayCount(startDateStr, LineName, config) {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0)
    if (isNaN(startDate.getTime())) {
        throw new Error('Invalid date string.');
    }
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(23, 59, 59, 59.9999)
    let workingDaysCount = 0;
    const pool = await sql.connect(config);
    const existingRecord = await pool.request()
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .input('LineName', sql.NVarChar, LineName)
        .query(`
                  select DISTINCT  Date from Calendar where Date BETWEEN @startDate AND @endDate 
                  AND IsWorking=1 AND Line=@LineName;
              `);

    if (existingRecord.recordset.length > 0) {
        workingDaysCount = existingRecord.recordset.length;
    }
    return workingDaysCount;
}
function excelSerialDateToDate(serialDate) {
    const startDate = new Date(1900, 0, 1);
    const correctedSerialDate = serialDate - 2;
    const jsDate = new Date(startDate.getTime() + correctedSerialDate * 86400000);

    const year = jsDate.getFullYear();
    const month = jsDate.getMonth() + 1;
    const day = jsDate.getDate();
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    return `${year}-${formattedMonth}-${formattedDay}`;
}
function dateToExcelSerial(date) {
    const excelStart = new Date(Date.UTC(1900, 0, 1));
    const diff = Math.floor((date - excelStart) / (24 * 60 * 60 * 1000));
    return Number(diff + 2); // +2 to adjust for Excel's date system and leap year bug
}

function getFormattedOnlyDate(dateToFormat) {
    const date = new Date(dateToFormat);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getFormattedSeperateDateAndTime(dateToFormat) {
    const date = new Date(dateToFormat);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const Sec = String(date.getSeconds()).padStart(2, '0');
    return {
        dateStr: `${year}-${month}-${day}`,
        timeStr: `${hour}:${minutes}:${Sec}`
    };
}

const checkInvalidColumn = async (bodyData, mandatoryFields, mandatoryFieldDataType, specificValueChecks) => {
    const invalidRows = [];
    let reExp = /[^a-zA-Z0-9\s\-\.\_\/]/;
    bodyData.filter((data, index) => {
        const allMandatoryFieldsNull = mandatoryFields.every(field => data[field] === "");
        if (allMandatoryFieldsNull) {
            return false;
        }
        mandatoryFields.forEach((field, fieldIndex) => {
            const expectedType = mandatoryFieldDataType[fieldIndex];
            const value = data[field];
            if (value === '' && expectedType) {
                invalidRows.push({ row: index + 2, field, reason: 'Missing value' });
            }
            else if (expectedType === 'number') {
                if (typeof value !== 'number' || isNaN(value)) {
                    invalidRows.push({ row: index + 2, field, reason: 'missing value or invalid number(expected integer)' });
                } else if (value < 0) {
                    invalidRows.push({ row: index + 2, field, reason: 'expected: positive number' });
                }
            } else if (expectedType === 'integer') {
                if (typeof value !== 'number' || isNaN(value)) {
                    invalidRows.push({ row: index + 2, field, reason: 'missing value or invalid number(expected integer)' });
                } else if (!Number.isInteger(value)) {
                    invalidRows.push({ row: index + 2, field, reason: 'invalid Integer(expected integer)' });
                } else if ((field === "UDTimeInSec" || field === "SDTimeInSec" || field === "MaterialOrderTriggerInSec" || field === "ProductionTriggerInSec") && value === 0) {
                    invalidRows.push({ row: index + 2, field, reason: 'expected: value greater than 0' });
                } else if (value < 0) {
                    invalidRows.push({ row: index + 2, field, reason: 'expected: positive number' });
                }
            } else if (expectedType === "date") {
                let isValid = validateDateTimeFormatInDDMMYYYYHHMM(value);
                if (!isValid) {
                    invalidRows.push({ row: index + 2, field, reason: 'Invalid date string (expected format: "DD-MM-YYYY HH:MM")' });
                }
            } else if (expectedType === "dateOnly") {
                let isValid = validateDateFormatInYYYYMMDD(value);
                if (!isValid) {
                    invalidRows.push({ row: index + 2, field, reason: 'Invalid date string(expected DD-MM-YYYY)' });
                }
            } else if (expectedType === "time") {
                let isValid = validateTimeFormat(value);
                if (!isValid) {
                    invalidRows.push({ row: index + 2, field, reason: 'Invalid time format(expected HH:MM:SS)' });
                }
            } else if (expectedType === "boolean") {
                let valueList = [true, false];
                if (!valueList.includes(value)) {
                    invalidRows.push({ row: index + 2, field, reason: 'Empty or Invalid data(expected true or false)' });
                }
            } else if (expectedType !== 'number' && typeof value !== expectedType) {
                invalidRows.push({ row: index + 2, field, reason: `Invalid data type (expected ${expectedType})` });
            }
            else if (reExp.test(value)) {
                invalidRows.push({ row: index + 2, field, reason: `contains special characters (expected` });
            } else if (specificValueChecks && specificValueChecks[field] !== undefined && !specificValueChecks[field].includes(value)) {
                invalidRows.push({ row: index + 2, field, reason: `Value mismatch (expected one of ${specificValueChecks[field].join(', ')})` });
            }
        });

        return true;
    });

    if (invalidRows.length > 0) {
        const errorDetails = invalidRows.map(err => `Row ${err.row}: ${err.field} (${err.reason})`).join('; ');
        return { error: `Errors found in the following fields: ${errorDetails}` };
    }

    return null;
};
function SaveExcelSheet(dataArray, filePath) {

    try {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dataArray);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, filePath);
    } catch (err) {
        return err.message = 'Error processing file.';
    }
};
function SaveJsonToCsvFile(dataArray, filePath) {
    try {
        const csv = parse(dataArray);
        fs.writeFileSync(filePath, csv);

    } catch (err) {
        return 'Error processing file: ' + err.message;
    }
}
async function getOrderingDate(date, orderTime, materialTriggerInSec, SKUCategoryCode, breakTime, planLineStopDetails, shiftStartTime, config) {
    breakTime = JSON.parse(breakTime);
    let dates = new Date(date);
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    let formatedDate = `${year}-${month}-${day}`
    if (planLineStopDetails) {
        let filterPlannedLineStop = await planLineStopDetails.filter(el => el.StartDate === formatedDate);
        if (filterPlannedLineStop.length > 0) {
            let ShiftTimeInSec = getTimeStringToSec(shiftStartTime);
            let orderTimeInSec = getTimeStringToSec(orderTime);
            let TotalPlannedLineStopTimeInSec = 0, PlannedLineStopOverLap = [], totalOverlapingTime = 0, totalTimeWitoutOverlaping = 0;

            filterPlannedLineStop.forEach(el => {
                let stopStartTimeInSec = getTimeStringToSec(el.StartTime);
                let stopEndTimeInSec = getTimeStringToSec(el.EndTime);
                if (el.difference * 60 < 3600 && stopStartTimeInSec > ShiftTimeInSec && stopStartTimeInSec < orderTimeInSec && stopEndTimeInSec < orderTimeInSec) {
                    TotalPlannedLineStopTimeInSec += el.difference * 60;
                    PlannedLineStopOverLap.push({
                        fromSequence: el.StartTime,
                        toSequence: el.EndTime,
                        difference: el.difference
                    })
                }
            })
            let breakTimeAndPlannedLineStopOverLap = await checkBreakTimeAndPlannedLineStopOverlap(breakTime, PlannedLineStopOverLap);
            breakTimeAndPlannedLineStopOverLap.forEach(el => {
                totalOverlapingTime += el.difference * 60;
            })
            let removeOverlapTime = removeCoveredOrMergeBreakTimeOrPlanLineStop(breakTimeAndPlannedLineStopOverLap);
            removeOverlapTime.forEach(el => {
                totalTimeWitoutOverlaping += el.difference * 60;
            })
            let newOrderTimeInSec = orderTimeInSec - TotalPlannedLineStopTimeInSec + (totalOverlapingTime - totalTimeWitoutOverlaping);
            orderTime = getSecToTimeStr(newOrderTimeInSec);
        }
    }

    let obj = extractTimeComponents(orderTime);
    // Case: Materials Ordering Date and time calculation for Dieset Scheduled for night shift 
    let orderTimeInSec = getTimeStringToSec(orderTime);
    if ( orderTimeInSec < 20700) {
        dates.setDate(dates.getDate() + 1);
    }

    dates.setHours(obj.hours);
    dates.setMinutes(obj.minutes);
    dates.setSeconds(obj.seconds); // 2024-08-29 06:00:00  28800 
    const hours = Math.floor(materialTriggerInSec / 3600); // 8
    const minutes = Math.floor((materialTriggerInSec % 3600) / 60); // 0
    const secs = materialTriggerInSec % 60; // 0
    dates.setHours(dates.getHours() - hours);
    dates.setMinutes(dates.getMinutes() - minutes);
    dates.setSeconds(dates.getSeconds() - secs); // // 2024-08-28 22:00:00
    let newDate = await verifyHoliday(dates, SKUCategoryCode, config);
    newDate = new Date(newDate);
    newDate.setHours(newDate.getHours() + 5);
    newDate.setMinutes(newDate.getMinutes() + 30);
    //newDate.toLocaleString('en-IN', constant.timeZone);
    return newDate;


}
async function checkBreakTimeAndPlannedLineStopOverlap(arr1, arr2) {
    function isOverlapping(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
    }
    let result = [];
    result.push(...arr2);
    await arr1.forEach(item1 => {
        arr2.forEach(item2 => {
            if (isOverlapping(item1.fromSequence, item1.toSequence, item2.fromSequence, item2.toSequence)) {
                result.push(item1);
            }
        });
    });
    return result;
    // return result.filter((value, index, self) =>
    //     index === self.findIndex((t) => (
    //         t.fromSequence === value.fromSequence && t.toSequence === value.toSequence
    //     ))
    // );
}
async function getOrderCycleID(date, LineName, config) {
    try {
        const pool = await sql.connect(config);
        date = new Date(date);
        date.setHours(date.getHours() - 5);
        date.setMinutes(date.getMinutes() - 30);
        // date.toLocaleString('en-IN', constant.timeZone);
        const formattedHours = String(date.getHours()).padStart(2, '0');
        const formattedMinutes = String(date.getMinutes()).padStart(2, '0');
        const formattedSeconds = String(date.getSeconds()).padStart(2, '0');
        let orderTimeFormat = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
        let OrderCycleID = 0;
        let obj = await extractTimeComponents(orderTimeFormat);
        if ((obj.hours === 22 && obj.minutes >= 50) || obj.hours === 23) {
            const existingRecord = await pool.request()
                .input('orderTimeFormat', sql.VarChar, orderTimeFormat)
                .input('LineName', sql.NVarChar, LineName)
                .query(`
                          SELECT TOP(1) * FROM SSPCSdbo.OrderCycleMaster WHERE (@orderTimeFormat BETWEEN StartTime AND EndTime OR @orderTimeFormat > EndTime)  AND LineName =@LineName order by StartTime  asc
                      `);
            //SELECT OrderCycleID FROM SSPCSdbo.OrderCycleMaster WHERE LineName=@LineName AND ((StartTime < EndTime AND @orderTimeFormat BETWEEN StartTime AND EndTime) OR (StartTime > EndTime AND (@orderTimeFormat BETWEEN StartTime AND '23:59:59' OR @orderTimeFormat BETWEEN '00:00:00' AND EndTime)));
            if (existingRecord.recordset.length > 0) {
                return OrderCycleID = existingRecord.recordset[0].OrderCycleID
            }
        } else {
            const existingRecord = await pool.request()
                .input('orderTimeFormat', sql.VarChar, orderTimeFormat)
                .input('LineName', sql.NVarChar, LineName)
                .query(`
                          SELECT TOP(1) * FROM SSPCSdbo.OrderCycleMaster WHERE (@orderTimeFormat BETWEEN StartTime AND EndTime OR @orderTimeFormat < EndTime) AND LineName=@LineName order by StartTime  asc
                      `);
            if (existingRecord.recordset.length > 0) {
                return OrderCycleID = existingRecord.recordset[0].OrderCycleID
            }
        }

    } catch (error) {
        logger.customerLogger.error(error.message);
        return error.message;
    }
}
async function getStartAndEndTime(startTime, endTime, records) {
    const parseTime = (timeStr) => {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return hours * 60 + minutes + (seconds / 60); // Convert to minutes
    };
    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const secs = Math.round((minutes - Math.floor(minutes)) * 60);
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const getForMattedAdjustedTime = (adjustedStartTime, adjustedEndTime) => {
        if (adjustedEndTime < 0) {
            adjustedEndTime += 24 * 60; // Add 24 hours in minutes
        } else if (adjustedEndTime >= 24 * 60) {
            adjustedEndTime -= 24 * 60; // Subtract 24 hours in minutes
        }

        let newStartTime = formatTime(adjustedStartTime);
        let newEndTime = formatTime(adjustedEndTime);
        return {
            newStartTime: newStartTime,
            newEndTime: newEndTime
        }
    }

    const RemoveCurrentBreak = (breakTime, breakToRemove) => {
        let filtereData = breakTime.filter(el => el.fromSequence !== breakToRemove.fromSequence && el.toSequence !== breakToRemove.toSequence);
        return filtereData;
    }

    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    let adjustedStartTime = "";
    let adjustedEndTime = "";
    let newStartTimes = startTime;
    let newEndTimes = endTime;

    for (const record of records) {
        const fromMinutes = parseTime(record.fromSequence);
        const toMinutes = parseTime(record.toSequence);
        const difference = record.difference;

        const spansMidnight = toMinutes < fromMinutes;

        if (spansMidnight) {
            if (startMinutes >= fromMinutes || startMinutes < toMinutes) {
                adjustedStartTime = toMinutes;
                adjustedEndTime = toMinutes + (endMinutes - startMinutes);
                let newTimeDetails = await getForMattedAdjustedTime(adjustedStartTime, adjustedEndTime);
                let newBreakTime = await RemoveCurrentBreak(records, record);
                if (newBreakTime.length > 0) {
                    return await getStartAndEndTime(newTimeDetails.newStartTime, newTimeDetails.newEndTime, newBreakTime);
                } else {
                    newStartTimes = newTimeDetails.newStartTime;
                    newEndTimes = newTimeDetails.newEndTime;
                    break;
                }
            }
        } else {
            if (startMinutes >= fromMinutes && startMinutes < toMinutes) {
                adjustedStartTime = toMinutes;
                adjustedEndTime = toMinutes + (endMinutes - startMinutes);
                let newTimeDetails = await getForMattedAdjustedTime(adjustedStartTime, adjustedEndTime);
                let newBreakTime = await RemoveCurrentBreak(records, record);
                if (newBreakTime.length > 0) {
                    return await getStartAndEndTime(newTimeDetails.newStartTime, newTimeDetails.newEndTime, newBreakTime);
                } else {
                    newStartTimes = newTimeDetails.newStartTime;
                    newEndTimes = newTimeDetails.newEndTime;
                    break;
                }
            }
        }

        if (spansMidnight) {
            if (endMinutes >= fromMinutes || endMinutes < toMinutes) {
                adjustedEndTime = toMinutes + (endMinutes - fromMinutes);
                adjustedStartTime = startMinutes;
                let newTimeDetails = await getForMattedAdjustedTime(adjustedStartTime, adjustedEndTime);
                let newBreakTime = await RemoveCurrentBreak(records, record);
                if (newBreakTime.length > 0) {
                    return await getStartAndEndTime(newTimeDetails.newStartTime, newTimeDetails.newEndTime, newBreakTime);
                } else {
                    newStartTimes = newTimeDetails.newStartTime;
                    newEndTimes = newTimeDetails.newEndTime;
                    break;
                }
            }
        } else {
            if (endMinutes >= fromMinutes && endMinutes < toMinutes) {
                adjustedEndTime = toMinutes + (endMinutes - fromMinutes);
                adjustedStartTime = startMinutes;
                let newTimeDetails = await getForMattedAdjustedTime(adjustedStartTime, adjustedEndTime);
                let newBreakTime = await RemoveCurrentBreak(records, record);
                if (newBreakTime.length > 0) {
                    return await getStartAndEndTime(newTimeDetails.newStartTime, newTimeDetails.newEndTime, newBreakTime);
                } else {
                    newStartTimes = newTimeDetails.newStartTime;
                    newEndTimes = newTimeDetails.newEndTime;
                    break;
                }
            }
        }

        if ((startMinutes <= fromMinutes && endMinutes >= toMinutes) && (startMinutes <= fromMinutes && endMinutes >= toMinutes)) {
            adjustedEndTime = endMinutes + (toMinutes - fromMinutes);
            adjustedStartTime = startMinutes;
            let newTimeDetails = await getForMattedAdjustedTime(adjustedStartTime, adjustedEndTime);
            let newBreakTime = await RemoveCurrentBreak(records, record);
            if (newBreakTime.length > 0) {
                return await getStartAndEndTime(newTimeDetails.newStartTime, newTimeDetails.newEndTime, newBreakTime);
            } else {
                newStartTimes = newTimeDetails.newStartTime;
                newEndTimes = newTimeDetails.newEndTime;
                break;
            }
        }
    }

    // if (adjustedEndTime < 0) {
    //     adjustedEndTime += 24 * 60; // Add 24 hours in minutes
    // } else if (adjustedEndTime >= 24 * 60) {
    //     adjustedEndTime -= 24 * 60; // Subtract 24 hours in minutes
    // }

    // const newStartTime = formatTime(adjustedStartTime);
    // const newEndTime = formatTime(adjustedEndTime);

    // return getStartAndEndTime(newStartTime, newEndTime, records)
    return {
        newStartTime: newStartTimes,
        newEndTime: newEndTimes
    }

}
async function verifyHoliday(date, SKUCategoryCode, config) {
    let dateHolidate = await isHoliday(date, SKUCategoryCode, config);
    if (dateHolidate) {
        date.setDate(date.getDate() - 1);
        await verifyHoliday(date, SKUCategoryCode, config)
    }
    return date;
}
function convertDateDDMMYYtoYYMMDD(dateStr) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
}
function getISTDate() {
    const nowUTC = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // in milliseconds
    const nowIST = new Date(nowUTC.getTime() + offset);
    return nowIST;
}
function getIstDateFromUniversalDate(dateString) {
    const nowUTC = new Date(dateString);
    const offset = 5.5 * 60 * 60 * 1000; // in milliseconds
    const nowIST = new Date(nowUTC.getTime() + offset);
    return nowIST;
}
async function IsValidDate(dateString) {
    let date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}
const validateAndParseDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return false;
    }

    return true;
};
const validateDateFormatInDDMMYYYY = (dateString) => {
    const formatRegex = /^([0-2][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    if (!formatRegex.test(dateString)) return 'Invalid Format';
    const [day, month, year] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return true;
    }
    return false;
};

const validateDateFormatInYYYYMMDD = (dateString) => {
    const yyyymmddRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[01])$/;
    if (yyyymmddRegex.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            return true;
        }
        return false;
    }

    return false;
};
const validateDateTimeFormatInYYYYMMDDHHMM = (dateTimeString) => {
    // Regex for the format YYYY-MM-DD HH:MM
    const yyyymmddhhmmRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[01]) (0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;

    if (yyyymmddhhmmRegex.test(dateTimeString)) {
        const [datePart, timePart] = dateTimeString.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);

        const date = new Date(year, month - 1, day, hour, minute);
        if (date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            date.getHours() === hour &&
            date.getMinutes() === minute) {
            return true;
        }
    }

    return false;
};
const validateTimeFormat = (timeString) => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(timeString)) return false;
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
        return true;
    }
    return false;
};
const stringToBoolean = (str) => {
    const normalizedStr = str.trim().toLowerCase();
    if (normalizedStr === 'true') {
        return true;
    } else if (normalizedStr === 'false') {
        return false;
    } else {
        return 'NotValid';
    }
};
const findDuplicateColumn = (array, key) => {
    const seen = new Set();
    const duplicates = new Set();
    array.forEach(item => {
        const value = item[key];
        if (seen.has(value)) {
            duplicates.add(value);
        } else {
            seen.add(value);
        }
    });

    return Array.from(duplicates);
};
function parseDate(dateStr) {
    const [dateString, time] = dateStr.split(" ");
    const [day, month, year] = dateString.split("-")
    const [hour, minute] = time.split(':');
    return new Date(year, month - 1, day, hour, minute);
}
const validateDateTimeFormatInDDMMYYYYHHMM = (dateTimeString) => {
    const ddmmyyyyhhmmRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4}) (0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;

    if (ddmmyyyyhhmmRegex.test(dateTimeString)) {
        const [datePart, timePart] = dateTimeString.split(' ');
        const [day, month, year] = datePart.split('-').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);
        const date = new Date(year, month - 1, day, hour, minute);
        if (date.getDate() === day &&
            date.getMonth() === month - 1 &&
            date.getFullYear() === year &&
            date.getHours() === hour &&
            date.getMinutes() === minute) {
            return true;
        }
    }

    return false;
};
function getDuplicateElement(dataArray, elementArray) {
    const createKey = (obj, keys) => keys.map(key => obj[key]).join('|');
    const seen = new Set();
    const duplicates = new Set();
    dataArray.forEach(item => {
        const key = createKey(item, elementArray);
        if (seen.has(key)) {
            duplicates.add(key);
        } else {
            seen.add(key);
        }
    });

    const duplicateItems = dataArray.filter(item => {
        const key = createKey(item, elementArray);
        return duplicates.has(key);
    });
    return duplicateItems;
}
async function EndtimeIsGreaterThanStartTime(dataArray) {
    let invalidStartAndEndTime = [];
    await dataArray.forEach((el, index) => {
        let obj1 = extractTimeComponents(el.StartTime);
        let obj2 = extractTimeComponents(el.EndTime);
        let StartSeconds = obj1.hours * 3600 + obj1.minutes * 60 + obj1.seconds;
        let EndtSeconds = obj2.hours * 3600 + obj2.minutes * 60 + obj2.seconds;
        if (EndtSeconds <= StartSeconds) {
            invalidStartAndEndTime.push(`${index + 2}`)
        }
    })
    return invalidStartAndEndTime;

}
async function getPlanLineStop(startDate, EndDate, SKUCategory, config) {
    try {
        let result = [];
        startDate = new Date(startDate);
        startDate.setHours(0, 0, 0, 0);
        // startDate = getFormattedDateAndTime(startDate);
        EndDate = new Date(startDate);
        EndDate.setDate(EndDate.getDate() + 1);
        EndDate.setHours(11, 0, 0, 0.000)
        // EndDate = getFormattedDateAndTime(EndDate);

        // startDate = startDate + ' 00:00:00.000';
        // EndDate = '2025-03-27 05:30:59.999'

        const pool = await sql.connect(config);
        const existingRecord = await pool.request()
            .input("startDate", sql.DateTime, startDate)
            .input("EndDate", sql.DateTime, EndDate)
            .input("SKUCategory", sql.NVarChar, SKUCategory)
            .query(`
                  SELECT p.*, sh.ShiftCode
                    FROM SSPCSdbo.PlannedLineStopMaster p
                    JOIN ShiftHeader sh ON p.ShiftID = sh.ShiftID
                    WHERE  p.IsActive = 1 AND p.FromDateTime BETWEEN @startDate AND @EndDate
                    AND p.LineID = (SELECT SKUCategoryID FROM SKUCategory WHERE SKUCategoryCode = @SKUCategory);
                      `);

        if (existingRecord.recordset.length > 0) {
            const formatDate = (date) => {
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
                const day = String(date.getUTCDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const formatTime = (date) => {
                const hours = String(date.getUTCHours()).padStart(2, '0');
                const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                const seconds = String(date.getUTCSeconds()).padStart(2, '0');
                return `${hours}:${minutes}:${seconds}`;
            };
            existingRecord.recordset.forEach((el, index) => {
                const date1 = new Date(el.FromDateTime);
                const date2 = new Date(el.ToDateTime);
                result.push({
                    StartDate: formatDate(date1),
                    StartTime: formatTime(date1),
                    EndDate: formatDate(date2),
                    EndTime: formatTime(date2),
                    difference: (date2 - date1) / 60000 // 60 * 1000 => milli sec to min
                })
            })
            return result;
        }
    } catch (error) {
        logger.customerLogger.error(error.message);
        return error.message;
    }
}

async function handleHoliday(date, SKUCategoryCode, config, date1) {
    let holiday = await isHoliday(date, SKUCategoryCode, config);

    if (typeof holiday === 'string') {
        throw new Error(holiday);
    } else if (holiday) {
        date.setDate(date.getDate() + 1);
        date.setHours(5, 30, 0, 0);
        await handleHoliday(date, SKUCategoryCode, config, date1);
    } else {
        date.setHours(11, 30, 0, 0);
        date1.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
}

function removeCoveredBreakTimeOrPlanLineStop(intervals) {
    // Convert time strings to Date objects
    function parseTimeValue(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return new Date(0, 0, 0, hours, minutes, seconds);
    }

    function formatTimeValue(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function isCovered(start1, end1, start2, end2) {
        return start1 <= start2 && end1 >= end2;
    }

    // Convert time strings to Date objects
    intervals.forEach(interval => {
        interval.fromSequence = parseTimeValue(interval.fromSequence);
        interval.toSequence = parseTimeValue(interval.toSequence);
    });

    // Sort intervals by 'fromSequence'
    intervals.sort((a, b) => a.fromSequence - b.fromSequence);

    const result = [];

    for (let i = 0; i < intervals.length; i++) {
        let isCoveredByOther = false;
        for (let j = 0; j < intervals.length; j++) {
            if (i !== j) {
                if (isCovered(intervals[j].fromSequence, intervals[j].toSequence,
                    intervals[i].fromSequence, intervals[i].toSequence)) {
                    isCoveredByOther = true;
                    break;
                }
            }
        }
        if (!isCoveredByOther) {
            result.push(intervals[i]);
        }
    }

    // Convert Date objects back to time strings
    result.forEach(interval => {
        interval.fromSequence = formatTimeValue(interval.fromSequence);
        interval.toSequence = formatTimeValue(interval.toSequence);
    });

    return result;
}
function removeCoveredOrMergeBreakTimeOrPlanLineStop(intervals) {
    function parseTimeValue(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return new Date(0, 0, 0, hours, minutes, seconds);
    }

    function formatTimeValue(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function isCovered(start1, end1, start2, end2) {
        return start1 <= start2 && end1 >= end2;
    }

    function calculateDifference(start, end) {
        return (end - start) / 60000; // Difference in minutes
    }

    function mergeIntervals(intervals) {
        const merged = [];
        intervals.forEach(interval => {
            if (merged.length === 0) {
                merged.push(interval);
                return;
            }
            const last = merged[merged.length - 1];
            if (last.toSequence >= interval.fromSequence) {
                last.toSequence = new Date(Math.max(last.toSequence.getTime(), interval.toSequence.getTime()));
            } else {
                merged.push(interval);
            }
        });
        return merged;
    }

    // Convert time strings to Date objects
    intervals.forEach(interval => {
        interval.fromSequence = parseTimeValue(interval.fromSequence);
        interval.toSequence = parseTimeValue(interval.toSequence);
    });

    // Sort intervals by start time
    intervals.sort((a, b) => a.fromSequence - b.fromSequence);

    // Merge overlapping intervals
    const mergedIntervals = mergeIntervals(intervals);

    // Remove covered intervals and update differences
    const result = [];
    for (let i = 0; i < mergedIntervals.length; i++) {
        let isCoveredByOther = false;
        for (let j = 0; j < mergedIntervals.length; j++) {
            if (i !== j) {
                if (isCovered(mergedIntervals[j].fromSequence, mergedIntervals[j].toSequence,
                    mergedIntervals[i].fromSequence, mergedIntervals[i].toSequence)) {
                    isCoveredByOther = true;
                    break;
                }
            }
        }
        if (!isCoveredByOther) {
            mergedIntervals[i].difference = calculateDifference(mergedIntervals[i].fromSequence, mergedIntervals[i].toSequence);
            result.push(mergedIntervals[i]);
        }
    }

    // Convert Date objects back to time strings
    result.forEach(interval => {
        interval.fromSequence = formatTimeValue(interval.fromSequence);
        interval.toSequence = formatTimeValue(interval.toSequence);
    });

    return result;
}

async function getNextWorkngDay(dateStr, LineName, config) {
    let date = new Date(dateStr); // Create a new Date object from the string to avoid mutation issues
    let isHolidayFlag = await isHoliday(date, LineName, config);

    while (isHolidayFlag) {
        // Increment the date by one day
        date.setDate(date.getDate() + 1);
        isHolidayFlag = await isHoliday(date, LineName, config);
    }

    let formattedDate = await getFormattedOnlyDate(date); // Format the date (assuming YYYY-MM-DD)
    return formattedDate; // Return the next working day
}

async function getPrevWorkngDay(dateStr, LineName, config) {
    let date = new Date(dateStr);
    let isHolidayFlag = await isHoliday(date, LineName, config);

    // Loop until we find a working day (not a holiday)
    while (isHolidayFlag) {
        // Decrement the date by one day
        date.setDate(date.getDate() - 1);
        isHolidayFlag = await isHoliday(date, LineName, config);
    }

    let formattedDate = await getFormattedOnlyDate(date); // Format the date (assuming YYYY-MM-DD)
    return formattedDate; // Return the previous working day
}

async function convertDateAndTimeToDateTime(dateStr, timeStr) {
    const date = new Date(dateStr);
    const timeObj = extractTimeComponents(timeStr);
    const serialDate = dateToExcelSerial(date);
    let timeStrToSec = timeObj.hours * 3600 + timeObj.minutes * 60 + timeObj.seconds;
    return {
        serialDate: serialDate,
        timeStrToSec: timeStrToSec
    };
}
async function convertDateToSerialDateTime(dateStr) {
    const date = new Date(dateStr);
    let hour = date.getHours();
    let minute = date.getMinutes();
    let seconds = date.getSeconds();
    const serialDate = dateToExcelSerial(date);
    let timeStrToSec = hour * 3600 + minute * 60 + seconds;
    return {
        serialDate: serialDate,
        timeStrToSec: timeStrToSec
    };
}
async function convertFromDateAndTimeToDateTime(dateStr, timeStr) {
    let date = new Date(dateStr);
    const timeObj = extractTimeComponents(timeStr);
    date.setHours(timeObj.hours + 5, timeObj.minutes + 30, timeObj.seconds, 0);
    return date;
}
function formatDateToISO() {

    const date = new Date('en-IN', { timeZone: 'Asia/Kolkata' });
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}
function ReArrangeArrBasedOnPatternNo(bodyData, patternNo) {
    const indicesToMove = bodyData
        .map((subArray, index) => {
            return subArray.some(item => item.PatternNo === patternNo) ? index : null;
        })
        .filter(index => index !== null);
    if (indicesToMove.length === 0) {
        return bodyData;
    }
    const startIndex = indicesToMove[0];
    if (startIndex < 0 || startIndex >= bodyData.length) {
        throw new Error('Invalid startIndex');
    }
    const part1 = bodyData.slice(startIndex);
    const part2 = bodyData.slice(0, startIndex);
    return part1.concat(part2);
}
function getTimeStringToSec(timeStr) {
    let obj = extractTimeComponents(timeStr);
    return obj.hours * 3600 + obj.minutes * 60 + obj.seconds;
}
function getSecToTimeStr(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let sec = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
function checkDuplicatesAndSerialPartSeq(arr) {
    const groupedByPattern = arr.reduce((acc, curr) => {
        if (!acc[curr.PatternNo]) {
            acc[curr.PatternNo] = [];
        }
        acc[curr.PatternNo].push(curr);
        return acc;
    }, {});
    // Check for duplicates and serial order in each group
    let result = [];
    for (const pattern in groupedByPattern) {
        // Sort by PartSeq
        const sortedGroup = groupedByPattern[pattern].sort((a, b) => a.PartSeq - b.PartSeq);

        let hasDuplicate = false;
        let isSerial = true;

        for (let i = 0; i < sortedGroup.length; i++) {
            // Check for duplicates (same PartSeq appearing more than once)
            if (i > 0 && sortedGroup[i].PartSeq === sortedGroup[i - 1].PartSeq) {
                hasDuplicate = true;
            }
            // Check if PartSeq is in serial order
            if (i > 0 && sortedGroup[i].PartSeq !== sortedGroup[i - 1].PartSeq + 1) {
                isSerial = false;
            }
        }
        if (hasDuplicate || !isSerial) {
            result.push({
                PatternNo: pattern,
                hasDuplicate,
                isSerial
            });
        }
    }
    return result;
}
async function getShiftDetailsByLineName(LineID, config) {
    const pool = await sql.connect(config);
    const existingRecord = await pool.request()
        .input('LineID', sql.Int, LineID)
        .query(`
                 select ShiftId,ShiftCode, ShiftStartTime,ShiftEndTime from ShiftHeader where 
                 ShiftId in (select DISTINCT ShiftID from SSPCSdbo.PatternShiftMapping
                 where LineName=(SELECT SKUCategoryCode from SKUCategory where SKUCategoryID=@LineID)) order by ShiftStartTime;
              `);
    return existingRecord.recordset;
}

async function checkHolidyForEntirePlan(date, noOfDayPlan, NoOfWorkingDay, LineName, config) {
    const startDate =
        new Date(date);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    let endDate;
    if (noOfDayPlan === 0) {
        endDate = startDate
    } else {
        endDate = new Date(year, month + 1, 0);
    }
    endDate.setHours(23, 59, 59, 59.9999);
    let endDay = endDate.getDate(), holidayCount = 0;
    endDate.setDate(endDay + noOfDayPlan - NoOfWorkingDay);
    for (let i = 0; i < 10; i++) {
        let isValid = await isHoliday(endDate, LineName, config);
        if (isValid) {
            holidayCount += 1;
            endDate.setDate(endDate.getDate() + 1)
        } else {
            break;
        }
    }

    if (holidayCount === 10) {
        return "According to the calendar, the required number of working days for this plan is not found between the planned dates " + startDate + endDate + ". Please update the 'Calendar' table to proceed with the upload.";
    }
    return true;
}

async function getCurrentShiftDetails(currTime, LineId, config) {
    const pool = await sql.connect(config);
    const existingRecord = await pool.request()
        .input('currTime', sql.NVarChar, currTime)
        .input("LineId", sql.Int, LineId)
        .query(`
                 WITH ShiftDetails AS (  SELECT ShiftId, ShiftName, ShiftCode, ShiftStartTime, ShiftEndTime FROM ShiftHeader WHERE ShiftId IN (
        SELECT DISTINCT ShiftId FROM SSPCSdbo.PatternShiftMapping WHERE LineName = ( SELECT SKUCategoryCode  FROM SKUCategory WHERE SKUCategoryID = @LineId ) )
    AND (
        -- Case when ShiftStartTime is less than ShiftEndTime (does not cross midnight)
        (@currTime >= ShiftStartTime AND @currTime <= ShiftEndTime) 
        OR 
        -- Case when ShiftStartTime is greater than ShiftEndTime (crosses midnight)
        (ShiftStartTime > ShiftEndTime AND (@currTime >= ShiftStartTime OR @currTime <= ShiftEndTime))
    )
    ), 
    LineDetails AS ( SELECT LineID, LineName  FROM SSPCSdbo.LineEfficencyMaster  WHERE LineID = @LineId)
    SELECT * FROM ShiftDetails, LineDetails;
              `);
    return existingRecord.recordset[0];
}

async function getBOMTypeDetails(bomTypeId, config) {
    try {
        const pool = await sql.connect(config);

        const bomTypeQuery = `
            SELECT [DieSet], [DieStorageBay] 
            FROM [SSPCSdbo].[BOMTypeMaster] 
            WHERE [DieSetID] = @bomTypeId`;

        const bomTypeResult = await pool.request()
            .input('bomTypeId', sql.Int, bomTypeId)
            .query(bomTypeQuery);

        const bomType = bomTypeResult.recordset[0]?.DieSet || 'Unknown BOMType';
        const dieStorageBay = bomTypeResult.recordset[0]?.DieStorageBay || 'Unknown DieStorageBay';

        return { bomType, dieStorageBay };
    } catch (error) {
        console.error('Error fetching BOMType details:', error);
        throw error;
    }
}
async function getRowColorsByStatus(status) {
    let rowColor = "#fff";
    let statusTextColor = "#000";
    let statusTextBgColor = "#e9e8eb";

    switch (ActionTypesReverse[status]) {
        case 'Queued':
            rowColor = "#DFEFFF";
            statusTextColor = "#000";
            statusTextBgColor = "#B7DBFF";
            break;
        case 'Skipped':
            rowColor = "#fff";
            statusTextColor = "#d90429";
            statusTextBgColor = "#fcfafa";
            break;
        case 'Completed':
            rowColor = "#DDF6DE";
            statusTextColor = "#000";
            statusTextBgColor = "#A6E8A8";
            break;
        case 'In Progress':
            rowColor = "#FDFFE6";
            statusTextColor = "#000";
            statusTextBgColor = "#F8FFAD";
            break;
        case 'Discontinued':
            rowColor = "#E6E6E6";
            statusTextColor = "#000";
            statusTextBgColor = "#e9e8eb";
            break;
        case 'Planned':
            rowColor = "#fff",
                statusTextColor = "#000",
                statusTextBgColor = "#e9e8eb";
            break;
        case 'Carry Over':
            rowColor = "#caedca";
            statusTextColor = "#000";
            statusTextBgColor = "#A6E8A8";
            break;
        default:
            rowColor = "#fff";
            statusTextColor = "#000";
            statusTextBgColor = "#e9e8eb";
    }

    return { rowColor, statusTextColor, statusTextBgColor };
}
async function getShiftAndSKUCategory(shift, line, config) {
    const pool = await sql.connect(config);
    try {
        const combinedQuery = `
            SELECT s.[ShiftName], sk.[SKUCategoryCode]
            FROM [dbo].[ShiftHeader] s 
            CROSS JOIN [dbo].[SKUCategory] sk
            WHERE s.[ShiftId] = @shift 
              AND sk.[SKUCategoryID] = @line
        `;

        const result = await pool.request()
            .input('shift', sql.Int, shift)
            .input('line', sql.Int, line)
            .query(combinedQuery);

        // Extract the values
        const shiftName = result.recordset[0]?.ShiftName || 'Unknown Shift';
        const skuCategoryCode = result.recordset[0]?.SKUCategoryCode || 'Unknown Line';

        return { shiftName, skuCategoryCode };
    } catch (error) {
        console.error('Error fetching Shift Name and SKU Category Code:', error);
        throw new Error('Failed to fetch Shift Name and SKU Category Code');
    }
}

const ActionTypes = Object.freeze({
    'To be Scheduled': 1,
    'Queued': 2,
    'Skipped': 3,
    'In Progress': 4,
    'Discontinued': 5,
    'Completed': 6,
    'Planned': 7,
    'Carry Over': 8
});
const ActionTypesReverse = Object.freeze(
    Object.keys(ActionTypes).reduce((acc, key) => {
        acc[ActionTypes[key]] = key;
        return acc;
    }, {})
);
async function getQPC(bomType, config) {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('bomType', sql.VarChar, bomType)
            .query(`
                SELECT CASE  WHEN spm.Quantity IS NOT NULL THEN spm.Quantity  ELSE NULL 
    END AS Quantity
    FROM KitBOM kb
    LEFT JOIN SKUPackMapping spm 
        ON kb.KitItemID = spm.SKUID
        AND spm.IsDefault = 1 
        AND spm.Quantity > 0
    WHERE kb.BOMType = @bomType;
                `);
        const quantity = result.recordset[0]?.Quantity;
        // if (!quantity) {
        //     throw new Error('No Quantity found for the provided BOMType');
        // }

        // Return the Quantity
        return quantity;

    } catch (error) {
        console.log('QPC', bomType);
        console.error('Error fetching quantity by BOM type:', error);
        return error.message;
    }
}

async function getShiftGroupName(shift, currentDate, line, config) {
    try {

        const { shiftName, skuCategoryCode } = await reUsableFun.getShiftAndSKUCategory(shift, line, config)
        console.log('From getShiftGroupName', shiftName, skuCategoryCode);

        const pool = await sql.connect(config);
        const query = `
            SELECT TOP 1 sg.[ShiftGroupName]
            FROM [dbo].[Calendar] c
            JOIN [dbo].[ShiftGroup] sg ON c.[ShiftGroupId] = sg.[ShiftGroupId]
            WHERE c.[ShiftID] = @shift
            AND CAST(c.[Date] AS DATE) = @currentDate 
            AND c.[Line] = @skuCategoryCode;
        `;

        const result = await pool.request()
            .input('shift', sql.Int, shift)
            .input('currentDate', sql.Date, currentDate)
            .input('skuCategoryCode', sql.VarChar, skuCategoryCode)
            .query(query);

        const shiftGroupName = result.recordset[0]?.ShiftGroupName || 'Unknown Shift Group';

        // Determine shiftCellColor based on shiftGroupName
        let shiftCellColor;
        switch (shiftGroupName) {
            case 'Yellow':
                shiftCellColor = "#ffd60a";
                break;
            case 'N_Orange':
                shiftCellColor = "#faa550";
                break;
            case 'N_White':
                shiftCellColor = "#fff";
                break;
            case 'N_Yellow':
                shiftCellColor = "#ffd60a";
                break;
            case 'White':
                shiftCellColor = "#fff";
                break;
            case 'Blue':
                shiftCellColor = "#d5f0f5";
                break;
            case 'Orange':
                shiftCellColor = '#faa550';
                break;
            default:
                shiftCellColor = "#0d0d0d"; // Default color or any other color for unknown cases
        }

        // Return both shiftGroupName and shiftCellColor
        return { shiftGroupName, shiftCellColor };
    } catch (error) {
        console.error('Error fetching Shift Group Name:', error);
        throw new Error('Failed to fetch Shift Group Name');
    }
}

async function getShiftId(shiftCode, config) {
    const pool = await sql.connect(config);
    const shiftIdQuery = `
          SELECT ShiftId 
          FROM [dbo].[ShiftHeader] 
          WHERE ShiftCode = @shiftCode;
      `;
    const shiftIdResult = await pool
        .request()
        .input("shiftCode", sql.VarChar, shiftCode)
        .query(shiftIdQuery);

    return shiftIdResult.recordset[0]?.ShiftId;
}

async function getStockByVariant(variant, config) {
    try {
        const pool = await sql.connect(config);
        const Query = `SELECT TOP(1)
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
    ), 0) AS TotalStockQuantity
FROM 
    [dbo].[KitBOM] kb
    INNER JOIN [dbo].[SKUInventory] si ON kb.KitID = si.SKUID
    INNER JOIN [dbo].[SKU] sku ON si.SKUID = sku.SKUID
    INNER JOIN [dbo].[SKUCost] sc ON si.SKUInventoryID = sc.SKUInventoryID
WHERE 
    kb.BOMType = @dieSet
GROUP BY 
    kb.KitID, si.SKUInventoryID, sku.SKUCode, sc.SKUCostID;

`;

        const result = await pool.request()
            .input('dieSet', sql.VarChar, variant)
            .query(Query);

        const totalStock = result.recordset[0]?.TotalStockQuantity || 0;

        return totalStock; // Return the total stock value
    } catch (error) {
        console.error(error);
        return 0; // In case of error, return stock as 0
    }
}

async function getMaterialStockByVariant(variant, config) {
    try {
        const pool = await sql.connect(config);
        const Query = `WITH SKUData AS (
    SELECT 
        s.SKUID,
        si.SKUInventoryID,
        sc.SKUCostID
    FROM [dbo].[SKU] s
    LEFT JOIN [dbo].[SKUInventory] si ON s.SKUID = si.SKUID
    LEFT JOIN [dbo].[SKUCost] sc ON si.SKUInventoryID = sc.SKUInventoryID
    WHERE s.SKUCode = @variant
)
SELECT 
    COALESCE(SUM(ss.BucketQuantityInStorageUOM), 0) AS TotalBucketQuantity
FROM SKUData sd
LEFT JOIN [dbo].[SKUStock] ss ON sd.SKUCostID = ss.SKUCostID
LEFT JOIN [dbo].[StockBucket] sb ON ss.StockBucketID = sb.StockBucketID
WHERE sb.StockBucketName IN ('Parts OK', 'PartsStorage','PartsBadLot');
`;

        const result = await pool.request()
            .input('variant', sql.VarChar, variant)
            .query(Query);

        const totalStock = result.recordset[0]?.TotalBucketQuantity || 0;

        return totalStock; // Return the total stock value
    } catch (error) {
        console.error(error);
        return 0; // In case of error, return stock as 0
    }
}


async function getYZA(variant, config) {
    try {
        const pool = await sql.connect(config);
        const skuidQuery = `
            SELECT SKUID FROM SKU WHERE SKUCode = @variant
        `;
        const skuidResult = await pool.request()
            .input('variant', sql.VarChar, variant)
            .query(skuidQuery);
        const skuid = skuidResult.recordset[0]?.SKUID;

        if (!skuid) {
            return { material: 'Unknown' };
        }

        const kitIdQuery = `
            SELECT KitID FROM KitBOM WHERE KitItemID = @skuid
        `;
        const kitIdResult = await pool.request()
            .input('skuid', sql.Int, skuid)
            .query(kitIdQuery);
        const kitId = kitIdResult.recordset[0]?.KitID;

        if (!kitId) {
            return { material: 'Unknown' };
        }

        const uomNameQuery = `
            SELECT UOMName FROM UOM 
            WHERE UOMID IN (
                SELECT UOMID FROM SKUUOMMapping WHERE SKUID = @kitId
            )
            AND UOMCode NOT IN ('kg', 'NOS')
        `;
        const uomNameResult = await pool.request()
            .input('kitId', sql.Int, kitId)
            .query(uomNameQuery);
        const uomName = uomNameResult.recordset[0]?.UOMName || 'Unknown UOM';

        return { material: uomName };
    } catch (e) {
        console.error(e);
        return { material: 'Error' };
    }
}

async function getBOMIDDetails(dieSet, config) {
    const pool = await sql.connect(config);
    const bomIdQuery = `SELECT [DieSetID], [DieStorageBay] FROM [SSPCSdbo].[BOMTypeMaster] WHERE [DieSet] = @dieSet`;
    const result = await pool.request()
        .input('dieSet', sql.VarChar, dieSet)
        .query(bomIdQuery);

    if (result.recordset.length > 0) {
        const { DieSetID, DieStorageBay } = result.recordset[0];
        return { DieSetID, DieStorageBay };
    } else {
        return { DieSetID: null, DieStorageBay: 'Unknown' };
    }
}

async function getShiftAndSKUCategoryDetails(shift, line, config) {
    try {
        const pool = await sql.connect(config);
        // Query for ShiftId based on ShiftCode
        const shiftResult = await pool.request()
            .input('ShiftCode', sql.NVarChar, shift)
            .query('SELECT ShiftId FROM ShiftHeader WHERE ShiftCode = @ShiftCode');

        // Query for SKUCategoryID based on SKUCategoryName
        const skuCategoryResult = await pool.request()
            .input('SKUCategoryName', sql.NVarChar, line)
            .query('SELECT SKUCategoryID FROM SKUCategory WHERE SKUCategoryCode = @SKUCategoryName');

        // Extract ShiftId and SKUCategoryID from query results
        const ShiftId = shiftResult.recordset.length > 0 ? shiftResult.recordset[0].ShiftId : null;
        const SKUCategoryID = skuCategoryResult.recordset.length > 0 ? skuCategoryResult.recordset[0].SKUCategoryID : null;

        // Check if both values were found
        if (ShiftId === null || SKUCategoryID === null) {
            throw new Error('Could not find matching ShiftId or SKUCategoryID.');
        }

        // Return both values as an object
        return { ShiftId, SKUCategoryID };
    } catch (error) {
        console.error('Error fetching ShiftId and SKUCategoryID:', error);
        throw error; // Re-throw the error to handle it in the calling function
    }
}

async function getIsWorkingStatus(currentDate, shift, skuCategoryCode, config) {
    const pool = await sql.connect(config);
    const calendarResult = await pool.request()
        .input('currentDate', sql.Date, currentDate)
        .input('shift', sql.Int, shift)
        .input('skuCategoryCode', sql.NVarChar, skuCategoryCode)
        .query(`
        SELECT [IsWorking]
        FROM [dbo].[Calendar]
        WHERE CONVERT(DATE, [Date]) = @currentDate
          AND [ShiftId] = @shift
          AND [Line] = @skuCategoryCode;
    `);

    return calendarResult.recordset[0]?.IsWorking;
}

async function calculateLoadTimeForDieSet(dieSet, lineName, lotSize, config) {
    try {
        const pool = await sql.connect(config);
        // Run the query to get all the necessary fields
        const query = `
            SELECT 
                (
                      SELECT MIN(LotSize) AS MinSkidQty from PurchaseLotSize where PurchaseOrderingUOMID IN (SELECT UOMID FROM UOM where UOMID IN (SELECT PurchaseOrderingUOMID FROM PurchaseLotSize WHERE SKUID IN (SELECT  KitID  FROM KitBOM  WHERE BOMType = @DieSet )) AND UOMCode='NOS')
                      AND SKUID = (SELECT TOP(1) KitID  FROM KitBOM  WHERE BOMType = @DieSet )
                    ) AS MinSkidQty,

                (SELECT TOP(1) MAX(PerUnitQuantity) 
                 FROM KitBOM  
                 WHERE BOMType = @DieSet) AS BOMQty,

                (SELECT MIN(Quantity) 
                 FROM [dbo].[SKUPackMapping]  
                 WHERE SKUID = (SELECT TOP(1) KitItemID  
                                FROM KitBOM  
                                WHERE BOMType = @DieSet AND IsDefault=1 AND Quantity > 0)) AS QtyPerPallet,

                (SELECT Efficiency 
                 FROM SSPCSdbo.LineEfficencyMaster  
                 WHERE LineName = @LineName) AS Efficiency,

                COALESCE((SELECT TOP(1) SPS FROM SSPCSdbo.PQDataUpload  WHERE DieSet = @DieSet AND
                 EffectiveFrom = (SELECT DISTINCT top(1) EffectiveFrom FROM SSPCSdbo.PQDataUpload WHERE LineName=@LineName
                  ORDER BY EffectiveFrom DESC) AND LineName=@LineName), null) AS SPS,

                BT.* 
            FROM 
                SSPCSdbo.BOMTypeMaster BT 
            WHERE 
                BT.DieSet = @DieSet;
        `;

        // Execute the query
        const result = await pool.request()
            .input('DieSet', sql.VarChar, dieSet)
            .input('LineName', sql.VarChar, lineName)
            .query(query);

        // Retrieve the result row
        const newEle = result.recordset[0];

        // Perform the calculations
        let el = {};

        if (newEle.SPS && newEle.SPS > 0) {
            el.CycleTime = 1 / newEle.SPS;
        } else {
            throw new Error('Invalid SPS value from the database');
        }

        // Use the provided lotSize instead of newEle.SPS
        el.RoundUpKanbanQty = Math.ceil(lotSize / newEle.QtyPerPallet);
        el.RoundUpLotSize = el.RoundUpKanbanQty * newEle.QtyPerPallet;
        el.NoOfSkids = Math.ceil((el.RoundUpLotSize / newEle.BOMQty) / newEle.MinSkidQty);

        // Material Change Time
        el.MaterialChangeTimeInSec = (el.NoOfSkids - 1) * newEle.MaterialChangeoverTimePerChangeOverTime;

        // Pallet Change Time
        if (el.RoundUpKanbanQty % 2 === 0) {
            el.PalletChangeTimeInSec = ((el.RoundUpKanbanQty - newEle.NoOfPalletPerCycle) / newEle.NoOfPalletPerCycle) * newEle.PalletChangeoverTimePerChangeover;
        } else {
            el.PalletChangeTimeInSec = ((el.RoundUpKanbanQty - newEle.NoOfPalletPerCycle) / newEle.NoOfPalletPerCycle) * newEle.PalletChangeoverTimePerChangeover + newEle.PalletChangeoverTimePerChangeover;
        }

        // Line Production Time
        el.LineProductionTime = el.RoundUpLotSize * el.CycleTime;

        // Total Production Time
        el.TotalProductionTime = newEle.UDTime + newEle.CTTime + newEle.QCTime + el.MaterialChangeTimeInSec + el.PalletChangeTimeInSec + el.LineProductionTime;

        // SD Wait Time
        if (newEle.SDTime - el.TotalProductionTime <= 0) {
            el.SDWaitTime = 0;
        } else {
            el.SDWaitTime = newEle.SDTime - el.TotalProductionTime;
        }

        // SD Line Production Time
        el.SDLineProductionTime = el.TotalProductionTime + el.SDWaitTime;

        // EfficiencyPT
        //el.EfficiencyPT = (el.SDLineProductionTime * (100 - newEle.Efficiency) / 100) + el.SDLineProductionTime;
        el.EfficiencyPT = el.SDLineProductionTime/ newEle.BOMQty;

        // GSPS
        el.GSPS = (el.RoundUpLotSize / el.EfficiencyPT);
        // Return the EfficiencyPT as the outcome
        return {
            EfficiencyPT: el.EfficiencyPT,
            TotalProductionTime: el.TotalProductionTime / newEle.BOMQty
        };
    } catch (error) {
        console.error('Error calculating load time:', error);
        throw new Error('Failed to calculate load time');
    }
}

async function reCalculatePatternStartAndEndTime(date, lineId, shiftId, config) {
    //  const { date, lineId, shiftId } = req.body;
    let prevShiftDate = new Date(date), prevShiftID = 0;
    let getShiftDetails = await reUsableFun.getShiftDetailsByLineName(lineId, config);
    await getShiftDetails.forEach((el, index) => {
        if (el.ShiftId === shiftId) {
            if (index === 0) {
                prevShiftDate = prevShiftDate.setDate(prevShiftDate.getDate - 1);
                prevShiftID = getShiftDetails[2].ShiftId;
            } else {
                prevShiftID = getShiftDetails[index - 1].ShiftId;
            }
        }
    })
    // prevShiftDate = reUsableFun.getFormattedOnlyDate(prevShiftDate);
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    const transaction = pool.transaction(); // Add transaction initialization
    await transaction.begin();
    try {
        let result = await pool.request()
            .input('Date', sql.Date, date)
            .input('LineID', sql.Int, lineId)
            .input('ShiftID', sql.Int, shiftId)
            .input('prevShiftDate', sql.Date, prevShiftDate)
            .input('prevShiftID', sql.Int, prevShiftID)
            .query(`
                  SELECT * FROM (
                 
                  SELECT p.*, s.SKUCategoryCode, 2 AS QuerySource, bom.SDTime FROM SSPCSdbo.PatternActualData p
                  JOIN SKUCategory s ON p.LineID = s.SKUCategoryID 
                  JOIN SSPCSdbo.BOMTypeMaster bom ON bom.DieSetID = p.DieSetID
                  WHERE Date=@Date and  p.LineID = @LineID AND p.ShiftID = @ShiftID
              ) AS CombinedResults
              ORDER BY QuerySource, CASE WHEN QuerySource = 1 THEN CASE Status WHEN 4 THEN 1 WHEN 2 THEN 2 END END,
              PartSeq;
              `);

        //   SELECT * FROM (
        //     SELECT p.*, NULL AS SKUCategoryCode, 1 AS QuerySource FROM SSPCSdbo.PatternActualData p WHERE p.Date = @prevShiftDate 
        //     AND p.LineID = @LineID AND p.ShiftID = @prevShiftID AND p.Status IN (4, 2)
        //     UNION ALL
        //     SELECT p.*, s.SKUCategoryCode, 2 AS QuerySource FROM SSPCSdbo.PatternActualData p
        //     JOIN SKUCategory s ON p.LineID = s.SKUCategoryID WHERE p.Date = @Date AND p.LineID = @LineID AND p.ShiftID = @ShiftID
        // ) AS CombinedResults
        // ORDER BY QuerySource, CASE WHEN QuerySource = 1 THEN CASE Status WHEN 4 THEN 1 WHEN 2 THEN 2 END END,
        // PartSeq;

        let rowData = result.recordset;
        if (rowData.length === 0) {
            return res.send('No data exists for this shift. Please add a new plan or consult with the administrator.');
        }
        // let prevRecordInProgressAndQued =[];
        // getShiftDetails.forEach((el,index)=>{

        // })

        // Get operational time and breaks
        let operatioTimeDetails = await reUsableFun.getBreakTime(lineId, config);
        if (typeof operatioTimeDetails === 'string') {
            return res.send(operatioTimeDetails);
        }
        let breakTime = JSON.stringify(operatioTimeDetails.breakTime);
        let operationTime = operatioTimeDetails.operationTime;
        let filteredOperationTime = await operationTime.filter(el => el.ShiftId === shiftId);
        var startTime = filteredOperationTime[0].OperationStartTime;
        if (breakTime.length === 0) {
            return res.send(`Please add the operation time for ShiftId ${shiftId} in the ShiftLine table.`);
        }
        if (operationTime.length === 0) {
            return res.send(`Please add the operation time for ShiftId ${shiftId} in the ShiftLine table.`);
        }

        let getPlanLineStopDetails = await reUsableFun.getPlanLineStop(date, date, rowData[rowData.length - 1].SKUCategoryCode, config);
        if (typeof getPlanLineStopDetails === 'string') {
            return res.send(getPlanLineStopDetails);
        }
        let newStartTime = startTime;

        for (let record of rowData) {

            if (record.Status === 4) {
                if ((record.ActualStartTime === null && record.ActualEndTime === null) || (record.ActualStartTime !== null && record.ActualEndTime === null)) {
                    let timeDetails = await reUsableFun.getEndTime(
                        record.LoadTime,
                        record.Date,
                        newStartTime,
                        breakTime,
                        getPlanLineStopDetails
                    );

                    newStartTime = timeDetails.newStartTime;
                    let endTime = timeDetails.newEndTime;

                    // Update the database with the new start and end times
                    await transaction.request()
                        .input('PlanStartTime', sql.NVarChar, newStartTime)
                        .input('PlanEndTime', sql.NVarChar, endTime)
                        .input('PatternActualDataID', sql.Int, record.PatternActualDataID)
                        .query(`
                          UPDATE SSPCSdbo.PatternActualData
                          SET PlanStartTime = @PlanStartTime, PlanEndTime = @PlanEndTime
                          WHERE PatternActualDataID = @PatternActualDataID;
                      `);
                    newStartTime = endTime;
                }

            } else if (record.Status === 5) {

                let PstartTime = "", PendTime = "";
                if (record.ActualStartTime === null && record.ActualEndTime === null) {
                    PstartTime = "0";
                    PendTime = "0";
                } else if (record.ActualStartTime != null && record.ActualEndTime === null) {
                    PstartTime = newStartTime;
                    PendTime = record.PlanEndTime;
                    newStartTime = record.PlanEndTime;
                } else if (record.ActualStartTime != null && record.ActualEndTime !== null) {
                    let planEnd = extractTimeComponents(record.PlanEndTime);
                    let actualStartTime = extractTimeComponents(record.ActualStartTime);
                    let actualEndTime = extractTimeComponents(record.ActualEndTime);
                    let actStart = actualStartTime.hours * 3600 + actualStartTime.minutes * 60 + actualStartTime.seconds;
                    let actEnd = actualEndTime.hours * 3600 + actualEndTime.minutes * 60 + actualEndTime.seconds;
                    let planEndSec = planEnd.hours * 3600 + planEnd.minutes * 60 + planEnd.seconds;
                    if (Math.abs(actEnd - actStart) >= Number(record.SDTime)) {
                        // if(actEnd > planEndSec){
                        //     PstartTime = newStartTime;
                        //     PendTime = record.PlanEndTime;
                        //     newStartTime = record.PlanEndTime;
                        // }else{
                        PstartTime = newStartTime;
                        PendTime = record.PlanEndTime;
                        newStartTime = record.ActualEndTime;
                        // }

                    } else {
                        let newStartTimeStr = getSecToTimeStr(actStart + Number(record.SDTime));
                        PstartTime = newStartTime;
                        PendTime = record.PlanEndTime;
                        newStartTime = newStartTimeStr;
                    }
                }
                // else {
                //     PstartTime = newStartTime;
                //     PendTime = record.ActualEndTime;
                //     newStartTime = record.ActualEndTime;
                // }

                // Update the database with the new start and end times
                await transaction.request()
                    .input('PlanStartTime', sql.NVarChar, PstartTime == '0' ? null : PstartTime)
                    .input('PlanEndTime', sql.NVarChar, PendTime == '0' ? null : PendTime)
                    .input('PatternActualDataID', sql.Int, record.PatternActualDataID)
                    .query(`
                          UPDATE SSPCSdbo.PatternActualData
                          SET PlanStartTime = @PlanStartTime, PlanEndTime = @PlanEndTime
                          WHERE PatternActualDataID = @PatternActualDataID;
                      `);
            } else if (record.Status === 3) {

                await transaction.request()
                    .input('PlanStartTime', sql.NVarChar, null)
                    .input('PlanEndTime', sql.NVarChar, null)
                    .input('PatternActualDataID', sql.Int, record.PatternActualDataID)
                    .query(`
                      UPDATE SSPCSdbo.PatternActualData
                      SET PlanStartTime = @PlanStartTime, PlanEndTime = @PlanEndTime
                      WHERE PatternActualDataID = @PatternActualDataID;
                  `);

            } else if (record.Status === 6) {
                newStartTime = record.PlanEndTime;
            }
            else if (record.Status !== 6) {
                let timeDetails = await reUsableFun.getEndTime(
                    record.LoadTime,
                    record.Date,
                    newStartTime,
                    breakTime,
                    getPlanLineStopDetails
                );

                newStartTime = timeDetails.newStartTime;
                let endTime = timeDetails.newEndTime;

                // Update the database with the new start and end times
                await transaction.request()
                    .input('PlanStartTime', sql.NVarChar, newStartTime)
                    .input('PlanEndTime', sql.NVarChar, endTime)
                    .input('PatternActualDataID', sql.Int, record.PatternActualDataID)
                    .query(`
                      UPDATE SSPCSdbo.PatternActualData
                      SET PlanStartTime = @PlanStartTime, PlanEndTime = @PlanEndTime
                      WHERE PatternActualDataID = @PatternActualDataID;
                  `);
                newStartTime = endTime;
            } else {

            }
        }

        // Commit transaction
        await transaction.commit();
        // return res.send('Pattern start and end times recalculated successfully.');

    } catch (err) {
        await transaction.rollback(); // Rollback on error
        logger.customerLogger.error(err.message);
        return err.message;
    }
}

async function getShiftTimes(shift, config) {
    try {
        const pool = await sql.connect(config);
        const shiftTimesQuery = `
        SELECT [ShiftStartTime], [ShiftEndTime] 
        FROM [dbo].[ShiftHeader]
        WHERE [ShiftName] = @shift;
      `;
        const shiftTimesResult = await pool
            .request()
            .input("shift", sql.NVarChar, shift)
            .query(shiftTimesQuery);

        // Return both ShiftStartTime and ShiftEndTime
        const shiftData = shiftTimesResult.recordset[0];
        return {
            shiftStartTime: shiftData?.ShiftStartTime,
            shiftEndTime: shiftData?.ShiftEndTime,
        };
    } catch (error) {
        console.error("Failed to get shift times:", error);
        throw new Error("Error fetching shift times");
    }
}

function getUniversalDateFromISTDate(dateStr) {
    const nowUTC = new Date(dateStr);
    const offset = 5.5 * 60 * 60 * 1000; // in milliseconds
    const nowIST = new Date(nowUTC.getTime() - offset);
    return nowIST;
}
async function getLoadTimeDetails(dieSet, lineName, actualID, config) {
    try {
        const pool = await sql.connect(config);
        // Run the query to get all the necessary fields
        const query = `
            SELECT 
                (
                      SELECT MIN(LotSize) AS MinSkidQty from PurchaseLotSize where PurchaseOrderingUOMID IN (SELECT UOMID FROM UOM where UOMID IN (SELECT PurchaseOrderingUOMID FROM PurchaseLotSize WHERE SKUID IN (SELECT  KitID  FROM KitBOM  WHERE BOMType = @DieSet )) AND UOMCode='NOS')
                      AND SKUID = (SELECT TOP(1) KitID  FROM KitBOM  WHERE BOMType = @DieSet )
                    ) AS MinSkidQty,

                (SELECT TOP(1) MAX(PerUnitQuantity) FROM KitBOM  
                 WHERE BOMType = @DieSet) AS BOMQty,

                (SELECT MIN(Quantity) 
                 FROM [dbo].[SKUPackMapping]  
                 WHERE SKUID = (SELECT TOP(1) KitItemID  
                                FROM KitBOM  
                                WHERE BOMType = @DieSet AND IsDefault=1 AND Quantity > 0 )) AS QtyPerPallet,

                (SELECT Efficiency 
                 FROM SSPCSdbo.LineEfficencyMaster  
                 WHERE LineName = @LineName) AS Efficiency,

                COALESCE((SELECT TOP(1) SPS FROM SSPCSdbo.PQDataUpload  WHERE DieSet = @DieSet
                 AND EffectiveFrom = (SELECT DISTINCT top(1) EffectiveFrom FROM SSPCSdbo.PQDataUpload 
                 WHERE LineName=@LineName ORDER BY EffectiveFrom DESC) AND LineName=@LineName), null) AS SPS,

                (SELECT PatternLotSize
                 FROM SSPCSdbo.PatternActualData 
                 WHERE PatternActualDataID = @ActualID) AS LotSize,

                BT.* 
            FROM 
                SSPCSdbo.BOMTypeMaster BT 
            WHERE 
                BT.DieSet = @DieSet;
        `;

        // Execute the query
        const result = await pool.request()
            .input('DieSet', sql.VarChar, dieSet)
            .input('LineName', sql.VarChar, lineName)
            .input('ActualID', sql.Int, actualID)
            .query(query);

        // Retrieve the result row
        const newEle = result.recordset[0];

        // Perform the calculations
        let el = {};

        if (newEle.SPS && newEle.SPS > 0) {
            el.CycleTime = 1 / newEle.SPS;
        } else {
            throw new Error('Invalid SPS value from the database');
        }

        const lotSize = newEle.LotSize;

        // Use the provided lotSize instead of newEle.SPS
        el.RoundUpKanbanQty = Math.ceil(lotSize / newEle.QtyPerPallet);
        el.RoundUpLotSize = el.RoundUpKanbanQty * newEle.QtyPerPallet;
        el.NoOfSkids = Math.ceil((el.RoundUpLotSize / newEle.BOMQty) / newEle.MinSkidQty);

        // Material Change Time
        el.MaterialChangeTimeInSec = (el.NoOfSkids - 1) * newEle.MaterialChangeoverTimePerChangeOverTime;

        // Pallet Change Time
        if (el.RoundUpKanbanQty % 2 === 0) {
            el.PalletChangeTimeInSec = ((el.RoundUpKanbanQty - newEle.NoOfPalletPerCycle) / newEle.NoOfPalletPerCycle) * newEle.PalletChangeoverTimePerChangeover;
        } else {
            el.PalletChangeTimeInSec = ((el.RoundUpKanbanQty - newEle.NoOfPalletPerCycle) / newEle.NoOfPalletPerCycle) * newEle.PalletChangeoverTimePerChangeover + newEle.PalletChangeoverTimePerChangeover;
        }

        // Line Production Time
        el.LineProductionTime = el.RoundUpLotSize * el.CycleTime;

        // Total Production Time
        el.TotalProductionTime = newEle.UDTime + newEle.CTTime + newEle.QCTime + el.MaterialChangeTimeInSec + el.PalletChangeTimeInSec + el.LineProductionTime;

        // SD Wait Time
        if (newEle.SDTime - el.TotalProductionTime <= 0) {
            el.SDWaitTime = 0;
        } else {
            el.SDWaitTime = newEle.SDTime - el.TotalProductionTime;
        }

        // SD Line Production Time
        el.SDLineProductionTime = el.TotalProductionTime + el.SDWaitTime;

        // EfficiencyPT
        //  el.EfficiencyPT = (el.SDLineProductionTime * (100 - newEle.Efficiency) / 100) + el.SDLineProductionTime;
        el.EfficiencyPT = el.SDLineProductionTime/newEle.BOMQty; // AS Per the user new requirement

        // GSPS
        el.GSPS = (el.RoundUpLotSize / el.EfficiencyPT);

        // Return the EfficiencyPT as the outcome
       // if(dieSet='63111-INN'){
            console.log('sdhfbsjdfJKFNKfnmkN..........................................................', el);
        //}
        return {// Increment the idCounter for each record
            UDTime: newEle.UDTime,
            CTTime: newEle.CTTime,
            QCTime: newEle.QCTime,
            MaterialChangeoverTimePerChangeOverTime: newEle.MaterialChangeoverTimePerChangeOverTime,
            PalletChangeoverTimePerChangeover: newEle.PalletChangeoverTimePerChangeover,
            SDTime: newEle.SDTime,
            SPS: newEle.SPS,
            Efficiency: newEle.Efficiency,
            LineProductionTime: el.LineProductionTime,
            TotalProductionTime: el.TotalProductionTime,
            SDWaitTime: el.SDWaitTime,
            SDLineProductionTime: el.SDLineProductionTime,
            EfficiencyPT: el.EfficiencyPT
        };
    } catch (error) {
        console.error('Error calculating load time:', error);
        throw new Error('Failed to calculate load time');
    }
}

async function getTransactionDetails(config) {
    try {
        const pool = await sql.connect(config);
        const transResult = await pool
            .request()
            .query(`
        select TransactionTypeID as transID,TransactionTypeCode as transCode from TransactionType where TransactionTypeCode in ('RemovingExcessKbs','PurchaseOrderCreationExcessOrdering','PurchaseOrderCreation');
      `);


        return transResult.recordset;
    } catch (error) {
        console.error("Failed to get shift times:", error);
        throw new Error("Error fetching shift times");
    }
}

async function validateShiftCode(arr, currentTimeStr, shiftCode) {
    const currentTime = new Date(`1970-01-01T${currentTimeStr}Z`);
    for (let shift of arr) {
        const startTime = new Date(`1970-01-01T${shift.ShiftStartTime}Z`);
        const endTime = new Date(`1970-01-01T${shift.ShiftEndTime}Z`);
        if (shift.ShiftCode === shiftCode) {
            if (endTime < startTime) {
                if (currentTime >= startTime || currentTime < endTime) {
                    return true;
                }
            } else {
                if (currentTime >= startTime && currentTime < endTime) {
                    return true;
                }
            }
        }
    }

    return false
}
function checkTimeOverlap(arr) {
    const timeToDate = (timeStr) => new Date(`1970-01-01T${timeStr}Z`);
    let overLapRawNo = [];
    for (let i = 0; i < arr.length; i++) {
        const item1 = arr[i];
        for (let j = i + 1; j < arr.length; j++) {
            const item2 = arr[j];
            if (item1.LineName === item2.LineName) {
                const start1 = timeToDate(item1.FromTime);
                const end1 = timeToDate(item1.ToTime);
                const start2 = timeToDate(item2.FromTime);
                const end2 = timeToDate(item2.ToTime);

                if ((start1 < end2) && (end1 > start2)) {
                    overLapRawNo.push(`Overlap detected between row ${i + 1} and row ${j + 1}: Line: ${item1.LineName}, Start: ${item1.FromTime}, End: ${item1.ToTime} and Line: ${item2.LineName}, Start: ${item2.FromTime}, End: ${item2.ToTime}`);
                }
            }
        }
    }

    // Remove duplicate overlaps using a Set
    overLapRawNo = [...new Set(overLapRawNo)];

    // Return the result if there are overlaps, otherwise return false
    return overLapRawNo.length > 0 ? overLapRawNo : false;
}
async function getRowColorsByStatusForPartOrder(status) {
    let rowColor = "#fff";
    let statusTextColor = "#000";
    let statusTextBgColor = "#e9e8eb";

    switch (ActionTypesReverse[status]) {
        case 'Queued':
            rowColor = "#DFEFFF";
            statusTextColor = "#000";
            statusTextBgColor = "#B7DBFF";
            break;
        case 'Skipped':
            rowColor = "#fff";
            statusTextColor = "#d90429";
            statusTextBgColor = "#fcfafa";
            break;
        case 'Completed':
            rowColor = "#DDF6DE";
            statusTextColor = "#000";
            statusTextBgColor = "#A6E8A8";
            break;
        case 'In Progress':
            rowColor = "#FDFFE6";
            statusTextColor = "#000";
            statusTextBgColor = "#F8FFAD";
            break;
        case 'Discontinued':
            rowColor = "#FF0000"; // Red color
            statusTextColor = "#000"; // Black text color
            statusTextBgColor = "#e9e8eb";
            break;
        case 'Planned':
            rowColor = "#fff",
                statusTextColor = "#000",
                statusTextBgColor = "#e9e8eb";
            break;
        case 'Carry Over':
            rowColor = "#caedca";
            statusTextColor = "#000";
            statusTextBgColor = "#A6E8A8";
            break;
        default:
            rowColor = "#fff";
            statusTextColor = "#000";
            statusTextBgColor = "#e9e8eb";
    }

    return { rowColor, statusTextColor, statusTextBgColor };
}
async function getYZANoOfMaterial(pool) {
    try {
        const transResult = await pool
            .request()
            .query(`
                WITH SKUOMResult AS (
                    SELECT SKUID, UOMID
                    FROM SKUUOMMapping
                ),
                skuCode AS (
                    SELECT SKUID, SKUCode
                    FROM SKU
                ),
                ResultCTE AS (
                    SELECT DISTINCT OMR.SKUID, OMR.UOMID, skc.SKUCode
                    FROM SKUOMResult OMR
                    LEFT JOIN skuCode skc ON OMR.SKUID = skc.SKUID
                ),
                uomCTE AS (
                    SELECT DISTINCT UOMName, UOMID,CreatedDate
                    FROM UOM
                    WHERE UOMCode NOT IN ('kg', 'NOS')
                    AND UOMID IN (
                        SELECT DISTINCT UOMID
                        FROM SKUUOMMapping
                        WHERE SKUID IN (
                            SELECT DISTINCT KitID
                            FROM KitBOM
                            WHERE BOMType IN (SELECT DieSet FROM SSPCSdbo.BOMTypeMaster)
                        )
                    )
                )
                SELECT  ResultCTE.SKUCode, uom.UOMName,uom.CreatedDate
                FROM ResultCTE
                LEFT JOIN uomCTE uom ON ResultCTE.UOMID = uom.UOMID
                where uom.UOMName IS NOT NULL
                ORDER BY ResultCTE.SKUID , uom.CreatedDate DESC;
      `);

        //       const transResult = await pool
        //       .request()
        //       .query(`
        //           with SKUOMResult AS(
        //           select * from SKUUOMMapping
        //           ),
        //           skuCode As (
        //           select * From SKU 
        //           )
        //           select DISTINCT OMR.SKUID, OMR.Barcode, skc.SKUCode  from SKUOMResult OMR 
        //           LEFT JOIN SKUCode skc ON OMR.SKUID = skc.SKUID;
        // `);


        return transResult.recordset;
    } catch (error) {
        return error.message;
    }
}
function findDuplicates(arr) {
    const elementCount = new Map();
    const duplicates = new Set();

    for (const el of arr) {
        if (elementCount.has(el)) {
            duplicates.add(el);
        } else {
            elementCount.set(el, 1);
        }
    }

    return Array.from(duplicates);
}

async function getMBSpecificValue(dieSetID, config) {
    const pool = await sql.connect(config);
    const query = `SELECT MBSpecific FROM SSPCSdbo.BOMTypeMaster WHERE DieSetID = @dieSetID`;
    const result = await pool.request()
        .input('dieSetID', sql.Int, dieSetID)
        .query(query);
    return result.recordset.length > 0 ? result.recordset[0].MBSpecific : null;
}

async function getTotalProdTime(bomType, config) {
    const pool = await sql.connect(config);
    const query = `SELECT TotalProductionTime FROM SSPCSdbo.PatternRawDataUpload WHERE DieSet = @bomType`;
    const result = await pool.request()
        .input('bomType', sql.NVarChar, bomType)
        .query(query);
    return result.recordset.length > 0 ? result.recordset[0].TotalProductionTime : null;
}

async function timeToSeconds(time) {
    const [hh, mm, ss] = time.split(':').map(Number);
    return hh * 3600 + mm * 60 + ss;
}

async function calculateLoadTimeForInProgressDieSet(dieSet, lineName, lotSize, config) {
    try {
        const pool = await sql.connect(config);
        // Run the query to get all the necessary fields
        const query = `
            SELECT 
                (
                      SELECT MIN(LotSize) AS MinSkidQty from PurchaseLotSize where PurchaseOrderingUOMID IN (SELECT UOMID FROM UOM where UOMID IN (SELECT PurchaseOrderingUOMID FROM PurchaseLotSize WHERE SKUID IN (SELECT  KitID  FROM KitBOM  WHERE BOMType = @DieSet )) AND UOMCode='NOS')
                      AND SKUID = (SELECT TOP(1) KitID  FROM KitBOM  WHERE BOMType = @DieSet )
                    ) AS MinSkidQty,

                (SELECT TOP(1) MAX(PerUnitQuantity) 
                 FROM KitBOM  
                 WHERE BOMType = @DieSet) AS BOMQty,

                (SELECT MIN(Quantity) 
                 FROM [dbo].[SKUPackMapping]  
                 WHERE SKUID = (SELECT TOP(1) KitItemID  
                                FROM KitBOM  
                                WHERE BOMType = @DieSet AND IsDefault=1 AND Quantity > 0)) AS QtyPerPallet,

                (SELECT Efficiency 
                 FROM SSPCSdbo.LineEfficencyMaster  
                 WHERE LineName = @LineName) AS Efficiency,

                COALESCE((SELECT TOP(1) SPS FROM SSPCSdbo.PQDataUpload  WHERE DieSet = @DieSet AND
                 EffectiveFrom = (SELECT DISTINCT top(1) EffectiveFrom FROM SSPCSdbo.PQDataUpload WHERE LineName=@LineName
                  ORDER BY EffectiveFrom DESC) AND LineName=@LineName), null) AS SPS,

                BT.* 
            FROM 
                SSPCSdbo.BOMTypeMaster BT 
            WHERE 
                BT.DieSet = @DieSet;
        `;

        // Execute the query
        const result = await pool.request()
            .input('DieSet', sql.VarChar, dieSet)
            .input('LineName', sql.VarChar, lineName)
            .query(query);

        // Retrieve the result row
        const newEle = result.recordset[0];

        // Perform the calculations
        let el = {};

        if (newEle.SPS && newEle.SPS > 0) {
            el.CycleTime = 1 / newEle.SPS;
        } else {
            throw new Error('Invalid SPS value from the database');
        }

        // Use the provided lotSize instead of newEle.SPS
        el.RoundUpKanbanQty = Math.ceil(lotSize / newEle.QtyPerPallet);
        el.RoundUpLotSize = el.RoundUpKanbanQty * newEle.QtyPerPallet;
        el.NoOfSkids = Math.ceil((el.RoundUpLotSize / newEle.BOMQty) / newEle.MinSkidQty);

        // Material Change Time
        el.MaterialChangeTimeInSec = (el.NoOfSkids - 1) * newEle.MaterialChangeoverTimePerChangeOverTime;

        // Pallet Change Time
        if (el.RoundUpKanbanQty % 2 === 0) {
            el.PalletChangeTimeInSec = ((el.RoundUpKanbanQty - newEle.NoOfPalletPerCycle) / newEle.NoOfPalletPerCycle) * newEle.PalletChangeoverTimePerChangeover;
        } else {
            el.PalletChangeTimeInSec = ((el.RoundUpKanbanQty - newEle.NoOfPalletPerCycle) / newEle.NoOfPalletPerCycle) * newEle.PalletChangeoverTimePerChangeover + newEle.PalletChangeoverTimePerChangeover;
        }

        // Line Production Time
        el.LineProductionTime = el.RoundUpLotSize * el.CycleTime;

        // Total Production Time
        el.TotalProductionTime = el.MaterialChangeTimeInSec + el.PalletChangeTimeInSec + el.LineProductionTime;

        // SD Line Production Time
        el.SDLineProductionTime = el.TotalProductionTime;

        // EfficiencyPT
        //el.EfficiencyPT = (el.SDLineProductionTime * (100 - newEle.Efficiency) / 100) + el.SDLineProductionTime;
        el.EfficiencyPT = el.SDLineProductionTime / newEle.BOMQty;

        // GSPS
        el.GSPS = (el.RoundUpLotSize / el.EfficiencyPT);

        // Return the EfficiencyPT as the outcome
        return {
            EfficiencyPT: el.EfficiencyPT,
            TotalProductionTime: el.TotalProductionTime/newEle.BOMQty
        };
    } catch (error) {
        console.error('Error calculating load time:', error);
        throw new Error('Failed to calculate load time');
    }
}
async function reCalculatePatternStartAndEndTimeFor1stTimeLoadingProductionScreen(date, lineId, shiftId, config) {
    //  const { date, lineId, shiftId } = req.body;
    let prevShiftDate = new Date(date), prevShiftID = 0;
    let getShiftDetails = await reUsableFun.getShiftDetailsByLineName(lineId, config);
    await getShiftDetails.forEach((el, index) => {
        if (el.ShiftId === shiftId) {
            if (index === 0) {
                prevShiftDate = prevShiftDate.setDate(prevShiftDate.getDate - 1);
                prevShiftID = getShiftDetails[2].ShiftId;
            } else {
                prevShiftID = getShiftDetails[index - 1].ShiftId;
            }
        }
    })
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    const transaction = pool.transaction();
    await transaction.begin();
    try {
        let result = await pool.request()
            .input('Date', sql.Date, date)
            .input('LineID', sql.Int, lineId)
            .input('ShiftID', sql.Int, shiftId)
            .input('prevShiftDate', sql.Date, prevShiftDate)
            .input('prevShiftID', sql.Int, prevShiftID)
            .query(`
                  SELECT * FROM (
                 
                  SELECT p.*, s.SKUCategoryCode, 2 AS QuerySource, bom.SDTime FROM SSPCSdbo.PatternActualData p
                  JOIN SKUCategory s ON p.LineID = s.SKUCategoryID
                  JOIN SSPCSdbo.BOMTypeMaster bom ON bom.DieSetID = p.DieSetID
                  WHERE Date=@Date and  p.LineID = @LineID AND p.ShiftID = @ShiftID
              ) AS CombinedResults
              ORDER BY QuerySource, CASE WHEN QuerySource = 1 THEN CASE Status WHEN 4 THEN 1 WHEN 2 THEN 2 END END,
              PartSeq;
              `);
 
        let rowData = result.recordset;
        if (rowData.length === 0) {
            return res.send('No data exists for this shift. Please add a new plan or consult with the administrator.');
        }
        let operatioTimeDetails = await reUsableFun.getBreakTime(lineId, config);
        if (typeof operatioTimeDetails === 'string') {
            return res.send(operatioTimeDetails);
        }
        let breakTime = JSON.stringify(operatioTimeDetails.breakTime);
        let operationTime = operatioTimeDetails.operationTime;
        let filteredOperationTime = await operationTime.filter(el => el.ShiftId === shiftId);
        var startTime = filteredOperationTime[0].OperationStartTime;
        if (breakTime.length === 0) {
            return res.send(`Please add the operation time for ShiftId ${shiftId} in the ShiftLine table.`);
        }
        if (operationTime.length === 0) {
            return res.send(`Please add the operation time for ShiftId ${shiftId} in the ShiftLine table.`);
        }
 
        let getPlanLineStopDetails = await reUsableFun.getPlanLineStop(date, date, rowData[rowData.length - 1].SKUCategoryCode, config);
        if (typeof getPlanLineStopDetails === 'string') {
            return res.send(getPlanLineStopDetails);
        }
        let newStartTime = startTime;
 
        for (let record of rowData) {
                let timeDetails = await reUsableFun.getEndTime(
                    record.LoadTime,
                    record.Date,
                    newStartTime,
                    breakTime,
                    getPlanLineStopDetails
                );
 
                newStartTime = timeDetails.newStartTime;
                let endTime = timeDetails.newEndTime;
 
                // Update the database with the new start and end times
                await transaction.request()
                    .input('PlanStartTime', sql.NVarChar, newStartTime)
                    .input('PlanEndTime', sql.NVarChar, endTime)
                    .input('PatternActualDataID', sql.Int, record.PatternActualDataID)
                    .query(`
                      UPDATE SSPCSdbo.PatternActualData
                      SET PlanStartTime = @PlanStartTime, PlanEndTime = @PlanEndTime
                      WHERE PatternActualDataID = @PatternActualDataID;
                  `);
                newStartTime = endTime;
        }
 
        await transaction.commit();
 
    } catch (err) {
        await transaction.rollback(); // Rollback on error
        logger.customerLogger.error(err.message);
        return err.message;
    }
}
async function getPartStockByVariant(variant, config) {
    try {
        const pool = await sql.connect(config);
        const Query = `WITH SKUData AS (
    SELECT
        s.SKUID,
        si.SKUInventoryID,
        sc.SKUCostID
    FROM [dbo].[SKU] s
    LEFT JOIN [dbo].[SKUInventory] si ON s.SKUID = si.SKUID
    LEFT JOIN [dbo].[SKUCost] sc ON si.SKUInventoryID = sc.SKUInventoryID
    WHERE s.SKUCode = @variant
)
SELECT
    COALESCE(SUM(ss.BucketQuantityInStorageUOM), 0) AS TotalBucketQuantity
FROM SKUData sd
LEFT JOIN [dbo].[SKUStock] ss ON sd.SKUCostID = ss.SKUCostID
LEFT JOIN [dbo].[StockBucket] sb ON ss.StockBucketID = sb.StockBucketID
WHERE sb.StockBucketCode IN ('PartsOK', 'PartsStorage','PartsBadLot', 'OnHoldOKParts', 'PartsNG', 'RepairWIP');
`;
 
        const result = await pool.request()
            .input('variant', sql.VarChar, variant)
            .query(Query);
 
        const totalStock = result.recordset[0]?.TotalBucketQuantity || 0;
 
        return totalStock; // Return the total stock value
    } catch (error) {
        console.error(error);
        return 0; // In case of error, return stock as 0
    }
}
async function getAdjustedDateForNightShift(currentDate, currentTime, shift, config) {
    // Directly get ShiftEndTime from DB
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("shift", sql.Int, shift)
      .query("SELECT ShiftEndTime FROM ShiftHeader WHERE ShiftId = @shift");
  
    if (result.recordset.length === 0) {
      throw new Error(`No ShiftHeader found for ShiftId ${shift}`);
    }
  
    const shiftEndTime = result.recordset[0].ShiftEndTime;
  
    // Convert HH:mm:ss to minutes
    const timeToMinutes = (timeStr) => {
      const [h, m, s] = timeStr.split(":").map(Number);
      return h * 60 + m + (s > 0 ? 1 : 0);
    };
  
    const currentTimeMins = timeToMinutes(currentTime);
    const shiftEndTimeMins = timeToMinutes(shiftEndTime);
  
    // If current time is less than or equal to shift end, subtract a day
    if (currentTimeMins <= shiftEndTimeMins) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - 1);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } else {
      return currentDate;
    }
  }

async function calculateEffectiveDuration(startTime, endTime, lineID, config) {
  console.log(`\n--- Calculating Effective Duration ---`);
  console.log(`Start Time: ${startTime}, End Time: ${endTime}`);

  const breakInfo = await reUsableFun.getBreakTimeForActualLoadTime(lineID, config);
  const breaks = breakInfo.breakTime || [];
  console.log(`Retrieved Breaks:`, breaks);

  let startSeconds = await reUsableFun.timeToSeconds(startTime);
  let endSeconds = await reUsableFun.timeToSeconds(endTime);

  console.log(`Start Time (seconds): ${startSeconds}`);
  console.log(`End Time (seconds): ${endSeconds}`);

  // Handle overnight case
  if (endSeconds < startSeconds) {
    console.log(`Overnight shift detected. Adjusting endSeconds...`);
    endSeconds += 86400; // Add 24 hours in seconds
    console.log(`Adjusted End Time (seconds): ${endSeconds}`);
  }

  let totalDuration = endSeconds - startSeconds;
  console.log(`Initial Total Duration (before break deduction): ${totalDuration} seconds`);

  for (const b of breaks) {
    let breakStart = await reUsableFun.timeToSeconds(b.fromSequence);
    let breakEnd = await reUsableFun.timeToSeconds(b.toSequence);

    console.log(`\nProcessing Break: From ${b.fromSequence} to ${b.toSequence}`);
    console.log(`Break Start (seconds): ${breakStart}`);
    console.log(`Break End (seconds): ${breakEnd}`);

    // Handle overnight breaks
    if (breakEnd < breakStart) {
      console.log(`Overnight break detected. Adjusting breakEnd...`);
      breakEnd += 86400;
      console.log(`Adjusted Break End (seconds): ${breakEnd}`);
    }

    const overlapStart = Math.max(startSeconds, breakStart);
    const overlapEnd = Math.min(endSeconds, breakEnd);

    if (overlapStart < overlapEnd) {
      const overlapDuration = overlapEnd - overlapStart;
      totalDuration -= overlapDuration;
      console.log(`Overlap Detected: From ${overlapStart} to ${overlapEnd} (${overlapDuration} seconds)`);
      console.log(`Total Duration after this break: ${totalDuration} seconds`);
    } else {
      console.log(`No overlap with this break.`);
    }
  }

  const effectiveDuration = Math.max(0, totalDuration);
  console.log(`\nFinal Effective Duration: ${effectiveDuration} seconds`);
  console.log(`--- End Calculation ---\n`);

  return effectiveDuration;
}

async function getBreakTimeForActualLoadTime(LineID, config) {
    try {
        const pool = await sql.connect(config);
        const existingRecord = await pool.request()
            .input('LineID', sql.Int, LineID)
            .query(`
                  SELECT * 
                    FROM ShiftLine 
                    WHERE ShiftId IN (
                        SELECT DISTINCT ShiftID 
                        FROM SSPCSdbo.PatternShiftMapping 
                        WHERE LineName = ( SELECT SKUCategoryCode FROM SKUCategory WHERE SKUCategoryID=@LineID)
                    ) 
                    ORDER BY ShiftId, OperationStartTime ASC;
                      `);

        if (existingRecord.recordset.length > 0) {
            await existingRecord.recordset.forEach(element => {
                element.ShiftSequence = Number(element.ShiftSequence);
            })
            const parseTime = (timeStr) => { // 05:30:00  Convert to minutes
                const [hours, minutes, seconds] = timeStr.split(':').map(Number);
                return hours * 60 + minutes + (seconds / 60);
            };

            // Function to calculate difference in minutes, accounting for day change
            const calculateTimeDifference = (end, start) => {
                const endInMinutes = parseTime(end);
                const startInMinutes = parseTime(start);
                //  mid night
                if (startInMinutes < endInMinutes) {
                    return (1440 - endInMinutes) + startInMinutes; // 1440 minutes in a day
                }
                return startInMinutes - endInMinutes;
            };

            existingRecord.recordset.sort((a, b) => a.ShiftId - b.ShiftId || a.ShiftSequence - b.ShiftSequence);

            const differences = [];

            for (let i = 0; i < existingRecord.recordset.length - 1; i++) {
                const current = existingRecord.recordset[i];
                const next = existingRecord.recordset[i + 1];

             //   if (current.ShiftId === next.ShiftId) {
                    const difference = calculateTimeDifference(current.OperationEndTime, next.OperationStartTime);

                    if (difference > 0) {
                        differences.push({
                            fromSequence: current.OperationEndTime,
                            toSequence: next.OperationStartTime,
                            difference: difference
                        });
                    }
             //   }
            }
            return {
                breakTime: differences,
                operationTime: existingRecord.recordset
            };
        }
    } catch (error) {
        logger.customerLogger.error(error.message);
        return error.message;
    }
}


const reUsableFun = {
    isDateGreater,
    isDateGreaterOrEqual,
    getFormattedDate,
    getNoPlanDay,
    isHoliday,
    getEndTime,
    extractTimeComponents,
    getWorkingDayCount,
    excelSerialDateToDate,
    getFormattedOnlyDate,
    checkInvalidColumn,
    SaveExcelSheet,
    SaveJsonToCsvFile,
    getOrderingDate,
    getOrderCycleID,
    getBreakTime,
    getStartAndEndTime,
    convertDateDDMMYYtoYYMMDD,
    getISTDate,
    stringToBoolean,
    findDuplicateColumn,
    parseDate,
    getIstDateFromUniversalDate,
    getDuplicateElement,
    EndtimeIsGreaterThanStartTime,
    getPlanLineStop,
    handleHoliday,
    getNextWorkngDay,
    getPrevWorkngDay,
    convertDateAndTimeToDateTime,
    formatDateToISO,
    dateToExcelSerial,
    convertDateToSerialDateTime,
    convertFromDateAndTimeToDateTime,
    ReArrangeArrBasedOnPatternNo,
    checkDuplicatesAndSerialPartSeq,
    getShiftDetailsByLineName,
    checkHolidyForEntirePlan,
    getCurrentShiftDetails,
    getFormattedSeperateDateAndTime,
    getTimeStringToSec,
    getFormattedDateAndTime,
    getBOMTypeDetails,
    getRowColorsByStatus,
    getShiftAndSKUCategory,
    ActionTypesReverse,
    ActionTypes,
    getQPC,
    getShiftGroupName,
    getShiftId,
    getStockByVariant,
    getMaterialStockByVariant,
    getYZA,
    getBOMIDDetails,
    getShiftAndSKUCategoryDetails,
    getIsWorkingStatus,
    calculateLoadTimeForDieSet,
    reCalculatePatternStartAndEndTime,
    getShiftTimes,
    getUniversalDateFromISTDate,
    getLoadTimeDetails,
    getTransactionDetails,
    validateShiftCode,
    checkTimeOverlap,
    getRowColorsByStatusForPartOrder,
    getYZANoOfMaterial,
    findDuplicates,
    getMBSpecificValue,
    getTotalProdTime,
    timeToSeconds,
    calculateLoadTimeForInProgressDieSet,
    reCalculatePatternStartAndEndTimeFor1stTimeLoadingProductionScreen,
    getPartStockByVariant,
    getAdjustedDateForNightShift,
    calculateEffectiveDuration,
getBreakTimeForActualLoadTime
}

module.exports = reUsableFun;
