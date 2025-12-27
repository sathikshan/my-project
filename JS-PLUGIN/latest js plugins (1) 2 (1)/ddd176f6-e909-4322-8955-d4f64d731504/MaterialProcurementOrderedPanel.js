class MaterialProcurementOrderedPanel extends palms.exported.framework.ActionForm {
	constructor() {
		super();

		this.grid = null;
		this.editorPanel = new MaterialProcurementEditorPanel();
		this.entity = new MaterialProcurementOrderedEntity();
		this.LineId = '';
		this.OrderCycle = "";
		this.OrderCycleCodeList = [];
		this.userLoggedInRole = palms.exported.framework.PalmsUIApplication.getUserRoleCode();
	}

	initialize() {
		super.initialize();
		super.addStyleName('MaterialProcurementOrderedPanel');

		const scrollPanel = new palms.exported.gwt.user.client.ui.ScrollPanel();
		scrollPanel.setSize('100%', '100%');
		scrollPanel.addStyleName('MaterialProcurement-Scroll');
		scrollPanel.getStyle().overflowX = 'hidden';
		scrollPanel.getStyle().overflowY = 'auto';
		super.addWidgetControl(scrollPanel.asWidget(), 'CENTER');
		super.setCellWidth(scrollPanel.asWidget(), '70%');
		super.setCellHeight(scrollPanel.asWidget(), '100%');

		const gridPanel = this.getGridPanel();
		scrollPanel.add(gridPanel.asWidget());

		if (true) {
			this.grid = new palms.exported.framework.grid.Grid(null, MaterialProcurementGridLineEntity);

			const dieSetCC = new palms.exported.framework.grid.EditableColumnConfiguration('dieSet', 'Die Set', false, ColumnType.ReadOnlyString, true);
			const ptnLotSizeCC = new palms.exported.framework.grid.EditableColumnConfiguration('ptnLotSize', 'Ptn Lot Size', false, ColumnType.ReadOnlyInteger, true);
			const ptnStartCC = new palms.exported.framework.grid.EditableColumnConfiguration('ptnStart', 'Ptn Start Date & Time', false, ColumnType.ReadOnlyString, true);
			const poTriggerHrCC = new palms.exported.framework.grid.EditableColumnConfiguration('poTriggerHr', 'Material Trigger Hr', false, ColumnType.ReadOnlyInteger, true);
			const materialCC = new palms.exported.framework.grid.EditableColumnConfiguration('material', 'Material', false, ColumnType.ReadOnlyString, true);
			const skidQtyCC = new palms.exported.framework.grid.EditableColumnConfiguration('skidQty', 'SKID Qty', false, ColumnType.ReadOnlyInteger, true);
			const orderedQtyCC = new palms.exported.framework.grid.EditableColumnConfiguration('orderedQty', 'Ordered Qty', false, ColumnType.LinkString, true);
			const orderDateAndTimeCC = new palms.exported.framework.grid.EditableColumnConfiguration('orderDateAndTime', 'Ordered Date & Time', false, ColumnType.ReadOnlyString, true);
			const refPOQtyCC = new palms.exported.framework.grid.EditableColumnConfiguration('refPOQty', 'Ref PO Qty', false, ColumnType.ReadOnlyInteger, true);
			const gapCC = new palms.exported.framework.grid.EditableColumnConfiguration('gap', 'Gap', false, ColumnType.ReadOnlyInteger, true);
			const flagCC = new palms.exported.framework.grid.EditableColumnConfiguration('flag', 'Flag', false, ColumnType.ReadOnlyString, true);
			const statusCC = new palms.exported.framework.grid.EditableColumnConfiguration('status', 'Status', false, ColumnType.ReadOnlyString, true);
			//const cancelCC = new palms.exported.framework.grid.EditableColumnConfiguration('cancel', 'Cancel', false, ColumnType.Button, true);

			this.grid.addColumn(dieSetCC);
			this.grid.addColumn(ptnLotSizeCC);
			this.grid.addColumn(ptnStartCC);
			this.grid.addColumn(poTriggerHrCC);
			this.grid.addColumn(materialCC);
			this.grid.addColumn(skidQtyCC);
			this.grid.addColumn(orderedQtyCC);
			this.grid.addColumn(orderDateAndTimeCC);
			this.grid.addColumn(refPOQtyCC);
			this.grid.addColumn(gapCC);
			this.grid.addColumn(flagCC);
			this.grid.addColumn(statusCC);
			// if (this.userLoggedInRole === "TPS_LEADER") {
			// 	this.grid.addColumn(cancelCC);
			// }

			this.grid.addRowSpanColumn('dieSet');
			this.grid.addRowSpanColumn('ptnLotSize');
			this.grid.addRowSpanColumn('ptnStart');
			this.grid.addRowSpanColumn('poTriggerHr');

			this.setRowColorRenderer(materialCC);
			this.setRowColorRenderer(skidQtyCC);
			this.setRowColorRenderer(orderedQtyCC);
			this.setRowColorRenderer(orderDateAndTimeCC);
			this.setRowColorRenderer(refPOQtyCC);
			this.setRowColorRenderer(flagCC);

			const gapRenderer = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
			gapRenderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
				if (record.gapCellColor) parentStyle.backgroundColor = record.gapCellColor;
				if (record.gapTextColor) parentStyle.color = record.gapTextColor;
				parentStyle.fontSize = "18px";
			}
			const statusRenderer = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
			statusRenderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
				if(record.statusCellColor) parentStyle.backgroundColor = record.statusCellColor;
				if(record.statusTextColor) parentStyle.color = record.statusTextColor;
				parentStyle.fontSize = "18px";
			}
			const flagRender = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
			flagRender.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
				//if(record.statusCellColor) parentStyle.backgroundColor = record.statusCellColor;
				if(record.flagTextColor) parentStyle.color = record.flagTextColor;
				parentStyle.fontSize = "18px";
			}

			const chnageFontRenderer = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
			chnageFontRenderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
				parentStyle.fontSize = "18px";
			}
			gapCC.setRenderer(gapRenderer);
			statusCC.setRenderer(statusRenderer);
			flagCC.setRenderer(flagRender);
			// dieSetCC.setRenderer(chnageFontRenderer);
			// ptnLotSizeCC.setRenderer(chnageFontRenderer);
			// ptnStartCC.setRenderer(chnageFontRenderer);
			// poTriggerHrCC.setRenderer(chnageFontRenderer);
			// materialCC.setRenderer(chnageFontRenderer);
			// skidQtyCC.setRenderer(chnageFontRenderer);
			// orderedQtyCC.setRenderer(chnageFontRenderer);
			// orderDateAndTimeCC.setRenderer(chnageFontRenderer);
			// refPOQtyCC.setRenderer(chnageFontRenderer);
			// flagCC.setRenderer(chnageFontRenderer);

			gridPanel.add(this.grid.asWidget());
			gridPanel.setCellWidth(this.grid.asWidget(), '100%');
			gridPanel.setCellHeight(this.grid.asWidget(), '100%');

			let instance = this;

			this.grid.onRowClick = function (rowIndex) {
				const selectedRecord = instance.grid.getRecordAt(rowIndex);
				//this.editorPanel.grid.removeAll();
				instance.onRecordSelect(selectedRecord);
			}
			// if (this.userLoggedInRole === "TPS_LEADER") {
			// 	this.grid.onRowButtonClick = (columnID, rowIndex) => {
			// 		if (columnID == 'cancel') {
			// 			try {
			// 				const popupDialog = new cancelMaterialOrderPopup(instance);
			// 				popupDialog.setGlassEnabled(true);
			// 				popupDialog.initialize();
			// 				popupDialog.setAnimationEnabled(true);
			// 				popupDialog.setAutoHideEnabled(true);
			// 				popupDialog.center();
			// 				popupDialog.showModal();

			// 				popupDialog.setRecord(instance.entity.grid[rowIndex].id1, instance.entity.grid[rowIndex].material, instance.entity.grid[rowIndex].orderedQtyValue);

			// 			} catch (error) {
			// 				alert("Error showing AddOtherPartsPopup: " + error.message);
			// 			};
			// 		}

			// 	}
			// }

			this.grid.onLinkClick = function (columnID, rowIndex) {
				if (columnID == 'orderedQty') {
					let popupDialog = new RecommendationPopup('ordered');
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

			this.grid.setRowSelection(true);
			this.grid.initialize();
			this.grid.addStyleName('ProductionControlForm-Grid');
			this.grid.setDefaultCellValue('NA');
			this.grid.renderGrid();
		}

		if (true) {
			const scrollPanel2 = new palms.exported.gwt.user.client.ui.ScrollPanel();
			scrollPanel2.setSize('100%', '100%');
			scrollPanel2.addStyleName('ProductionControlForm-Scroll');
			scrollPanel2.addStyleName("EditorPanel");
			scrollPanel2.getStyle().overflowX = 'hidden';
			scrollPanel2.getStyle().overflowY = 'auto';
			super.addWidgetControl(scrollPanel2.asWidget(), 'EAST');
			super.setCellWidth(scrollPanel2.asWidget(), '30%');
			super.setCellHeight(scrollPanel2.asWidget(), '100%');
			scrollPanel2.add(this.editorPanel.asWidget());
			this.editorPanel.Initialize();
			/*super.addWidgetControl(this.editorPanel.asWidget(), 'EAST');
			super.setCellWidth(this.editorPanel.asWidget(), '25%');
			super.setCellHeight(this.editorPanel.asWidget(), '100%');
			this.editorPanel.Initialize();*/
		}
		this.loadData();
	}

	setRowColorRenderer(cc) {
		const renderer = new palms.exported.framework.grid.GridCellRenderer(MaterialProcurementGridLineEntity);
		renderer.render = function (record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
			if (record.rowColor) parentStyle.backgroundColor = record.rowColor;
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
		let instance = this;
		//const sapOrderDetails = [];
		// selectedRecord.sapOrderDetails.forEach(function(id) {
		// 	var entity = instance.entity.sapOrderDetails.find(x => x.id === id);
		// 	if(entity)
		// 		sapOrderDetails.push(entity);
		// });
		let filteredData = instance.entity.sapOrderDetails.filter(data => data.id == selectedRecord.id1);

		this.editorPanel.setRecordData(selectedRecord, filteredData,instance,instance.OrderCycle,instance.OrderCycleCodeList);
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
			proxy.url = host.url + "materialProcurement/Ordered"; // Backend service URL
			proxy.payLoad = JSON.stringify(json); // Data payload to be sent
			proxy.method = "POST"; // HTTP method
			proxy.contentType = "application/json; charset=utf-8"; // Content type
			proxy.timeout = 20000; // Request timeout in milliseconds
			proxy.keepAlive = false; // Keep-alive setting

			let instance = this; // Preserve the current context
			var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response

			// On success, show the response message, clear the form, and re-enable buttons
			callback.onSuccess = function (responseData) {
				var responseObj = JSON.parse(responseData);
				if (responseObj.length == 0) {
					//alert(responseObj);

				} else {
					instance.grid.removeAll();
					instance.entity.populateFields(responseObj);

					instance.grid.addRecords(instance.entity.grid);
					instance.grid.renderGrid();
					//instance.editorPanel.setRecordData(selectedRecord, filteredData);
					instance.editorPanel.clear();
					instance.editorPanel.addHeaderGrid();
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

	setRecordData(LineId, OrderCycle,OrderCycleCodeList) {
		this.LineId = LineId;
		this.OrderCycle = OrderCycle;
		this.OrderCycleCodeList = OrderCycleCodeList;
	}
}