class MaterialProcurementResultPanel extends palms.exported.framework.TabbedForm {
	constructor() {
		super();
		this.toBeOrdered = new MaterialProcurementToBeOrderedPanel();
		this.ordered = new MaterialProcurementOrderedPanel();
	}
	
	initialize() {
		super.addStyleName('MaterialProcurementResultPanel');
		
		const tabTitles = ['To Be Ordered', 'Ordered'];
		const tabWidgets = [this.toBeOrdered, this.ordered];

		super.initialize(tabTitles, tabWidgets);
		super.selectTab(0);
		this.toBeOrdered.initialize();
		this.ordered.initialize();
	}
}