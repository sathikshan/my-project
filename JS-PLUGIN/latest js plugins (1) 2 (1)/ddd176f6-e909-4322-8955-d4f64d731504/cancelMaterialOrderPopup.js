
function addCustomStyles() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        .custom-dropdown {
            width: 180px;
            height: 30px;
        }
       
    `;
    document.head.appendChild(style);
}

class cancelMaterialOrderPopup extends palms.exported.framework.StickyNote {
    constructor(instance) {
        super(
            palms.exported.framework.PalmsUIApplication.getMainPanel(),
            "",
            new palms.exported.gwt.user.client.ui.VerticalPanel(),
            "400px",
            "100px"
        );

        this.instance = instance;
        this.status = '';
        this.id = 0;
        this.material = null;
        this.btnType = "";
        this.status = "";
        this.orderedQty = 0;
        this.reason = "";
        this.reasonTextBox = new palms.client.framework.selfValidatingControls.SelfValidatingTextArea();

    }

    initialize() {
        super.initialize();
        super.addStyleName('Popup');

        this.skipMaterialEntity = new SkipMaterialEntity();
        this.grid = new palms.exported.framework.grid.Grid(null, this.SkipMaterialEntity);

        const mainPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
        mainPanel.setSpacing(10);
        mainPanel.setWidth("100%");

        const reasonLabel = new palms.exported.gwt.user.client.ui.Label();
        reasonLabel.setText('Reason To Cancel Material:');
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

        // Ordered Button

        try {
            const submitButton = new palms.client.framework.selfValidatingControls.ButtonControl();
            //submitButton.onClick = () => this.handleSubmit();
            submitButton.onClick = () => this.handleOrderedMaterial(3);
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

    }

    handleOrderedMaterial(status) {
        const reason = this.reasonTextBox.getText();
        if (reason.trim()) {
            this.reason = reason;
            let json = {
                OrderedListID: this.id,
                Status: status,
                Material: this.material,
                OrderedQty: this.orderedQty,
                reason: reason
            }
            // Set up the web service proxy
            const host = new MaterialHostDetails();
            var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            proxy.url = host.url + "ordered/cancel"; // Backend service URL
            proxy.payLoad = JSON.stringify(json); // Data payload to be sent
            proxy.method = "PUT"; // HTTP method
            proxy.contentType = "application/json; charset=utf-8"; // Content type
            proxy.timeout = 20000; // Request timeout in milliseconds
            proxy.keepAlive = false; // Keep-alive setting

            var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response
            let instance = this;
            callback.onSuccess = function (responseData) {
                let isValid = instance.isValidJSON(responseData);
                if (!isValid) {
                    alert(responseData);
                } else {
                    let response = JSON.parse(responseData);
                    instance.callSKUTransactionsService(response);
                }
            }

            // On failure, show the error message and re-enable buttons
            callback.onFailure = function (errorDescription) {
                alert("Failure: " + errorDescription);
            }

            // Invoke the web service with the configured proxy and callback
            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        } else {
            alert("Please type a reason before Cancelling the material to proceed.");
        }
    }

    setRecord(id, material, orderedQty) {
        this.id = id;
        this.material = material;
        this.orderedQty = orderedQty;
    }
    callMiscellaneousReceipt(responseData) {
        let parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        let dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
        let receiptList = new palms.exported.framework.webServiceAccess.EntityList();
        const self = this;

        dataArray.forEach(item => {
            let receiptEntity = new palms.client.framework.entity.GenericEntity();

            // Set entity fields for MiscellaneousReceiptCreateAction
            receiptEntity.set("WarehouseID", item.WarehouseID);
            receiptEntity.set("PrimaryCompanyID", item.PrimaryCompanyID);
            receiptEntity.set("WarehousePrimaryCompanyID", item.WarehousePrimaryCompanyID);
            receiptEntity.set("CostBucketID", item.CostBucketID);
            receiptEntity.set("ReceivedSKUCostID", item.ReceivedSKUCostID);
            receiptEntity.set("TransactionTypeID", item.TransactionTypeID);
            receiptEntity.set("ReceivedQuantityInBillingUOM", item.ReceivedQuantityInBillingUOM);
            receiptEntity.set("ToLocationID", item.ToLocationID); // null
            receiptEntity.set("PackTypeID1", item.PackTypeID1);
            receiptEntity.set("BillingUOMID", item.BillingUOMID);
            receiptEntity.set("TotalOfLineAmountsInLocalCurrency", item.TotalOfLineAmountsInLocalCurrency);
            receiptEntity.set("IsFOC", item.IsFOC);
            receiptEntity.set("UnitPriceOfBillingUOMInLocalCurrency", item.UnitPriceOfBillingUOMInLocalCurrency);
            // console.log("SKU Data", JSON.stringify(item));
            //receiptEntity.set("CustomFields", JSON.stringify(item));
            receiptList.add(receiptEntity);
            console.log("miscellaneousReceipt", receiptList);
        });

        let miscellaneousReceiptCallback = {
            onSuccess: function () {
                // alert("Data Updated Successfully in MiscellaneousReceiptCreateAction");
                //dataArray.forEach(item => {
                    // if (!item.SKUBatchID) {
                    //     const data = {
                    //         KitID: item.KitID,
                    //         ProductionOrder: item.ProductionOrder,
                    //     }
                    //     const host = new MaterialHostDetails();
                    //     const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
                    //     proxy.url = host.url + "material/skuTransaction"; // Backend service URL
                    //     proxy.payLoad = JSON.stringify(data); // Data payload to be sent
                    //     proxy.method = "POST"; // HTTP method
                    //     proxy.contentType = "application/json; charset=utf-8"; // Content type
                    //     proxy.timeout = 20000; // Request timeout in milliseconds
                    //     proxy.keepAlive = false; // Keep-alive setting

                    //     const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();


                    //     callback.onSuccess = function (responseData) {
                    //         // alert(responseData);
                    //         let parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
                    //         let dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
                    //         // console.log("dataArray", dataArray);
                    //         dataArray.forEach((record) => {
                    //             self.callSKUTransactionsService([record]);
                    //         });
                    //     }.bind(self); // Ensure correct context binding

                    //     callback.onFailure = function (errorDescription) {
                    //         console.error("Error updating pattern status:", errorDescription);
                    //         alert("Failed SKU Transaction");
                    //     };

                    //     palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
                    // } else {
                    //     self.callSKUTransactionsService(dataArray);
                    // }
                    self.handleSubmit()
               // })
                //self.callSKUTransactionsService(dataArray); // Proceed to call SKUTransactionsFromHandheldAction
            },
            onFailure: function (error) {
                console.error("Error while updating data in MiscellaneousReceiptCreateAction:", error);
                alert("Failed to Cancel Material.");
            }
        };

        let receiptWebServiceName = "MiscellaneousReceiptCreateAction.asmx";
        let receiptWebServicePath = "Actions";
        let receiptWao = new palms.exported.framework.webServiceAccess.WebServiceAccessObjectForAction(receiptWebServiceName, receiptWebServicePath);
        receiptWao.performAction(receiptList, "CREATE", miscellaneousReceiptCallback);
    }
    callSKUTransactionsService(responseData) {

        let parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        let dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
        const self = this;
        let skuTransactionList = new palms.exported.framework.webServiceAccess.EntityList();

        dataArray.forEach(item => {
            let skuTransactionEntity = new palms.client.framework.entity.GenericEntity();

            // Set entity fields for SKUTransactionsFromHandheldAction service
            // skuTransactionEntity.set("AvailableQuantityInStorageUOM", item.AvailableQuantityInStorageUOM);
            // skuTransactionEntity.set("WarehouseID", item.WarehouseID);// f
            // skuTransactionEntity.set("PrimaryCompanyID", item.PrimaryCompanyID); //f
            // skuTransactionEntity.set("WarehousePrimaryCompanyID", item.WarehousePrimaryCompanyID); //f
            // skuTransactionEntity.set("CostBucketID", item.CostBucketID); //f
            // skuTransactionEntity.set("SKUCostID", item.SKUCostID);
            // skuTransactionEntity.set("SKUBatchID", item.SKUBatchID);
            // skuTransactionEntity.set("FromLocationID", item.FromLocationID);
            // skuTransactionEntity.set("ToLocationID", item.FromLocationID);
            // skuTransactionEntity.set("StockTransferQuantityInStorageUOM", item.StockTransferQuantityInStorageUOM);
            // skuTransactionEntity.set("TransactionTypeID", item.TransactionTypeOrderToLineID);
            // skuTransactionEntity.set("SKUCode", item.SKUCode);

            skuTransactionEntity.set("WarehouseID", item.WarehouseID);
            skuTransactionEntity.set("PrimaryCompanyID", item.PrimaryCompanyID);
            skuTransactionEntity.set("WarehousePrimaryCompanyID", item.WarehousePrimaryCompanyID);
            skuTransactionEntity.set("CostBucketID", item.CostBucketID);
            skuTransactionEntity.set("ReceivedSKUCostID", item.ReceivedSKUCostID);
            skuTransactionEntity.set("TransactionTypeID", item.TransactionTypeID);
            skuTransactionEntity.set("ReceivedQuantityInBillingUOM", item.ReceivedQuantityInBillingUOM);
            skuTransactionEntity.set("ToLocationID", item.ToLocationID); // null
            skuTransactionEntity.set("PackTypeID1", item.PackTypeID1);
            skuTransactionEntity.set("BillingUOMID", item.BillingUOMID);
            skuTransactionEntity.set("TotalOfLineAmountsInLocalCurrency", item.TotalOfLineAmountsInLocalCurrency);
            skuTransactionEntity.set("IsFOC", item.IsFOC);
            skuTransactionEntity.set("UnitPriceOfBillingUOMInLocalCurrency", item.UnitPriceOfBillingUOMInLocalCurrency);

            skuTransactionList.add(skuTransactionEntity);
        });

        let skuTransactionCallback = {
            onSuccess: function () {
                self.handleSubmit();
            },
            onFailure: function (error) {
                console.error("Error while updating data in SKUTransactionsFromHandheldAction:", error);
                alert("Failed to update data in SKUTransactionsFromHandheldAction.");
            }
        };

        let skuTransactionWebServiceName = "MiscellaneousReceiptCreateAction.asmx" // "SKUTransactionsFromHandheldAction.asmx";
        let skuTransactionWebServicePath = "Actions";
        let skuTransactionWao = new palms.exported.framework.webServiceAccess.WebServiceAccessObjectForAction(skuTransactionWebServiceName, skuTransactionWebServicePath);
        skuTransactionWao.performAction(skuTransactionList, "CREATE", skuTransactionCallback);
    }
    handleSubmit() {
        let json = {
            OrderedListID: this.id,
            Status: 3,
            Material: this.material,
            OrderedQty: this.orderedQty,
            cancelled: true,
            reason : this.reason
        }
        // Set up the web service proxy
        const host = new MaterialHostDetails();
        var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
        proxy.url = host.url + "ordered/cancel"; // Backend service URL
        proxy.payLoad = JSON.stringify(json); // Data payload to be sent
        proxy.method = "PUT"; // HTTP method
        proxy.contentType = "application/json; charset=utf-8"; // Content type
        proxy.timeout = 20000; // Request timeout in milliseconds
        proxy.keepAlive = false; // Keep-alive setting

        var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response
        let instance = this;
        callback.onSuccess = function (responseData) {
            instance.hide();
            alert(responseData);
            instance.instance.loadData();
        }

        // On failure, show the error message and re-enable buttons
        callback.onFailure = function (errorDescription) {
            alert("Failure: " + errorDescription);
        }

        // Invoke the web service with the configured proxy and callback
        palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
    }

    isValidJSON(jsonString) {
        try {
            JSON.parse(jsonString);  // Try parsing the JSON string
            return true;  // If parsing succeeds, return true
        } catch (e) {
            return false;  // If an error occurs, return false
        }
    }

}


// Call addCustomStyles to ensure the custom styles are applied
addCustomStyles();