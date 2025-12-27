const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const bodyParser = require("body-parser");
const multer = require('multer');
const fs = require("fs");
const path = require('path');
const constant = require('./app/config/constant');
const app = express();
const logger = require("./app/utils/logger");
const csv = require('csv-parser');
const { Readable } = require('stream');
const dbConfig = require("./app/config/dbConfig");
const reUsableFun = require("./app/utils/reUsableFun");
const { CSVLineEffieciency} = require("./app/controller/master/LineEfficiencyMaster");
const { CSVUploadBOMTypeMaster} = require("./app/controller/master/BOMTypeMaster");
const {CSVUploadOrderCycle} = require("./app/controller/master/OrderCycle");
const {CSVPatternUpload} = require("./app/controller/master/PatternRawDataUpload");
const { CSVUploadPQData } = require("./app/controller/master/PQDataUpload");
const { CSVShiftChangeover } = require("./app/controller/master/ShiftChangeOver");
const { CSVUploadSKUMaster } = require("./app/controller/master/SkuMaster");
const { CSVPlannedLineStop } = require("./app/controller/master/plannedLineStop");
const { productionDashboard } = require('./app/controller/Reports/ProductionControlDashBoard');
const { partorder, getShift ,downloadPartOrderCSV} = require('./app/controller/Reports/PartOrderDashboard');
const { productionLoadTimeChart } = require('./app/controller/Reports/loadtTimeChart');
// const masterRouter = require('./app/routes/master.routes');
const { error } = require('console');
const { DateTime } = require('msnodesqlv8');
const {  MaterialToBeOrdered, MaterialOrdered, getLineOrderCycleOptions, UpdateMaterialOrderedStatus, UpdateMaterialOrderedCancel, addToOrder, UpdateMaterialOrderedQtyAndKanbans, addOtherPartsMaterialProcurement, materialSKUTransaction, saveSapOrderDetails,removePoListFromOrderedListCalculationDetails } = require('./app/controller/MaterialProcurement/MaterialProcurement');
const { currentShiftDetails, getLineOptions, addFLVTAndPartsBelowSafetyStock, addOtherParts, updatePatternStatus, getShiftDetails, updatePartSeq, applyChanges, fetchDetailsForQueuedStatus, SKUTransaction, handleSkipButton, handleDiscButton, handleDiscontinued } = require('./app/controller/ProductionScreen/CurrentShift/currentShift');
const { nextShiftDetails } = require('./app/controller/ProductionScreen/NextShift/nextShift');
const {nextShiftQueueApplyChanges, nextShiftQueueUpdatePartSeq, nextShiftQueueSKUTransaction, nextShiftQueueFetchDetailsForQueuedStatus, nextShiftQueueUpdatePatternStatus, nextShiftQueueAddOtherParts, nextShiftQueueAddFLVTAndPartsBelowSafetyStock, nextShiftQueueDetails, nextShiftQueueGetShiftDetails, nextShiftQueueGetLineOptions} = require('./app/controller/ProductionScreen/NextShiftQueue/nextShiftQueue');
const { getInspectionReportData } = require('./app/controller/Reports/InspectionReparReport');

app.use(cors({ origin: "*" }));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json());
app.use(bodyParser.json());
const storage = multer.memoryStorage();;

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB max file size
    }
});


const config = {
    server: dbConfig.server,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    driver: dbConfig.driver,
    options: {
        trustedConnection: dbConfig.options.trustedConnection,
    }
};
// Global SQL pool
let pool;

// Connect to the database
async function connectDatabase() {
    try {
        pool = await new sql.ConnectionPool(config).connect();
        console.log('Connected to database');
    } catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1);
    }
}
let port = dbConfig.port || 8081;
app.listen(port, async () => {
    console.log(`Server is running on port: ${port}`);
    await connectDatabase();
    await executeSqlScript();
});

app.get("/", (req,res)=>{
    res.send("Welcome to the press shop");
})
app.post('/upload/patternRowData', upload.single('file'), CSVPatternUpload);
app.post("/upload/lineEfficiency", upload.single('file'), CSVLineEffieciency);
app.post("/uploadPlanLine/PlannedLineStop", upload.single('file'), CSVPlannedLineStop);
app.post("/uploadShift/ShiftChangeover", upload.single('file'), CSVShiftChangeover);
app.post("/upload/orderCycle", upload.single('file'), CSVUploadOrderCycle);
app.post("/upload/skuMaster", upload.single('file'), CSVUploadSKUMaster);
app.post("/upload/BOMTypeMaster", upload.single('file'), CSVUploadBOMTypeMaster);
app.post("/upload/PQDataMaster", upload.single('file'), CSVUploadPQData);



app.post("/currentShiftDetails", currentShiftDetails);
app.post("/nextShiftDetails", nextShiftDetails);
app.post("/addFLVTAndPartsBelowSafetyStock", addFLVTAndPartsBelowSafetyStock);
app.post("/addOtherParts", addOtherParts);
app.post("/updatePatternStatus",updatePatternStatus)    ;
app.get("/getLineOptions",getLineOptions);
app.post("/getShiftDetails",getShiftDetails);
app.post("/updatePartSeq", updatePartSeq);
app.post("/applyChanges", applyChanges);
app.post("/fetchDetailsForQueuedStatus", fetchDetailsForQueuedStatus);
app.post("/SKUTransaction", SKUTransaction);
app.post("/handleSkipButton", handleSkipButton);
app.post("/handleDiscButton", handleDiscButton);
app.post("/handleDiscontinued",handleDiscontinued);

app.post("/nextShiftQueueGetLineOptions", nextShiftQueueGetLineOptions);
app.post("/nextShiftQueueGetShiftDetails", nextShiftQueueGetShiftDetails);
app.post("/nextShiftQueueDetails", nextShiftQueueDetails);
app.post("/nextShiftQueueAddFLVTAndPartsBelowSafetyStock",nextShiftQueueAddFLVTAndPartsBelowSafetyStock)
app.post("/nextShiftQueueAddOtherParts",nextShiftQueueAddOtherParts);
app.post("/nextShiftQueueUpdatePatternStatus",nextShiftQueueUpdatePatternStatus);
app.post("/nextShiftQueueFetchDetailsForQueuedStatus",nextShiftQueueFetchDetailsForQueuedStatus);
app.post("/nextShiftQueueSKUTransaction",nextShiftQueueSKUTransaction);
app.post("/nextShiftQueueApplyChanges",nextShiftQueueApplyChanges);
app.post("/nextShiftQueueUpdatePartSeq",nextShiftQueueUpdatePartSeq);

app.post("/getOrderCycleOption",getLineOrderCycleOptions );

app.post("/productionDashboard",productionDashboard);
app.post("/productionPartOrderDashBoard",partorder);
app.post("/productionLoadTimeChart", productionLoadTimeChart);
app.post("/getShift",getShift);



app.post("/materialProcurement/toBeOrdered", MaterialToBeOrdered);
app.post("/materialProcurement/Ordered", MaterialOrdered);
app.put('/toBeOrdered/order',UpdateMaterialOrderedStatus);
app.put('/ordered/cancel',UpdateMaterialOrderedCancel);
app.post('/materialProcurement/addToOrder',addToOrder );
app.put('/toBeOrdered/orderedQtyAdjustment',UpdateMaterialOrderedQtyAndKanbans);
app.post('/materialProcurement/addOtherParts', addOtherPartsMaterialProcurement);
app.post('/material/skuTransaction',materialSKUTransaction);
app.post('/materialProcurement/saveSapOrderDetails', saveSapOrderDetails);
app.post('/materialProcurement/remove/record/editorpanel', removePoListFromOrderedListCalculationDetails);

// Inspection and Repair Reports
app.get('/inspection/repair/repair/getdata', getInspectionReportData);

const executeSqlScript = async () => {
    try {
        // Read SQL script
        const sqlFilePath = path.join(__dirname, './sqlQuery.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf-8');

        // Connect to the database
        let pool = await sql.connect(config);

        // Execute SQL script
        await pool.request().query(sqlScript);

        console.log('SQL script executed successfully');
    } catch (err) {
        console.error('Error executing SQL script:', err);
    }
};

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
    // Clean up resources or perform other necessary actions
    process.exit(1); // Exit with failure code
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Clean up resources or perform other necessary actions
    process.exit(1); // Exit with failure code
});

process.on('SIGINT', () => {
    console.log('Closing database connection');
    if (pool) {
        pool.close();
    }
    process.exit();
});
//1
        // All DateString -5:30 to use this 
        // const date = new Date();
        // const options = {
        //   timeZone: 'Asia/Kolkata'
        // };
        // const istDate = date.toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}); // done
// 2  PQData EffectiveTo updation before excloding data  // done
// 3  Effective to of old plan should check holiday      // Done