class ProductionCurrentShiftHeaderRecordWidgetsList extends palms.exported.framework.ActionWidgetsList {
    constructor(recordData) {
        super(recordData);
        this.dtCurrentDate = new palms.exported.framework.selfValidatingControls.FromDateControl(false);
        this.tmCurrentTime = new palms.exported.framework.selfValidatingControls.SelfValidatingTimeControl();
        this.txtShift = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.txtLine = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.txtShiftGroup = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.txtLineID = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        
		this.setRecordData(super.getRecordData());
    }

    initialize() {
        super.initialize();
		
        super.addSelfValidatingControl("Current Date", this.dtCurrentDate, true);
        super.addSelfValidatingControl("Current Time", this.tmCurrentTime, true);
        super.addSelfValidatingControl("Line", this.txtLine, true);
        super.addSelfValidatingControl("Shift", this.txtShift, true);
        super.addSelfValidatingControl("Shift Group", this.txtShiftGroup, true);
        super.addSelfValidatingControl("Line ID",this.txtLineID, false);        
    }

    setRecordData(recordData) {
        super.setRecordData(recordData);
        var currentDate = new Date(recordData.currentDate);
        this.dtCurrentDate.setDateValue("/Date(" + +currentDate + ")/");
        this.tmCurrentTime.setTime(recordData.currentTime);
        this.txtShift.setText(recordData.shift);
        this.txtLine.setText(recordData.line);
        this.txtShiftGroup.setText(recordData.shiftGroup);
        this.txtLineID.setText(recordData.lineID);
        var style = this.txtShiftGroup.getTextBoxStyle();
        if(style) style.backgroundColor = recordData.shiftGroup;
    }
}