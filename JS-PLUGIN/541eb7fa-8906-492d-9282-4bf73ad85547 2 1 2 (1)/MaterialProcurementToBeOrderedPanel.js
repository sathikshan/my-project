class MaterialProcurementToBeOrderedPanel extends palms.exported.framework.ActionForm {
	constructor() {
		super();

		this.entity = new MaterialProcurementToBeOrderedEntity();
		this.LineId = '';
		this.OrderCycle = "";
		this.OrderCycleCodeList = [];
		this.adjustKanBans = false;
		this.userLoggedInRole = palms.exported.framework.PalmsUIApplication.getUserRoleCode();
	}

	initialize() {
		super.initialize();
		super.addStyleName('MaterialProcurementToBeOrderedPanel');

		const scrollPanel = new palms.exported.gwt.user.client.ui.ScrollPanel();
		scrollPanel.setSize('100%', '100%');
		scrollPanel.addStyleName('MaterialProcurementToBeOrderedPanel-Scroll');
		scrollPanel.getStyle().overflowX = 'hidden';
		scrollPanel.getStyle().overflowY = 'auto';
		super.addWidgetControl(scrollPanel.asWidget(), 'CENTER');
		super.setCellWidth(scrollPanel.asWidget(), '75%');
		super.setCellHeight(scrollPanel.asWidget(), '100%');

		const gridPanel = this.getGridPanel();
		scrollPanel.add(gridPanel.asWidget());

		if (true) {
			this.grid = new palms.exported.framework.grid.Grid("Material Procurement Grid", MaterialProcurementGridLineEntity);

			const dieSetCC = new palms.exported.framework.grid.EditableColumnConfiguration('dieSet', 'Die Set', false, ColumnType.ReadOnlyString, true);
			const ptnLotSizeCC = new palms.exported.framework.grid.EditableColumnConfiguration('ptnLotSize', 'Ptn Lot Size', false, ColumnType.ReadOnlyInteger, true);
			const ptnStartCC = new palms.exported.framework.grid.EditableColumnConfiguration('ptnStart', 'Ptn Start Date & Time', false, ColumnType.ReadOnlyString, true);
			const poTriggerHrCC = new palms.exported.framework.grid.EditableColumnConfiguration('poTriggerHr', 'Material Trigger Hr', false, ColumnType.ReadOnlyInteger, true);
			const materialCC = new palms.exported.framework.grid.EditableColumnConfiguration('material', 'Material', false, ColumnType.ReadOnlyString, true);
			const skidQtyCC = new palms.exported.framework.grid.EditableColumnConfiguration('skidQty', 'SKID Qty', false, ColumnType.ReadOnlyInteger, true);
			const recQtyCC = new palms.exported.framework.grid.EditableColumnConfiguration('recQty', 'Rec Qty', false, ColumnType.LinkString, true);
			const adjustmentKanbansCC = new palms.exported.framework.grid.EditableColumnConfiguration('adjustmentKanbans', 'Adjustment Kanbans', false, ColumnType.TextBoxInteger, true);
			const orderedQtyCC = new palms.exported.framework.grid.EditableColumnConfiguration('orderedQty', 'Ordered Qty', false, ColumnType.ReadOnlyInteger, true);
			const statusCC = new palms.exported.framework.grid.EditableColumnConfiguration('status', 'Status', false, ColumnType.ReadOnlyInteger, true);
			const orderCC = new palms.exported.framework.grid.EditableColumnConfiguration('order', 'Order', false, ColumnType.Button, true);
			const skipCC = new palms.exported.framework.grid.EditableColumnConfiguration('skip', 'Skip', false, ColumnType.Button, true);

			this.grid.addColumn(dieSetCC);
			this.grid.addColumn(ptnLotSizeCC);
			this.grid.addColumn(ptnStartCC);
			this.grid.addColumn(poTriggerHrCC);
			this.grid.addColumn(materialCC);
			this.grid.addColumn(skidQtyCC);
			this.grid.addColumn(recQtyCC);
			this.grid.addColumn(adjustmentKanbansCC);
			this.grid.addColumn(orderedQtyCC);
			this.grid.addColumn(statusCC);
			if (this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS") {
				this.grid.addColumn(orderCC);
				this.grid.addColumn(skipCC);
			}

			this.grid.addRowSpanColumn('dieSet');
			this.grid.addRowSpanColumn('ptnLotSize');
			this.grid.addRowSpanColumn('ptnStart');
			this.grid.addRowSpanColumn('poTriggerHr');

			gridPanel.add(this.grid.asWidget());
			gridPanel.setCellWidth(this.grid.asWidget(), '100%');
			gridPanel.setCellHeight(this.grid.asWidget(), '100%');

			//this.grid.onRowButtonClick = (columnID, rowIndex) => alert("columnID : " + columnID + ",	rowIndex: " + rowIndex);
			let instance = this;
			if (instance.userLoggedInRole === "TPS" || instance.userLoggedInRole === "SSPCS") {
				this.grid.onRowButtonClick = (columnID, rowIndex) => {
					if (columnID == 'order') {
						try {
							let convertStrTimeToHrMinSec = (strTime) => {
								strTime = strTime.split(':');
								return Number(strTime[0]) * 3600 + Number(strTime[1]) * 60 + Number(strTime[2])
							}
							if (instance.OrderCycle === "") {
								alert("Please select the 'OrderCycle' to proceed to Order the material.");
							} else {
								let filterOrderCycle = instance.OrderCycleCodeList.filter(el => el.id === instance.OrderCycle);
								if (filterOrderCycle.length > 0) {
									let cycleTime = filterOrderCycle[0].code.split('-');
									let cycleEndTimeInSec = convertStrTimeToHrMinSec(cycleTime[2]);
									let date = new Date();
									let ccHour = date.getHours();
									let ccMin = date.getMinutes();
									let ccSec = date.getSeconds();
									let currTime = ccHour * 3600 + ccMin * 60 + ccSec;
									if (cycleEndTimeInSec >= currTime) {
										let data = instance.entity.grid[rowIndex];
										if (data.status === "Skipped") {
											alert("Material: " + data.material + " is already skipped.");
										} else {
											const popupDialog = new OrderMaterialPopup(instance);
											popupDialog.setGlassEnabled(true);
											popupDialog.initialize();
											popupDialog.setAnimationEnabled(true);
											popupDialog.setAutoHideEnabled(true);
											popupDialog.center();
											popupDialog.showModal();

											let filetredData = instance.entity.recommendationCalculations.filter(data => data.id === instance.entity.grid[rowIndex].id1)
											popupDialog.setRecord(data.id1, data.material, data.orderedQtyValue, data.recommQtyValue, data.stock, filetredData[0].onOrderQty, filetredData[0].kanbansReturned, data.status, instance.OrderCycleCodeList, instance.OrderCycle);
										}
									} else {
										alert("The " + filterOrderCycle[0].code + " time has already passed. Please select different Order Cycle to Order Material.");
									}
								}
							}
						} catch (error) {
							alert("Error showing OrderMaterialPopup : " + error.message);
						};
					} else if (columnID == 'skip') {
						try {

							let convertStrTimeToHrMinSec = (strTime) => {
								strTime = strTime.split(':');
								return Number(strTime[0]) * 3600 + Number(strTime[1]) * 60 + Number(strTime[2])
							}
							if (instance.OrderCycle === "") {
								alert("Please select the 'OrderCycle' to proceed to skip the material.");
							} else {
								let filterOrderCycle = instance.OrderCycleCodeList.filter(el => el.id === instance.OrderCycle);
								if (filterOrderCycle.length > 0) {
									let cycleTime = filterOrderCycle[0].code.split('-');
									let cycleEndTimeInSec = convertStrTimeToHrMinSec(cycleTime[2]);
									let date = new Date();
									let ccHour = date.getHours();
									let ccMin = date.getMinutes();
									let ccSec = date.getSeconds();
									let currTime = ccHour * 3600 + ccMin * 60 + ccSec;
									if (cycleEndTimeInSec >= currTime) {
										let data = instance.entity.grid[rowIndex];
										if (data.status === "Skipped") {
											alert("Material: " + data.material + " is already skipped.");
										} else {
											const popupDialog = new skipMaterialPopup(instance);
											popupDialog.setGlassEnabled(true);
											popupDialog.initialize();
											popupDialog.setAnimationEnabled(true);
											popupDialog.setAutoHideEnabled(true);
											popupDialog.center();
											popupDialog.showModal();
											popupDialog.setRecord(data.id1, data.material, data.status, instance.OrderCycleCodeList, instance.OrderCycle);
										}
									} else {
										alert("The " + filterOrderCycle[0].code + " time has already passed. Please select different Order Cycle to skip Material.");
									}
								}
							}
						} catch (error) {
							alert("Error showing skipMaterialPopup: " + error.message);
						};
					}
				}
			}

			this.grid.onLinkClick = function (columnID, rowIndex) {
				if (columnID == 'recQty') {


					let popupDialog = new RecommendationPopup('toBeOrdered');
					popupDialog.setGlassEnabled(true);
					popupDialog.initialize();
					popupDialog.setAnimationEnabled(true);
					popupDialog.setAutoHideEnabled(true);
					popupDialog.center();
					popupDialog.showModal();
					let filetredData = instance.entity.recommendationCalculations.filter(data => data.id === instance.entity.grid[rowIndex].id1)
					popupDialog.setRecords(filetredData);
				}

			}

			this.grid.onCellFocus = function (rowIndex, columnID) {
				var value = instance.grid.getCellValue(rowIndex, columnID);
				var intValue = parseInt(value);
				var text = null;
				if (isNaN(intValue)) {
					text = "";
				} else {
					text = intValue + "";
				}
				if (this.adjustKanBans) {
					instance.grid.setCellValue(rowIndex, columnID, text);
					this.adjustKanBans = false;
				}
			};
			this.grid.onCellBlur = function (rowIndex, columnID) {
				var value = instance.grid.getCellValue(rowIndex, columnID);
				var intValue = parseInt(value);
				var text = null;
				var record = instance.grid.getRecordAt(rowIndex);
				var orderedQty = record ? record.get('orderedQty') : 0;
				if (isNaN(intValue)) {
					text = 0;
				} else {
					text = intValue;
				}
				//this.loadData();

			};
			this.grid.onValueChange = function (rowIndex, columnID) {
				var value = instance.grid.getCellValue(rowIndex, "adjustmentKanbans");
				var getStatus = instance.grid.getCellValue(rowIndex, "status");
				var intValue = parseInt(value);
				var record = instance.grid.getRecordAt(rowIndex);
				let recommQtyValue = record.recommQtyValue ? record.recommQtyValue : 0;
				let skidQty = record.skidQty ? record.skidQty : 0;
				let orderedQty = record.orderedQty ? record.orderedQtyValue + (intValue - Number(record.prevAdjustmentKanbans)) * skidQty : 0;
				let text;

				if (instance.OrderCycle === "") {
					alert("Please select the 'OrderCycle' to proceed with Material Kanbans Adjustment.");
					instance.loadData();
				} else {
					let convertStrTimeToHrMinSec = (strTime) => {
						strTime = strTime.split(':');
						return Number(strTime[0]) * 3600 + Number(strTime[1]) * 60 + Number(strTime[2])
					}

					let filterOrderCycle = instance.OrderCycleCodeList.filter(el => el.id === instance.OrderCycle);
					if (filterOrderCycle.length > 0) {
						let cycleTime = filterOrderCycle[0].code.split('-');
						let cycleEndTimeInSec = convertStrTimeToHrMinSec(cycleTime[2]);
						let date = new Date();
						let ccHour = date.getHours();
						let ccMin = date.getMinutes();
						let ccSec = date.getSeconds();
						let currTime = ccHour * 3600 + ccMin * 60 + ccSec;
						if (cycleEndTimeInSec >= currTime) {
							if (getStatus != "To Be Ordered") {
								alert("Kanbans only can be adjusted if Material Status is 'To Be Ordered' but Material: " + record.material + " is already " + getStatus);
								instance.loadData();
							} else if (isNaN(intValue)) {
								text = 0;
								alert("Please enter a valid integer number to adjust the kanbans.");
								instance.loadData();
							} else {
								text = Math.floor(orderedQty / skidQty) + "(" + orderedQty + ")";
								if (confirm("Are you sure you want to adjust the ordered Qty?")) {
									this.adjustKanBans = true;
									const host = new MaterialHostDetails();
									//instance.grid.setCellValue(rowIndex, "orderedQty", text);
									// localhost:8081/path
									var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
									proxy.url = host.url + "toBeOrdered/orderedQtyAdjustment"; // Backend service URL
									proxy.payLoad = JSON.stringify({ OrderedListID: record.id1, OrderedQty: orderedQty, AdjustmentKanbans: intValue }); // Data payload to be sent
									proxy.method = "PUT"; // HTTP method
									proxy.contentType = "application/json; charset=utf-8"; // Content type
									proxy.timeout = 20000; // Request timeout in milliseconds
									proxy.keepAlive = false; // Keep-alive setting

									var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response
									callback.onSuccess = function (responseData) {
										//alert(responseData);
										instance.loadData();

									}
									callback.onFailure = function (errorDescription) {
										alert("Failure: " + errorDescription);
									}
									palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);

								} else {
									instance.loadData();
								}
							}
						} else {
							alert("The " + filterOrderCycle[0].code + " time has already passed. Please select different Order Cycle to Adjust Material to the Material Procurement Grid.");
							instance.loadData();
						}
					}
				}

			};

			const statusTboRenderer = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
			statusTboRenderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
				if (record.statusCellColorTBO) parentStyle.backgroundColor = record.statusCellColorTBO;
				if (record.statusTextColorTBO) parentStyle.color = record.statusTextColorTBO;
				parentStyle.fontSize = "18px"
			}

			const chnageFontRenderer = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
			chnageFontRenderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
				parentStyle.fontSize = "18px";
			}

			statusCC.setRenderer(statusTboRenderer);
			// dieSetCC.setRenderer(chnageFontRenderer);
			// ptnLotSizeCC.setRenderer(chnageFontRenderer);
			// ptnStartCC.setRenderer(chnageFontRenderer);
			// poTriggerHrCC.setRenderer(chnageFontRenderer);
			// materialCC.setRenderer(chnageFontRenderer);
			// skidQtyCC.setRenderer(chnageFontRenderer);
			// orderedQtyCC.setRenderer(chnageFontRenderer);
			// recQtyCC.setRenderer(chnageFontRenderer);
			// adjustmentKanbansCC.setRenderer(chnageFontRenderer);
			// orderDateAndTimeCC.setRenderer(chnageFontRenderer);
			// refPOQtyCC.setRenderer(chnageFontRenderer);
			// flagCC.setRenderer(chnageFontRenderer);
			//orderCC.setRenderer(chnageFontRenderer);
			//skipCC.setRenderer(chnageFontRenderer);

			this.grid.setRowSelection(false);
			this.grid.initialize();
			this.grid.addStyleName('ProductionControlForm-Grid');
			this.grid.setDefaultCellValue('NA');
			this.grid.renderGrid();
		}

		if (true) {
			let instance = this;
			const addButton = new palms.client.framework.selfValidatingControls.ButtonControl();
			addButton.getCopyFormCellWidth = () => 'auto';
			addButton.setWidth('auto');
			addButton.setText('Add Other Material');
			if (instance.userLoggedInRole === "TPS" || instance.userLoggedInRole === "SSPCS") {
				let convertStrTimeToHrMinSec = (strTime) => {
					strTime = strTime.split(':');
					return Number(strTime[0]) * 3600 + Number(strTime[1]) * 60 + Number(strTime[2])
				}

				let filterOrderCycle = instance.OrderCycleCodeList.filter(el => el.id === instance.OrderCycle);
				if (filterOrderCycle.length > 0) {
					let cycleTime = filterOrderCycle[0].code.split('-');
					let cycleEndTimeInSec = convertStrTimeToHrMinSec(cycleTime[2]);
					let date = new Date();
					let ccHour = date.getHours();
					let ccMin = date.getMinutes();
					let ccSec = date.getSeconds();
					let currTime = ccHour * 3600 + ccMin * 60 + ccSec;
					if (currTime >= cycleEndTimeInSec) {
						addButton.setEnabled(true);
					} else {
						addButton.setEnabled(false);
					}
				}

			} else {
				addButton.setEnabled(false);
			}

			gridPanel.add(addButton.asWidget());
			addButton.onClick = () => {
				try {
					const popupDialog = new MaterialAddOtherPartsPopup(instance);
					popupDialog.setGlassEnabled(true);
					popupDialog.initialize();
					popupDialog.setAnimationEnabled(true);
					popupDialog.setAutoHideEnabled(true);
					popupDialog.center();
					popupDialog.showModal();

					if (instance.entity.addOtherMaterial) {
						popupDialog.setRecords(instance.entity.addOtherMaterial, instance.LineId, instance.OrderCycle, instance.OrderCycleCodeList);
					} else {
						console.warn("instance.currentShift.otherParts is undefined.", popupDialog);
					}
				} catch (error) {
					alert("Error showing AddOtherPartsPopup: " + error.message);
				}
			};
		}

		if (true) {
			const yzaNoCC = new palms.exported.framework.grid.EditableColumnConfiguration('YZANo', 'YZA No', false, ColumnType.ReadOnlyString, true);
			const childPartCC = new palms.exported.framework.grid.EditableColumnConfiguration('childPart', 'Material', false, ColumnType.ReadOnlyString, true);
			const currentStockCC = new palms.exported.framework.grid.EditableColumnConfiguration('currentStock', 'Current Stock', false, ColumnType.ReadOnlyInteger, true);
			const pullRateCC = new palms.exported.framework.grid.EditableColumnConfiguration('pullRate', 'Pull Rate', false, ColumnType.ReadOnlyInteger, true);
			const poTriggerHrCC = new palms.exported.framework.grid.EditableColumnConfiguration('poTriggerHr', 'Material Trigger Hr', false, ColumnType.ReadOnlyInteger, true);
			//const safetyStockCC = new palms.exported.framework.grid.EditableColumnConfiguration('safetyStock', 'Safety Stock', false, ColumnType.ReadOnlyInteger, true);
			const projectedStockCC = new palms.exported.framework.grid.EditableColumnConfiguration('projectedStock', 'Projected Stock', false, ColumnType.ReadOnlyInteger, true);

			this.childGrid = new palms.exported.framework.grid.Grid('FLVT Materials and Materials Below Safety Stock', MaterialProcurementGridLineEntity);
			this.childGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('dieSet', 'Die Set', false, ColumnType.ReadOnlyString, true));
			this.childGrid.addColumn(yzaNoCC);
			this.childGrid.addColumn(childPartCC);
			this.childGrid.addColumn(currentStockCC);
			this.childGrid.addColumn(pullRateCC);
			this.childGrid.addColumn(poTriggerHrCC);
			//this.childGrid.addColumn(safetyStockCC);
			this.childGrid.addColumn(projectedStockCC);
			if (this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS") {
				this.childGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('actionButton', 'Action', false, ColumnType.Button, true));
			}

			this.childGrid.addRowSpanColumn('dieSet');
			if (this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS") {
				this.childGrid.addRowSpanColumn('actionButton');
			}

			this.setRowColorRenderer(yzaNoCC);
			this.setRowColorRenderer(childPartCC);
			this.setRowColorRenderer(currentStockCC);
			this.setRowColorRenderer(pullRateCC);
			this.setRowColorRenderer(poTriggerHrCC);
			//this.setRowColorRenderer(safetyStockCC);

			const projectedStockRenderer = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
			projectedStockRenderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
				if (record.projectedStockCellColor) parentStyle.backgroundColor = record.projectedStockCellColor;
				if (record.projectedStockTextColor) parentStyle.color = record.projectedStockTextColor;
			}
			projectedStockCC.setRenderer(projectedStockRenderer);


			gridPanel.add(this.childGrid.asWidget());
			gridPanel.setCellWidth(this.childGrid.asWidget(), '100%');
			gridPanel.setCellHeight(this.childGrid.asWidget(), 'auto');

			if (this.userLoggedInRole === "TPS" || this.userLoggedInRole === "SSPCS") {
				this.childGrid.onRowButtonClick = (columnID, rowIndex) => {
					const host = new MaterialHostDetails();
					let addToPlanRecord = this.entity.flvtPartsAndPartsBelowSafetyStock[rowIndex];
					if (this.OrderCycle === "") {
						alert("Please select the 'OrderCycle' to proceed with adding FLVT Materials to the Material Procurement Grid.");
					} else {
						let convertStrTimeToHrMinSec = (strTime) => {
							strTime = strTime.split(':');
							return Number(strTime[0]) * 3600 + Number(strTime[1]) * 60 + Number(strTime[2])
						}

						let filterOrderCycle = this.OrderCycleCodeList.filter(el => el.id === this.OrderCycle);
						if (filterOrderCycle.length > 0) {
							let cycleTime = filterOrderCycle[0].code.split('-');
							let cycleEndTimeInSec = convertStrTimeToHrMinSec(cycleTime[2]);
							let date = new Date();
							let ccHour = date.getHours();
							let ccMin = date.getMinutes();
							let ccSec = date.getSeconds();
							let currTime = ccHour * 3600 + ccMin * 60 + ccSec;
							if (cycleEndTimeInSec >= currTime) {
								if (confirm("Are you sure? you want to add DieSet " + addToPlanRecord.dieSet + "  to Material Procurement Grid.")) {
									var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
									proxy.url = host.url + "materialProcurement/addToOrder"; // Backend service URL
									proxy.payLoad = JSON.stringify({ DieSet: addToPlanRecord.dieSet, id: addToPlanRecord.pqId, LineId: this.LineId, OrderCycleID: this.OrderCycle }); // Data payload to be sent
									proxy.method = "POST"; // HTTP method
									proxy.contentType = "application/json; charset=utf-8"; // Content type
									proxy.timeout = 20000; // Request timeout in milliseconds
									proxy.keepAlive = false; // Keep-alive setting

									var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response
									let instance = this;
									callback.onSuccess = function (responseData) {
										alert(responseData);
										instance.loadData();
									}
									callback.onFailure = function (errorDescription) {
										alert("Failure: " + errorDescription);
									}
									palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
									
								}
							} else {
								alert("The " + filterOrderCycle[0].code + " time has already passed. Please select different Order Cycle to Add Material to the Material Procurement Grid.");
							}
						}


					}
				};
			}

			this.childGrid.removeAll();
			this.childGrid.initialize();
			this.childGrid.addHeaderStyleName('FLVTGridHeader');
			this.childGrid.setDefaultCellValue('NA');
			this.childGrid.renderGrid();
		}

		this.loadData();
	}

	setRowColorRenderer(cc) {
		const renderer = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
		renderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
			if (record.rowHighlightColor) parentStyle.backgroundColor = record.rowHighlightColor;
		}
		cc.setRenderer(renderer);
	}

	getGridPanel() {
		const vPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
		vPanel.setWidth('100%');
		vPanel.setHeight('100%');
		vPanel.addStyleName('Grid-Panel');
		return vPanel;
	}

	loadData() {
		var json = {
			LineId: this.LineId,
			OrderCycleID: this.OrderCycle
		};
		if (this.LineId) {
			const host = new MaterialHostDetails();
			// Set up the web service proxy
			var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
			proxy.url = host.url + "materialProcurement/toBeOrdered"; // Backend service URL
			proxy.payLoad = JSON.stringify(json); // Data payload to be sent
			proxy.method = "POST"; // HTTP method
			proxy.contentType = "application/json; charset=utf-8"; // Content type
			proxy.timeout = 20000; // Request timeout in milliseconds
			proxy.keepAlive = false; // Keep-alive setting

			var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response
			let instance = this;
			// On success, show the response message, clear the form, and re-enable buttons
			callback.onSuccess = function (responseData) {
				var responseObj = JSON.parse(responseData);
				if (typeof (responseObj) == "string") {
					//alert(responseObj);

				} else {
					instance.grid.removeAll();
					instance.childGrid.removeAll();
					instance.entity.populateFields(responseObj);

					instance.grid.addRecords(instance.entity.grid);
					instance.grid.renderGrid();
					//instance.entity.flvtPartsAndPartsBelowSafetyStock
					instance.childGrid.addRecords(instance.entity.flvtPartsAndPartsBelowSafetyStock);
					instance.childGrid.renderGrid();
				}
			}

			// On failure, show the error message and re-enable buttons
			callback.onFailure = function (errorDescription) {
				alert("Failure: " + errorDescription);
			}

			// Invoke the web service with the configured proxy and callback
			palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
		}
	}

	setRecordData(LineId, OrderCycle, OrderCycleCodeList) {
		this.LineId = LineId ? LineId : this.LineId;
		this.OrderCycle = OrderCycle;
		this.OrderCycleCodeList = OrderCycleCodeList;


		// super.setRecordData(recordData);

		// //var currentDate = new Date(recordData.currentDate);
		// //this.dtCurrentDate.setDateValue("/Date(" + +currentDate + ")/");

		// super.setDropDownValue(this.ddLine, recordData.line);
		// super.setDropDownValue(this.ddOrderCycle, recordData.orderCycle);
	}

	getRecordData() {
		// let jsonObject = super.getRecordData();

		// //jsonObject.currentDate = this.dtCurrentDate.getDateValue();
		// jsonObject.line = (this.ddLine.getSelectedIndex() == 0 ? null : (this.ddLine.getValue(this.ddLine.getSelectedIndex())));
		// jsonObject.orderCycle = (this.ddOrderCycle.getSelectedIndex() == 0 ? null : parseInt(this.ddOrderCycle.getValue(this.ddOrderCycle.getSelectedIndex())));

		// return jsonObject;
	}

	refressPage() {
		this.grid.removeAll();
		this.grid.setRowSelection(false);
		this.grid.initialize();
		this.grid.addStyleName('ProductionControlForm-Grid');
		this.grid.setDefaultCellValue('NA');
		this.grid.renderGrid();
	}


}