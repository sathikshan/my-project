(function (global) {
	const jSs = ['AddOtherPartsPopup.js',
		'enums.js', 
		'entities.js', 
		'productionControlForm.js', 
		'headerRecordWidgetsList.js', 
		'editorPanel.js', 
		'PlannedLineStop-Popup.js', 
		'lotSizeCalculations-Popup.js', 
		'productionControlActionForm.js', 
		'productionControlSearchForm.js', 
		'productionControlFormCurrentShift.js', 
		'productionControlFormNextShift.js', 
		'searchWidgetsList.js',
	    'skipProductionpopup.js',
		'disContinuePopup.js',
	    'AddOtherPartsPopup.js',
		'AddOtherPartsPopupNextShiftQueue.js',
		'editorPanelNextShiftQueue.js',
		'productionControlFormNextShiftQueue.js',
	];
	const css = ['styles.css'];
	
	jSs.forEach(loadJavaScript);
	css.forEach(loadCss);

	try {
		// Set initial hash table values
		// palms.exported.framework.PalmsUIApplication.setHashTableValue("administration\\customizationsAndConfigs".toLowerCase(), "0");
		// palms.exported.framework.PalmsUIApplication.setHashTableValue("administration\\customizationsAndConfigs\\javascriptPlugins".toLowerCase(), "0");
		palms.exported.framework.PalmsUIApplication.setHashTableValue("inventory\\sspcs".toLowerCase(), "0");
		// palms.exported.framework.PalmsUIApplication.setHashTableValue("inventory\\sspcs\\productionControl".toLowerCase(), "0");
        // palms.exported.framework.PalmsUIApplication.setHashTableValue("inventory\\sspcs\\productionControl\\Action".toLowerCase(), "0");
		// palms.exported.framework.PalmsUIApplication.setHashTableValue("inventory\\sspcs\\productionControl\\Action\\Update".toLowerCase(), "0");

		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl".toLowerCase(), "TPS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl\\Action".toLowerCase(), "TPS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl\\Action\\Update".toLowerCase(), "TPS");

		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl".toLowerCase(), "21C");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl\\Action".toLowerCase(), "21C");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl\\Action\\Update".toLowerCase(), "21C");

		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl".toLowerCase(), "22A");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl\\Action".toLowerCase(), "22A");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl\\Action\\Update".toLowerCase(), "22A");

		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl".toLowerCase(), "24A");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl\\Action".toLowerCase(), "24A");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl\\Action\\Update".toLowerCase(), "24A");

		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl".toLowerCase(), "SSPCS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl\\Action".toLowerCase(), "SSPCS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("inventory\\sspcs\\productionControl\\Action\\Update".toLowerCase(), "SSPCS");
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
				new ProductionControlForm().initialize();
			}	catch(e) {
				alert('Exception : ' + e);
			}
		};
		// Add "Production Control" item to the plugin menu
		palms.exported.framework.menuUI.MenuPanel.addPluginMenuItem(
			new palms.exported.framework.menuUI.PluginMenuItem(
				"inventory-sspcs-productionControl",	// Unique identifier for the menu item
				"SSPCS",						// Category or parent menu
				"Production Control",				// Display name of the menu item
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