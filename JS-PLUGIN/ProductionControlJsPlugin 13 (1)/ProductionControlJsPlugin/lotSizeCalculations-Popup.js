
class LotSizeCalculationsPopup extends palms.exported.framework.StickyNote {
    constructor() {
        super(palms.exported.framework.PalmsUIApplication.getMainPanel(), "Lot Size Calculations",
                    new palms.exported.gwt.user.client.ui.VerticalPanel(), "600px", "auto");
                   
        this.partsStockGrid = this.getPartsStockGrid();
        this.materialStockGrid = this.getMaterialStockGrid();
        this.emptyPalletsGrid = this.getEmptyPalletsGrid();
    }
   
    initialize() {
        super.initialize();
        super.addStyleName('Popuup');
       
        super.getContainer().add(this.partsStockGrid.asWidget());
        super.getContainer().setCellWidth(this.partsStockGrid.asWidget(), '100%');
        super.getContainer().setCellHeight(this.partsStockGrid.asWidget(), '100%');
        this.partsStockGrid.removeAll();
        this.partsStockGrid.initialize();
        this.partsStockGrid.addStyleName('PartsStockGrid');
        this.partsStockGrid.setDefaultCellValue('NA');
        this.partsStockGrid.renderGrid();
       
        const hPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
        hPanel.setWidth("100%");
        super.getContainer().add(hPanel.asWidget());
        super.getContainer().setCellWidth(hPanel.asWidget(), '100%');
        super.getContainer().setCellHeight(hPanel.asWidget(), '100%');
       
        hPanel.add(this.materialStockGrid.asWidget());
        hPanel.setCellWidth(this.materialStockGrid.asWidget(), '50%');
        hPanel.setCellHeight(this.materialStockGrid.asWidget(), '100%');
        this.materialStockGrid.removeAll();
        this.materialStockGrid.initialize();
        this.materialStockGrid.addStyleName('MaterialStockGrid');
        this.materialStockGrid.setDefaultCellValue('NA');
        this.materialStockGrid.renderGrid();
       
        hPanel.add(this.emptyPalletsGrid.asWidget());
        hPanel.setCellWidth(this.emptyPalletsGrid.asWidget(), '50%');
        hPanel.setCellHeight(this.emptyPalletsGrid.asWidget(), '100%');
        this.emptyPalletsGrid.removeAll();
        this.emptyPalletsGrid.initialize();
        this.emptyPalletsGrid.addStyleName('EmptyPalletsGrid');
        this.emptyPalletsGrid.setDefaultCellValue('NA');
        this.emptyPalletsGrid.renderGrid();
       
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
   
    getPartsStockGrid() {
        let partsStockGrid = new palms.exported.framework.grid.Grid("Parts Stock", PartsStockEntity);
       
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('bomSeqNo', 'BOM Seq No.', false, ColumnType.ReadOnlyInteger, true));
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('childPart', 'Part', false, ColumnType.ReadOnlyString, true));
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('qpc', 'QPC', false, ColumnType.ReadOnlyInteger, true));
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('orderToLine', 'Order To Line', false, ColumnType.ReadOnlyInteger, true));
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('kbsInCirculation', 'KBs in Circulation', false, ColumnType.ReadOnlyInteger, true));
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('stock', 'Stock', false, ColumnType.ReadOnlyString, true));
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('kbsRtd', 'KBs Rtd', false, ColumnType.ReadOnlyString, true));
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('recKBs', 'Rec. KBs', false, ColumnType.ReadOnlyString, true));
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('adj', 'ADJ', false, ColumnType.ReadOnlyString, true));
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('planLotSize', 'Plan Lot Size', false, ColumnType.ReadOnlyString, true));
        partsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('onHold', 'On Hold', false, ColumnType.ReadOnlyInteger, true));
       
        // partsStockGrid.addRowSpanColumn('bomSeqNo');
        // partsStockGrid.addRowSpanColumn('adj');
        // partsStockGrid.addRowSpanColumn('planLotSize');
       
        partsStockGrid.getStyle().paddingBottom = "10px";
       
        return partsStockGrid;
    }
   
    getMaterialStockGrid() {
        let materialStockGrid = new palms.exported.framework.grid.Grid("Material Stock", MaterialStockEntity);
       
        materialStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('material', 'Material', false, ColumnType.ReadOnlyString, true));
        materialStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('skidQty', 'SKID Qty', false, ColumnType.ReadOnlyInteger, true));
        materialStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('onOrder', 'On Order', false, ColumnType.ReadOnlyInteger, true));
        materialStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('stock', 'Stock', false, ColumnType.ReadOnlyInteger, true));
        materialStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('onHold', 'On Hold', false, ColumnType.ReadOnlyString, true));
       
        return materialStockGrid;
    }
   
    getEmptyPalletsGrid() {
        let emptyPalletsGrid = new palms.exported.framework.grid.Grid("Empty Pallets", EmptyPalletsEntity);
       
        emptyPalletsGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('palletType', 'Pallet Type', false, ColumnType.ReadOnlyString, true));
        emptyPalletsGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('empty', 'Empty', false, ColumnType.ReadOnlyInteger, true));
        emptyPalletsGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('wip', 'WIP', false, ColumnType.ReadOnlyInteger, true));
        emptyPalletsGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('onHold', 'On Hold', false, ColumnType.ReadOnlyString, true));
       
        emptyPalletsGrid.getStyle().paddingLeft = "10px";
       
        return emptyPalletsGrid;
    }
   
    setRecords(partsStock, materialStock, emptyPallets) {
        this.partsStockGrid.removeAll();
        if(partsStock != null) this.partsStockGrid.addRecords(partsStock);
        this.partsStockGrid.renderGrid();
       
        this.materialStockGrid.removeAll();
        if(materialStock != null) this.materialStockGrid.addRecords(materialStock);
        this.materialStockGrid.renderGrid();
       
        this.emptyPalletsGrid.removeAll();
        if(emptyPallets != null) this.emptyPalletsGrid.addRecords(emptyPallets);
        this.emptyPalletsGrid.renderGrid();
    }
}