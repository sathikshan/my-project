const express = require('express');
const masterRouter = express.Router();
const multer = require("multer");
const { excelUploadLineEfficiency } = require('../controller/master/lineEfficiency');
const { excelUploadPlannedLineStop } = require('../controller/master/plannedLineStop');
const storage = multer.memoryStorage();

const diskStorage = multer.diskStorage({ 
    destination: function (req, file, cb) {
        const uploadPath = path.join('D:', 'ExcelUpload');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB max file size
    }
});

const diskUpload = multer({
    storage: diskStorage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB max file size
    }
});


masterRouter.post("/upload/lineEfficiency", upload.single('file'), excelUploadLineEfficiency);
masterRouter.post("/uploadPlanLine/PlannedLineStop", upload.single('file'), excelUploadPlannedLineStop);
// masterRouter.post("/uploadShift/ShiftChangeover", upload.single('file'), excelUploadShiftChangeover);
// masterRouter.post("/upload/orderCycle", upload.single('file'), excelUploadOrderCycle);
// masterRouter.post("/upload/skuMaster", upload.single('file'), excelUploadSKUMaster);
// masterRouter.post("/upload/BOMTypeMaster", upload.single('file'), excelUploadBOMTypeMaster);
// masterRouter.post("/upload/PQDataMaster", upload.single('file'), excelUploadPQData);

module.exports = masterRouter;
