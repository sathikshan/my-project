
class ProductionControlDashGridLineEntity extends palms.exported.framework.entity.Entity {
	constructor() {
        super();
        this.ptns = null;
		this.seq = null;
        this.planStartAndEnd = null;
        this.loadTime = null;
        this.dieSet = null;
        this.ptnLotSize = null;
        this.planLotSize = null;
        this.status = null;
        this.lotNo = null;
        this.actualStartAndEnd = null;
        this.delay = null;
		this.actualLoadTime=null;
		this.plannedlineStop=null;
		this.reason=null;
		this.queuedTime=null;
		this.rowColor = null;
		this.statusTextColor = null;
		this.statusTextBgColor = null;
		this.partsStock = null;
		this.materialStock = null;
		this.emptyPallets = null;
                this.deviation=null;
    }
	
	populateFields(jsonObject) {
		this.ptns = jsonObject.ptns;
		this.seq = jsonObject.seq;
		this.planStartAndEnd = jsonObject.planStartAndEnd;
		this.loadTime = jsonObject.loadTime;
		this.dieSet = jsonObject.dieSet;
		this.ptnLotSize = jsonObject.ptnLotSize;
		this.planLotSize = jsonObject.planLotSize;
		this.status = jsonObject.status;
		this.lotNo = jsonObject.lotNo;
		this.actualStartAndEnd = jsonObject.actualStartAndEnd;
		this.actualLoadTime = jsonObject.actualLoadTime;
		this.delay = jsonObject.delay;
		this.plannedlineStop=jsonObject.plannedlineStop;
		this.queuedTime=jsonObject.queuedTime;
		this.reason=jsonObject.reason;
		this.rowColor = jsonObject.rowColor;
		this.statusTextColor = jsonObject.statusTextColor;
		this.statusTextBgColor = jsonObject.statusTextBgColor; 
                this.deviation = jsonObject.deviation; 
		this.partsStock = [];
		this.materialStock = [];
		this.emptyPallets = [];
		
		let instance = this;
		
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
		if (this.seq)jsonObject.seq=this.seq;
		if (this.planStartAndEnd) jsonObject.planStartAndEnd = this.planStartAndEnd;
		if (this.loadTime !== null) jsonObject.loadTime = this.loadTime;
		if (this.dieSet) jsonObject.dieSet = this.dieSet;
		if (this.ptnLotSize) jsonObject.ptnLotSize = this.ptnLotSize;
		if (this.planLotSize) jsonObject.planLotSize = this.planLotSize;
		if (this.status) jsonObject.status = this.status;
		if (this.lotNo) jsonObject.lotNo = this.lotNo;
		if (this.actualStartAndEnd) jsonObject.actualStartAndEnd = this.actualStartAndEnd;
		if (this.actualLoadTime ) jsonObject.actualLoadTime = this.actualLoadTime;
		if (this.plannedlineStop) jsonObject.plannedlineStop = this.plannedlineStop;
		if (this.reason) jsonObject.reason = this.reason;
		if (this.queuedTime) jsonObject.queuedTime = this.queuedTime;
		if (this.delay) jsonObject.delay = this.delay;
		if (this.rowColor) jsonObject.rowColor = this.rowColor;
		if (this.statusTextColor) jsonObject.statusTextColor = this.statusTextColor;
		if (this.statusTextBgColor) jsonObject.statusTextBgColor = this.statusTextBgColor;
                if (this.deviation) jsonObject.deviation = this.deviation;
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

class ProductionControlDashGridLineChildEntity extends ProductionControlDashGridLineEntity {
	constructor() {
        super();
		
		this.childPart = null;
		this.recLotSize = null;
		this.prodOrder = null; 	
		this.actualLotSize = null;
    }
	
	populateFields(jsonObject) {
		super.populateFields(jsonObject);
		
		this.childPart = jsonObject.childPart;
		this.recLotSize=jsonObject.recLotSize;
		this.prodOrder=jsonObject.prodOrder;
		this.actualLotSize=jsonObject.actualLotSize;
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
		if (this.recLotSize) jsonObject.recLotSize=this.recLotSize;
		if (this.prodOrder) jsonObject.prodOrder=this.prodOrder;
		if (this.actualLotSize) jsonObject.actualLotSize=this.actualLotSize;

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

class DashBoardPartsStockEntity extends palms.exported.framework.entity.Entity {

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

class DashBoardMaterialStockEntity extends palms.exported.framework.entity.Entity {

	constructor() {
        super();
        this.id = null;
		this.material = null;
		this.skidQty = null;
		this.onOrder = null;
		this.stock = null;
		this.onHold = null;
    }
	
	populateFields(jsonObject) {
		this.id = jsonObject.id;
		this.material = jsonObject.material;
		this.skidQty = jsonObject.skidQty;
		this.onOrder = jsonObject.onOrder;
		this.stock = jsonObject.stock;
		this.onHold = jsonObject.onHold;
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

class DashBoardEmptyPalletsEntity extends palms.exported.framework.entity.Entity {

	constructor() {
        super();
		this.id = null;
        this.palletType = null;
		this.empty = null;
		this.wip = null;
		this.onHold = null;
    }
	
	populateFields(jsonObject) {
		this.id = jsonObject.id;
		this.palletType = jsonObject.palletType;
		this.empty = jsonObject.empty;
		this.wip = jsonObject.wip;
		this.onHold = jsonObject.onHold;
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

class ProductionControlDashBoardEntity extends palms.exported.framework.entity.Entity {
	constructor() {
        super();
		this.currentDate = null;
        this.currentTime = null;
		this.line = null;
		this.shift = null;
		this.shiftGroup = null;
		this.lineID = null;
		this.grid = null;
    }
	
	populateFields(jsonObject) {
		this.currentDate = jsonObject.header.currentDate;
		this.currentTime = jsonObject.header.currentTime;
		this.line = jsonObject.header.line;
		this.shift = jsonObject.header.shift;
		this.shiftGroup = jsonObject.header.shiftGroup;
		this.lineID = jsonObject.header.lineID;
		this.grid = [];
		
		let instance = this;

		if(jsonObject.grid != null) {
			jsonObject.grid.forEach(function(obj) {
				const entity = new ProductionControlDashGridLineChildEntity();
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
	
	toJSONObject() {
        let jsonObject = {};

        if (this.currentDate) jsonObject.currentDate = this.currentDate;
		if (this.currentTime) jsonObject.currentTime = this.currentTime;
		if (this.line) jsonObject.line = this.line;
		if (this.shift) jsonObject.shift = this.shift;
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
class DashBoard extends palms.exported.framework.entity.Entity {
    constructor() {
        super();
        this.url = 'http://localhost:8081/';
    }
}