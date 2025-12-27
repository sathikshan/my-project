
class DncRecord extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.model = null;
		this.partNo = null;
		this.gpq = null;
		this.repair = null;
		this.total = null;
		this.dncPallets = null;
		this.locationId = null;
	}

	populateFields(jsonObject) {
		this.model = jsonObject.model;
		this.partNo = jsonObject.partNo;
		this.gpq = jsonObject.gpq;
		this.repair = jsonObject.repair;
		this.total = jsonObject.total;
		this.dncPallets = jsonObject.dncPallets;
		this.locationId = jsonObject.locationId;
	}

	get(property) {
		try {
			return this[property];
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	set(property, value) {
		try {
			this[property] = value;
			return value;
		} catch (e) {
			console.error(e);
			return null;
		}
	}
	getJSONString() {
		return JSON.stringify(this.toJSONObject());
	}

	toJSONObject() {
		const jsonObject = {};

		if (this.model) jsonObject.model = this.model;
		if (this.partNo) jsonObject.partNo = this.partNo;
		if (this.gpq !== null) jsonObject.gpq = this.gpq;
		if (this.repair !== null) jsonObject.repair = this.repair;
		if (this.total !== null) jsonObject.total = this.total;
		if (this.dncPallets) jsonObject.dncPallets = this.dncPallets;
		if (this.locationId) jsonObject.locationId = this.locationId;

		return jsonObject;
	}
	clone() {
		const jsonString = this.getJSONString();
		const jsonObject = JSON.parse(jsonString);
		const cloneEntity = new this.constructor();
		cloneEntity.populateFields(jsonObject);
		return cloneEntity;
	}
}

class ModelDNCDetailsEntities extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.model = null;
		this.dncRecord = null;
	}

	populateFields(jsonObject) {
		this.model = jsonObject.model;
		this.dncRecord = [];
		let instance = this;
		if (jsonObject.dncRecord) {
			jsonObject.dncRecord.forEach(data => {
				const record = new DncRecord();
				record.populateFields(data);
				instance.dncRecord.push(data);
			});
		}
	}

	get(property) {
		try {
			return this[property];
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	set(property, value) {
		try {
			this[property] = value;
			return value;
		} catch (e) {
			console.error(e);
			return null;
		}
	}
	getJSONString() {
		return JSON.stringify(this.toJSONObject());
	}
	toJSONObject() {
		const jsonObject = {};

		if (this.model) jsonObject.model = this.model;
		if (this.dncRecord.length > 0) {
			jsonObject.dncRecord = this.dncRecord.map(data => data.toJSONObject());
		}

		return jsonObject;
	}

	clone() {
		const jsonString = this.getJSONString();
		const jsonObject = JSON.parse(jsonString);
		const cloneEntity = new this.constructor();
		cloneEntity.populateFields(jsonObject);
		return cloneEntity;
	}
}

class ProductionRecord extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.date = null;
		this.model = null;
		this.partNo = null;
		this.palletQty = null;
		this.shift = null;
		this.remarks = null;
		this.shiftGroup = null;
	}

	populateFields(jsonObject) {
		this.date = jsonObject.date;
		this.model = jsonObject.model;
		this.partNo = jsonObject.partNo;
		this.palletQty = jsonObject.palletQty;
		this.shift = jsonObject.shift;
		this.remarks = jsonObject.remarks;
		this.shiftGroup = jsonObject.shiftGroup;
	}

	get(property) {
		try {
			return this[property];
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	set(property, value) {
		try {
			this[property] = value;
			return value;
		} catch (e) {
			console.error(e);
			return null;
		}
	}
	getJSONString() {
		return JSON.stringify(this.toJSONObject());
	}

	toJSONObject() {
		const jsonObject = {};

		if (this.date) jsonObject.date = this.date;
		if (this.model) jsonObject.model = this.model;
		if (this.partNo) jsonObject.partNo = this.partNo;
		if (this.palletQty !== null) jsonObject.palletQty = this.palletQty;
		if (this.shift) jsonObject.shift = this.shift;
		if (this.remarks) jsonObject.remarks = this.remarks;
		if (this.shiftGroup) jsonObject.shiftGroup = this.shiftGroup;
		return jsonObject;
	}

	clone() {
		const jsonString = this.getJSONString();
		const jsonObject = JSON.parse(jsonString);
		const cloneEntity = new this.constructor();
		cloneEntity.populateFields(jsonObject);
		return cloneEntity;
	}
}

class MaterialHostDetailsInpectionReports extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.url = 'http://localhost:8081/';
	}
}
class InspectionAndRepairReportForm extends palms.exported.framework.ActionForm {
	constructor() {
		super();
		this.productionDetails = [];
		this.dncPalletDetails = [];
		this.dieSetDetails = [];
		this.GPQDetailsForAllPart = [];
		this.HeaderPanel = '';
		//this.dncEntities = new ModelDNCDetailsEntities();
	}

	initialize() {
		try {
			super.initialize();
			super.addStyleName('InspectionAndRepairReportForm');

			//Add the refresh button
			const refreshButtonPanel = this.createRefreshButton();
			super.addWidgetControl(refreshButtonPanel.asWidget(), 'NORTH');
			super.setCellHeight(refreshButtonPanel.asWidget(), 'auto');

			const scrollPanel = new palms.exported.gwt.user.client.ui.ScrollPanel();
			scrollPanel.setStyleName('InspectionAndRepairReportForm-HeaderScroll');
			super.addWidgetControl(scrollPanel.asWidget(), 'NORTH');
			super.setCellHeight(scrollPanel.asWidget(), '65%');

			const header = this.getHeaderPanel();
			scrollPanel.add(header.asWidget());
			const container = this.getContainerPanel();

			super.addWidgetControl(container, 'CENTER');

			palms.exported.framework.PalmsUIApplication.setForm(this);

		} catch (error) {
			console.error("Error during initialization: ", error);
		}
	}

	createRefreshButton() {
		const buttonPanel = new palms.exported.gwt.user.client.ui.HorizontalPanel();
		buttonPanel.setStyleName('InspectionAndRepairReportForm-RefreshPanel');

		// Use the correct path to ButtonControl
		const buttonControl = new palms.client.framework.selfValidatingControls.ButtonControl();
		buttonControl.setText("Refresh");
		buttonControl.addStyleName('RefreshButton');

		buttonControl.onClick = () => {
			console.log("Manual refresh button clicked.");
			this.refreshData();
		};

		buttonPanel.add(buttonControl.asWidget());
		return buttonPanel;
	}

	refreshData() {
		try {
			// Store a reference to this for use in the callback
			const self = this;
			self.HeaderPanel.clear();

			// Fetch fresh data
			const host = new MaterialHostDetailsInpectionReports();
			const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
			proxy.url = host.url + "inspection/repair/repair/getdata";
			proxy.method = "GET";
			proxy.contentType = "application/json; charset=utf-8";
			proxy.timeout = 20000;
			proxy.keepAlive = false;

			const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

			callback.onSuccess = function (responseData) {
				responseData = JSON.parse(responseData);
				self.productionDetails = responseData.productionDetails;
				self.dncPalletDetails = responseData.dncPalletDetails;
				self.dieSetDetails = responseData.dieSetDetails;
				self.GPQDetailsForAllPart = responseData.GPQDetailsForAllPart;
				let noOfModel = responseData?.dieSetDetails?.length;
				//noOfModel = Math.floor(14 / noOfModel);
				//let remainingPartNo = 14 - responseData?.dieSetDetails?.length * noOfModel;
				let totalParts = 14;
				let noOfPartToBeArranged = new Array(noOfModel).fill(0);
				let exArrLenOfArr = responseData?.dieSetDetails?.map(a => a.data.length);

				while (totalParts > 0) {
					// Find index of array with minimum parts assigned so far, that can still accept more
					let minIndex = -1;
					for (let i = 0; i < noOfModel; i++) {
						if (noOfPartToBeArranged[i] < exArrLenOfArr[i]) {
							if (
								minIndex === -1 ||
								noOfPartToBeArranged[i] < noOfPartToBeArranged[minIndex]
							) {
								minIndex = i;
							}
						}
					}

					if (minIndex === -1) break; // no one can take more parts
					noOfPartToBeArranged[minIndex]++;
					totalParts--;
				}

				responseData.dieSetDetails.forEach((item, index) => {
					// let noOfPartInModel = 0;
					// if (index < remainingPartNo) {
					// 	noOfPartInModel = noOfModel + 1;
					// } else {
					// 	noOfPartInModel = noOfModel;
					// }
					let rw = new RepairWidget(item.repairWidget, item.data, noOfPartToBeArranged[index]);
					rw.onBomTypeSelect = function (model, bomType) {
						//alert(model + '-' + bomType + ' is clicked');
						self.updateDncGrid(model, bomType);

					};
					self.HeaderPanel.add(rw);
					self.HeaderPanel.add(self.getBuffer());
				})

				return responseData;
			}.bind(self);

			callback.onFailure = function (errorDescription) {
				console.error("Error fetching data:", errorDescription);
				//alert("Failed to refresh data. Please try again.");
			};

			palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
			if (this.dncGrid) {
				this.dncGrid.removeAll();
				this.dncGrid.renderGrid();
			}

			if (this.detailsGrid) {
				this.detailsGrid.removeAll();
				this.detailsGrid.renderGrid();
			}
		} catch (err) {
			console.error("Error during refresh:", err);
			//alert("Something went wrong during refresh. Please try again!");
		}
	}
	refreshUI() {
		try {
			// Fetch the data again
			this.refreshData();

			// Instead of trying to manipulate individual DOM elements,
			// let's just reload the entire header panel with new data

			// Clear any existing DNC grid and details grid
			if (this.dncGrid) {
				this.dncGrid.removeAll();
				this.dncGrid.renderGrid();
			}

			if (this.detailsGrid) {
				this.detailsGrid.removeAll();
				this.detailsGrid.renderGrid();
			}

			// No need to manually update the header - it will be refreshed 
			// when refreshData() completes since it calls the callback
			// which already updates the UI
		} catch (error) {
			console.error("Error during UI refresh:", error);
			alert("Failed to refresh UI. Please try again.");
		}
	}

	getHeaderPanel() {
		var header = new palms.exported.gwt.user.client.ui.HorizontalPanel();
		header.setSize('auto', 'auto');
		header.setSpacing(0);
		header.setStyleName('InspectionAndRepairReportForm-HeaderPanel');

		try {
			const host = new MaterialHostDetailsInpectionReports();
			const proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
			proxy.url = host.url + "inspection/repair/repair/getdata";
			//proxy.payLoad = JSON.stringify(bodydata);
			proxy.method = "GET";
			proxy.contentType = "application/json; charset=utf-8";
			proxy.timeout = 20000;
			proxy.keepAlive = false;

			const callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
			let instance = this;
			callback.onSuccess = function (responseData) {
				//alert(responseData);
				//this.hide();
				responseData = JSON.parse(responseData);
				instance.productionDetails = responseData.productionDetails;
				instance.dncPalletDetails = responseData.dncPalletDetails;
				instance.dieSetDetails = responseData.dieSetDetails;
				instance.GPQDetailsForAllPart = responseData.GPQDetailsForAllPart;
				let noOfModel = responseData?.dieSetDetails?.length;
				//noOfModel = Math.floor(14 / noOfModel);
				//let remainingPartNo = 14 - responseData?.dieSetDetails?.length * noOfModel;

				let totalParts = 14;
				let noOfPartToBeArranged = new Array(noOfModel).fill(0);
				let exArrLenOfArr = responseData?.dieSetDetails?.map(a => a.data.length);

				while (totalParts > 0) {
					// Find index of array with minimum parts assigned so far, that can still accept more
					let minIndex = -1;
					for (let i = 0; i < noOfModel; i++) {
						if (noOfPartToBeArranged[i] < exArrLenOfArr[i]) {
							if (
								minIndex === -1 ||
								noOfPartToBeArranged[i] < noOfPartToBeArranged[minIndex]
							) {
								minIndex = i;
							}
						}
					}

					if (minIndex === -1) break; // no one can take more parts
					noOfPartToBeArranged[minIndex]++;
					totalParts--;
				}


				responseData.dieSetDetails.forEach((item, index) => {
					 //let noOfPartInModel = noOfPartToBeArranged[index];
					// if (index < remainingPartNo) {
					// 	noOfPartInModel = noOfModel + 1;
					// } else {
					// 	noOfPartInModel = noOfModel;
					// }
					let rw = new RepairWidget(item.repairWidget, item.data, noOfPartToBeArranged[index]);
					rw.onBomTypeSelect = function (model, bomType) {
						//alert(model + '-' + bomType + ' is clicked');
						instance.updateDncGrid(model, bomType);

					};
					header.add(rw);
					header.add(instance.getBuffer());
				})

				instance.HeaderPanel = header;


				return responseData;
			}.bind(instance);

			callback.onFailure = function (errorDescription) {
				console.error("Error adding other parts:", errorDescription);
				alert("Failed to fetch Data. Please try again.");
				return [];
			};

			palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
		} catch (err) {
			console.log(err);
			alert("Something went wrong. Please try again!");
			return [];
		}
		return header;
	}

	getBuffer() {
		const buffer = new palms.exported.gwt.user.client.ui.HTML();
		buffer.setSize('10px', '100%');
		return buffer;
	}

	getContainerPanel() {
		const scrollPanel2 = new palms.exported.gwt.user.client.ui.ScrollPanel();
		scrollPanel2.setSize('100%', '100%');
		scrollPanel2.addStyleName('InspectionAndRepairReportForm-DNCScroll');
		//scrollPanel2.addStyleName("DNC-Details");
		scrollPanel2.getStyle().overflowX = 'hidden';
		scrollPanel2.getStyle().overflowY = '35%';

		// super.addWidgetControl(scrollPanel2.asWidget());
		// super.setCellWidth(scrollPanel2.asWidget(), '100%');
		// super.setCellHeight(scrollPanel2.asWidget(), '100%');

		var container = new palms.exported.gwt.user.client.ui.HorizontalPanel();
		container.setSize('100%', '100%');
		container.setSpacing(0);
		container.setStyleName('InspectionAndRepairReportForm-ContainerPanel');

		this.dncGrid = this.getDNCGrid(container);
		this.detailsGrid = this.getDetailsGrid();
		scrollPanel2.add(this.dncGrid.asWidget());
		container.add(scrollPanel2.asWidget());
		container.setCellWidth(scrollPanel2.asWidget(), '40%');
		container.setCellHeight(scrollPanel2.asWidget(), '100%');

		container.add(this.getBuffer());

		container.add(this.detailsGrid.asWidget());
		container.setCellWidth(this.detailsGrid.asWidget(), '60%');
		container.setCellHeight(this.detailsGrid.asWidget(), '100%');

		return container;
	}

	getDNCGrid(container) {
		const dncGrid = new palms.exported.framework.grid.Grid('DNC Pallets Details', DncRecord);
		//dncGrid.setBlankMessage('DNC Pallets Details');

		const modelCC = new palms.exported.framework.grid.EditableColumnConfiguration('model', 'Model', false, ColumnType.ReadOnlyString, true);
		const partNoCC = new palms.exported.framework.grid.EditableColumnConfiguration('partNo', 'Part No', false, ColumnType.ReadOnlyString, true);
		const gpqCC = new palms.exported.framework.grid.EditableColumnConfiguration('gpq', 'GPQ', false, ColumnType.ReadOnlyInteger, true);
		const repairCC = new palms.exported.framework.grid.EditableColumnConfiguration('repair', 'Repair', false, ColumnType.ReadOnlyInteger, true);
		const totalCC = new palms.exported.framework.grid.EditableColumnConfiguration('total', 'Total', false, ColumnType.ReadOnlyInteger, true);
		const dncPalletsCC = new palms.exported.framework.grid.EditableColumnConfiguration('dncPallets', 'DNC Pallets', false, ColumnType.LinkString, true);

		dncGrid.addColumn(modelCC);
		dncGrid.addColumn(partNoCC);
		dncGrid.addColumn(gpqCC);
		dncGrid.addColumn(repairCC);
		dncGrid.addColumn(totalCC);
		dncGrid.addColumn(dncPalletsCC);

		super.add(dncGrid.asWidget());
		super.setCellWidth(dncGrid.asWidget(), '100%');
		super.setCellHeight(dncGrid.asWidget(), 'auto');

		let instance = this;
		dncGrid.onLinkClick = (columnID, rowIndex) => {
			if (columnID == 'dncPallets') {
				try {
					let record = instance.dncGrid.getRecords();
					let ffilterProductionDetails = instance.productionDetails.productionDetails.filter(el => el.palletId === record[rowIndex].locationId);

					instance.detailsGrid.removeAll();
					if (ffilterProductionDetails.length > 0) {
						const filterRecords = ffilterProductionDetails[0].records.map(data => {
							const record = new ProductionRecord();
							record.populateFields(data);
							return record;
						});
						instance.detailsGrid.addRecords(filterRecords);
						instance.detailsGrid.renderGrid();
					} else {
						alert("Production details not found!");
						this.detailsGrid.removeAll();
						this.detailsGrid.setRowSelection(true);
						this.detailsGrid.initialize();
						this.detailsGrid.setDefaultCellValue('NA');
						this.detailsGrid.setPagingEnabled(true);
						this.detailsGrid.renderGrid();
					}

				} catch (error) {
					//alert("Error showing OrderMaterialPopup : " + error.message);
				};
			}
		}

		dncGrid.setRowSelection(true);
		dncGrid.initialize();
		dncGrid.setDefaultCellValue('NA');
		//dncGrid.setPagingEnabled(true);
		dncGrid.setStyleName('InspectionRepairReport-DNC');
		dncGrid.renderGrid();

		return dncGrid;
	}

	getDetailsGrid() {
		const detailsGrid = new palms.exported.framework.grid.Grid('Production Details', ProductionRecord);
		//detailsGrid.setBlankMessage('Production Details');

		const dateCC = new palms.exported.framework.grid.EditableColumnConfiguration('date', 'Date', false, ColumnType.ReadOnlyString, true); // ReadOnlyDateTime
		const modelCC = new palms.exported.framework.grid.EditableColumnConfiguration('model', 'Model', false, ColumnType.ReadOnlyString, true);
		const partNoCC = new palms.exported.framework.grid.EditableColumnConfiguration('partNo', 'Part No', false, ColumnType.ReadOnlyString, true);
		const palletQtyCC = new palms.exported.framework.grid.EditableColumnConfiguration('palletQty', 'Pallet Qty', false, ColumnType.ReadOnlyInteger, true);
		const shiftCC = new palms.exported.framework.grid.EditableColumnConfiguration('shift', 'Shift', false, ColumnType.ReadOnlyString, true);
		const shifGrp = new palms.exported.framework.grid.EditableColumnConfiguration('shiftGroup', 'Shift Group', false, ColumnType.ReadOnlyString, true);
		const remarks = new palms.exported.framework.grid.EditableColumnConfiguration('remarks', 'Remarks', false, ColumnType.ReadOnlyString, true);

		detailsGrid.addColumn(dateCC);
		detailsGrid.addColumn(modelCC);
		detailsGrid.addColumn(partNoCC);
		detailsGrid.addColumn(palletQtyCC);
		detailsGrid.addColumn(shiftCC);
		detailsGrid.addColumn(shifGrp);
		detailsGrid.addColumn(remarks);

		detailsGrid.setRowSelection(true);
		detailsGrid.initialize();
		detailsGrid.setDefaultCellValue('NA');
		detailsGrid.setPagingEnabled(true);
		detailsGrid.renderGrid();

		return detailsGrid;
	}

	updateDncGrid(model, bomType) {
		//let instance = this;
		let modelRecord = this.dncPalletDetails.filter(el => el.model.toLowerCase() === model.toLowerCase());
		let recordList = modelRecord[0].dncRecord.filter(el => el.partNo.trim().toLowerCase() === bomType.trim().toLowerCase());
		this.dncGrid.removeAll();
		if (recordList.length > 0) {
			let sum = recordList.reduce((a, b) => a + Number(b.total), 0);
			let GpqOfPart = this.GPQDetailsForAllPart.filter(part => part.SKUCode === recordList[0]?.partNo);
			const dncRecords = recordList.map((data, i) => {
				if (i == 0) {
					data.total = sum;
					data.gpq = GpqOfPart[0]?.GPQ === null ? 0 : GpqOfPart[0]?.GPQ;
				} else {
					data.total = "";
					data.gpq = "";
				}
				const record = new DncRecord();
				record.populateFields(data);
				return record;
			});
			this.dncGrid.addRecords(dncRecords);
			this.dncGrid.renderGrid();
		} else {
			alert("DNC Pallet details not found!");
			this.dncGrid.removeAll();
			this.dncGrid.setRowSelection(true);
			this.dncGrid.initialize();
			this.dncGrid.setDefaultCellValue('NA');
			this.dncGrid.setPagingEnabled(true);
			this.dncGrid.renderGrid();
		}

		this.detailsGrid.removeAll();
		this.detailsGrid.setRowSelection(true);
		this.detailsGrid.initialize();
		this.detailsGrid.setDefaultCellValue('NA');
		this.detailsGrid.setPagingEnabled(true);
		this.detailsGrid.renderGrid();
	}
	getGridPanel() {
		const vPanel = new palms.exported.gwt.user.client.ui.VerticalPanel();
		vPanel.setWidth('100%');
		vPanel.setHeight('100%');
		vPanel.addStyleName('Grid-VerticalPanel');
		return vPanel;
	}
}