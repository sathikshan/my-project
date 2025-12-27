
class ProductionControlSearchForm extends palms.exported.framework.ActionForm {
	constructor() {
		super();
		
		try {
			this.searchWidgetList = new ProductionCurrentShiftHeaderSearchWidgetsList(new ProductionControlCurrentShiftEntity());
			this.searchWidgetList.search = () => this.search();
		} catch (error) {
			console.error('Error initializing search widget list:', error);
			// Handle or rethrow the error as needed
			throw error;
		}
	}
	
	initialize() {
		super.initialize();
		super.addStyleName('ProductionControlSearchForm');
		
		try {
			const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.searchWidgetList, 5);
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
			console.log('Search triggered');
			// Example: You may want to trigger a method to fetch data or validate inputs
			// Call the search function defined in the parent class or handle search logic directly
			// For instance, you could trigger an event or call a method in the parent form
		} catch (error) {
			console.error('Error during search execution:', error);
			alert('An error occurred during the search operation.');
		}
	}
	
} 



