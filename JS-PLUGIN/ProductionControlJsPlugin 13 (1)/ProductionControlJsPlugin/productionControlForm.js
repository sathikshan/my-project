class ProductionControlForm extends palms.exported.framework.TabbedForm {
	constructor() {
		super();
		this.searchForm = new ProductionControlSearchForm();
		this.actionForm = new ProductionControlActionForm();
	}
	
	initialize() {
		palms.exported.framework.PalmsUIApplication.setForm(this);
		const tabTitles = ["Search", "Action"];
		const tabWidgets = [this.searchForm, this.actionForm];

		super.initialize(tabTitles, tabWidgets);
		super.selectTab(0);
		this.searchForm.initialize();
		this.actionForm.initialize();
		
		let instance = this;
		this.searchForm.searchWidgetList.onSearchClick = () => {instance.onSearchClick()};
	}

    onSearchClick() {
        if (this.searchForm.searchWidgetList.validate()) {
            this.actionForm.currentShift.loadData(this.searchForm.searchWidgetList.getRecordData().getJSONString());
            this.actionForm.nextShift.loadData(this.searchForm.searchWidgetList.getRecordData().getJSONString());
			this.actionForm.nextShiftQueue.loadData(this.searchForm.searchWidgetList.getRecordData().getJSONString());
            super.selectTab(1);

            // Automatically select the "CurrentShift" tab within the action form
            this.actionForm.selectTab(0);
        } else {
            alert('No filter is selected.');
        }
    }
    
    
}