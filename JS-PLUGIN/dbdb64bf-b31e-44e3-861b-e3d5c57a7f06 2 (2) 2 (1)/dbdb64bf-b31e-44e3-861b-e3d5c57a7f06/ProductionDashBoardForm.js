                                                                        
class ProductionDashBoardForm extends palms.exported.framework.TabbedForm {
    constructor() {
            super();
            this.searchPanel = new ProductionControlDashboardSearchPanel();
            this.actionPanel = new ProductionControlDashboardActionPanel();
            this.dashboard=new ProductionControlDashBoardEntity();
    }

    initialize() {
        try {
            const tabTitles = ['Search', 'Action'];
            const tabWidgets = [this.searchPanel, this.actionPanel];

            super.initialize(tabTitles, tabWidgets);
            this.searchPanel.initialize();
            this.actionPanel.initialize();

            super.selectTab(0);
            palms.exported.framework.PalmsUIApplication.setForm(this);

            let instance = this; 
            this.searchPanel.searchWidgetList.onSearchClick = () => {
                instance.onSearchClick();
            };
        } catch (error) {
            alert("An error occurred during initialization."+ error);
        }
    }

    onSearchClick() {
        if (this.searchPanel.searchWidgetList.validate()) {
            this.actionPanel.loadData(this.searchPanel.searchWidgetList.getRecordData().getJSONString());
            super.selectTab(1);
            
        }
    }
 
}



