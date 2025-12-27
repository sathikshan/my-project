// class ProductionLoadTimeChartSearchWidgetsList extends palms.exported.framework.SearchWidgetsList {
//     constructor(recordData) {
//         super(recordData);
//         this.dtCurrentDate = new palms.exported.framework.selfValidatingControls.FromDateControl(false);
//         this.txtShift = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
//         this.txtLine = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();

//         this.setRecordData(super.getRecordData());
//     }

//     initialize() {
//         super.initialize();
// 		let widgetGroup = new palms.exported.framework.WidgetGroup('Search Criteria');
// 		widgetGroup.setShowHeader(true);

//         super.addSelfValidatingGroupControl("Current Date", this.dtCurrentDate, true, widgetGroup);
//         super.addSelfValidatingGroupControl("Shift", this.txtShift, true, widgetGroup);
//         super.addSelfValidatingGroupControl("Line", this.txtLine, true, widgetGroup);

//         this.buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
//         this.buttonControl.setText("Search");
//         this.buttonControl.onClick = () => this.search();

//         super.addSelfValidatingGroupControl("Button Control", this.buttonControl, true, widgetGroup);
//     }

//     search() {
//     }

//     setRecordData(recordData) {
//         super.setRecordData(recordData);
        
//         var currentDate = new Date(recordData.currentDate);
//         this.dtCurrentDate.setDateValue("/Date(" + +currentDate + ")/");
//         this.txtShift.setText(recordData.shift);
//         this.txtLine.setText(recordData.line);
//     }
// }
// class ProductionLoadTimeChartSearchWidgetsList extends palms.exported.framework.SearchWidgetsList {
//     constructor(recordData) {
//         super(recordData);
//         this.dtCurrentDate = new palms.exported.framework.selfValidatingControls.FromDateControl(false);
//         this.ddLine = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown();
//         this.ddShift = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown();

//         this.selectedLineID = null;
//         this.selectedDate = null;
//         this.recordData = recordData;
//         this.shiftDetails = {};

//         this.setRecordData(super.getRecordData());
//     }

//     initialize() {
//         try {
//             super.initialize();
            
//             // let searchCriteriaGroup = new palms.exported.framework.WidgetGroup('Search Criteria');
//             // searchCriteriaGroup.setShowHeader(true);
    
//             super.addSelfValidatingControl("Current Date", this.dtCurrentDate, true);
//             super.addSelfValidatingControl("Line", this.ddLine, true);
//             super.addSelfValidatingControl("Shift", this.ddShift, true);
    
//             const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
//             buttonControl.setText("Search");

//             let instance=this;
//             buttonControl.onClick = () =>{ instance.onSearachClick()};
    
//             super.addSelfValidatingControl("Button Control", buttonControl, true);
    
//             this.populateLineDropdown();
    
//             this.dtCurrentDate.onChange = (event) => {
//                 this.handleDateChange(event);
//             };
    
//             const lineChangeHandler = new palms.exported.gwt.event.dom.client.IChangeHandler();
//             lineChangeHandler.onChange = (event) => {
//                 instance.handleLineChange(instance.recordData);
//             };
//             this.ddLine.addChangeHandler(lineChangeHandler);
    
//             const shiftChangeHandler = new palms.exported.gwt.event.dom.client.IChangeHandler();
//             shiftChangeHandler.onChange = (event) => {
//                 instance.handleShiftChange(instance.recordData);
//             };
//             this.ddShift.addChangeHandler(shiftChangeHandler);
    
//         } catch (error) {
//             console.error('Error during initialization:', error);
//             alert('An error occurred while initializing the search widgets. Please try again.');
//         }
//     }

//     populateLineDropdown() {
//         try {
//             console.log("Attempting to populate dropdown with line options...");
//             const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
//             proxy.url = "http://localhost:8081/getLineOptions";
//             proxy.method = "GET";
//             proxy.contentType = "application/json; charset=utf-8";
//             proxy.timeout = 20000;
//             proxy.keepAlive = false;
 
//             const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
 
//             callback.onSuccess = (responseData) => {
//                 try {
//                     console.log('API Response:', responseData);
//                     const data = JSON.parse(responseData);
 
//                     if (Array.isArray(data)) {
//                         this.ddLine.clear();
//                         this.ddLine.addItem('Select', '');
 
//                         data.forEach((option) => {
//                             console.log(`Adding item to dropdown: ${option.code} with ID ${option.id}`);
//                             this.ddLine.addItem(option.code, option.id.toString());
//                         });
 
//                         if (data.length > 0) {
//                             this.ddLine.setSelectedIndex(0);
//                         }
 
//                         console.log("Dropdown populated with line options:", data.length);
//                     } else {
//                         console.error('Invalid data structure in API response:', data);
//                     }
//                 } catch (error) {
//                     console.error('Error parsing API response:', error);
//                 }
//             };
 
//             callback.onFailure = (errorDescription) => {
//                 console.error('Error fetching line data:', errorDescription);
//                 alert('An error occurred while fetching line data. Please try again.');
//             };
 
//             palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
//         } catch (error) {
//             console.error('Error during dropdown population:', error);
//             alert('An error occurred while populating the line dropdown. Please try again.');
//         }
//     }

//     handleDateChange(event) {
//         try {
//             const dateObject = this.dtCurrentDate.getDateObject();
//             this.selectedDate = dateObject.q;
 
//             if (this.isValidDate(this.selectedDate)) {
//                 const formattedDate = this.formatDate(this.selectedDate);
//                 console.log("Date changed to:", formattedDate);
//             } else {
//                 console.error("Selected date is invalid:", this.selectedDate);
//             }
//         } catch (error) {
//             console.error('Error handling date change:', error);
//         }
//     }

//     formatDate(date) {
//         if (!this.isValidDate(date)) {
//             console.error('Invalid date provided to formatDate:', date);
//             return null;
//         }
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
//         const day = String(date.getDate()).padStart(2, '0');
//         return `${year}-${month}-${day}`;
//     }
//     isValidDate(date) {
//         return date instanceof Date && !isNaN(date.getTime());
//     }
    

//     handleLineChange(recordData) {
//         try {
//             const selectedIndex = this.ddLine.getSelectedIndex();
//             const selectedValue = this.ddLine.getValueAtIndex(selectedIndex);
//             console.log("Selected line ID:", selectedValue);
 
//             if (selectedValue) {
//                 this.selectedLineID = parseInt(selectedValue, 10);
//                 recordData.line = this.selectedLineID;
//                 console.log("selectedLineID set to:", this.selectedLineID);
//                 console.log("Updated recordData:", recordData);
 
//                 this.fetchShiftDetails(this.selectedLineID);
//             } else {
//                 console.log("No valid selection made.");
//             }
//         } catch (error) {
//             console.error('Error handling line change:', error);
//         }
//     }

//     handleShiftChange(recordData) {
//         try {
//             const selectedIndex = this.ddShift.getSelectedIndex();
//             const selectedValue = this.ddShift.getValueAtIndex(selectedIndex);
//             console.log("Selected Shift ID:", selectedValue);
 
//             if (selectedValue) {
//                 this.selectedShiftID = parseInt(selectedValue, 10); // Ensure this sets the correct value
//                 recordData.shift = this.selectedShiftID; // Update recordData with the selected line ID
//                 console.log("selectedLineID set to:", this.selectedShiftID);
//                 console.log("Updated recordData:", recordData);
 
//             } else {
//                 console.log("No valid selection made.");
//             }
//         } catch (error) {
//             console.error('Error handling line change:', error);
//         }
//     }

//     fetchShiftDetails() {
//         try {
//             //console.log("Fetching shift details for line ID:", lineId);
 
//             const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
//             proxy.url = "http://localhost:8081/getShiftDetail";
//             proxy.method = "POST";
//             proxy.contentType = "application/json; charset=utf-8";
//             proxy.timeout = 20000;
//             proxy.keepAlive = false;
//             //proxy.payLoad = JSON.stringify({lineId: lineId});
 
//             // console.log("Proxy setup:", {
//             //     url: proxy.url,
//             //     method: proxy.method,
//             //     contentType: proxy.contentType,
//             //     payLoad: proxy.payLoad
//             // });
 
//             const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
 
//             callback.onSuccess = (responseData) => {
//                 try {
//                     console.log("Shift details response:", responseData);
//                     const data = JSON.parse(responseData);
 
//                     if (Array.isArray(data)) {
//                         this.ddShift.clear();
//                         this.ddShift.addItem('Select', '');
 
//                         data.forEach((shift) => {
//                             console.log(`Adding item to dropdown: ${shift.ShiftName} with ID ${shift.ShiftId}`);
//                             this.ddShift.addItem(shift.ShiftName, shift.ShiftId.toString());
//                         });
 
//                         if (data.length > 0) {
//                             this.ddShift.setSelectedIndex(0);
//                         }
//                     } else {
//                         console.error('Invalid shift data received.');
//                     }
//                 } catch (error) {
//                     console.error('Error parsing shift details:', error);
//                 }
//             };
 
//             callback.onFailure = (errorDescription) => {
//                 console.error("Error fetching shift details:", errorDescription);
//                 alert("An error occurred while fetching shift details. Please try again.");
//             };
 
//             palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
//         } catch (error) {
//             console.error("Error fetching shift details:", error);
//         }
//     }

//     search() {
//         try {
//             let instance = this;
//             if (!this.validate()) {
//                 alert("Please select a valid date, line, and shift.");
//                 return;
//             }
    
//             const currentData = instance.getRecordData();
//             console.log("Search data:", currentData);
    
//             // Implement your search logic here
//             // You might want to call an API or update the UI based on the search criteria
    
//             alert("ProductionLoadTimeChartSearchWidgetsList: " + JSON.stringify(currentData));
//         } catch (error) {
//             console.error("Error during search:", error);
//             alert("An error occurred while performing the search. Please try again.");
//         }
//     }

//     validate() {
//         try {
//             const formattedSelectedDate = this.formatDate(this.selectedDate);
 
//             console.log("Line Selected Index:", this.ddLine.getSelectedIndex());
//             console.log("Shift Selected Index:", this.ddShift.getSelectedIndex());
//             console.log("Formatted Selected Date:", formattedSelectedDate);
 
//             return this.ddLine.getSelectedIndex() > 0 &&
//                    this.ddShift.getSelectedIndex() > 0 &&
//                    formattedSelectedDate !== null;
//         } catch (error) {
//             console.error("Error during validation:", error);
//             return false;
//         }
//     }

//     setRecordData(recordData) {
//         try {
//             console.log("Setting record data:", recordData);
           
//             if (recordData) {
//                 if (recordData.currentDate) {
//                     const parsedDate = new Date(recordData.currentDate);
//                     if (this.isValidDate(parsedDate)) {
//                         this.dtCurrentDate.setValue(parsedDate);
//                         this.selectedDate = parsedDate;
//                         console.log("Date set to:", parsedDate);
//                     } else {
//                         console.error("Invalid date provided in recordData:", recordData.currentDate);
//                     }
//                 }
   
//                 if (recordData.line) {
//                     const lineIndex = this.ddLine.getIndexForValue(recordData.line.toString());
//                     if (lineIndex >= 0) {
//                         this.ddLine.setSelectedIndex(lineIndex);
//                         this.selectedLineID = recordData.line;
//                         console.log("Line set to:", recordData.line);
//                         this.fetchShiftDetails(this.selectedLineID);
//                     } else {
//                         console.error("Line ID not found in dropdown options:", recordData.line);
//                     }
//                 }
   
//                 if (recordData.shift) {
//                     const shiftIndex = this.ddShift.getIndexForValue(recordData.shift.toString());
//                     if (shiftIndex >= 0) {
//                         this.ddShift.setSelectedIndex(shiftIndex);
//                         this.selectedShiftID = recordData.shift;
//                         console.log("Shift set to:", recordData.shift);
//                     } else {
//                         console.error("Shift ID not found in dropdown options:", recordData.shift);
//                     }
//                 }
//             } else {
//                 console.error("Invalid or empty recordData provided.");
//             }
//         } catch (error) {
//             console.error("Error setting record data:", error);
//         }
//     }

//     getRecordData() {
//         try {
//             console.log("getRecordData called.");
 
//             const selectedLineIndex = this.ddLine.getSelectedIndex();
//             const selectedShiftIndex = this.ddShift.getSelectedIndex();
   
//             const formattedDate = this.selectedDate ? this.formatDate(this.selectedDate) : null;
   
//             const data = {
//                 currentDate: formattedDate,
//                 line: selectedLineIndex > 0 ? parseInt(this.ddLine.getValueAtIndex(selectedLineIndex), 10) : null,
//                 shift: selectedShiftIndex > 0 ? parseInt(this.ddShift.getValueAtIndex(selectedShiftIndex), 10) : null
//             };
   
//             console.log("Record data retrieved:", data);
//             return data;
//         } catch (error) {
//             console.error("Error getting record data:", error);
//             return null;
//         }
//     }

// }



// class ProductionLoadTimeChartSearchWidgetsList extends palms.exported.framework.SearchWidgetsList {
//     constructor(recordData) {
//         try {
//         super(recordData);
//         this.dtdate = new palms.exported.framework.selfValidatingControls.FromDateControl(false); // Date control
//         this.ddLine = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown();
//         this.ddShift = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown(); // Shift dropdown
 
//         this.selectedLineID = null;
//         this.selectedDate=null;
//         this.recordData = recordData;
//         this.shiftDetails = {};
//         this.setRecordData(super.getRecordData());
//     } catch (error) {
//         console.error("Error in ProductionLoadTimeChartSearchWidgetsList constructor:", error);
//     }
//     }
 
//     initialize() {
//         try {
           
 
//             console.log("Initializing ProductionLoadTimeChartSearchWidgetsList...");
//             super.initialize();
 
//             // Add date picker to the form
//             super.addSelfValidatingControl("Date", this.dtdate, true);
 
//             // Add line dropdown to the form
//             super.addSelfValidatingControl("Line", this.ddLine, true);
 
//             // Add shift dropdown to the form
//             super.addSelfValidatingControl("Shift", this.ddShift, true);
 
//             // Add search button
//             const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
//             buttonControl.setText("Search");
 
//             // Create an instance of the class to handle the click event
//             let instance = this;
//             buttonControl.onClick = () => {
//                 console.log("Search button clicked.");
//                 instance.onSearchClick();
//             };
 
//             super.addSelfValidatingControl("Button Control", buttonControl, true);
//             console.log("Added search button to the form.");
           
 
 
//             // Populate line dropdown from the API
//             this.populateLineDropdown();
 
//         this.dtdate.onChange = (event) => {
//             this.handleDateChange(event);
//         };
 
 
//             // Define and bind the change handler for the dropdown
//             const lineChangeHandler = new palms.exported.gwt.event.dom.client.IChangeHandler();
//             lineChangeHandler.onChange = function (event) {
//                 console.log("Dropdown change detected.");
//                 instance.handleLineChange(instance.recordData);
//             };
//             this.ddLine.addChangeHandler(lineChangeHandler);
//             console.log("Bound change handler to the dropdown.");
 
//             // Define and bind the change handler for the dropdown
//             const shiftChangeHandler = new palms.exported.gwt.event.dom.client.IChangeHandler();
//             shiftChangeHandler.onChange = function (event) {
//                 console.log("Dropdown change detected.");
//                 instance.handleShiftChange(instance.recordData);
//             };
//             this.ddShift.addChangeHandler(shiftChangeHandler);
//             console.log("Bound change handler to the dropdown.");
 
           
 
//         } catch (error) {
//             console.error('Error during initialization:', error);
//             alert('An error occurred while initializing the search widgets. Please try again.');
//         }
 
       
//     }
//     search() {
//         try {
//             // Add search logic here
//         } catch (error) {
//             console.error("Error in search method:", error);
//         }
//     }
 
//     populateLineDropdown() {
//         try {
//             console.log("Attempting to populate dropdown with line options...");
//             const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
//             proxy.url = "http://localhost:8081/getLineOption"; // API URL for line options
//             proxy.method = "GET"; // Use GET method
//             proxy.contentType = "application/json; charset=utf-8";
//             proxy.timeout = 20000;
//             proxy.keepAlive = false;
 
//             const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
 
//             callback.onSuccess = (responseData) => {
//                 try {
//                     console.log('API Response:', responseData); // Debugging API response
//                     const data = JSON.parse(responseData);
 
//                     if (Array.isArray(data)) {
//                         if (typeof this.ddLine.clearOptions === 'function') {
//                             this.ddLine.clearOptions();
//                             console.log('Cleared existing dropdown options.');
//                         } else if (typeof this.ddLine.clear === 'function') {
//                             this.ddLine.clear();
//                             console.log('Cleared dropdown using alternative clear method.');
//                         }
 
//                         this.ddLine.addItem('Select', '');
 
//                         data.forEach((option, index) => {
//                             console.log(`Adding item to dropdown: ${option.code} with ID ${option.id}`);
//                             this.ddLine.addItem(option.code, option.id.toString());
//                         });
 
//                         if (data.length > 0) {
//                             this.ddLine.setSelectedIndex(0); // Set default to the first option
//                         }
 
//                         console.log("Dropdown populated with line options:", data.length);
//                     } else {
//                         console.error('Invalid data structure in API response:', data);
//                     }
//                 } catch (error) {
//                     console.error('Error parsing API response:', error);
//                 }
//             };
 
//             callback.onFailure = (errorDescription) => {
//                 console.error('Error fetching line data:', errorDescription);
//                 alert('An error occurred while fetching line data. Please try again.');
//             };
 
//             palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
//         } catch (error) {
//             console.error('Error during dropdown population:', error);
//             alert('An error occurred while populating the line dropdown. Please try again.');
//         }
//     }
 
 
 
//     handleDateChange(event) {
//         try {
//             const dateObject = this.dtdate.getDateObject();
//             this.selectedDate = dateObject.q; // Assuming `q` contains the Date object
   
//             if (this.isValidDate(this.selectedDate)) {
//                 const today = new Date();
//                 // Set the time part of today to 00:00:00 for accurate comparison
//                 today.setHours(0, 0, 0, 0);
   
//                 if (this.selectedDate > today) {
//                     alert("Please select a date that is less than or equal to the current date.");
//                     // Optionally, you can reset the date control or take other actions
//                     this.dtdate.setValue(today); // Reset to today's date
//                     this.selectedDate = today; // Update selectedDate to today's date
//                 } else {
//                     const formattedDate = this.formatDate(this.selectedDate);
//                     console.log("Date changed to:", formattedDate);
//                 }
//             } else {
//                 console.error("Selected date is invalid:", this.selectedDate);
//             }
//         } catch (error) {
//             console.error('Error handling date change:', error);
//         }
//     }
   
 
 
//     formatDate(date) {
//         if (!this.isValidDate(date)) {
//             console.error('Invalid date provided to formatDate:', date);
//             return null;
//         }
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
//         const day = String(date.getDate()).padStart(2, '0');
//         return `${year}-${month}-${day}`;
//     }
//     isValidDate(date) {
//         return date instanceof Date && !isNaN(date.getTime());
//     }
   
   
   
 
//     handleLineChange(recordData) {
//         try {
//             const selectedIndex = this.ddLine.getSelectedIndex();
//             const selectedValue = this.ddLine.getValueAtIndex(selectedIndex);
//             console.log("Selected line ID:", selectedValue);
 
//             if (selectedValue) {
//                 this.selectedLineID = parseInt(selectedValue, 10); // Ensure this sets the correct value
//                 recordData.line = this.selectedLineID; // Update recordData with the selected line ID
//                 console.log("selectedLineID set to:", this.selectedLineID);
//                 console.log("Updated recordData:", recordData);
 
//                 // Call the API to get shift details based on the selected line ID
//                 this.fetchShiftDetails(this.selectedLineID);
//             } else {
//                 console.log("No valid selection made.");
//             }
//         } catch (error) {
//             console.error('Error handling line change:', error);
//         }
//     }
 
//     handleShiftChange(recordData) {
//         try {
//             const selectedIndex = this.ddShift.getSelectedIndex();
//             const selectedValue = this.ddShift.getValueAtIndex(selectedIndex);
//             console.log("Selected Shift ID:", selectedValue);
 
//             if (selectedValue) {
//                 this.selectedShiftID = parseInt(selectedValue, 10); // Ensure this sets the correct value
//                 recordData.shift = this.selectedShiftID; // Update recordData with the selected line ID
//                 console.log("selectedLineID set to:", this.selectedShiftID);
//                 console.log("Updated recordData:", recordData);
 
//             } else {
//                 console.log("No valid selection made.");
//             }
//         } catch (error) {
//             console.error('Error handling line change:', error);
//         }
//     }
 
//     fetchShiftDetails(lineId) {
//         try {
//             console.log("Fetching shift details for line ID:", lineId);
 
//             console.log("Attempting to populate dropdown with line options...");
//             const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
//             proxy.url = "http://localhost:8081/getShiftDetail"; // API URL for fetching shift details
//             proxy.method = "POST";
//             proxy.contentType = "application/json; charset=utf-8";
//             proxy.timeout = 20000;
//             proxy.keepAlive = false;
//             proxy.payLoad = JSON.stringify({lineId:lineId});
 
//             console.log("Proxy setup:", {
//                 url: proxy.url,
//                 method: proxy.method,
//                 contentType: proxy.contentType,
//                 payLoad: proxy.payLoad
//             });
 
//             const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
 
//             callback.onSuccess = (responseData) => {
//                 try {
//                     console.log("Shift details response:", responseData);
//                     const data = JSON.parse(responseData);
 
//                     if (Array.isArray(data)) {
//                         if (typeof this.ddShift.clearOptions === 'function') {
//                             this.ddShift.clearOptions();
//                             console.log('Cleared existing dropdown options.');
//                         } else if (typeof this.ddShift.clear === 'function') {
//                             this.ddShift.clear();
//                             console.log('Cleared dropdown using alternative clear method.');
//                         }
 
//                         this.ddShift.addItem('Select', '');
 
//                         data.forEach((shift, index) => {
//                             console.log(`Adding item to dropdown: ${shift.ShiftName} with ID ${shift.ShiftId}`);
//                             this.ddShift.addItem(shift.ShiftName, shift.ShiftId.toString());
//                         });
 
 
//                         // data.forEach(shift => {
//                         //     console.log(`Adding item to dropdown:${shift.ShiftName} with ID ${shift.ShiftId}`);
//                         //     this.ddShift.addItem(shift.ShiftName, shift.ShiftId.toString());
//                         // });
 
//                         if (data.length > 0) {
//                             this.ddShift.setSelectedIndex(0); // Set default to the first option
//                         }
                       
 
 
 
//                     } else {
//                         console.error('Invalid shift data received.');
//                     }
//                 } catch (error) {
//                     console.error('Error parsing shift details:', error);
//                 }
//             };
 
//             callback.onFailure = (errorDescription) => {
//                 console.error("Error fetching shift details:", errorDescription);
//                 alert("An error occurred while fetching shift details. Please try again.");
//             };
 
//             palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
//         } catch (error) {
//             console.error("Error fetching shift details:", error);
//         }
//     }
 
//     onSearchClick() {
//         try {
//             let instance = this;
//             console.log("onSearchClick called.");
   
//             // Validate the selections
//             if (!this.validate()) {
//                 alert("Please select a valid date, line, and shift.");
//                 return;
//             }
   
//             const currentData = instance.getRecordData();
//             console.log("Search data:", currentData);
   
//             // Display the updated form data
//             alert("PartOrderHeaderWidgets: " + currentData);
   
//         } catch (error) {
//             console.error("Error during search click:", error);
//             alert("An error occurred while performing the search. Please try again.");
//         }
//     }
   
 
//     validate() {
//         try {
 
//             //const formattedToday = this.formatDate(new Date()); // Format today's date
//             const formattedSelectedDate = this.formatDate(this.selectedDate);
 
//             console.log("Line Selected Index:", this.ddLine.getSelectedIndex());
//             console.log("Shift Selected Index:", this.ddShift.getSelectedIndex());
//             console.log("Formatted Selected Date:", formattedSelectedDate); // Log formatted selected date
//            // console.log("Formatted Today's Date:", formattedToday); // Log formatted today's date
 
//             // Ensure the selected date is a valid date and formatted correctly
//             return this.ddLine.getSelectedIndex() > 0 &&
//                    this.ddShift.getSelectedIndex() > 0 &&
//                 //    formattedSelectedDate !== null &&
//                 //    formattedSelectedDate <= formattedToday;
//                 formattedSelectedDate ;
//         } catch (error) {
//             console.error("Error during validation:", error);
//             return false;
//         }
//     }
   
//     setRecordData(recordData) {
//         try {
//             console.log("Setting record data:", recordData);
           
//             // Check if recordData contains valid properties
//             if (recordData) {
//                 // Set the selected date if available
//                 // if (recordData.date) {
//                 //     const parsedDate = new Date(recordData.date);
//                 //     if (this.isValidDate(parsedDate)) {
//                 //         this.dtCurrentDate.setValue(parsedDate);
//                 //         this.selectedDate = parsedDate;
//                 //         console.log("Date set to:", parsedDate);
//                 //     } else {
//                 //         console.error("Invalid date provided in recordData:", recordData.date);
//                 //     }
//                 // }
//                 if (recordData.date) {
//                     const parsedDate = new Date(recordData.date);
//                     if (this.isValidDate(parsedDate)) {
//                         this.dtdate.setValue(parsedDate); // Assuming setValue takes a Date object
//                         this.selectedDate = parsedDate;
//                         console.log("Date set to:", parsedDate);
//                     } else {
//                         console.error("Invalid date format provided in recordData:", recordData.date);
//                     }
//                 } else {
//                     console.warn("No date provided in recordData.");
//                 }
   
//                 // Set the selected line in the dropdown if available
//                 if (recordData.line) {
//                     const lineIndex = this.ddLine.getIndexForValue(recordData.line.toString());
//                     if (lineIndex >= 0) {
//                         this.ddLine.setSelectedIndex(lineIndex);
//                         this.selectedLineID = recordData.line;
//                         console.log("Line set to:", recordData.line);
//                     } else {
//                         console.error("Line ID not found in dropdown options:", recordData.line);
//                     }
//                 }
   
//                 // Set the selected shift in the dropdown if available
//                 if (recordData.shift) {
//                     const shiftIndex = this.ddShift.getIndexForValue(recordData.shift.toString());
//                     if (shiftIndex >= 0) {
//                         this.ddShift.setSelectedIndex(shiftIndex);
//                         this.selectedShiftID = recordData.shift;
//                         console.log("Shift set to:", recordData.shift);
//                     } else {
//                         console.error("Shift ID not found in dropdown options:", recordData.shift);
//                     }
//                 }
//             } else {
//                 console.error("Invalid or empty recordData provided.");
//             }
//         } catch (error) {
//             console.error("Error setting record data:", error);
//         }
//     }
 
//     getRecordData() {
//         try {
//             // Retrieve the selected index and values from dropdowns
 
//             console.log("getRecordData called.");
 
//             let jsonObject = super.getRecordData();
 
//             const selectedLineIndex = this.ddLine.getSelectedIndex();
//             const selectedShiftIndex = this.ddShift.getSelectedIndex();
   
//             // Format the date using formatDate
//             const formattedDate = this.selectedDate ? this.formatDate(this.selectedDate) : null;
   
//             // // Set the line and shift values based on the selected indices
//             // const data = {
//             //     date: formattedDate,
//             //     line: selectedLineIndex > 0 ? parseInt(this.ddLine.getValueAtIndex(selectedLineIndex), 10) : null,
//             //     shift: selectedShiftIndex > 0 ? parseInt(this.ddShift.getValueAtIndex(selectedShiftIndex), 10) : null
//             // };
 
//             // Merge the new data into jsonObject
//         jsonObject = {
//             date: formattedDate,
//             line: selectedLineIndex > 0 ? parseInt(this.ddLine.getValueAtIndex(selectedLineIndex), 10) : null,
//             shift: selectedShiftIndex > 0 ? parseInt(this.ddShift.getValueAtIndex(selectedShiftIndex), 10) : null        // Include new data (date, line, and shift)
//         };
 
       
   
//             console.log("Record data retrieved:", jsonObject);
//             return jsonObject;
//         } catch (error) {
//             console.error("Error getting record data:", error);
//             return null;
//         }
//     }
//     // setRecordData(recordData) {
//     //     try {
//     //     console.log("Record Data:", recordData);
//     //     super.setRecordData(recordData);
       
//     //     var currentDate = new Date(recordData.currentDate);
//     //     console.log("Current Date Set");
//     //     this.dtCurrentDate.setDateValue("/Date(" + +currentDate + ")/");
//     //     console.log("Current Time Set");
//     //     this.txtShift.setText(recordData.shift);
//     //     this.txtLine.setText(recordData.line);
//     // } catch (error) {
//     //     console.error("Error in setRecordData method:", error);
//     // }
 
// }
 

class ProductionLoadTimeChartSearchWidgetsList extends palms.exported.framework.SearchWidgetsList {
    constructor(recordData) {
        super(recordData);
        this.ddLine = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown();
        this.currentDate = null;
        this.currentTime = null;
        this.currentShift = null;
        this.lineOptionsData = [];
        this.selectedLineID = null;
        this.recordData = recordData;
        this.shiftDetails = {};
    }

    initialize() {
        try {
            console.log("Initializing ProductionLoadTimeChartSearchWidgetsList...");
            super.initialize();

        
            super.addSelfValidatingControl("Line", this.ddLine, true);
            console.log("Added dropdown to the form.");

 
            const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
            buttonControl.setText("Search");

          
            let instance = this;
            buttonControl.onClick = () => {
                console.log("Search button clicked.");
                instance.onSearchClick();
            };


            super.addSelfValidatingControl("Button Control", buttonControl, true);
            console.log("Added search button to the form.");

            this.populateLineDropdown();


            const lineChangeHandler = new palms.exported.gwt.event.dom.client.IChangeHandler();
            lineChangeHandler.onChange = function (event) {
                console.log("Dropdown change detected.");
                instance.handleLineChange(instance.recordData);
            };
            this.ddLine.addChangeHandler(lineChangeHandler);
            console.log("Bound change handler to the dropdown.");

        } catch (error) {
            console.error('Error during initialization:', error);
            alert('An error occurred while initializing the search widgets. Please try again.');
        }
    }

    populateLineDropdown() {
        try {
            console.log("Attempting to populate dropdown with line options...");
            // const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            // proxy.url = "http://localhost:8081/getLineOptions";
            const host = new LoadTimeChartDetails();
                    var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
                    proxy.url = host.url + "getLineOptions"; // Backend service URL
            proxy.method = "GET"; 
            proxy.contentType = "application/json; charset=utf-8";
            proxy.timeout = 20000;
            proxy.keepAlive = false;

            const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

            callback.onSuccess = (responseData) => {
                try {
                    console.log('API Response:', responseData); 
                    const data = JSON.parse(responseData);

                    if (Array.isArray(data)) {
                        if (typeof this.ddLine.clearOptions === 'function') {
                            this.ddLine.clearOptions();
                            console.log('Cleared existing dropdown options.');
                        } else if (typeof this.ddLine.clear === 'function') {
                            this.ddLine.clear();
                            console.log('Cleared dropdown using alternative clear method.');
                        }

                        this.ddLine.addItem('Select', '');

                        data.forEach((option, index) => {
                            console.log(`Adding item to dropdown: ${option.code} with ID ${option.id}`);
                            this.ddLine.addItem(option.code, option.id.toString());
                        });

                        if (data.length > 0) {
                            this.ddLine.setSelectedIndex(0); 
                        }

                        console.log("Dropdown populated with line options:", data.length);
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
            console.log("Selected line ID:", selectedValue);

            if (selectedValue) {
                this.selectedLineID = parseInt(selectedValue, 10); 
                recordData.line = this.selectedLineID; 
                console.log("selectedLineID set to:", this.selectedLineID);
                console.log("Updated recordData:", recordData);


                this.fetchShiftDetails(this.selectedLineID);
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
            
            // const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            // proxy.url = "http://localhost:8081/getShiftDetails"; 
            const host = new LoadTimeChartDetails();
                    var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
                    proxy.url = host.url + "getShiftDetails"; // Backend service URL
            proxy.method = "POST"; 
            proxy.contentType = "application/json; charset=utf-8";
            proxy.timeout = 20000;
            proxy.keepAlive = false;
            proxy.payLoad = JSON.stringify({ lineId: lineId });
    
            const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
            callback.onSuccess = (responseData) => {
                try {
                    console.log('Shift Details API Response:', responseData);
                    const data = JSON.parse(responseData);
    

                    this.shiftDetails = data;

                    this.currentDate = data.currentDate || this.currentDate;
                    this.currentTime = data.currentTime || this.currentTime;
                    this.currentShift = data.shift || this.currentShift;
    
                    console.log('Shift details updated:', this.shiftDetails);
                } catch (error) {
                    console.error('Error parsing shift details response:', error);
                }
            };
    
            callback.onFailure = (errorDescription) => {
                console.error('Error fetching shift details:', errorDescription);
                alert('An error occurred while fetching shift details. Please try again.');
            };
    
            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        } catch (error) {
            console.error('Error during shift details fetch:', error);
            alert('An error occurred while fetching shift details. Please try again.');
        }
    }



    setRecordData(recordData) {
        super.setRecordData(recordData);
        console.log("setRecordData called with:", recordData);
    
        if (recordData.line) {
            console.log("Setting dropdown value to:", recordData.line);
            this.ddLine.selectValue(recordData.line);
        } else {
            console.log('No line value provided in recordData.');
        }
    

        if (recordData.currentDate) {
            this.currentDate = recordData.currentDate;
            console.log("Setting currentDate to:", recordData.currentDate);
        }
    
        if (recordData.currentTime) {
            this.currentTime = recordData.currentTime;
            console.log("Setting currentTime to:", recordData.currentTime);
        }
    
        if (recordData.shift) {
            this.currentShift = recordData.shift;
            console.log("Setting shift to:", recordData.shift);
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
        
        console.log('Record data fetched in getRecordData:', jsonObject);
        return jsonObject;
    }
    
    onSearchClick() {
        let instance = this;
        console.log("onSearchClick called.");
    

        if (!this.validate()) {
            alert('Please select an option from the dropdown before proceeding.');
            return;
        }

        const currentData = instance.getRecordData();
        console.log('Data on Search Click:', currentData);
    

        alert('ProductionCurrentShiftHeaderSearchWidgetsList: ' + currentData);
    }
    

    validate() {
        if (this.ddLine.getSelectedIndex() === 0 || this.ddLine.getValueAtIndex(this.ddLine.getSelectedIndex()) === '') {
            console.log("Validation failed: No valid selection.");
            return false;
        } else {
            console.log("Validation passed.");
            return true;
        }
    }
}














