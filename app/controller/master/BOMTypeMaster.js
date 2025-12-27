const sql = require('mssql/msnodesqlv8');
const path = require('path');
const constant = require('../../config/constant');
const logger = require("../../utils/logger");
const reUsableFun = require("../../utils/reUsableFun");
const csv = require('csv-parser');
const { Readable } = require('stream');
const config = require("../../config/dbConfig");
exports.CSVUploadBOMTypeMaster = async (req, res)=> {
    // Checking the file availability
    if (!req.file || !req.file.buffer) {
        logger.customerLogger.error(constant.fileNotFound);
        return res.status(400).send(constant.fileNotFound);
    }
    let {palmsid} = req.headers;
    try {
        const filename = req.file.originalname;
        const extension = path.extname(filename).toLowerCase();
        // Validation of the uploaded file extension.
        if (extension !== '.csv') {
            return res.send(constant.inValidFileType);
        }
        // Path to save the uploaded file.
        const savePath = path.join(constant.bomTypeMaster + '/_' + reUsableFun.getFormattedDate() + "_" + filename);
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
                    logger.customerLogger.error(filename  + " "+ constant.fileEmpty);
                    return res.send(filename  + " " + constant.fileEmpty);
                }
                // Mandatory csv file headers
                const mandatoryFields = ['DieSet', 'DieID', 'NoOfProcess', 'UDTimeInSec', 'CTTimeInSec', 'QCTimeInSec', 'MaterialChangeoverTimePerChangeOverTimeInSec', 'PalletChangeoverTimePerChangeoverInSec', 'SDTimeInSec', 'NoOfPalletPerCycle', 'MaterialOrderTriggerInSec', 'ProductionTriggerInSec', 'DieStorageBay','MBSpecific'
                ];
                const missingFields = mandatoryFields.filter(field => !headers.includes(field));

                if (missingFields.length) {
                    return res.send(`Missing headers: ` + missingFields.join(', ') + " please add the missing headers!");
                }
                const bodyData = results.map(el => ({
                    DieSet: el['DieSet'].trim(),
                    DieID: Number(el['DieID'] === '' ? undefined : el['DieID']),
                    NoOfProcess: Number(el['NoOfProcess'] === '' ? undefined : el['NoOfProcess']),
                    UDTimeInSec: Number(el['UDTimeInSec'] === '' ? undefined : el['UDTimeInSec']),
                    CTTimeInSec: Number(el['CTTimeInSec'] === '' ? undefined : el['CTTimeInSec']),
                    QCTimeInSec: Number(el['QCTimeInSec'] === '' ? undefined : el['QCTimeInSec']),
                    MaterialChangeoverTimePerChangeOverTimeInSec: Number(el['MaterialChangeoverTimePerChangeOverTimeInSec'] === '' ? undefined : el['MaterialChangeoverTimePerChangeOverTimeInSec']),
                    PalletChangeoverTimePerChangeoverInSec: Number(el['PalletChangeoverTimePerChangeoverInSec'] === '' ? undefined : el['PalletChangeoverTimePerChangeoverInSec']),
                    SDTimeInSec: Number(el['SDTimeInSec'] === '' ? undefined : el['SDTimeInSec']),
                    NoOfPalletPerCycle: Number(el['NoOfPalletPerCycle'] === '' ? undefined : el['NoOfPalletPerCycle']),
                    MaterialOrderTriggerInSec: Number(el['MaterialOrderTriggerInSec'] === '' ? undefined : el['MaterialOrderTriggerInSec']),
                    ProductionTriggerInSec: Number(el['ProductionTriggerInSec'] === '' ? undefined : el['ProductionTriggerInSec']),
                    DieStorageBay:  el['DieStorageBay'],
                    MBSpecific : reUsableFun.stringToBoolean(el['MBSpecific'])
                }));
                let DublicateBomType = await reUsableFun.findDuplicateColumn(bodyData, "DieSet");
                if (DublicateBomType.length > 0) {
                    return res.send("Duplicate DieSet values: " + DublicateBomType.join(", ") + constant.checkAndModifyFile);
                }
                // Acceptable data types for each header in a CSV file
                let mandatoryFieldDataTypes = ['string', 'integer', "integer", "integer", "number", "integer", "number", "number", "integer", "integer", "integer", "integer", "string",'boolean'];
                const specificValueChecks = {
                    DieStorageBay: ["LH", "RH", "MID"] 
                };
                // Function to validate each row for correct data types, value constraints, and nullability of each column.
                const invalidColumnCheck = await reUsableFun.checkInvalidColumn(bodyData, mandatoryFields, mandatoryFieldDataTypes, specificValueChecks);
                if (invalidColumnCheck) {
                    return res.send(invalidColumnCheck.error + constant.missingColumn);
                }
                const pool = await sql.connect(config);
                let BOMTypeResult = await pool.request()
                    .query(`
                              SELECT DISTINCT * FROM KitBOM
                            `)
                if (BOMTypeResult.recordset.length === 0) {
                    return res.send("KitBOM table is empty, please add the data to the KitBom");
                }
                const InsertOrUpdateDataToDb = async (rowData, savePath,palmsid) => {

                    let notAvailableBomtype = [],NoOfPalletPerCycleDieSet=[];
                    for (let data of rowData) {
                        const BOMTypeFilter =  BOMTypeResult.recordset.filter(category => category.BOMType?.toLowerCase() === data.DieSet.toLowerCase().trim())
                        if (BOMTypeFilter.length === 0) {
                            notAvailableBomtype.push(data.DieSet);
                        }

                        if(data.NoOfPalletPerCycle  <= 0){
                            NoOfPalletPerCycleDieSet.push(data.DieSet);
                        }
                    }
                    if (notAvailableBomtype.length > 0) {
                        return res.send("These DieSet values are not available in the KitBOM table: " + notAvailableBomtype.join(", ") + constant.checkAndModifyFile);
                    }
                    if(NoOfPalletPerCycleDieSet.length > 0){
                        return res.send("These DieSet NoOfPalletPerCycle value should not be <= 0 " + NoOfPalletPerCycleDieSet.join(", ") + constant.checkAndModifyFile);
                    }

                    for (let data of rowData) {
                        const { DieSet, DieID, NoOfProcess } = data;
                        const BOMTypeFilter =  BOMTypeResult.recordset.filter(category => category.BOMType === DieSet)
                        const existingRecord = await pool.request()
                            .input('DieSet', sql.NVarChar, DieSet)
                            .input('DieID', sql.Int, DieID)
                            .query(`
                                SELECT COUNT(*) AS count
                                FROM SSPCSdbo.BOMTypeMaster
                                WHERE DieSet=@DieSet
                            `);

                        if (existingRecord.recordset[0].count > 0) {
                            // Update existing record
                            await pool.request()
                                .input('DieSet', sql.NVarChar, data.DieSet)
                                .input('DieID', sql.Int, data.DieID)
                                .input('NoOfProcess', sql.Int, data.NoOfProcess)
                                .input('UDTime', sql.Int, data.UDTimeInSec)
                                .input('CTTime', sql.Decimal(10,2), data.CTTimeInSec)
                                .input('QCTime', sql.Int, data.QCTimeInSec)
                                .input('MaterialChangeoverTimePerChangeOverTime', sql.Decimal(10,2), data.MaterialChangeoverTimePerChangeOverTimeInSec)
                                .input('PalletChangeoverTimePerChangeover', sql.Decimal(10,2), data.PalletChangeoverTimePerChangeoverInSec)
                                .input('SDTime', sql.Int, data.SDTimeInSec)
                                .input('NoOfPalletPerCycle', sql.Int, data.NoOfPalletPerCycle)
                                .input('MaterialOrderTriggerInSec', sql.Int, data.MaterialOrderTriggerInSec)
                                .input('ProductionTriggerInSec', sql.Int, data.ProductionTriggerInSec)
                                .input('DieStorageBay', sql.NVarChar, data.DieStorageBay)
                                .input('MBSpecific', sql.Bit, data.MBSpecific)
                                .input('ReferenceFileName', sql.NVarChar, savePath)
                                .input('ModifiedBy', sql.Int, Number(palmsid)? Number(palmsid) : 1)
                                .input('ModifiedDateTime', sql.DateTime, reUsableFun.getISTDate())
                                .query(`
                                    UPDATE SSPCSdbo.BOMTypeMaster
                                    SET UDTime = @UDTime,
                                        CTTime = @CTTime,
                                        QCTime = @QCTime,
                                        MaterialChangeoverTimePerChangeOverTime = @MaterialChangeoverTimePerChangeOverTime,
                                        PalletChangeoverTimePerChangeover = @PalletChangeoverTimePerChangeover,
                                        SDTime = @SDTime,
                                        NoOfPalletPerCycle = @NoOfPalletPerCycle,
                                        MaterialOrderTriggerInSec = @MaterialOrderTriggerInSec,
                                        ProductionTriggerInSec = @ProductionTriggerInSec,
                                        DieStorageBay = @DieStorageBay,
                                        NoOfProcess=@NoOfProcess,
                                        MBSpecific=@MBSpecific,
                                        ReferenceFileName = @ReferenceFileName,
                                        ModifiedBy = @ModifiedBy,
                                        ModifiedDateTime = @ModifiedDateTime
                                    WHERE DieSet=@DieSet
                                    AND DieID= @DieID
                                    
                                `);
                        } else {
                            // Insert new records
                            await pool.request()
                               // .input("DieSetID", sql.Int, BOMTypeFilter[0].KitID)
                                .input('DieSet', sql.NVarChar, data.DieSet)
                                .input('DieID', sql.Int, data.DieID)
                                .input('NoOfProcess', sql.Int, data.NoOfProcess)
                                .input('UDTime', sql.Int, data.UDTimeInSec)
                                .input('CTTime', sql.Decimal(10,2), data.CTTimeInSec)
                                .input('QCTime', sql.Int, data.QCTimeInSec)
                                .input('MaterialChangeoverTimePerChangeOverTime', sql.Decimal(10,2), data.MaterialChangeoverTimePerChangeOverTimeInSec)
                                .input('PalletChangeoverTimePerChangeover', sql.Decimal(10,2), data.PalletChangeoverTimePerChangeoverInSec)
                                .input('SDTime', sql.Int, data.SDTimeInSec)
                                .input('NoOfPalletPerCycle', sql.Int, data.NoOfPalletPerCycle)
                                .input('MaterialOrderTriggerInSec', sql.Int, data.MaterialOrderTriggerInSec)
                                .input('ProductionTriggerInSec', sql.Int, data.ProductionTriggerInSec)
                                .input('DieStorageBay', sql.NVarChar, data.DieStorageBay)
                                .input('MBSpecific', sql.Bit, data.MBSpecific)
                                .input('ReferenceFileName', sql.NVarChar, savePath)
                                .input('CreatedBy', sql.Int, Number(palmsid)? Number(palmsid) : 1)
                                .input('CreatedDateTime', sql.DateTime, reUsableFun.getISTDate())
                                .query(`
                                    INSERT INTO SSPCSdbo.BOMTypeMaster (
                                      DieSet, DieID, NoOfProcess, UDTime, CTTime, QCTime,MaterialChangeoverTimePerChangeOverTime,
                                        PalletChangeoverTimePerChangeover, SDTime, NoOfPalletPerCycle, MaterialOrderTriggerInSec,
                                        ProductionTriggerInSec,DieStorageBay,MBSpecific, ReferenceFileName, CreatedBy,CreatedDateTime
                                    ) VALUES (
                                         @DieSet, @DieID, @NoOfProcess, @UDTime, @CTTime, @QCTime ,@MaterialChangeoverTimePerChangeOverTime,
                                        @PalletChangeoverTimePerChangeover, @SDTime, @NoOfPalletPerCycle, @MaterialOrderTriggerInSec,
                                        @ProductionTriggerInSec, @DieStorageBay,@MBSpecific, @ReferenceFileName, @CreatedBy,@CreatedDateTime
                                    )
                                `);
                        }
                    }
                    // Saving the data in CSV format to the specified path.
                    reUsableFun.SaveJsonToCsvFile(rowData, savePath);
                    console.log('Data inserted/updated successfully');
                    res.send(constant.successResponse);
                };
                await InsertOrUpdateDataToDb(bodyData, savePath,palmsid);
            });
    } catch (error) {
        logger.customerLogger.error('Unexpected error:', error);
        res.status(500).send('Internal server error');
    }
};