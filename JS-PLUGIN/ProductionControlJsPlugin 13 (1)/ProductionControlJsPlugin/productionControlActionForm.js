class ProductionControlActionForm extends palms.exported.framework.TabbedForm {
	constructor() {
		super();
		this.currentShift = new ProductionControlFormCurrentShift();
		this.nextShift = new ProductionControlFormNextShift();
		this.nextShiftQueue = new ProductionControlFormNextShiftQueue();
	}
	
	initialize() {
		const tabTitles = ["Current Shift", "Next Shift", "Next Shift Queue"];
		const tabWidgets = [this.currentShift, this.nextShift, this.nextShiftQueue];

		super.initialize(tabTitles, tabWidgets);
		super.selectTab(0);
		this.currentShift.initialize();
		this.nextShift.initialize();
		this.nextShiftQueue.initialize();
	}
}