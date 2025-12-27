
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

class skipMaterialPopup extends palms.exported.framework.StickyNote {
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
        this.reasonTextBox = new palms.client.framework.selfValidatingControls.SelfValidatingTextArea();
        this.OrderCycle = "";
        this.OrderCycleCodeList = [];

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
        reasonLabel.setText('Reason To Skip Material:');
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
            submitButton.onClick = () => this.handleOrderedMaterial(2);
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
        if (this.OrderCycle === "") {
            alert("Please select the 'OrderCycle' to proceed to Order the material.");
        } else {
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
                if (cycleEndTimeInSec >= currTime) {
                    if (reason.trim()) {
                        let json = {
                            OrderedListID: this.id,
                            Status: status,
                            Material: this.material,
                            reason: reason
                        }
                        const host = new MaterialHostDetails();
                        // Set up the web service proxy
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
                    } else {
                        alert("Please type a reason before skipping the material to proceed.");
                    }
                } else {
                    alert("The " + filterOrderCycle[0].code + " time has already passed. Please select different Order Cycle to Skip Material.");
                }
            }
        }

    }

    setRecord(id, material, status, OrderCycleCodeList, OrderCycle) {
        this.id = id;
        this.material = material;
        this.status = status;
        this.OrderCycleCodeList = OrderCycleCodeList;
        this.OrderCycle = OrderCycle
    }

    callSKUTransactionsService(responseData) {

        let parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        let dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
        console.log("dataArray", dataArray);
        const self = this;
        let skuTransactionList = new palms.exported.framework.webServiceAccess.EntityList();

        dataArray.forEach(item => {
            let skuTransactionEntity = new palms.client.framework.entity.GenericEntity();

            // Set entity fields for SKUTransactionsFromHandheldAction service
            skuTransactionEntity.set("AvailableQuantityInStorageUOM", item.AvailableQuantityInStorageUOM);
            skuTransactionEntity.set("WarehouseID", item.WarehouseID);
            skuTransactionEntity.set("PrimaryCompanyID", item.PrimaryCompanyID);
            skuTransactionEntity.set("WarehousePrimaryCompanyID", item.WarehousePrimaryCompanyID);
            skuTransactionEntity.set("CostBucketID", item.CostBucketID);
            skuTransactionEntity.set("SKUCostID", item.SKUCostID);
            skuTransactionEntity.set("SKUBatchID", item.SKUBatchID);
            skuTransactionEntity.set("FromLocationID", item.FromLocationID);
            skuTransactionEntity.set("ToLocationID", item.FromLocationID);
            skuTransactionEntity.set("StockTransferQuantityInStorageUOM", item.StockTransferQuantityInStorageUOM);
            skuTransactionEntity.set("TransactionTypeID", item.TransactionTypeOrderToLineID);
            skuTransactionEntity.set("SKUCode", item.SKUCode);

            skuTransactionList.add(skuTransactionEntity);
            console.log("SKU transaction", skuTransactionList);
        });

        let skuTransactionCallback = {
            onSuccess: function () {
                alert("Data Updated Successfully in SKUTransactionsFromHandheldAction");
                self.handleSubmit();
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

}

// Call addCustomStyles to ensure the custom styles are applied
addCustomStyles();