class MaterialProcurementEditorPanel extends palms.exported.gwt.user.client.ui.VerticalPanel {
	constructor() {
		super();
		this.grid = null;
		this.headerGrid = null;
		this.setWidth("100%");
		this.setHeight("100%");
		this.setSpacing(10);
		this.referenceList = [];
		this.userLoggedInRole = palms.exported.framework.PalmsUIApplication.getUserRoleCode();
		this.instance = "";
		this.status = "";
		this.recordData = {};
		this.OrderCycle = "";
		this.OrderCycleCodeList = [];
	}

	Initialize() {
		this.addHeaderGrid();
		// this.PrepareGrid();
		// this.addButtons();
	}

	addHeaderGrid() {
		this.headerGrid = new palms.exported.framework.grid.Grid(null, MaterialProcurementGridLineEntity);

		this.headerGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('dieSet', 'Die Set', false, ColumnType.ReadOnlyString, true));
		this.headerGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('ptnStart', 'Ptn Start Date & Time', false, ColumnType.ReadOnlyString, true));
		this.headerGrid.addColumn(new palms.exported.framework.grid.EditableColumnConfiguration('ptnLotSize', 'Ptn Lot Size', false, ColumnType.ReadOnlyInteger, true));

		this.add(this.headerGrid.asWidget());
		this.setCellWidth(this.headerGrid.asWidget(), "100%");
		this.setCellHeight(this.headerGrid.asWidget(), "auto");

		this.headerGrid.initialize();
		this.headerGrid.setDefaultCellValue("NA");
		this.headerGrid.renderGrid();

		this.setHeaderGridRecords(new MaterialProcurementEditoPanelGridEntity());
	}

	PrepareGrid() {
		this.grid = new palms.exported.framework.grid.Grid("SAP Order Details", SapOrderDetailsEntity);

		const materialCC = new palms.exported.framework.grid.EditableColumnConfiguration('material', 'Material', false, ColumnType.ReadOnlyString, true);
		const orderedQtyCC = new palms.exported.framework.grid.EditableColumnConfiguration('orderedQty', 'Ordered Qty', false, ColumnType.ReadOnlyInteger, true);
		//const refPONumberCC = new palms.exported.framework.grid.EditableColumnConfiguration('refPONo', 'Ref PO Number', false, ColumnType.ReadOnlyInteger, true);
		let refPOQtyCC;
		// if (this.status !== "Cancelled") {
		//refPOQtyCC = new palms.exported.framework.grid.EditableColumnConfiguration('refPOQty', 'Ref PO Qty', false, ColumnType.TextBoxInteger, true);
		// } else {
		refPOQtyCC = new palms.exported.framework.grid.EditableColumnConfiguration('refPOQty', 'Ref PO Qty', false, ColumnType.ReadOnlyInteger, true);
		// }
		const delCC = new palms.exported.framework.grid.EditableColumnConfiguration('del', 'Edit Ref POs', false, ColumnType.Icon, true);
		const addCC = new palms.exported.framework.grid.EditableColumnConfiguration('add', 'Edit Ref POs', false, ColumnType.Icon, true);
		const gapCC = new palms.exported.framework.grid.EditableColumnConfiguration('gap', 'Gap', false, ColumnType.ReadOnlyInteger, true);

		const entity1 = new MaterialProcurementRefPONoEntity();
		const entity2 = new MaterialProcurementRefPONoEntity();
		const entity3 = new MaterialProcurementRefPONoEntity();
		const entity4 = new MaterialProcurementRefPONoEntity();
		entity1.refPONo = '8102115498';
		entity2.refPONo = '8102115499';
		entity3.refPONo = '8102115496';
		entity4.refPONo = '8102115497';
		let referenceList = [entity1, entity2, entity3, entity4];
		let instance = this;
		const refPONumberCC = new palms.exported.framework.grid.ReferencingColumnConfiguration(
			'refPONo', 'Ref PO Number', false, 5, instance.referenceList, 'Ref PO Number', 'refPONo', true); // ReferencingColumnType.ComboBoxString

		this.grid.addColumn(materialCC);
		this.grid.addColumn(orderedQtyCC);
		this.grid.addColumn(refPONumberCC);
		this.grid.addColumn(refPOQtyCC);
		this.grid.addColumn(delCC);
		this.grid.addColumn(addCC);
		this.grid.addColumn(gapCC);

		this.grid.addRowSpanColumn("material");
		this.grid.addRowSpanColumn("orderedQty");
		this.grid.addRowSpanColumn("gap");

		this.setRowColorRenderer(materialCC);
		this.setRowColorRenderer(orderedQtyCC);
		this.setRowColorRenderer(refPONumberCC);
		this.setRowColorRenderer(refPOQtyCC);
		this.setRowColorRenderer(delCC);
		this.setRowColorRenderer(addCC);

		const gapRenderer = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
		gapRenderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
			if (record.gapCellColor) parentStyle.backgroundColor = record.gapCellColor;
			if (record.gapTextColor) parentStyle.color = record.gapTextColor;
		}
		gapCC.setRenderer(gapRenderer);

		//  let instance = this;

		this.add(this.grid.asWidget());
		this.setCellWidth(this.grid.asWidget(), "100%");
		this.setCellHeight(this.grid.asWidget(), "auto");

		this.grid.initialize();
		this.grid.renderGrid();

		this.grid.onRowButtonClick = (columnID, rowIndex) => {

			let convertStrTimeToHrMinSec = (strTime) => {
				strTime = strTime.split(':');
				return Number(strTime[0]) * 3600 + Number(strTime[1]) * 60 + Number(strTime[2])
			}
			let cycleEndTimeInSec, currTime;
			let filterOrderCycle = instance.OrderCycleCodeList.filter(el => el.id === instance.OrderCycle);
			if (filterOrderCycle.length > 0) {
				let cycleTime = filterOrderCycle[0].code.split('-');
				cycleEndTimeInSec = convertStrTimeToHrMinSec(cycleTime[2]);
				let date = new Date();
				let ccHour = date.getHours();
				let ccMin = date.getMinutes();
				let ccSec = date.getSeconds();
				currTime = ccHour * 3600 + ccMin * 60 + ccSec;

				if (cycleEndTimeInSec >= currTime) {
					if (columnID == 'del' && this.recordData.status !== "Cancelled") {
						if (confirm("are you sure you want to remove row no " + (rowIndex + 1) + ".")) {
							var records = instance.grid.getRecords();
							records.splice(rowIndex, 1);
							instance.grid.setRecords(records);
							instance.grid.renderGrid();
						}
					}
					else if (columnID == 'add' && this.recordData.status !== "Cancelled") {
						var records = instance.grid.getRecords();
						var clickedRecord = records[rowIndex];
						var sapEntity = new SapOrderDetailsEntity();
						records.splice(rowIndex + 1, 0, sapEntity);
						instance.grid.setRecords(records);
						instance.grid.renderGrid();
					}
				}
			}
		}
		this.grid.onDropdownSelect = (rowIndex, columnID) => {
			if (columnID == 'refPONo') {
				var records = instance.grid.getRecords();
				var clickedRecord = records[rowIndex];
				let refPoQtyValue = records[0].poNoList.filter(el => el.refPONo === clickedRecord.refPONo);
				let text = 0;
				if (isNaN(refPoQtyValue[0].refPOQty)) {
					text = 0;
				} else {
					text = refPoQtyValue[0].refPOQty;
				}
				records[rowIndex].refPOQty = text;
				instance.grid.setRecords(records);
				instance.grid.renderGrid();
			}
		}


		// this.grid.onValueChange = function (rowIndex, columnID) {
		// 	var value = instance.grid.getCellValue(rowIndex, "refPOQty");
		// 	var intValue = parseInt(value);

		// 	if (isNaN(intValue)) {
		// 		alert("Please enter a valid integer number");
		// 		instance.grid.renderGrid();
		// 	}else if( intValue <= 0){
		// 		alert("refPOQty must be greater than 0. Please enter an integer value greater than 0.");
		// 		instance.grid.renderGrid();
		// 	}else{
		// 		var records = instance.grid.getRecords();
		// 		let sumOfRefPoQty = records.reduce((sum,item)=> sum + Number(item.refPOQty),0);
		// 		let data = instance.recordData;
		// 		console.log("selected data",data);
		// 	}

		// };

		// this.grid.onCellFocus = function (rowIndex, columnID) {
		// 	var value = instance.grid.getCellValue(rowIndex, columnID);
		// 	var intValue = parseInt(value);
		// 	var text = null;
		// 	if (isNaN(intValue)) {
		// 		text = "";
		// 	}
		// 	else {
		// 		text = intValue;
		// 	}
		// 	instance.grid.setCellValue(rowIndex, columnID, text);
		// };
		// this.grid.onCellBlur = function (rowIndex, columnID) {
		// 	var value = instance.grid.getCellValue(rowIndex, columnID);
		// 	var intValue = parseInt(value);
		// 	var text = null;
		// 	if (isNaN(intValue)) {
		// 		alert("Please enter a valid integer number.");
		// 		return;
		// 	}else {
		// 		text = intValue;
		// 		instance.grid.setCellValue(rowIndex, columnID, text);
		// 		var records = instance.grid.getRecords();
		// 		let sumOfRefPoQty = records.reduce((sum, item) => sum + Number(item.refPOQty), 0);
		// 		let data = instance.recordData;
		// 	}

		// };

		//	instance.addButtons();
		//this.setupEventHandlers();
	}

	setRowColorRenderer(cc) {
		const renderer = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
		renderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
			if (record.rowColor) parentStyle.backgroundColor = record.rowColor;
		}
		cc.setRenderer(renderer);
	}

	addButtons() {
		let instance = this;

		let convertStrTimeToHrMinSec = (strTime) => {
			strTime = strTime.split(':');
			return Number(strTime[0]) * 3600 + Number(strTime[1]) * 60 + Number(strTime[2])
		}
		let cycleEndTimeInSec, currTime;
		let filterOrderCycle = instance.OrderCycleCodeList.filter(el => el.id === instance.OrderCycle);
		if (filterOrderCycle.length > 0) {
			let cycleTime = filterOrderCycle[0].code.split('-');
			cycleEndTimeInSec = convertStrTimeToHrMinSec(cycleTime[2]);
			let date = new Date();
			let ccHour = date.getHours();
			let ccMin = date.getMinutes();
			let ccSec = date.getSeconds();
			currTime = ccHour * 3600 + ccMin * 60 + ccSec;
		}


		const cancelBtn = new palms.client.framework.selfValidatingControls.ButtonControl();
		cancelBtn.setText("CANCEL");
		if ((instance.userLoggedInRole === "TPS" || instance.userLoggedInRole === "SSPCS") && this.status !== "Cancelled" && Object.keys(this.recordData).length > 0) {
			if (cycleEndTimeInSec >= currTime) {
				cancelBtn.setEnabled(true);
			} else {
				cancelBtn.setEnabled(false);
			}

		} else {
			cancelBtn.setEnabled(false);
		}
		cancelBtn.onClick = () => {
			try {
				const popupDialog = new cancelMaterialOrderPopup(instance.instance);
				popupDialog.setGlassEnabled(true);
				popupDialog.initialize();
				popupDialog.setAnimationEnabled(true);
				popupDialog.setAutoHideEnabled(true);
				popupDialog.center();
				popupDialog.showModal();

				popupDialog.setRecord(this.recordData.id1, this.recordData.material, this.recordData.orderedQtyValue);

			} catch (error) {
				alert("Error showing AddOtherPartsPopup: " + error.message);
			};
		};

		const saveBtn = new palms.client.framework.selfValidatingControls.ButtonControl();
		saveBtn.setText("SAVE");
		if ((instance.userLoggedInRole === "TPS" || instance.userLoggedInRole === "SSPCS") && this.status !== "Cancelled") {
			if (cycleEndTimeInSec >= currTime) {
				saveBtn.setEnabled(true);
			} else {
				saveBtn.setEnabled(false);
			}
		} else {
			saveBtn.setEnabled(false);
		}
		saveBtn.onClick = () => {
			this.handleSave();
		};

		const hPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
		hPanel.add(cancelBtn.asWidget());
		hPanel.add(saveBtn.asWidget());

		this.add(hPanel.asWidget());
		this.setCellWidth(hPanel.asWidget(), "auto");
		this.setCellHeight(hPanel.asWidget(), "100%");
		this.setCellHorizontalAlignment(hPanel.asWidget(), HorizontalAlignment.ALIGN_RIGHT);
		this.setCellVerticalAlignment(hPanel.asWidget(), VerticalAlignment.ALIGN_BOTTOM);
	}

	setRecordData(recordData, sapOrderDetails, instance, OrderCycle, OrderCycleCodeList) {
		this.clear();
		this.recordData = recordData;
		this.status = recordData.status;
		this.OrderCycle = OrderCycle;
		this.OrderCycleCodeList = OrderCycleCodeList;
		this.addHeaderGrid();
		this.setHeaderGridRecords(recordData);
		this.setGridRecords(sapOrderDetails);
		this.instance = instance;

	}

	setGridRecords(sapOrderDetails) {
		let arr = [];
		sapOrderDetails[0].poNoList ? sapOrderDetails[0].poNoList.forEach(element => {
			let entity = new MaterialProcurementRefPONoEntity();
			entity.refPONo = element.refPONo;
			arr.push(entity);

		}) : arr;
		//this.grid.removeAll();

		this.referenceList = arr;
		this.PrepareGrid();
		this.addButtons();
		this.grid.setRecords(sapOrderDetails);
		this.grid.renderGrid();
	}

	setHeaderGridRecords(recordData) {
		const arrList = [recordData];

		this.headerGrid.setRecords(arrList);
		this.headerGrid.renderGrid();
	}


	handleSave() {
		// let dataToSave = {
		// 	data: this.grid.getRecords()
		// }
		let bodydata = [];
		let data = this.grid.getRecords();
		let mess = [];
		let notValidRefPoQty = [];
		let refPoQtyNotGtrThanZero = [];
		let orderListId = 0;
		if (data.length <= 0) {
			return alert("Please add record to save.")
		} else {
			data.forEach((el, i) => {
				if (Number(el.refPOQty) === 0 && (el.refPONo === null || el.refPONo === undefined)) {
					mess.push("Both Ref PO Number and Ref PO Qty are required in row no " + (i + 1));
				} else if (isNaN(el.refPOQty)) {
					notValidRefPoQty.push("row no: " + (i + 1) + " , value: " + el.refPOQty);
				} else if (Number(el.refPOQty) <= 0) {
					refPoQtyNotGtrThanZero.push("row no: " + (i + 1) + " value: " + el.refPOQty);
				} else if (Number(el.refPOQty) === 0) {
					mess.push("Ref PO Qty are required in row no " + (i + 1));
				} else if (el.refPONo === null || el.refPONo === undefined) {
					mess.push("Ref PO Number are required in row no " + (i + 1));
				}
				else {
					if (i == 0) {
						orderListId = el.id;
					}
					bodydata.push({
						OrderedListID: orderListId,
						SAPPORefQty: el.refPOQty,
						SAPPORefNo: el.refPONo
					})
				}
			})
			if (mess.length > 0) {
				alert(mess.join(", "));
			} else if (notValidRefPoQty.length > 0) {
				alert("Ref Po Qty in the folling rows is not valid integer: " + notValidRefPoQty.join(', '));
			} else if (refPoQtyNotGtrThanZero.length > 0) {
				alert("Ref Po Qty must be greater than 0. Please enter an integer value greater than 0 in the following rows: " + refPoQtyNotGtrThanZero.join(', '));
			} else {
				if (confirm("Are you sure you want to save?")) {
					const host = new MaterialHostDetails();
					const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
					proxy.url = host.url + "materialProcurement/saveSapOrderDetails";
					proxy.payLoad = JSON.stringify(bodydata);
					proxy.method = "POST";
					proxy.contentType = "application/json; charset=utf-8";
					proxy.timeout = 20000;
					proxy.keepAlive = false;

					const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
					let instance = this;
					callback.onSuccess = function (responseData) {
						alert(responseData);
						instance.instance.loadData();
						//this.hide();
					}.bind(this);

					callback.onFailure = function (errorDescription) {
						console.error("Error adding other parts:", errorDescription);
						alert("Failed to save Po List Details. Please try again.");
					};

					palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
				}
			}
		}
	}
	handleDelete(id) {

		const host = new MaterialHostDetails();
		const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
		proxy.url = host.url + "materialProcurement/remove/record/editorpanel";
		proxy.payLoad = JSON.stringify({
			orderedListID: id
		});
		proxy.method = "POST";
		proxy.contentType = "application/json; charset=utf-8";
		proxy.timeout = 20000;
		proxy.keepAlive = false;

		const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
		let instance = this;
		callback.onSuccess = function (responseData) {
			return responseData;
		}.bind(this);

		callback.onFailure = function (errorDescription) {
			console.error("Error adding other parts:", errorDescription);
			alert("Failed to remove record");
		};

		palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);

	}
}