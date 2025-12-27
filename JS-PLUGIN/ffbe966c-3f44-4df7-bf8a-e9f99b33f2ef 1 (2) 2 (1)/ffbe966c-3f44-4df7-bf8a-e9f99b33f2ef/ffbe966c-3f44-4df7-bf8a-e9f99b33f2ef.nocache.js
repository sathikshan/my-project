
(function (global) {
	const jSs = ['PartOrderForm.js','PartOrderSearchForm.js','PartOrderActionForm.js','SearchWidgetsList.js','PartOrderEntities.js','ActionWidgetsList.js'];
	const css = ['styles.css'];
	
	jSs.forEach(loadJavaScript);
	css.forEach(loadCss);

	try {
		palms.exported.framework.PalmsUIApplication.setHashTableValue("receipts\\sspcsreport".toLowerCase(), "0");
		//palms.exported.framework.PalmsUIApplication.setHashTableValue("receipts\\sspcsreport\\productionPartOrder".toLowerCase(), "0");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsreport\\productionPartOrder".toLowerCase(), "TPS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsreport\\productionPartOrder".toLowerCase(), "21C");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsreport\\productionPartOrder".toLowerCase(), "22A");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsreport\\productionPartOrder".toLowerCase(), "24A");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsreport\\productionPartOrder".toLowerCase(), "SSPCS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsreport\\productionPartOrder".toLowerCase(), "SECTION_INCHARGE");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\sspcsreport\\productionPartOrder".toLowerCase(), "MANAGER");
		
		palms.exported.framework.PalmsUIApplication.setHashTableValue("receipts\\sspcsreport\\productionPartOrder\\Action".toLowerCase(), "0");
		palms.exported.framework.PalmsUIApplication.setHashTableValue("receipts\\sspcsreport\\productionPartOrder\\Action\\Update".toLowerCase(), "0");

		// Log the current version of PalmsUIApplication to the console
		palms.exported.framework.PalmsUIApplication.toConsole('Palms Version : ' + palms.exported.framework.PalmsUIApplication.getVersion());

		var menuLoader = new palms.exported.framework.menuUI.MenuLoader();
		menuLoader.onLoad = function(path) {
			try {
				// Set the action name based on the path
				palms.exported.framework.PalmsUIApplication.setActionName(path);
				
				// Configure the visibility of various popups
				palms.exported.framework.PalmsUIApplication.setWarehousePopupVisibility(false);
				palms.exported.framework.PalmsUIApplication.setPrimaryCompanyPopupVisibility(false);
				palms.exported.framework.PalmsUIApplication.setCostBucketPopupVisibility(false);
				
				// Create and initialize an instance of ProductionControlForm
				new partOrderControlForm().initialize();
			}	catch(e) {
				alert('Exception : ' + e);
			}
		};
		// Add "Production Control" item to the plugin menu
		palms.exported.framework.menuUI.MenuPanel.addPluginMenuItem(
			new palms.exported.framework.menuUI.PluginMenuItem(
				"receipts-sspcsreport-productionPartOrder",	// Unique identifier for the menu item
				"SSPCS REPORTS",						// Category or parent menu
				"PartOrder DashBoard",				// Display name of the menu item
				menuLoader				// Loader to execute when the menu item is selected
			)
		);
	}
	catch(e) {
		// Handle any exceptions that occur and display an alert
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
