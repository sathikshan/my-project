class MaterialProcurementSearchEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.currentDate = null;
		this.line = null;
		this.orderCycle = null;
		this.OrderCycleCodeList = [];
	}

	populateFields(jsonObject) {
		this.currentDate = jsonObject.currentDate;
		this.line = jsonObject.line;
		this.orderCycle = jsonObject.orderCycle;
		this.OrderCycleCodeList = jsonObject.OrderCycleCodeList;
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

		if (this.currentDate) jsonObject.currentDate = this.currentDate;
		if (this.line) jsonObject.line = this.line;
		if (this.orderCycle) jsonObject.orderCycle = this.orderCycle;
		if(this.OrderCycleCodeList) jsonObject.OrderCycleCodeList = this.OrderCycleCodeList;

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

class MaterialProcurementGridLineEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.id1 = null;
		this.id2 = null;
		this.dieSet = null;
		this.ptnLotSize = null;
		this.ptnStart = null;
		this.poTriggerHr = null;
		this.material = null;
		this.skidQty = null;
		this.recQty = null;
		this.adjustmentKanbans = null;
		this.orderedQty = null;
		this.order = 'Order';
		this.status = null;
		this.skip = 'Skip';
		this.recommQtyValue = null;
		this.orderedQtyValue = null;
		this.stock = null;
		this.prevAdjustmentKanbans = null;

		this.orderDateAndTime = null;
		this.refPOQty = null;
		this.refPONumber = null;
		this.gap = null;
		this.flag = null;
		this.gapCellColor = null;
		this.gapTextColor = null;
		this.rowColor = null;
		this.cancel = 'Cancel';
		this.statusTextColor = null;
		this.statusCellColor = null;
		this.statusTextColorTBO = null;
		this.statusCellColorTBO = null;
		this.flagTextColor = null;
		this.bomSeq = null;
		this.childPart = null;
		this.currentStock = null;
		this.pullRate = null;
		this.safetyStock = null;
		this.projectedStock = null;
		this.actionButton = 'Add to Order';
		this.rowHighlightColor = null;
		this.projectedStockCellColor = null;
		this.projectedStockTextColor = null;
		this.pqId = null;
		this.YZANo = null;

		this.recommendationCalculations = [];
		this.sapOrderDetails = [];
	}

	populateFields(jsonObject) {
		this.id1 = jsonObject.id1;
		this.id2 = jsonObject.id2;

		this.dieSet = jsonObject.dieSet;
		this.ptnLotSize = jsonObject.ptnLotSize;
		this.ptnStart = jsonObject.ptnStart;
		this.poTriggerHr = jsonObject.poTriggerHr;
		this.material = jsonObject.material;
		this.skidQty = jsonObject.skidQty;
		this.recQty = jsonObject.recQty;
		this.adjustmentKanbans = jsonObject.adjustmentKanbans;
		this.orderedQty = jsonObject.orderedQty;
		this.status = jsonObject.status;
		this.recommQtyValue = jsonObject.recommQtyValue;
		this.orderedQtyValue = jsonObject.orderedQtyValue;
		this.stock = jsonObject.stock;
		this.prevAdjustmentKanbans = jsonObject.prevAdjustmentKanbans;

		this.orderDateAndTime = jsonObject.orderDateAndTime;
		this.refPOQty = jsonObject.refPOQty;
		this.refPONumber = jsonObject.refPONumber;
		this.gapCellColor = jsonObject.gapCellColor;
		this.gapTextColor = jsonObject.gapTextColor;
		this.rowColor = jsonObject.rowColor;
		this.statusCellColor = jsonObject.statusCellColor;
		this.statusTextColor = jsonObject.statusTextColor;
		this.statusCellColorTBO = jsonObject.statusCellColorTBO;
		this.statusTextColorTBO = jsonObject.statusTextColorTBO;
		this.flagTextColor = jsonObject.flagTextColor;
		this.gap = jsonObject.gap;
		this.flag = jsonObject.flag;
		this.bomSeq = jsonObject.bomSeq;
		this.childPart = jsonObject.childPart;
		this.currentStock = jsonObject.currentStock;
		this.pullRate = jsonObject.pullRate;
		this.safetyStock = jsonObject.safetyStock;
		this.projectedStock = jsonObject.projectedStock;
		this.rowHighlightColor = jsonObject.rowHighlightColor;
		this.projectedStockCellColor = jsonObject.projectedStockCellColor;
		this.projectedStockTextColor = jsonObject.projectedStockTextColor;
		this.pqId = jsonObject.pqId;
		this.YZANo = jsonObject.YZANo;

		let instance = this;
		if (jsonObject.recommendationCalculations != null) {
			jsonObject.recommendationCalculations.forEach(function (obj) {
				instance.recommendationCalculations.push(obj);
			});
		}

		if (jsonObject.sapOrderDetails != null) {
			jsonObject.sapOrderDetails.forEach(function (obj) {
				instance.sapOrderDetails.push(obj);
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
		if (this.id1) jsonObject.id1 = this.id1;
		if (this.id2) jsonObject.id2 = this.id2;

		if (this.dieSet) jsonObject.dieSet = this.dieSet;
		if (this.ptnLotSize) jsonObject.ptnLotSize = this.ptnLotSize;
		if (this.ptnStart) jsonObject.ptnStart = this.ptnStart;
		if (this.poTriggerHr) jsonObject.poTriggerHr = this.poTriggerHr;
		if (this.material) jsonObject.material = this.material;
		if (this.skidQty) jsonObject.skidQty = this.skidQty;
		if (this.recQty) jsonObject.recQty = this.recQty;
		if (this.adjustmentKanbans) jsonObject.adjustmentKanbans = this.adjustmentKanbans;
		if (this.orderedQty) jsonObject.orderedQty = this.orderedQty;
		if (this.stock) jsonObject.stock = this.stock;
		if (this.order) jsonObject.order = this.order;
		if (this.skip) jsonObject.skip = this.skip;
		if (this.status) jsonObject.status = this.status;
		if (this.recommQtyValue) jsonObject.recommQtyValue = this.recommQtyValue;
		if (this.orderedQtyValue) jsonObject.orderedQtyValue = this.orderedQtyValue;
		if (this.orderDateAndTime) jsonObject.orderDateAndTime = this.orderDateAndTime;
		if (this.refPOQty) jsonObject.refPOQty = this.refPOQty;
		if (this.refPONumber) jsonObject.refPONumber = this.refPONumber;
		if (this.gap) jsonObject.gap = this.gap;
		if (this.gapCellColor) jsonObject.gapCellColor = this.gapCellColor;
		if (this.gapTextColor) jsonObject.gapTextColor = this.gapTextColor;
		if (this.rowColor) jsonObject.rowColor = this.rowColor;
		if (this.cancel) jsonObject.cancel = this.cancel;
		if (this.flag) jsonObject.flag = this.flag;
		if (this.bomSeq) jsonObject.bomSeq = this.bomSeq;
		if (this.childPart) jsonObject.childPart = this.childPart;
		if (this.currentStock) jsonObject.currentStock = this.currentStock;
		if (this.pullRate) jsonObject.pullRate = this.pullRate;
		if (this.safetyStock) jsonObject.safetyStock = this.safetyStock;
		if (this.projectedStock) jsonObject.projectedStock = this.projectedStock;
		if (this.pqId) jsonObject.pqId = this.pqId;
		if (this.rowHighlightColor) jsonObject.rowHighlightColor = this.rowHighlightColor;
		if (this.projectedStockCellColor) jsonObject.projectedStockCellColor = this.projectedStockCellColor;
		if (this.projectedStockTextColor) jsonObject.projectedStockTextColor = this.projectedStockTextColor;
		if (this.statusCellColor) jsonObject.statusCellColor = this.statusCellColor;
		if (this.statusTextColor) jsonObject.statusTextColor = this.statusTextColor;
		if (this.statusCellColorTBO) jsonObject.statusCellColorTBO = this.statusCellColorTBO;
		if (this.statusTextColorTBO) jsonObject.statusTextColorTBO = this.statusTextColorTBO;
		if (this.flagTextColor) jsonObject.flagTextColor = this.flagTextColor;
		if (this.YZANo) jsonObject.YZANo = this.YZANo;
		if (this.prevAdjustmentKanbans) jsonObject.prevAdjustmentKanbans = this.prevAdjustmentKanbans;
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

class RecommendationCalculationsEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();

		this.id = null;
		this.material = null;
		this.kanbansInCirculation = null;
		this.onOrder = null;
		this.stock = null;
		this.kanbansReturned = null;
		this.recOrder = null;
		this.adjustment = null;
		this.ordered = null;
		this.onOrderQty = null;
	}

	populateFields(jsonObject) {
		this.id = jsonObject.id;
		this.material = jsonObject.material;
		this.kanbansInCirculation = jsonObject.kanbansInCirculation;
		this.onOrder = jsonObject.onOrder;
		this.stock = jsonObject.stock;
		this.kanbansReturned = jsonObject.kanbansReturned;
		this.recOrder = jsonObject.recOrder;
		this.adjustment = jsonObject.adjustment;
		this.ordered = jsonObject.ordered;
		this.onOrderQty = jsonObject.onOrderQty;
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

		if (this.id) jsonObject.id = this.id;
		if (this.material) jsonObject.material = this.material;
		if (this.kanbansInCirculation) jsonObject.kanbansInCirculation = this.kanbansInCirculation;
		if (this.onOrder) jsonObject.onOrder = this.onOrder;
		if (this.stock) jsonObject.stock = this.stock;
		if (this.kanbansReturned) jsonObject.kanbansReturned = this.kanbansReturned;
		if (this.recOrder) jsonObject.recOrder = this.recOrder;
		if (this.adjustment) jsonObject.adjustment = this.adjustment;
		if (this.ordered) jsonObject.ordered = this.ordered;
		if (this.onOrderQty) jsonObject.onOrderQty = this.onOrderQty;

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

class OtherMaterialEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();

		this.dieSet = null;
		this.dieStorageBay = null;
		this.EffectiveFrom = ''
	}

	populateFields(jsonObject) {
		this.dieSet = jsonObject.dieSet;
		this.dieStorageBay = jsonObject.dieStorageBay;
		this.EffectiveFrom = jsonObject.EffectiveFrom;
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

		if (this.dieSet) jsonObject.dieSet = this.dieSet;
		if (this.dieStorageBay) jsonObject.dieStorageBay = this.dieStorageBay;
		if (this.EffectiveFrom) jsonObject.EffectiveFrom = this.EffectiveFrom;
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

class SapOrderDetailsEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();

		this.id = null;
		this.material = null;
		this.orderedQty = null;
		this.refPONo = null;
		this.refPOQty = null;
		this.gap = null;
		this.gapCellColor = null;
		this.gapTextColor = null;
		this.rowColor = null;
		this.del = 'delIcon-20x20';
		this.add = 'addIcon-20x20';
		this.poNoList = [];
	}

	populateFields(jsonObject) {
		this.id = jsonObject.id;
		this.material = jsonObject.material;
		this.orderedQty = jsonObject.orderedQty;
		this.refPONo = jsonObject.refPONo;
		this.refPOQty = jsonObject.refPOQty;
		this.gap = jsonObject.gap;
		this.gapCellColor = jsonObject.gapCellColor;
		this.gapTextColor = jsonObject.gapTextColor;
		this.rowColor = jsonObject.rowColor;

		let instance = this;

		if (jsonObject.poNoList != null) {
			jsonObject.poNoList.forEach(function (obj) {
				const entity = new MaterialProcurementRefPONoEntity();
				entity.populateFields(obj);
				instance.poNoList.push(entity);
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

		if (this.id) jsonObject.id = this.id;
		if (this.material) jsonObject.material = this.material;
		if (this.orderedQty) jsonObject.orderedQty = this.orderedQty;
		if (this.refPONo) jsonObject.refPONo = this.refPONo;
		if (this.refPOQty) jsonObject.refPOQty = this.refPOQty;
		if (this.gap) jsonObject.gap = this.gap;
		if (this.gapCellColor) jsonObject.gapCellColor = this.gapCellColor;
		if (this.gapTextColor) jsonObject.gapTextColor = this.gapTextColor;
		if (this.rowColor) jsonObject.rowColor = this.rowColor;
		if (this.poNoList) jsonObject.poNoList = this.poNoList;
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

class MaterialProcurementToBeOrderedEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.date = null;
		this.line = null;
		this.orderCycle = null;
		this.recommendationCalculations = null;
		this.grid = null;
		this.addOtherMaterial = null;
		this.flvtPartsAndPartsBelowSafetyStock = null;
	}

	populateFields(jsonObject) {
		this.date = jsonObject.header.date;
		this.line = jsonObject.header.line;
		this.orderCycle = jsonObject.header.orderCycle;

		this.recommendationCalculations = [];
		this.grid = [];
		this.addOtherMaterial = [];
		this.flvtPartsAndPartsBelowSafetyStock = [];

		let instance = this;

		if (jsonObject.recommendationCalculations != null) {
			jsonObject.recommendationCalculations.forEach(function (obj) {
				const entity = new RecommendationCalculationsEntity();
				entity.populateFields(obj);
				instance.recommendationCalculations.push(entity);
			});
		}

		if (jsonObject.grid != null) {
			jsonObject.grid.forEach(function (obj) {
				const entity = new MaterialProcurementGridLineEntity();
				entity.populateFields(obj);
				instance.grid.push(entity);
			});
		}

		if (jsonObject.flvtPartsAndPartsBelowSafetyStock != null) {
			jsonObject.flvtPartsAndPartsBelowSafetyStock.forEach(function (obj) {
				const entity = new MaterialProcurementGridLineEntity();
				entity.populateFields(obj);
				instance.flvtPartsAndPartsBelowSafetyStock.push(entity);
			});
		}

		if (jsonObject.addOtherMaterial != null) {
			jsonObject.addOtherMaterial.forEach(function (obj) {
				const entity = new OtherMaterialEntity();
				entity.populateFields(obj);
				instance.addOtherMaterial.push(entity);
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

	toString() {
		return this.getJSONString();
	}

	toJSONObject() {
		let jsonObject = {};

		if (this.date) jsonObject.date = this.date;
		if (this.line) jsonObject.line = this.line;
		if (this.orderCycle) jsonObject.orderCycle = this.orderCycle;

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

class MaterialProcurementOrderedEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.date = null;
		this.line = null;
		this.orderCycle = null;

		this.recommendationCalculations = null;
		this.grid = null;
		this.sapOrderDetails = null;
	}

	populateFields(jsonObject) {
		this.date = jsonObject.header.date;
		this.line = jsonObject.header.line;
		this.orderCycle = jsonObject.header.orderCycle;

		this.recommendationCalculations = [];
		this.grid = [];
		this.sapOrderDetails = [];

		let instance = this;

		if (jsonObject.recommendationCalculations != null) {
			jsonObject.recommendationCalculations.forEach(function (obj) {
				const entity = new RecommendationCalculationsEntity();
				entity.populateFields(obj);
				instance.recommendationCalculations.push(entity);
			});
		}

		if (jsonObject.grid != null) {
			jsonObject.grid.forEach(function (obj) {
				const entity = new MaterialProcurementGridLineEntity();
				entity.populateFields(obj);
				instance.grid.push(entity);
			});
		}

		if (jsonObject.sapOrderDetails != null) {
			jsonObject.sapOrderDetails.forEach(function (obj) {
				const entity = new SapOrderDetailsEntity();
				entity.populateFields(obj);
				instance.sapOrderDetails.push(entity);
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

	toString() {
		return this.getJSONString();
	}

	toJSONObject() {
		let jsonObject = {};

		if (this.date) jsonObject.date = this.date;
		if (this.line) jsonObject.line = this.line;
		if (this.orderCycle) jsonObject.orderCycle = this.orderCycle;

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

class MaterialProcurementRefPONoEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.refPONo = null;
		this.refPOQty = null;
	}

	populateFields(jsonObject) {
		this.refPONo = jsonObject.refPONo;
		this.refPOQty = jsonObject.refPOQty;
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

	toString() {
		return this.getJSONString();
	}

	toJSONObject() {
		let jsonObject = {};

		if (this.refPONo) jsonObject.refPONo = this.refPONo;
		if (this.refPOQty) jsonObject.refPOQty = this.refPOQty;

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

class MaterialHostDetails extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.url = 'http://localhost:8081/';
	}
}

class MaterialProcurementEditoPanelGridEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.actualID = null;
		this.ptns = null;
		this.seq = null;
		this.planStartAndEnd = null;
		this.loadTime = null;
		this.dieBay = null;
		this.dieSet = null;
		this.ptnLotSize = null;
		this.recLotSize = null;
		this.planLotSize = null;
		this.status = null;
		this.lotNo = null;
		this.actualLotSize = null;
		this.actualStartAndEnd = null;
		this.actualLoadTime = null;
		this.delay = null;
		this.planLoadTime = null;
		this.partsStock = null;
		this.materialStock = null;
		this.emptyPallets = null;
		this.lotAdjustments = null;
		this.rowColor = null;
		this.statusTextColor = null;
		this.statusTextBgColor = null;
		this.loadTimeCalculations = null;
		this.plannedLine = null;
		this.disContinue = null;
		this.skipProduction = null;
		this.reason = null;

	}

	populateFields(jsonObject) {
		this.actualID = jsonObject.actualID;
		this.ptns = jsonObject.ptns;
		this.seq = jsonObject.seq;
		this.planStartAndEnd = jsonObject.planStartAndEnd;
		this.loadTime = jsonObject.loadTime;
		this.dieBay = jsonObject.dieBay;
		this.dieSet = jsonObject.dieSet;
		this.ptnLotSize = jsonObject.ptnLotSize;
		this.recLotSize = jsonObject.recLotSize;
		this.planLotSize = jsonObject.planLotSize;
		this.status = jsonObject.status;
		this.lotNo = jsonObject.lotNo;
		this.actualLotSize = jsonObject.actualLotSize;
		this.actualStartEnd = jsonObject.actualStartEnd;
		this.actualStartAndEnd = jsonObject.actualStartAndEnd;
		this.actualLoadTime = jsonObject.actualLoadTime;
		this.delay = jsonObject.delay;
		this.planLoadTime = jsonObject.planLoadTime;
		this.rowColor = jsonObject.rowColor;
		this.statusTextColor = jsonObject.statusTextColor;
		this.statusTextBgColor = jsonObject.statusTextBgColor;
		this.partsStock = [];
		this.materialStock = [];
		this.emptyPallets = [];
		this.lotAdjustments = [];
		this.loadTimeCalculations = [];
		this.plannedLine = [];
		this.disContinue = [];
		this.skipProduction = [];
		this.reason = jsonObject.reason;

		// if(jsonObject.plannedLineStopCalculations != null) {
		// 	let ent = new PlannedLineStopEntity();
		// 	ent.populateFields(jsonObject.plannedLineStopCalculations);
		// 	this.plannedLineStopCalculations = ent;
		// }

		let instance = this;

		if (jsonObject.loadTimeCalculations != null) {
			jsonObject.loadTimeCalculations.forEach(function (obj) {
				instance.loadTimeCalculations.push(obj);
			});
		}
		if (jsonObject.plannedLine != null) {
			jsonObject.plannedLine.forEach(function (obj) {
				instance.plannedLine.push(obj);
			});
		}

		if (jsonObject.partsStock != null) {
			jsonObject.partsStock.forEach(function (obj) {
				instance.partsStock.push(obj);
			});
		}

		if (jsonObject.materialStock != null) {
			jsonObject.materialStock.forEach(function (obj) {
				instance.materialStock.push(obj);
			});
		}

		if (jsonObject.emptyPallets != null) {
			jsonObject.emptyPallets.forEach(function (obj) {
				instance.emptyPallets.push(obj);
			});
		}

		if (jsonObject.lotAdjustments != null) {
			jsonObject.lotAdjustments.forEach(function (obj) {
				instance.lotAdjustments.push(obj);
			});
		}
		if (jsonObject.disContinue != null) {
			jsonObject.disContinue.forEach(function (obj) {
				instance.disContinue.push(obj);
			});
		}
		if (jsonObject.skipProduction != null) {
			jsonObject.skipProduction.forEach(function (obj) {
				instance.skipProduction.push(obj);
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

		if (this.ptns) jsonObject.ptns = this.ptns;
		if (this.seq) jsonObject.ptns = this.seq;
		if (this.planStartAndEnd) jsonObject.planStartAndEnd = this.planStartAndEnd;
		if (this.loadTime !== null) jsonObject.loadTime = this.loadTime;
		if (this.dieBay) jsonObject.dieBay = this.dieBay;
		if (this.dieSet) jsonObject.dieSet = this.dieSet;
		if (this.ptnLotSize) jsonObject.ptnLotSize = this.ptnLotSize;
		if (this.recLotSize) jsonObject.recLotSize = this.recLotSize;
		if (this.planLotSize) jsonObject.planLotSize = this.planLotSize;
		if (this.status) jsonObject.status = this.status;
		if (this.lotNo) jsonObject.lotNo = this.lotNo;
		if (this.actualLotSize) jsonObject.actualLotSize = this.actualLotSize;
		if (this.actualStartAndEnd) jsonObject.actualStartAndEnd = this.actualStartAndEnd;
		if (this.actualLoadTime !== null) jsonObject.actualLoadTime = this.actualLoadTime;
		if (this.delay) jsonObject.delay = this.delay;
		if (this.planLoadTime) jsonObject.planLoadTime = this.planLoadTime;
		if (this.partsStock) jsonObject.partsStock = this.partsStock;
		if (this.materialStock) jsonObject.materialStock = this.materialStock;
		if (this.emptyPallets) jsonObject.emptyPallets = this.emptyPallets;
		if (this.lotAdjustments) jsonObject.lotAdjustments = this.lotAdjustments;
		if (this.rowColor) jsonObject.rowColor = this.rowColor;
		if (this.statusTextColor) jsonObject.statusTextColor = this.statusTextColor;
		if (this.statusTextBgColor) jsonObject.statusTextBgColor = this.statusTextBgColor;
		if (this.reason) jsonObject.reason = this.reason;

		if (this.loadTimeCalculations != null) {
			const loadTimeCalculations = [];
			this.loadTimeCalculations.forEach(function (obj) {
				loadTimeCalculations.push(obj.toJSONObject());
			});
			jsonObject.loadTimeCalculations = loadTimeCalculations;
		}

		if (this.plannedLine != null) {
			const plannedLine = [];
			this.plannedLine.forEach(function (obj) {
				plannedLine.push(obj.toJSONObject());
			});
			jsonObject.plannedLine = plannedLine;
		}

		if (this.disContinue != null) {
			const disContinue = [];
			this.disContinue.forEach(function (obj) {
				disContinue.push(obj.toJSONObject());
			});
			jsonObject.disContinue = disContinue;
		}

		if (this.skipProduction != null) {
			const skipProduction = [];
			this.skipProduction.forEach(function (obj) {
				skipProduction.push(obj.toJSONObject());
			});
			jsonObject.skipProduction = skipProduction;
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

class SkipMaterialEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.reason = null; // Reason for skipping production
	}

	populateFields(jsonObject) {
		this.reason = jsonObject.reason;
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
		let jsonObject = {};
		if (this.reason) jsonObject.reason = this.reason;
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
class CancelMaterialEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.reason = null; // Reason for skipping production
	}

	populateFields(jsonObject) {
		this.reason = jsonObject.reason;
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
		let jsonObject = {};
		if (this.reason) jsonObject.reason = this.reason;
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