(function (global) {

	try {
		palms.exported.framework.PalmsUIApplication.setHashTableValue("setup\\CSVUpload".toLowerCase(), "0");
		//palms.exported.framework.PalmsUIApplication.setHashTableValue("setup\\CSVUpload\\PatternRowData".toLowerCase(), "0");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("setup\\CSVUpload\\PatternRowData".toLowerCase(), "TPS");
		palms.exported.framework.PalmsUIApplication.addRoleScreen("setup\\CSVUpload\\PatternRowData".toLowerCase(), "SSPCS");
		// Log the current version of PalmsUIApplication to the console
		palms.exported.framework.PalmsUIApplication.toConsole('Palms Version : ' + palms.exported.framework.PalmsUIApplication.getVersion());

		var PatternRowDataLoader = new palms.exported.framework.menuUI.MenuLoader();
		PatternRowDataLoader.onLoad = function(path) {
			// Set the action name based on the path
			palms.exported.framework.PalmsUIApplication.setActionName(path);
			
			// Configure the visibility of various popups
			palms.exported.framework.PalmsUIApplication.setWarehousePopupVisibility(false);
			palms.exported.framework.PalmsUIApplication.setPrimaryCompanyPopupVisibility(false);
			palms.exported.framework.PalmsUIApplication.setCostBucketPopupVisibility(false);

			new PatternRowDataUpload('http://localhost:8081/upload/patternRowData').initialize();
		};
		palms.exported.framework.menuUI.MenuPanel.addPluginMenuItem(
			new palms.exported.framework.menuUI.PluginMenuItem(
				"setup-CSVUpload-PatternRowData", // Unique identifier for the menu item
				"CSV Upload",                // Category or parent menu
				"Pattern Upload",          	// Display name of the menu item
				PatternRowDataLoader        				// Loader to execute when the menu item is selected
			)
		);
	}
	catch(e) {
		alert('Exception : ' + e);
	}
})(this);

class PatternRowDataUpload extends palms.exported.gwt.user.client.ui.SimplePanel {
	// Constructor initializes the form components
	constructor(uploadWebService) {
		super();
		this.lblLocationsUploadFile = new palms.exported.gwt.user.client.ui.Label();
		this.uploadPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
		
		// Instance reference for inner functions
		let instance = this;
		this.userLoggedInId =  palms.exported.framework.PalmsUIApplication.getLoggedInUserID();
		this.uploadControl = new palms.exported.framework.selfValidatingControls.ExcelUploadControl(uploadWebService);
		this.uploadControl.addRequestParameter("palmsId",this.userLoggedInId);
		this.uploadControl.getInvalidFileMessage = () => 'Please Select CSV file.';
		this.uploadControl.submitComplete = function(responce) {
			instance.uploadPopup.hide();
			alert(responce);
		};

		// Set label text and style
		this.lblLocationsUploadFile.setText("Upload Locations");
		this.lblLocationsUploadFile.setStyleName("FieldNameLabel");

		// Add label and upload control to uploadPanel
		this.uploadPanel.add(this.lblLocationsUploadFile.asWidget());
		this.uploadPanel.add(this.uploadControl.asWidget());

		// Set width for upload control and panel
		this.uploadControl.setWidth("100%");
		this.uploadPanel.setWidth("70%");

		// Add uploadPanel to this SimplePanel
		this.add(this.uploadPanel.asWidget());
	}

	// Method to initialize the form with pre-filled data and set up event handlers
	initialize() {
		// Create a StickyNote for displaying the upload status
		this.uploadPopup = new palms.exported.framework.StickyNote(palms.exported.framework.PalmsUIApplication.getMainPanel(), "CSV Upload", this.asWidget(), "400px",
				"100px");
		this.uploadPopup.initialize();
		this.uploadPopup.setStyleName("ErrorDialogBox");
		this.uploadPopup.setGlassEnabled(true);
		this.uploadPopup.showModal();
	}
	fileUploadConfirmation(uploadedFileID) {
		alert("File Uploaded" + uploadedFileID);
	}
}