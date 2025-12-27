
class partOrderControlForm extends palms.exported.framework.TabbedForm {
    constructor() {
        super();
        this.searchForm = new PartOrderSearchForm();
        this.actionForm = new PartOrderActionForm();
    }

    initialize() {
        const tabTitles = ["Search", "Action"];
        const tabWidgets = [this.searchForm, this.actionForm];

        super.initialize(tabTitles, tabWidgets);
        this.searchForm.initialize();
        this.actionForm.initialize();
        super.selectTab(0);

        palms.exported.framework.PalmsUIApplication.setForm(this);

        let instance = this;
        this.searchForm.searchWidgetList.onSearchClick = () => {
            instance.onSearchClick();
        };

        
    }

    onSearchClick() {
        const recordData = this.searchForm.searchWidgetList.getRecordData();

        if (!recordData.date) {
            alert('Date filter is missing.');
        }
        else if (!recordData.line) {
            alert('Line filter is missing.');
        }
        else if (!recordData.shift) {
            alert('Shift filter is missing.');
        }
        else if (this.searchForm.searchWidgetList.validate()) {
            // Proceed with the data load only when all filters are selected
            this.loadData(recordData.date, recordData.line, recordData.shift);
        }
        else {
            alert('No filter is selected.');
        }
    }

    loadData(date, line, shift) {
        console.log('Load data method called');
        try {
            // Set up the web service proxy
            const host = new PartOrder();
            var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            proxy.url = host.url + "productionPartOrderDashBoard"; // Backend service URL
            proxy.payLoad = JSON.stringify({ date: date, line: line, shift: shift }); // Data payload as JSON
            proxy.method = "POST"; // HTTP method
            proxy.contentType = "application/json; charset=utf-8"; // Content type
            proxy.timeout = 20000; // Request timeout in milliseconds
            proxy.keepAlive = false; // Keep-alive setting

            console.log("Invoking web service with payload:", proxy.payLoad);

            let instance = this; // Preserve the current context
            var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response

            callback.onSuccess = function(responseData) {
                try {
                    // Attempt to parse responseData as JSON
                    var responseObj = JSON.parse(responseData);
                    
                    let partOrderEntity = new PartOrderEntities();
                    partOrderEntity.populateFields(responseObj);
                    instance.actionForm.setRecordData(partOrderEntity);
                    instance.selectTab(1);

                    if (responseObj.message) {
                        alert("Success: " + responseObj.message);
                    }

                } catch (error) {
                    alert("Response: " + responseData);
                }
            };

            callback.onFailure = function(errorDescription) {
                try {
                    const errorResponse = JSON.parse(errorDescription);
                    if (errorResponse.errorMessage) {
                        alert("Error: " + errorResponse.errorMessage);
                    } else {
                        alert("Failure: " + errorDescription); 
                    }
                } catch (error) {
                    alert("Failure: " + errorDescription); // Show raw error message
                }
            };

            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        } catch (error) {
            alert("An error occurred while loading the data.");
        }
    }
}
