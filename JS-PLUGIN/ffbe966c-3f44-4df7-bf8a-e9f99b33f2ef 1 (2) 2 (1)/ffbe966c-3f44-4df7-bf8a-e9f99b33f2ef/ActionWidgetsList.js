
class PartOrderActionHeaderWidgets extends palms.exported.framework.ActionWidgetsList {
    constructor(recordData) {
        super(recordData);
        this.dtDate = new palms.exported.framework.selfValidatingControls.ToDateControl(false);
        this.txtShift = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.txtLine = new palms.exported.framework.selfValidatingControls.SelfValidatingTextBox();
        this.instance = '';

        this.setRecordData(super.getRecordData());
    }

    initialize() {
        try {
            super.initialize();
            let widgetGroup = new palms.exported.framework.WidgetGroup('');
            widgetGroup.setShowHeader(false);

            super.addSelfValidatingControl("Current Date", this.dtDate, true, widgetGroup);
            super.addSelfValidatingControl("Line", this.txtLine, true, widgetGroup);
            super.addSelfValidatingControl("Shift", this.txtShift, true, widgetGroup);

            // Create the download button
            const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
            buttonControl.setText("Download");

            // Add the download button to the UI
            super.addSelfValidatingControl("Download", buttonControl, true);

            // Button click handler
            buttonControl.onClick = () => {
                this.onDownloadClick();
            };

            // Disable the fields
            this.dtDate.setEnabled(false);
            this.txtLine.setEnabled(false);
            this.txtShift.setEnabled(false);
        } catch (error) {
            console.error("Error in initialize method:", error);
        }
    }



    onDownloadClick() {
        try {
            const rawDate = this.dtDate.getDateValue(); // e.g., "/Date(1750617000000)/"
            const timestamp = parseInt(rawDate.match(/\d+/)[0], 10);
            const dateObj = new Date(timestamp);

            const line = this.txtLine.getText();
            const shift = this.txtShift.getText();

            const gridRecords = this.instance?.grid?.getRecords();
            if (!gridRecords || gridRecords.length === 0) {
                alert("Grid data is not available to export.");
                return;
            }

            // Format using local time
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            const fileName = `PartOrderCSV_${formattedDate}_Line${line}_Shift${shift}`;

            this.instance.grid.DownloadCSV(fileName);

            alert(`Downloaded successfully for ${formattedDate} / Line: ${line} / Shift: ${shift}`);
        } catch (error) {
            console.error("Unexpected error:", error);
            alert("An unexpected error occurred.");
        }
    }





    setRecordData(recordData, instance) {
        super.setRecordData(recordData);
        this.instance = instance;

        const date = new Date(recordData.date);
        const timestamp = date.getTime(); // milliseconds since epoch
        this.dtDate.setDateValue(`/Date(${timestamp})/`); // Pass string instead of Date object

        this.txtShift.setText(recordData.shift);
        this.txtLine.setText(recordData.line);
    }

}

