
class ProductionControlGridLineEntity extends palms.exported.framework.entity.Entity {
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
		this.dieSetTextColor = null;
		this.dieSetTextBgColor = null;
		this.loadTimeCalculations = null;
		this.plannedLine = null;
		this.disContinue=null;
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
		this.dieSetTextColor = jsonObject.dieSetTextColor;
		this.dieSetTextBgColor = jsonObject.dieSetTextBgColor;
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

		if(jsonObject.loadTimeCalculations != null) {
			jsonObject.loadTimeCalculations.forEach(function(obj) {
				instance.loadTimeCalculations.push(obj);
			});
		}
		if(jsonObject.plannedLine != null) {
			jsonObject.plannedLine.forEach(function(obj) {
				instance.plannedLine.push(obj);
			});
		}
		
		if(jsonObject.partsStock != null) {
			jsonObject.partsStock.forEach(function(obj) {
				instance.partsStock.push(obj);
			});
		}
		
		if(jsonObject.materialStock != null) {
			jsonObject.materialStock.forEach(function(obj) {
			instance.materialStock.push(obj);
			});
		}
		
		if(jsonObject.emptyPallets != null) {
			jsonObject.emptyPallets.forEach(function(obj) {
			instance.emptyPallets.push(obj);
			});
		}
		
		if(jsonObject.lotAdjustments != null) {
			jsonObject.lotAdjustments.forEach(function(obj) {
			instance.lotAdjustments.push(obj);
			});
		}	
		if(jsonObject.disContinue != null) {
			jsonObject.disContinue.forEach(function(obj) {
				instance.disContinue.push(obj);
			});
		}
		if(jsonObject.skipProduction != null) {
			jsonObject.skipProduction.forEach(function(obj) {
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
		if (this.dieSetTextColor) jsonObject.dieSetTextColor = this.dieSetTextColor;
		if (this.dieSetTextBgColor) jsonObject.dieSetTextBgColor = this.dieSetTextBgColor;
		if (this.reason) jsonObject.reason = this.reason;

		if(this.loadTimeCalculations != null) {
			const loadTimeCalculations = [];
			this.loadTimeCalculations.forEach(function(obj) {
				loadTimeCalculations.push(obj.toJSONObject());
			});
			jsonObject.loadTimeCalculations = loadTimeCalculations;
		}

		if(this.plannedLine != null) {
			const plannedLine = [];
			this.plannedLine.forEach(function(obj) {
				plannedLine.push(obj.toJSONObject());
			});
			jsonObject.plannedLine = plannedLine;
		}

		if(this.disContinue != null) {
			const disContinue = [];
			this.disContinue.forEach(function(obj) {
				disContinue.push(obj.toJSONObject());
			});
			jsonObject.disContinue = disContinue;
		}

		if(this.skipProduction != null) {
			const skipProduction = [];
			this.skipProduction.forEach(function(obj) {
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

class ProductionControlGridLineChildEntity extends ProductionControlGridLineEntity {
	constructor() {
        super();
		
		this.childPart = null;
		this.flvtLotSize = null;
		this.bomSeq = null;
		this.safetyStock = null;
		this.prodTriggerHr = null;
		this.projectedStock = null;
		this.material = null;
		this.onOrder = null;
		this.stock = null;
		this.seq = null;
		this.bomQty = null;
		this.actionButton = "Add To Plan";
		this.rowHighlightColor = null;
		this.projectedStockCellColor = null;
		this.projectedStockTextColor = null;
    }
	
	populateFields(jsonObject) {
		super.populateFields(jsonObject);
		
		this.childPart = jsonObject.childPart;
		this.flvtLotSize = jsonObject.flvtLotSize;
		this.bomSeq = jsonObject.bomSeq;
		this.safetyStock = jsonObject.safetyStock;
		this.prodTriggerHr = jsonObject.prodTriggerHr;
		this.projectedStock = jsonObject.projectedStock;
		this.material = jsonObject.material;
		this.onOrder = jsonObject.onOrder;
		this.stock = jsonObject.stock;
		this.seq = jsonObject.seq;
		this.bomQty = jsonObject.bomQty;
		this.rowHighlightColor = jsonObject.rowHighlightColor;
		this.projectedStockCellColor = jsonObject.projectedStockCellColor;
		this.projectedStockTextColor = jsonObject.projectedStockTextColor;
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
		const jsonObject = super.toJSONObject();

		if (this.childPart) jsonObject.childPart = this.childPart;
		if (this.flvtLotSize) jsonObject.flvtLotSize = this.flvtLotSize;
		if (this.bomSeq) jsonObject.bomSeq = this.bomSeq;
		if (this.safetyStock) jsonObject.safetyStock = this.safetyStock;
		if (this.prodTriggerHr) jsonObject.prodTriggerHr = this.prodTriggerHr;
		if (this.projectedStock) jsonObject.projectedStock = this.projectedStock;
		if (this.material) jsonObject.material = this.material;
		if (this.onOrder) jsonObject.onOrder = this.onOrder;
		if (this.stock) jsonObject.stock = this.stock;
		if (this.seq) jsonObject.seq = this.seq;
		if (this.bomQty) jsonObject.bomQty = this.bomQty;
		if (this.rowHighlightColor) jsonObject.rowHighlightColor = this.rowHighlightColor;
		if (this.projectedStockCellColor) jsonObject.projectedStockCellColor = this.projectedStockCellColor;
		if (this.projectedStockTextColor) jsonObject.projectedStockTextColor = this.projectedStockTextColor;

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

class PlannedLineStopEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.id = null;
		this.lineNo = null;
		this.shift = null;
		this.fromDateTime = null;
		this.toDateTime = null;
		this.remarks = null;

	}

	populateFields(jsonObject) {
		try {
			this.id = jsonObject.id;
			this.lineNo = jsonObject.lineNo;
			this.shift = jsonObject.shift;
			this.fromDateTime = jsonObject.fromDateTime;
			this.toDateTime = jsonObject.toDateTime;
			this.remarks = jsonObject.remarks;
		} catch (e) {
			console.error('Error populating fields:', e);
		}
	}

	get(property) {
		try {
			return this[property];
		} catch (e) {
			console.error('Error getting property:', e);
			return null;
		}
	}

	set(property, value) {
		try {
			this[property] = value;
			return value;
		} catch (e) {
			console.error('Error setting property:', e);
			return null;
		}
	}

	getJSONString() {
		try {
			return JSON.stringify(this.toJSONObject());
		} catch (e) {
			console.error('Error converting to JSON string:', e);
			return null;
		}
	}

	toJSONObject() {
		
			let jsonObject = {};
			if (this.id) jsonObject.id = this.id;
			if (this.lineNo) jsonObject.lineNo = this.lineNo;
			if (this.shift) jsonObject.shift = this.shift;
			if (this.fromDateTime) jsonObject.fromDateTime = this.fromDateTime;
			if (this.toDateTime) jsonObject.toDateTime = this.toDateTime;
			if (this.remarks) jsonObject.remarks = this.remarks;

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

class LoadTimeEntity extends palms.exported.framework.entity.Entity {
	constructor() {
		super();
		this.id = null;
		this.sdLineProdTime = null;
		this.efficiency = null;
		this.efficiencyPT = null;
		this.udTime = null;
		this.ctTime = null;
		this.qcTime = null;
		this.sdTime = null;
		this.spm = null;
		this.sdt = null;
		this.mct = null;
		this.pct = null;
		this.lineProdTime = null;
		this.totalProdTime = null;
		this.sdWaitTime = null;
		this.bomType = null;

	}
	
	populateFields(jsonObject) {
		try {
			this.id = jsonObject.id;
			this.sdLineProdTime = jsonObject.sdLineProdTime;
			this.efficiency = jsonObject.efficiency;
			this.efficiencyPT = jsonObject.efficiencyPT;
			this.udTime = jsonObject.udTime;
			this.ctTime = jsonObject.ctTime;
			this.qcTime = jsonObject.qcTime;
			this.sdTime = jsonObject.sdTime;
			this.spm = jsonObject.spm;
			this.sdt = jsonObject.sdt;
			this.mct = jsonObject.mct;
			this.pct = jsonObject.pct;
			this.lineProdTime= jsonObject.lineProdTime;
			this.totalProdTime = jsonObject.totalProdTime;
			this.sdWaitTime = jsonObject.sdWaitTime;
			this.bomType = jsonObject.bomType;



		} catch (e) {
			console.error('Error populating fields:', e);
		}
	}

	get(property) {
		try {
			return this[property];
		} catch (e) {
			console.error('Error getting property:', e);
			return null;
		}
	}

	set(property, value) {
		try {
			this[property] = value;
			return value;
		} catch (e) {
			console.error('Error setting property:', e);
			return null;
		}
	}

	getJSONString() {
		try {
			return JSON.stringify(this.toJSONObject());
		} catch (e) {
			console.error('Error converting to JSON string:', e);
			return null;
		}
	}

	toJSONObject() {
		
			let jsonObject = {};
			if (this.id) jsonObject.id = this.id;
			if (this.sdLineProdTime) jsonObject.sdLineProdTime = this.sdLineProdTime;
			if (this.efficiency) jsonObject.efficiency = this.efficiency;
			if (this.efficiencyPT) jsonObject.efficiencyPT = this.efficiencyPT;
			if (this.udTime) jsonObject.udTime = this.udTime;
			if (this.ctTime) jsonObject.ctTime = this.ctTime;
			if (this.qcTime) jsonObject.qcTime = this.qcTime;
			if (this.sdTime) jsonObject.sdTime = this.sdTime;
			if (this.spm) jsonObject.spm = this.spm;
			if (this.sdt) jsonObject.sdt = this.sdt;
			if (this.mct) jsonObject.mct = this.mct;
			if (this.pct) jsonObject.pct = this.pct;
			if (this.lineProdTime) jsonObject.lineProdTime = this.lineProdTime;
			if (this.totalProdTime) jsonObject.totalProdTime = this.totalProdTime;
			if (this.sdWaitTime) jsonObject.sdWaitTime = this.sdWaitTime;
			if (this.bomType) jsonObject.bomType = this.bomType;
			
			


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

class PartsStockEntity extends palms.exported.framework.entity.Entity {

	constructor() {
        super();
		this.id = null;
		this.bomSeqNo = null;
        this.childPart = null;
        this.qpc = null;
        this.orderToLine = null;
        this.kbsInCirculation = null;
		this.stock = null;
		this.kbsRtd = null;
		this.recKBs = null;
		this.adj = null;
		this.planLotSize = null;
		this.onHold = null;
		this.bomType = null;
    }
	
	populateFields(jsonObject) {
		this.id = jsonObject.id;
		this.bomSeqNo = jsonObject.bomSeqNo;
		this.childPart = jsonObject.childPart;
		this.qpc = jsonObject.qpc;
		this.orderToLine = jsonObject.orderToLine;
		this.kbsInCirculation = jsonObject.kbsInCirculation;
		this.stock = jsonObject.stock;
		this.kbsRtd = jsonObject.kbsRtd;
		this.recKBs = jsonObject.recKBs;
		this.adj = jsonObject.adj;
		this.planLotSize = jsonObject.planLotSize;
		this.onHold = jsonObject.onHold;
		this.bomType = jsonObject.bomType;
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

        if (this.id) jsonObject.id = this.id;
		if (this.bomSeqNo) jsonObject.bomSeqNo = this.bomSeqNo;
		if (this.childPart) jsonObject.childPart = this.childPart;
		if (this.qpc) jsonObject.qpc = this.qpc;
		if (this.orderToLine) jsonObject.orderToLine = this.orderToLine;
		if (this.kbsInCirculation) jsonObject.kbsInCirculation = this.kbsInCirculation;
		if (this.stock) jsonObject.stock = this.stock;
		if (this.kbsRtd) jsonObject.kbsRtd = this.kbsRtd;
		if (this.recKBs) jsonObject.recKBs = this.recKBs;
		if (this.adj) jsonObject.adj = this.adj;
		if (this.planLotSize) jsonObject.planLotSize = this.planLotSize;
		if (this.onHold) jsonObject.onHold = this.onHold;
		if (this.bomType) jsonObject.bomType = this.bomType;
		
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

class MaterialStockEntity extends palms.exported.framework.entity.Entity {

	constructor() {
        super();
        this.id = null;
		this.material = null;
		this.skidQty = null;
		this.onOrder = null;
		this.stock = null;
		this.onHold = null;
		this.bomType = null;
    }
	
	populateFields(jsonObject) {
		this.id = jsonObject.id;
		this.material = jsonObject.material;
		this.skidQty = jsonObject.skidQty;
		this.onOrder = jsonObject.onOrder;
		this.stock = jsonObject.stock;
		this.onHold = jsonObject.onHold;
		this.bomType = jsonObject.bomType;
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

        if (this.id) jsonObject.id = this.id;
		if (this.material) jsonObject.material = this.material;
		if (this.skidQty) jsonObject.skidQty = this.skidQty;
		if (this.onOrder) jsonObject.onOrder = this.onOrder;
		if (this.stock) jsonObject.stock = this.stock;
		if (this.onHold) jsonObject.onHold = this.onHold;
		if (this.bomType) jsonObject.bomType = this.bomType;
		
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

class EmptyPalletsEntity extends palms.exported.framework.entity.Entity {

	constructor() {
        super();
		this.id = null;
        this.palletType = null;
		this.empty = null;
		this.wip = null;
		this.onHold = null;
		this.bomType = null;
    }
	
	populateFields(jsonObject) {
		this.id = jsonObject.id;
		this.palletType = jsonObject.palletType;
		this.empty = jsonObject.empty;
		this.wip = jsonObject.wip;
		this.onHold = jsonObject.onHold;
		this.bomType = jsonObject.bomType;
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

        if (this.id) jsonObject.id = this.id;
		if (this.palletType) jsonObject.palletType = this.palletType;
		if (this.empty) jsonObject.empty = this.empty;
		if (this.wip) jsonObject.wip = this.wip;
		if (this.onHold) jsonObject.onHold = this.onHold;
		if (this.bomType) jsonObject.bomType = this.bomType;
		
		
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

class LotAdjustmentEntity extends palms.exported.framework.entity.Entity {

	constructor() {
        super();
		this.id = null;
        this.ptnLotSize = null;
		this.parts = null;
		this.qpc = null;
		this.recOrder = null;
		this.prodOrder = null;
		this.planLotSize = null;
		this.bomSeq = null;
		this.dieSet = null;
		this.kitItemID = null;
    }
	populateFields(jsonObject) {
		this.id = jsonObject.id;
		this.ptnLotSize = jsonObject.ptnLotSize;
		this.parts = jsonObject.parts;
		this.qpc = jsonObject.qpc;
		this.recOrder = jsonObject.recOrder;
		this.prodOrder = jsonObject.prodOrder;
		this.planLotSize = jsonObject.planLotSize;
		this.bomSeq = jsonObject.bomSeq;
		this.dieSet = jsonObject.dieSet;
		this.kitItemID = jsonObject.kitItemID;

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

        if (this.id) jsonObject.id = this.id;
		if (this.ptnLotSize) jsonObject.ptnLotSize = this.ptnLotSize;
		if (this.parts) jsonObject.parts = this.parts;
		if (this.qpc) jsonObject.qpc = this.qpc;
		if (this.recOrder) jsonObject.recOrder = this.recOrder;
		if (this.prodOrder) jsonObject.prodOrder = this.prodOrder;
		if (this.planLotSize) jsonObject.planLotSize = this.planLotSize;
		if (this.bomSeq) jsonObject.bomSeq = this.bomSeq;
		if (this.dieSet) jsonObject.dieSet = this.dieSet;
		if (this.kitItemID) jsonObject.kitItemID = this.kitItemID;
		
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

class OtherPartsEntity extends palms.exported.framework.entity.Entity {
    constructor() {
        super();
        this.dieSet = null;
        this.dieStorageBay = null;
    }

    populateFields(jsonObject) {
        this.dieSet = jsonObject.dieSet;
        this.dieStorageBay = jsonObject.dieStorageBay;
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
        if (this.dieSet) jsonObject.dieSet = this.dieSet;
        if (this.dieStorageBay) jsonObject.dieStorageBay = this.dieStorageBay;
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

class ProductionControlCurrentShiftEntity extends palms.exported.framework.entity.Entity {
	constructor() {
        super();
		this.currentDate = null;
        this.currentTime = null;
		this.shift = null;
		this.line = null;
		this.lineID = null;
		this.user = null;
		this.shiftGroup = null;
		this.shiftCellColor = null;
		this.partsStock = null;
		this.materialStock = null;
		this.emptyPallets = null;
		this.lotAdjustments = null;
		this.grid = null;
		this.flvtParts = null;
		this.otherParts = null;
		this.loadTimeCalculations = null;
		this.plannedLine = null;
		this.skipProduction=null;
		this.disContinue = null;
		
    }
	
	populateFields(jsonObject) {
		this.currentDate = jsonObject.header.currentDate;
		this.currentTime = jsonObject.header.currentTime;
		this.shift = jsonObject.header.shift;
		this.line = jsonObject.header.line;
		this.shiftGroup = jsonObject.header.shiftGroup;
		this.shiftCellColor = jsonObject.header.shiftCellColor;
		this.lineID = jsonObject.header.lineID;
		this.user = jsonObject.header.user;
		this.partsStock = [];
		this.materialStock = [];
		this.emptyPallets = [];
		this.lotAdjustments = [];
		this.grid = [];
		this.flvtParts = [];
		this.otherParts = [];
		this.loadTimeCalculations = [];
		this.plannedLine = [];
		this.skipProduction = [];
		this.disContinue = [];
		
		let instance = this;

		// Populate loadTimeCal array
        if (jsonObject.loadTimeCalculations != null) {
            jsonObject.loadTimeCalculations.forEach(function(obj) {
                const entity = new LoadTimeEntity();
                entity.populateFields(obj);
                instance.loadTimeCalculations.push(entity);
            }); // Pass `this` as the second argument to `forEach` to use the correct context
        }

        // Populate plannedLine array
        if (jsonObject.plannedLine != null) {
            jsonObject.plannedLine.forEach(function(obj) {
                const entity = new PlannedLineStopEntity();
                entity.populateFields(obj);
                instance.plannedLine.push(entity);
            }); // Pass `this` as the second argument to `forEach` to use the correct context
        }
		
		if(jsonObject.partsStock != null) {
			jsonObject.partsStock.forEach(function(obj) {
				const entity = new PartsStockEntity();
				entity.populateFields(obj);
				instance.partsStock.push(entity);
			});
		}
		
		if(jsonObject.materialStock != null) {
			jsonObject.materialStock.forEach(function(obj) {
				const entity = new MaterialStockEntity();
				entity.populateFields(obj);
				instance.materialStock.push(entity);
			});
		}
		
		if(jsonObject.emptyPallets != null) {
			jsonObject.emptyPallets.forEach(function(obj) {
				const entity = new EmptyPalletsEntity();
				entity.populateFields(obj);
				instance.emptyPallets.push(entity);
			});
		}
		
		if(jsonObject.lotAdjustments != null) {
			jsonObject.lotAdjustments.forEach(function(obj) {
				const entity = new LotAdjustmentEntity();
				entity.populateFields(obj);
				instance.lotAdjustments.push(entity);
			});
		}
		
		if(jsonObject.grid != null) {
			jsonObject.grid.forEach(function(obj) {
				const entity = new ProductionControlGridLineEntity();
				entity.populateFields(obj);
				instance.grid.push(entity);
			});
		}
		
		if(jsonObject.flvtParts != null) {
			jsonObject.flvtParts.forEach(function(obj) {
				const entity = new ProductionControlGridLineChildEntity();
				entity.populateFields(obj);
				instance.flvtParts.push(entity);
			});
		}
		
		if (jsonObject.otherParts != null) { 
            jsonObject.otherParts.forEach(function (obj) {
                const entity = new OtherPartsEntity(); 
                entity.populateFields(obj);
                instance.otherParts.push(entity);
            });
        }
		if (jsonObject.skipProduction != null) {
            jsonObject.skipProduction.forEach(function(obj) {
                const entity = new SkipProductionEntity();
                entity.populateFields(obj);
                instance.skipProduction.push(entity);
            }); 
		}
		if (jsonObject.disContinue != null) {
				jsonObject.disContinue.forEach(function(obj) {
					const entity = new DisContinueEntity();
					entity.populateFields(obj);
					instance.disContinue.push(entity);
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
        let header = {};

        if (this.currentDate) header.currentDate = this.currentDate;
		if (this.currentTime) header.currentTime = this.currentTime;
		if (this.shift) header.shift = this.shift;
		if (this.line) header.line = this.line;
		if (this.shiftGroup) header.shiftGroup = this.shiftGroup;
		if (this.shiftCellColor) header.shiftCellColor = this.shiftCellColor;
		if (this.lineID) header.lineID = this.lineID;
		if (this.user) header.user = this.user;

		let jsonObject = {};
		jsonObject.header = header;

		if(this.partsStock != null) {
			const partsStock = [];
			this.partsStock.forEach(function(obj) {
				partsStock.push(obj.toJSONObject());
			});
			jsonObject.partsStock = partsStock;
		}

		if(this.materialStock != null) {
			const materialStock = [];
			this.materialStock.forEach(function(obj) {
				materialStock.push(obj.toJSONObject());
			});
			jsonObject.materialStock = materialStock;
		}

		if(this.emptyPallets != null) {
			const emptyPallets = [];
			this.emptyPallets.forEach(function(obj) {
				emptyPallets.push(obj.toJSONObject());
			});
			jsonObject.emptyPallets = emptyPallets;
		}

		if(this.lotAdjustments != null) {
			const lotAdjustments = [];
			this.lotAdjustments.forEach(function(obj) {
				lotAdjustments.push(obj.toJSONObject());
			});
			jsonObject.lotAdjustments = lotAdjustments;
		}

		if(this.grid != null) {
			const grid = [];
			this.grid.forEach(function(obj) {
				grid.push(obj.toJSONObject());
			});
			jsonObject.grid = grid;
		}

		if(this.flvtParts != null) {
			const flvtParts = [];
			this.flvtParts.forEach(function(obj) {
				flvtParts.push(obj.toJSONObject());
			});
			jsonObject.flvtParts = flvtParts;
		}

		if(this.otherParts != null) {
			const otherParts = [];
			this.otherParts.forEach(function(obj) {
				otherParts.push(obj.toJSONObject());
			});
			jsonObject.otherParts = otherParts;
		}

		if(this.loadTimeCalculations != null) {
			const loadTimeCalculations = [];
			this.loadTimeCalculations.forEach(function(obj) {
				loadTimeCalculations.push(obj.toJSONObject());
			});
			jsonObject.loadTimeCalculations = loadTimeCalculations;
		}

		if(this.plannedLine != null) {
			const plannedLine = [];
			this.plannedLine.forEach(function(obj) {
				plannedLine.push(obj.toJSONObject());
			});
			jsonObject.plannedLine = plannedLine;
		}

		if(this.skipProduction != null) {
			const skipProduction = [];
			this.skipProduction.forEach(function(obj) {
				skipProduction.push(obj.toJSONObject());
			});
			jsonObject.skipProduction = skipProduction;
		}

		if(this.disContinue != null) {
			const disContinue = [];
			this.disContinue.forEach(function(obj) {
				disContinue.push(obj.toJSONObject());
			});
			jsonObject.disContinue = disContinue;
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

class ProductionControlNextShiftEntity extends palms.exported.framework.entity.Entity {
	constructor() {
        super();
		this.currentDate = null;
        this.currentTime = null;
		this.shift = null;
		this.line = null;
		this.lineID = null;
		this.shiftGroup = null;
		this.shiftCellColor = null;
		this.grid = null;
    }
	
	populateFields(jsonObject) {
		this.currentDate = jsonObject.header.currentDate;
		this.currentTime = jsonObject.header.currentTime;
		this.shift = jsonObject.header.shift;
		this.line = jsonObject.header.line;
		this.lineID = jsonObject.header.lineID;
		this.shiftGroup = jsonObject.header.shiftGroup;
		this.shiftCellColor = jsonObject.header.shiftCellColor;
		this.grid = [];
		
		let instance = this;

		if(jsonObject.grid != null) {
			jsonObject.grid.forEach(function(obj) {
				const entity = new ProductionControlGridLineChildEntity();
				entity.populateFields(obj);
				instance.grid.push(entity);
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
        let header = {};

        if (this.currentDate) header.currentDate = this.currentDate;
		if (this.currentTime) header.currentTime = this.currentTime;
		if (this.shift) header.shift = this.shift;
		if (this.line) header.line = this.line;
		if(this.lineID) header.lineID = this.lineID;
		if (this.shiftGroup) header.shiftGroup = this.shiftGroup;
		if (this.shiftCellColor) header.shiftCellColor = this.shiftCellColor;

		let jsonObject = {};
		jsonObject.header = header;

		if(this.grid != null) {
			const grid = [];
			this.grid.forEach(function(obj) {
				grid.push(obj.toJSONObject());
			});
			jsonObject.grid = grid;
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

class ProductionControlFormNextShiftQueueEntity extends palms.exported.framework.entity.Entity {
	constructor() {
        super();
		this.currentDate = null;
        this.currentTime = null;
		this.shift = null;
		this.line = null;
		this.lineID = null;
		this.user = null;
		this.shiftGroup = null;
		this.shiftCellColor = null;
		this.partsStock = null;
		this.materialStock = null;
		this.emptyPallets = null;
		this.lotAdjustments = null;
		this.grid = null;
		this.flvtParts = null;
		this.otherParts = null;
		this.loadTimeCalculations = null;
		this.plannedLine = null;
		this.skipProduction=null;
		this.disContinue = null;
		
    }
	
	populateFields(jsonObject) {
		this.currentDate = jsonObject.header.currentDate;
		this.currentTime = jsonObject.header.currentTime;
		this.shift = jsonObject.header.shift;
		this.line = jsonObject.header.line;
		this.shiftGroup = jsonObject.header.shiftGroup;
		this.shiftCellColor = jsonObject.header.shiftCellColor;
		this.lineID = jsonObject.header.lineID;
		this.user = jsonObject.header.user;
		this.partsStock = [];
		this.materialStock = [];
		this.emptyPallets = [];
		this.lotAdjustments = [];
		this.grid = [];
		this.flvtParts = [];
		this.otherParts = [];
		this.loadTimeCalculations = [];
		this.plannedLine = [];
		this.skipProduction = [];
		this.disContinue = [];
		
		let instance = this;

		// Populate loadTimeCal array
        if (jsonObject.loadTimeCalculations != null) {
            jsonObject.loadTimeCalculations.forEach(function(obj) {
                const entity = new LoadTimeEntity();
                entity.populateFields(obj);
                instance.loadTimeCalculations.push(entity);
            }); // Pass `this` as the second argument to `forEach` to use the correct context
        }

        // Populate plannedLine array
        if (jsonObject.plannedLine != null) {
            jsonObject.plannedLine.forEach(function(obj) {
                const entity = new PlannedLineStopEntity();
                entity.populateFields(obj);
                instance.plannedLine.push(entity);
            }); // Pass `this` as the second argument to `forEach` to use the correct context
        }
		
		if(jsonObject.partsStock != null) {
			jsonObject.partsStock.forEach(function(obj) {
				const entity = new PartsStockEntity();
				entity.populateFields(obj);
				instance.partsStock.push(entity);
			});
		}
		
		if(jsonObject.materialStock != null) {
			jsonObject.materialStock.forEach(function(obj) {
				const entity = new MaterialStockEntity();
				entity.populateFields(obj);
				instance.materialStock.push(entity);
			});
		}
		
		if(jsonObject.emptyPallets != null) {
			jsonObject.emptyPallets.forEach(function(obj) {
				const entity = new EmptyPalletsEntity();
				entity.populateFields(obj);
				instance.emptyPallets.push(entity);
			});
		}
		
		if(jsonObject.lotAdjustments != null) {
			jsonObject.lotAdjustments.forEach(function(obj) {
				const entity = new LotAdjustmentEntity();
				entity.populateFields(obj);
				instance.lotAdjustments.push(entity);
			});
		}
		
		if(jsonObject.grid != null) {
			jsonObject.grid.forEach(function(obj) {
				const entity = new ProductionControlGridLineEntity();
				entity.populateFields(obj);
				instance.grid.push(entity);
			});
		}
		
		if(jsonObject.flvtParts != null) {
			jsonObject.flvtParts.forEach(function(obj) {
				const entity = new ProductionControlGridLineChildEntity();
				entity.populateFields(obj);
				instance.flvtParts.push(entity);
			});
		}
		
		if (jsonObject.otherParts != null) { 
            jsonObject.otherParts.forEach(function (obj) {
                const entity = new OtherPartsEntity(); 
                entity.populateFields(obj);
                instance.otherParts.push(entity);
            });
        }
		if (jsonObject.skipProduction != null) {
            jsonObject.skipProduction.forEach(function(obj) {
                const entity = new SkipProductionEntity();
                entity.populateFields(obj);
                instance.skipProduction.push(entity);
            }); 
		}
		if (jsonObject.disContinue != null) {
				jsonObject.disContinue.forEach(function(obj) {
					const entity = new DisContinueEntity();
					entity.populateFields(obj);
					instance.disContinue.push(entity);
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
        let header = {};

        if (this.currentDate) header.currentDate = this.currentDate;
		if (this.currentTime) header.currentTime = this.currentTime;
		if (this.shift) header.shift = this.shift;
		if (this.line) header.line = this.line;
		if (this.shiftGroup) header.shiftGroup = this.shiftGroup;
		if (this.shiftCellColor) header.shiftCellColor = this.shiftCellColor;
		if (this.lineID) header.lineID = this.lineID;
		if (this.user) header.user = this.user;

		let jsonObject = {};
		jsonObject.header = header;

		if(this.partsStock != null) {
			const partsStock = [];
			this.partsStock.forEach(function(obj) {
				partsStock.push(obj.toJSONObject());
			});
			jsonObject.partsStock = partsStock;
		}

		if(this.materialStock != null) {
			const materialStock = [];
			this.materialStock.forEach(function(obj) {
				materialStock.push(obj.toJSONObject());
			});
			jsonObject.materialStock = materialStock;
		}

		if(this.emptyPallets != null) {
			const emptyPallets = [];
			this.emptyPallets.forEach(function(obj) {
				emptyPallets.push(obj.toJSONObject());
			});
			jsonObject.emptyPallets = emptyPallets;
		}

		if(this.lotAdjustments != null) {
			const lotAdjustments = [];
			this.lotAdjustments.forEach(function(obj) {
				lotAdjustments.push(obj.toJSONObject());
			});
			jsonObject.lotAdjustments = lotAdjustments;
		}

		if(this.grid != null) {
			const grid = [];
			this.grid.forEach(function(obj) {
				grid.push(obj.toJSONObject());
			});
			jsonObject.grid = grid;
		}

		if(this.flvtParts != null) {
			const flvtParts = [];
			this.flvtParts.forEach(function(obj) {
				flvtParts.push(obj.toJSONObject());
			});
			jsonObject.flvtParts = flvtParts;
		}

		if(this.otherParts != null) {
			const otherParts = [];
			this.otherParts.forEach(function(obj) {
				otherParts.push(obj.toJSONObject());
			});
			jsonObject.otherParts = otherParts;
		}

		if(this.loadTimeCalculations != null) {
			const loadTimeCalculations = [];
			this.loadTimeCalculations.forEach(function(obj) {
				loadTimeCalculations.push(obj.toJSONObject());
			});
			jsonObject.loadTimeCalculations = loadTimeCalculations;
		}

		if(this.plannedLine != null) {
			const plannedLine = [];
			this.plannedLine.forEach(function(obj) {
				plannedLine.push(obj.toJSONObject());
			});
			jsonObject.plannedLine = plannedLine;
		}

		if(this.skipProduction != null) {
			const skipProduction = [];
			this.skipProduction.forEach(function(obj) {
				skipProduction.push(obj.toJSONObject());
			});
			jsonObject.skipProduction = skipProduction;
		}

		if(this.disContinue != null) {
			const disContinue = [];
			this.disContinue.forEach(function(obj) {
				disContinue.push(obj.toJSONObject());
			});
			jsonObject.disContinue = disContinue;
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

class SkipProductionEntity extends palms.exported.framework.entity.Entity {
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

class DisContinueEntity extends palms.exported.framework.entity.Entity {
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

class ProductionHostDetails extends palms.exported.framework.entity.Entity {
    constructor() {
        super();
        this.url = 'http://localhost:8081/';
    }
}