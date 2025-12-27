
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

class OrderMaterialPopup extends palms.exported.framework.StickyNote {
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
        this.orderedQtyValue = 0;
        this.recommQtyValue = 0;
        this.stock = 0;
        this.onOrder = 0;
        this.kanbansReturned = 0;
        this.OrderCycleCodeList = [];
        this.OrderCycle = '';

    }

    initialize() {
        super.initialize();
        super.addStyleName('Popup');

        const mainPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
        mainPanel.setSpacing(10);
        mainPanel.setWidth("100%");

        const reasonLabel = new palms.exported.gwt.user.client.ui.Label();
        reasonLabel.setText('Are you sure you want to order the material?');
        reasonLabel.addStyleName('large-text-label');
        mainPanel.add(reasonLabel.asWidget());
        mainPanel.setCellHorizontalAlignment(reasonLabel.asWidget(), HorizontalAlignment.ALIGN_CENTER);

        // Horizontal panel to place dropdown and textbox side by side
        const inputPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
        inputPanel.setSpacing(10);  // Add some space between the elements
        // reasonLabel.setCellHorizontalAlignment(reasonLabel.asWidget(), HorizontalAlignment.ALIGN_LEFT);
        // inputPanel.add(reasonLabel.asWidget());
        // Ordered Button
        const buttonPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
        buttonPanel.setWidth("100%");

        const OrderBtn = new palms.client.framework.selfValidatingControls.ButtonControl();
        OrderBtn.setSize('auto', 'auto');
        OrderBtn.setText('Ok');

        OrderBtn.onClick = () => {
            this.hide();
            if (this.status === "Skipped") {
                alert("Material: " + this.material + " is already skipped.");
            } else {
                this.handleOrderedMaterial(4);
            }
        };

        const cancelBtn = new palms.client.framework.selfValidatingControls.ButtonControl();
        cancelBtn.setSize('auto', 'auto');
        cancelBtn.setText('Cancel');

        cancelBtn.onClick = () => {
            this.hide();
        };
        buttonPanel.add(OrderBtn.asWidget());
        buttonPanel.setCellHorizontalAlignment(OrderBtn.asWidget(), HorizontalAlignment.ALIGN_LEFT);
        buttonPanel.add(cancelBtn.asWidget());
        buttonPanel.setCellHorizontalAlignment(cancelBtn.asWidget(), HorizontalAlignment.ALIGN_RIGHT);

        mainPanel.add(buttonPanel);
        mainPanel.setCellHeight(buttonPanel, '36px');

        super.getContainer().add(mainPanel);

    }

    handleOrderedMaterial(status) {

        let json = {
            OrderedListID: this.id,
            Status: status,
            Material: this.material,
            OrderedQty: this.orderedQtyValue,
            recommQty: this.recommQtyValue,
            stock: this.stock,
            onOrder: this.onOrder,
            kanbansReturned: this.kanbansReturned
        }
        if (this.OrderCycle === "") {
            alert("Please select the 'OrderCycle' to proceed to Order the material.");
        }else{
            let convertStrTimeToHrMinSec = (strTime) => {
                strTime = strTime.split(':');
                return Number(strTime[0]) * 3600 + Number(strTime[1]) * 60 + Number(strTime[2])
            }

            let filterOrderCycle = this.OrderCycleCodeList.filter(el => el.id === this.OrderCycle);
            if (filterOrderCycle.length > 0) {
                let cycleTime = filterOrderCycle[0].code.split('-');
                let cycleEndTimeInSec = convertStrTimeToHrMinSec(cycleTime[2]);
                let date = new Date();
                let ccHour = date.getHours();
                let ccMin = date.getMinutes();
                let ccSec = date.getSeconds();
                let currTime = ccHour * 3600 + ccMin * 60 + ccSec;
                if(cycleEndTimeInSec >= currTime){
                    if (Number(this.orderedQtyValue) <= 0) {
                        alert("The ordered quantity cannot be <= 0. Please adjust the Kanban quantities to proceed with the material order.")
                    } else {
                        // Set up the web service proxy
                        const host = new MaterialHostDetails();
                        var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
                        proxy.url = host.url + "toBeOrdered/order"; // Backend service URL
                        proxy.payLoad = JSON.stringify(json); // Data payload to be sent
                        proxy.method = "PUT"; // HTTP method
                        proxy.contentType = "application/json; charset=utf-8"; // Content type
                        proxy.timeout = 20000; // Request timeout in milliseconds
                        proxy.keepAlive = false; // Keep-alive setting
            
                        var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response
                        let instance = this;
                        // On success, show the response message, clear the form, and re-enable buttons
                        callback.onSuccess = function (responseData) {
                            responseData = JSON.parse(responseData);
                            if (responseData[0].success === true) {
                                instance.processApiResponse(responseData);
                            } else {
                                alert(responseData[0].message);
                            }
                        }
            
                        // On failure, show the error message and re-enable buttons
                        callback.onFailure = function (errorDescription) {
                            alert("Failure: " + errorDescription);
                        }
            
                        // Invoke the web service with the configured proxy and callback
                        palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
                    }
                }else{
                    alert("The " + filterOrderCycle[0].code + " time has already passed. Please select different Order Cycle to Order Material.");
                }
            }
        }
    }


    setRecord(id, material, orderedQtyValue, recommQtyValue, stock, onOrder, kanbansReturned, status, OrderCycleCodeList, OrderCycle) {
        this.id = id;
        this.material = material;
        this.orderedQtyValue = orderedQtyValue;
        this.recommQtyValue = recommQtyValue;
        this.stock = stock;
        this.onOrder = onOrder;
        this.kanbansReturned = kanbansReturned;
        this.status = status;
        this.OrderCycleCodeList = OrderCycleCodeList;
        this.OrderCycle = OrderCycle;
        // this.instance = instanceData;
    }

    processApiResponse(responseData) {
        // Ensure responseData is parsed correctly if it's a string
        let parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const self = this;

        // Ensure parsedData is an array
        let dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
        dataArray.forEach((record) => {
            let transactionTypeCode = record.transactionTypeCode;

            if (transactionTypeCode === "PurchaseOrderCreation") {
                // Directly call SKUTransactionsFromHandheldAction.asmx
                self.callSKUTransactionsService([record]);
            } else if (transactionTypeCode === "RemovingExcessKbs") {
                // Call MiscellaneousIssueFromHandheldCreateAction.asmx, then SKUTransactionsFromHandheldAction.asmx on success
                self.callMiscellaneousIssueService([record]);
            } else if (transactionTypeCode === "PurchaseOrderCreationExcessOrdering") {
                // Call MiscellaneousReceiptCreateAction.asmx, then SKUTransactionsFromHandheldAction.asmx on success
                self.callMiscellaneousReceipt([record]);
            } else {
                console.error("Unrecognized transactionTypeCode:", transactionTypeCode);
            }
        });
    }

    // Call the MiscellaneousIssueFromHandheldCreateAction and handle SKUTransactions on success
    callMiscellaneousIssueService(dataArray) {
        let issueList = new palms.exported.framework.webServiceAccess.EntityList();
        const self = this;

        dataArray.forEach(item => {
            let issueEntity = new palms.client.framework.entity.GenericEntity();

            // Set entity fields for MiscellaneousIssueFromHandheldCreateAction
            issueEntity.set("WarehouseID", item.WarehouseID);
            issueEntity.set("PrimaryCompanyID", item.PrimaryCompanyID);
            issueEntity.set("WarehousePrimaryCompanyID", item.WarehousePrimaryCompanyID);
            issueEntity.set("CostBucketID", item.CostBucketID);
            issueEntity.set("InvoicedSKUCostID", item.InvoicedSKUCostID);
            issueEntity.set("TransactionTypeID", item.TransactionTypeID);
            issueEntity.set("SKUCode", item.SKUCode);
            issueEntity.set("InvoicedQuantityInBillingUOM", item.InvoicedQuantityInBillingUOM);
            issueEntity.set("BillingUOMID", item.BillingUOMID);

            issueEntity.set("SKUBatchID", item.SKUBatchID);
            issueEntity.set("FromLocationID", item.FromLocationID);
            issueEntity.set("ToLocationID", item.ToLocationID);
            issueEntity.set("AvailableQuantityInStorageUOM", item.AvailableQuantityInStorageUOM);
            issueEntity.set("ShippingModeID", item.ShippingModeID);
            issueEntity.set("TradeTermID", item.TradeTermID);
            issueEntity.set("CustomerID", item.CustomerID);
            issueEntity.set("IsFOC", item.IsFOC);
            issueEntity.set("TotalOfLineAmountsInCustomerCurrency", item.TotalOfLineAmountsInCustomerCurrency);
            issueEntity.set("IsShippedSeparately", item.IsShippedSeparately);
            issueEntity.set("InvoiceLineNo", item.InvoiceLineNo);
            issueEntity.set("UnitSalesPriceOfStorageUOMInCustomerCurrency", item.UnitSalesPriceOfStorageUOMInCustomerCurrency);
            issueEntity.set("UnderlyingBatchIDs", item.UnderlyingBatchIDs);

            issueList.add(issueEntity);
        });

        let issueCallback = {
            onSuccess: function () {
                // alert("Data Updated Successfully in MiscellaneousIssueFromHandheldCreateAction");
                self.callSKUTransactionsService(dataArray); // Proceed to call SKUTransactionsFromHandheldAction
            },
            onFailure: function (error) {
                console.error("Error while updating data in MiscellaneousIssueFromHandheldCreateAction:", error);
                alert("Failed to update data in MiscellaneousIssueFromHandheldCreateAction.");
            }
        };

        let issueWebServiceName = "MiscellaneousIssueFromHandheldCreateAction.asmx";
        let issueWebServicePath = "Actions";
        let issueWao = new palms.exported.framework.webServiceAccess.WebServiceAccessObjectForAction(issueWebServiceName, issueWebServicePath);
        issueWao.performAction(issueList, "CREATE", issueCallback);
    }

    // Call the MiscellaneousReceiptCreateAction and handle SKUTransactions on success
    callMiscellaneousReceipt(dataArray) {
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
            receiptEntity.set("ToLocationID", item.ToLocationID);
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
                dataArray.forEach(item => {
                    if (!item.SKUBatchID) {
                        const data = {
                            KitID: item.KitID,
                            ProductionOrder: item.ProductionOrder,
                        }
                        const host = new MaterialHostDetails();
                        const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
                        proxy.url = host.url + "material/skuTransaction"; // Backend service URL
                        proxy.payLoad = JSON.stringify(data); // Data payload to be sent
                        proxy.method = "POST"; // HTTP method
                        proxy.contentType = "application/json; charset=utf-8"; // Content type
                        proxy.timeout = 20000; // Request timeout in milliseconds
                        proxy.keepAlive = false; // Keep-alive setting

                        const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();


                        callback.onSuccess = function (responseData) {
                            // alert(responseData);
                            let parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
                            let dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
                            // console.log("dataArray", dataArray);
                            dataArray.forEach((record) => {
                                self.callSKUTransactionsService([record]);
                            });
                        }.bind(self); // Ensure correct context binding

                        callback.onFailure = function (errorDescription) {
                            console.error("Error updating pattern status:", errorDescription);
                            alert("Failed SKU Transaction");
                        };

                        palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
                    } else {
                        self.callSKUTransactionsService(dataArray);
                    }
                })
                //self.callSKUTransactionsService(dataArray); // Proceed to call SKUTransactionsFromHandheldAction
            },
            onFailure: function (error) {
                console.error("Error while updating data in MiscellaneousReceiptCreateAction:", error);
                alert("Failed to update data in MiscellaneousReceiptCreateAction.");
            }
        };

        let receiptWebServiceName = "MiscellaneousReceiptCreateAction.asmx";
        let receiptWebServicePath = "Actions";
        let receiptWao = new palms.exported.framework.webServiceAccess.WebServiceAccessObjectForAction(receiptWebServiceName, receiptWebServicePath);
        receiptWao.performAction(receiptList, "CREATE", miscellaneousReceiptCallback);
    }

    // Call the SKUTransactionsFromHandheldAction service
    callSKUTransactionsService(dataArray) {
        const self = this;
        let skuTransactionList = new palms.exported.framework.webServiceAccess.EntityList();

        dataArray.forEach(item => {
            let skuTransactionEntity = new palms.client.framework.entity.GenericEntity();

            if (item.transactionTypeCode === "PurchaseOrderCreationExcessOrdering") {
                skuTransactionEntity.set("AvailableQuantityInStorageUOM", item.StockTransferQuantityInStorageUOM);
            } else if (item.transactionTypeCode === "RemovingExcessKbs") {
                skuTransactionEntity.set("AvailableQuantityInStorageUOM", item.AvailableQuantityInStorageUOM);
            }
            else {
                skuTransactionEntity.set("AvailableQuantityInStorageUOM", item.AvailableQuantityInStorageUOM);
            }

            // Set entity fields for SKUTransactionsFromHandheldAction service
            skuTransactionEntity.set("WarehouseID", item.WarehouseID);
            skuTransactionEntity.set("PrimaryCompanyID", item.PrimaryCompanyID);
            skuTransactionEntity.set("WarehousePrimaryCompanyID", item.WarehousePrimaryCompanyID);
            skuTransactionEntity.set("CostBucketID", item.CostBucketID);
            skuTransactionEntity.set("SKUCostID", item.InvoicedSKUCostID);
            skuTransactionEntity.set("SKUBatchID", item.SKUBatchID); // null
            skuTransactionEntity.set("FromLocationID", item.FromLocationID);
            skuTransactionEntity.set("ToLocationID", item.FromLocationID); // null
            skuTransactionEntity.set("StockTransferQuantityInStorageUOM", item.StockTransferQuantityInStorageUOM);
            skuTransactionEntity.set("TransactionTypeID", item.skuTransactionType === 'PurchaseOrderCreation' ? item.skuTransactionID : item.TransactionTypeOrderToLineID);
            skuTransactionEntity.set("SKUCode", item.SKUCode);

            skuTransactionList.add(skuTransactionEntity);
            //  console.log("SKU transaction", skuTransactionList);
        });

        let skuTransactionCallback = {
            onSuccess: function () {
                //  alert("Data Updated Successfully in SKUTransactionsFromHandheldAction");
                self.transationSuccessMaterialStatus();
            },
            onFailure: function (error) {
                console.error("Error while updating data in SKUTransactionsFromHandheldAction:", error);
                alert("Failed to update data in SKUTransactionsFromHandheldAction.");
            }
        };

        let skuTransactionWebServiceName = "SKUTransactionsFromHandheldAction.asmx";
        let skuTransactionWebServicePath = "Actions";
        let skuTransactionWao = new palms.exported.framework.webServiceAccess.WebServiceAccessObjectForAction(skuTransactionWebServiceName, skuTransactionWebServicePath);
        skuTransactionWao.performAction(skuTransactionList, "CREATE", skuTransactionCallback);
    }

    transationSuccessMaterialStatus() {
        let json = {
            OrderedListID: this.id,
            Status: 4,
            Material: this.material,
            OrderedQty: this.orderedQtyValue,
            recommQty: this.recommQtyValue,
            stock: this.stock,
            onOrder: this.onOrder,
            kanbansReturned: this.kanbansReturned,
            updateStatus: true
        }
        // Set up the web service proxy
        const host = new MaterialHostDetails();
        var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
        proxy.url = host.url + "toBeOrdered/order"; // Backend service URL
        proxy.payLoad = JSON.stringify(json); // Data payload to be sent
        proxy.method = "PUT"; // HTTP method
        proxy.contentType = "application/json; charset=utf-8"; // Content type
        proxy.timeout = 20000; // Request timeout in milliseconds
        proxy.keepAlive = false; // Keep-alive setting

        var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response
        let instance = this;
        // On success, show the response message, clear the form, and re-enable buttons
        callback.onSuccess = function (responseData) {
            responseData = JSON.parse(responseData);
            alert(responseData.message);
            // let renderForm = new MaterialProcurementForm();
            // renderForm.initialize();
            // renderForm.onSearchClick();
            instance.instance.loadData();
        }

        // On failure, show the error message and re-enable buttons
        callback.onFailure = function (errorDescription) {
            alert("Failure: " + errorDescription);
        }

        // Invoke the web service with the configured proxy and callback
        palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
    }

}

// Call addCustomStyles to ensure the custom styles are applied
addCustomStyles();