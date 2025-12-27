class PartOrderActionForm extends palms.exported.framework.ActionForm {
	constructor() {
		super();
        this.grid = null;
		this.repeatedScheduler = null;
		this.actionWidgetList = new PartOrderActionHeaderWidgets(new PartOrderEntities(),this);
		this.registerFullScreenEvent();	
		this.fullScreen = false;
  

	}
    onAttach() {
		let instance = this;
		try {
		this.openFullscreen(this.getElement());
		super.onAttach();
		//instance.repeatedScheduler = setInterval(() => {
		//	if(instance.grid != null)
		//	{
			//	if(!instance.grid.next())
			//		instance.grid.first();
		//	}
		//}, 2000);
	} catch (err) {
		console.error("Error in onAttach(): ", err);
	}
	}

	onDetach() {
		super.onDetach();
		try {
            clearInterval(this.repeatedScheduler);
        } catch (err) {
            console.error("Error in onDetach(): ", err);
        }
	}
	
	openFullscreen(elem){
		try {
			if(
				document.fullscreenEnabled || /* Standard syntax */
				document.webkitFullscreenEnabled || /* Safari */
				document.msFullscreenEnabled /* IE11 */
			) {
				if (elem.requestFullscreen) {
					elem.requestFullscreen();
					return true;
				} else if (elem.webkitRequestFullscreen) {// Safari 
					elem.webkitRequestFullscreen();
					return true;
				} else if (elem.msRequestFullscreen) {// IE11 
					elem.msRequestFullscreen();
					return true;
				} else
					return false;
			}
		} catch (err) {
			alert("openFullscreen()	Exception : " + err.message);
		}
	}

	closeFullscreen() {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		} else if (document.msExitFullscreen) {
			window.top.document.msExitFullscreen();
		}
	}

	registerFullScreenEvent() {
		document.addEventListener("fullscreenchange", (event) => this.onFullScreenChange(event));
		document.addEventListener("mozfullscreenchange",  (event) => this.onFullScreenChange(event));
		document.addEventListener("webkitfullscreenchange",  (event) => this.onFullScreenChange(event));
		document.addEventListener("msfullscreenchange",  (event) => this.onFullScreenChangeonFullScreenChange(event));
	}

	onFullScreenChange(event) {
		this.fullScreen = !this.fullScreen;
		if(this.fullScreen) {
			let style = super.getStyle();
			style.backgroundColor = 'white';
			style.padding = '10px';
		}
		else {
			let style = super.getStyle();
			style.backgroundColor = 'transparent';
			style.padding = '';
		}
	}
	
	initialize() {
		try{
            super.initialize();
			super.addStyleName('PartOrderDashBoard');

			const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.actionWidgetList, 5);
			layouter.setAllowGroup(true);
			this.actionWidgetList.initialize();
			layouter.initialize();
			super.addWidgetControl(layouter.asWidget(), 'NORTH');
			super.setCellWidth(layouter.asWidget(), '100%');
			super.setCellHeight(layouter.asWidget(), '90px');

			const scrollPanel = new palms.exported.gwt.user.client.ui.ScrollPanel();
			scrollPanel.setSize('100%', '100%');
			scrollPanel.addStyleName('PartOrderForm-Scroll');
			super.addWidgetControl(scrollPanel.asWidget(), 'CENTER');
			super.setCellWidth(scrollPanel.asWidget(), '75%');
			super.setCellHeight(scrollPanel.asWidget(), '100%');

			const gridPanel = this.getGridPanel();
			scrollPanel.add(gridPanel.asWidget());

		try{
		if (true) {
			this.grid = new palms.exported.framework.grid.Grid('Part Order Grid', PartOrderDashGridLineEntity);
			const line = new palms.exported.framework.grid.EditableColumnConfiguration('line', 'Line', false, ColumnType.ReadOnlyString, true);
			const shift = new palms.exported.framework.grid.EditableColumnConfiguration('shift', 'Shift', false, ColumnType.ReadOnlyString, true);
			const shiftgroup = new palms.exported.framework.grid.EditableColumnConfiguration('shiftgroup', 'Shift Group', false, ColumnType.ReadOnlyString, true);
			const ptns = new palms.exported.framework.grid.EditableColumnConfiguration('ptns', 'Ptns', false, ColumnType.ReadOnlyString, true);
			const seq = new palms.exported.framework.grid.EditableColumnConfiguration('seq', 'Seq', false, ColumnType.ReadOnlyInteger, true);
			const planStartAndEnd = new palms.exported.framework.grid.EditableColumnConfiguration('planStartAndEnd', 'Plan Start-End', false, ColumnType.ReadOnlyString, true);
			const loadTime = new palms.exported.framework.grid.EditableColumnConfiguration('loadTime', 'Load Time', false, ColumnType.ReadOnlyInteger, true);
			const dieBay = new palms.exported.framework.grid.EditableColumnConfiguration('dieBay', 'Die Bay', false, ColumnType.ReadOnlyString, true);
			const dieSet = new palms.exported.framework.grid.EditableColumnConfiguration('dieSet', 'Die Set', false, ColumnType.ReadOnlyString, true);
			const ptnLotSize = new palms.exported.framework.grid.EditableColumnConfiguration('ptnLotSize', 'Ptn Lot Size', false, ColumnType.ReadOnlyString, true);
		    const recLotSize = new palms.exported.framework.grid.EditableColumnConfiguration('recLotSize', 'Rec Lot Size', false, ColumnType.ReadOnlyString, true);
			const planLotSize =new palms.exported.framework.grid.EditableColumnConfiguration('planLotSize', 'Plan Lot Size', false, ColumnType.ReadOnlyInteger, true);
			const status = new palms.exported.framework.grid.EditableColumnConfiguration('status', 'Status', false, ColumnType.ReadOnlyString, true);
			const reason = new palms.exported.framework.grid.EditableColumnConfiguration('reason', 'Reason', false, ColumnType.ReadOnlyString, true);
            const lotNo = new palms.exported.framework.grid.EditableColumnConfiguration('lotNo', 'Lot No', false, ColumnType.ReadOnlyString, true);
			const actualLotSize = new palms.exported.framework.grid.EditableColumnConfiguration('actualLotSize', 'Actual Lot Size', false, ColumnType.ReadOnlyString, true);
			const actualStartAndEnd = new palms.exported.framework.grid.EditableColumnConfiguration('actualStartAndEnd', 'Actual Start-End', false, ColumnType.ReadOnlyString, true);
			const actualLoadTime = new palms.exported.framework.grid.EditableColumnConfiguration('actualLoadTime', 'Actual Load Time', false, ColumnType.ReadOnlyInteger, true);
			const delay = new palms.exported.framework.grid.EditableColumnConfiguration('delay', 'Delay', false, ColumnType.ReadOnlyString, true);
			const deviation = new palms.exported.framework.grid.EditableColumnConfiguration('deviation', 'Deviation', false, ColumnType.ReadOnlyString, true);
			

			this.grid.addColumn(line);
			this.grid.addColumn(shift);
			this.grid.addColumn(shiftgroup);
			this.grid.addColumn(ptns);
			this.grid.addColumn(seq);
			this.grid.addColumn(planStartAndEnd);
			this.grid.addColumn(loadTime);
			this.grid.addColumn(dieBay);
			this.grid.addColumn(dieSet);
			this.grid.addColumn(ptnLotSize);
			this.grid.addColumn(recLotSize);
			this.grid.addColumn(planLotSize);
			this.grid.addColumn(status);
            this.grid.addColumn(lotNo);
            this.grid.addColumn(actualLotSize);
            this.grid.addColumn(actualStartAndEnd);
            this.grid.addColumn(actualLoadTime);
            this.grid.addColumn(delay);
            this.grid.addColumn(reason);
			this.grid.addColumn(deviation);

			
			this.setRowColorRenderer(seq);
			this.setRowColorRenderer(planStartAndEnd);
			this.setRowColorRenderer(loadTime);
			this.setRowColorRenderer(dieBay);
			this.setRowColorRenderer(dieSet);
			this.setRowColorRenderer(ptnLotSize);
			this.setRowColorRenderer(recLotSize);
			this.setRowColorRenderer(planLotSize);
			this.setRowColorRenderer(status);
            this.setRowColorRenderer(lotNo);
            this.setRowColorRenderer(actualLotSize);
            this.setRowColorRenderer(actualStartAndEnd);
            this.setRowColorRenderer(actualLoadTime);
            this.setRowColorRenderer(delay);
            this.setRowColorRenderer(reason);
			this.setRowColorRenderer(deviation);
            
			
			const statusRenderer = new palms.exported.framework.grid.GridCellRenderer(PartOrderDashGridLineEntity);
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

			this.grid.addRowSpanColumn('line');
			this.grid.addRowSpanColumn('shift');
			this.grid.addRowSpanColumn('shiftgroup');
			 this.grid.addRowSpanColumn('ptns');
			    this.grid.addRowSpanColumn('seq');
				this.grid.addRowSpanColumn('dieBay');
			    this.grid.addRowSpanColumn('planStartAndEnd');
			    this.grid.addRowSpanColumn('loadTime');
			    this.grid.addRowSpanColumn('dieSet');
			    this.grid.addRowSpanColumn('ptnLotSize');
				this.grid.addRowSpanColumn('status');
				this.grid.addRowSpanColumn('lotNo');
				this.grid.addRowSpanColumn('actualStartAndEnd');
				this.grid.addRowSpanColumn('actualLoadTime');
				this.grid.addRowSpanColumn('delay');
				this.grid.addRowSpanColumn('reason');

			
			this.grid.setRowSelection(true);
			this.grid.initialize();
			this.grid.setDefaultCellValue('NA');
			this.grid.renderGrid();
		}
	} catch (e) {
		console.error('An error occurred while setting up the part order Control Grid:', e);
		// Handle the exception as needed, e.g., show an error message to the user.
	}


        }
        catch (error) {
			console.error("Error during initialization: ", error);
		}
	}

	search() {
		try {
			this.loadData();
		} catch (error) {
			console.error("Error in search method:", error);
		}
	}

    setRowHighlightRenderer(cc) {
		const renderer = new palms.exported.framework.grid.GridCellRenderer(PartOrderDashGridLineEntity);
		renderer.render = function(record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
			if (columnID == 'projectedStock') {
				if (record.projectedStockCellColor) parentStyle.backgroundColor = record.projectedStockCellColor;
				if (record.projectedStockTextColor) parentStyle.color = record.projectedStockTextColor;
			} else if (record.rowHighlightColor) parentStyle.backgroundColor = record.rowHighlightColor;
		}
		cc.setRenderer(renderer);
	}

	setRowColorRenderer(cc) {
		const renderer = new palms.exported.framework.grid.GridCellRenderer(PartOrderDashGridLineEntity);
		renderer.render = function(record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
			if (record.rowColor) parentStyle.backgroundColor = record.rowColor;
		}
		cc.setRenderer(renderer);
	}

	getGridPanel() {
		const vPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
		vPanel.setWidth('100%');
		vPanel.setHeight('100%');
		return vPanel;
	}


	setRecordData(partOrderEntity) {
		
		this.grid.setRecords(partOrderEntity.grid);
		this.grid.renderGrid();
                this.actionWidgetList.setRecordData(partOrderEntity,this);
	}

	
}
