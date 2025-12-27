class ProductionLoadTimeChartEntity extends palms.exported.framework.entity.Entity {
	constructor() {
        super();
		this.currentDate = null;
        this.currentTime = null;
		this.line = null;
		this.shift = null;
		this.lineID = null;
		this.timeSlot = null;
		this.planData = null;
		this.actualData = null;
		
    }
	
	populateFields(jsonObject) {
		this.currentDate = jsonObject.header.currentDate;
		this.currentTime = jsonObject.header.currentTime;
		this.line = jsonObject.header.line;
		this.shift = jsonObject.header.shift;
		this.lineID = jsonObject.header.lineID;
		this.timeSlot = jsonObject.timeSlot;
		this.planData = jsonObject.planData;
		this.actualData = jsonObject.actualData;
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
		if (this.timeSlot) jsonObject.timeSlot = this.timeSlot;
		if (this.planData) jsonObject.planData = this.planData;
		if (this.actualData) jsonObject.actualData = this.actualData;
		
		

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

class LoadTimeChartDetails extends palms.exported.framework.entity.Entity {
    constructor() {
        super();
        this.url = 'http://localhost:8081/';
    }
}