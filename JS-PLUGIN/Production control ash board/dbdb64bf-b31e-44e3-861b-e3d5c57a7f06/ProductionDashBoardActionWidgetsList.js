class ProductionDashBoardActionWidgetsList extends palms.exported.framework.ActionWidgetsList {
    constructor(recordData, instance) {
        super(recordData);
        this.dtCurrentDate = new palms.exported.framework.selfValidatingControls.FromDateControl(false);
        this.tmCurrentTime = new palms.exported.framework.selfValidatingControls.SelfValidatingTimeControl();
        this.txtShift = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.txtLine = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.txtShiftGroup = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
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
            super.addSelfValidatingControl("Shift Group", this.txtShiftGroup, true);

            this.txtShift.setEnabled(false);
            this.txtLine.setEnabled(false);
            this.txtShiftGroup.setEnabled(false);

            const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
            buttonControl.setText("Refresh");

            buttonControl.onClick = () => {
                console.log("Manual refresh button clicked.");
                this.instance.refreshShiftDetails();
            };
            super.addSelfValidatingControl("Manual Refresh Button", buttonControl, true);




        } catch (error) {
            console.error("Error in initialize method:", error);
        }
    }

    
    updateCurrentTime(currentTime) {
        this.tmCurrentTime.setTime(currentTime);
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
        if (style) style.backgroundColor = recordData.shiftGroup;
    }
}

 
   





