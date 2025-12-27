class PartOrderSearchForm extends palms.exported.framework.ActionForm {
	constructor() {
		
			super();
            this.grid = null;
			this.searchWidgetList = new PartOrderSearchHeaderWidgets(new PartOrderEntities());
			this.searchWidgetList.search = () => this.search();
		
	}
	

    onAttach() {
		try {
		super.onAttach();
	   } catch (error) {
		console.error("Error during onAttach: ", error);
		alert("An error occurred during the attachment of the search panel.");
	}
	}


	initialize() {
		super.initialize();
		super.addStyleName('PartOrderSearchForm');
		
		
		try {
			const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.searchWidgetList, 6);
			layouter.setAllowGroup(true);
			this.searchWidgetList.initialize();
			layouter.initialize();
		
			super.addWidgetControl(layouter.asWidget(), 'NORTH');
			super.setCellWidth(layouter.asWidget(), '100%');
			super.setCellHeight(layouter.asWidget(), 'auto');
		} catch (error) {
			console.error('Error configuring widget control or layout:', error);
			// Handle or rethrow the error as needed
			throw error;
		}
	}
	search() {
		try {
		} catch (error) {
			//console.error("Error during search execution: ", error);
			alert("An error occurred while executing the search.");
		}
	}
	
}