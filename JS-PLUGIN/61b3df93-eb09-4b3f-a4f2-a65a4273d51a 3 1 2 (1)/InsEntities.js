1class MaterialHostDetails extends palms.exported.framework.entity.Entity {
  constructor() {
    super();
    this.url = 'http://localhost:8081/';
  }
}

// class DncRecord extends palms.exported.framework.entity.Entity {
//   constructor() {
//     super();
//     this.model = null;
//     this.partNo = null;
//     this.gpq = null;
//     this.repair = null;
//     this.total = null;
//     this.dncPallets = null;
//   }

//   populateFields(jsonObject) {
//     this.model = jsonObject.model;
//     this.partNo = jsonObject.partNo;
//     this.gpq = jsonObject.gpq;
//     this.repair = jsonObject.repair;
//     this.total = jsonObject.total;
//     this.dncPallets = jsonObject.dncPallets;
//   }

//   get(property) {
//     try {
//       return this[property];
//     } catch (e) {
//       console.error(e);
//       return null;
//     }
//   }

//   set(property, value) {
//     try {
//       this[property] = value;
//       return value;
//     } catch (e) {
//       console.error(e);
//       return null;
//     }
//   }
//   getJSONString() {
//     return JSON.stringify(this.toJSONObject());
//   }

//   toJSONObject() {
//     const jsonObject = {};

//     if (this.model) jsonObject.model = this.model;
//     if (this.partNo) jsonObject.partNo = this.partNo;
//     if (this.gpq !== null) jsonObject.gpq = this.gpq;
//     if (this.repair !== null) jsonObject.repair = this.repair;
//     if (this.total !== null) jsonObject.total = this.total;
//     if (this.dncPallets) jsonObject.dncPallets = this.dncPallets;

//     return jsonObject;
//   }
//   clone() {
// 		const jsonString = this.getJSONString();
// 		const jsonObject = JSON.parse(jsonString);
// 		const cloneEntity = new this.constructor();
// 		cloneEntity.populateFields(jsonObject);
// 		return cloneEntity;
// 	}
// }

// class ModelDNCDetailsEntities extends palms.exported.framework.entity.Entity {
//   constructor() {
//     super();
//     this.model = null;
//     this.dncRecord = [];
//   }

//   populateFields(jsonObject) {
//     this.model = jsonObject.model;
//     this.dncRecord = [];

//     if (jsonObject.dncRecord) {
//       jsonObject.dncRecord.forEach(data => {
//         const record = new DncRecord();
//         record.populateFields(data);
//         this.dncRecord.push(data);
//       });
//     }
//   }

//   get(property) {
//     try {
//       return this[property];
//     } catch (e) {
//       console.error(e);
//       return null;
//     }
//   }

//   set(property, value) {
//     try {
//       this[property] = value;
//       return value;
//     } catch (e) {
//       console.error(e);
//       return null;
//     }
//   }
//   getJSONString() {
//     return JSON.stringify(this.toJSONObject());
//   }
//   toJSONObject() {
//     const jsonObject = {};

//     if (this.model) jsonObject.model = this.model;
//     if (this.dncRecord.length > 0) {
//       jsonObject.dncRecord = this.dncRecord.map(data => data.toJSONObject());
//     }

//     return jsonObject;
//   }

//   clone() {
// 		const jsonString = this.getJSONString();
// 		const jsonObject = JSON.parse(jsonString);
// 		const cloneEntity = new this.constructor();
// 		cloneEntity.populateFields(jsonObject);
// 		return cloneEntity;
// 	}
// }

class ProductionRecord extends palms.exported.framework.entity.Entity {
  constructor() {
    super();
    this.date = null;
    this.model = null;
    this.partNo = null;
    this.palletQty = null;
    this.shift = null;
  }

  populateFields(jsonObject) {
    this.date = jsonObject.date;
    this.model = jsonObject.model;
    this.partNo = jsonObject.partNo;
    this.palletQty = jsonObject.palletQty;
    this.shift = jsonObject.shift;
  }

  toJSONObject() {
    const jsonObject = {};

    if (this.date) jsonObject.date = this.date;
    if (this.model) jsonObject.model = this.model;
    if (this.partNo) jsonObject.partNo = this.partNo;
    if (this.palletQty !== null) jsonObject.palletQty = this.palletQty;
    if (this.shift) jsonObject.shift = this.shift;

    return jsonObject;
  }
}

class PalletDetails extends palms.exported.framework.entity.Entity {
  constructor() {
    super();
    this.palletId = null;
    this.records = [];
  }

  populateFields(jsonObject) {
    this.palletId = jsonObject.palletId;
    this.records = [];

    if (jsonObject.records) {
      jsonObject.records.forEach(record => {
        const productionRecord = new ProductionRecord();
        productionRecord.populateFields(record);
        this.records.push(productionRecord);
      });
    }
  }

  toJSONObject() {
    const jsonObject = {};

    if (this.palletId) jsonObject.palletId = this.palletId;
    if (this.records.length > 0) {
      jsonObject.records = this.records.map(record => record.toJSONObject());
    }

    return jsonObject;
  }
}

class InspectionAndRepairReportEntity extends palms.exported.framework.entity.Entity {
  constructor() {
    super();
    this.dncPalletDetails = [];
    this.productionDetails = {
      palletDetails: []
    };
  }

  populateFields(jsonObject) {
    if (jsonObject.dncPalletDetails) {
      this.dncPalletDetails = [];
      jsonObject.dncPalletDetails.forEach(detail => {
        const modelDetail = new ModelDNCDetails();
        modelDetail.populateFields(detail);
        this.dncPalletDetails.push(modelDetail);
      });
    }

    // Populate Production Details
    if (jsonObject.productionDetails && jsonObject.productionDetails.palletDetails) {
      this.productionDetails.palletDetails = [];
      jsonObject.productionDetails.palletDetails.forEach(detail => {
        const palletDetail = new PalletDetails();
        palletDetail.populateFields(detail);
        this.productionDetails.palletDetails.push(palletDetail);
      });
    }
  }

  toJSONObject() {
    const jsonObject = {
      dncPalletDetails: [],
      productionDetails: {
        palletDetails: []
      }
    };

    if (this.dncPalletDetails.length > 0) {
      jsonObject.dncPalletDetails = this.dncPalletDetails.map(detail => detail.toJSONObject());
    }

    if (this.productionDetails.palletDetails.length > 0) {
      jsonObject.productionDetails.palletDetails = this.productionDetails.palletDetails.map(
        detail => detail.toJSONObject()
      );
    }

    return jsonObject;
  }
}