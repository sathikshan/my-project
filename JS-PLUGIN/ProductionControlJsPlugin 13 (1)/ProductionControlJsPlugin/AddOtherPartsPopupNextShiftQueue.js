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
 
class AddOtherPartsPopupNextShiftQueue extends palms.exported.framework.StickyNote {
    constructor(instance) {
        super(
            palms.exported.framework.PalmsUIApplication.getMainPanel(),
            "Add Other Parts",
            new palms.exported.gwt.user.client.ui.VerticalPanel(),
            "600px",
            "100px"
        );
 
        this.instance = instance;
        this.dieSet = '';
        this.dieStorageBay = '';
        this.lotSize = '';  // Initialize lotSize property
        this.userLoggedInId = null;
 
        this.grid = new palms.exported.framework.grid.Grid(null, OtherPartsEntity);
        this.combinedDropDown = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown();
        this.combinedDropDown.addStyleName('custom-dropdown');
 
        // Create SelfValidatingTextBox for lotSize
        this.lotSizeTextBox = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.lotSizeTextBox.setText('');  

        this.remarksTextBox = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.remarksTextBox.setText('');
 
    }
 
    initialize() {
        super.initialize();
        super.addStyleName('Popup');

        this.userLoggedInId = palms.exported.framework.PalmsUIApplication.getLoggedInUserID();
        
        const mainPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
        mainPanel.setSpacing(10);
        mainPanel.setWidth("100%");
   
        // Horizontal panel to place dropdown and textbox side by side
        const inputPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
        inputPanel.setSpacing(10);  // Add some space between the elements
   
        // Vertical panel for dropdown (label above the dropdown)
        const dropdownPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
        dropdownPanel.setSpacing(5);
   
        // Label for the Die Set - Die Storage Bay dropdown
        const combinedLabel = new palms.exported.gwt.user.client.ui.Label();
        combinedLabel.setText('Die Set - Die Storage Bay');
        combinedLabel.setStyleName('large-text-label');
        dropdownPanel.add(combinedLabel.asWidget());
        dropdownPanel.add(this.combinedDropDown);
       
   
        // Vertical panel for Lot Cycle (label above the textbox)
        const lotSizePanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
        lotSizePanel.setSpacing(5);
   
        // Lot Cycle TextBox Label
        const lotSizeLabel = new palms.exported.gwt.user.client.ui.Label();
        lotSizeLabel.setText('Lot Size');
        lotSizeLabel.setStyleName('large-text-label');
        lotSizePanel.add(lotSizeLabel.asWidget());
        lotSizePanel.add(this.lotSizeTextBox);  // Add the textbox below the label

        const remarksPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
        remarksPanel.setSpacing(5);

        const remarksLable = new palms.exported.gwt.user.client.ui.Label();
        remarksLable.setText('Remarks');
        remarksLable.setStyleName('large-text-label');
        remarksPanel.add(remarksLable.asWidget());
        remarksPanel.add(this.remarksTextBox);

        const remarksStyle = this.remarksTextBox.getTextBoxStyle();
        if(remarksStyle) {
            remarksStyle.backgroundColor = 'whitesmoke';
            remarksStyle.borderColor = '#7f561c';
        }
 
        const lotSizeStyle = this.lotSizeTextBox.getTextBoxStyle();
        if (lotSizeStyle) {
            lotSizeStyle.backgroundColor = 'whitesmoke';
            lotSizeStyle.borderColor = '#7f561c';
        }
 
   
        // Add both dropdownPanel and lotSizePanel to the horizontal inputPanel
        inputPanel.add(dropdownPanel);
        inputPanel.add(lotSizePanel);
        inputPanel.add(remarksPanel);
   
        // Add the horizontal input panel to the main panel
        mainPanel.add(inputPanel);
   
        // Grid
        mainPanel.add(this.grid.asWidget());
        mainPanel.setCellWidth(this.grid.asWidget(), '100%');
        mainPanel.setCellHeight(this.grid.asWidget(), '100%');
   
        this.grid.removeAll();
        this.grid.initialize();
        this.grid.setDefaultCellValue('NA');
        this.grid.renderGrid();
   
        // Add to Plan Button
        const buttonPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
        buttonPanel.setWidth("100%");
   
        const AddtoPlanButton = new palms.client.framework.selfValidatingControls.ButtonControl();
        AddtoPlanButton.setSize('auto', 'auto');
        AddtoPlanButton.setText('Add to Plan');
   
        AddtoPlanButton.onClick = () => {
            this.handleAddToPlan();
        };
   
        buttonPanel.add(AddtoPlanButton.asWidget());
        buttonPanel.setCellHorizontalAlignment(AddtoPlanButton.asWidget(), HorizontalAlignment.ALIGN_RIGHT);
   
        mainPanel.add(buttonPanel);
        mainPanel.setCellHeight(buttonPanel, '36px');
   
        super.getContainer().add(mainPanel);
   
        this.setupEventHandlers();
    }
   
    handleAddToPlan() {
 
        const lotSizeValue = parseInt(this.lotSizeTextBox.getText(), 10);
        const remarks = this.remarksTextBox.getText();
        
        // Check if Die Set and Die Storage Bay are selected
        const isDieSetSelected = !!this.dieSet && !!this.dieStorageBay;
        // Check if Lot Size is valid (greater than zero)
        const isLotSizeValid = !isNaN(lotSizeValue) && lotSizeValue > 0;
        // Check if Remarks are entered
        const isRemarksEntered = !!remarks;
        
        // Validation conditions
        if (!isDieSetSelected && !isLotSizeValid && !isRemarksEntered) {
            alert("Please select a Die Set from the dropdown, enter a valid Lot Size greater than zero, and enter Remarks.");
            return;
        }
        
        if (!isDieSetSelected && !isLotSizeValid) {
            alert("Please select a Die Set from the dropdown and enter a valid Lot Size greater than zero.");
            return;
        }
        
        if (!isDieSetSelected && !isRemarksEntered) {
            alert("Please select a Die Set from the dropdown and enter valid Remarks.");
            return;
        }
        if (!isDieSetSelected && isLotSizeValid && isRemarksEntered) {
            alert("Please select a Die Set from the dropdown before adding to the plan.");
            return;
        }
        
        if (!isLotSizeValid && !isRemarksEntered) {
            alert("Please enter a valid Lot Size greater than zero and Remarks.");
            return;
        }
        
        if (!isDieSetSelected) {
            alert("Please select a Die Set from the dropdown before adding to plan.");
            return;
        }
        
        if (!isLotSizeValid) {
            alert("Please enter a valid Lot Size greater than zero.");
            return;
        }
        
        if (!isRemarksEntered) {
            alert("Please enter valid Remarks.");
            return;
        }
 
        if (this.dieSet && this.dieStorageBay) {
            const dataToSave = {
                dieSet: this.dieSet,
                date: this.instance.nextShiftQueue.currentDate,
                shift: this.instance.nextShiftQueue.shift,
                line: this.instance.nextShiftQueue.line,
                lotSize: lotSizeValue,
                remarks: remarks,  
                user: this.userLoggedInId  
            };
            const host = new ProductionHostDetails();
 
            const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            //proxy.url = "http://localhost:8081/addOtherParts";
            proxy.url = host.url + "nextShiftQueueAddOtherParts";
            proxy.payLoad = JSON.stringify(dataToSave);
            proxy.method = "POST";
            proxy.contentType = "application/json; charset=utf-8";
            proxy.timeout = 20000;
            proxy.keepAlive = false;
 
            const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
 
            callback.onSuccess = function(responseData) {
                //console.log('response from add other parts',responseData);
                alert(responseData);
                this.hide();
                this.updateShiftDetailsAndRefresh();
            }.bind(this);
 
            callback.onFailure = function(errorDescription) {
                console.error("Error adding other parts:", errorDescription);
                alert("Failed to add other parts. Please try again.");
            };
 
            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        } else {
            alert("Please select a Die Set from the dropdown before adding to plan.");
        }
    }
 
    updateShiftDetailsAndRefresh() {
   
        const dataToSave = {
            lineId: this.instance.nextShiftQueue.lineID // Access currentShift from instance
        };
        const host = new ProductionHostDetails();
   
        // Set up the web service proxy for the API call
        const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
        //proxy.url = "http://localhost:8081/getShiftDetails"; 
        proxy.url = host.url + "nextShiftQueueGetShiftDetails"
        proxy.payLoad = JSON.stringify(dataToSave); // Data payload to be sent
        proxy.method = "POST"; // HTTP method
        proxy.contentType = "application/json; charset=utf-8"; // Content type
        proxy.timeout = 20000; // Request timeout in milliseconds
        proxy.keepAlive = false; // Keep-alive setting
   
        const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
   
        // On success, handle the response and call loadData with the updated format
        callback.onSuccess = function(responseData) {
            const shiftDetails = JSON.parse(responseData); // Parse the response
            shiftDetails.user =  this.userLoggedInId;
   
            // Prepare the updatedFilter in the required format
            const updatedFilter = {
                header: shiftDetails // Wrap shift details in a header object
            };
   
            // Call loadData method on the currentShift instance
            if (this.instance && typeof this.instance.loadData === 'function') {
                this.instance.loadData(JSON.stringify(updatedFilter)); // Pass the updatedFilter as a string
            } else {
                console.error('Current shift instance or loadData method not found');
                alert('Failed to refresh the screen. Current shift instance or loadData method not found.');
            }
        }.bind(this); // Ensure correct context for this
   
        // On failure, log the error and alert the user
        callback.onFailure = function(errorDescription) {
            console.error('Error fetching updated shift details:', errorDescription);
            alert("An error occurred while fetching updated shift details. Please check the console for more information.");
        };
   
        // Invoke the web service with the configured proxy and callback
        palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
    }
   
    setupEventHandlers() {
        this.combinedDropDown.addChangeHandler({
            onChange: (event) => {
                const selectedIndex = this.combinedDropDown.getSelectedIndex();
                
                if (selectedIndex >= 0) {
                    const selectedValue = this.combinedDropDown.getItemText(selectedIndex);
                    
                    if (selectedValue && selectedValue.trim() !== '') {
                        const [dieSet, dieStorageBay] = selectedValue.split(' - ');
                        this.dieSet = dieSet.trim();
                        this.dieStorageBay = dieStorageBay.trim();
                        
                    } else {
                        window.alert("Please select a Die Set from the dropdown.");
                    }
                } else {
                    console.warn("No valid item selected from dropdown.");
                }
            }
        });
    }
 
    setRecords(otherParts) {
        try {
            
            const records = Array.isArray(otherParts) ? otherParts : [otherParts];
           
            this.grid.removeAll();
            this.grid.initialize();
            this.grid.addRecords(records);
            this.grid.renderGrid();
   
            this.combinedDropDown.clear();
           
            records.forEach(part => {
                const combinedValue = `${part.dieSet} - ${part.dieStorageBay}`;
               
                this.combinedDropDown.addItem(combinedValue);
            });
           
        } catch (error) {
            console.error("Error setting records:", error);
        }
    }
}
 
// Call addCustomStyles to ensure the custom styles are applied
addCustomStyles();