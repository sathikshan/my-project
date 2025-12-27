class ProductionControlDashboardSearchPanel extends palms.exported.framework.ActionForm {
	constructor() {
		super();
		this.grid = null;
		this.searchWidgetList = new ProductionDashBoardSearchWidgetsList(new ProductionControlDashBoardEntity());
		this.searchWidgetList.search = () => this.search();
	}
	
	onAttach() {

		super.onAttach();

	}
	
	initialize() {
		try {
			super.initialize();
			super.addStyleName('ProductionControlDashBoard');

			const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.searchWidgetList, 6);
			layouter.setAllowGroup(true);
			this.searchWidgetList.initialize();
			layouter.initialize();
			super.addWidgetControl(layouter.asWidget(), 'NORTH');
			super.setCellWidth(layouter.asWidget(), '100%');
			super.setCellHeight(layouter.asWidget(), 'auto');

		} catch (error) {
			alert("An error occurred during the initialization of the search panel.");
		}
	}

	search() {
		try {
		} catch (error) {
			alert("An error occurred while executing the search.");
		}
	}
}

