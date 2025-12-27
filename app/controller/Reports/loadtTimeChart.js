const sql = require('mssql/msnodesqlv8');
const csv = require('csv-parser');
const reUsableFun = require('../../utils/reUsableFun');
const config = require("../../config/dbConfig");


exports.productionLoadTimeChart = async (req, res) => {
    let { currentDate, currentTime, line, shift } = req.body;

    if (!currentDate || !currentTime || !line || !shift) {
        return res.status(400).send('Please provide currentDate, currentTime, line, and shift');
    }

     const { shiftName, skuCategoryCode } = await reUsableFun.getShiftAndSKUCategory(shift, line, config);

    if (shiftName === "N_C") {
            currentDate = await reUsableFun.getAdjustedDateForNightShift(currentDate, currentTime, shift, config);
            console.log("Adjusted Date:", currentDate);
        }

    const shiftCrossesMidnight = (startTime, endTime) => {
        const startMins = parseTimeToMinutes(startTime);
        const endMins = parseTimeToMinutes(endTime);
        return startMins > endMins;
    };

    const isTimeInShift = (timeStr, shiftStartStr, shiftEndStr) => {
        const time = parseTimeToMinutes(timeStr);
        const shiftStart = parseTimeToMinutes(shiftStartStr);
        const shiftEnd = parseTimeToMinutes(shiftEndStr);
        
  
        if (shiftStart < shiftEnd) {
            return time >= shiftStart && time <= shiftEnd;
        } 

        else {
            return time >= shiftStart || time <= shiftEnd;
        }
    };

    const formatTime = (time) => {
        if (!time) return null;
        
        try {
          
            if (typeof time === 'string') {
                
                if (time.match(/^\d{2}:\d{2}$/)) return time;
                
                
                const parsedDate = new Date(`1970-01-01T${time.trim()}`);
                if (!isNaN(parsedDate)) {
                    return `${parsedDate.getHours().toString().padStart(2, '0')}:${parsedDate.getMinutes().toString().padStart(2, '0')}`;
                }
            }
            
      
            if (time instanceof Date) {
                return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
            }
            
            console.warn('Unexpected time format:', time);
            return null;
        } catch (error) {
            console.error('Error in formatTime:', error);
            return null;
        }
    };
    
    const parseTimeToMinutes = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') {
            console.warn('Invalid time string:', timeStr);
            return 0;
        }
        
        try {
            const [hours, minutes] = timeStr.split(':').map(Number);
            
            if (isNaN(hours) || isNaN(minutes)) {
                console.warn('Invalid time components:', timeStr);
                return 0;
            }
            
            return hours * 60 + minutes;
        } catch (error) {
            console.error('Error parsing time:', error);
            return 0;
        }
    };

    const compareTimesInShift = (time1, time2, shiftStart, shiftEnd) => {
        const t1 = parseTimeToMinutes(time1);
        const t2 = parseTimeToMinutes(time2);
        const sStart = parseTimeToMinutes(shiftStart);
        const sEnd = parseTimeToMinutes(shiftEnd);
        
        if (sStart < sEnd) {
            return t1 - t2;
        }
        
        if (t1 >= sStart && t2 >= sStart) {
            return t1 - t2;
        }
        else if (t1 <= sEnd && t2 <= sEnd) {
            return t1 - t2;
        }
        else if (t1 >= sStart && t2 <= sEnd) {
            return -1; 
        } else {
            return 1; 
        }
    };
    
    const mergeOverlappingPeriods = (periods) => {
        
        if (!periods || !Array.isArray(periods)) {
            console.warn('Invalid input to mergeOverlappingPeriods');
            return [];
        }
        
       
        const validPeriods = periods.filter(p => 
            p && 
            typeof p.start === 'string' && 
            typeof p.end === 'string' && 
            p.start && 
            p.end
        );
        
        if (validPeriods.length === 0) {
            return [];
        }
        
        
        validPeriods.sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));
        
        const merged = [validPeriods[0]];
        
        for (let i = 1; i < validPeriods.length; i++) {
            const current = validPeriods[i];
            const last = merged[merged.length - 1];
            
            const currentStart = parseTimeToMinutes(current.start);
            const lastEnd = parseTimeToMinutes(last.end);
            const currentEnd = parseTimeToMinutes(current.end);
            
            
            if (currentStart <= lastEnd) {
               
                if (currentEnd > lastEnd) {
                    last.end = current.end;
                }
            } else {
                
                merged.push(current);
            }
        }
        
        console.log('Merged Periods:', merged);
        return merged;
    };

const splitPeriodAtBreaks = (period, breaks) => {
    console.log(`Splitting period ${period.start}-${period.end} with ${breaks.length} breaks`);
    
    if (!period || !period.start || !period.end || !Array.isArray(breaks)) return [period];
    if (!breaks.length) return [period];
    
    let periods = [period];
    
    // Sort breaks by start time to process them in order
    const sortedBreaks = [...breaks].sort((a, b) => 
        parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start)
    );
    
    sortedBreaks.forEach(breakPeriod => {
        if (!breakPeriod || !breakPeriod.start || !breakPeriod.end) return;
        
        console.log(`Processing break: ${breakPeriod.start}-${breakPeriod.end}`);
        
        const newPeriods = [];
        
        periods.forEach(p => {
            if (p.type === 'break') {
                // Don't split break periods
                newPeriods.push(p);
                return;
            }
            
            const pStart = parseTimeToMinutes(p.start);
            const pEnd = parseTimeToMinutes(p.end);
            const bStart = parseTimeToMinutes(breakPeriod.start);
            const bEnd = parseTimeToMinutes(breakPeriod.end);
            
            console.log(`Checking period ${p.start}-${p.end} against break ${breakPeriod.start}-${breakPeriod.end}`);
            
            // No overlap - keep original period
            if (bEnd <= pStart || bStart >= pEnd) {
                console.log('No overlap - keeping original period');
                newPeriods.push(p);
                return;
            }
            
            // Break completely contains the period
            if (bStart <= pStart && bEnd >= pEnd) {
                console.log('Break completely contains period - converting to break');
                newPeriods.push({
                    start: p.start,
                    end: p.end,
                    type: 'break',
                    data: { break: "Break" }
                });
                return;
            }
            
            // Break overlaps start of period
            if (bStart <= pStart && bEnd > pStart && bEnd < pEnd) {
                console.log('Break overlaps start of period');
                newPeriods.push({
                    start: p.start,
                    end: breakPeriod.end,
                    type: 'break',
                    data: { break: "Break" }
                });
                newPeriods.push({
                    start: breakPeriod.end,
                    end: p.end,
                    type: p.type,
                    data: { ...p.data } // PRESERVE ALL DATA
                });
                return;
            }
            
            // Break overlaps end of period
            if (bStart > pStart && bStart < pEnd && bEnd >= pEnd) {
                console.log('Break overlaps end of period');
                newPeriods.push({
                    start: p.start,
                    end: breakPeriod.start,
                    type: p.type,
                    data: { ...p.data } // PRESERVE ALL DATA
                });
                newPeriods.push({
                    start: breakPeriod.start,
                    end: p.end,
                    type: 'break',
                    data: { break: "Break" }
                });
                return;
            }
            
            // Break is in middle of period - CRITICAL FIX
            if (bStart > pStart && bEnd < pEnd) {
                console.log('Break in middle of period - splitting into 3 parts');
                console.log('Original period data:', p.data);
                
                // Part 1: Before break (preserve ALL original data)
                const beforeBreak = {
                    start: p.start,
                    end: breakPeriod.start,
                    type: p.type,
                    data: { ...p.data } // Deep copy all data
                };
                
                // Part 2: Break period
                const breakSegment = {
                    start: breakPeriod.start,
                    end: breakPeriod.end,
                    type: 'break',
                    data: { break: "Break" }
                };
                
                // Part 3: After break (preserve ALL original data)
                const afterBreak = {
                    start: breakPeriod.end,
                    end: p.end,
                    type: p.type,
                    data: { ...p.data } // Deep copy all data
                };
                
                console.log('Before break segment:', beforeBreak);
                console.log('Break segment:', breakSegment);
                console.log('After break segment:', afterBreak);
                
                newPeriods.push(beforeBreak, breakSegment, afterBreak);
                return;
            }
            
            // Default case - keep original period
            newPeriods.push(p);
        });
        
        periods = newPeriods;
        console.log(`After processing break, we now have ${periods.length} periods`);
    });
    
    // Filter out zero-length periods and ensure data is preserved
    return periods
        .filter(p => {
            const startMins = parseTimeToMinutes(p.start);
            const endMins = parseTimeToMinutes(p.end);
            return startMins !== endMins; // Remove zero-length periods
        })
        .map(p => {
            // Ensure all periods have proper data structure
            if (p.type === 'break') {
                return {
                    start: p.start,
                    end: p.end,
                    type: 'break',
                    data: { break: "Break" }
                };
            } else {
                return {
                    start: p.start,
                    end: p.end,
                    type: p.type || 'production',
                    // CRITICAL: Preserve all original data including queuedTime, dieSet, etc.
                    data: p.data || {}
                };
            }
        });
};

// Updated processTimePeriodsWithBreaks function with better data handling
const processTimePeriodsWithBreaks = (periods, breaks, shiftStartTime, shiftEndTime, isActual = false) => {
    console.log(`Processing Time Periods with Breaks:`, {
        isActual,
        shiftStartTime,
        shiftEndTime,
        periodsCount: periods.length,
        breaksCount: breaks.length
    });

    if (!Array.isArray(periods) || !Array.isArray(breaks)) {
        console.error('Invalid input: periods and breaks must be arrays');
        return [];
    }

    console.log(`Input periods for ${isActual ? 'actual' : 'plan'} processing:`, 
        periods.map(p => `${p.type || 'production'} ${p.start}-${p.end} ${p.data?.dieSet || ''}`));
    
    let processedPeriods = [];
    
    // Separate different types of periods
    const plannedStops = periods.filter(p => p.type === 'planned_stop');
    const breakPeriods = periods.filter(p => p.type === 'break');
    const productionPeriods = periods.filter(p => p.type !== 'planned_stop' && p.type !== 'break');
    
    console.log('Separated periods:', {
        production: productionPeriods.length,
        breaks: breakPeriods.length,
        plannedStops: plannedStops.length
    });
    
    // Process production periods by splitting them with breaks
    productionPeriods.forEach(period => {
        if (period && period.start && period.end) {
            console.log(`Processing production period: ${period.start}-${period.end} with data:`, period.data);
            
            // Apply breaks to split the production period
            const splitByBreaks = splitPeriodAtBreaks(period, breaks);
            console.log(`Split result:`, splitByBreaks.map(p => `${p.start}-${p.end} ${p.type || 'production'} data:${JSON.stringify(p.data)}`));
            
            processedPeriods.push(...splitByBreaks);
        }
    });
    
    // Add planned stops (they don't get split by breaks)
    processedPeriods.push(...plannedStops);
    
    // Sort periods chronologically
    if (shiftCrossesMidnight(shiftStartTime, shiftEndTime)) {
        processedPeriods.sort((a, b) => {
            return compareTimesInShift(a.start, b.start, shiftStartTime, shiftEndTime);
        });
    } else {
        processedPeriods.sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));
    }
    
    console.log(`Processed periods before filtering (${processedPeriods.length}):`, 
        processedPeriods.map(p => `${p.type || 'production'} ${p.start}-${p.end} ${p.data?.dieSet || ''}`));
    
    // Rest of the filtering logic...
    const shiftStart = parseTimeToMinutes(shiftStartTime);
    const shiftEnd = parseTimeToMinutes(shiftEndTime);
    const crossesMidnight = shiftCrossesMidnight(shiftStartTime, shiftEndTime);
    
    const overlapsWithShift = (periodStart, periodEnd) => {
        if (!crossesMidnight) {
            return (periodStart >= shiftStart && periodStart < shiftEnd) || 
                   (periodEnd > shiftStart && periodEnd <= shiftEnd) || 
                   (periodStart <= shiftStart && periodEnd >= shiftEnd);
        } else {
            if (periodStart > periodEnd) {
                return true; 
            }
            return periodStart >= shiftStart || 
                   periodEnd <= shiftEnd || 
                   (periodStart <= shiftStart && periodEnd >= shiftEnd);
        }
    };
    
    let filteredPeriods = processedPeriods
        .filter(period => {
            if (!period || !period.start || !period.end) return false;
            
            const periodStart = parseTimeToMinutes(period.start);
            const periodEnd = parseTimeToMinutes(period.end);
            
            if (periodStart === periodEnd) {
                console.log(`Skipping zero-length period: ${period.start}-${period.end}`);
                return false;
            }
            
            const overlap = overlapsWithShift(periodStart, periodEnd);
            return overlap;
        })
        .map(period => {
            let periodStart = typeof period.start === 'string' ? period.start : formatTime(period.start);
            let periodEnd = typeof period.end === 'string' ? period.end : formatTime(period.end);
            
            if (isActual && period.type !== 'break' && period.type !== 'planned_stop') {
                const periodStartMins = parseTimeToMinutes(periodStart);
                const shiftStartMins = parseTimeToMinutes(shiftStartTime);
                
                if (crossesMidnight) {
                    if ((periodStartMins < shiftStartMins && periodStartMins > shiftEnd)) {
                        periodStart = shiftStartTime;
                    }
                } else if (periodStartMins < shiftStartMins) {
                    periodStart = shiftStartTime;
                }
            }
            
            if (period.type === 'break') {
                return {
                    [`${isActual ? 'actual' : 'plan'}Start`]: periodStart,
                    [`${isActual ? 'actual' : 'plan'}End`]: periodEnd,
                    break: "Break"
                };
            }
            
            if (period.type === 'planned_stop') {
                return {
                    [`${isActual ? 'actual' : 'plan'}Start`]: periodStart,
                    [`${isActual ? 'actual' : 'plan'}End`]: periodEnd,
                    dieSet: "Planned Line Stop"
                };
            }
            
            // CRITICAL: Properly extract and preserve all data fields
            const result = {
                [`${isActual ? 'actual' : 'plan'}Start`]: periodStart,
                [`${isActual ? 'actual' : 'plan'}End`]: periodEnd
            };
            
            // Preserve queuedTime
            if (period.data?.queuedTime) {
                result.queuedTime = period.data.queuedTime;
            }
            
            // Preserve dieSet
            if (period.data?.dieSet) {
                result.dieSet = period.data.dieSet;
            }
            
            // Preserve lot sizes
            if (isActual && period.data?.actualLotSize) {
                result.actualLotSize = period.data.actualLotSize;
            }
            
            if (!isActual && period.data?.planLotSize) {
                result.planLotSize = period.data.planLotSize;
            }
            
            return result;
        })
        .filter(period => period !== null);
    
    // Remove duplicates
    const uniquePeriods = [];
    const seenKeys = new Set();
    
    filteredPeriods.forEach(period => {
        const startKey = isActual ? 'actualStart' : 'planStart';
        const endKey = isActual ? 'actualEnd' : 'planEnd';
        
        const periodKey = `${period[startKey]}-${period[endKey]}-${period.break ? 'break' : period.dieSet || 'production'}`;
        
        if (!seenKeys.has(periodKey)) {
            uniquePeriods.push(period);
            seenKeys.add(periodKey);
        }
    });
    
    console.log(`Final ${isActual ? 'actual' : 'plan'} periods after filtering (${uniquePeriods.length}):`, 
        uniquePeriods.map(p => {
            const startKey = isActual ? 'actualStart' : 'planStart';
            const endKey = isActual ? 'actualEnd' : 'planEnd';
            return `${p[startKey]}-${p[endKey]} ${p.dieSet || p.break || ''} queuedTime:${p.queuedTime || 'null'}`;
        }));
    
    return uniquePeriods;
};

    try {
        const { shiftName, skuCategoryCode } = await reUsableFun.getShiftAndSKUCategory(shift, line, config);
        await sql.connect(config);
 
        const request = new sql.Request();
        request.input('currentDate', sql.Date, new Date(currentDate))
            .input('currentTime', sql.Time, currentTime)
            .input('line', sql.Int, line)
            .input('shift', sql.Int, shift);

        const now = new Date();
        const realCurrentHrs = now.getHours().toString().padStart(2, '0');
        const realCurrentMins = now.getMinutes().toString().padStart(2, '0');
        const realCurrentTime = `${realCurrentHrs}:${realCurrentMins}`;

        const shiftTimesQuery = `
            SELECT [ShiftId], [ShiftStartTime], [ShiftEndTime]
            FROM [dbo].[ShiftHeader]
            WHERE [ShiftId] = @shift`;

        const shiftDetails = await request.query(shiftTimesQuery);

        if (shiftDetails.recordset.length === 0) {
            throw new Error('No shift data found');
        }

        const currentShiftTimes = shiftDetails.recordset[0];
        let shiftStartTime = formatTime(currentShiftTimes.ShiftStartTime);
        let shiftEndTime = formatTime(currentShiftTimes.ShiftEndTime);
        const crossesMidnight = shiftCrossesMidnight(shiftStartTime, shiftEndTime);

        console.log(`Original shift times: Start=${shiftStartTime}, End=${shiftEndTime}, Crosses midnight=${crossesMidnight}`);

        const plannedLineStopsQuery = crossesMidnight ? 
            `SELECT 
                FORMAT(FromDateTime, 'HH:mm') as FromTime,
                FORMAT(ToDateTime, 'HH:mm') as ToTime
            FROM [SSPCSdbo].[PlannedLineStopMaster]
            WHERE [LineID] = @line 
            AND [ShiftID] = @shift
            AND (CAST([FromDateTime] AS DATE) = @currentDate 
                OR CAST([FromDateTime] AS DATE) = DATEADD(day, 1, @currentDate))
            AND [isActive] = 1` :
            `SELECT 
                FORMAT(FromDateTime, 'HH:mm') as FromTime,
                FORMAT(ToDateTime, 'HH:mm') as ToTime
            FROM [SSPCSdbo].[PlannedLineStopMaster]
            WHERE [LineID] = @line 
            AND [ShiftID] = @shift
            AND CAST([FromDateTime] AS DATE) = @currentDate
            AND [isActive] = 1`;

        const plannedLineStopsResult = await request.query(plannedLineStopsQuery);
        
        const plannedLineStops = mergeOverlappingPeriods(
            plannedLineStopsResult.recordset
                .filter(stop => stop.FromTime && stop.ToTime)
                .map(stop => ({
                    start: formatTime(stop.FromTime) || '00:00',
                    end: formatTime(stop.ToTime) || '00:00',
                    type: 'planned_stop'
                }))
        );

        const overtimeQuery = crossesMidnight ?
            `SELECT [FromTime], [ToTime]
            FROM [dbo].[OverTime] WITH(NOLOCK)
            WHERE [ShiftId] = @shift
            AND (CAST([Date] AS DATE) = CAST(@currentDate AS DATE)
                OR CAST([Date] AS DATE) = DATEADD(day, 1, CAST(@currentDate AS DATE)))` :
            `SELECT [FromTime], [ToTime]
            FROM [dbo].[OverTime] WITH(NOLOCK)
            WHERE [ShiftId] = @shift
            AND CAST([Date] AS DATE) = CAST(@currentDate AS DATE)`;

        const overtimeResult = await request.query(overtimeQuery);
        const timeSlotDetails = [];

        if (overtimeResult.recordset.length > 0) {
            overtimeResult.recordset.forEach(overtime => {
                const startTime = formatTime(overtime.FromTime);
                const endTime = formatTime(overtime.ToTime);
                
                if (startTime && endTime) {
                    shiftStartTime = startTime;
                    shiftEndTime = endTime;
                    timeSlotDetails.push({ startTime, endTime });
                }
            });
            console.log(`Shift times modified by overtime: Start=${shiftStartTime}, End=${shiftEndTime}`);
        } else {
            timeSlotDetails.push({
                startTime: shiftStartTime,
                endTime: shiftEndTime
            });
        }

const breakTimesQuery = `
    SELECT [ShiftId], [ShiftSequence], [OperationStartTime], [OperationEndTime]
    FROM [dbo].[ShiftLine]
    WHERE [ShiftId] = @shift
    ORDER BY ShiftSequence ASC`;

const breakTimesResult = await request.query(breakTimesQuery);
const breakTimes = [];

// Sort the results by chronological order considering midnight crossing
const sortedBreakTimes = [...breakTimesResult.recordset].sort((a, b) => {
    const aStart = formatTime(a.OperationStartTime);
    const bStart = formatTime(b.OperationStartTime);
    
    if (crossesMidnight) {
        return compareTimesInShift(aStart, bStart, shiftStartTime, shiftEndTime);
    } else {
        return parseTimeToMinutes(aStart) - parseTimeToMinutes(bStart);
    }
});

console.log('Original break times from DB:', breakTimesResult.recordset.map(bt => 
    `Seq ${bt.ShiftSequence}: ${formatTime(bt.OperationStartTime)}-${formatTime(bt.OperationEndTime)}`
));

console.log('Sorted break times:', sortedBreakTimes.map(bt => 
    `Seq ${bt.ShiftSequence}: ${formatTime(bt.OperationStartTime)}-${formatTime(bt.OperationEndTime)}`
));

for (let i = 0; i < sortedBreakTimes.length - 1; i++) {
    const current = sortedBreakTimes[i];
    const next = sortedBreakTimes[i + 1];
    const currentEnd = formatTime(current.OperationEndTime);
    const nextStart = formatTime(next.OperationStartTime);
   
    console.log(`Checking gap between: ${currentEnd} and ${nextStart}`);
    
    if (currentEnd && nextStart) {
        const currentEndMins = parseTimeToMinutes(currentEnd);
        const nextStartMins = parseTimeToMinutes(nextStart);
        
        // Check if there's a gap between current end and next start
        let hasGap = false;
        
        if (crossesMidnight) {
            // For midnight crossing shifts, handle different scenarios
            const shiftStartMins = parseTimeToMinutes(shiftStartTime);
            const shiftEndMins = parseTimeToMinutes(shiftEndTime);
            
            // Both times are in the "after midnight" part of the shift
            if (currentEndMins <= shiftEndMins && nextStartMins <= shiftEndMins) {
                hasGap = nextStartMins > currentEndMins;
            }
            // Both times are in the "before midnight" part of the shift  
            else if (currentEndMins >= shiftStartMins && nextStartMins >= shiftStartMins) {
                hasGap = nextStartMins > currentEndMins;
            }
            // Current ends in "after midnight", next starts in "before midnight" - this is a big gap
            else if (currentEndMins <= shiftEndMins && nextStartMins >= shiftStartMins) {
                hasGap = true;
            }
            // Current ends in "before midnight", next starts in "after midnight" - consecutive across midnight
            else if (currentEndMins >= shiftStartMins && nextStartMins <= shiftEndMins) {
                // Only a gap if they're not exactly at midnight boundary
                hasGap = !(currentEndMins === 1440 && nextStartMins === 0) && 
                        !(currentEnd === "00:00" && nextStart === "00:00");
            }
        } else {
            hasGap = nextStartMins > currentEndMins;
        }
        
        if (hasGap && currentEnd !== nextStart) {
            console.log(`Found break: ${currentEnd} to ${nextStart}`);
            breakTimes.push({
                start: currentEnd,
                end: nextStart
            });
        } else {
            console.log(`No gap: ${currentEnd} to ${nextStart} (hasGap: ${hasGap})`);
        }
    }
}

console.log('Final detected break times:', breakTimes);


        const planPeriods = [];
        const actualPeriods = [];
        const processedStops = new Set();

        const productionQuery = crossesMidnight ?
            `WITH ShiftStartTime AS (
                SELECT CAST(
                    CONVERT(VARCHAR(20), CAST(@currentDate AS DATE), 120) + ' ' + 
                    CONVERT(VARCHAR(8), [ShiftStartTime], 108)
                    AS DATETIME
                ) as ShiftStart
                FROM [dbo].[ShiftHeader] 
                WHERE [ShiftId] = @shift
            )
            SELECT
                p.[DieSetID],
                p.[PlanStartTime],
                p.[PlanEndTime],
                p.[ActualStartTime],
                p.[ActualEndTime],
                p.[Status],
                p.[Date],
                p.[LineID],
                p.[ShiftID],
                p.[PlanLotSize],
                p.[ActualLotsize],
                p.[QueuedTime]
            FROM [SSPCSdbo].[PatternActualData] p
            CROSS JOIN ShiftStartTime st
            WHERE (p.[Date] = @currentDate OR p.[Date] = DATEADD(day, 1, @currentDate))
            AND p.[LineID] = @line
            AND p.[ShiftID] = @shift
            ORDER BY p.PlanStartTime ASC` :
            `WITH ShiftStartTime AS (
                SELECT CAST(
                    CONVERT(VARCHAR(20), CAST(@currentDate AS DATE), 120) + ' ' + 
                    CONVERT(VARCHAR(8), [ShiftStartTime], 108)
                    AS DATETIME
                ) as ShiftStart
                FROM [dbo].[ShiftHeader] 
                WHERE [ShiftId] = @shift
            )
            SELECT
                p.[DieSetID],
                p.[PlanStartTime],
                p.[PlanEndTime],
                p.[ActualStartTime],
                p.[ActualEndTime],
                p.[Status],
                p.[Date],
                p.[LineID],
                p.[ShiftID],
                p.[PlanLotSize],
                p.[ActualLotsize],
                p.[QueuedTime]
            FROM [SSPCSdbo].[PatternActualData] p
            CROSS JOIN ShiftStartTime st
            WHERE p.[Date] = @currentDate
            AND p.[LineID] = @line
            AND p.[ShiftID] = @shift
            ORDER BY p.PlanStartTime ASC`;

        const productionResult = await request.query(productionQuery);

        console.log('Production records from database:');
        productionResult.recordset.forEach((row, index) => {
            console.log(`Record ${index}: DieSetID=${row.DieSetID}, PlanStart=${formatTime(row.PlanStartTime)}, PlanEnd=${formatTime(row.PlanEndTime)}, Status=${row.Status}`);
            console.log(`  ActualStart=${formatTime(row.ActualStartTime)}, ActualEnd=${formatTime(row.ActualEndTime)}`);
        });

        const scheduledDieSets = new Set();

        for (const row of productionResult.recordset) {
            if (row.PlanStartTime && row.PlanEndTime) {
                scheduledDieSets.add(row.DieSetID);
            }
        }
        
        for (const row of productionResult.recordset) {
            if (row.Status === 3 || (row.Status === 5 && !row.ActualStartTime)) {
                console.log(`Skipping record with Status ${row.Status} for DieSetID ${row.DieSetID}`);
                continue;
            }
        
            const { bomType } = await reUsableFun.getBOMTypeDetails(row.DieSetID);
        
            let planStart = formatTime(row.PlanStartTime);
            let planEnd = formatTime(row.PlanEndTime);
            let actualStart = formatTime(row.ActualStartTime);
            let actualEnd = formatTime(row.ActualEndTime);
            let queuedTime = formatTime(row.QueuedTime);
        
            console.log(`Processing production record: ${row.DieSetID}`, {
                status: row.Status,
                planStart,
                planEnd,
                actualStart,
                actualEnd,
                queuedTime
            });
        
            if (planStart && planEnd) {
                const planStartMins = parseTimeToMinutes(planStart);
                const planEndMins = parseTimeToMinutes(planEnd);
                
                const validPlanPeriod = !crossesMidnight ? 
                    (planEndMins > planStartMins) : 
                    (planEndMins > planStartMins || isTimeInShift(planStart, shiftStartTime, shiftEndTime));
                
                if (validPlanPeriod) {
                    planPeriods.push({
                        start: planStart,
                        end: planEnd,
                        type: 'production',
                        data: {
                            dieSet: bomType,
                            planLotSize: row.PlanLotSize ? `Qty- ${row.PlanLotSize}` : null,
                            queuedTime: queuedTime || null
                        }
                    });
                }
            }
            if (row.Status === 4 && actualStart) {
                console.log('Processing Status 4 Record:', {
                    originalActualStart: actualStart,
                    originalActualEnd: actualEnd,
                    shiftStartTime: shiftStartTime,
                    planStart: planStart,
                    planEnd: planEnd,
                    dieSet: bomType
                });

                if (crossesMidnight) {
                    const actualStartMins = parseTimeToMinutes(actualStart);
                    const shiftStartMins = parseTimeToMinutes(shiftStartTime);
                    const shiftEndMins = parseTimeToMinutes(shiftEndTime);
                    
                    if (!(actualStartMins >= shiftStartMins || actualStartMins <= shiftEndMins)) {
                        console.log(`REPLACING actual start time from ${actualStart} to ${shiftStartTime} (shift crossing midnight)`);
                        actualStart = shiftStartTime;
                    }
                } else {
                    if (parseTimeToMinutes(actualStart) < parseTimeToMinutes(shiftStartTime)) {
                        console.log(`REPLACING actual start time from ${actualStart} to ${shiftStartTime}`);
                        actualStart = shiftStartTime;
                    }
                }

                if (!actualEnd) {
                    actualEnd = realCurrentTime;
                }

                actualPeriods.push({
                    start: actualStart,
                    end: actualEnd,
                    type: 'production',
                    data: {
                        dieSet: bomType,
                        actualLotSize: row.ActualLotsize ? `Qty- ${row.ActualLotsize}` : null,
                        queuedTime: queuedTime || null
                    }
                });
            }

            if (row.Status === 5 && actualStart) {
                console.log('Processing Status 5 Record:', {
                    originalActualStart: actualStart,
                    originalActualEnd: actualEnd,
                    shiftStartTime: shiftStartTime,
                    planStart: planStart,
                    planEnd: planEnd,
                    dieSet: bomType
                });

                if (crossesMidnight) {
                    const actualStartMins = parseTimeToMinutes(actualStart);
                    const actualEndMins = actualEnd ? parseTimeToMinutes(actualEnd) : null;
                    const shiftStartMins = parseTimeToMinutes(shiftStartTime);
                    const shiftEndMins = parseTimeToMinutes(shiftEndTime);

                    if (actualEndMins !== null && 
                        !((actualStartMins >= shiftStartMins || actualStartMins <= shiftEndMins) || 
                          (actualEndMins >= shiftStartMins || actualEndMins <= shiftEndMins))) {
                        
                        console.log(`Both actual start (${actualStart}) and end (${actualEnd}) are outside shift range`);
                        console.log(`Using plan times instead: start=${planStart}, end=${planEnd}`);
                        

                        actualStart = planStart;
                        actualEnd = planEnd;
                    } else {

                        if (!(actualStartMins >= shiftStartMins || actualStartMins <= shiftEndMins)) {
                            console.log(`REPLACING actual start time from ${actualStart} to ${shiftStartTime} (shift crossing midnight)`);
                            actualStart = shiftStartTime;
                        }

                        if (!actualEnd) {
                            actualEnd = realCurrentTime;
                        }
                    }
                } else {

                    if (actualEnd && 
                        parseTimeToMinutes(actualStart) < parseTimeToMinutes(shiftStartTime) && 
                        parseTimeToMinutes(actualEnd) < parseTimeToMinutes(shiftStartTime)) {
                        
                        console.log(`Both actual start (${actualStart}) and end (${actualEnd}) are before shift start (${shiftStartTime})`);
                        console.log(`Using plan times instead: start=${planStart}, end=${planEnd}`);
                        

                        actualStart = planStart;
                        actualEnd = planEnd;
                    } else {

                        if (parseTimeToMinutes(actualStart) < parseTimeToMinutes(shiftStartTime)) {
                            console.log(`REPLACING actual start time from ${actualStart} to ${shiftStartTime}`);
                            actualStart = shiftStartTime;
                        }

                        if (!actualEnd) {
                            actualEnd = realCurrentTime;
                        }
                    }
                }

                actualPeriods.push({
                    start: actualStart,
                    end: actualEnd,
                    type: 'production',
                    data: {
                        dieSet: bomType,
                        actualLotSize: row.ActualLotsize ? `Qty- ${row.ActualLotsize}` : null,
                        queuedTime: queuedTime || null
                    }
                });
            }


            if (row.Status === 6 && actualStart && actualEnd) {
                console.log('Processing Status 6 Record:', {
                    originalActualStart: actualStart,
                    originalActualEnd: actualEnd,
                    shiftStartTime: shiftStartTime,
                    planStart: planStart,
                    planEnd: planEnd,
                    dieSet: bomType
                });

                if (crossesMidnight) {
                    const actualStartMins = parseTimeToMinutes(actualStart);
                    const actualEndMins = parseTimeToMinutes(actualEnd);
                    const shiftStartMins = parseTimeToMinutes(shiftStartTime);
                    const shiftEndMins = parseTimeToMinutes(shiftEndTime);

                    if (!((actualStartMins >= shiftStartMins || actualStartMins <= shiftEndMins) || 
                          (actualEndMins >= shiftStartMins || actualEndMins <= shiftEndMins))) {
                        
                        console.log(`Both actual start (${actualStart}) and end (${actualEnd}) are outside shift range`);
                        console.log(`Using plan times instead: start=${planStart}, end=${planEnd}`);
                        
                        actualStart = planStart;
                        actualEnd = planEnd;
                    } else {
                        if (!(actualStartMins >= shiftStartMins || actualStartMins <= shiftEndMins)) {
                            console.log(`REPLACING actual start time from ${actualStart} to ${shiftStartTime} (shift crossing midnight)`);
                            actualStart = shiftStartTime;
                        }
                    }
                } else {

                    if (parseTimeToMinutes(actualStart) < parseTimeToMinutes(shiftStartTime) && 
                        parseTimeToMinutes(actualEnd) < parseTimeToMinutes(shiftStartTime)) {
                        
                        console.log(`Both actual start (${actualStart}) and end (${actualEnd}) are before shift start (${shiftStartTime})`);
                        console.log(`Using plan times instead: start=${planStart}, end=${planEnd}`);

                        actualStart = planStart;
                        actualEnd = planEnd;
                    } else {
    
                        if (parseTimeToMinutes(actualStart) < parseTimeToMinutes(shiftStartTime)) {
                            console.log(`REPLACING actual start time from ${actualStart} to ${shiftStartTime}`);
                            actualStart = shiftStartTime;
                        }
                    }
                }

                actualPeriods.push({
                    start: actualStart,
                    end: actualEnd,
                    type: 'production',
                    data: {
                        dieSet: bomType,
                        actualLotSize: row.ActualLotsize ? `Qty- ${row.ActualLotsize}` : null,
                        queuedTime: queuedTime || null
                    }
                });
            }
        }

        plannedLineStops.forEach(stop => {
            const stopId = `${stop.start}-${stop.end}`;
            
            if (!processedStops.has(stopId)) {
                planPeriods.push({
                    start: stop.start,
                    end: stop.end,
                    type: 'planned_stop',
                    data: { dieSet: "Planned Line Stop" }
                });
                processedStops.add(stopId);
            }
            let stopInProgress = false;
            const stopStartMins = parseTimeToMinutes(stop.start);
            const stopEndMins = parseTimeToMinutes(stop.end);
            const realCurrentMins = parseTimeToMinutes(realCurrentTime);

            if (crossesMidnight) {
                if (stopStartMins > stopEndMins) {
                    stopInProgress = (realCurrentMins >= stopStartMins || realCurrentMins <= stopEndMins);
                } else {
                    stopInProgress = realCurrentMins >= stopStartMins && realCurrentMins <= stopEndMins;
                }
            } else {
                stopInProgress = realCurrentMins >= stopStartMins && realCurrentMins <= stopEndMins;
            }

            if (stopInProgress) {
                actualPeriods.push({
                    start: stop.start,
                    end: realCurrentTime,
                    type: 'planned_stop',
                    data: { dieSet: "Planned Line Stop" }
                });
            } else if ((crossesMidnight && (
                        (realCurrentMins > stopEndMins && stopEndMins < parseTimeToMinutes(shiftEndTime)) || 
                        (realCurrentMins < stopStartMins && realCurrentMins > parseTimeToMinutes(shiftStartTime) && stopEndMins < parseTimeToMinutes(shiftEndTime))
                    )) || 
                    (!crossesMidnight && realCurrentMins > stopEndMins)) {
                actualPeriods.push({
                    start: stop.start,
                    end: stop.end,
                    type: 'planned_stop',
                    data: { dieSet: "Planned Line Stop" }
                });
            }
        });
        

        if (crossesMidnight) {
            planPeriods.sort((a, b) => compareTimesInShift(a.start, b.start, shiftStartTime, shiftEndTime));
            actualPeriods.sort((a, b) => compareTimesInShift(a.start, b.start, shiftStartTime, shiftEndTime));
        } else {
            planPeriods.sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));
            actualPeriods.sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));
        }

        const formattedBreaks = breakTimes.map(breakTime => {
            const start = typeof breakTime.start === 'string' ? breakTime.start : formatTime(breakTime.start);
            const end = typeof breakTime.end === 'string' ? breakTime.end : formatTime(breakTime.end);
            
            return start && end ? { start, end } : null;
        }).filter(breakTime => breakTime !== null);
        

        formattedBreaks.forEach(breakTime => {
              console.log(`Processing break: ${breakTime.start} - ${breakTime.end}`);
            const breakStartMins = parseTimeToMinutes(breakTime.start);
            const breakEndMins = parseTimeToMinutes(breakTime.end);
            const shiftStartMins = parseTimeToMinutes(shiftStartTime);
            const shiftEndMins = parseTimeToMinutes(shiftEndTime);
            console.log(`Break mins: ${breakStartMins}-${breakEndMins}, Shift mins: ${shiftStartMins}-${shiftEndMins}`);
            
            let breakInShift = false;
            
            if (crossesMidnight) {

                breakInShift = (breakStartMins >= shiftStartMins || breakStartMins <= shiftEndMins) ||
                              (breakEndMins >= shiftStartMins || breakEndMins <= shiftEndMins);
            } else {
                breakInShift = breakEndMins > shiftStartMins && breakStartMins < shiftEndMins;
            }
            
            if (breakInShift) {
                planPeriods.push({
                    start: breakTime.start,
                    end: breakTime.end,
                    type: 'break',
                    data: { break: "Break" }
                });
        
                const realCurrentMins = parseTimeToMinutes(realCurrentTime);
                let breakStarted = false;
                
                if (crossesMidnight) {
                    breakStarted = (breakStartMins >= shiftStartMins && realCurrentMins >= breakStartMins) ||
                                 (breakStartMins <= shiftEndMins && realCurrentMins >= breakStartMins && realCurrentMins <= shiftEndMins) ||
                                 (breakStartMins >= shiftStartMins && realCurrentMins <= shiftEndMins);
                } else {
                    breakStarted = realCurrentMins > breakStartMins;
                }
                
                if (breakStarted) {
                    const realCurrentMins = parseTimeToMinutes(realCurrentTime);
                    let actualBreakEnd = breakTime.end;
                    
                    if (crossesMidnight) {
                        if ((breakEndMins <= shiftEndMins && realCurrentMins <= breakEndMins) ||
                            (breakEndMins >= shiftStartMins && realCurrentMins <= breakEndMins && realCurrentMins >= shiftStartMins)) {
                            actualBreakEnd = realCurrentTime;
                        }
                    } else if (realCurrentMins < breakEndMins) {
                        actualBreakEnd = realCurrentTime;
                    }
                    
                    actualPeriods.push({
                        start: breakTime.start,
                        end: actualBreakEnd,
                        type: 'break',
                        data: { break: "Break" }
                    });
                }
            }
        });
        
        const processedPlanData = processTimePeriodsWithBreaks(
            planPeriods,
            formattedBreaks,
            shiftStartTime,
            shiftEndTime,
            false
        );
        console.log('About to process periods with breaks:');
console.log('Breaks to apply:', formattedBreaks);
console.log('Production periods to split:', actualPeriods.filter(p => p.type !== 'break'));
        const processedActualData = processTimePeriodsWithBreaks(
            actualPeriods,
            formattedBreaks,
            shiftStartTime,
            shiftEndTime,
            true
        );
        
        console.log(`Generated ${processedActualData.length} processed actual periods`);


        if (processedActualData.length === 0) {
            console.log("No actual data found. Checking if any actual data exists in database before adding defaults.");
            
            const hasInProgressProduction = productionResult.recordset.some(row => row.Status === 4);
            
            if (hasInProgressProduction) {
                console.log("Found Status 4 records in database, generating actual data");
                
                const currentTimeMins = parseTimeToMinutes(realCurrentTime);
                const shiftStartMins = parseTimeToMinutes(shiftStartTime);

                let plannedDieSet = "Idle";


                for (const planPeriod of processedPlanData) {
                    const planStartMins = parseTimeToMinutes(planPeriod.planStart);
                    const planEndMins = parseTimeToMinutes(planPeriod.planEnd);
                    
                    let periodActive = false;
                    
                    if (crossesMidnight) {
                        if (planStartMins > planEndMins) {

                            periodActive = (currentTimeMins >= planStartMins || currentTimeMins <= planEndMins);
                        } else {

                            if (planStartMins >= parseTimeToMinutes(shiftStartTime)) {

                                periodActive = currentTimeMins >= planStartMins || 
                                             (currentTimeMins <= planEndMins && currentTimeMins <= parseTimeToMinutes(shiftEndTime));
                            } else {

                                periodActive = currentTimeMins >= planStartMins && currentTimeMins <= planEndMins;
                            }
                        }
                    } else {

                        periodActive = currentTimeMins >= planStartMins && currentTimeMins <= planEndMins;
                    }
                    
                    if (periodActive && planPeriod.dieSet && !planPeriod.break) {
                        plannedDieSet = planPeriod.dieSet;
                        console.log(`Found planned die set for current time: ${plannedDieSet}`);
                        break;
                    }
                }

                processedActualData.push({
                    actualStart: shiftStartTime,
                    actualEnd: realCurrentTime,
                    dieSet: plannedDieSet,
                    actualLotSize: null
                });


                formattedBreaks.forEach(breakTime => {
                    const breakStartMins = parseTimeToMinutes(breakTime.start);
                    const breakEndMins = parseTimeToMinutes(breakTime.end);
                    const realCurrentMins = parseTimeToMinutes(realCurrentTime);
                    
                    let breakStarted = false;
                    
                    if (crossesMidnight) {
                        breakStarted = (breakStartMins >= parseTimeToMinutes(shiftStartTime) && realCurrentMins >= breakStartMins) ||
                                     (breakStartMins <= parseTimeToMinutes(shiftEndTime) && realCurrentMins >= breakStartMins && realCurrentMins <= parseTimeToMinutes(shiftEndTime)) ||
                                     (breakStartMins >= parseTimeToMinutes(shiftStartTime) && realCurrentMins <= parseTimeToMinutes(shiftEndTime));
                    } else {
                        breakStarted = realCurrentMins > breakStartMins;
                    }
                    
                    if (breakStarted) {
                        const actualBreakEnd = crossesMidnight ?
                            ((breakEndMins <= parseTimeToMinutes(shiftEndTime) && realCurrentMins <= breakEndMins) || 
                            (breakEndMins >= parseTimeToMinutes(shiftStartTime) && realCurrentMins <= breakEndMins)) ? 
                            realCurrentTime : breakTime.end :
                            (realCurrentMins < breakEndMins) ? realCurrentTime : breakTime.end;
                        
                        processedActualData.push({
                            actualStart: breakTime.start,
                            actualEnd: actualBreakEnd,
                            break: "Break"
                        });
                    }
                });


                if (crossesMidnight) {
                    processedActualData.sort((a, b) => {
                        const aStart = parseTimeToMinutes(a.actualStart);
                        const bStart = parseTimeToMinutes(b.actualStart);
                        return compareTimesInShift(a.actualStart, b.actualStart, shiftStartTime, shiftEndTime);
                    });
                } else {
                    processedActualData.sort((a, b) => 
                        parseTimeToMinutes(a.actualStart) - parseTimeToMinutes(b.actualStart)
                    );
                }
            } else {
                console.log("No Status 4 records found in database, not generating default actual data");
            }
        } else {
            let actualBreakTimes = processedActualData.filter(p => p.break === "Break");
            if (actualBreakTimes.length === 0) {
                console.log("No breaks found in processed actual data, adding them now");
                
                formattedBreaks.forEach(breakTime => {
                    const breakStartMins = parseTimeToMinutes(breakTime.start);
                    const breakEndMins = parseTimeToMinutes(breakTime.end);
                    const realCurrentMins = parseTimeToMinutes(realCurrentTime);
                    
                    let breakStarted = false;
                    
                    if (crossesMidnight) {
                        breakStarted = (breakStartMins >= parseTimeToMinutes(shiftStartTime) && realCurrentMins >= breakStartMins) ||
                                     (breakStartMins <= parseTimeToMinutes(shiftEndTime) && realCurrentMins >= breakStartMins && realCurrentMins <= parseTimeToMinutes(shiftEndTime)) ||
                                     (breakStartMins >= parseTimeToMinutes(shiftStartTime) && realCurrentMins <= parseTimeToMinutes(shiftEndTime));
                    } else {
                        breakStarted = realCurrentMins > breakStartMins;
                    }
                    
                    if (breakStarted) {
                        const actualBreakEnd = crossesMidnight ?
                            ((breakEndMins <= parseTimeToMinutes(shiftEndTime) && realCurrentMins <= breakEndMins) || 
                            (breakEndMins >= parseTimeToMinutes(shiftStartTime) && realCurrentMins <= breakEndMins)) ? 
                            realCurrentTime : breakTime.end :
                            (realCurrentMins < breakEndMins) ? realCurrentTime : breakTime.end;
                        
                        processedActualData.push({
                            actualStart: breakTime.start,
                            actualEnd: actualBreakEnd,
                            break: "Break"
                        });
                    }
                });
                
                if (crossesMidnight) {
                    processedActualData.sort((a, b) => compareTimesInShift(a.actualStart, b.actualStart, shiftStartTime, shiftEndTime));
                } else {
                    processedActualData.sort((a, b) => 
                        parseTimeToMinutes(a.actualStart) - parseTimeToMinutes(b.actualStart)
                    );
                }
            }
        }
        console.log('Detected break times:', breakTimes);
console.log('Formatted breaks:', formattedBreaks);

        console.log('Final plan data:', processedPlanData.map(p => `${p.planStart}-${p.planEnd} ${p.dieSet || p.break || ''}`));
        console.log('Final actual data:', processedActualData.map(p => `${p.actualStart}-${p.actualEnd} ${p.dieSet || p.break || ''}`));

        const response = {
            header: {
                currentDate,
                currentTime: realCurrentTime,
                line: skuCategoryCode,
                shift: shiftName,
                lineID: line
            },
            timeSlot: timeSlotDetails,
            planData: processedPlanData,
            actualData: processedActualData
        };

        console.log(`Sending response with ${response.planData.length} plan records and ${response.actualData.length} actual records`);
        res.json(response);

    } catch (error) {
        console.error('Error in productionLoadTimeChart:', error);
        res.status(500).send(`Error processing production load time chart: ${error.message}`);
    }
}; 



