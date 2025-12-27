(function (global) {
	const jSs = ['MaterialProcurementForm.js', 'MaterialProcurementHeaderSearchWidgetsList.js', 'Entities.js', 'MaterialProcurementResultPanel.js', 'MaterialProcurementToBeOrderedPanel.js', 'MaterialProcurementOrderedPanel.js', 'MaterialProcurementEditorPanel.js', 'enums.js','materialAddOtherPartsPopup.js','orderMaterialPopup.js','RecommendationPopup.js','skipMaterialPopup.js','cancelMaterialOrderPopup.js'];
	const css = ['styles.css'];
	
	jSs.forEach(loadJavaScript);
	css.forEach(loadCss);
	try {
		// Set initial hash table values
		palms.exported.framework.PalmsUIApplication.setHashTableValue("receipts\\jsPlugIn".toLowerCase(), "0");
		palms.exported.framework.PalmsUIApplication.setHashTableValue("receipts\\jsPlugIn\\materialProcurement".toLowerCase(), "0");

		// Log the current version of PalmsUIApplication to the console
		palms.exported.framework.PalmsUIApplication.toConsole('Palms Version : ' + palms.exported.framework.PalmsUIApplication.getVersion());

		var loader = new palms.exported.framework.menuUI.MenuLoader();
		loader.onLoad = function(path) {
			// Set the action name based on the path
			palms.exported.framework.PalmsUIApplication.setActionName(path);
			
			// Configure the visibility of various popups
			palms.exported.framework.PalmsUIApplication.setWarehousePopupVisibility(false);
			palms.exported.framework.PalmsUIApplication.setPrimaryCompanyPopupVisibility(false);
			palms.exported.framework.PalmsUIApplication.setCostBucketPopupVisibility(false);

			new MaterialProcurementForm().initialize();
		};

		palms.exported.framework.menuUI.MenuPanel.addPluginMenuItem(
			new palms.exported.framework.menuUI.PluginMenuItem(
				"receipts-jsPlugIn-materialProcurement", // Unique identifier for the menu item
				"JS Plugin",                // Category or parent menu
				"Material Procurement",     // Display name of the menu item
				loader        				// Loader to execute when the menu item is selected
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