class MaterialProcurementHeaderSearchWidgetsList extends palms.exported.framework.SearchWidgetsList {
    constructor(recordData) {
        super(recordData);
        // this.dtCurrentDate = new palms.exported.framework.selfValidatingControls.FromDateControl(false);
        this.ddLine = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown();
        this.ddOrderCycle = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown();
        this.OrderCycleCodeList = [];

    }

    initialize() {
        super.initialize();

        let widgetGroup = new palms.exported.framework.WidgetGroup('');
        widgetGroup.setShowHeader(false);
        

        // super.addSelfValidatingGroupControl("Date", this.dtCurrentDate, false, widgetGroup);
        super.addSelfValidatingGroupControl("Line", this.ddLine, true, widgetGroup);
        super.addSelfValidatingGroupControl("Order Cycle", this.ddOrderCycle, true, widgetGroup);

        // if(true)//just Putting some sample data for testing.
        // {
        // 	this.ddLine.addItem('24A', '24A');
        // 	this.ddLine.addItem('24B', '24B');
        // 	this.ddLine.addItem('25A', '25A');
        // 	this.ddLine.addItem('25B', '25B');

        // 	this.ddOrderCycle.addItem('1', '1');
        // 	this.ddOrderCycle.addItem('2', '2');
        // 	this.ddOrderCycle.addItem('3', '3');
        // }

        const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
        buttonControl.setText("Search/Refresh");

        this.populateLineDropdown();
        let instance = this;
        //  buttonControl.onClick = () => alert(instance.getRecordData().getJSONString());

        buttonControl.onClick = () => {
            instance.onSearchClick(instance.getRecordData().getJSONString());
        };

        super.addSelfValidatingGroupControl("Button Control", buttonControl, true, widgetGroup);

        const lineChangeHandler = new palms.exported.gwt.event.dom.client.IChangeHandler();
        lineChangeHandler.onChange = function (event) {
            instance.handleLineChange(instance.recordData);
        };
        this.ddLine.addChangeHandler(lineChangeHandler);
    }

    populateLineDropdown() {
        try {
            const host = new MaterialHostDetails();
            const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            proxy.url = host.url + "getLineOptions"; // API URL for line options
            proxy.method = "GET"; // Use GET method
            proxy.contentType = "application/json; charset=utf-8";
            proxy.timeout = 20000;
            proxy.keepAlive = false;

            const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

            callback.onSuccess = (responseData) => {
                try {
                    const data = JSON.parse(responseData);

                    if (Array.isArray(data)) {
                        if (typeof this.ddLine.clearOptions === 'function') {
                            this.ddLine.clearOptions();
                        } else if (typeof this.ddLine.clear === 'function') {
                            this.ddLine.clear();
                        }

                        this.ddLine.addItem('Select', '');

                        data.forEach((option, index) => {
                            this.ddLine.addItem(option.code, option.id.toString());
                        });

                        if (data.length > 0) {
                            this.ddLine.setSelectedIndex(''); // Set default to the first option
                            this.populateOrderCycleOption(this.ddLine.getValue(3));

                        }
                    } else {
                        console.error('Invalid data structure in API response:', data);
                    }
                } catch (error) {
                    console.error('Error parsing API response:', error);
                }
            };

            callback.onFailure = (errorDescription) => {
                console.error('Error fetching line data:', errorDescription);
                alert('An error occurred while fetching line data. Please try again.');
            };

            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        } catch (error) {
            console.error('Error during dropdown population:', error);
            alert('An error occurred while populating the line dropdown. Please try again.');
        }
    }

    handleLineChange(recordData) {
        try {
            const selectedIndex = this.ddLine.getSelectedIndex();
            const selectedValue = this.ddLine.getValueAtIndex(selectedIndex);
            if (selectedValue) {
                this.selectedLineID = parseInt(selectedValue, 10); // Ensure this sets the correct value
                //  recordData.line = this.selectedLineID; // Update recordData with the selected line ID
                // Call the API to get shift details based on the selected line ID
                // this.populateOrderCycleOption();

                this.populateOrderCycleOption(this.selectedLineID);

            } else {
                if (typeof this.ddOrderCycle.clearOptions === 'function') {
                    this.ddOrderCycle.clearOptions();
                } else if (typeof this.ddOrderCycle.clear === 'function') {
                    this.ddOrderCycle.clear();
                }

                this.ddOrderCycle.addItem('Select', '');
            }
        } catch (error) {
            console.error('Error handling line change:', error);
        }
    }

    populateOrderCycleOption(LineId) {
        try {
            if (LineId !== "") {
                const host = new MaterialHostDetails();
                const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
                proxy.url = host.url + "getOrderCycleOption"; // API URL for line options
                proxy.payLoad = JSON.stringify({ LineId: LineId });
                proxy.method = "POST"; // Use GET method
                proxy.contentType = "application/json; charset=utf-8";
                proxy.timeout = 20000;
                proxy.keepAlive = false;

                const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

                callback.onSuccess = (responseData) => {
                    try {
                        const data = JSON.parse(responseData);

                        if (Array.isArray(data)) {
                            if (data.length > 0) {
                                if (typeof this.ddOrderCycle.clearOptions === 'function') {
                                    this.ddOrderCycle.clearOptions();
                                } else if (typeof this.ddOrderCycle.clear === 'function') {
                                    this.ddOrderCycle.clear();
                                }

                                this.ddOrderCycle.addItem('Select', '');

                                data.forEach((option, index) => {
                                    this.ddOrderCycle.addItem(option.code, option.id.toString());
                                });
                                if(data.length > 0){
                                    this.OrderCycleCodeList = data;
                                }else{
                                    this.OrderCycleCodeList = [];
                                }

                                if (data.length > 0) {
                                    this.ddOrderCycle.setSelectedIndex(0); // Set default to the first option
                                }
                            } else {
                               // alert("Data not found!")
                            }
                        } else {
                            console.error('Invalid data structure in API response:', data);
                        }
                    } catch (error) {
                        console.error('Error parsing API response:', error);
                    }
                };

                callback.onFailure = (errorDescription) => {
                    console.error('Error fetching line data:', errorDescription);
                    alert('An error occurred while fetching line data. Please try again.');
                };

                palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
            } else {
                if (typeof this.ddOrderCycle.clearOptions === 'function') {
                    this.ddOrderCycle.clearOptions();
                } else if (typeof this.ddOrderCycle.clear === 'function') {
                    this.ddOrderCycle.clear();
                }

                this.ddOrderCycle.addItem('Select', '');
            }
        } catch (error) {
            console.error('Error during dropdown population:', error);
            alert('An error occurred while populating the line dropdown. Please try again.');
        }
    }

    setRecordData(recordData) {
        super.setRecordData(recordData);

        //var currentDate = new Date(recordData.currentDate);
        //this.dtCurrentDate.setDateValue("/Date(" + +currentDate + ")/");

        super.setDropDownValue(this.ddLine, recordData.line);
        super.setDropDownValue(this.ddOrderCycle, recordData.orderCycle);
    }

    getRecordData() {
        let jsonObject = super.getRecordData();

        //jsonObject.currentDate = this.dtCurrentDate.getDateValue();
        jsonObject.line = (this.ddLine.getSelectedIndex() == 0 ? null : (this.ddLine.getValue(this.ddLine.getSelectedIndex())));
        jsonObject.orderCycle = (this.ddOrderCycle.getSelectedIndex() == 0 ? null : parseInt(this.ddOrderCycle.getValue(this.ddOrderCycle.getSelectedIndex())));
        jsonObject.OrderCycleCodeList = this.OrderCycleCodeList;

        return jsonObject;
    }



    onSearchClick(data) {
        let instance = this;
        // Validate the dropdown selection
        if (!this.validate()) {
            alert('Please select an option from the dropdown before proceeding.');
            return;
        }

        //Fetch the current form data
        const currentData = instance.getRecordData();
        console.log("current Data", currentData);

        this.toBeordered = new MaterialProcurementToBeOrderedPanel();
        // this.toBeordered.grid.removeAll()
        this.toBeordered.setRecordData(currentData.line, currentData.orderCycle);
        this.toBeordered.grid.initialize();
        // this.toBeordered.grid.addStyleName('MaterialProcurement-form');
        // this.toBeordered.grid.setDefaultCellValue('NA');
        // this.toBeordered.grid.renderGrid();

        // thiis.toBeordered.childGrid.removeAll();
        thiis.toBeordered.childGrid.initialize();
        // thiis.toBeordered.childGrid.addHeaderStyleName('FLVTGridHeader');
        // thiis.toBeordered.childGrid.setDefaultCellValue('NA');
        // thiis.toBeordered.childGrid.renderGrid();

        //this.ordered.loadData();
        // this.grid.initialize();
        // this.grid.addStyleName('ProductionControlForm-Grid');
        // this.grid.setDefaultCellValue('NA');
        // this.grid.renderGrid();

    }

    validate() {
        if (this.ddLine.getSelectedIndex() === 0 || this.ddLine.getValueAtIndex(this.ddLine.getSelectedIndex()) === '') {
            return false;
        } else {
            return true;
        }
    }
}