

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
 
class RecQtyPopup extends palms.exported.framework.StickyNote {
    constructor(instance) {
        super(
            palms.exported.framework.PalmsUIApplication.getMainPanel(),
            "Recommended Quantity",
            new palms.exported.gwt.user.client.ui.VerticalPanel(),
            "400px",
            "100px"
        );
 
        this.instance = instance;
        this.dieSet = '';
        this.dieStorageBay = '';
        this.lotSize = '';  // Initialize lotSize property
 
        this.grid = new palms.exported.framework.grid.Grid(null, OtherMaterialEntity);
        this.combinedDropDown = new palms.exported.framework.selfValidatingControls.SelfValidatingDropDown();
        this.combinedDropDown.addStyleName('custom-dropdown');
 
        // Create SelfValidatingTextBox for lotSize
        this.lotSizeTextBox = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.lotSizeTextBox.setText('');  // Initialize with empty value
 
    }
 
    initialize() {
        super.initialize();
        super.addStyleName('Popup');
   
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
 
        const lotSizeStyle = this.lotSizeTextBox.getTextBoxStyle();
        if (lotSizeStyle) {
            lotSizeStyle.backgroundColor = 'whitesmoke';
            lotSizeStyle.borderColor = '#7f561c';
        }
 
   
        // Add both dropdownPanel and lotSizePanel to the horizontal inputPanel
        inputPanel.add(dropdownPanel);
        inputPanel.add(lotSizePanel);
   
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
 
        // Validate lotSize input (greater than zero)
        const lotSizeValue = parseInt(this.lotSizeTextBox.getText(), 10);
        if (isNaN(lotSizeValue) || lotSizeValue <= 0) {
            alert("Please enter a valid Lot Cycle value greater than zero.");
            return;  // Stop further execution if invalid
        }
 
        if (this.dieSet && this.dieStorageBay) {
            const dataToSave = {
                dieSet: this.dieSet,
                date: this.instance.currentShift.currentDate,
                shift: this.instance.currentShift.shift,
                line: this.instance.currentShift.line,
                lotSize: lotSizeValue,  
            };
            const host = new MaterialHostDetails();
            const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            proxy.url = host.url + "addOtherParts";
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