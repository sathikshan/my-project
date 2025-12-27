(function (global) {
	const jSs = ['InspectionAndRepairReportForm.js', 'enums.js', 'RepairWidget.js','InsEntities.js','DNCWidget.js'];
	const css = ['styles.css'];
	
	jSs.forEach(loadJavaScript);
	css.forEach(loadCss);

	try {
		// Set initial hash table values
		palms.exported.framework.PalmsUIApplication.setHashTableValue("receipts\\jsPlugIn".toLowerCase(), "0");
		//palms.exported.framework.PalmsUIApplication.setHashTableValue("receipts\\jsPlugIn\\inspectionAndRepairReport".toLowerCase(), "0");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\jsPlugIn\\inspectionAndRepairReport".toLowerCase(), "TPS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\jsPlugIn\\inspectionAndRepairReport".toLowerCase(), "I&R");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\jsPlugIn\\inspectionAndRepairReport".toLowerCase(), "SSPCS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\jsPlugIn\\inspectionAndRepairReport".toLowerCase(), "SECTION_INCHARGE");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("receipts\\jsPlugIn\\inspectionAndRepairReport".toLowerCase(), "MANAGER");

		// Log the current version of PalmsUIApplication to the console
		palms.exported.framework.PalmsUIApplication.toConsole('Palms Version : ' + palms.exported.framework.PalmsUIApplication.getVersion());

		var createEmployeeLoader = new palms.exported.framework.menuUI.MenuLoader();
		createEmployeeLoader.onLoad = function(path) {
			try {
				// Set the action name based on the path
				palms.exported.framework.PalmsUIApplication.setActionName(path);
				
				// Configure the visibility of various popups
				palms.exported.framework.PalmsUIApplication.setWarehousePopupVisibility(false);
				palms.exported.framework.PalmsUIApplication.setPrimaryCompanyPopupVisibility(false);
				palms.exported.framework.PalmsUIApplication.setCostBucketPopupVisibility(false);

				// Create and initialize an instance of InspectionAndRepairReportForm
				new InspectionAndRepairReportForm().initialize();
			}	catch(e) {
				alert('Exception : ' + e);
			}
		};
		// Add "Inspection And Repair Report" item to the plugin menu
		palms.exported.framework.menuUI.MenuPanel.addPluginMenuItem(
			new palms.exported.framework.menuUI.PluginMenuItem(
				"receipts-jsPlugIn-inspectionAndRepairReport",	// Unique identifier for the menu item
				"JS Plugin",									// Category or parent menu
				"Inspection And Repair Report",					// Display name of the menu item
				createEmployeeLoader							// Loader to execute when the menu item is selected
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

