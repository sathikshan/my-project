class ProductionControlFormNextShift extends palms.exported.framework.ActionForm {
	constructor() {
		super();
		this.nextShift = new ProductionControlNextShiftEntity();
		this.grid = null;
		this.filter = null;
		
		this.headerRecordList = new ProductionCurrentShiftHeaderRecordWidgetsList(this.nextShift, this);
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

		const scrollPanel = new palms.exported.gwt.user.client.ui.ScrollPanel();
		scrollPanel.setSize('100%', '100%');
		scrollPanel.addStyleName('ProductionControlForm-Scroll');
		super.addWidgetControl(scrollPanel.asWidget(), 'CENTER');
		super.setCellWidth(scrollPanel.asWidget(), '75%');
		super.setCellHeight(scrollPanel.asWidget(), '100%');

		const gridPanel = this.getGridPanel();
		scrollPanel.add(gridPanel.asWidget());
		try{
		if (true) {
			this.grid = new palms.exported.framework.grid.Grid('Production Control Grid', ProductionControlGridLineEntity);
			
			const ptns = new palms.exported.framework.grid.EditableColumnConfiguration('ptns', 'Pattern', false, ColumnType.ReadOnlyString, true);
			const seq = new palms.exported.framework.grid.EditableColumnConfiguration('seq', 'Seq', false, ColumnType.ReadOnlyInteger, true);
			const planStartAndEnd = new palms.exported.framework.grid.EditableColumnConfiguration('planStartAndEnd', 'Plan Start-End', false, ColumnType.ReadOnlyString, true);
			const loadTime = new palms.exported.framework.grid.EditableColumnConfiguration('loadTime', 'Load Time', false, ColumnType.ReadOnlyInteger, true);
			const dieBay = new palms.exported.framework.grid.EditableColumnConfiguration('dieBay', 'Die Bay', false, ColumnType.ReadOnlyString, true);
			const dieSet = new palms.exported.framework.grid.EditableColumnConfiguration('dieSet', 'Die Set', false, ColumnType.ReadOnlyString, true);
			const ptnLotSize = new palms.exported.framework.grid.EditableColumnConfiguration('ptnLotSize', 'Ptn Lot Size', false, ColumnType.ReadOnlyString, true);
			const childPart = new palms.exported.framework.grid.EditableColumnConfiguration('childPart', 'Child Part', false, ColumnType.ReadOnlyString, true);
			const bomQty = new palms.exported.framework.grid.EditableColumnConfiguration('bomQty', 'BOM Qty', false, ColumnType.ReadOnlyInteger, true);
			const bomSeq = new palms.exported.framework.grid.EditableColumnConfiguration('bomSeq', 'BOM Seq', false, ColumnType.ReadOnlyInteger, true);
			const status = new palms.exported.framework.grid.EditableColumnConfiguration('status', 'Status', false, ColumnType.ReadOnlyString, true);

			this.grid.addColumn(ptns);
			this.grid.addColumn(seq);
			this.grid.addColumn(planStartAndEnd);
			this.grid.addColumn(loadTime);
			this.grid.addColumn(dieBay);
			this.grid.addColumn(dieSet);
			this.grid.addColumn(ptnLotSize);
			this.grid.addColumn(childPart);
			this.grid.addColumn(bomQty);
			this.grid.addColumn(bomSeq);
			this.grid.addColumn(status);

			this.setRowColorRenderer(ptns);
			this.setRowColorRenderer(seq);
			this.setRowColorRenderer(planStartAndEnd);
			this.setRowColorRenderer(loadTime);
			this.setRowColorRenderer(dieBay);
			this.setRowColorRenderer(dieSet);
			this.setRowColorRenderer(ptnLotSize);
			this.setRowColorRenderer(childPart);
			this.setRowColorRenderer(bomQty);
			this.setRowColorRenderer(bomSeq);
			this.setRowColorRenderer(status);
			
			const statusRenderer = new palms.exported.framework.grid.GridCellRenderer(ProductionControlGridLineEntity);
			statusRenderer.render = function(record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
				if(record.rowColor) parentStyle.backgroundColor = record.rowColor;
				stringBuilder.appendSafeHtml(palms.exported.gwt.safehtml.shared.SafeHtmlUtils.fromTrustedString(
						"<div style='background-color: "+record.statusTextBgColor+";line-height: 16px;white-space: nowrap;padding: 4px;border-radius: 12px;color:"+record.statusTextColor+"'>"));
				stringBuilder.appendSafeHtml(htmlString);
				stringBuilder.appendSafeHtml(palms.exported.gwt.safehtml.shared.SafeHtmlUtils.fromTrustedString("</div>"));
			}
			status.setRenderer(statusRenderer);
			
			gridPanel.add(this.grid.asWidget());
			gridPanel.setCellWidth(this.grid.asWidget(), '100%');
			gridPanel.setCellHeight(this.grid.asWidget(), '100%');

			this.grid.addRowSpanColumn('ptns');
			this.grid.addRowSpanColumn('seq');
			this.grid.addRowSpanColumn('planStartAndEnd');
			this.grid.addRowSpanColumn('loadTime');
			this.grid.addRowSpanColumn('dieBay');
			this.grid.addRowSpanColumn('dieSet');
			this.grid.addRowSpanColumn('ptnLotSize');
			this.grid.addRowSpanColumn('status');

			
			this.grid.setRowSelection(false);
			this.grid.initialize();
			this.grid.setDefaultCellValue('NA');
			this.grid.renderGrid();
		}
	} catch (e) {
		console.error('An error occurred while setting up the Production Control Grid:', e);
		// Handle the exception as needed, e.g., show an error message to the user.
	}
		
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
		return vPanel;
	}

	onRecordSelect(selectedRecord) {
		this.editorPanel.setRecordData(selectedRecord);
	}
	
	loadData(filter) {
		this.filter = filter;
		const host = new ProductionHostDetails();

		// Set up the web service proxy
		var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
		//proxy.url = "http://localhost:8081/nextShiftDetails"; // Backend service URL
		proxy.url = host.url + "nextShiftDetails";
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
			instance.nextShift.populateFields(responseObj);

			instance.headerRecordList.setRecordData(instance.nextShift);
            
			instance.grid.removeAll();
			instance.grid.addRecords(instance.nextShift.grid);
			instance.grid.renderGrid();			
		}
		
		// On failure, show the error message and re-enable buttons
		callback.onFailure = function(errorDescription) {
			alert("Failure: " + errorDescription);
		}

		// Invoke the web service with the configured proxy and callback
		palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
	}
}