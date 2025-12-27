class RepairWidget extends palms.exported.gwt.user.client.ui.FlexTable {
	constructor(model, bomTypes,noOfModel) {
		super();
		this.model = model;
		this.bomTypes = bomTypes;
		this.cols = noOfModel; // Number of columns
		this.init();
	}

	init() {
		if (this.model === "INN") {
			super.setStyleName("RepairWidget-FlexTable-INN");
		} else if (this.model === "FOR") {
			super.setStyleName("RepairWidget-FlexTable-FOR");
		} else if (this.model === "CMPV") {
			super.setStyleName("RepairWidget-FlexTable-CMPV");
		} else if (this.model === "D22") {
			super.setStyleName("RepairWidget-FlexTable-D22");
		} else if (this.model === "S/P") {
			super.setStyleName("RepairWidget-FlexTable-SP");
		}
		else {
			super.setStyleName("RepairWidget-FlexTable");
		}

		super.setSize("auto", "100%");
		super.setCellSpacing(2);

		this.addHeader();
		this.addRows();
	}

	addHeader() {
		let rowIndex = 0;
		let colIndex = 0;

		let headerLabel = new palms.exported.gwt.user.client.ui.HTML(this.model);
		headerLabel.setStyleName("Grid-FlexTable-Header");
		headerLabel.addStyleName("TextAlignCenter");

		super.insertRow(rowIndex);
		super.addCell(rowIndex);
		super.setWidget(rowIndex, colIndex, headerLabel);

		super.getFlexCellFormatter().setVerticalAlignment(rowIndex, colIndex, 'ALIGN_TOP');
		super.getFlexCellFormatter().setHeight(rowIndex, colIndex, "auto");
		super.getFlexCellFormatter().setColSpan(rowIndex, colIndex, this.cols);
	}

	addRows() {
		let rowIndex = super.getRowCount() - 1;
		let colIndex = 0;
		let row;

		this.bomTypes.forEach((item) => {
			if (colIndex === 0) row = super.insertRow(++rowIndex); // Insert a new row if starting a new row

			super.addCell(rowIndex);
			let bomTypeBtn = new palms.exported.gwt.user.client.ui.HTML(item.bomType);
			bomTypeBtn.setStyleName("RepairWidget-Button");
			bomTypeBtn.addStyleName("GridHeader");
			bomTypeBtn.addStyleName("TextAlignCenter");
			bomTypeBtn.addStyleName("FieldNameLabel");
			bomTypeBtn.addStyleName("FieldNameLabel1");
			bomTypeBtn.addStyleName("lineHeight36");
			bomTypeBtn.setSize("auto", "24px");
			// if(item.repairRequired)
			// 	bomTypeBtn.addStyleName("RepairWidget-Repair");
			// if(item.priorityRepair)
			// 	bomTypeBtn.addStyleName("RepairWidget-PriorityRepair");
			if (Number(item.PullRatePerSec) * 3600 * Number(item.noOfHrsOfSaftyStock) < Number(item.stock)) {
				bomTypeBtn.addStyleName("RepairWidget-Green");
			} else if (Number(item.PullRatePerSec) * 3600 * 2 < Number(item.stock)) {
				bomTypeBtn.addStyleName("RepairWidget-Yellow");
			} else {
				bomTypeBtn.addStyleName("RepairWidget-Red");
			}
			super.setWidget(rowIndex, colIndex, bomTypeBtn);
			let instance = this;
			let handler = new palms.exported.gwt.event.dom.client.ClickHandler();
			handler.onClick = function (event) {
				instance.onBomTypeSelect(instance.model, item.bomType);
			};
			bomTypeBtn.addClickHandler(handler);
			colIndex++;
			if (colIndex == this.cols) colIndex = 0;
		});
	}

	onBomTypeSelect(model, bomType) {

	}
}