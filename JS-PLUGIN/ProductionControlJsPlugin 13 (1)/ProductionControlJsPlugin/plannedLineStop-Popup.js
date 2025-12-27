
class PlannedLineStopPopup extends palms.exported.framework.StickyNote {
    constructor() {
        try {
            super(palms.exported.framework.PalmsUIApplication.getMainPanel(), "Load Time Calculation",
                    new palms.exported.gwt.user.client.ui.VerticalPanel(), "600px", "auto");
 
            // Initialize grids
            this.LoadTimeCalculationGrid = this.getloadTimeCalculationGrid();
            this.PlannedlineStopGrid = this.getplannedlineStopGrid();
 
            this.hPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
       
        } catch (error) {
            console.error("Error initializing PlannedLineStopPopup constructor: ", error);
        }
    }
 
    initialize() {
        try {
            super.initialize();
            super.addStyleName('Popuup');
 
            // Load Time Calculation Grid Setup
            if (this.LoadTimeCalculationGrid) {
                super.getContainer().add(this.LoadTimeCalculationGrid.asWidget());
                super.getContainer().setCellWidth(this.LoadTimeCalculationGrid.asWidget(), '100%');
                super.getContainer().setCellHeight(this.LoadTimeCalculationGrid.asWidget(), '100%');
                this.LoadTimeCalculationGrid.removeAll();
                this.LoadTimeCalculationGrid.initialize();
                this.LoadTimeCalculationGrid.addStyleName('LoadTimeCalculation');
                this.LoadTimeCalculationGrid.setDefaultCellValue('NA');
                this.LoadTimeCalculationGrid.renderGrid();
            }

            // Horizontal Panel Setup
            try {
                // const hPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
                this.hPanel.setWidth("100%");
                super.getContainer().add(this.hPanel.asWidget());
                super.getContainer().setCellWidth(this.hPanel.asWidget(), '100%');
                super.getContainer().setCellHeight(this.hPanel.asWidget(), '100%');
            } 
            catch (error) {
            console.error("Error initializing Horizontal Panel: ", error);
            }
 
            // Planned Line Stop Grid Setup
            if (this.PlannedlineStopGrid) {
                this.hPanel.add(this.PlannedlineStopGrid.asWidget());
                this.hPanel.setCellWidth(this.PlannedlineStopGrid.asWidget(), '100%');
                this.hPanel.setCellHeight(this.PlannedlineStopGrid.asWidget(), '100%');
                this.PlannedlineStopGrid.removeAll();
                this.PlannedlineStopGrid.initialize();
                this.PlannedlineStopGrid.addStyleName('PlannedlineStopGrid');
                this.PlannedlineStopGrid.setDefaultCellValue('NA');
                this.PlannedlineStopGrid.renderGrid();
            }
 
            let instance = this;
            const okButton = new palms.client.framework.selfValidatingControls.ButtonControl();
            okButton.onClick = function() {
                instance.hide();
        }
            okButton.setSize('auto', 'auto');
            okButton.setText('OK');
            super.getContainer().add(okButton.asWidget());
            super.getContainer().setCellHeight(okButton.asWidget(), '36px');
            super.getContainer().setCellHorizontalAlignment(okButton.asWidget(), HorizontalAlignment.ALIGN_RIGHT);
            super.getContainer().setCellVerticalAlignment(okButton.asWidget(), VerticalAlignment.ALIGN_BOTTOM);
 
        } catch (error) {
            console.error("Error initializing UI components in PlannedLineStopPopup: ", error);
        }
    }
 
    getloadTimeCalculationGrid() {
        try {
            let LoadTimeCalculationGrid = new palms.exported.framework.grid.Grid("Load Time Calculation", LoadTimeEntity);
 
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('efficiency', 'Efficiency', false, ColumnType.ReadOnlyInteger, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('spm', 'SPM', false, ColumnType.ReadOnlyFloat, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('udTime', 'UD Time', false, ColumnType.ReadOnlyFloat, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('ctTime', 'CT Time', false, ColumnType.ReadOnlyFloat, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('qcTime', 'QC Time', false, ColumnType.ReadOnlyFloat, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('sdTime', 'SD Time', false, ColumnType.ReadOnlyFloat, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('mct', 'Mat Chng Ovr Time', false, ColumnType.ReadOnlyFloat, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('pct', 'Pal Chng Ovr Time', false, ColumnType.ReadOnlyFloat, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('lineProdTime', 'Line Prod. Time', false, ColumnType.ReadOnlyFloat, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('sdWaitTime', 'SD Wait Time', false, ColumnType.ReadOnlyFloat, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('sdLineProdTime', 'SD Line Prod. Time', false, ColumnType.ReadOnlyInteger, true));
            LoadTimeCalculationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('efficiencyPT', 'Efficiency PT', false, ColumnType.ReadOnlyInteger, true));
            
 
            return LoadTimeCalculationGrid;
        } catch (error) {
            console.error("Error creating Load Time Calculation Grid: ", error);
            return null;
        }
    }
 
    getplannedlineStopGrid() {
        try {
            let PlannedlineStopGrid = new palms.exported.framework.grid.Grid("Planned Line Stop", PlannedLineStopEntity);
 
            PlannedlineStopGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('lineNo', 'Line No', false, ColumnType.ReadOnlyString, true));
            PlannedlineStopGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('shift', 'Shift', false, ColumnType.ReadOnlyString, true));
            PlannedlineStopGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('fromDateTime', 'From Date-Time', false, ColumnType.ReadOnlyString, true));
            PlannedlineStopGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('toDateTime', 'To Date-Time', false, ColumnType.ReadOnlyString, true));
            PlannedlineStopGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('remarks', 'Remarks/Reasons', false, ColumnType.ReadOnlyString, true));
 
            return PlannedlineStopGrid;
        } catch (error) {
            console.error("Error creating Planned Line Stop Grid: ", error);
            return null;
        }
    }
 
    setRecords(loadTimeCalculations, plannedLine) {
        this.LoadTimeCalculationGrid.removeAll();
        if(loadTimeCalculations != null) this.LoadTimeCalculationGrid.addRecords(loadTimeCalculations);
        this.LoadTimeCalculationGrid.renderGrid();
       
       
        try {
            if (this.hPanel) {  // Ensure hPanel is initialized
                this.hPanel.clear();
 
                if (plannedLine && plannedLine.length > 0) {
                    this.hPanel.add(this.PlannedlineStopGrid.asWidget());
                    this.PlannedlineStopGrid.addRecords(plannedLine);
                    this.PlannedlineStopGrid.renderGrid();
                }
                // If plannedLine is null or empty, the grid won't be added back to the hPanel, effectively hiding it
            } else {
                console.error("Error: hPanel is not initialized.");
            }
        } catch (error) {
            console.error("Error setting Planned Line Stop records: ", error);
        }  
       
    }
}