
class EditorPanel extends palms.exported.gwt.user.client.ui.VerticalPanel {
    constructor(instance) {
        super();
        this.lotAdjustmentGrid = null;
        this.headerGrid = null;
        this.statusSummeryGrid = null;
        this.instance = instance; // Receive instance in constructor
        this.currentShift = instance.currentShift; // Use currentShift from instance
        this.recordData = null;
        this.setWidth("100%");
        this.setHeight("100%");
        this.setSpacing(10);
        this.userLoggedInRole = instance.userLoggedInRole;
        this.userLoggedInId = null;
    }

    Initialize() {
        //this.addHeaderGrid();
        this.addSummeryGrid();
        this.PrepareGrid();
        this.addButtons();
        this.userLoggedInId = palms.exported.framework.PalmsUIApplication.getLoggedInUserID();
        
    }

    // addHeaderGrid() {
    //     this.headerGrid = new palms.exported.framework.grid.Grid(null, ProductionControlGridLineEntity);

    //     const statusCC = new palms.exported.framework.grid.EditableColumnConfiguration("status", "Status", false, ColumnType.ReadOnlyString, true);
    //     this.headerGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("ptns", "Pattern", false, ColumnType.ReadOnlyString, true));
    //     this.headerGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("dieSet", "Die Set", false, ColumnType.ReadOnlyString, true));
    //     this.headerGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("lotNo", "Lot No", false, ColumnType.ReadOnlyString, true));
    //     this.headerGrid.addColumn(statusCC);

    //     this.add(this.headerGrid.asWidget());
    //     this.setCellWidth(this.headerGrid.asWidget(), "100%");
    //     this.setCellHeight(this.headerGrid.asWidget(), "auto");

    //     const statusRenderer = new palms.exported.framework.grid.GridCellRenderer(ProductionControlGridLineEntity);
    //     statusRenderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
    //         parentStyle.backgroundColor = record.statusTextBgColor;
    //         parentStyle.color = record.statusTextColor;
    //     }
    //     statusCC.setRenderer(statusRenderer);

    //     this.headerGrid.initialize();
    //     this.headerGrid.setDefaultCellValue("-");
    //     this.headerGrid.renderGrid();

    //     this.setHeaderGridRecords(new ProductionControlGridLineEntity());
    // }

    addSummeryGrid() {
        this.statusSummeryGrid = new palms.exported.framework.grid.Grid("Status Summary", ProductionControlGridLineEntity);

        this.statusSummeryGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("planStartAndEnd", "Plan Start-End", false, ColumnType.ReadOnlyString, true));
        this.statusSummeryGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("loadTime", "Load Time", false, ColumnType.ReadOnlyInteger, true));
        this.statusSummeryGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("actualStartAndEnd", "Actual Start-End", false, ColumnType.ReadOnlyString, true));
        this.statusSummeryGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("actualLoadTime", "Actual Load Time", false, ColumnType.ReadOnlyInteger, true));
        this.statusSummeryGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("delay", "Delay", false, ColumnType.ReadOnlyString, true));

        this.add(this.statusSummeryGrid.asWidget());
        this.setCellWidth(this.statusSummeryGrid.asWidget(), "100%");
        this.setCellHeight(this.statusSummeryGrid.asWidget(), "auto");

        this.statusSummeryGrid.initialize();
        this.statusSummeryGrid.setDefaultCellValue("-");
        this.statusSummeryGrid.renderGrid();

        this.setSummeryGridRecords(new ProductionControlGridLineEntity());
    }

    PrepareGrid() {
        this.lotAdjustmentGrid = new palms.exported.framework.grid.Grid("Lot Adjustment", LotAdjustmentEntity);

        this.prodOrderCC = new palms.exported.framework.grid.EditableColumnConfiguration("prodOrder", "Prod Order", false, ColumnType.TextBoxString, true)
        this.lotAdjustmentGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("ptnLotSize", "Ptn Lot Size", false, ColumnType.ReadOnlyString, true));
        this.lotAdjustmentGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('bomSeq', 'Bom Seq', false, ColumnType.ReadOnlyString, true));
        this.lotAdjustmentGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("parts", "Child Part", false, ColumnType.ReadOnlyString, true));
        this.lotAdjustmentGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("recOrder", "Rec Order", false, ColumnType.ReadOnlyString, true));
        this.lotAdjustmentGrid.addColumn(this.prodOrderCC);
        this.lotAdjustmentGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration("planLotSize", "Plan Lot Size", false, ColumnType.LinkString, true));

        this.lotAdjustmentGrid.addRowSpanColumn("ptnLotSize");
        this.lotAdjustmentGrid.addRowSpanColumn("planLotSize");

        let instance = this;
        this.lotAdjustmentGrid.onLinkClick = function (columnID, rowIndex) {
            if (columnID == 'planLotSize') {
                const partsStock = [];
                const materialStock = [];
                const emptyPallets = [];
                const selectedRecord = instance.lotAdjustmentGrid.getRecordAt(rowIndex);
                const currentShift = instance.currentShift;
                var planLotSize = selectedRecord.get(columnID);
                var gridEntity = currentShift.grid.find(x => x.planLotSize === planLotSize);

                if (gridEntity) {
                    gridEntity.partsStock.forEach(function (id) {
                        var entity = currentShift.partsStock.find(x => x.id === id);
                        if (entity)
                            partsStock.push(entity);
                    });
                    gridEntity.materialStock.forEach(function (id) {
                        var entity = currentShift.materialStock.find(x => x.id === id);
                        if (entity)
                            materialStock.push(entity);
                    });
                    gridEntity.emptyPallets.forEach(function (id) {
                        var entity = currentShift.emptyPallets.find(x => x.id === id);
                        if (entity)
                            emptyPallets.push(entity);
                    });
                }

                let popupDialog = new LotSizeCalculationsPopup();
                popupDialog.setGlassEnabled(true);
                popupDialog.initialize();
                popupDialog.setAnimationEnabled(true);
                popupDialog.setAutoHideEnabled(true);
                popupDialog.center();
                popupDialog.showModal();
                popupDialog.setRecords(partsStock, materialStock, emptyPallets);
            }
        }

        this.add(this.lotAdjustmentGrid.asWidget());
        this.setCellWidth(this.lotAdjustmentGrid.asWidget(), "100%");
        this.setCellHeight(this.lotAdjustmentGrid.asWidget(), "auto");

        this.lotAdjustmentGrid.initialize();
        this.lotAdjustmentGrid.renderGrid();

        this.lotAdjustmentGrid.onCellFocus = function (rowIndex, columnID) {
            var value = instance.lotAdjustmentGrid.getCellValue(rowIndex, columnID);
            var intValue = parseInt(value);
            var text = null;
            if (isNaN(intValue)) {
                text = "";
            } else {
                text = intValue + "";
            }
            instance.lotAdjustmentGrid.setCellValue(rowIndex, columnID, text);
        };
        this.lotAdjustmentGrid.onCellBlur = function (rowIndex, columnID) {
            var value = instance.lotAdjustmentGrid.getCellValue(rowIndex, columnID);
            var intValue = parseInt(value);
            console.log("Int value", intValue);
            var text = null;
            var record = instance.lotAdjustmentGrid.getRecordAt(rowIndex);
            var qpc = record ? record.get('qpc') : 1;
            console.log("qpc value:", qpc);
            if (isNaN(intValue)) {
                text = "";
            } else {
                text = intValue + " (" + intValue * qpc + ")";
                console.log("text", text);
            }
            instance.lotAdjustmentGrid.setCellValue(rowIndex, columnID, text);
        };

        if(this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS"){
            this.lotAdjustmentGrid.onValueChange = function (rowIndex, columnID) {
                instance.defaultBtn.setEnabled(true);
                instance.applyChangesBtn.setEnabled(true);
            };
        }

        // this.lotAdjustmentGrid.onValueChange = function (rowIndex, columnID) {
        //     instance.defaultBtn.setEnabled(true);
        //     instance.applyChangesBtn.setEnabled(true);
        // };

        this.addGridButtons();
    }

    addGridButtons() {
        let instance = this;

        this.defaultBtn = new palms.client.framework.selfValidatingControls.ButtonControl();
        this.defaultBtn.setText("Reset to Default");
        this.defaultBtn.setEnabled(false);
        this.defaultBtn.onClick = () => {
            instance.setRecordData(instance.recordData);
        }

        this.applyChangesBtn = new palms.client.framework.selfValidatingControls.ButtonControl();
        this.applyChangesBtn.setText("Apply Changes");
        this.applyChangesBtn.setEnabled(false);
        this.applyChangesBtn.onClick = () => {
            instance.defaultBtn.setEnabled(false);
            instance.applyChangesBtn.setEnabled(false);
            instance.applyChanges();
        }

        const hPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
        hPanel.add(this.defaultBtn.asWidget());
        hPanel.add(this.applyChangesBtn.asWidget());

        this.add(hPanel.asWidget());
        this.setCellWidth(hPanel.asWidget(), "auto");
        this.setCellHeight(hPanel.asWidget(), "auto");
        this.setCellHorizontalAlignment(hPanel.asWidget(), HorizontalAlignment.ALIGN_RIGHT);
    }

    addButtons() {
        const skipProductionBtn = new palms.client.framework.selfValidatingControls.ButtonControl();
        skipProductionBtn.setText("SKIP PRODUCTION");
        skipProductionBtn.onClick = () => {
            const popup = new SkipProductionPopup(this.recordData, this.instance);
            popup.setGlassEnabled(true);
            popup.initialize();
            popup.setAnimationEnabled(true);
            popup.setAutoHideEnabled(true);
            popup.center();
            popup.showModal();
        };

        const discontinueBtn = new palms.client.framework.selfValidatingControls.ButtonControl();
        discontinueBtn.setText("DISCONTINUE");
        discontinueBtn.onClick = () => {
            const popup = new DisContinuePopup(this.recordData, this.instance);
            popup.setGlassEnabled(true);
            popup.initialize();
            popup.setAnimationEnabled(true);
            popup.setAutoHideEnabled(true);
            popup.center();
            popup.showModal();
        };

        const orderToLineBtn = new palms.client.framework.selfValidatingControls.ButtonControl();
        orderToLineBtn.setText("ORDER TO LINE");

        orderToLineBtn.onClick = () => {
            // Prepare the data payload for the API call
            const dataToSave = {
                dieSet: this.recordData.dieSet,
                shift: this.currentShift.shift,
                line: this.currentShift.line,
                date: this.currentShift.currentDate,
                reason: '', // Empty string for reason
                action: 'Queued', // Action set to "Order To Line"
                user: this.userLoggedInId,
                actualID: this.recordData.actualID
            };

            const host = new ProductionHostDetails();

            // Set up the web service proxy for the API call
            const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            //proxy.url = "http://localhost:8081/fetchDetailsForQueuedStatus"; // Backend service URL
            proxy.url = host.url + "fetchDetailsForQueuedStatus";
            proxy.payLoad = JSON.stringify(dataToSave); // Data payload to be sent
            proxy.method = "POST"; // HTTP method
            proxy.contentType = "application/json; charset=utf-8"; // Content type
            proxy.timeout = 20000; // Request timeout in milliseconds
            proxy.keepAlive = false; // Keep-alive setting

            const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

            callback.onSuccess = function(inputData) {
                try {

                    if (!inputData.startsWith("{") && !inputData.startsWith("[")) {
                        alert(inputData); 
                         console.log(inputData);
                        return;
                      }
                    const parsedData = JSON.parse(inputData);
            
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        this.callSKUTransactionsService(parsedData)
                    } else {
                        alert("Unexpected response format.");
                    }
                } catch (error) {
                    
                        console.error("Unknown response format:", inputData);
                        alert("An unexpected error occurred.");

                }
            }.bind(this);

            // On failure, log the error and alert the user
            callback.onFailure = function(errorDescription) {
                console.error("Error updating pattern status:", errorDescription);
                alert(errorDescription);
            };

            // Invoke the web service with the configured proxy and callback
            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        };

        const hPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
        hPanel.add(skipProductionBtn.asWidget());
        hPanel.add(discontinueBtn.asWidget());
        hPanel.add(orderToLineBtn.asWidget());

        this.add(hPanel.asWidget());
        this.setCellWidth(hPanel.asWidget(), "auto");
        this.setCellHeight(hPanel.asWidget(), "100%");
        this.setCellHorizontalAlignment(hPanel.asWidget(), HorizontalAlignment.ALIGN_RIGHT);
        this.setCellVerticalAlignment(hPanel.asWidget(), VerticalAlignment.ALIGN_BOTTOM);

        // Save button references for enabling/disabling based on status
        this.skipProductionBtn = skipProductionBtn;
        this.discontinueBtn = discontinueBtn;
        this.orderToLineBtn = orderToLineBtn;
    }

    callSKUTransactionsService(inputArray) {
        const self = this;
        let skuTransactionList = new palms.exported.framework.webServiceAccess.EntityList();
    
        inputArray.forEach(item => {
            let skuTransactionEntity = new palms.client.framework.entity.GenericEntity();
    
            // Set entity fields for SKUTransactionsFromHandheldAction service
            skuTransactionEntity.set("WarehouseID", item.WarehouseID);
            skuTransactionEntity.set("PrimaryCompanyID", item.PrimaryCompanyID);
            skuTransactionEntity.set("WarehousePrimaryCompanyID", item.WarehousePrimaryCompanyID);
            skuTransactionEntity.set("CostBucketID", item.CostBucketID);

            skuTransactionEntity.set("SKUCostID", item.SKUCostID);
            skuTransactionEntity.set("SKUBatchID", item.SKUBatchID);
           
            skuTransactionEntity.set("FromLocationID", item.FromLocationID);
            skuTransactionEntity.set("ToLocationID", item.ToLocationID);

            skuTransactionEntity.set("TransactionTypeID", item.TransactionTypeID); 
            skuTransactionEntity.set("SKUCode", item.SKUCode);

            skuTransactionEntity.set("StockTransferQuantityInStorageUOM", item.StockTransferQuantityInStorageUOM);
            skuTransactionEntity.set("AvailableQuantityInStorageUOM", item.AvailableQuantityInStorageUOM); 

            skuTransactionEntity.set("CustomFields",JSON.stringify(item.CustomFields));
    
            skuTransactionList.add(skuTransactionEntity);

            console.log("SKU transaction",skuTransactionList);
        });
        
    
        let skuTransactionCallback = {
            onSuccess: function() {
                    alert("Ordered to line!");
                    self.refreshShiftDetails();
            },
            onFailure: function(error) {
                console.error("Failed in SKUTransactionsFromHandheldAction.", error);
                alert("Failed in SKUTransactionsFromHandheldAction.", error);
            }
        };
    
        let skuTransactionWebServiceName = "SKUTransactionsFromHandheldAction.asmx";
        let skuTransactionWebServicePath = "Actions";
        let skuTransactionWao = new palms.exported.framework.webServiceAccess.WebServiceAccessObjectForAction(skuTransactionWebServiceName, skuTransactionWebServicePath);
        skuTransactionWao.performAction(skuTransactionList, "CREATE", skuTransactionCallback);
    }

    updateButtonStates(status) {
        //if (this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS" ) {

            if (status === 'Queued' || status === 'In Progress' || status === 'Skipped' || status === 'Discontinued' || status === 'Completed') {
                // Change to ReadOnlyString
                this.prodOrderCC.setColumnType(ColumnType.ReadOnlyString);
            } else {
                // Keep it as TextBoxString for other statuses
                this.prodOrderCC.setColumnType(ColumnType.TextBoxString);
            }
            this.lotAdjustmentGrid.renderGrid();
            
            if ((this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS" || this.userLoggedInRole === "21C" || this.userLoggedInRole === "22A" || this.userLoggedInRole === "24A") && status === 'In Progress'){
                this.discontinueBtn.setEnabled(true);
            }else{
                this.discontinueBtn.setEnabled(false);
            }

            if ((this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS" ) && (status === 'To be Scheduled' || status === 'Queued')){
                this.skipProductionBtn.setEnabled(true);
            }else{
                this.skipProductionBtn.setEnabled(false);
            }

            if ((this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS" ) && status === 'To be Scheduled'){
                this.orderToLineBtn.setEnabled(true);
            }else{
                this.orderToLineBtn.setEnabled(false);
            }



            // if (status === 'To be Scheduled') {
            //     this.discontinueBtn.setEnabled(false);
            //     this.orderToLineBtn.setEnabled(true);
            //     this.skipProductionBtn.setEnabled(true);
            // } else if (status === 'Queued') {
            //     this.discontinueBtn.setEnabled(false);
            //     this.orderToLineBtn.setEnabled(false);
            //     this.skipProductionBtn.setEnabled(true);
            // } else if (status === 'In Progress') {
            //     this.discontinueBtn.setEnabled(true);
            //     this.orderToLineBtn.setEnabled(false);
            //     this.skipProductionBtn.setEnabled(false);
            // } else if (status === 'Skipped' || status === 'Discontinued' || status === 'Completed') {
            //     this.discontinueBtn.setEnabled(false);
            //     this.orderToLineBtn.setEnabled(false);
            //     this.skipProductionBtn.setEnabled(false);
            // } 
            // else {
            //     console.warn("Unknown status: No button updates made.");
            // }
        // } else {
        //     this.prodOrderCC.setColumnType(ColumnType.ReadOnlyString);
        //     this.lotAdjustmentGrid.renderGrid();
        //     if (status === 'To be Scheduled' || status === 'Queued' || status === 'Skipped' || status === 'Discontinued' ) {
        //         this.discontinueBtn.setEnabled(false);
        //         this.orderToLineBtn.setEnabled(false);
        //         this.skipProductionBtn.setEnabled(false);
        //     }else if (status === 'In Progress') {
        //         this.discontinueBtn.setEnabled(true);
        //         this.orderToLineBtn.setEnabled(false);
        //         this.skipProductionBtn.setEnabled(false);
        //     } else {
        //         console.warn("Unknown status: No button updates made.");
        //     }
        // }

        // Re-render the grid to apply the changes
    }

    // Add refreshShiftDetails method to fetch updated shift details and call loadData
    refreshShiftDetails() {
        const requestBody = {
            lineId: this.currentShift.lineID // Use lineID from currentShift
        };
        const host = new ProductionHostDetails();
    
        // Set up the web service proxy for the API call
        const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
        //proxy.url = "http://localhost:8081/getShiftDetails"; // Backend service URL
        proxy.url = host.url + "getShiftDetails";
        proxy.payLoad = JSON.stringify(requestBody); // Data payload to be sent
        proxy.method = "POST"; // HTTP method
        proxy.contentType = "application/json; charset=utf-8"; // Content type
        proxy.timeout = 20000; // Request timeout in milliseconds
        proxy.keepAlive = false; // Keep-alive setting
    
        const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
        callback.onSuccess = function(responseData) {
            const shiftDetails = JSON.parse(responseData);
            // Modify the structure of updatedFilter as required
            const updatedFilter = {
                header: {
                    currentDate: shiftDetails.currentDate,
                    currentTime: shiftDetails.currentTime,
                    shift: shiftDetails.shift,
                    line: shiftDetails.line,
                    user: this.userLoggedInId
                }
            };
    
            // Call loadData with updated filter
            if (typeof this.instance.loadData === 'function') {
                this.instance.loadData(JSON.stringify(updatedFilter));
            } else {
                console.error("loadData method not found in instance context.");
            }
        }.bind(this); // Ensure correct context binding
    
        callback.onFailure = function(errorDescription) {
            console.error("Error fetching updated shift details:", errorDescription);
            alert("Failed to fetch updated shift details.");
        };
    
        // Invoke the web service with the configured proxy and callback
        palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
    }

    updateStatus(){
        const dataToSave = {
            dieSet: this.recordData.dieSet,
            shift: this.currentShift.shift,
            line: this.currentShift.line,
            date: this.currentShift.currentDate,
            reason: '', // Empty string for reason
            action: 'Queued', // Action set to "Order To Line"
            user: this.userLoggedInId,
            actualID: this.recordData.actualID,
        };
        const host = new ProductionHostDetails();

        // Set up the web service proxy for the API call
        const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
        //proxy.url = "http://localhost:8081/updatePatternStatus"; // Backend service URL
        proxy.url = host.url + "updatePatternStatus";
        proxy.payLoad = JSON.stringify(dataToSave); // Data payload to be sent
        proxy.method = "POST"; // HTTP method
        proxy.contentType = "application/json; charset=utf-8"; // Content type
        proxy.timeout = 20000; // Request timeout in milliseconds
        proxy.keepAlive = false; // Keep-alive setting

        const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

        // On success, call refreshShiftDetails to refresh the screen
        callback.onSuccess = function(responseData) {
            alert(responseData);
            this.refreshShiftDetails();
        }.bind(this); // Ensure correct context binding

        // On failure, log the error and alert the user
        callback.onFailure = function(errorDescription) {
            console.error("Error updating pattern status:", errorDescription);
            alert("Failed to update pattern status. Please try again.");
        };

        // Invoke the web service with the configured proxy and callback
        palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
    }

    setRecordData(recordData) {
        this.recordData = recordData;
        this.currentShift = this.instance.currentShift; // Update currentShift from instance

        //this.setHeaderGridRecords(this.recordData);
        this.setSummeryGridRecords(this.recordData);
        this.setGridRecords(this.recordData);

        if (this.recordData && this.recordData.status) {
            this.updateButtonStates(this.recordData.status);
        }
    }

    setGridRecords(recordData) {
        this.lotAdjustmentGrid.removeAll();

        if (recordData != null) {
            const records = [];
            const list = recordData.lotAdjustments;
            const lotAdjustments = this.currentShift.lotAdjustments;
            list.forEach(function (id) {
                var entity = lotAdjustments.find(x => x.id === id);
                if (entity)
                    records.push(entity.clone());
            });
            this.lotAdjustmentGrid.addRecords(records);
        }
        this.lotAdjustmentGrid.renderGrid();
    }

    // setHeaderGridRecords(recordData) {
    //     this.headerGrid.removeAll();
    //     if (recordData != null) {
    //         const arrList = [recordData];
    //         this.headerGrid.addRecords(arrList);
    //     }
    //     this.headerGrid.renderGrid();
    // }

    setSummeryGridRecords(recordData) {
        this.statusSummeryGrid.removeAll();
        if (recordData != null) {
            const arrList = [recordData];
            this.statusSummeryGrid.addRecords(arrList);
        }
        this.statusSummeryGrid.renderGrid();
    }

    applyChanges() {
        const records = this.lotAdjustmentGrid.getRecords();
        const lotAdjustments = this.currentShift.lotAdjustments;
        let instance = this;  
        let partsByBomSequence = {};  
        let prodOrderByKitItemID = [];
        let negativeProdOrder = false;

        records.forEach(function (record) {
            var entity = lotAdjustments.find(x => x.id === record.id);
            if (entity) {
                const prodOrderValue = record.get('prodOrder');
                const bomSeq = record.get('bomSeq');  
                const kitItemID = record.get('kitItemID');

                const numericProdOrder = prodOrderValue ? parseInt(prodOrderValue.match(/\((-?\d+)\)/)[1]) : null;

                if (numericProdOrder < 0){
                    negativeProdOrder = true;
                }

                if (kitItemID && numericProdOrder !== null) {
                    prodOrderByKitItemID.push({
                        kitItemID: kitItemID,
                        numericProdOrder: numericProdOrder
                    });
                }

                if (numericProdOrder !== null) {
                    if (!partsByBomSequence[bomSeq]) {
                        partsByBomSequence[bomSeq] = [];
                    }
                    partsByBomSequence[bomSeq].push(numericProdOrder);
                }
            }
        });
        if(negativeProdOrder){
            alert("Production order can not be negative, please give a value greater than zero.");
            return;
        }

        console.log("Prod order values in set:", prodOrderByKitItemID);
    
        let calculatedPlanLotSize = 0;
        if (Object.keys(partsByBomSequence).length === 1) {
            const bomSequenceKey = Object.keys(partsByBomSequence)[0];
            if (partsByBomSequence[bomSequenceKey].length === 1) {
                calculatedPlanLotSize = partsByBomSequence[bomSequenceKey][0];
            } else {
                calculatedPlanLotSize = Math.max(...partsByBomSequence[bomSequenceKey]);
            }
        } else {
            for (const [bomSeq, prodOrders] of Object.entries(partsByBomSequence)) {
                const maxProdOrder = Math.max(...prodOrders);
                calculatedPlanLotSize += maxProdOrder;
            }
        }
    
        if (calculatedPlanLotSize > 0) {
            const dataToSave = {
                dieSet: instance.recordData.dieSet,  
                shift: instance.currentShift.shift,
                line: instance.currentShift.line,
                date: instance.currentShift.currentDate,
                planLotSize: calculatedPlanLotSize,  
                user: this.userLoggedInId,
                actualID: this.recordData.actualID,
                prodOrderByKitItemID: prodOrderByKitItemID,
            };
            const host = new ProductionHostDetails();
    
            const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            proxy.url = host.url + "applyChanges";
            proxy.payLoad = JSON.stringify(dataToSave); 
            proxy.method = "POST";  
            proxy.contentType = "application/json; charset=utf-8";  
            proxy.timeout = 20000;  
            proxy.keepAlive = false;  
    
            const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
            callback.onSuccess = function (responseData) {
                alert("PlanLotSize updated successfully!");
    
                instance.refreshShiftDetails(instance.currentShift.line);  
            };
    
            callback.onFailure = function (errorDescription) {
                console.error("Error updating PlanLotSize:", errorDescription);
                alert("Failed to update PlanLotSize. Please try again.");
            };
    
            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        } else {
            console.warn("No valid prodOrder values found. API call was not made.");
        }
    
        this.defaultBtn.setEnabled(false);
        this.applyChangesBtn.setEnabled(false);
    } 

}

