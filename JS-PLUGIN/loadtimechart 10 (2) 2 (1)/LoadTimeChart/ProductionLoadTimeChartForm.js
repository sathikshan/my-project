class ProductionLoadTimeChartForm extends palms.exported.framework.TabbedForm {
	constructor() {
		super();
		this.searchPanel = new ProductionLoadTimeChartSearchPanel();
		this.actionPanel = new ProductionLoadTimeChartActionPanel();
		this.loadtime=new ProductionLoadTimeChartEntity();
		// this.searchPanel.search = () => this.loadData();
	}
	
	initialize() {
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
		}

		//this.loadData();
	}

	onSearchClick() {
        if (this.searchPanel.searchWidgetList.validate()) {
            this.actionPanel.loadData(this.searchPanel.searchWidgetList.getRecordData().getJSONString());
           
            super.selectTab(1);
        }
    }

	// onSearchClick() {
        
    //     if (this.searchPanel.searchWidgetList.validate()) {
    //         const recordData = this.searchPanel.searchWidgetList.getRecordData();
            
    //         console.log(recordData);
    //         this.loadData(recordData.currentDate,recordData.currentTime,recordData.line,recordData.shift);
	// 	}
	// }

	// loadData(currentDate,currentTime,line,shift) {
	// 	try {
	// 		var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
	// 		proxy.url = "http://localhost:8081/productionLoadTimeChart"; 
	// 		proxy.payLoad = JSON.stringify({ currentDate: currentDate, currentTime:currentTime,shift: shift,line:line });
	// 		proxy.method = "POST"; 
	// 		proxy.contentType = "application/json; charset=utf-8"; 
	// 		proxy.timeout = 20000; 
	// 		proxy.keepAlive = false; 

	// 		let instance = this; 
	// 		var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); 


		
	// 		callback.onSuccess = function(responseData) {
	// 			try {
	// 				console.log("Raw response data:", responseData); 
	// 				var responseObj = JSON.parse(responseData);
	// 				console.log("Parsed response object:", responseObj);
	// 				let recordData = new ProductionLoadTimeChartEntity();
	// 				recordData.populateFields(responseObj);
	// 				console.log("Populated recordData:", recordData); 
	// 				instance.actionPanel.setRecordData(recordData);
	// 				instance.selectTab(1);
	// 			} catch (error) {
	// 				console.error("Error processing success response: ", error);
	// 			}
	// 		}

	// 		callback.onFailure = function(errorDescription) {
	// 			try {
	// 				alert("Failure: " + errorDescription);
	// 			} catch (error) {
	// 				console.error("Error processing failure response: ", error);
	// 			}
	// 		}

	// 		palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
	// 	} catch (error) {
	// 		console.error("Error loading data: ", error);
	// 	}
	// }
}


