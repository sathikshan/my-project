class DashBoardLotSizeCalculationsPopup extends palms.exported.framework.StickyNote {
	constructor() {
		super(palms.exported.framework.PalmsUIApplication.getMainPanel(), "Lot Size Calculations",
			new palms.exported.gwt.user.client.ui.VerticalPanel(), "600px", "auto");

			this.DashBoardpartsStockGrid = this.getDashBoardPartsStockGrid();
			this.DashBoardmaterialStockGrid = this.getDashBoardMaterialStockGrid();
			this.DashBoardemptyPalletsGrid = this.getDashBoardEmptyPalletsGrid();
	}
	
	initialize() {
		try {
			super.initialize();
			super.addStyleName('Popuup');
			
			super.getContainer().add(this.DashBoardpartsStockGrid.asWidget());
			super.getContainer().setCellWidth(this.DashBoardpartsStockGrid.asWidget(), '100%');
			super.getContainer().setCellHeight(this.DashBoardpartsStockGrid.asWidget(), '100%');
			this.DashBoardpartsStockGrid.removeAll();
			this.DashBoardpartsStockGrid.initialize();
			this.DashBoardpartsStockGrid.addStyleName('DashBoardPartsStockGrid');
			this.DashBoardpartsStockGrid.setDefaultCellValue('NA');
			this.DashBoardpartsStockGrid.renderGrid();
			
			const hPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
			hPanel.setWidth("100%");
			super.getContainer().add(hPanel.asWidget());
			super.getContainer().setCellWidth(hPanel.asWidget(), '100%');
			super.getContainer().setCellHeight(hPanel.asWidget(), '100%');
			
			hPanel.add(this.DashBoardmaterialStockGrid.asWidget());
			hPanel.setCellWidth(this.DashBoardmaterialStockGrid.asWidget(), '50%');
			hPanel.setCellHeight(this.DashBoardmaterialStockGrid.asWidget(), '100%');
			this.DashBoardmaterialStockGrid.removeAll();
			this.DashBoardmaterialStockGrid.initialize();
			this.DashBoardmaterialStockGrid.addStyleName('DashBoardMaterialStockGrid');
			this.DashBoardmaterialStockGrid.setDefaultCellValue('NA');
			this.DashBoardmaterialStockGrid.renderGrid();
			
			hPanel.add(this.DashBoardemptyPalletsGrid.asWidget());
			hPanel.setCellWidth(this.DashBoardemptyPalletsGrid.asWidget(), '50%');
			hPanel.setCellHeight(this.DashBoardemptyPalletsGrid.asWidget(), '100%');
			this.DashBoardemptyPalletsGrid.removeAll();
			this.DashBoardemptyPalletsGrid.initialize();
			this.DashBoardemptyPalletsGrid.addStyleName('DashBoardEmptyPalletsGrid');
			this.DashBoardemptyPalletsGrid.setDefaultCellValue('NA');
			this.DashBoardemptyPalletsGrid.renderGrid();
			
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
			alert("Error during initialization: " + error);
		}
	}
	
	getDashBoardPartsStockGrid() {
			let DashBoardpartsStockGrid = new palms.exported.framework.grid.Grid("Parts Stock", PartsStockEntity);
			
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('bomSeqNo', 'BOM Seq No.', false, ColumnType.ReadOnlyInteger, true));
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('childPart', 'Part', false, ColumnType.ReadOnlyString, true));
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('qpc', 'QPC', false, ColumnType.ReadOnlyInteger, true));
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('orderToLine', 'Order To Line', false, ColumnType.ReadOnlyInteger, true));
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('kbsInCirculation', 'KBs in Calculation', false, ColumnType.ReadOnlyInteger, true));
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('stock', 'Stock', false, ColumnType.ReadOnlyString, true));
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('kbsRtd', 'KBs Rtd', false, ColumnType.ReadOnlyString, true));
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('recKBs', 'Rec. KBs', false, ColumnType.ReadOnlyString, true));
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('adj', 'ADJ', false, ColumnType.ReadOnlyString, true));
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('planLotSize', 'Plan Lot Size', false, ColumnType.ReadOnlyString, true));
			DashBoardpartsStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('onHold', 'On Hold', false, ColumnType.ReadOnlyInteger, true));
			
			DashBoardpartsStockGrid.addRowSpanColumn('bomSeqNo');
			DashBoardpartsStockGrid.addRowSpanColumn('adj');
			DashBoardpartsStockGrid.addRowSpanColumn('planLotSize');
			
			DashBoardpartsStockGrid.getStyle().paddingBottom = "10px";
			
			return DashBoardpartsStockGrid;
	}
	
	getDashBoardMaterialStockGrid() {
			let DashBoardmaterialStockGrid = new palms.exported.framework.grid.Grid("Material Stock", MaterialStockEntity);
			
			DashBoardmaterialStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('material', 'Material', false, ColumnType.ReadOnlyString, true));
			DashBoardmaterialStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('skidQty', 'SKID Qty', false, ColumnType.ReadOnlyInteger, true));
			DashBoardmaterialStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('onOrder', 'On Order', false, ColumnType.ReadOnlyInteger, true));
			DashBoardmaterialStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('stock', 'Stock', false, ColumnType.ReadOnlyInteger, true));
			DashBoardmaterialStockGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('onHold', 'On Hold', false, ColumnType.ReadOnlyString, true));
			
			return DashBoardmaterialStockGrid;
	}
	
	getDashBoardEmptyPalletsGrid() {
			let DashBoardemptyPalletsGrid = new palms.exported.framework.grid.Grid("Empty Pallets", EmptyPalletsEntity);
			
			DashBoardemptyPalletsGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('palletType', 'Pallet Type', false, ColumnType.ReadOnlyString, true));
			DashBoardemptyPalletsGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('empty', 'Empty', false, ColumnType.ReadOnlyInteger, true));
			DashBoardemptyPalletsGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('wip', 'WIP', false, ColumnType.ReadOnlyInteger, true));
			DashBoardemptyPalletsGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('onHold', 'On Hold', false, ColumnType.ReadOnlyString, true));
			
			DashBoardemptyPalletsGrid.getStyle().paddingLeft = "10px";
			
			return DashBoardemptyPalletsGrid;
	}
	
	setRecords(partsStock, materialStock, emptyPallets) {

			this.DashBoardpartsStockGrid.removeAll();
			if(partsStock != null) this.DashBoardpartsStockGrid.addRecords(partsStock);
			this.DashBoardPartsStockGrid.renderGrid();
		
			this.DashBoardmaterialStockGrid.removeAll();
			if(materialStock != null) this.DashBoardmaterialStockGrid.addRecords(materialStock);
			this.DashBoardmaterialStockGrid.renderGrid();
		

			this.DashBoardemptyPalletsGrid.removeAll();
			if(emptyPallets != null) this.DashBoardemptyPalletsGrid.addRecords(emptyPallets);
			this.DashBoardemptyPalletsGrid.renderGrid();
	}
}
