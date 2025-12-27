
class ProductionControlFormCurrentShift extends palms.exported.framework.ActionForm {
	constructor() {
		super();
		this.currentShift = new ProductionControlCurrentShiftEntity();
		this.grid = null;
		this.childGrid = null;
		this.filter = null;
		this.userLoggedInRole =  palms.exported.framework.PalmsUIApplication.getUserRoleCode();
		this.headerRecordList = new ProductionCurrentShiftHeaderRecordWidgetsList(this.currentShift, this);
		this.editorPanel = new EditorPanel(this);
		this.selectedRowIndex = null;
		//this.userLoggedInId = null; 
		this.userLoggedInId = palms.exported.framework.PalmsUIApplication.getLoggedInUserID();
	}

	initialize() {
		super.initialize();
		super.addStyleName('ProductionControlForm');
		const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.headerRecordList, 6);
		layouter.setAllowGroup(true);
		this.headerRecordList.initialize();
		layouter.initialize();
		super.addWidgetControl(layouter.asWidget(), 'NORTH');
		super.setCellWidth(layouter.asWidget(), '100%');
		super.setCellHeight(layouter.asWidget(), 'auto');

		const gridPanel = this.getGridPanel();
		super.addWidgetControl(gridPanel.asWidget(), 'CENTER');
		super.setCellWidth(gridPanel.asWidget(), '75%');
		super.setCellHeight(gridPanel.asWidget(), '100%');
		
		if (true) {
			this.grid = new palms.exported.framework.grid.Grid('Production Control Grid', ProductionControlGridLineEntity);
			
			const dragIconCC = new palms.exported.framework.grid.EditableColumnConfiguration('dragIcon', '', false, ColumnType.Icon, true);
			const ptnsCC = new palms.exported.framework.grid.EditableColumnConfiguration('ptns', 'Ptns', false, ColumnType.ReadOnlyString, true);
			const seqCC = new palms.exported.framework.grid.EditableColumnConfiguration('seq', 'Seq', false, ColumnType.ReadOnlyString, true);
			const planStartAndEndCC = new palms.exported.framework.grid.EditableColumnConfiguration('planStartAndEnd', 'Plan Start-End', false, ColumnType.ReadOnlyString, true);
			const loadTimeCC = new palms.exported.framework.grid.EditableColumnConfiguration('loadTime', 'Load Time', false, ColumnType.LinkString, true);
			const dieBayCC = new palms.exported.framework.grid.EditableColumnConfiguration('dieBay', 'Die Bay', false, ColumnType.ReadOnlyString, true);
			const dieSetCC = new palms.exported.framework.grid.EditableColumnConfiguration('dieSet', 'Die Set', false, ColumnType.ReadOnlyString, true);
			const ptnLotSizeCC = new palms.exported.framework.grid.EditableColumnConfiguration('ptnLotSize', 'Ptn Lot Size', false, ColumnType.ReadOnlyString, true);
			const recLotSizeCC = new palms.exported.framework.grid.EditableColumnConfiguration('recLotSize', 'Rec Lot Size', false, ColumnType.ReadOnlyString, true);
			const planLotSizeCC = new palms.exported.framework.grid.EditableColumnConfiguration('planLotSize', 'Plan Lot Size', false, ColumnType.LinkString, true);
			const statusCC = new palms.exported.framework.grid.EditableColumnConfiguration('status', 'Status', false, ColumnType.ReadOnlyString, true);
			const lotNoCC = new palms.exported.framework.grid.EditableColumnConfiguration('lotNo', 'Lot No', false, ColumnType.ReadOnlyString, true);
			const actualLotSizeCC = new palms.exported.framework.grid.EditableColumnConfiguration('actualLotSize', 'Actual Lot Size', false, ColumnType.ReadOnlyString, true);
			const actualStartAndEndCC = new palms.exported.framework.grid.EditableColumnConfiguration('actualStartAndEnd', 'Actual Start-End', false, ColumnType.ReadOnlyString, true);
			const actualLoadTimeCC = new palms.exported.framework.grid.EditableColumnConfiguration('actualLoadTime', 'Actual Load Time', false, ColumnType.ReadOnlyInteger, true);
			const delayCC = new palms.exported.framework.grid.EditableColumnConfiguration('delay', 'Delay', false, ColumnType.ReadOnlyString, true);

			this.grid.addColumn(dragIconCC);
			this.grid.addColumn(ptnsCC);
			this.grid.addColumn(seqCC);
			this.grid.addColumn(planStartAndEndCC);
			this.grid.addColumn(loadTimeCC);
			this.grid.addColumn(dieBayCC);
			this.grid.addColumn(dieSetCC);
			this.grid.addColumn(ptnLotSizeCC);
			this.grid.addColumn(recLotSizeCC);
			this.grid.addColumn(planLotSizeCC);
			this.grid.addColumn(statusCC);
			this.grid.addColumn(lotNoCC);
			this.grid.addColumn(actualLotSizeCC);
			this.grid.addColumn(actualStartAndEndCC);
			this.grid.addColumn(actualLoadTimeCC);
			this.grid.addColumn(delayCC);

			const scrollPanel = new palms.exported.gwt.user.client.ui.ScrollPanel();
			scrollPanel.setSize('100%', '100%');
			scrollPanel.addStyleName('ProductionControlForm-Scroll');
			scrollPanel.getStyle().overflowX = 'hidden';
			scrollPanel.getStyle().overflowY = 'auto';
			scrollPanel.add(this.grid.asWidget());
			gridPanel.add(scrollPanel.asWidget());
			gridPanel.setCellWidth(scrollPanel.asWidget(), '100%');
			gridPanel.setCellHeight(scrollPanel.asWidget(), 'auto');
			gridPanel.setRowHeight(scrollPanel.asWidget(), '60%');	

			this.setRowColorRenderer(dragIconCC);
			this.setRowColorRenderer(ptnsCC);
			this.setRowColorRenderer(seqCC);
			this.setRowColorRenderer(planStartAndEndCC);
			this.setRowColorRenderer(loadTimeCC);
			this.setRowColorRenderer(dieBayCC);
			this.setRowColorRenderer(dieSetCC);
			this.setRowColorRenderer(ptnLotSizeCC);
			this.setRowColorRenderer(recLotSizeCC);
			this.setRowColorRenderer(planLotSizeCC);
			this.setRowColorRenderer(statusCC);
			this.setRowColorRenderer(lotNoCC);
			this.setRowColorRenderer(actualLotSizeCC);
			this.setRowColorRenderer(actualStartAndEndCC);
			this.setRowColorRenderer(actualLoadTimeCC);
			this.setRowColorRenderer(delayCC);

			const statusRenderer = new palms.exported.framework.grid.GridCellRenderer(ProductionControlGridLineEntity);
			statusRenderer.render = function(record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
				if(record.rowColor) parentStyle.backgroundColor = record.rowColor;
				stringBuilder.appendSafeHtml(palms.exported.gwt.safehtml.shared.SafeHtmlUtils.fromTrustedString(
						"<div style='background-color: "+record.statusTextBgColor+";line-height: 16px;white-space: nowrap;padding: 4px;border-radius: 12px;color:"+record.statusTextColor+"'>"));
				stringBuilder.appendSafeHtml(htmlString);
				stringBuilder.appendSafeHtml(palms.exported.gwt.safehtml.shared.SafeHtmlUtils.fromTrustedString("</div>"));
			}
			statusCC.setRenderer(statusRenderer);

			const dieSetRenderer = new palms.exported.framework.grid.GridCellRenderer(ProductionControlGridLineEntity);
			dieSetRenderer.render = function(record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
				if(record.rowColor) parentStyle.backgroundColor = record.rowColor;
				stringBuilder.appendSafeHtml(palms.exported.gwt.safehtml.shared.SafeHtmlUtils.fromTrustedString(
						"<div style='background-color: "+record.dieSetTextBgColor+";line-height: 16px;white-space: nowrap;padding: 4px;border-radius: 12px;color:"+record.dieSetTextColor+"'>"));
				stringBuilder.appendSafeHtml(htmlString);
				stringBuilder.appendSafeHtml(palms.exported.gwt.safehtml.shared.SafeHtmlUtils.fromTrustedString("</div>"));
			}
			dieSetCC.setRenderer(dieSetRenderer)

			let instance = this;
			this.grid.onRowClick = function(rowIndex) {
				const selectedRecord = instance.grid.getRecordAt(rowIndex);
				instance.onRecordSelect(selectedRecord);
				instance.selectedRowIndex = rowIndex; // Track the selected row index
			}
            this.grid.onLinkClick = function(columnID, rowIndex) {
                if(columnID == 'planLotSize') {
                    const selectedRecord = instance.grid.getRecordAt(rowIndex);
                    const partsStock = [];
                    const materialStock = [];
                    const emptyPallets = [];
                    const currentShift = instance.currentShift;
           
                    selectedRecord.partsStock.forEach(function(id) {
                        var entity = currentShift.partsStock.find(x => x.id === id);
                        if(entity)
                            partsStock.push(entity);
                    });
                    selectedRecord.materialStock.forEach(function(id) {
                        var entity = currentShift.materialStock.find(x => x.id === id);
                        if(entity)
                            materialStock.push(entity);
                    });
                    selectedRecord.emptyPallets.forEach(function(id) {
                        var entity = currentShift.emptyPallets.find(x => x.id === id);
                        if(entity)
                            emptyPallets.push(entity);
                    });
 
                    let popupDialog = new LotSizeCalculationsPopup();
                    popupDialog.setGlassEnabled(true);
                    popupDialog.initialize();
                    popupDialog.setAnimationEnabled(true);
                    popupDialog.setAutoHideEnabled(true);
                    popupDialog.center();
                    popupDialog.showModal();
                    popupDialog.setRecords(partsStock, materialStock, emptyPallets);
                }
 
                if(columnID == 'loadTime') {
                    const selectedRecord = instance.grid.getRecordAt(rowIndex);
                    const loadTimeCalculations = [];
                    const plannedLine = [];
                    const currentShift = instance.currentShift;
           
                    selectedRecord.loadTimeCalculations.forEach(function(id) {
                        var entity = currentShift.loadTimeCalculations.find(x => x.id === id);
                        if(entity)
                            loadTimeCalculations.push(entity);
                    });
                    selectedRecord.plannedLine.forEach(function(id) {
                        var entity = currentShift.plannedLine.find(x => x.id === id);
                        if(entity)
                            plannedLine.push(entity);
                    });
                   
 
                    let popupDialog = new PlannedLineStopPopup();
                    popupDialog.setGlassEnabled(true);
                    popupDialog.initialize();
                    popupDialog.setAnimationEnabled(true);
                    popupDialog.setAutoHideEnabled(true);
                    popupDialog.center();
                    popupDialog.showModal();
                    popupDialog.setRecords(loadTimeCalculations,plannedLine);
                }
               
            }

			// this.grid.validateDropCell = function(fromRow, toRow) {
			// 	this.userLoggedInId = palms.exported.framework.PalmsUIApplication.getLoggedInUserID();
			// 	const fromRecord = instance.grid.getRecordAt(fromRow);
			// 	const toRecord = instance.grid.getRecordAt(toRow);
			// 	const fromStatus = fromRecord ? fromRecord.get('status') : null;
			// 	const toStatus = toRecord ? toRecord.get('status') : null;
				
			// 	const startTime = Date.now();
				
			// 	// Validation: Prevent drag and drop between different status values
			// 	if (fromStatus !== toStatus) {
			// 		alert("Cannot drag and drop between two different status values.");
			// 		return false;
			// 	}
				
			// 	// Get all records in the grid
			// 	const allRecords = instance.grid.getRecords();
			// 	console.log('All Records:', allRecords);
				
			// 	let previousShiftRecords = [];
			// 	let currentShiftRecords = [];
				
			// 	// Split records based on seq value
			// 	allRecords.forEach(record => {
			// 		if (!record || typeof record.get !== 'function') {
			// 			console.error("Invalid record encountered:", record);
			// 			return;
			// 		}
					
			// 		if (record.get('seq') > 0) {
			// 			currentShiftRecords.push(record);
			// 		} else {
			// 			previousShiftRecords.push(record);
			// 		}
			// 	});
				
			// 	console.log("Previous Shift Records:", previousShiftRecords);
			// 	console.log("Current Shift Records:", currentShiftRecords);
				
			// 	if (currentShiftRecords.length === 0 && previousShiftRecords.length > 0) {
			// 		console.log("No current shift records found. Treating all records as current shift.");
			// 		currentShiftRecords = allRecords;
			// 	}
				
			// 	const currentShiftLength = currentShiftRecords.length;
			// 	console.log("Current Shift Length:", currentShiftLength);
				
			// 	// Ensure fromRow and toRow are within bounds of currentShiftRecords
			// 	const currentShiftStartIndex = previousShiftRecords.length;
			// 	const adjustedFromRow = fromRow - currentShiftStartIndex;
			// 	const adjustedToRow = toRow - currentShiftStartIndex;
				
			// 	if (adjustedFromRow >= currentShiftLength || adjustedToRow >= currentShiftLength || adjustedFromRow < 0 || adjustedToRow < 0) {
			// 		alert("Invalid operation: Drag and drop should occur only within the current shift.");
			// 		return false;
			// 	}
				
			// 	// Perform drag and drop within currentShiftRecords
			// 	const movedRecord = currentShiftRecords.splice(adjustedFromRow, 1)[0];
			// 	currentShiftRecords.splice(adjustedToRow, 0, movedRecord);
				
			// 	// Reassign `seq` values for currentShiftRecords
			// 	for (let i = 0; i < currentShiftRecords.length; i++) {
			// 		if (currentShiftRecords[i] && typeof currentShiftRecords[i].set === 'function') {
			// 			currentShiftRecords[i].set('seq', i + 1);
			// 		} else {
			// 			console.error("Invalid record while setting seq:", currentShiftRecords[i]);
			// 		}
			// 	}
				
			// 	// Merge previousShiftRecords and currentShiftRecords
			// 	const mergedRecords = [...previousShiftRecords, ...currentShiftRecords];
				
			// 	// Update the grid
			// 	instance.grid.removeAll();
			// 	instance.grid.addRecords(mergedRecords);
			// 	instance.grid.renderGrid();
				
			// 	// Prepare API data
			// 	const updatedSeqData = currentShiftRecords.map(record => {
			// 		if (!record || !record.get('actualID') || !record.get('seq')) {
			// 			console.error("Invalid record while preparing data for API:", record);
			// 			return null;
			// 		}
			// 		return {
			// 			actualID: record.get('actualID'),
			// 			seq: record.get('seq')
			// 		};
			// 	}).filter(record => record !== null);
				
			// 	console.log(`Execution time: ${(Date.now() - startTime) / 1000} seconds`);
				
			// 	const requestBody = {
			// 		date: instance.currentShift.currentDate,
			// 		shift: instance.currentShift.shift,
			// 		line: instance.currentShift.line,
			// 		updatedSeqData: updatedSeqData,
			// 		user: this.userLoggedInId
			// 	};
				
			// 	const host = new ProductionHostDetails();
				
			// 	const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
			// 	proxy.url = host.url + "updatePartSeq";
			// 	proxy.payLoad = JSON.stringify(requestBody);
			// 	proxy.method = "POST";
			// 	proxy.contentType = "application/json; charset=utf-8";
			// 	proxy.timeout = 20000;
			// 	proxy.keepAlive = false;
				
			// 	const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
				
			// 	callback.onSuccess = function(responseData) {
			// 		instance.refreshShiftDetails();
			// 		alert("PartSeq updated successfully!");
			// 	};
				
			// 	callback.onFailure = function(errorDescription) {
			// 		console.error("Error updating PartSeq:", errorDescription);
			// 		alert("Failed to update PartSeq in the database.");
			// 	};
				
			// 	palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
				
			// 	return true;
			// };
			this.grid.validateDropCell = function(fromRow, toRow) {
	this.userLoggedInId = palms.exported.framework.PalmsUIApplication.getLoggedInUserID();
	const fromRecord = instance.grid.getRecordAt(fromRow);
	const toRecord = instance.grid.getRecordAt(toRow);
	const fromStatus = fromRecord ? fromRecord.get('status') : null;
	const toStatus = toRecord ? toRecord.get('status') : null;

	// Validation: Prevent drag and drop between different status values
	if (fromStatus !== toStatus) {
		alert("Cannot drag and drop between two different status values.");
		return false;
	}

	// Get all records from the grid
	const allRecords = instance.grid.getRecords();
	console.log("All Records:", allRecords);

	// Bounds check
	if (!fromRecord || !toRecord || fromRow < 0 || toRow < 0 || fromRow >= allRecords.length || toRow >= allRecords.length) {
		alert("Invalid operation: Index out of bounds.");
		return false;
	}

	// Perform drag and drop on the full list
	const movedRecord = allRecords.splice(fromRow, 1)[0];
	allRecords.splice(toRow, 0, movedRecord);

	// Find the original minimum seq before reassignment
	const minSeq = Math.min(...allRecords.map(r => r.get('seq')));

	// Reassign seq values starting from original minSeq
	for (let i = 0; i < allRecords.length; i++) {
		const record = allRecords[i];
		if (record && typeof record.set === 'function') {
			record.set('seq', minSeq + i);
		} else {
			console.error("Invalid record while setting seq:", record);
		}
	}

	// Update the grid
	instance.grid.removeAll();
	instance.grid.addRecords(allRecords);
	instance.grid.renderGrid();

	// Prepare API data
	const updatedSeqData = allRecords.map(record => {
		if (!record || !record.get('actualID') || typeof record.get('seq') !== 'number') {
			console.error("Invalid record while preparing data for API:", record);
			return null;
		}
		return {
			actualID: record.get('actualID'),
			seq: record.get('seq')
		};
	}).filter(record => record !== null);

	const requestBody = {
		date: instance.currentShift.currentDate,
		shift: instance.currentShift.shift,
		line: instance.currentShift.line,
		updatedSeqData: updatedSeqData,
		user: this.userLoggedInId
	};

	const host = new ProductionHostDetails();

	const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
	proxy.url = host.url + "updatePartSeq";
	proxy.payLoad = JSON.stringify(requestBody);
	proxy.method = "POST";
	proxy.contentType = "application/json; charset=utf-8";
	proxy.timeout = 20000;
	proxy.keepAlive = false;

	const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

	callback.onSuccess = function(responseData) {
		instance.refreshShiftDetails();
		alert("PartSeq updated successfully!");
	};

	callback.onFailure = function(errorDescription) {
		console.error("Error updating PartSeq:", errorDescription);
		alert("Failed to update PartSeq in the database.");
	};

	palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);

	return true;
};

			
			this.grid.setRowSelection(true);
			this.grid.initialize();
			this.grid.addStyleName('ProductionControlForm-Grid');
			this.grid.setDefaultCellValue('NA');
			this.grid.renderGrid();
		}
		
		if (true) {
			let instance = this;
			const addButton = new palms.client.framework.selfValidatingControls.ButtonControl();
			addButton.getCopyFormCellWidth = () => 'auto';
			addButton.setText('Add Other Parts');
			if(this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS"){
				addButton.setEnabled(true);
			}else{
				addButton.setEnabled(false);
			}
			gridPanel.add(addButton.asWidget());
			gridPanel.setRowHeight(addButton.asWidget(), 'auto');

			addButton.onClick = () => {
				try {
					const popupDialog = new AddOtherPartsPopup(instance); // Pass the whole instance
					popupDialog.setGlassEnabled(true);
					popupDialog.initialize();
					popupDialog.setAnimationEnabled(true);
					popupDialog.setAutoHideEnabled(true);
					popupDialog.center();
					popupDialog.showModal();
		
					if (instance.currentShift && instance.currentShift.otherParts) {
						popupDialog.setRecords(instance.currentShift.otherParts);
					} else {
						console.warn("instance.currentShift.otherParts is undefined.",popupDialog);
					}
				} catch (error) {
					alert("Error showing AddOtherPartsPopup: " + error.message);
				}
			};
		}

		if (true) {
			const scrollPanel2 = new palms.exported.gwt.user.client.ui.ScrollPanel();
			scrollPanel2.setSize('100%', '100%');
			scrollPanel2.addStyleName('ProductionControlForm-Scroll');
			scrollPanel2.addStyleName("EditorPanel");
			scrollPanel2.getStyle().overflowX = 'hidden';
			scrollPanel2.getStyle().overflowY = 'auto';
			super.addWidgetControl(scrollPanel2.asWidget(), 'EAST');
			super.setCellWidth(scrollPanel2.asWidget(), '25%');
			super.setCellHeight(scrollPanel2.asWidget(), '100%');
			scrollPanel2.add(this.editorPanel.asWidget());
			this.editorPanel.Initialize();
		}

		if (true) {
			const childPart = new palms.exported.framework.grid.EditableColumnConfiguration('childPart', 'Child Part', false, ColumnType.ReadOnlyString, true);
			const flvtLotSize = new palms.exported.framework.grid.EditableColumnConfiguration('flvtLotSize', 'FLVT Lot Size', false, ColumnType.ReadOnlyInteger, true);
			const bomSeq = new palms.exported.framework.grid.EditableColumnConfiguration('bomSeq', 'BOM Sequence', false, ColumnType.ReadOnlyInteger, true);
			const safetyStock = new palms.exported.framework.grid.EditableColumnConfiguration('safetyStock', 'Safety Stock', false, ColumnType.ReadOnlyInteger, true);
			const prodTriggerHr = new palms.exported.framework.grid.EditableColumnConfiguration('prodTriggerHr', 'Prod Trigger Hr', false, ColumnType.ReadOnlyInteger, true);
			const projectedStock = new palms.exported.framework.grid.EditableColumnConfiguration('projectedStock', 'Projected Stock', false, ColumnType.ReadOnlyInteger, true);
			const material = new palms.exported.framework.grid.EditableColumnConfiguration('material', 'Material', false, ColumnType.ReadOnlyString, true);
			const onOrder = new palms.exported.framework.grid.EditableColumnConfiguration('onOrder', 'On Order', false, ColumnType.ReadOnlyInteger, true);
			const stock = new palms.exported.framework.grid.EditableColumnConfiguration('stock', 'Stock', false, ColumnType.ReadOnlyInteger, true);

			this.childGrid = new palms.exported.framework.grid.Grid('FLVT Parts and Parts Below Safety Stock', ProductionControlGridLineChildEntity);
			this.childGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('dieBay', 'Die Bay', false, ColumnType.ReadOnlyString, true));
			this.childGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('dieSet', 'Die Set', false, ColumnType.ReadOnlyString, true));
			this.childGrid.addColumn(childPart);
			this.childGrid.addColumn(flvtLotSize);
			this.childGrid.addColumn(bomSeq);
			this.childGrid.addColumn(safetyStock);
			this.childGrid.addColumn(prodTriggerHr);
			this.childGrid.addColumn(projectedStock);
			this.childGrid.addColumn(material);
			this.childGrid.addColumn(onOrder);
			this.childGrid.addColumn(stock);
			
			if(this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS"){
				this.childGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('actionButton', 'Action', false, ColumnType.Button, true));
			}

			this.setRowHighlightRenderer(childPart);
			this.setRowHighlightRenderer(flvtLotSize);
			this.setRowHighlightRenderer(bomSeq);
			this.setRowHighlightRenderer(safetyStock);
			this.setRowHighlightRenderer(prodTriggerHr);
			this.setRowHighlightRenderer(projectedStock);
			this.setRowHighlightRenderer(material);
			this.setRowHighlightRenderer(onOrder);
			this.setRowHighlightRenderer(stock);

			this.childGrid.addRowSpanColumn('dieBay');
			this.childGrid.addRowSpanColumn('dieSet');

			if(this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS"){
				this.childGrid.addRowSpanColumn('actionButton');
			}
			

			const scrollPanel = new palms.exported.gwt.user.client.ui.ScrollPanel();
			scrollPanel.setSize('100%', '100%');
			scrollPanel.addStyleName('ProductionControlForm-Scroll');
			scrollPanel.getStyle().overflowX = 'hidden';
			scrollPanel.getStyle().overflowY = 'auto';
			scrollPanel.add(this.childGrid.asWidget());
			gridPanel.add(scrollPanel.asWidget());
			gridPanel.setCellWidth(scrollPanel.asWidget(), '100%');
			gridPanel.setCellHeight(scrollPanel.asWidget(), 'auto');
			gridPanel.setRowHeight(scrollPanel.asWidget(), '60%');

			// Child grid button click handler for FLVT Add to Plan action
			this.childGrid.onRowButtonClick = (columnID, rowIndex) => {
				const selectedRecord = this.childGrid.getRecordAt(rowIndex);

				if (selectedRecord) {
					const dieSet = selectedRecord.dieSet;
					const flvtLotSize = selectedRecord.flvtLotSize;
					const currentDate = this.currentShift.currentDate;
					const shift = this.currentShift.shift;
					const line = this.currentShift.line;

					console.log(`Selected dieSet: ${dieSet}`);
					console.log(`FLVT Lot Size: ${flvtLotSize}`);
					console.log(`Current Date: ${currentDate}`);
					console.log(`Shift: ${shift}`);
					console.log(`Line: ${line}`);

					const dataToSave = {
						dieSet: dieSet,
						flvtLotSize: flvtLotSize === '-'? 0 : flvtLotSize,
						date: currentDate,
						shift: shift,
						line: line,
						user: this.userLoggedInId
					};
					const host = new ProductionHostDetails();

					const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
					//proxy.url = "http://localhost:8081/addFLVTAndPartsBelowSafetyStock";
					proxy.url = host.url + "addFLVTAndPartsBelowSafetyStock"
					proxy.payLoad = JSON.stringify(dataToSave);
					proxy.method = "POST";
					proxy.contentType = "application/json; charset=utf-8";
					proxy.timeout = 20000;
					proxy.keepAlive = false;

					const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

					callback.onSuccess = function(responseData) {
						alert(responseData);
						// Call refreshShiftDetails to refresh the screen after adding FLVT
						this.refreshShiftDetails(); // Refreshing the screen with updated data
					}.bind(this); // Ensure correct context

					callback.onFailure = function(errorDescription) {
						console.error("Error adding FLVT and parts:", errorDescription);
						alert("Failed to add FLVT and parts. Please try again.");
					};

					palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);

				} else {
					alert('No record found for the selected row.');
				}
			};

			this.childGrid.removeAll();
			this.childGrid.initialize();
			this.childGrid.addHeaderStyleName('FLVTGridHeader');
			this.childGrid.setDefaultCellValue('NA');
			this.childGrid.renderGrid();
		}
		

	}

refreshShiftDetails() {
    const requestBody = {
        lineId: this.currentShift.lineID // Use lineID from currentShift
    };

	const host = new ProductionHostDetails();
    // Set up the web service proxy for the API call
    const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
    //proxy.url = "http://localhost:8081/getShiftDetails"; // Backend service URL
	proxy.url = host.url + "getShiftDetails";
    proxy.payLoad = JSON.stringify(requestBody); // Data payload to be sent
    proxy.method = "POST"; // HTTP method
    proxy.contentType = "application/json; charset=utf-8"; // Content type
    proxy.timeout = 20000; // Request timeout in milliseconds
    proxy.keepAlive = false; // Keep-alive setting

    const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

    callback.onSuccess = function(responseData) {
        const shiftDetails = JSON.parse(responseData);

        // Modify the structure of updatedFilter as required
        const updatedFilter = {
            header: {
                currentDate: shiftDetails.currentDate,
                currentTime: shiftDetails.currentTime,
                shift: shiftDetails.shift,
                line: shiftDetails.line,
				user:  this.userLoggedInId,
            }
        };

        // Call loadData with updated filter
        if (typeof this.loadData === 'function') {
            this.loadData(JSON.stringify(updatedFilter));
        } else {
            console.error("loadData method not found in instance context.");
        }
    }.bind(this); // Ensure correct context binding

    callback.onFailure = function(errorDescription) {
        console.error("Error fetching updated shift details:", errorDescription);
        alert("Failed to fetch updated shift details.");
    };

    // Invoke the web service with the configured proxy and callback
    palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
}


	setRowHighlightRenderer(cc) {
		const renderer = new palms.exported.framework.grid.GridCellRenderer(ProductionControlGridLineEntity);
		renderer.render = function(record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
			if(columnID == 'projectedStock') {
				if (record.projectedStockCellColor) parentStyle.backgroundColor = record.projectedStockCellColor;
				if (record.projectedStockTextColor) parentStyle.color = record.projectedStockTextColor;
			}
			else if(record.rowHighlightColor) parentStyle.backgroundColor = record.rowHighlightColor;
		}
		cc.setRenderer(renderer);
	}

	setRowColorRenderer(cc) {
		const renderer = new palms.exported.framework.grid.GridCellRenderer(ProductionControlGridLineEntity);
		renderer.render = function(record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
			if(record.rowColor) parentStyle.backgroundColor = record.rowColor;
		}
		cc.setRenderer(renderer);
	}
  
	getGridPanel() {
		const vPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
		vPanel.setWidth('100%');
		vPanel.setHeight('100%');
		vPanel.addStyleName('Grid-VerticalPanel');
		return vPanel;
	}

	onRecordSelect(selectedRecord) {
		this.editorPanel.setRecordData(selectedRecord);
	}

	loadData(filter) {
		const host = new ProductionHostDetails();
		this.filter = filter || this.filter;
	
		// Set up the web service proxy
		var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
		//proxy.url = "http://localhost:8081/currentShiftDetails"; // Backend service URL
		proxy.url = host.url + "currentShiftDetails";
		proxy.payLoad = filter; // Data payload to be sent
		proxy.method = "POST"; // HTTP method
		proxy.contentType = "application/json; charset=utf-8"; // Content type
		proxy.timeout = 20000; // Request timeout in milliseconds
		proxy.keepAlive = false; // Keep-alive setting
		
		let instance = this; // Preserve the current context
		var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response
		
		// On success, show the response message, clear the form, and re-enable buttons
		callback.onSuccess = function(responseData) {
			if (!responseData.startsWith("{") && !responseData.startsWith("[")) {
                alert(responseData); // Show alert with the message
                return;
            }
			var responseObj = JSON.parse(responseData);
			instance.currentShift.populateFields(responseObj);
	
			instance.headerRecordList.setRecordData(instance.currentShift);
			
			instance.grid.removeAll(); //nl
			instance.grid.addRecords(instance.currentShift.grid);
			instance.grid.renderGrid();
			instance.editorPanel.setRecordData(null);
			if (instance.selectedRowIndex !== null && instance.grid.getRecordAt(instance.selectedRowIndex)) {
				instance.grid.selectRow(instance.selectedRowIndex); 
				const selectedRecord = instance.grid.getRecordAt(instance.selectedRowIndex);
				instance.editorPanel.setRecordData(selectedRecord);
			}
			
			instance.childGrid.removeAll(); //nl
			instance.childGrid.addRecords(instance.currentShift.flvtParts);
			instance.childGrid.renderGrid();    
			if (instance.editorPanel && instance.editorPanel.actionButton) {
				instance.editorPanel.actionButton.setEnabled(true);
			}        
		}
		
		// On failure, show the error message and re-enable buttons
		callback.onFailure = function(errorDescription) {
			alert("Failure: " + errorDescription);
		}
	
		// Invoke the web service with the configured proxy and callback
		palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
	}
}