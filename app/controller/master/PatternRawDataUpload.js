const sql = require('mssql/msnodesqlv8');
const path = require('path');
const constant = require('../../config/constant');
const logger = require("../../utils/logger");
const reUsableFun = require("../../utils/reUsableFun");
const csv = require('csv-parser');
const { Readable } = require('stream');
const config = require("../../config/dbConfig");
exports.CSVPatternUpload = async (req, res) => {
    // Checking the file availability
    console.log('upload started!');
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
        const savePath = path.join(constant.patternRawDataUpload + '/_' + reUsableFun.getFormattedDate() + "_" + filename);
        const results = [];
        let headers = [];
        // Path to save the uploaded file.
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
                const mandatoryFields = ['LineName', 'PatternNo', 'PartSeq', 'DieSet', 'LotCycle', 'PatternLotSize','AppendOrOverwrite', 'EffectiveFrom', 'TotalMaterialKanbanInCirculation']
                //const mandatoryFields = ['LineName', 'PatternNo', 'PartSeq', 'DieSet', 'LotCycle', 'PatternLotSize', 'SPS', 'AppendOrOverwrite', 'EffectiveFrom', 'TotalMaterialKanbanInCirculation']
                const missingFields = mandatoryFields.filter(field => !headers.includes(field));

                if (missingFields.length) {
                    return res.send(`Missing Headers:  ` + missingFields.join(', ') + " " + constant.missingColumn);
                }
                const bodyData = results.map(el => ({
                    LineName: el['LineName'],
                    EffectiveFrom: reUsableFun.convertDateDDMMYYtoYYMMDD(el['EffectiveFrom']),
                    PatternNo: el['PatternNo'],
                    PartSeq: Number(el['PartSeq'] === '' ? undefined : el['PartSeq']),
                    DieSet: el['DieSet'].trim(),
                    LotCycle: Number(el['LotCycle'] === '' ? undefined : el['LotCycle']),
                    PatternLotSize: Number(el['PatternLotSize'] === '' ? undefined : el['PatternLotSize']),
                   // SPS: Number(el['SPS'] === '' ? undefined : el['SPS']),
                    AppendOrOverwrite: el['AppendOrOverwrite'],
                    TotalMaterialKanbanInCirculation: Number(el['TotalMaterialKanbanInCirculation'] === '' ? undefined : el['TotalMaterialKanbanInCirculation'])
                }));
                await uploadExcelDataToDb(bodyData, res, savePath, mandatoryFields, palmsid);
            });
    } catch (error) {
        logger.customerLogger.error('Unexpected error:', error);
        return res.send(error.message);
    }
};
async function uploadExcelDataToDb(body1, res, savePath, mandatoryFields, palmsid) {
    const pool = await sql.connect(config);
    await pool.connect();

    // Query to get SKUCategoryCode list and existing plan EffectiveTo
    const query1 = `               
           WITH SKUCategoryCTE AS (
                SELECT DISTINCT SKUCategoryCode, SKUCategoryID 
                FROM SKUCategory
            ), EffectiveToCTE AS (
                SELECT TOP 1 ScheduledDate 
                FROM SSPCSdbo.PatternDataInterpretation WHERE LineID=(SELECT TOP(1) SKUCategoryID FROM SKUCategory WHERE SKUCategoryCode=@LineName)
                ORDER BY ScheduledDate DESC
            )
            SELECT  s.SKUCategoryCode, s.SKUCategoryID, e.ScheduledDate FROM SKUCategoryCTE s LEFT JOIN EffectiveToCTE e ON 1 = 1;`;
    const SKUCategoryResult = await pool.request()
        .input("LineName", sql.NVarChar, body1[0].LineName)
        .query(query1);
    let SKUCategoryList = [], EffectiveToFromPattern;
    if (SKUCategoryResult.recordset.length > 0) {
        SKUCategoryResult.recordset.forEach((el, index) => {
            SKUCategoryList.push(el.SKUCategoryCode);
        })
        EffectiveToFromPattern = SKUCategoryResult.recordset[0].ScheduledDate
    }
    let date = body1[0].EffectiveFrom;
    // Acceptable data types for each header in a CSV file
    let mandatoryFieldDataTypes = ['string', 'string', "integer", "string", "integer", "integer", "string", "dateOnly", "integer"];
    const specificValueChecks = {
        LineName: SKUCategoryList,
        PatternNo: constant.PatternName,
        AppendOrOverwrite: constant.AppendOrOverwrite
    };
    // Function to validate each row for correct data types, value constraints, and nullability of each column.
    const invalidColumnCheck = await reUsableFun.checkInvalidColumn(body1, mandatoryFields, mandatoryFieldDataTypes, specificValueChecks);
    if (invalidColumnCheck) {
        return res.send(invalidColumnCheck.error + constant.missingColumn);
    }
    let pqDiesetInfoWithDate = body1[0].EffectiveFrom;
    pqDiesetInfoWithDate = await reUsableFun.getNextWorkngDay(pqDiesetInfoWithDate, body1[0].LineName, config);
    // handling AppendOrOverwrite Flag
    if (body1[0].AppendOrOverwrite === "Append") {
        if (EffectiveToFromPattern !== null) {
            EffectiveToFromPattern = new Date(EffectiveToFromPattern);
            let isValid = reUsableFun.isDateGreater(EffectiveToFromPattern);
            if (isValid) {
                date = EffectiveToFromPattern;
                date.setDate(date.getDate() + 1);
                let chechDateIsWorking = await reUsableFun.checkHolidyForEntirePlan(date, 0, 0, body1[0].LineName, config);
                if (typeof (chechDateIsWorking) === 'string') {
                    return res.send(chechDateIsWorking)
                }
                date = await reUsableFun.getNextWorkngDay(date, body1[0].LineName, config);
            }
            // EffectiveFrom verification once EffectiveFrom is holiday , EffectiveFrom in both PQData and pattern should be same
        }
    }
    let isValidDate = reUsableFun.isDateGreater(date);
    // if (!isValidDate) {
    //     return res.send("Please update future EffectiveFrom Date.");
    // }
    let chechDateIsWorking = await reUsableFun.checkHolidyForEntirePlan(date, 0, 0, body1[0].LineName, config);
    if (typeof (chechDateIsWorking) === 'string') {
        return res.send(chechDateIsWorking)
    }
    date = await reUsableFun.getNextWorkngDay(date, body1[0].LineName, config);
    // }
    let body = [], patterNameList = [], BOMTypeNotAvailable = [], excelData = [], BOMTypeNotAvailableinPQData = [], i = 1, FLVTlotsizeNotValid = [], SKUCategoryListDetails = [], AppendOrOverwriteList = [], EffectiveFromList = [], PatternNoAndPartSeqList = [],PatternQtyPerPalletIsNull = [], totalKbsInCirculationList = [];
    // Calculation RoundUpKanbanQty,RoundUpLotSize,NoOfSkids,MaterialChangeTimeInSec,PalletChangeTimeInSec,LineProductionTime,TotalProductionTime,SDWaitTime,SDLineProductionTime,EfficiencyPT,GSPS
    for (const el of body1) {
        if (el.LineName !== "") {
            try {
                patterNameList.push(el.PatternNo);
                SKUCategoryListDetails.push(el.LineName);
                EffectiveFromList.push(el.EffectiveFrom);
                AppendOrOverwriteList.push(el.AppendOrOverwrite);
                PatternNoAndPartSeqList.push({ PatternNo: el.PatternNo, PartSeq: el.PartSeq });
                // if(!totalKbsInCirculationList.includes(el.DieSet + ": " + el.TotalMaterialKanbanInCirculation)){
                //     totalKbsInCirculationList.push(el.DieSet + ": " + el.TotalMaterialKanbanInCirculation);
                // }
                excelData.push({ "SL.NO": i, "LineName": el.LineName, "PatternNo": el.PatternNo, "PartSeq": el.PartSeq, "DieSet": el.DieSet, "LotCycle": el.LotCycle, "PatternLotSize": el.PatternLotSize, "SPS": el.SPS, "AppendOrOverwrite": el.AppendOrOverwrite, "EffectiveFrom": el.EffectiveFrom, "TotalMaterialKanbanInCirculation": el.TotalMaterialKanbanInCirculation });
                const existingBomType = await pool.request()
                    .input('DieSet', sql.NVarChar, el.DieSet)
                    .input('LineName', sql.NVarChar, el.LineName)
                    .input('EffectiveFromDate', sql.Date, pqDiesetInfoWithDate)
                    .query(`
                    SELECT 
                        (
                      SELECT MIN(LotSize) AS MinSkidQty from PurchaseLotSize where PurchaseOrderingUOMID IN (SELECT UOMID FROM UOM where UOMID IN (SELECT PurchaseOrderingUOMID FROM PurchaseLotSize WHERE SKUID IN (SELECT  KitID  FROM KitBOM  WHERE BOMType = @DieSet )) AND UOMCode='NOS')
                      AND SKUID = (SELECT TOP(1) KitID  FROM KitBOM  WHERE BOMType = @DieSet )
                    ) AS MinSkidQty,
                        (SELECT TOP(1) MAX(PerUnitQuantity) FROM KitBOM  WHERE BOMType = @DieSet) AS BOMQty,
                        COALESCE((SELECT MIN(FLVTLotSize)  FROM SSPCSdbo.PQDataUpload  WHERE DieSet = @DieSet AND EffectiveFrom = @EffectiveFromDate AND LineName=@LineName), null) AS FLVTLotSize,
                        COALESCE((SELECT TOP(1) SPS FROM SSPCSdbo.PQDataUpload  WHERE DieSet = @DieSet AND EffectiveFrom = @EffectiveFromDate AND LineName=@LineName), null) AS SPS,
                        (SELECT MIN(Quantity) FROM [SKUPackMapping]  WHERE SKUID = (SELECT TOP(1) KitItemID  FROM KitBOM  WHERE BOMType = @DieSet) AND IsDefault=1 AND Quantity > 0) AS QtyPerPallet,
                        (SELECT Efficiency FROM SSPCSdbo.LineEfficencyMaster  WHERE LineName = @LineName) AS Efficiency,
                        BT.* FROM SSPCSdbo.BOMTypeMaster BT WHERE BT.DieSet = @DieSet;
                `);
                // Min Lotsize should be taken PurchaseLotSize
                // Note based on BOMType SKUID need to get from SKUMaster=> with the help of SKUID , Qty/ Pallet - SKUPack Mapping,Skid Qty - Purchase lot size SKUmaster,BOM Qty - KITBOMs,BOM Type - KITBOMs
                if (existingBomType.recordset.length > 0) {
                    let newEle = existingBomType.recordset[0];
                    if(newEle.QtyPerPallet == null){
                        PatternQtyPerPalletIsNull.push(el.DieSet);
                    }else if (newEle.FLVTLotSize === null) {
                        BOMTypeNotAvailableinPQData.push(el.DieSet);
                    } else if (newEle.FLVTLotSize > 0) {
                        FLVTlotsizeNotValid.push(el.DieSet);
                    }
                    el.SPS = newEle.SPS;
                    el.UDTime = newEle.UDTime;
                    el.CTTime = newEle.CTTime;
                    el.QCTime = newEle.QCTime;
                    el.MaterialChangeoverTimePerchangeOver = newEle.MaterialChangeoverTimePerChangeOverTime;
                    el.PalletChangeoverTimeperChangeover = newEle.PalletChangeoverTimePerChangeover;
                    el.SDTime = newEle.SDTime;
                    el.NoOfPalletPerCycle = newEle.NoOfPalletPerCycle;
                    el.MaterialOrderTriggerInSec = newEle.MaterialOrderTriggerInSec;
                    el.ProductionTriggerInSec = newEle.ProductionTriggerInSec;
                    el.DieStorageBay = newEle.DieStorageBay;
                    el.Efficiency = newEle.Efficiency;
                    el.CycleTime = 1 / el.SPS;
                    if (newEle.MinSkidQty !== null || newEle.QtyPerPallet !== null || newEle.BOMQty !== null) {
                        el.RoundUpKanbanQty = Math.ceil(el.PatternLotSize / newEle.QtyPerPallet) //* newEle.QtyPerPallet;
                        el.RoundUpLotSize = el.RoundUpKanbanQty * newEle.QtyPerPallet;
                        el.NoOfSkids = Math.ceil((el.RoundUpLotSize / newEle.BOMQty) / newEle.MinSkidQty);
                        el.MaterialChangeTimeInSec = (el.NoOfSkids - 1) * newEle.MaterialChangeoverTimePerChangeOverTime   // •	Material change time= (No. of skids * Material Changeover Time (From BOM Type master)) – Material Changeover Time.
                        if (el.RoundUpKanbanQty % 2 === 0) {
                            el.PalletChangeTimeInSec = ((el.RoundUpKanbanQty - newEle.NoOfPalletPerCycle) / newEle.NoOfPalletPerCycle) * newEle.PalletChangeoverTimePerChangeover;
                        } else {
                            el.PalletChangeTimeInSec = ((el.RoundUpKanbanQty - newEle.NoOfPalletPerCycle) / newEle.NoOfPalletPerCycle) * newEle.PalletChangeoverTimePerChangeover + newEle.PalletChangeoverTimePerChangeover;
                        }
                        el.LineProductionTime = el.CycleTime * el.RoundUpLotSize;
                        el.TotalProductionTime = (el.UDTime + el.CTTime + el.QCTime) + el.MaterialChangeTimeInSec + el.PalletChangeTimeInSec + el.LineProductionTime;
                        if (newEle.SDTime - el.TotalProductionTime <= 0) {
                            el.SDWaitTime = 0;
                        } else {
                            el.SDWaitTime = newEle.SDTime - el.TotalProductionTime;
                        }
                        el.SDLineProductionTime = el.TotalProductionTime + el.SDWaitTime;
                        //el.EfficiencyPT = (el.SDLineProductionTime * (100 - newEle.Efficiency) / 100) + el.SDLineProductionTime;
                        el.EfficiencyPT = el.SDLineProductionTime / newEle.BOMQty;
                        el.GSPS = (el.RoundUpLotSize / el.EfficiencyPT);
                    } else {
                        el.RoundUpKanbanQty = 0;
                        el.RoundUpLotSize = 0;
                        el.NoOfSkids = 0;
                        el.MaterialChangeTimeInSec = 0; // •	Material change time= (No. of skids * Material Changeover Time (From BOM Type master)) – Material Changeover Time.
                        el.PalletChangeTimeInSec = 0;
                        el.LineProductionTime = 0;
                        el.TotalProductionTime = 0;
                        el.SDWaitTime = 0;
                        el.SDLineProductionTime = 0;
                        el.EfficiencyPT = 0;
                        el.GSPS = 0;
                    }
                    el.EffectiveFrom = date;
                    body.push(el);
                } else {
                    BOMTypeNotAvailable.push(el.DieSet)
                }
            } catch (error) {
                logger.customerLogger.error(error.message);
                return res.send(error.message);
            }
        }
    }
    EffectiveFromList = [...new Set(EffectiveFromList)];
    AppendOrOverwriteList = [...new Set(AppendOrOverwriteList)];
    SKUCategoryListDetails = [...new Set(SKUCategoryListDetails)];
    BOMTypeNotAvailable = [...new Set(BOMTypeNotAvailable)];
    // duplicatesPatternNoAndPartSeq = [...new Set(duplicatesPatternNoAndPartSeq)]
   // let duplicateKbs = reUsableFun.findDuplicates(totalKbsInCirculationList);
    const checkPartSeqIsDuplicateOrSerilized = reUsableFun.checkDuplicatesAndSerialPartSeq(PatternNoAndPartSeqList)
    if (EffectiveFromList.length > 1) {
        return res.send("Please provide one EffectiveFrom date for each Pattern upload. " + constant.checkAndModifyFile)
    } else if (AppendOrOverwriteList.length > 1) {
        return res.send("Please provide one AppendOrOverwrite for each Pattern upload. " + constant.checkAndModifyFile)
    } else if (SKUCategoryListDetails.length > 1) {
        return res.send("Please provide one LineName for each Pattern upload. " + constant.checkAndModifyFile)
    }
    // else if(duplicateKbs.length > 0){
    //    return res.send('Please provide one TotalMaterialKanbanInCirculation per DieSet for The following DieSer: ')
    // }
    else if (checkPartSeqIsDuplicateOrSerilized.length > 0) {
        let strMess = 'For the PatternNo: '
        checkPartSeqIsDuplicateOrSerilized.forEach(el => {
            strMess += el.PatternNo + ' ( ';
            el.hasDuplicate ? strMess += 'has duplicate PartSeq, ' : el.isSerial ? '' : strMess += 'non-serialized PartSeq';
            strMess += " ), "
        })
        return res.send(strMess + constant.checkAndModifyFile);
    }
    else if (BOMTypeNotAvailable.length > 0) {
        return res.send("These DieSet values are not available in the SSPCSdbo.BOMTypeMaster table:" + BOMTypeNotAvailable.join(", ") + constant.checkAndModifyFile);
    } else if (BOMTypeNotAvailableinPQData.length > 0) {
        BOMTypeNotAvailableinPQData = [...new Set(BOMTypeNotAvailableinPQData)]
        return res.send("The following DieSet values are not available in the SSPCSdbo.PQDataUpload table for the specified EffectiveFrom date (" + EffectiveFromList[0] + ") and LineName (" + body1[0].LineName + "). " + BOMTypeNotAvailableinPQData.join(", ") + constant.checkAndModifyFile);
    } else if (FLVTlotsizeNotValid.length > 0) {
        BOMTypeNotAvailableinPQData = [...new Set(BOMTypeNotAvailableinPQData)]
        return res.send("Please select different DieSet value from PQDataUpload which has FLVTlotsize 0 :" + FLVTlotsizeNotValid.join(", "))
    }else if(PatternQtyPerPalletIsNull.length > 0){
        PatternQtyPerPalletIsNull = [...new Set(PatternQtyPerPalletIsNull)];
        return res.send("For the following DieSet QtyPerPallet(Quantity > 0 with isDefault > 0 from SKUPackMapping) can't be null. " +  PatternQtyPerPalletIsNull.join(', '));
    }
    patterNameList = [...new Set(patterNameList)];
    let patternNameLength = patterNameList.length;
    date = new Date(date);
    // date.toLocaleString('en-IN', constant.timeZone);
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);
    let planToStartFromPatternNo = body1[0].PatternNo;
    const InsertDataToDb = async (rowData, effFrom, res, savePath, palmsid) => {

        let insertQuery = `
        INSERT INTO SSPCSdbo.PatternRawDataUpload (
        LineName, PatternNo, PartSeq, PatternLotSize, SPS, EffectiveFrom, EffectiveTo, TotalMaterialKanbanInCirculation,
        DieSet, DieStorageBay, LotCycle, AppendOrOverwrite,UDTime, CTTime, QCTime, MaterialChangeoverTimePerchangeOver, PalletchangeoverTimeperChangeover,
        NoOfPalletPerCycle, MaterialchangetimeInsec,MaterialOrderTriggerInSec, ProductionTriggerInSec, Efficiency,RoundUpKanbanQty, RoundupLotSize, NoOfSkids, CycleTime,SDTime,
         PalletchangetimeInSec, Lineproductiontime, TotalProductiontime,SDwaitTime, SDLineProductionTime, EfficiencyPT, GSPS,
        ReferenceFileName, CreatedBy, CreatedDateTime

        ) VALUES
    `;

        const values = rowData.map((data, index) => {
            return `(
                @LineName${index}, @PatternNo${index}, @PartSeq${index}, @PatternLotSize${index}, @SPS${index}, @EffectiveFrom${index}, @EffectiveTo${index}, @TotalMaterialKanbanInCirculation${index},
                @DieSet${index}, @DieStorageBay${index}, @LotCycle${index}, @AppendOrOverwrite${index},
                @UDTime${index}, @CTTime${index}, @QCTime${index}, @MaterialChangeoverTimePerchangeOver${index}, @PalletchangeoverTimeperChangeover${index},
                @NoOfPalletPerCycle${index}, @MaterialchangetimeInsec${index},@MaterialOrderTriggerInSec${index}, @ProductionTriggerInSec${index}, @Efficiency${index},
                @RoundUpKanbanQty${index}, @RoundupLotSize${index}, @NoOfSkids${index}, @CycleTime${index}, @SDTime${index},
                @PalletchangetimeInSec${index}, @Lineproductiontime${index}, @TotalProductiontime${index},
                @SDwaitTime${index}, @SDLineProductionTime${index}, @EfficiencyPT${index}, @GSPS${index},
                @ReferenceFileName${index}, @CreatedBy${index}, @CreatedDateTime${index}
        )`
        }).join(', ');

        insertQuery += values;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const request = new sql.Request(transaction);
            rowData.forEach((data, index) => {
                request.input(`LineName${index}`, sql.NVarChar, data.LineName);
                request.input(`PatternNo${index}`, sql.NVarChar, data.PatternNo);
                request.input(`PartSeq${index}`, sql.Int, data.PartSeq);
                request.input(`PatternLotSize${index}`, sql.Int, data.PatternLotSize);
                request.input(`SPS${index}`, sql.Decimal(10, 5), data.SPS);
                request.input(`EffectiveFrom${index}`, sql.Date, effFrom);
                request.input(`EffectiveTo${index}`, sql.Date, null);
                request.input(`TotalMaterialKanbanInCirculation${index}`, sql.Int, data.TotalMaterialKanbanInCirculation);
                request.input(`SDTime${index}`, sql.Int, data.SDTime);
                request.input(`DieSet${index}`, sql.NVarChar, data.DieSet);
                request.input(`DieStorageBay${index}`, sql.NVarChar, data.DieStorageBay);
                request.input(`LotCycle${index}`, sql.Int, data.LotCycle);
                request.input(`AppendOrOverwrite${index}`, sql.NVarChar, data.AppendOrOverwrite);
                request.input(`UDTime${index}`, sql.Int, data.UDTime);
                request.input(`CTTime${index}`, sql.Decimal(10, 2), data.CTTime);
                request.input(`QCTime${index}`, sql.Int, data.QCTime);
                request.input(`MaterialChangeoverTimePerchangeOver${index}`, sql.Decimal(10, 2), data.MaterialChangeoverTimePerchangeOver);
                request.input(`PalletchangeoverTimeperChangeover${index}`, sql.Decimal(10, 2), data.PalletChangeoverTimeperChangeover);
                request.input(`NoOfPalletPerCycle${index}`, sql.Int, data.NoOfPalletPerCycle);
                request.input(`MaterialOrderTriggerInSec${index}`, sql.Int, data.MaterialOrderTriggerInSec)
                request.input(`ProductionTriggerInSec${index}`, sql.Int, data.ProductionTriggerInSec);
                request.input(`Efficiency${index}`, sql.Decimal(10, 2), data.Efficiency);
                request.input(`RoundUpKanbanQty${index}`, sql.Int, data.RoundUpKanbanQty);
                request.input(`RoundupLotSize${index}`, sql.Int, data.RoundUpLotSize);
                request.input(`NoOfSkids${index}`, sql.Int, data.NoOfSkids);
                request.input(`CycleTime${index}`, sql.Decimal(10, 5), data.CycleTime);
                request.input(`MaterialchangetimeInsec${index}`, sql.Int, data.MaterialChangeTimeInSec);
                request.input(`PalletchangetimeInSec${index}`, sql.Int, data.PalletChangeTimeInSec);
                request.input(`Lineproductiontime${index}`, sql.Decimal(10, 2), data.LineProductionTime);
                request.input(`TotalProductiontime${index}`, sql.Decimal(10, 2), data.TotalProductionTime);
                request.input(`SDwaitTime${index}`, sql.Decimal(10, 2), data.SDWaitTime);
                request.input(`SDLineProductionTime${index}`, sql.Decimal(10, 2), data.SDLineProductionTime);
                request.input(`EfficiencyPT${index}`, sql.Decimal(10, 2), data.EfficiencyPT);
                request.input(`GSPS${index}`, sql.Decimal(10, 5), data.GSPS);
                // request.input(`ContinueFromPatternNo${index}`, sql.NVarChar, data.ContinueFromPatternNo);
                request.input(`ReferenceFileName${index}`, sql.NVarChar, savePath);
                request.input(`CreatedBy${index}`, sql.Int, Number(palmsid)? Number(palmsid) : 1);
                request.input(`CreatedDateTime${index}`, sql.DateTime, reUsableFun.getISTDate());
            });
            await request.query(insertQuery);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            return error.message;
        }
    };


    try {
        let planDate = new Date(date).toISOString();
        planDate = planDate.slice(0, 19).replace('T', ' ');
        // Deleting the Pattern Interpretation records from Effective from date
        await DeletePatternInterpretation(planDate, body[0].LineName);
        // Updating EffectiveTo as behind one day of EffectiveFrom Date as EffectiveTo Date for existing plan
        await UpdateEffectiveToPatternRowData(planDate, body[0].LineName, palmsid);
        // Updating EffectiveTo as behind one day of EffectiveFrom Date as EffectiveTo Date for existing plan
        await UpdateEffectiveToPQData(planDate, body[0].LineName, palmsid, palmsid);
        let bodyLenght = body.length;
        for (let i = 0; i < Math.ceil(bodyLenght / 2); i++) {
            let batch = body.slice(i * 2, (i + 1) * 2);
            let inserData = await InsertDataToDb(batch, date, res, savePath, palmsid);
            if (inserData) {
                logger.customerLogger.error(inserData);
                return res.send(constant.serverError);
            }
        }
        reUsableFun.SaveJsonToCsvFile(excelData, savePath);
    } catch (error) {
        logger.customerLogger.error(error.message);
        return res.send(error.message);
    }
    await ExcludePatternDataPatternInterpretation(body[0].LineName, planToStartFromPatternNo, pqDiesetInfoWithDate, res, palmsid);
};
async function DeletePatternInterpretation(planDate, LineName) {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    const query = `
        DELETE FROM SSPCSdbo.PatternDataInterpretation
        OUTPUT DELETED.PatternUploadId
        WHERE ScheduledDate >= '${planDate}'
         AND LineID=(select SKUCategoryID from SKUCategory where SKUCategoryCode='${LineName}') ;
    `;
    const deleteRecord = await pool.request().query(query);
}
async function UpdateEffectiveToPatternRowData(planDate, LineName, palmsid) {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    let Eff_Date = reUsableFun.getFormattedOnlyDate(planDate, LineName, config);
    planDate = new Date(planDate);
    planDate = planDate.setDate(planDate.getDate() - 1);
    planDate = await reUsableFun.getPrevWorkngDay(planDate, LineName, config);
    let query2 = `
                    select * from SSPCSdbo.PatternRawDataUpload where EffectiveFrom >= '${Eff_Date}' and LineName = '${LineName}'
                `;
    const existingRecord = await pool.request().query(query2);
    if (existingRecord.recordset.length > 0) {
        let query1 = `
                    delete from SSPCSdbo.PatternRawDataUpload where EffectiveFrom >= '${Eff_Date}' and LineName = '${LineName}'
                `;
        const existingRecord = await pool.request().query(query1);
    }

    let query = `
        update SSPCSdbo.PatternRawDataUpload set EffectiveTo= @EffectiveTo, ModifiedDateTime = @ModifiedDateTime, ModifiedBy= @modifiedBy where EffectiveTo > @EffectiveTo and LineName = @LineName
    `;
    const result = await pool.request()
        .input("LineName", sql.NVarChar, LineName)
        .input("ModifiedDateTime", sql.DateTime, reUsableFun.getISTDate())
        .input("EffectiveTo", sql.Date, planDate)
        .input("modifiedBy", sql.Int, Number(palmsid)? Number(palmsid) : 1)
        .query(query);
}
async function UpdateEffectiveToPQData(planDate, LineName, palmsid) {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    let Eff_Date = reUsableFun.getFormattedOnlyDate(planDate);
    planDate = new Date(planDate);
    planDate = planDate.setDate(planDate.getDate() - 1);
    planDate = await reUsableFun.getPrevWorkngDay(planDate, LineName, config);
    let query2 = `
                    select * from SSPCSdbo.PQDataUpload where EffectiveFrom = '${Eff_Date}' and LineName = '${LineName}'
                `;
    const existingRecord = await pool.request().query(query2);
    if (existingRecord.recordset.length > 0) {
        let query = `
        update SSPCSdbo.PQDataUpload set EffectiveTo=@EffectiveTo , ModifiedDateTime = @ModifiedDateTime, ModifiedBy= @modifiedBy where EffectiveTo > @EffectiveTo and LineName = @LineName
    `;
        const result = await pool.request()
            .input("LineName", sql.NVarChar, LineName)
            .input("ModifiedDateTime", sql.DateTime, reUsableFun.getISTDate())
            .input("EffectiveTo", sql.Date, planDate)
            .input("modifiedBy", sql.Int, Number(palmsid)? Number(palmsid) : 1)
            .query(query);
    }
}
async function UpdateEffectiveToPatternData(planDate, LineName, palmsid) {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    planDate = new Date(planDate);
    // planDate.setDate(planDate.getDate() - 1);
    let newDate = reUsableFun.getFormattedOnlyDate(planDate);
    let query = `
        update SSPCSdbo.PatternRawDataUpload set EffectiveTo= @EffectiveTo , ModifiedDateTime = @ModifiedDateTime, ModifiedBy= @modifiedBy where EffectiveFrom = (select top(1) EffectiveFrom from SSPCSdbo.PatternRawDataUpload  order by EffectiveFrom DESC) AND LineName = @LineName
    `;
    const result = await pool.request()
        .input("LineName", sql.NVarChar, LineName)
        .input("ModifiedDateTime", sql.DateTime, reUsableFun.getISTDate())
        .input("EffectiveTo", sql.Date, newDate)
        .input("modifiedBy", sql.Int, Number(palmsid)? Number(palmsid) : 1)
        .query(query);

}
async function ExcludePatternDataPatternInterpretation(LineName, planToStartFromPatternNo, pqDiesetInfoWithDate, res, palmsid) {
    try {
        const pool = await sql.connect(config);
        await pool.connect();
        let data = [];
        // Query to get All pattern records to be excloded
        if (LineName !== null && LineName !== undefined) {
            const query = ` 
               SELECT * FROM SSPCSdbo.PatternRawDataUpload WHERE EffectiveFrom = ( SELECT TOP 1 EffectiveFrom
               FROM SSPCSdbo.PatternRawDataUpload WHERE  LineName = '${LineName}' ORDER BY EffectiveFrom DESC ) and LineName = '${LineName}'`;
            const result = await pool.request().query(query);
            if (result.recordset.length > 0) {
                data = result.recordset;
            } else {
                return res.send("No plan exist in the PatternRowDataUpload.");
            }
        } else {
            return res.send("The LineName is null.");
        }
        let patterNameList = [], nightListPattern = [], patternNotAvailableInPatternShiftMapping = [];
        for (const el of data) {
            if (el.LineName !== null) {
                try {
                    patterNameList.push(el.PatternNo);
                    if (constant.NightShiftPattern.includes(el.PatternNo)) {
                        nightListPattern.push(el.PatternNo)
                    }
                    // Query to get DieSetID, LineID, ShiftID
                    const existingBomType = await pool.request()
                        .input('LineName', sql.NVarChar, el.LineName)
                        .input('DieSet', sql.NVarChar, el.DieSet)
                        .input('PatternNo', sql.NVarChar, el.PatternNo)
                        .query(`
                            SELECT DISTINCT 
										pru.PatternNo,
										(SELECT TOP(1) LineID 
										 FROM SSPCSdbo.LineEfficencyMaster 
										 WHERE LineName = @LineName) AS LineID,
										(SELECT TOP(1) DieSetID 
										 FROM SSPCSdbo.BOMTypeMaster 
										 WHERE DieSet = @DieSet) AS DieSetID,
										 (SELECT TOP(1) ShiftID FROM SSPCSdbo.PatternShiftMapping where PatternNo = @PatternNo AND LineName=@LineName) AS ShiftID
									FROM 
										SSPCSdbo.PatternRawDataUpload pru
									WHERE 
										pru.PatternNo = @PatternNo
									ORDER BY 
										pru.PatternNo;
                            `);
                    if (existingBomType.recordset.length > 0) {
                        el.DieSetID = existingBomType.recordset[0].DieSetID;
                        el.LineID = existingBomType.recordset[0].LineID;
                        el.ShiftId = existingBomType.recordset[0].ShiftID;
                    } else {
                        patternNotAvailableInPatternShiftMapping.push(el.PatternNo)
                    }
                } catch (error) {
                    logger.customerLogger.error(error.message);
                    return res.send(constant.serverError);
                }
            }
        }
        patternNotAvailableInPatternShiftMapping = [...new Set(patternNotAvailableInPatternShiftMapping)]
        if (patternNotAvailableInPatternShiftMapping.length > 0) {
            return res.send("these PatternNo values " + patternNotAvailableInPatternShiftMapping.join(', ') + " are not available in PatternShiftMapping table. " + constant.checkAndModifyFile);
        }
        patterNameList = [...new Set(patterNameList)];
        let patternNameLength = patterNameList.length;
        let noOfDayPatternPlan = 0;
        nightListPattern = [...new Set(nightListPattern)]
        if (nightListPattern.length > 0) {
            noOfDayPatternPlan = patternNameLength / 3;
        } else {
            noOfDayPatternPlan = patternNameLength / 2; // if night shift not their 
        }
        let date = new Date(data[0].EffectiveFrom);
        // get NoOfWorking day from EffectiveFrom Date to End day of Month
        let NoOfWorkingDay = await reUsableFun.getWorkingDayCount(data[0].EffectiveFrom, data[0].LineName, config);
        const noOfDayPlan = Math.ceil(NoOfWorkingDay / noOfDayPatternPlan) * noOfDayPatternPlan;
        if (noOfDayPlan === 0) {
            return res.send("There is no working day as per this plan. Please choose next working day as EffectiveFrom date for the new upload or check the calendar for more information.");
        }
        // validayting effective is working or not to avoid infine loop code is going due to no working day in calender for long duration

        let chechDateIsWorking = await reUsableFun.checkHolidyForEntirePlan(date, noOfDayPlan, NoOfWorkingDay, data[0].LineName, config);
        if (typeof (chechDateIsWorking) === 'string') {
            return res.send(chechDateIsWorking)
        }
        let date1 = [], days = [];
        for (let i = 1; i <= noOfDayPatternPlan; i++) {
            days.push([]);
        }
        // Loop for generating list of working day plan date string
        for (let i = 0; i < noOfDayPlan; i++) {
            await reUsableFun.handleHoliday(date, data[0].LineName, config, date1);
        }
        // finding the cycle plan based on No of PatternNo 
        if (noOfDayPatternPlan === 2) {
            await data.forEach(el => {
                if (el.PatternNo === "p1" || el.PatternNo === "p2" || el.PatternNo === "n1") {
                    days[0].push(el);
                } else if (el.PatternNo === "p3" || el.PatternNo === "p4" || el.PatternNo === "n2") {
                    days[1].push(el);
                }
            });

        } else if (noOfDayPatternPlan === 4) {
            await data.forEach(el => {
                if (el.PatternNo === "p1" || el.PatternNo === "p2" || el.PatternNo === "n1") {
                    days[0].push(el);
                } else if (el.PatternNo === "p3" || el.PatternNo === "p4" || el.PatternNo === "n2") {
                    days[1].push(el);
                } else if (el.PatternNo === "p5" || el.PatternNo === "p6" || el.PatternNo === "n3") {
                    days[2].push(el);
                } else if (el.PatternNo === "p7" || el.PatternNo === "p8" || el.PatternNo === "n4") {
                    days[3].push(el);
                }
            });
        } else if (noOfDayPatternPlan === 6) {
            await data.forEach(el => {
                if (el.PatternNo === "p1" || el.PatternNo === "p2" || el.PatternNo === "n1") {
                    days[0].push(el);
                } else if (el.PatternNo === "p3" || el.PatternNo === "p4" || el.PatternNo === "n2") {
                    days[1].push(el);
                } else if (el.PatternNo === "p5" || el.PatternNo === "p6" || el.PatternNo === "n3") {
                    days[2].push(el);
                } else if (el.PatternNo === "p7" || el.PatternNo === "p8" || el.PatternNo === "n4") {
                    days[3].push(el);
                } else if (el.PatternNo === "p9" || el.PatternNo === "p10" || el.PatternNo === "n5") {
                    days[4].push(el);
                } else if (el.PatternNo === "p11" || el.PatternNo === "p12" || el.PatternNo === "n6") {
                    days[5].push(el);
                }
            });
        } else if (noOfDayPatternPlan === 8) {
            await data.forEach(el => {
                if (el.PatternNo === "p1" || el.PatternNo === "p2" || el.PatternNo === "n1") {
                    days[0].push(el);
                } else if (el.PatternNo === "p3" || el.PatternNo === "p4" || el.PatternNo === "n2") {
                    days[1].push(el);
                } else if (el.PatternNo === "p5" || el.PatternNo === "p6" || el.PatternNo === "n3") {
                    days[2].push(el);
                } else if (el.PatternNo === "p7" || el.PatternNo === "p8" || el.PatternNo === "n4") {
                    days[3].push(el);
                } else if (el.PatternNo === "p9" || el.PatternNo === "p10" || el.PatternNo === "n5") {
                    days[4].push(el);
                } else if (el.PatternNo === "p11" || el.PatternNo === "p12" || el.PatternNo === "n6") {
                    days[5].push(el);
                } else if (el.PatternNo === "p13" || el.PatternNo === "p14" || el.PatternNo === "n7") {
                    days[6].push(el);
                } else if (el.PatternNo === "p15" || el.PatternNo === "p16" || el.PatternNo === "n8") {
                    days[7].push(el);
                }
            });
        } else if (noOfDayPatternPlan === 10) {
            await data.forEach(el => {
                if (el.PatternNo === "p1" || el.PatternNo === "p2" || el.PatternNo === "n1") {
                    days[0].push(el);
                } else if (el.PatternNo === "p3" || el.PatternNo === "p4" || el.PatternNo === "n2") {
                    days[1].push(el);
                } else if (el.PatternNo === "p5" || el.PatternNo === "p6" || el.PatternNo === "n3") {
                    days[2].push(el);
                } else if (el.PatternNo === "p7" || el.PatternNo === "p8" || el.PatternNo === "n4") {
                    days[3].push(el);
                } else if (el.PatternNo === "p9" || el.PatternNo === "p10" || el.PatternNo === "n5") {
                    days[4].push(el);
                } else if (el.PatternNo === "p11" || el.PatternNo === "p12" || el.PatternNo === "n6") {
                    days[5].push(el);
                } else if (el.PatternNo === "p13" || el.PatternNo === "p14" || el.PatternNo === "n7") {
                    days[6].push(el);
                } else if (el.PatternNo === "p15" || el.PatternNo === "p16" || el.PatternNo === "n8") {
                    days[7].push(el);
                } else if (el.PatternNo === "p17" || el.PatternNo === "p18" || el.PatternNo === "n9") {
                    days[8].push(el);
                } else if (el.PatternNo === "p19" || el.PatternNo === "p20" || el.PatternNo === "n10") {
                    days[9].push(el);
                }
            });
        } else if (noOfDayPatternPlan === 12) {
            await data.forEach(el => {
                if (el.PatternNo === "p1" || el.PatternNo === "p2" || el.PatternNo === "n1") {
                    days[0].push(el);
                } else if (el.PatternNo === "p3" || el.PatternNo === "p4" || el.PatternNo === "n2") {
                    days[1].push(el);
                } else if (el.PatternNo === "p5" || el.PatternNo === "p6" || el.PatternNo === "n3") {
                    days[2].push(el);
                } else if (el.PatternNo === "p7" || el.PatternNo === "p8" || el.PatternNo === "n4") {
                    days[3].push(el);
                } else if (el.PatternNo === "p9" || el.PatternNo === "p10" || el.PatternNo === "n5") {
                    days[4].push(el);
                } else if (el.PatternNo === "p11" || el.PatternNo === "p12" || el.PatternNo === "n6") {
                    days[5].push(el);
                } else if (el.PatternNo === "p13" || el.PatternNo === "p14" || el.PatternNo === "n7") {
                    days[6].push(el);
                } else if (el.PatternNo === "p15" || el.PatternNo === "p16" || el.PatternNo === "n8") {
                    days[7].push(el);
                } else if (el.PatternNo === "p17" || el.PatternNo === "p18" || el.PatternNo === "n9") {
                    days[8].push(el);
                } else if (el.PatternNo === "p19" || el.PatternNo === "p20" || el.PatternNo === "n10") {
                    days[9].push(el);
                } else if (el.PatternNo === "p21" || el.PatternNo === "p22" || el.PatternNo === "n11") {
                    days[10].push(el);
                } else if (el.PatternNo === "p23" || el.PatternNo === "p24" || el.PatternNo === "n12") {
                    days[11].push(el);
                }
            });
        } else if (noOfDayPatternPlan === 14) {
            await data.forEach(el => {
                if (el.PatternNo === "p1" || el.PatternNo === "p2" || el.PatternNo === "n1") {
                    days[0].push(el);
                } else if (el.PatternNo === "p3" || el.PatternNo === "p4" || el.PatternNo === "n2") {
                    days[1].push(el);
                } else if (el.PatternNo === "p5" || el.PatternNo === "p6" || el.PatternNo === "n3") {
                    days[2].push(el);
                } else if (el.PatternNo === "p7" || el.PatternNo === "p8" || el.PatternNo === "n4") {
                    days[3].push(el);
                } else if (el.PatternNo === "p9" || el.PatternNo === "p10" || el.PatternNo === "n5") {
                    days[4].push(el);
                } else if (el.PatternNo === "p11" || el.PatternNo === "p12" || el.PatternNo === "n6") {
                    days[5].push(el);
                } else if (el.PatternNo === "p13" || el.PatternNo === "p14" || el.PatternNo === "n7") {
                    days[6].push(el);
                } else if (el.PatternNo === "p15" || el.PatternNo === "p16" || el.PatternNo === "n8") {
                    days[7].push(el);
                } else if (el.PatternNo === "p17" || el.PatternNo === "p18" || el.PatternNo === "n9") {
                    days[8].push(el);
                } else if (el.PatternNo === "p19" || el.PatternNo === "p20" || el.PatternNo === "n10") {
                    days[9].push(el);
                } else if (el.PatternNo === "p21" || el.PatternNo === "p22" || el.PatternNo === "n11") {
                    days[10].push(el);
                } else if (el.PatternNo === "p23" || el.PatternNo === "p24" || el.PatternNo === "n12") {
                    days[11].push(el);
                } else if (el.PatternNo === "p25" || el.PatternNo === "p26" || el.PatternNo === "n13") {
                    days[12].push(el);
                } else if (el.PatternNo === "p27" || el.PatternNo === "p28" || el.PatternNo === "n14") {
                    days[13].push(el);
                }
            });
        } else if (noOfDayPatternPlan === 16) {
            await data.forEach(el => {
                if (el.PatternNo === "p1" || el.PatternNo === "p2" || el.PatternNo === "n1") {
                    days[0].push(el);
                } else if (el.PatternNo === "p3" || el.PatternNo === "p4" || el.PatternNo === "n2") {
                    days[1].push(el);
                } else if (el.PatternNo === "p5" || el.PatternNo === "p6" || el.PatternNo === "n3") {
                    days[2].push(el);
                } else if (el.PatternNo === "p7" || el.PatternNo === "p8" || el.PatternNo === "n4") {
                    days[3].push(el);
                } else if (el.PatternNo === "p9" || el.PatternNo === "p10" || el.PatternNo === "n5") {
                    days[4].push(el);
                } else if (el.PatternNo === "p11" || el.PatternNo === "p12" || el.PatternNo === "n6") {
                    days[5].push(el);
                } else if (el.PatternNo === "p13" || el.PatternNo === "p14" || el.PatternNo === "n7") {
                    days[6].push(el);
                } else if (el.PatternNo === "p15" || el.PatternNo === "p16" || el.PatternNo === "n8") {
                    days[7].push(el);
                } else if (el.PatternNo === "p17" || el.PatternNo === "p18" || el.PatternNo === "n9") {
                    days[8].push(el);
                } else if (el.PatternNo === "p19" || el.PatternNo === "p20" || el.PatternNo === "n10") {
                    days[9].push(el);
                } else if (el.PatternNo === "p21" || el.PatternNo === "p22" || el.PatternNo === "n11") {
                    days[10].push(el);
                } else if (el.PatternNo === "p23" || el.PatternNo === "p24" || el.PatternNo === "n12") {
                    days[11].push(el);
                } else if (el.PatternNo === "p25" || el.PatternNo === "p26" || el.PatternNo === "n13") {
                    days[12].push(el);
                } else if (el.PatternNo === "p27" || el.PatternNo === "p28" || el.PatternNo === "n14") {
                    days[13].push(el);
                } else if (el.PatternNo === "p29" || el.PatternNo === "p30" || el.PatternNo === "n15") {
                    days[14].push(el);
                } else if (el.PatternNo === "p31" || el.PatternNo === "p32" || el.PatternNo === "n16") {
                    days[15].push(el);
                }
            });
        } else {
            return res.send("PatternNo must be a value that is a multiple of 4.");
        }
        // Rearranging the cycle plan based on ContinueFromPatternNo column value 
        days = await reUsableFun.ReArrangeArrBasedOnPatternNo(days, planToStartFromPatternNo);
        // Inserting new Excloded data on Plan date
        await Promise.all(date1.map(async (el, index) => {
            // let el = date1[index];
            if (noOfDayPatternPlan === 2) {
                if (index % noOfDayPatternPlan === 0) {
                    await insertLimitdata(days[0], el, palmsid);
                } else if (index % noOfDayPatternPlan === 1) {
                    await insertLimitdata(days[1], el, palmsid);
                }
            } else if (noOfDayPatternPlan === 4) {
                if (index % noOfDayPatternPlan === 0) {
                    await insertLimitdata(days[0], el, palmsid);
                } else if (index % noOfDayPatternPlan === 1) {
                    await insertLimitdata(days[1], el, palmsid);
                } else if (index % noOfDayPatternPlan === 2) {
                    await insertLimitdata(days[2], el, palmsid);
                } else if (index % noOfDayPatternPlan === 3) {
                    await insertLimitdata(days[3], el, palmsid);
                }
            } else if (noOfDayPatternPlan === 6) {
                if (index % noOfDayPatternPlan === 0) {
                    await insertLimitdata(days[0], el, palmsid);
                } else if (index % noOfDayPatternPlan === 1) {
                    await insertLimitdata(days[1], el, palmsid);
                } else if (index % noOfDayPatternPlan === 2) {
                    await insertLimitdata(days[2], el, palmsid);
                } else if (index % noOfDayPatternPlan === 3) {
                    await insertLimitdata(days[3], el, palmsid);
                } else if (index % noOfDayPatternPlan === 4) {
                    await insertLimitdata(days[4], el, palmsid);
                } else if (index % noOfDayPatternPlan === 5) {
                    await insertLimitdata(days[5], el, palmsid);
                }
            } else if (noOfDayPatternPlan === 8) {
                if (index % 8 === 0) {
                    await insertLimitdata(days[0], el, palmsid);
                } else if (index % 8 === 1) {
                    await insertLimitdata(days[1], el, palmsid);
                } else if (index % 8 === 2) {
                    await insertLimitdata(days[2], el, palmsid);
                } else if (index % 8 === 3) {
                    await insertLimitdata(days[3], el, palmsid);
                } else if (index % 8 === 4) {
                    await insertLimitdata(days[4], el, palmsid);
                } else if (index % 8 === 5) {
                    await insertLimitdata(days[5], el, palmsid);
                } else if (index % 8 === 6) {
                    await insertLimitdata(days[6], el, palmsid);
                } else if (index % 8 === 7) {
                    await insertLimitdata(days[7], el, palmsid);
                }
            } else if (noOfDayPatternPlan === 10) {
                if (index % noOfDayPatternPlan === 0) {
                    await insertLimitdata(days[0], el, palmsid);
                } else if (index % noOfDayPatternPlan === 1) {
                    await insertLimitdata(days[1], el, palmsid);
                } else if (index % noOfDayPatternPlan === 2) {
                    await insertLimitdata(days[2], el, palmsid);
                } else if (index % noOfDayPatternPlan === 3) {
                    await insertLimitdata(days[3], el, palmsid);
                } else if (index % noOfDayPatternPlan === 4) {
                    await insertLimitdata(days[4], el, palmsid);
                } else if (index % noOfDayPatternPlan === 5) {
                    await insertLimitdata(days[5], el, palmsid);
                } else if (index % noOfDayPatternPlan === 6) {
                    await insertLimitdata(days[6], el, palmsid);
                } else if (index % noOfDayPatternPlan === 7) {
                    await insertLimitdata(days[7], el, palmsid);
                } else if (index % noOfDayPatternPlan === 8) {
                    await insertLimitdata(days[8], el, palmsid);
                } else if (index % noOfDayPatternPlan === 9) {
                    await insertLimitdata(days[9], el, palmsid);
                }
            } else if (noOfDayPatternPlan === 12) {
                if (index % noOfDayPatternPlan === 0) {
                    await insertLimitdata(days[0], el, palmsid);
                } else if (index % noOfDayPatternPlan === 1) {
                    await insertLimitdata(days[1], el, palmsid);
                } else if (index % noOfDayPatternPlan === 2) {
                    await insertLimitdata(days[2], el, palmsid);
                } else if (index % noOfDayPatternPlan === 3) {
                    await insertLimitdata(days[3], el, palmsid);
                } else if (index % noOfDayPatternPlan === 4) {
                    await insertLimitdata(days[4], el, palmsid);
                } else if (index % noOfDayPatternPlan === 5) {
                    await insertLimitdata(days[5], el, palmsid);
                } else if (index % noOfDayPatternPlan === 6) {
                    await insertLimitdata(days[6], el, palmsid);
                } else if (index % noOfDayPatternPlan === 7) {
                    await insertLimitdata(days[7], el, palmsid);
                } else if (index % noOfDayPatternPlan === 8) {
                    await insertLimitdata(days[8], el, palmsid);
                } else if (index % noOfDayPatternPlan === 9) {
                    await insertLimitdata(days[9], el, palmsid);
                } else if (index % noOfDayPatternPlan === 10) {
                    await insertLimitdata(days[10], el, palmsid);
                } else if (index % noOfDayPatternPlan === 11) {
                    await insertLimitdata(days[11], el, palmsid);
                }
            } else if (noOfDayPatternPlan === 14) {
                if (index % noOfDayPatternPlan === 0) {
                    await insertLimitdata(days[0], el, palmsid);
                } else if (index % noOfDayPatternPlan === 1) {
                    await insertLimitdata(days[1], el, palmsid);
                } else if (index % noOfDayPatternPlan === 2) {
                    await insertLimitdata(days[2], el, palmsid);
                } else if (index % noOfDayPatternPlan === 3) {
                    await insertLimitdata(days[3], el, palmsid);
                } else if (index % noOfDayPatternPlan === 4) {
                    await insertLimitdata(days[4], el, palmsid);
                } else if (index % noOfDayPatternPlan === 5) {
                    await insertLimitdata(days[5], el, palmsid);
                } else if (index % noOfDayPatternPlan === 6) {
                    await insertLimitdata(days[6], el, palmsid);
                } else if (index % noOfDayPatternPlan === 7) {
                    await insertLimitdata(days[7], el, palmsid);
                } else if (index % noOfDayPatternPlan === 8) {
                    await insertLimitdata(days[8], el, palmsid);
                } else if (index % noOfDayPatternPlan === 9) {
                    await insertLimitdata(days[9], el, palmsid);
                } else if (index % noOfDayPatternPlan === 10) {
                    await insertLimitdata(days[10], el, palmsid);
                } else if (index % noOfDayPatternPlan === 11) {
                    await insertLimitdata(days[11], el, palmsid);
                } else if (index % noOfDayPatternPlan === 12) {
                    await insertLimitdata(days[12], el, palmsid);
                } else if (index % noOfDayPatternPlan === 13) {
                    await insertLimitdata(days[13], el, palmsid);
                }
            } else if (noOfDayPatternPlan === 16) {
                if (index % noOfDayPatternPlan === 0) {
                    await insertLimitdata(days[0], el, palmsid);
                } else if (index % noOfDayPatternPlan === 1) {
                    await insertLimitdata(days[1], el, palmsid);
                } else if (index % noOfDayPatternPlan === 2) {
                    await insertLimitdata(days[2], el, palmsid);
                } else if (index % noOfDayPatternPlan === 3) {
                    await insertLimitdata(days[3], el, palmsid);
                } else if (index % noOfDayPatternPlan === 4) {
                    await insertLimitdata(days[4], el, palmsid);
                } else if (index % noOfDayPatternPlan === 5) {
                    await insertLimitdata(days[5], el, palmsid);
                } else if (index % noOfDayPatternPlan === 6) {
                    await insertLimitdata(days[6], el, palmsid);
                } else if (index % noOfDayPatternPlan === 7) {
                    await insertLimitdata(days[7], el, palmsid);
                } else if (index % noOfDayPatternPlan === 8) {
                    await insertLimitdata(days[8], el, palmsid);
                } else if (index % noOfDayPatternPlan === 9) {
                    await insertLimitdata(days[9], el, palmsid);
                } else if (index % noOfDayPatternPlan === 10) {
                    await insertLimitdata(days[10], el, palmsid);
                } else if (index % noOfDayPatternPlan === 11) {
                    await insertLimitdata(days[11], el, palmsid);
                } else if (index % noOfDayPatternPlan === 12) {
                    await insertLimitdata(days[12], el, palmsid);
                } else if (index % noOfDayPatternPlan === 13) {
                    await insertLimitdata(days[13], el, palmsid);
                } else if (index % noOfDayPatternPlan === 14) {
                    await insertLimitdata(days[14], el, palmsid);
                } else if (index % noOfDayPatternPlan === 15) {
                    await insertLimitdata(days[15], el, palmsid);
                }
            }
        }))
        let updatePatternUploads = await UpdateEffectiveToPatternData(date1[date1.length - 1], data[0].LineName, palmsid);
        if (updatePatternUploads) {
            logger.customerLogger.error(error.message);
            return res.send(constant.serverError);
        }
        let pqDataUpload = await UpdateEffectiveToPQDataAfterPatternInterpretationJob(data[0].LineName, date1[0], date1[date1.length - 1], pqDiesetInfoWithDate, res, palmsid);
        if (pqDataUpload) {
            logger.customerLogger.error(error.message);
            return res.send(constant.serverError);
        }
        let updatePatternInterpretation = await updatePatternInterpretationJob(data, date1, res, palmsid);
        if (updatePatternInterpretation) {
            logger.customerLogger.error(updatePatternInterpretation);
            return res.send(constant.serverError);
        }
        return res.send(constant.ptnIntpreSuccess);
    } catch (error) {
        logger.customerLogger.error(error.message);
        return res.send(constant.serverError);
    }
};
const insertLimitdata = async (rowdata, dateString, palmsid) => {
    for (let i = 0; i < Math.ceil(rowdata.length / 40); i++) {
        let batch = rowdata.slice(i * 40, (i + 1) * 40);
        await patternInterpretationUpload(batch, dateString, palmsid);
    }
}
const patternInterpretationUpload = async (rowData, sheduleDate, palmsid) => {
    let insertQuery = `
        INSERT INTO SSPCSdbo.PatternDataInterpretation (
            PatternUploadID, ScheduledDate, LineID, ShiftID, PatternNo, PartSeq,
            DieSetID, PatternStarttime, PatternEndTime, PatternLoadTime, ProjectedOrderingTime,
            ProjectedOrderCycleID, CreatedBy, CreatedDateTime
        ) VALUES
    `;
    const values = rowData.map((data, index) => {
        return `(
            @PatternUploadID${index}, @ScheduledDate${index}, @LineID${index}, @ShiftID${index}, @PatternNo${index}, @PartSeq${index},
            @DieSetID${index}, @PatternStarttime${index}, @PatternEndTime${index}, @PatternLoadTime${index}, @ProjectedOrderingTime${index},
            @ProjectedOrderCycleID${index}, @CreatedBy${index}, @CreatedDateTime${index}
        )`
    }).join(', ');

    insertQuery += values;
    const pool = await sql.connect(config);
    await pool.connect();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
        const request = new sql.Request(transaction);
        rowData.forEach((data, index) => {
            request.input(`PatternUploadID${index}`, sql.Int, data.PatternUploadID);
            request.input(`ScheduledDate${index}`, sql.Date, new Date(sheduleDate));
            request.input(`LineID${index}`, sql.Int, data.LineID);
            request.input(`ShiftID${index}`, sql.Int, data.ShiftId);
            request.input(`PatternNo${index}`, sql.NVarChar, data.PatternNo);
            request.input(`PartSeq${index}`, sql.Int, data.PartSeq);
            request.input(`DieSetID${index}`, sql.Int, data.DieSetID);
            request.input(`PatternStarttime${index}`, sql.NVarChar, null);
            request.input(`PatternEndTime${index}`, sql.NVarChar, null);
            request.input(`PatternLoadTime${index}`, sql.Int, data.EfficiencyPT);
            request.input(`ProjectedOrderingTime${index}`, sql.DateTime, null);
            request.input(`ProjectedOrderCycleID${index}`, sql.Int, 5);
            request.input(`CreatedBy${index}`, sql.Int, Number(palmsid)? Number(palmsid) : 1);
            request.input(`CreatedDateTime${index}`, sql.DateTime, reUsableFun.getISTDate());
        });

        await request.query(insertQuery);
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        logger.customerLogger.error(error.message);
        return res.send(constant.serverError)
    }
};
const updatePatternUpload = async (rowData, EffectiveFrom, EffectiveTo, res) => {
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const request = new sql.Request(transaction);

        for (let index = 0; index < rowData.length; index++) {
            const data = rowData[index];
            const paramIndex = index;

            await request.input(`EffectiveFrom${paramIndex}`, sql.Date, new Date(EffectiveFrom));
            await request.input(`EffectiveTo${paramIndex}`, sql.Date, new Date(EffectiveTo));
            await request.input(`ModifiedBy${paramIndex}`, sql.Int, 1);
            await request.input(`ModifiedDateTime${paramIndex}`, sql.DateTime, reUsableFun.getISTDate());
            await request.input(`PatternUploadID${paramIndex}`, sql.Int, data.PatternUploadID);

            await request.query(`
                UPDATE SSPCSdbo.PatternRawDataUpload
                SET EffectiveFrom = @EffectiveFrom${paramIndex},
                    EffectiveTo = @EffectiveTo${paramIndex},
                    ModifiedBy = @ModifiedBy${paramIndex},
                    ModifiedDateTime = @ModifiedDateTime${paramIndex}
                WHERE PatternUploadID = @PatternUploadID${paramIndex};
            `);
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        logger.customerLogger.error(error.message);
        return res.send(constant.serverError);
    }
};
const updatePatternInterpretationJob = async (rowData, planDateString, res, palmsid) => {
    try {
        // Function to get list of BreakTime available in 24 hours 
        let operatioTimeDetails = await reUsableFun.getBreakTime(rowData[0].LineID, config);
        if (typeof (operatioTimeDetails) === "string") {
            res.send(operatioTimeDetails);
        }
        let operationTime = operatioTimeDetails.operationTime;
        let breakTime = operatioTimeDetails.breakTime;
        breakTime = JSON.stringify(breakTime);
        if (operationTime.length === 0) {
            return res.send("Please add operation time to the ShiftLine table.")
        }
        // Funtion to get list of plan line stop between EffectiveFrom Date to EffectiveTo Date
        let getPlanLineStopDetails = await reUsableFun.getPlanLineStop(rowData[0].EffectiveFrom, planDateString[planDateString.length - 1], rowData[0].LineName, config);
        if (typeof (getPlanLineStopDetails) === 'string') {
            return res.send(getPlanLineStopDetails);
        }
        const pool = await sql.connect(config);
        for (let data of rowData) {
            // query to get Shift Start Time, End time of Previuos PartSeq 
            const existingRecord = await pool.request()
                .input('PatternUploadID', sql.Int, data.PatternUploadID)
                .input('PatternNo', sql.NVarChar, data.PatternNo)
                .input('LineID', sql.Int, rowData[0].LineID)
                .query(`
                          WITH LatestPattern AS ( SELECT TOP(1) PartSeq, ShiftID FROM SSPCSdbo.PatternDataInterpretation WHERE PatternUploadID = @PatternUploadID ),
                        PatternDetails AS ( SELECT * FROM SSPCSdbo.PatternDataInterpretation WHERE PatternNo = @PatternNo AND LineID=@LineID AND PartSeq = (SELECT PartSeq - 1 FROM LatestPattern)),
                        ShiftInfo AS ( SELECT ShiftStartTime, ShiftEndTime FROM ShiftHeader WHERE ShiftID = (SELECT ShiftID FROM LatestPattern))
                        SELECT DISTINCT pd1.*, pd2.PatternEndTime AS prevPatternEndTime, si.ShiftStartTime, si.ShiftEndTime FROM SSPCSdbo.PatternDataInterpretation pd1
                        LEFT JOIN PatternDetails pd2 ON pd1.PartSeq = pd2.PartSeq + 1
                        CROSS JOIN ShiftInfo si WHERE pd1.PatternUploadID = @PatternUploadID ORDER BY pd1.PartSeq;
                      `);
            let shiftStartTime = '';
            if (existingRecord.recordset.length > 0) {
                try {

                    for (let i = 0; i < existingRecord.recordset.length; i++) {
                        let record = existingRecord.recordset[i];
                        let startTime = '';
                        shiftStartTime = record.ShiftStartTime;
                        // start time of pattern 
                        if (record.prevPatternEndTime === null) {
                            let filterOperationTimeBasedOnShiftId = operationTime.filter(el => el.ShiftId === record.ShiftID);
                            //  startTime = record.ShiftStartTime; // 10 min gap from Shift Start time
                            if (filterOperationTimeBasedOnShiftId.length === 0) {
                                return res.send("Please add the Operation time for the Shift ID: " + record.ShiftID + " in the ShiftLine table.");
                            }
                            startTime = filterOperationTimeBasedOnShiftId[0].OperationStartTime;
                        } else {
                            startTime = record.prevPatternEndTime;
                        }
                        // Function to get new start time and EndTime of a Pattern 
                        let timeDetails = await reUsableFun.getEndTime(record.PatternLoadTime, record.ScheduledDate, startTime, breakTime, getPlanLineStopDetails);
                        startTime = timeDetails.newStartTime;
                        let endTime = timeDetails.newEndTime;
                        // Function to get ProjectedOrdering Date
                        let newProjectedOderingDate = await reUsableFun.getOrderingDate(record.ScheduledDate, timeDetails.newStartTime, data.MaterialOrderTriggerInSec, data.LineName, breakTime, getPlanLineStopDetails, shiftStartTime, config);
                        // Function to get Projected Order Cycle ID
                        let OrderCycleID = await reUsableFun.getOrderCycleID(newProjectedOderingDate, data.LineName, config);

                        if (typeof OrderCycleID === 'string') {
                            throw new Error(OrderCycleID);
                        }
                        // Updating the record 
                        await pool.request()
                            .input('PatternStarttime', sql.NVarChar, startTime.toString())
                            .input('PatternEndTime', sql.NVarChar, endTime.toString())
                            .input('PatternInterpretationID', sql.Int, record.PatternInterpretationID)
                            .input('ProjectedOrderingTime', sql.DateTime, newProjectedOderingDate)
                            .input('ProjectedOrderCycleID', sql.Int, OrderCycleID)
                            .query(`
                                UPDATE SSPCSdbo.PatternDataInterpretation
                                SET PatternStarttime = @PatternStarttime,
                                    PatternEndTime = @PatternEndTime,
                                    ProjectedOrderingTime = @ProjectedOrderingTime,
                                    ProjectedOrderCycleID = @ProjectedOrderCycleID
                                WHERE PatternInterpretationID = @PatternInterpretationID
                            `);
                    }

                } catch (error) {
                    logger.customerLogger.error(error.message);
                    return error.message;
                }

            }
        }
    } catch (error) {
        logger.customerLogger.error(error.message);
        res.send(error.message);
    }
};
async function UpdateEffectiveToPQDataAfterPatternInterpretationJob(LineName, EffectiveFrom, EffectiveTo, pqDiesetInfoWithDate, res, palmsid) {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    EffectiveTo = new Date(EffectiveTo);
    let newDate = reUsableFun.getFormattedOnlyDate(EffectiveTo);
    EffectiveFrom = new Date(EffectiveFrom);
    let newDateEffFrom = reUsableFun.getFormattedOnlyDate(EffectiveFrom);

    let query = `
        UPDATE SSPCSdbo.PQDataUpload SET EffectiveTo= @EffectiveTo, EffectiveFrom=@EffectiveFrom, ModifiedDateTime = @ModifiedDateTime, ModifiedBy= @modifiedBy
         WHERE  LineName = @LineName AND EffectiveFrom= @pqDiesetInfoWithDate;
    `;
    const result = await pool.request()
        .input("LineName", sql.NVarChar, LineName)
        .input("EffectiveFrom", sql.Date, EffectiveFrom)
        .input("ModifiedDateTime", sql.DateTime, reUsableFun.getISTDate())
        .input("EffectiveTo", sql.Date, newDate)
        .input("modifiedBy", sql.Int, Number(palmsid)? Number(palmsid) : 1)
        .input('pqDiesetInfoWithDate', sql.Date, pqDiesetInfoWithDate)
        .query(query);

}





