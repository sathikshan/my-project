class ProductionLoadTimeChartSearchPanel extends palms.exported.framework.ActionForm {
	constructor() {
		super();
		this.grid = null;
		this.searchWidgetList = new ProductionLoadTimeChartSearchWidgetsList(new ProductionLoadTimeChartEntity());
		this.searchWidgetList.search = () => this.search();
	}
	
	onAttach() {
		super.onAttach();
	}
	
	initialize() {
		try {
			super.initialize();
			super.addStyleName('ProductionLoadTimeChartSearchPanel');

			const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.searchWidgetList, 5);
			layouter.setAllowGroup(true);
			this.searchWidgetList.initialize();
			layouter.initialize();
			super.addWidgetControl(layouter.asWidget(), 'NORTH');
			super.setCellWidth(layouter.asWidget(), '100%');
			super.setCellHeight(layouter.asWidget(), 'auto');
		} catch (error) {
			console.error("Error during initialization: ", error);
		}
	}

	search() {
	}
	
	
}