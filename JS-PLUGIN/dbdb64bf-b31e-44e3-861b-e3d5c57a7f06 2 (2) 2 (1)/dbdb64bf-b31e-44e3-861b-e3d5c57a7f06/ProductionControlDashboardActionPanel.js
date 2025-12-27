class ProductionControlDashboardActionPanel extends palms.exported.framework.ActionForm {
	constructor() {
		super();
		this.dashboard=new ProductionControlDashBoardEntity();
		this.grid = null;
		this.actionWidgetList = new ProductionDashBoardActionWidgetsList(this.dashboard,this);
		this.fullScreen = false;
		this.registerFullScreenEvent();
		this.repeatedScheduler = null;
		this.refreshInterval = null;

		
	}

	

	onAttach() {
		
		let instance = this;
		try {
			instance.openFullscreen(this.getElement());
		    super.onAttach();
			instance.refreshInterval = setInterval(() => {
				console.log("Auto-refresh triggered in action panel");
				instance.refreshShiftDetails();
			}, 10000);
		} catch (err) {
			console.error("Error in onAttach(): ", err);
		}

	}

	onDetach() {
        super.onDetach();
        try {
            clearInterval(this.repeatedScheduler);
            clearInterval(this.refreshInterval);
        } catch (err) {
            console.error("Error in onDetach(): ", err);
        }
    }
	refreshData() {
        try {
            const currentDate = new Date();
            const currentTime = currentDate.toTimeString().split(' ')[0];
            this.actionWidgetList.updateCurrentTime(currentTime);
            this.refreshShiftDetails();
        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    }
	
	openFullscreen(elem){
			if(
				document.fullscreenEnabled || 
				document.webkitFullscreenEnabled || 
				document.msFullscreenEnabled
			) {
				if (elem.requestFullscreen) {
					elem.requestFullscreen();
					return true;
				} else if (elem.webkitRequestFullscreen) {
					elem.webkitRequestFullscreen();
					return true;
				} else if (elem.msRequestFullscreen) {
					elem.msRequestFullscreen();
					return true;
				} else
					return false;
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
		try {
			
			super.initialize();
			super.addStyleName('ProductionControlDashBoard');

			const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.actionWidgetList, 6);
			layouter.setAllowGroup(true);
			this.actionWidgetList.initialize();
			layouter.initialize();
			super.addWidgetControl(layouter.asWidget(), 'NORTH');
			super.setCellWidth(layouter.asWidget(), '100%');
			super.setCellHeight(layouter.asWidget(), '90px');

			const scrollPanel = new palms.exported.gwt.user.client.ui.ScrollPanel();
			scrollPanel.setSize('100%', '100%');
			super.addWidgetControl(scrollPanel.asWidget(), 'CENTER');
			super.setCellWidth(scrollPanel.asWidget(), '75%');
			super.setCellHeight(scrollPanel.asWidget(), '100%');

			const gridPanel = this.getGridPanel();
			scrollPanel.add(gridPanel.asWidget());

			if (!this.grid) {
				this.grid = new palms.exported.framework.grid.Grid(null, ProductionControlDashGridLineEntity);

				const ptns = new palms.exported.framework.grid.EditableColumnConfiguration('ptns', 'Ptns', false, ColumnType.ReadOnlyString, true);
				const seq = new palms.exported.framework.grid.EditableColumnConfiguration('seq', 'Seq', false, ColumnType.ReadOnlyInteger, true);
				const planStartAndEnd = new palms.exported.framework.grid.EditableColumnConfiguration('planStartAndEnd', 'Plan Start-End', false, ColumnType.ReadOnlyString, true);
				const loadTime = new palms.exported.framework.grid.EditableColumnConfiguration('loadTime', 'Load Time', false, ColumnType.ReadOnlyInteger, true);
				const dieSet = new palms.exported.framework.grid.EditableColumnConfiguration('dieSet', 'Die Set', false, ColumnType.ReadOnlyString, true);
				const ptnLotSize = new palms.exported.framework.grid.EditableColumnConfiguration('ptnLotSize', 'Ptn Lot Size', false, ColumnType.ReadOnlyString, true);
				const childPart = new palms.exported.framework.grid.EditableColumnConfiguration('childPart', 'Child Part', false, ColumnType.ReadOnlyString, true);
				const recLotSize = new palms.exported.framework.grid.EditableColumnConfiguration('recLotSize', 'Rec Lot Size', false, ColumnType.ReadOnlyString, true);
				const prodOrder = new palms.exported.framework.grid.EditableColumnConfiguration('prodOrder', 'Plan Lot Size', false, ColumnType.ReadOnlyString, true);
				const status = new palms.exported.framework.grid.EditableColumnConfiguration('status', 'Status', false, ColumnType.ReadOnlyString, true);
				const reason = new palms.exported.framework.grid.EditableColumnConfiguration('reason', 'Remarks', false, ColumnType.ReadOnlyString, true);
				const lotNo = new palms.exported.framework.grid.EditableColumnConfiguration('lotNo', 'Lot No', false, ColumnType.ReadOnlyString, true);
				const actualLotSize = new palms.exported.framework.grid.EditableColumnConfiguration('actualLotSize', 'Actual Lot Size', false, ColumnType.ReadOnlyString, true);
				const actualStartAndEnd = new palms.exported.framework.grid.EditableColumnConfiguration('actualStartAndEnd', 'Actual Start-End', false, ColumnType.ReadOnlyString, true);
				const actualLoadTime = new palms.exported.framework.grid.EditableColumnConfiguration('actualLoadTime', 'Actual Load Time', false, ColumnType.ReadOnlyInteger, true);
				const delay = new palms.exported.framework.grid.EditableColumnConfiguration('delay', 'Delay', false, ColumnType.ReadOnlyString, true);
                const plannedlineStop = new palms.exported.framework.grid.EditableColumnConfiguration('plannedlineStop', 'plannedlineStop', false, ColumnType.ReadOnlyString, true);
                const queuedTime = new palms.exported.framework.grid.EditableColumnConfiguration('queuedTime', 'QueuedTime', false, ColumnType.ReadOnlyString, true);
                const deviation= new palms.exported.framework.grid.EditableColumnConfiguration('deviation', 'Deviation', false, ColumnType.ReadOnlyString, true);

				this.grid.addColumn(ptns);
				this.grid.addColumn(seq);
				this.grid.addColumn(planStartAndEnd);
				this.grid.addColumn(loadTime);
				this.grid.addColumn(dieSet);
				this.grid.addColumn(ptnLotSize);
				this.grid.addColumn(childPart);
				this.grid.addColumn(recLotSize);
				this.grid.addColumn(prodOrder);
				this.grid.addColumn(status);
				this.grid.addColumn(reason);
				this.grid.addColumn(lotNo);
				this.grid.addColumn(actualLotSize);
				this.grid.addColumn(actualStartAndEnd);
				this.grid.addColumn(actualLoadTime);
				this.grid.addColumn(delay);
				this.grid.addColumn(plannedlineStop);
				this.grid.addColumn(queuedTime);
				this.grid.addColumn(deviation);

				this.setRowColorRenderer(ptns);
				this.setRowColorRenderer(seq);
				this.setRowColorRenderer(planStartAndEnd);
				this.setRowColorRenderer(loadTime);
				this.setRowColorRenderer(dieSet);
				this.setRowColorRenderer(ptnLotSize);
				this.setRowColorRenderer(childPart);
				this.setRowColorRenderer(recLotSize);
				this.setRowColorRenderer(prodOrder);
				this.setRowColorRenderer(status);
				this.setRowColorRenderer(lotNo);
				this.setRowColorRenderer(actualLotSize);
				this.setRowColorRenderer(actualStartAndEnd);
				this.setRowColorRenderer(actualLoadTime);
				this.setRowColorRenderer(delay);
				this.setRowColorRenderer(plannedlineStop);
				this.setRowColorRenderer(reason);
				this.setRowColorRenderer(queuedTime);
				this.setRowColorRenderer(deviation);

				const statusRenderer = new palms.exported.framework.grid.GridCellRenderer(ProductionControlDashGridLineEntity);
				statusRenderer.render = function(record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
					if (record.rowColor) parentStyle.backgroundColor = record.rowColor;
					stringBuilder.appendSafeHtml(palms.exported.gwt.safehtml.shared.SafeHtmlUtils.fromTrustedString(
						"<div style='background-color: " + record.statusTextBgColor + ";line-height: 16px;white-space: nowrap;padding: 4px;border-radius: 12px;color:" + record.statusTextColor + "'>"));
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
			    this.grid.addRowSpanColumn('dieSet');
			    this.grid.addRowSpanColumn('ptnLotSize');
				this.grid.addRowSpanColumn('status');
				this.grid.addRowSpanColumn('lotNo');
				this.grid.addRowSpanColumn('actualStartAndEnd');
				this.grid.addRowSpanColumn('actualLoadTime');
				this.grid.addRowSpanColumn('delay');
				this.grid.addRowSpanColumn('queuedTime');
				this.grid.addRowSpanColumn('reason');
				this.grid.addRowSpanColumn('plannedlineStop');

				


				this.grid.setRowSelection(true);
				this.grid.initialize();
				this.grid.setDefaultCellValue('NA');
				this.grid.setPagingEnabled(true);
			}


		} catch (error) {
			alert("Error during initialization: " + error);
		}
	}

	search() {
	}

	refreshShiftDetails() {
        try {
            if (!this.dashboard || !this.dashboard.lineID) {
                console.error("LineID not available:", this.dashboard);
                return;
            }
    
            // var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            // proxy.url = "http://localhost:8081/getShiftDetails";
            const host = new DashBoard();
            var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            proxy.url = host.url + "getShiftDetails"; // Backend service URL

            proxy.payLoad = JSON.stringify({

                lineId: this.dashboard.lineID
            });
            proxy.method = "POST";
            proxy.contentType = "application/json; charset=utf-8";
            proxy.timeout = 20000;
            proxy.keepAlive = false;
    
            let instance = this;
            var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
            callback.onSuccess = function(responseData) {
                try {
                    console.log("Raw shift details response:", responseData);
                    var shiftDetails = JSON.parse(responseData);
                    console.log("Parsed shift details:", shiftDetails);
    
                    // Create the updated filter with shift details
                    const updatedFilter = {
                        currentDate: shiftDetails.currentDate,
                        currentTime: shiftDetails.currentTime,
                        shift: shiftDetails.shift,
                        line: shiftDetails.line,
                        lineId: shiftDetails.lineId
                    };
    
                    
                    instance.loadData(JSON.stringify(updatedFilter));
                } catch (error) {
                    console.error("Error processing shift details response:", error);
                }
            };
    
            callback.onFailure = function(errorDescription) {
                console.error("Failed to fetch shift details:", errorDescription);
            };
    
            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        } catch (error) {
            console.error("Error in refreshShiftDetails:", error);
        }
    }


	loadData(filter) {
		console.log('Load data method called');    
		this.filter = filter || this.filter;
	
		//var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
		//proxy.url = "http://localhost:8081/productionDashBoard"; // Backend service URL
		const host = new DashBoard();  
        var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
                    proxy.url = host.url + "productionDashBoard"; // Backend service URL
		proxy.payLoad = filter; 
		proxy.method = "POST"; // HTTP method
		proxy.contentType = "application/json; charset=utf-8"; // Content type
		proxy.timeout = 20000; // Request timeout in milliseconds
		proxy.keepAlive = false; // Keep-alive setting
		
		let instance = this; // Preserve the current context
		let callback = new palms.exported.framework.webServiceAccess.WebServiceCallback(); // Callback for handling the response
	
		// On success
		callback.onSuccess = (responseData) => {
			try {
				var dashboardData = JSON.parse(responseData);
				instance.dashboard.populateFields(dashboardData);
				instance.actionWidgetList.setRecordData(instance.dashboard);
				console.log("Header Data", instance.dashboard);
	
				// Check if there are any records in the grid
				if (dashboardData.grid && dashboardData.grid.length > 0) {
					if (instance.grid) {
	
						if (typeof instance.grid.removeAll === 'function') {
							instance.grid.removeAll();
							instance.grid.addRecords(instance.dashboard.grid);
							instance.grid.renderGrid();
						} else {
							alert("Grid does not support removeAll.");
						}
					} else {
						alert("Grid is not initialized.");
					}
				} else {
					alert("No data available for the current shift.");
				}
				
			} catch (error) {
				alert("An error occurred while processing the response. Please try again.");
			}
		}

		
		callback.onFailure = (errorDescription) => {
			console.error("Failure details:", errorDescription);
			if (errorDescription.includes("timeout")) {
				alert("Request timed out. Please check your network and try again.");
			} else if (errorDescription.includes("404")) {
				alert("API endpoint not found. Please verify the URL.");
			} else {
				alert("An unexpected error occurred: " + errorDescription);
			}
		};
		

		palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
	}
	
	

	setRowHighlightRenderer(cc) {
		const renderer = new palms.exported.framework.grid.GridCellRenderer(ProductionControlDashGridLineEntity);
		renderer.render = function(record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
			if (columnID == 'projectedStock') {
				if (record.projectedStockCellColor) parentStyle.backgroundColor = record.projectedStockCellColor;
				if (record.projectedStockTextColor) parentStyle.color = record.projectedStockTextColor;
			} else if (record.rowHighlightColor) parentStyle.backgroundColor = record.rowHighlightColor;
		}
		cc.setRenderer(renderer);
	}

	setRowColorRenderer(cc) {
		const renderer = new palms.exported.framework.grid.GridCellRenderer(ProductionControlDashGridLineEntity);
		renderer.render = function(record, parentStyle, columnID, rowIndex, htmlString, stringBuilder) {
			if (record.rowColor) parentStyle.backgroundColor = record.rowColor;
		}
		cc.setRenderer(renderer);
	}

	getGridPanel() {
		try {
		const vPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
		vPanel.setWidth('100%');
		vPanel.setHeight('100%');
		return vPanel;
	} catch (error) {
		console.error("Error in getGridPanel method:", error);
	}
	}

	

	setRecordData(dashboardEntity) {
		this.actionWidgetList.setRecordData(dashboardEntity);
		this.grid.setRecords(dashboardEntity.grid);
		this.grid.renderGrid();
		console.log('Setting record data:', dashboardEntity);
	}
}