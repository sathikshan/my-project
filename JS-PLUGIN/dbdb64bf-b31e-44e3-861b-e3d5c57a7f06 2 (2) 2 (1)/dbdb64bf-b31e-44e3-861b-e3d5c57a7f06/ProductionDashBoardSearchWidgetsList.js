
class ProductionDashBoardSearchWidgetsList extends palms.exported.framework.SearchWidgetsList {
    constructor(recordData) {
        super(recordData);
        this.ddLine = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown();
        this.currentDate = null;
        this.currentTime = null;
        this.currentShift = null;
        this.lineOptionsData = [];
        this.selectedLineID = null; // Track the selected line ID
        this.recordData = recordData; // Store recordData to ensure updates reflect correctly
        this.shiftDetails = {}; // To store the shift details from the API
    }

    initialize() {
        try {
            console.log("Initializing ProductionDashBoardHeaderSearchWidgetsList...");
            super.initialize();

            // Add dropdown to the form
            super.addSelfValidatingControl("Line", this.ddLine, true);


            // Add search button
            const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
            buttonControl.setText("Search");

            // Create an instance of the class to handle the click event
            let instance = this;
            buttonControl.onClick = () => {
                console.log("Search button clicked.");
                instance.onSearchClick();
            };

            // Add the button control to the form
            super.addSelfValidatingControl("Button Control", buttonControl, true);


            // Populate the dropdown with line options from the API
            this.populateLineDropdown();

            // Define and bind the change handler for the dropdown
            const lineChangeHandler = new palms.exported.gwt.event.dom.client.IChangeHandler();
            lineChangeHandler.onChange = function (event) {
                console.log("Dropdown change detected.");
                instance.handleLineChange(instance.recordData);
            };
            this.ddLine.addChangeHandler(lineChangeHandler);

        } catch (error) {
            console.error('Error during initialization:', error);
            alert('An error occurred while initializing the search widgets. Please try again.');
        }
    }

    populateLineDropdown() {
        try {
            const host = new DashBoard();
            const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            //proxy.url = "http://localhost:8081/getLineOptions"; // API URL for line options
            proxy.url = host.url + "getLineOptions"; 
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
                            this.ddLine.setSelectedIndex(0); // Set default to the first option
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
            alert('An error occurred while populating the line dropdown. Please try again.');
        }
    }

    handleLineChange(recordData) {
            const selectedIndex = this.ddLine.getSelectedIndex();
            const selectedValue = this.ddLine.getValueAtIndex(selectedIndex);

            if (selectedValue) {
                this.selectedLineID = parseInt(selectedValue, 10); // Ensure this sets the correct value
                recordData.line = this.selectedLineID; 

                // Call the API to get shift details based on the selected line ID
                this.fetchShiftDetails(this.selectedLineID);
            } else {
                console.log("No valid selection made.");
            }
    }
    

    fetchShiftDetails(lineId) {
        try {
            console.log("Fetching shift details for line ID:", lineId);
            const host = new DashBoard();
            const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            //proxy.url = "http://localhost:8081/getShiftDetails"; 
            // const host = new DashBoard();
            // var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
             proxy.url = host.url + "getShiftDetails"; // Backend service URL
            proxy.method = "POST"; 
            proxy.contentType = "application/json; charset=utf-8";
            proxy.timeout = 20000;
            proxy.keepAlive = false;
            proxy.payLoad = JSON.stringify({ lineId: lineId });
    
            const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
            callback.onSuccess = (responseData) => {
                    console.log('Shift Details API Response:', responseData);
                    const data = JSON.parse(responseData);
    
                    // Update shift details with the response data
                    this.shiftDetails = data;
                    // Update currentDate, currentTime, and shift if provided in response
                    this.currentDate = data.currentDate || this.currentDate;
                    this.currentTime = data.currentTime || this.currentTime;
                    this.currentShift = data.shift || this.currentShift;
    
            };
    
            callback.onFailure = (errorDescription) => {
                alert('An error occurred while fetching shift details. Please try again.');
            };
    
            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        } catch (error) {
            alert('An error occurred while fetching shift details. Please try again.');
        }
    }


    setRecordData(recordData) {
        super.setRecordData(recordData);
    
        if (recordData.line) {
            this.ddLine.selectValue(recordData.line); 
        } else {
            console.log('No line value provided in recordData.');
        }
    
        if (recordData.currentDate) {
            this.currentDate = recordData.currentDate;
        }
    
        if (recordData.currentTime) {
            this.currentTime = recordData.currentTime;
        }
    
        if (recordData.shift) {
            this.currentShift = recordData.shift;
        }
    }
    
    getRecordData() {
        console.log("getRecordData called.");
        let jsonObject = super.getRecordData();
        const selectedIndex = this.ddLine.getSelectedIndex();
        

        jsonObject.line = parseInt(this.ddLine.getValueAtIndex(selectedIndex), 10);
        

        jsonObject.currentDate = this.currentDate || null; 
        jsonObject.currentTime = this.currentTime || null;
        jsonObject.shift = this.currentShift || null;
        
        return jsonObject;
    }
    
    onSearchClick() {
        let instance = this;
    
        if (!this.validate()) {
            alert('Please select an option from the dropdown before proceeding.');
            return;
        }
    
        const currentData = instance.getRecordData();
    
        alert('ProductionCurrentShiftHeaderSearchWidgetsList: ' + currentData);
    }
    

    validate() {
        if (this.ddLine.getSelectedIndex() === 0 || this.ddLine.getValueAtIndex(this.ddLine.getSelectedIndex()) === '') {
            return false;
        } else {
            return true;
        }
    }
}














