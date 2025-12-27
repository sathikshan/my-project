class PartOrderSearchHeaderWidgets extends palms.exported.framework.SearchWidgetsList {
    constructor(recordData) {
        try {
        super(recordData);
        this.dtDate = new palms.exported.framework.selfValidatingControls.ToDateControl(false); // Date control
        this.ddLine = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown();
        this.ddShift = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown(); // Shift dropdown

        this.selectedLineID = null;
        this.selectedDate=null;
        this.recordData = recordData;
        this.shiftDetails = {};
        this.setRecordData(super.getRecordData());
    } catch (error) {
        console.error("Error in ProductionDashBoardSearchWidgetsList constructor:", error);
    }
    }

    initialize() {
        try {
            

            console.log("Initializing PartOrderHeaderWidgets...");
            super.initialize();

            super.addSelfValidatingControl("Date", this.dtDate, true);

            super.addSelfValidatingControl("Line", this.ddLine, true);

            super.addSelfValidatingControl("Shift", this.ddShift, true);

            const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
            buttonControl.setText("Search");

            let instance = this;
            buttonControl.onClick = () => {
                console.log("Search button clicked.");
                instance.onSearchClick();
            };

            super.addSelfValidatingControl("Button Control", buttonControl, true);
            //console.log("Added search button to the form.");
            


            // Populate line dropdown from the API
            this.populateLineDropdown();

        this.dtDate.onChange = (event) => {
            this.handleDateChange(event);
        };


            // Define and bind the change handler for the dropdown
            const lineChangeHandler = new palms.exported.gwt.event.dom.client.IChangeHandler();
            lineChangeHandler.onChange = function (event) {
                //console.log("Dropdown change detected.");
                instance.handleLineChange(instance.recordData);
            };
            this.ddLine.addChangeHandler(lineChangeHandler);
           // console.log("Bound change handler to the dropdown.");

            // Define and bind the change handler for the dropdown
            const shiftChangeHandler = new palms.exported.gwt.event.dom.client.IChangeHandler();
            shiftChangeHandler.onChange = function (event) {
                //console.log("Dropdown change detected.");
                instance.handleShiftChange(instance.recordData);
            };
            this.ddShift.addChangeHandler(shiftChangeHandler);
            //console.log("Bound change handler to the dropdown.");

            

        } catch (error) {
            //console.error('Error during initialization:', error);
            alert('An error occurred while initializing the search widgets. Please try again.');
        }

        
    }
    search() {
        try {
            // Add search logic here
        } catch (error) {
            //console.error("Error in search method:", error);
        }
    }

    populateLineDropdown() {
        try {
            console.log("Attempting to populate dropdown with line options...");
            // const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            // proxy.url = "http://localhost:8081/getLineOptions"; // API URL for line options
            const host = new PartOrder();
            var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            proxy.url = host.url + "getLineOptions"; // Backend service URL
            proxy.method = "GET"; // Use GET method
            proxy.contentType = "application/json; charset=utf-8";
            proxy.timeout = 20000;
            proxy.keepAlive = false;

            const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

            callback.onSuccess = (responseData) => {
                try {
                    console.log('API Response:', responseData); // Debugging API response
                    const data = JSON.parse(responseData);

                    if (Array.isArray(data)) {
                        if (typeof this.ddLine.clearOptions === 'function') {
                            this.ddLine.clearOptions();
                            //console.log('Cleared existing dropdown options.');
                        } else if (typeof this.ddLine.clear === 'function') {
                            this.ddLine.clear();
                           // console.log('Cleared dropdown using alternative clear method.');
                        }

                        this.ddLine.addItem('Select', '');

                        data.forEach((option, index) => {
                           // console.log(`Adding item to dropdown: ${option.code} with ID ${option.id}`);
                            this.ddLine.addItem(option.code, option.id.toString());
                        });

                        if (data.length > 0) {
                            this.ddLine.setSelectedIndex(0); // Set default to the first option
                        }

                        console.log("Dropdown populated with line options:", data.length);
                    } else {
                      //  console.error('Invalid data structure in API response:', data);
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

  

    handleDateChange(event) {
        try {
            const dateObject = this.dtDate.getDateObject();
            this.selectedDate = dateObject.q; // Assuming `q` contains the Date object
    
            if (this.isValidDate(this.selectedDate)) {
                const today = new Date();
                // Set the time part of today to 00:00:00 for accurate comparison
                today.setHours(0, 0, 0, 0);
    
                if (this.selectedDate > today) {
                    alert("Please select a date that is less than or equal to the current date.");
                    this.dtDate.setValue(today); // Reset to today's date
                    this.selectedDate = today; // Update selectedDate to today's date
                } else {
                    const formattedDate = this.formatDate(this.selectedDate);
                    console.log("Date changed to:", formattedDate);
                }
            } else {
                console.error("Selected date is invalid:", this.selectedDate);
            }
        } catch (error) {
            console.error('Error handling date change:', error);
        }
    }
    

 
    formatDate(date) {
        if (!this.isValidDate(date)) {
            //console.error('Invalid date provided to formatDate:', date);
            return null;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }
    
    
    

    handleLineChange(recordData) {
        try {
            const selectedIndex = this.ddLine.getSelectedIndex();
            const selectedValue = this.ddLine.getValueAtIndex(selectedIndex);
            //console.log("Selected line ID:", selectedValue);

            if (selectedValue) {
                this.selectedLineID = parseInt(selectedValue, 10); 
                recordData.line = this.selectedLineID;
                //console.log("selectedLineID set to:", this.selectedLineID);
                //console.log("Updated recordData:", recordData);

                // Call the API to get shift details based on the selected line ID
                this.fetchShiftDetails(this.selectedLineID);
            } else {
                console.log("No valid selection made.");
            }
        } catch (error) {
            console.error('Error handling line change:', error);
        }
    }

    handleShiftChange(recordData) {
        try {
            const selectedIndex = this.ddShift.getSelectedIndex();
            const selectedValue = this.ddShift.getValueAtIndex(selectedIndex);
            //console.log("Selected Shift ID:", selectedValue);

            if (selectedValue) {
                this.selectedShiftID = parseInt(selectedValue, 10);
                recordData.shift = this.selectedShiftID; 
                //console.log("selectedLineID set to:", this.selectedShiftID);
                //console.log("Updated recordData:", recordData);

            } else {
                console.log("No valid selection made.");
            }
        } catch (error) {
            console.error('Error handling line change:', error);
        }
    }

    fetchShiftDetails(lineId) {
        try {
            console.log("Fetching shift details for line ID:", lineId);

            console.log("Attempting to populate dropdown with line options...");
            // const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            // proxy.url = "http://localhost:8081/getShift"; // API URL for fetching shift details
            const host = new PartOrder();
            var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            proxy.url = host.url + "getShift"; // Backend service URL
            proxy.method = "POST";
            proxy.contentType = "application/json; charset=utf-8";
            proxy.timeout = 20000;
            proxy.keepAlive = false;
            proxy.payLoad = JSON.stringify({lineId:lineId});

            console.log("Proxy setup:", {
                url: proxy.url,
                method: proxy.method,
                contentType: proxy.contentType,
                payLoad: proxy.payLoad
            });

            const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

            callback.onSuccess = (responseData) => {
                try {
                    console.log("Shift details response:", responseData);
                    const data = JSON.parse(responseData);

                    if (Array.isArray(data)) {
                        if (typeof this.ddShift.clearOptions === 'function') {
                            this.ddShift.clearOptions();
                            //console.log('Cleared existing dropdown options.');
                        } else if (typeof this.ddShift.clear === 'function') {
                            this.ddShift.clear();
                           // console.log('Cleared dropdown using alternative clear method.');
                        }

                        this.ddShift.addItem('Select', '');

                        data.forEach((shift, index) => {
                          //  console.log(`Adding item to dropdown: ${shift.ShiftName} with ID ${shift.ShiftId}`);
                            this.ddShift.addItem(shift.ShiftName, shift.ShiftId.toString());
                        });


                        // data.forEach(shift => {
                        //     console.log(`Adding item to dropdown:${shift.ShiftName} with ID ${shift.ShiftId}`);
                        //     this.ddShift.addItem(shift.ShiftName, shift.ShiftId.toString());
                        // });

                        if (data.length > 0) {
                            this.ddShift.setSelectedIndex(0); // Set default to the first option
                        }
                        



                    } else {
                        console.error('Invalid shift data received.');
                    }
                } catch (error) {
                    console.error('Error parsing shift details:', error);
                }
            };

            callback.onFailure = (errorDescription) => {
                console.error("Error fetching shift details:", errorDescription);
                alert("An error occurred while fetching shift details. Please try again.");
            };

            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        } catch (error) {
            console.error("Error fetching shift details:", error);
        }
    }

    onSearchClick() {
        try {
            let instance = this;
            console.log("onSearchClick called.");
    
            // Validate the selections
            if (!this.validate()) {
                alert("Please select a valid date, line, and shift.");
                return;
            }
    
            const currentData = instance.getRecordData();
          
    
            alert("PartOrderHeaderWidgets: " + currentData);
    
        } catch (error) {
            console.error("Error during search click:", error);
            alert("An error occurred while performing the search. Please try again.");
        }
    }
    

    validate() {
        try {

            //const formattedToday = this.formatDate(new Date()); // Format today's date
            const formattedSelectedDate = this.formatDate(this.selectedDate);

            //console.log("Line Selected Index:", this.ddLine.getSelectedIndex());
            //console.log("Shift Selected Index:", this.ddShift.getSelectedIndex());
            //console.log("Formatted Selected Date:", formattedSelectedDate); // Log formatted selected date
           // console.log("Formatted Today's Date:", formattedToday); // Log formatted today's date

            // Ensure the selected date is a valid date and formatted correctly
            return this.ddLine.getSelectedIndex() > 0 &&
                   this.ddShift.getSelectedIndex() > 0 &&
                //    formattedSelectedDate !== null &&
                //    formattedSelectedDate <= formattedToday;
                formattedSelectedDate ;
        } catch (error) {
            console.error("Error during validation:", error);
            return false;
        }
    }
    
    setRecordData(recordData) {
        try {
            //console.log("Setting record data:", recordData);
            
            if (recordData) {
                if (recordData.date) {
                    const parsedDate = new Date(recordData.date);
                    if (this.isValidDate(parsedDate)) {
                        this.dtDate.setValue(parsedDate); // Assuming setValue takes a Date object
                        this.selectedDate = parsedDate;
                        console.log("Date set to:", parsedDate);
                    } else {
                        console.error("Invalid date format provided in recordData:", recordData.date);
                    }
                } else {
                    console.warn("No date provided in recordData.");
                }
    
                // Set the selected line in the dropdown if available
                if (recordData.line) {
                    const lineIndex = this.ddLine.getIndexForValue(recordData.line.toString());
                    if (lineIndex >= 0) {
                        this.ddLine.setSelectedIndex(lineIndex);
                        this.selectedLineID = recordData.line;
                        //console.log("Line set to:", recordData.line);
                    } else {
                        console.error("Line ID not found in dropdown options:", recordData.line);
                    }
                }
    
                // Set the selected shift in the dropdown if available
                if (recordData.shift) {
                    const shiftIndex = this.ddShift.getIndexForValue(recordData.shift.toString());
                    if (shiftIndex >= 0) {
                        this.ddShift.setSelectedIndex(shiftIndex);
                        this.selectedShiftID = recordData.shift;
                      //  console.log("Shift set to:", recordData.shift);
                    } else {
                        console.error("Shift ID not found in dropdown options:", recordData.shift);
                    }
                }
            } else {
                console.error("Invalid or empty recordData provided.");
            }
        } catch (error) {
            console.error("Error setting record data:", error);
        }
    }

    getRecordData() {
        try {
            // Retrieve the selected index and values from dropdowns

            console.log("getRecordData called.");

            let jsonObject = super.getRecordData();

            const selectedLineIndex = this.ddLine.getSelectedIndex();
            const selectedShiftIndex = this.ddShift.getSelectedIndex();
    
            // Format the date using formatDate
            const formattedDate = this.selectedDate ? this.formatDate(this.selectedDate) : null;
    
            // // Set the line and shift values based on the selected indices
            // const data = {
            //     date: formattedDate,
            //     line: selectedLineIndex > 0 ? parseInt(this.ddLine.getValueAtIndex(selectedLineIndex), 10) : null,
            //     shift: selectedShiftIndex > 0 ? parseInt(this.ddShift.getValueAtIndex(selectedShiftIndex), 10) : null
            // };

            // Merge the new data into jsonObject
        jsonObject = {
            date: formattedDate,
            line: selectedLineIndex > 0 ? parseInt(this.ddLine.getValueAtIndex(selectedLineIndex), 10) : null,
            shift: selectedShiftIndex > 0 ? parseInt(this.ddShift.getValueAtIndex(selectedShiftIndex), 10) : null        // Include new data (date, line, and shift)
        };

        
    
            //console.log("Record data retrieved:", jsonObject);
            return jsonObject;
        } catch (error) {
            console.error("Error getting record data:", error);
            return null;
        }
    }
}

    
    

    

