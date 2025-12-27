(function (global) {
	const jSs = ['ProductionLoadTimeChartForm.js','Entities.js','ProductionLoadTimeChartActionPanel.js','ProductionLoadTimeChartActionWidgetsList.js',	'ProductionLoadTimeChartSearchPanel.js','ProductionLoadTimeChartSearchWidgetsList.js'];
	const css = [];

	jSs.forEach(loadJavaScript);
	css.forEach(loadCss);
	try {
		// Set initial hash table values
		palms.exported.framework.PalmsUIApplication.setHashTableValue("receipts\\sspcsReport".toLowerCase(), "0");
		//palms.exported.framework.PalmsUIApplication.setHashTableValue("receipts\\sspcsReport\\productionLoadTimeChartForm".toLowerCase(), "0");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsReport\\productionLoadTimeChartForm".toLowerCase(), "TPS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsReport\\productionLoadTimeChartForm".toLowerCase(), "21C");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsReport\\productionLoadTimeChartForm".toLowerCase(), "22A");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsReport\\productionLoadTimeChartForm".toLowerCase(), "24A");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsReport\\productionLoadTimeChartForm".toLowerCase(), "SSPCS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsReport\\productionLoadTimeChartForm".toLowerCase(), "SECTION_INCHARGE");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsReport\\productionLoadTimeChartForm".toLowerCase(), "MANAGER");

		
       
		// Log the current version of PalmsUIApplication to the console
		palms.exported.framework.PalmsUIApplication.toConsole('Palms Version : ' + palms.exported.framework.PalmsUIApplication.getVersion());

		var loader = new palms.exported.framework.menuUI.MenuLoader();


		loader.onLoad = function(path) {
			// Set the action name based on the path
			palms.exported.framework.PalmsUIApplication.setActionName(path);
			
			// Configthe visibility of various 
			//palms.exported.framework.PalmsUIApplication.setWarehousePopupVisibility(false);
			//palms.exported.framework.PalmsUIApplicationure .setWarehousePopupVisibility(false);
			palms.exported.framework.PalmsUIApplication.setPrimaryCompanyPopupVisibility(false);
			palms.exported.framework.PalmsUIApplication.setCostBucketPopupVisibility(false);

			new ProductionLoadTimeChartForm().initialize();
		};

		palms.exported.framework.menuUI.MenuPanel.addPluginMenuItem(
			new palms.exported.framework.menuUI.PluginMenuItem(
				"receipts-sspcsReport-productionLoadTimeChartForm",// Unique identifier for the menu item
				"SSPCS REPORTS",									// Category or parent menu
				"Production Load Time Chart",					// Display name of the menu item
				loader											// Loader to execute when the menu item is selected
			)
		);
	}
	catch(e) {
		// Handle any exceptions that occur and display an alert with the exception message
		alert('Exception : ' + e);
	}
})(this);

function loadJavaScript(filename) {
	var script = document.createElement('script');
	script.onload = function () {
		//do stuff with the script
	};
	var url = document.currentScript.src;
	var filename1 = url.split('/').pop()

	script.src = url.replace(url.split('/').pop(), filename);
	document.head.appendChild(script);
}

function loadCss(filename) {
	var link = document.createElement('link');
	link.onload = function () {
		//do stuff with the script
	};
	var url = document.currentScript.src;
	var filename1 = url.split('/').pop()

	link.href = url.replace(url.split('/').pop(), filename);
	link.type = 'text/css';
	link.rel = 'stylesheet';
	document.head.appendChild(link);
}