class MaterialProcurementForm extends palms.exported.framework.ActionForm {
	constructor() {
		super();

		this.searchWidgetList = new MaterialProcurementHeaderSearchWidgetsList(new MaterialProcurementSearchEntity());
		this.resultPanel = new MaterialProcurementResultPanel();
		this.srcsBtnClicked = false;
	}

	initialize() {
		palms.exported.framework.PalmsUIApplication.setForm(this);

		super.initialize();
		super.addStyleName('MaterialProcurementForm');

		const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.searchWidgetList, 4);
		layouter.setAllowGroup(true);
		this.searchWidgetList.initialize();
		layouter.initialize();
		let searchEntity = new MaterialProcurementSearchEntity();
		// searchEntity.currentDate = "26/Aug/2024";
		// searchEntity.line = "25A";
		// searchEntity.orderCycle = "2";
		let instance = this;
		//	this.searchWidgetList.setRecordData(searchEntity);
		this.searchWidgetList.onSearchClick = () => {
			this.srcsBtnClicked = true;
			instance.onSearchClick()
		}

		super.addWidgetControl(layouter.asWidget(), 'NORTH');
		super.setCellWidth(layouter.asWidget(), '100%');
		super.setCellHeight(layouter.asWidget(), 'auto');

		this.resultPanel.initialize();
		super.addWidgetControl(this.resultPanel.asWidget(), 'CENTER');
		super.setCellWidth(this.resultPanel.asWidget(), '75%');
		super.setCellHeight(this.resultPanel.asWidget(), '100%');
	}
	onSearchClick() {
		// if (this.searchWidgetList.validate()) {
		let searchObj = this.searchWidgetList.getRecordData().getJSONString();
		//const jsonCompatibleStr = searchObj.replace(/(\w+):/g, '"$1":');
		//console.log("jsonCompatibleStr",jsonCompatibleStr)
		searchObj = JSON.parse(searchObj);
		if (Object.keys(searchObj).length > 0) {
			let lineId = searchObj.line ? searchObj.line : '';
			if (lineId === '') {
				alert("please select line to proceed with the search!");
				this.srcsBtnClicked = false;

				//let lineId = searchObj.line ? searchObj.line : '';
				//let orderCycle = searchObj.orderCycle ? searchObj.orderCycle : "";
				this.resultPanel.toBeOrdered.grid.removeAll();
				this.resultPanel.toBeOrdered.childGrid.removeAll();
				//this.resultPanel.toBeOrdered.setRecordData(lineId, orderCycle);
				this.resultPanel.toBeOrdered.grid.setRowSelection(false);
				this.resultPanel.toBeOrdered.grid.initialize();
				this.resultPanel.toBeOrdered.grid.addStyleName('ProductionControlForm-resultPanel.toBeOrdered.Grid');
				this.resultPanel.toBeOrdered.grid.setDefaultCellValue('NA');
				//this.resultPanel.toBeOrdered.loadData();
				this.resultPanel.toBeOrdered.grid.renderGrid();
				this.resultPanel.toBeOrdered.childGrid.renderGrid();

				this.resultPanel.ordered.grid.removeAll();
				//this.resultPanel.ordered.setRecordData(lineId, orderCycle);
				this.resultPanel.ordered.grid.setRowSelection(true);
				this.resultPanel.ordered.grid.initialize();
				this.resultPanel.ordered.grid.addStyleName('ProductionControlForm-resultPanel.ordered.Grid');
				this.resultPanel.ordered.grid.setDefaultCellValue('NA');
				//this.resultPanel.ordered.loadData();
				this.resultPanel.ordered.grid.renderGrid();
			} else {
				let orderCycle = searchObj.orderCycle ? searchObj.orderCycle : "";
				let OrderCycleCodeList = searchObj.OrderCycleCodeList ? searchObj.OrderCycleCodeList : [];
				this.resultPanel.toBeOrdered.grid.removeAll();
				this.resultPanel.toBeOrdered.childGrid.removeAll();
				this.resultPanel.toBeOrdered.setRecordData(lineId, orderCycle, OrderCycleCodeList);
				this.resultPanel.toBeOrdered.grid.setRowSelection(false);
				this.resultPanel.toBeOrdered.grid.initialize();
				this.resultPanel.toBeOrdered.grid.addStyleName('ProductionControlForm-resultPanel.toBeOrdered.Grid');
				this.resultPanel.toBeOrdered.grid.setDefaultCellValue('NA');
				this.resultPanel.toBeOrdered.loadData();
				this.resultPanel.toBeOrdered.grid.renderGrid();
				this.resultPanel.toBeOrdered.childGrid.renderGrid();

				this.resultPanel.ordered.grid.removeAll();
				this.resultPanel.ordered.setRecordData(lineId, orderCycle, OrderCycleCodeList);
				this.resultPanel.ordered.grid.setRowSelection(true);
				this.resultPanel.ordered.grid.initialize();
				this.resultPanel.ordered.grid.addStyleName('ProductionControlForm-resultPanel.ordered.Grid');
				this.resultPanel.ordered.grid.setDefaultCellValue('NA');
				this.resultPanel.ordered.loadData();
				this.resultPanel.ordered.grid.renderGrid();
			}

		} else {
			if (this.srcsBtnClicked) {
				alert("please select line to proceed with the search!");
				this.srcsBtnClicked = false;

				//let lineId = searchObj.line ? searchObj.line : '';
				//let orderCycle = searchObj.orderCycle ? searchObj.orderCycle : "";
				this.resultPanel.toBeOrdered.grid.removeAll();
				this.resultPanel.toBeOrdered.childGrid.removeAll();
				//this.resultPanel.toBeOrdered.setRecordData(lineId, orderCycle);
				this.resultPanel.toBeOrdered.grid.setRowSelection(false);
				this.resultPanel.toBeOrdered.grid.initialize();
				this.resultPanel.toBeOrdered.grid.addStyleName('ProductionControlForm-resultPanel.toBeOrdered.Grid');
				this.resultPanel.toBeOrdered.grid.setDefaultCellValue('NA');
				//this.resultPanel.toBeOrdered.loadData();
				this.resultPanel.toBeOrdered.grid.renderGrid();
				this.resultPanel.toBeOrdered.childGrid.renderGrid();

				this.resultPanel.ordered.grid.removeAll();
				//this.resultPanel.ordered.setRecordData(lineId, orderCycle);
				this.resultPanel.ordered.grid.setRowSelection(true);
				this.resultPanel.ordered.grid.initialize();
				this.resultPanel.ordered.grid.addStyleName('ProductionControlForm-resultPanel.ordered.Grid');
				this.resultPanel.ordered.grid.setDefaultCellValue('NA');
				//this.resultPanel.ordered.loadData();
				this.resultPanel.ordered.grid.renderGrid();
			}
		}
	}
}