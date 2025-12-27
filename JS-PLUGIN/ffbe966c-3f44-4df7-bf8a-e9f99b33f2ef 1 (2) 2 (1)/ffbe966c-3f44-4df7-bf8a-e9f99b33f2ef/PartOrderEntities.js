
class PartOrderDashGridLineEntity extends palms.exported.framework.entity.Entity {
	constructor() {
        super();
		this.line = null;
		this.shift = null;
		this.shiftgroup = null;
        this.ptns = null;
		this.seq = null;
        this.planStartAndEnd = null;
        this.loadTime = null;
        this.dieBay = null;
        this.dieSet = null;
        this.ptnLotSize = null;
        this.planLotSize = null;
        this.status = null;																	
        this.lotNo = null;
        this.actualLotSize=null;
        this.actualStartAndEnd = null;
        this.actualLoadTime=null;
        this.delay = null;
		this.reason = null;
		this.deviation = null;
		this.rowColor = null;
		this.statusTextColor = null;
		this.statusTextBgColor = null;
		this.shiftCellColor = null;
    }
	
	populateFields(jsonObject) {
		this.line = jsonObject.line;
		this.shift = jsonObject.shift;
		this.shiftgroup = jsonObject.shiftgroup;
		this.ptns = jsonObject.ptns;
		this.seq = jsonObject.seq;
		this.planStartAndEnd = jsonObject.planStartAndEnd;
		this.loadTime = jsonObject.loadTime;
		this.dieBay = jsonObject.dieBay;
		this.dieSet = jsonObject.dieSet;
		this.ptnLotSize = jsonObject.ptnLotSize;
		this.planLotSize = jsonObject.planLotSize;
		this.status = jsonObject.status;
		this.lotNo = jsonObject.lotNo;
		this.actualLotSize = jsonObject.actualLotSize;
		this.actualStartAndEnd = jsonObject.actualStartAndEnd;
		this.actualLoadTime = jsonObject.actualLoadTime;
        this.delay = jsonObject.delay;
		this.reason = jsonObject.reason;
		this.rowColor = jsonObject.rowColor;
		this.statusTextColor = jsonObject.statusTextColor;
		this.statusTextBgColor = jsonObject.statusTextBgColor;
	        this.deviation = jsonObject.deviation;
			this.shiftCellColor = jsonObject.shiftCellColor;
		
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
		if (this.line) jsonObject.line = this.line;
		if (this.shift) jsonObject.shift = this.shift;
		if (this.shiftgroup) jsonObject.shiftgroup = this.shiftgroup;
		if (this.ptns) jsonObject.ptns = this.ptns;
		if (this.seq)jsonObject.seq=this.seq;
		if (this.planStartAndEnd) jsonObject.planStartAndEnd = this.planStartAndEnd;
		if (this.loadTime !== null) jsonObject.loadTime = this.loadTime;
		if (this.dieBay) jsonObject.dieBay = this.dieBay;
		if (this.dieSet) jsonObject.dieSet = this.dieSet;
		if (this.ptnLotSize) jsonObject.ptnLotSize = this.ptnLotSize;
		if (this.planLotSize) jsonObject.planLotSize = this.planLotSize;
		if (this.status) jsonObject.status = this.status;
		if (this.lotNo) jsonObject.lotNo = this.lotNo;
		if (this.actualStartAndEnd) jsonObject.actualStartAndEnd = this.actualStartAndEnd;
		if (this.actualLoadTime ) jsonObject.actualLoadTime = this.actualLoadTime;
        if (this.actualLotSize ) jsonObject.actualLotSize = this.actualLotSize;
		if (this.delay) jsonObject.delay = this.delay;
		if (this.reason) jsonObject.reason = this.reason;
		if (this.rowColor) jsonObject.rowColor = this.rowColor;
		if (this.statusTextColor) jsonObject.statusTextColor = this.statusTextColor;
		if (this.statusTextBgColor) jsonObject.statusTextBgColor = this.statusTextBgColor;
                if (this.deviation) jsonObject.deviation = this.deviation;
				if (this.shiftCellColor) jsonObject.shiftCellColor = this.shiftCellColor;
		return jsonObject;
	}
}

class PartOrderDashGridLineChildEntity extends PartOrderDashGridLineEntity {
	constructor() {
        super();
		
		this.recLotSize = null;
    }
	
	populateFields(jsonObject) {
		super.populateFields(jsonObject);
		
		this.recLotSize=jsonObject.recLotSize;
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

		if (this.recLotSize) jsonObject.recLotSize=this.recLotSize;

		return jsonObject;
	}
}


class PartOrderEntities extends palms.exported.framework.entity.Entity {
	constructor() {
        super();
		this.date = null;
		this.line = null;
		this.shift = null;
		this.grid = null;
    }
	
	populateFields(jsonObject) {
		this.date = jsonObject.header.date;
		this.line = jsonObject.header.line;
		this.shift = jsonObject.header.shift;
		this.grid = [];
		
		let instance = this;

		if(jsonObject.grid != null) {
			jsonObject.grid.forEach(function(obj) {
				const entity = new PartOrderDashGridLineChildEntity();
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

        if (this.date) jsonObject.date = this.date;
		if (this.line) jsonObject.line = this.line;
		if (this.shift) jsonObject.shift = this.shift;

        return jsonObject;
    }
}

class PartOrder extends palms.exported.framework.entity.Entity {
    constructor() {
        super();
        this.url = 'http://localhost:8081/';
    }
}

class PartOrderDownload extends palms.exported.framework.entity.Entity {
    constructor() {
        super();
        this.url = 'http://localhost:8081/';
    }
}