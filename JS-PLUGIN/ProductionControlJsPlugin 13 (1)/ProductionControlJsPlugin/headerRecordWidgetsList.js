
class ProductionCurrentShiftHeaderRecordWidgetsList extends palms.exported.framework.ActionWidgetsList {
    constructor(recordData, instance) {
        super(recordData);
        this.dtCurrentDate = new palms.exported.framework.selfValidatingControls.FromDateControl(false);
        this.tmCurrentTime = new palms.exported.framework.selfValidatingControls.SelfValidatingTimeControl();
        this.txtShift = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.txtLine = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.txtShiftGroup = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.instance = instance; // Store the entire instance for later use
        this.userLoggedInId =  null;

        this.setRecordData(super.getRecordData());
    }

    initialize() {
        super.initialize();

        const host = new ProductionHostDetails();

        super.addSelfValidatingControl("Current Date", this.dtCurrentDate, true);
        super.addSelfValidatingControl("Current Time", this.tmCurrentTime, true);
        super.addSelfValidatingControl("Line", this.txtLine, true);
        super.addSelfValidatingControl("Shift", this.txtShift, true);
        super.addSelfValidatingControl("Shift Group", this.txtShiftGroup, true);

        this.userLoggedInId = palms.exported.framework.PalmsUIApplication.getLoggedInUserID();

        this.dtCurrentDate.setEnabled(false);
        this.tmCurrentTime.setEnabled(false);
        this.txtShift.setEnabled(false);
        this.txtLine.setEnabled(false);
        this.txtShiftGroup.setEnabled(false);

        const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
        buttonControl.setText("Refresh");

        // Update the onClick event to call the getShiftDetails API and then loadData method
        buttonControl.onClick = () => {
            if (this.instance) {
                let lineID = null;
                let shiftType = '';
        
                // Determine whether to use currentShift or nextShift
                if (this.instance.currentShift) {
                    lineID = this.instance.currentShift.lineID;
                    shiftType = 'currentShift';
                } else if (this.instance.nextShift) {
                    lineID = this.instance.nextShift.lineID;
                    shiftType = 'nextShift';
                } else if(this.instance.nextShiftQueue){
                    lineID = this.instance.nextShiftQueue.lineID;
                    shiftType = 'nextShiftQueue';
                }
        
                if (lineID) {
                    this.refreshShiftDetails(lineID, shiftType);
                } else {
                    console.error("Line ID is not available in the shift instance.");
                    alert("Line ID is not available in the shift instance.");
                }
            } else {
                console.error("Instance is not available.");
                alert("Instance is not available.");
            }
        };

        super.addSelfValidatingControl("Button Control", buttonControl, true);
    }

    refreshShiftDetails(lineID, shiftType) {
        const host = new ProductionHostDetails();
        const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
        //proxy.url = "http://localhost:8081/getShiftDetails"; // Backend service URL
        proxy.url = host.url + "getShiftDetails";
        proxy.payLoad = JSON.stringify({ lineId: lineID }); // Data payload to be sent
        proxy.method = "POST"; // HTTP method
        proxy.contentType = "application/json; charset=utf-8"; // Content type
        proxy.timeout = 20000; // Request timeout in milliseconds
        proxy.keepAlive = false; // Keep-alive setting
    
        const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
        // On success, call loadData with updated details
        callback.onSuccess = function(responseData) {
            const shiftDetails = JSON.parse(responseData);
            shiftDetails.user = this.userLoggedInId;
    
            if (shiftType === 'currentShift' && this.instance.currentShift && typeof this.instance.loadData === 'function') {
                const updatedFilter = { header: shiftDetails }; // Use the response inside 'header'
                console.log("Updated Filter",updatedFilter);
                this.instance.loadData(JSON.stringify(updatedFilter)); // Refresh the screen with new data
            } else if (shiftType === 'nextShift' && this.instance.nextShift && typeof this.instance.loadData === 'function') {
                const updatedFilter = { header: shiftDetails }; // Use the response inside 'header'
                this.instance.loadData(JSON.stringify(updatedFilter)); // Refresh the screen with new data
            } else if(shiftType === 'nextShiftQueue' && this.instance.nextShiftQueue && typeof this.instance.loadData === 'function'){
                const updatedFilter = { header: shiftDetails }; // Use the response inside 'header'
                this.instance.loadData(JSON.stringify(updatedFilter));
            }
            else {
                console.error('Instance or loadData method not found');
                alert('Failed to refresh the screen. Instance or loadData method not found.');
            }
        }.bind(this); // Ensure correct context binding
    
        // On failure, log the error and alert the user
        callback.onFailure = function(errorDescription) {
            console.error("Error fetching updated shift details:", errorDescription);
            alert("Failed to fetch updated shift details. Please try again.");
        };
    
        // Invoke the web service with the configured proxy and callback
        palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
    }
    
    setRecordData(recordData) {
        super.setRecordData(recordData);
        var currentDate = new Date(recordData.currentDate);
        this.dtCurrentDate.setDateValue("/Date(" + +currentDate + ")/");
        this.tmCurrentTime.setTime(recordData.currentTime);
        this.txtShift.setText(recordData.shift);
        this.txtLine.setText(recordData.line);
        this.txtShiftGroup.setText(recordData.shiftGroup);
        var style = this.txtShiftGroup.getTextBoxStyle();
        if (style) style.backgroundColor = recordData.shiftCellColor;
    }
}





