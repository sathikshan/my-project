
class RecommendationPopup extends palms.exported.framework.StickyNote {
    constructor(tab) {
        super(palms.exported.framework.PalmsUIApplication.getMainPanel(), "Recommendation Calculations",
                    new palms.exported.gwt.user.client.ui.VerticalPanel(), "600px", "auto");
        this.tab = tab;
        this.recommendationGrid = this.getRecommendationGrid();
    }
   
    initialize() {
        super.initialize();
        super.addStyleName('Popuup');
       
        super.getContainer().add(this.recommendationGrid.asWidget());
        super.getContainer().setCellWidth(this.recommendationGrid.asWidget(), '100%');
        super.getContainer().setCellHeight(this.recommendationGrid.asWidget(), '100%');
        this.recommendationGrid.removeAll();
        this.recommendationGrid.initialize();
       // this.partsStockGrid.addStyleName('PartsStockGrid');
        this.recommendationGrid.setDefaultCellValue('NA');
        this.recommendationGrid.renderGrid();
       
        const hPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
        hPanel.setWidth("100%");
        super.getContainer().add(hPanel.asWidget());
        super.getContainer().setCellWidth(hPanel.asWidget(), '100%');
        super.getContainer().setCellHeight(hPanel.asWidget(), '100%');
       
       
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
    }
   
    getRecommendationGrid() {
        let recommendationGrid = new palms.exported.framework.grid.Grid(null, RecommendationCalculationsEntity);
       
        recommendationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('material', 'Material', false, ColumnType.ReadOnlyInteger, true));
        recommendationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('kanbansInCirculation', 'Kanbans In Circulation', false, ColumnType.ReadOnlyString, true));
        recommendationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('onOrder', 'On Order', false, ColumnType.ReadOnlyInteger, true));
        recommendationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('stock', 'Stock', false, ColumnType.ReadOnlyInteger, true));
        recommendationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('kanbansReturned', 'Kanbans Returned', false, ColumnType.ReadOnlyInteger, true));
        recommendationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('recOrder', 'Rec Qty', false, ColumnType.ReadOnlyString, true));
        if(this.tab === "ordered"){
            recommendationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('adjustment', 'Adjustment', false, ColumnType.ReadOnlyInteger, true));
        recommendationGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('ordered', 'Ordered Qty', false, ColumnType.ReadOnlyString, true));
        }
       
        recommendationGrid.getStyle().paddingBottom = "10px";
       
        return recommendationGrid;
    }

   
    setRecords(recomm) {
        this.recommendationGrid.removeAll();
        if(recomm != null) this.recommendationGrid.addRecords(recomm);
        this.recommendationGrid.renderGrid();
       
    }
}