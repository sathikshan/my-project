
class SkipProductionPopup extends palms.exported.framework.StickyNote {
    constructor(recordData, instance) { // Receive the full instance here
        try {
            super(palms.exported.framework.PalmsUIApplication.getMainPanel(), "Skip Production", 
                  new palms.exported.gwt.user.client.ui.VerticalPanel(), "300px", "100px");
            
            this.recordData = recordData; // Store recordData
            this.instance = instance; // Store the full instance for accessing loadData
            this.currentShift = instance.currentShift; // Reference currentShift from the instance
            this.grid = null;
            this.discontinueEntity = null;
            this.userLoggedInId = null;
            this.reasonTextBox = new palms.client.framework.selfValidatingControls.SelfValidatingTextArea();
            
        } catch (error) {
            console.error("Error initializing SkipProductionPopup constructor: ", error);
        }
    }

    initialize() {
        try {
            super.initialize();
            super.addStyleName('Popup');

            this.skipProductionEntity = new SkipProductionEntity();
            this.grid = new palms.exported.framework.grid.Grid(null, this.skipProductionEntity);
            this.userLoggedInId =  palms.exported.framework.PalmsUIApplication.getLoggedInUserID();
            


            const mainPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
            mainPanel.setSpacing(10);
            mainPanel.setWidth("100%");

            const reasonLabel = new palms.exported.gwt.user.client.ui.Label();
            reasonLabel.setText('Reason for Skipping Production:');
            reasonLabel.addStyleName('large-text-label');
            mainPanel.add(reasonLabel.asWidget());
            mainPanel.add(this.reasonTextBox);

            this.reasonTextBox.setText("");

            mainPanel.add(this.reasonTextBox);
            mainPanel.setCellWidth(this.reasonTextBox, '100%');

            mainPanel.add(this.grid.asWidget());
            mainPanel.setCellWidth(this.grid.asWidget(), '100%');
            mainPanel.setCellHeight(this.grid.asWidget(), '100%');

            this.grid.removeAll();
            this.grid.initialize();
            this.grid.setDefaultCellValue('NA');
            this.grid.renderGrid();

            try {
                const submitButton = new palms.client.framework.selfValidatingControls.ButtonControl();
                //submitButton.onClick = () => this.handleSubmit();
                submitButton.onClick = () => this.checkSkip();
                submitButton.setSize('auto', 'auto');
                submitButton.setText('Submit');
                mainPanel.add(submitButton.asWidget());
                mainPanel.setCellHeight(submitButton.asWidget(), '36px');
                mainPanel.setCellHorizontalAlignment(submitButton.asWidget(), HorizontalAlignment.ALIGN_RIGHT);
                mainPanel.setCellVerticalAlignment(submitButton.asWidget(), VerticalAlignment.ALIGN_BOTTOM);
            } catch (error) {
                console.error("Error adding Submit button:", error);
            }

            super.getContainer().add(mainPanel);
        } catch (error) {
            console.error("Error in initialize method:", error);
        }
    }

    checkSkip(){
        try {
            const host = new ProductionHostDetails();
            const reason = this.reasonTextBox.getText();
            const self = this;
            if (reason.trim()) {
                this.skipProductionEntity.set('reason', reason);

                const dieSet = this.recordData.dieSet;
                const shift = this.currentShift.shift;
                const line = this.currentShift.line;
                const date = this.currentShift.currentDate;
                const actualID = this.recordData.actualID;

                const dataToSave = {
                    shift,
                    line,
                    date,
                    reason,
                    dieSet,
                    actualID
                };
                console.log("Data to save in Skip",dataToSave);
                const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity(); 
                proxy.url = host.url + "handleSkipButton";
                proxy.payLoad = JSON.stringify(dataToSave); 
                proxy.method = "POST"; 
                proxy.contentType = "application/json; charset=utf-8"; 
                proxy.timeout = 20000; 
                proxy.keepAlive = false; 

                const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

                callback.onSuccess = function(inputData) {

                    if (!inputData.startsWith("{") && !inputData.startsWith("[")) {
                        if (inputData === "To be Scheduled") {
                            self.handleSubmit();
                            this.hide();
                        }else{
                            alert(inputData); 
                            console.log(inputData);
                            return;
                        }
                      }
                      else{
                        let parsedData = typeof inputData === 'string' ? (() => {
                        try {
                            return JSON.parse(inputData);
                        } catch (e) {
                            return inputData; 
                        }
                    })() : inputData;
                    
                    let inputArray = Array.isArray(parsedData) ? parsedData : [parsedData];

                    console.log("parsedData", inputArray);
                        self.callSKUTransactionsService(inputArray);
                        this.hide();
                      }
                    
                }.bind(this); 

                callback.onFailure = function(errorDescription) {
                    console.error("Failed to call SKU transaction/ handleSubmit method.", errorDescription);
                    alert("Failed to call SKU transaction/ handleSubmit method.",errorDescription);
                };

                palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);

            } else {
                alert("Please enter a reason before submitting.");
            }
        } catch (error) {
            console.error("Error handling submit:", error);
        }
    }

    handleSubmit() {
        try {
            const reason = this.reasonTextBox.getText();
            if (reason.trim()) {
                this.skipProductionEntity.set('reason', reason);

                const dieSet = this.recordData.dieSet;
                const shift = this.currentShift.shift;
                const line = this.currentShift.line;
                const date = this.currentShift.currentDate;
                const user = this.userLoggedInId;
                const actualID = this.recordData.actualID;

                const dataToSave = {
                    shift,
                    line,
                    date,
                    reason,
                    action: 'Skipped',
                    dieSet,
                    user,
                    actualID
                };
                const host = new ProductionHostDetails();
                const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
                proxy.url = host.url + "updatePatternStatus";
                proxy.payLoad = JSON.stringify(dataToSave); 
                proxy.method = "POST"; 
                proxy.contentType = "application/json; charset=utf-8"; 
                proxy.timeout = 20000; 
                proxy.keepAlive = false; 

                const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

                callback.onSuccess = function(responseData) {
                    alert("Successfully Skipped!");
                    this.hide(); 
                    this.refreshShiftDetails();
                }.bind(this); 

                callback.onFailure = function(errorDescription) {
                    console.error("Failed to update status:", errorDescription);
                    alert("Failed to update status", errorDescription);
                };

                palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);

            } else {
                alert("Please enter a reason before submitting.");
            }
        } catch (error) {
            console.error("Error handling submit:", error);
        }
    }

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
                    user: this.userLoggedInId,
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
                alert("Skipped successfully!");
                self.refreshShiftDetails();
            },
            onFailure: function(error) {
                console.error("Error while updating data in SKUTransactionsFromHandheldAction:", error);
                alert("Failed in SKUTransactionsFromHandheldAction.",error);
            }
        };
    
        let skuTransactionWebServiceName = "SKUTransactionsFromHandheldAction.asmx";
        let skuTransactionWebServicePath = "Actions";
        let skuTransactionWao = new palms.exported.framework.webServiceAccess.WebServiceAccessObjectForAction(skuTransactionWebServiceName, skuTransactionWebServicePath);
        skuTransactionWao.performAction(skuTransactionList, "CREATE", skuTransactionCallback);
    }
    
}
