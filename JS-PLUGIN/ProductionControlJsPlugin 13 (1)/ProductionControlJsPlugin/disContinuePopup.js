
class DisContinuePopup extends palms.exported.framework.StickyNote {
    constructor(recordData, instance) { // Receive the full instance here
        try {
            super(palms.exported.framework.PalmsUIApplication.getMainPanel(), "Discontinue Production", 
                  new palms.exported.gwt.user.client.ui.VerticalPanel(), "300px", "100px");
            
            this.recordData = recordData; // Store recordData
            this.instance = instance; // Store the full instance for accessing loadData
            this.currentShift = instance.currentShift; // Reference currentShift from the instance
            this.grid = null;
            this.discontinueEntity = null;
            this.userLoggedInId =  null;
            this.reasonTextBox = new palms.client.framework.selfValidatingControls.SelfValidatingTextArea();
            
        } catch (error) {
            console.error("Error initializing DisContinuePopup constructor: ", error);
        }
    }

    initialize() {
        try {
            super.initialize();
            super.addStyleName('Popup');

            this.userLoggedInId = palms.exported.framework.PalmsUIApplication.getLoggedInUserID();

            this.discontinueEntity = new DisContinueEntity();
            this.grid = new palms.exported.framework.grid.Grid(null, this.discontinueEntity);

            const mainPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
            mainPanel.setSpacing(10);
            mainPanel.setWidth("100%");

            const reasonLabel = new palms.exported.gwt.user.client.ui.Label();
            reasonLabel.setText('Reason for Discontinue Production:');
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
                submitButton.onClick = () => this.checkDiscontinue();
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

    handleSubmit() {
        const line = this.currentShift.line;
        const dieSet = this.recordData.dieSet;
        const shift = this.currentShift.shift;
        const date = this.currentShift.currentDate;
        const actualID = this.recordData.actualID;
        const dataToSave = {
          line,
          dieSet,
          shift,
          date,
          actualID
        };
        const host = new ProductionHostDetails();
    
        const proxy =
          new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
        proxy.url = host.url + "handleDiscontinued";
        proxy.payLoad = JSON.stringify(dataToSave); 
        proxy.method = "POST"; 
        proxy.contentType = "application/json; charset=utf-8"; 
        proxy.timeout = 20000; 
        proxy.keepAlive = false; 
    
        const callback =
          new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
        callback.onSuccess = function (responseData) {
          if (!responseData.startsWith("{") && !responseData.startsWith("[")) {
            alert(responseData); 
            return;
          }
          this.discontinue(responseData);
          this.hide();
        }.bind(this); 
    
        callback.onFailure = function (errorDescription) {
          console.error("Error updating pattern status:", errorDescription);
          alert("Failed to update pattern status. Please try again.");
        };
    
        palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(
          proxy,
          callback
        );
      }
    
      discontinue(responseData) {
        const self = this;
        let parsedData =
          typeof responseData === "string"
            ? JSON.parse(responseData)
            : responseData;
        let dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
        console.log("dataArray", dataArray);
    
        let list = new palms.exported.framework.webServiceAccess.EntityList();
        dataArray.forEach((item) => {
          // Log the entire item and its fields for debugging
          console.log("Processing item:", item);
    
          let entity = new palms.client.framework.entity.GenericEntity();
    
          // Set entity fields based on the updated responseData fields for the first API call
          entity.set("ReferenceID", item.LocationID);
          entity.set("Title", item.Title);
          entity.set("Body", item.Body);
          entity.set("IsSkidsPresent", item.IsSkidsPresent);
          entity.set("LotNo",item.LotNo);
    
          // Log the entity to check the values being set
          console.log("Entity for discontinue created:", entity);
    
          // Add the entity to the list
          list.add(entity);
        });
    
        // Simulating callback with success message
        let callback = {
          onSuccess: function () {
            console.log("Notification sent!")
          },
          onFailure: function (error) {
            console.error("Unable to Discontine", error);
            alert("Could not discontinue");
          },
          onException: function(errorCode, errorDescription, exception) {
            alert('ErrorDescription : ' + errorDescription);
            console.log(exception,errorCode);
          }
        };
    
        let webServiceName = "SendNotificationAction.asmx";
        let webServicePath = "Actions";
    
        let wao =
          new palms.exported.framework.webServiceAccess.WebServiceAccessObjectForAction(
            webServiceName,
            webServicePath
          );
        wao.performAction(list, "CREATE", callback); 
      }
    
      checkDiscontinue(){                     
        try {
          const reason = this.reasonTextBox.getText();
          const self = this;
          if (reason.trim()) {
              this.discontinueEntity.set('reason', reason);
    
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
              const host = new ProductionHostDetails();
              const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
              proxy.url = host.url + "handleDiscButton";
              proxy.payLoad = JSON.stringify(dataToSave); 
              proxy.method = "POST"; 
              proxy.contentType = "application/json; charset=utf-8"; 
              proxy.timeout = 20000; 
              proxy.keepAlive = false; 
    
              const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
              callback.onSuccess = function(inputData) {
    
                inputData = inputData.trim();
                if (!inputData.startsWith("{") && !inputData.startsWith("[")) {
                    alert(inputData); 
                    return;
                }
    
                try {
                    inputData = JSON.parse(inputData); 
                } catch (error) {
                    alert("Unexpected response from server: " + responseData);
                    console.error("Parsing error:", error);
                    return;
                }
    
                let inputArray = Array.isArray(inputData) ? inputData : [inputData];
                self.callSKUTransactionsService(inputArray);

            this.hide(); 
                
              }.bind(this); 
    
              callback.onFailure = function(errorDescription) {
                  console.error("Failed to call SKU transaction.", errorDescription);
                  alert("Failed to call SKU transaction.", errorDescription);
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
          lineId: this.currentShift.lineID, // Use lineID from currentShift
        };
        const host = new ProductionHostDetails();
    
        // Set up the web service proxy for the API call
        const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
        //proxy.url = "http://localhost:8081/getShiftDetails"; 
        proxy.url = host.url + "getShiftDetails";
        proxy.payLoad = JSON.stringify(requestBody); // Data payload to be sent
        proxy.method = "POST"; // HTTP method
        proxy.contentType = "application/json; charset=utf-8"; // Content type
        proxy.timeout = 20000; // Request timeout in milliseconds
        proxy.keepAlive = false; // Keep-alive setting
    
        const callback =
          new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
        callback.onSuccess = function (responseData) {
          const shiftDetails = JSON.parse(responseData);
    
          // Modify the structure of updatedFilter as required
          const updatedFilter = {
            header: {
              currentDate: shiftDetails.currentDate,
              currentTime: shiftDetails.currentTime,
              shift: shiftDetails.shift,
              line: shiftDetails.line,
              user: this.userLoggedInId,
            },
          };
    
          // Call loadData with updated filter
          if (typeof this.instance.loadData === "function") {
            this.instance.loadData(JSON.stringify(updatedFilter));
          } else {
            console.error("loadData method not found in instance context.");
          }
        }.bind(this); // Ensure correct context binding
    
        callback.onFailure = function (errorDescription) {
          console.error("Error fetching updated shift details:", errorDescription);
          alert("Failed to fetch updated shift details.");
        };
    
        // Invoke the web service with the configured proxy and callback
        palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(
          proxy,
          callback
        );
      }
    
      statusUpdate() {
        try {
          const reason = this.reasonTextBox.getText();
          if (reason.trim()) {
            this.discontinueEntity.set("reason", reason);
    
            const dieSet = this.recordData.dieSet;
            const shift = this.currentShift.shift;
            const line = this.currentShift.line;
            const date = this.currentShift.currentDate;
            const user =  this.userLoggedInId;
            const actualID = this.recordData.actualID;
    
            const dataToSave = {
              shift,
              line,
              date,
              reason,
              action: "Discontinued",
              dieSet,
              user,
              actualID
            };
            console.log("Discontinue",dataToSave);
            const host = new ProductionHostDetails();
    
            const proxy =
              new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            //proxy.url = "http://localhost:8081/updatePatternStatus"; // Backend service URL
            proxy.url = host.url + "updatePatternStatus";
            proxy.payLoad = JSON.stringify(dataToSave); // Data payload to be sent
            proxy.method = "POST"; // HTTP method
            proxy.contentType = "application/json; charset=utf-8"; // Content type
            proxy.timeout = 20000; // Request timeout in milliseconds
            proxy.keepAlive = false; // Keep-alive setting
    
            const callback =
              new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
            callback.onSuccess = function (responseData) {
              alert("Successfully Discontinued!");
              
              this.hide(); // Hide the popup after success
              this.handleSubmit();
              this.refreshShiftDetails(); // Refreshing the screen with updated data
            }.bind(this); // Ensure correct context binding
    
            callback.onFailure = function (errorDescription) {
              console.error("Error updating pattern status:", errorDescription);
              alert("Failed to update pattern status. Please try again.");
            };
    
            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(
              proxy,
              callback
            );
          } else {
            alert("Please enter a reason before submitting.");
          }
        } catch (error) {
          console.error("Error handling submit:", error);
        }
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
                alert("Successfully Discontinued!");
                self.handleSubmit();
                self.refreshShiftDetails();
            },
            onFailure: function(error) {
                console.error("Error while updating data in SKUTransactionsFromHandheldAction:", error);
                alert("Failed in SKUTransactionsFromHandheldAction.", error);
            }
        };
    
        let skuTransactionWebServiceName = "SKUTransactionsFromHandheldAction.asmx";
        let skuTransactionWebServicePath = "Actions";
        let skuTransactionWao = new palms.exported.framework.webServiceAccess.WebServiceAccessObjectForAction(skuTransactionWebServiceName, skuTransactionWebServicePath);
        skuTransactionWao.performAction(skuTransactionList, "CREATE", skuTransactionCallback);
    }
    
}
