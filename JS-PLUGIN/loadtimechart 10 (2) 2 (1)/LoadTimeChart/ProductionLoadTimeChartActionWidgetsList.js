// class ProductionLoadTimeChartActionWidgetsList extends palms.exported.framework.ActionWidgetsList {
//     constructor(recordData) {
//         super(recordData);
//         this.dtCurrentDate = new palms.exported.framework.selfValidatingControls.FromDateControl(false);
//         this.tmCurrentTime = new palms.exported.framework.selfValidatingControls.SelfValidatingTimeControl();
//         this.txtLine = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
//         this.txtShift = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
       

// 		this.setRecordData(super.getRecordData());
//     }

//     initialize() {
//         super.initialize();
// 		// let widgetGroup = new palms.exported.framework.WidgetGroup('');
// 		// widgetGroup.setShowHeader(false);
		
//         super.addSelfValidatingControl("Current Date", this.dtCurrentDate, true);
//         super.addSelfValidatingControl("Current Time", this.tmCurrentTime, true);
//         super.addSelfValidatingControl("Line", this.txtLine, true); 
//         super.addSelfValidatingControl("Shift", this.txtShift, true);
        
//     }

//     setRecordData(recordData) {
//         super.setRecordData(recordData);
        
//         var currentDate = new Date(recordData.currentDate);
//         this.dtCurrentDate.setDateValue("/Date(" + +currentDate + ")/");
//         this.tmCurrentTime.setTime(recordData.currentTime);
//         this.txtShift.setText(recordData.shift);
//         this.txtLine.setText(recordData.line);
//     }
// }

class ProductionLoadTimeChartActionWidgetsList extends palms.exported.framework.ActionWidgetsList {
    constructor(recordData, instance) {
        super(recordData);
        this.dtCurrentDate = new palms.exported.framework.selfValidatingControls.FromDateControl(false);
        this.tmCurrentTime = new palms.exported.framework.selfValidatingControls.SelfValidatingTimeControl();
        this.txtLine = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.txtShift = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.instance = instance;
        this.setRecordData(super.getRecordData());
        this.autoRefreshInterval = null;
    }
    

    initialize() {
        try {
            super.initialize();
            super.addSelfValidatingControl("Current Date", this.dtCurrentDate, true);
            super.addSelfValidatingControl("Current Time", this.tmCurrentTime, true);
            super.addSelfValidatingControl("Line", this.txtLine, true);
            super.addSelfValidatingControl("Shift", this.txtShift, true);

            this.dtCurrentDate.setEnabled(false);
            this.tmCurrentTime.setEnabled(false);
            this.txtLine.setEnabled(false);
            this.txtShift.setEnabled(false);
            

            // const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
            // buttonControl.setText("Manual Refresh");
            // buttonControl.onClick = () => {
            //     console.log("Manual refresh button clicked.");
            //     this.manualRefresh();
            // };

            //super.addSelfValidatingControl("Manual Refresh Button", buttonControl, true);

            this.startAutoRefresh();
        } catch (error) {
            console.error("Error in initialize:", error);
        }
    }

    updateCurrentTime(currentTime) {
        this.tmCurrentTime.setTime(currentTime);
    }

    // manualRefresh() {
    //     if (this.instance && this.instance.loadtime && this.instance.loadtime.lineID) {
    //         console.log("Manual refresh triggered with lineID:", this.instance.loadtime.lineID);
    //         this.instance.refreshShiftDetails();
    //     } else {
    //         console.error("LineID not available for refresh");
    //     }
    // }

    startAutoRefresh() {
        if (!this.autoRefreshInterval) {
            this.autoRefreshInterval = setInterval(() => {
                console.log("Auto-refresh triggered in widgets list");
                //this.manualRefresh();
            }, 10000);
        }
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    setRecordData(recordData) {
        super.setRecordData(recordData);

        var currentDate = new Date(recordData.currentDate);
        this.dtCurrentDate.setDateValue("/Date(" + +currentDate + ")/");
        this.tmCurrentTime.setTime(recordData.currentTime);
        this.txtShift.setText(recordData.shift);
        this.txtLine.setText(recordData.line);
    }
}




