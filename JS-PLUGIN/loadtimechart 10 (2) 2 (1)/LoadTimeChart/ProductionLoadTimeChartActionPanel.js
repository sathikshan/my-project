// class ProductionLoadTimeChartActionPanel extends palms.exported.framework.ActionForm {
// 	constructor() {
// 		super();
// 		this.timeChart = null;
// 		this.actionWidgetList = new ProductionLoadTimeChartActionWidgetsList(new ProductionLoadTimeChartEntity());
// 	}
	
// 	initialize() {
// 		try {
// 			super.initialize();
// 			super.addStyleName('ProductionLoadTimeChartActionPanel');

// 			const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.actionWidgetList, 3);
// 			layouter.setAllowGroup(true);
// 			this.actionWidgetList.initialize();
// 			layouter.initialize();
// 			super.addWidgetControl(layouter.asWidget(), 'NORTH');
// 			super.setCellWidth(layouter.asWidget(), '100%');
// 			super.setCellHeight(layouter.asWidget(), '90px');

// 			if(true) {
// 				this.timeChart = new palms.exported.framework.selfValidatingControls.TimeChart();
// 				this.timeChart.setInterval(20);
// 				super.addWidgetControl(this.timeChart, 'CENTER');
// 				super.setCellWidth(this.timeChart, '75%');
// 				super.setCellHeight(this.timeChart, '100%');				
// 			}
// 		} catch (error) {
// 			console.error("Error during initialization: ", error);
// 		}
// 	}

// 	setRecordData(recordData) {
// 		const colorsArr = [ "E9967A", "B22222", "FFB6C1", "DB7093", "FF6347", "FFD700",
// 			"FFFACD", "FFDAB9", "BDB76B", "EE82EE", "FF00FF", "9400D3", "800080", "7B68EE", "7CFC00", "90EE90",
// 			"3CB371", "808000", "20B2AA", "00FFFF", "7FFFD4", "5F9EA0", "B0E0E6", "00BFFF", "4169E1", "FFEBCD",
// 			"DEB887", "F4A460", "D2691E", "A52A2A", "F0FFF0", "F0F8FF", "F5F5DC", "FFFFF0", "FFE4E1", "C0C0C0",
// 			"778899" ];

// 		const ev0 = new palms.exported.framework.selfValidatingControls.CalenderEventData("14:00", "15:00", "67143-4-D21");
// 		const ev1 = new palms.exported.framework.selfValidatingControls.CalenderEventData("15:00", "15:15", "BREAK");
// 		const ev2 = new palms.exported.framework.selfValidatingControls.CalenderEventData("15:15", "16:10", "58211 D22");
// 		const ev3 = new palms.exported.framework.selfValidatingControls.CalenderEventData("16:10", "17:00", "53311-INN");
// 		ev0.setColor(colorsArr[0]);
// 		ev1.setColor(colorsArr[1]);
// 		ev2.setColor(colorsArr[2]);
// 		ev3.setColor(colorsArr[3]);
// 		const planEvents = [ev0, ev1, ev2, ev3];
// 		this.timeChart.setEvents("PLAN", planEvents);

// 		const ev4 = new palms.exported.framework.selfValidatingControls.CalenderEventData("14:10", "15:10", "67143-4-D21");
// 		const ev5 = new palms.exported.framework.selfValidatingControls.CalenderEventData("15:10", "15:30", "BREAK");
// 		const ev6 = new palms.exported.framework.selfValidatingControls.CalenderEventData("15:30", "16:25", "58211 D22");
// 		const ev7 = new palms.exported.framework.selfValidatingControls.CalenderEventData("16:25", "17:20", "53311-INN");
// 		ev4.setColor(colorsArr[0]);
// 		ev5.setColor(colorsArr[1]);
// 		ev6.setColor(colorsArr[2]);
// 		ev7.setColor(colorsArr[3]);
// 		const actualEvents = [ev4, ev5, ev6, ev7];
// 		this.timeChart.setEvents("ACTUAL", actualEvents);
// 		this.timeChart.render();
// 	}
// }


// class ProductionLoadTimeChartActionPanel extends palms.exported.framework.ActionForm {
//     constructor() {
//         super();
//         this.timeChart = null;
//         this.actionWidgetList = new ProductionLoadTimeChartActionWidgetsList(new ProductionLoadTimeChartEntity());
//         this.fullScreen = false;
//         this.registerFullScreenEvent();
//         this.repeatedScheduler = null;
//     }

//     onAttach() {
//         let instance = this;
//         try {
//             this.openFullscreen(this.getElement());
//             super.onAttach();
//             instance.repeatedScheduler = setInterval(() => {
//                 // Commented out as per original code
//                 // if(instance.timeChart != null)
//                 // {
//                 //     if(!instance.timeChart.next())
//                 //         instance.timeChart.first();
//                 // }
//             });
//         } catch (err) {
//             console.error("Error in onAttach(): ", err);
//         }
//     }

//     onDetach() {
//         super.onDetach();
//         try {
//             clearInterval(this.repeatedScheduler);
//         } catch (err) {
//             console.error("Error in onDetach(): ", err);
//         }
//     }

//     openFullscreen(elem) {
//         try {
//             if (
//                 document.fullscreenEnabled || 
//                 document.webkitFullscreenEnabled || 
//                 document.msFullscreenEnabled
//             ) {
//                 if (elem.requestFullscreen) {
//                     elem.requestFullscreen();
//                     return true;
//                 } else if (elem.webkitRequestFullscreen) { 
//                     elem.webkitRequestFullscreen();
//                     return true;
//                 } else if (elem.msRequestFullscreen) { 
//                     elem.msRequestFullscreen();
//                     return true;
//                 } else {
//                     return false;
//                 }
//             }
//         } catch (err) {
//             console.error("Error in openFullscreen():", err.message);
//         }
//     }

//     closeFullscreen() {
//         if (document.exitFullscreen) {
//             document.exitFullscreen();
//         } else if (document.webkitExitFullscreen) {
//             document.webkitExitFullscreen();
//         } else if (document.msExitFullscreen) {
//             document.msExitFullscreen();
//         }
//     }

//     registerFullScreenEvent() {
//         document.addEventListener("fullscreenchange", (event) => this.onFullScreenChange(event));
//         document.addEventListener("webkitfullscreenchange", (event) => this.onFullScreenChange(event));
//         document.addEventListener("msfullscreenchange", (event) => this.onFullScreenChange(event));
//     }

//     onFullScreenChange(event) {
//         this.fullScreen = !this.fullScreen;
//         if (this.fullScreen) {
//             let style = super.getStyle();
//             style.backgroundColor = '#F5F5DC'; 
//             style.padding = '10px';
//         } else {
//             let style = super.getStyle();
//             style.backgroundColor = 'transparent';
//             style.padding = '';
//         }
//     }

//     initialize() {
//         try {
//             super.initialize();
//             super.addStyleName('ProductionLoadTimeChartActionPanel');

//             const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.actionWidgetList, 4);
//             layouter.setAllowGroup(true);
//             this.actionWidgetList.initialize();
//             layouter.initialize();
//             super.addWidgetControl(layouter.asWidget(), 'NORTH');
//             super.setCellWidth(layouter.asWidget(), '100%');
//             super.setCellHeight(layouter.asWidget(), '90px');

//             this.timeChart = new palms.exported.framework.selfValidatingControls.TimeChart();
//             this.timeChart.setInterval(25);
//             super.addWidgetControl(this.timeChart, 'CENTER');
//             super.setCellWidth(this.timeChart, '75%');
//             super.setCellHeight(this.timeChart, '100%');
//         } catch (error) {
//             console.error("Error during initialization: ", error);
//         }
//     }

//     // setRecordData(chartEntity) {
//         try {
//             if (!this.timeChart) {
//                 console.error("TimeChart is not initialized");
//                 return;
//             }

//             this.actionWidgetList.setRecordData(chartEntity);

            
//             if (chartEntity.timeSlot && chartEntity.timeSlot.length > 0) {
//                 const { startTime, endTime } = chartEntity.timeSlot[0];
//                 this.timeChart.setStartTime(startTime); 
//                 this.timeChart.setEndTime(endTime);     
//             }

//             const colorsArr = ["E9967A", "B22222", "FFB6C1", "DB7093", "FF6347", "FFD700", "FFFACD", "FFDAB9", "BDB76B", 
//                 "EE82EE", "FF00FF", "9400D3", "800080", "7B68EE", "7CFC00", "90EE90", "3CB371", "808000", "20B2AA", "00FFFF", 
//                 "7FFFD4", "5F9EA0", "B0E0E6", "00BFFF", "4169E1", "FFEBCD", "DEB887", "F4A460", "D2691E", "A52A2A", "F0FFF0", 
//                 "F0F8FF", "F5F5DC", "FFFFF0", "FFE4E1", "C0C0C0", "778899"];

//             let colorCounter = 0;
//             const colorMap = {};

//             function getColorForEvent(eventName) {
//                 if (!colorMap[eventName]) {
//                     colorMap[eventName] = colorsArr[colorCounter];
//                     colorCounter = (colorCounter + 1) % colorsArr.length;
//                 }
//                 return colorMap[eventName];
//             }

        
//             const planEvents = chartEntity.planData.map(event => {
//                 const eventName = event.dieSet || event.break;
//                 const planEvent = new palms.exported.framework.selfValidatingControls.CalenderEventData(
//                     event.planStart, 
//                     event.planEnd, 
//                     eventName
//                 );
//                 planEvent.setColor(getColorForEvent(eventName));
//                 return planEvent;
//             });

            
//             const actualEvents = chartEntity.actualData
//                 .filter(event => event.actualStart && event.actualEnd) 
//                 .map(event => {
//                     const eventName = event.dieSet || event.break;
//                     const actualEvent = new palms.exported.framework.selfValidatingControls.CalenderEventData(
//                         event.actualStart,
//                         event.actualEnd,
//                         eventName
//                     );
//                     actualEvent.setColor(getColorForEvent(eventName));
//                     return actualEvent;
//                 });

//             this.timeChart.setEvents("PLAN", planEvents);
//             this.timeChart.setEvents("ACTUAL", actualEvents);
//             this.timeChart.render();
//         } catch (error) {
//             console.error("Error in setRecordData:", error);
//         }
//     }
// }

    
//         setRecordData(chartEntity) {
//             try {
//                 if (!this.timeChart) {
//                     console.error("TimeChart is not initialized");
//                     return;
//                 }
    
//                 this.actionWidgetList.setRecordData(chartEntity);
    
//                 const colorsArr = ["E9967A", "B22222", "FFB6C1", "DB7093", "FF6347", "FFD700", "FFFACD", "FFDAB9", "BDB76B", 
//                     "EE82EE", "FF00FF", "9400D3", "800080", "7B68EE", "7CFC00", "90EE90", "3CB371", "808000", "20B2AA", "00FFFF", 
//                     "7FFFD4", "5F9EA0", "B0E0E6", "00BFFF", "4169E1", "FFEBCD", "DEB887", "F4A460", "D2691E", "A52A2A", "F0FFF0", 
//                     "F0F8FF", "F5F5DC", "FFFFF0", "FFE4E1", "C0C0C0", "778899"];
    
//                 let colorCounter = 0;
//                 const colorMap = {};
    
//                 function getColorForEvent(eventName) {
//                     if (!colorMap[eventName]) {
//                         colorMap[eventName] = colorsArr[colorCounter];
//                         colorCounter = (colorCounter + 1) % colorsArr.length;
//                     }
//                     return colorMap[eventName];
//                 }
    
            
//                 const planEvents = chartEntity.planData.map(event => {
//                     const eventName = event.dieSet || event.break;
//                     const planEvent = new palms.exported.framework.selfValidatingControls.CalenderEventData(
//                         event.planStart, 
//                         event.planEnd, 
//                         eventName
//                     );
//                     planEvent.setColor(getColorForEvent(eventName));
//                     return planEvent;
//                 });
    
    
//                 const actualEvents = chartEntity.actualData
//                     .filter(event => event.actualStart && event.actualEnd) 
//                     .map(event => {
//                         const eventName = event.dieSet || event.break;
//                         const actualEvent = new palms.exported.framework.selfValidatingControls.CalenderEventData(
//                             event.actualStart,
//                             event.actualEnd,
//                             eventName
//                         );
//                         actualEvent.setColor(getColorForEvent(eventName));
//                         return actualEvent;
//                     });
    
//                 this.timeChart.setEvents("PLAN", planEvents);
//                 this.timeChart.setEvents("ACTUAL", actualEvents);
//                 this.timeChart.render();
//             } catch (error) {
//                 console.error("Error in setRecordData:", error);
//             }
//         }
//     }

// class ProductionLoadTimeChartActionPanel extends palms.exported.framework.ActionForm {
//     constructor() {
//         super();
//         this.timeChart = null;
//         this.loadtime = new ProductionLoadTimeChartEntity();
//         this.actionWidgetList = new ProductionLoadTimeChartActionWidgetsList(this.loadtime, this);
//         this.fullScreen = false;
//         this.registerFullScreenEvent();
//         this.repeatedScheduler = null;
//         this.refreshInterval = null;
//     }

//     onAttach() {
//         let instance = this;
//         try {
//             this.openFullscreen(this.getElement());
//             super.onAttach();
            
//             // Set up auto-refresh
//             this.refreshInterval = setInterval(() => {
//                 console.log("Auto-refresh triggered in action panel");
//                 this.refreshShiftDetails();
//             }, 10000);
//         } catch (err) {
//             console.error("Error in onAttach(): ", err);
//         }
//     }

//     onDetach() {
//         super.onDetach();
//         try {
//             clearInterval(this.repeatedScheduler);
//             clearInterval(this.refreshInterval);
//         } catch (err) {
//             console.error("Error in onDetach(): ", err);
//         }
//     }

//     refreshData() {
//         try {
//             const currentDate = new Date();
//             const currentTime = currentDate.toTimeString().split(' ')[0];
//             this.actionWidgetList.updateCurrentTime(currentTime);
//             this.refreshShiftDetails();
//         } catch (error) {
//             console.error("Error refreshing data:", error);
//         }
//     }

//     openFullscreen(elem) {
//         try {
//             if (
//                 document.fullscreenEnabled || 
//                 document.webkitFullscreenEnabled || 
//                 document.msFullscreenEnabled
//             ) {
//                 if (elem.requestFullscreen) {
//                     elem.requestFullscreen();
//                     return true;
//                 } else if (elem.webkitRequestFullscreen) { 
//                     elem.webkitRequestFullscreen();
//                     return true;
//                 } else if (elem.msRequestFullscreen) { 
//                     elem.msRequestFullscreen();
//                     return true;
//                 } else {
//                     return false;
//                 }
//             }
//         } catch (err) {
//             console.error("Error in openFullscreen():", err.message);
//         }
//     }

//     closeFullscreen() {
//         if (document.exitFullscreen) {
//             document.exitFullscreen();
//         } else if (document.webkitExitFullscreen) {
//             document.webkitExitFullscreen();
//         } else if (document.msExitFullscreen) {
//             document.msExitFullscreen();
//         }
//     }

//     registerFullScreenEvent() {
//         document.addEventListener("fullscreenchange", (event) => this.onFullScreenChange(event));
//         document.addEventListener("webkitfullscreenchange", (event) => this.onFullScreenChange(event));
//         document.addEventListener("msfullscreenchange", (event) => this.onFullScreenChange(event));
//     }

//     onFullScreenChange(event) {
//         this.fullScreen = !this.fullScreen;
//         if (this.fullScreen) {
//             let style = super.getStyle();
//             style.backgroundColor = '#F5F5DC';
//             style.padding = '10px';
//         } else {
//             let style = super.getStyle();
//             style.backgroundColor = 'transparent';
//             style.padding = '';
//         }
//     }

//     initialize() {
//         try {
//             super.initialize();
//             super.addStyleName('ProductionLoadTimeChartActionPanel');

//             const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.actionWidgetList, 5);
//             layouter.setAllowGroup(true);
//             this.actionWidgetList.initialize();
//             layouter.initialize();
//             super.addWidgetControl(layouter.asWidget(), 'NORTH');
//             super.setCellWidth(layouter.asWidget(), '100%');
//             super.setCellHeight(layouter.asWidget(), '90px');

//             this.timeChart = new palms.exported.framework.selfValidatingControls.TimeChart();
//             this.timeChart.setInterval(15);
//             super.addWidgetControl(this.timeChart, 'CENTER');
//             super.setCellWidth(this.timeChart, '75%');
//             super.setCellHeight(this.timeChart, '100%');
//         } catch (error) {
//             console.error("Error during initialization: ", error);
//         }
//     }

//     refreshShiftDetails() {
//         try {
//             if (!this.loadtime || !this.loadtime.lineID) {
//                 console.error("LineID not available:", this.loadtime);
//                 return;
//             }
    
//             var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
//             proxy.url = "http://localhost:8081/getShiftDetails";
//             proxy.payLoad = JSON.stringify({
//                 lineId: this.loadtime.lineID
//             });
//             proxy.method = "POST";
//             proxy.contentType = "application/json; charset=utf-8";
//             proxy.timeout = 20000;
//             proxy.keepAlive = false;
    
//             let instance = this;
//             var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();
    
//             callback.onSuccess = function(responseData) {
//                 try {
//                     console.log("Raw shift details response:", responseData);
//                     var shiftDetails = JSON.parse(responseData);
//                     console.log("Parsed shift details:", shiftDetails);
    
//                     // Create the updated filter with shift details
//                     const updatedFilter = {
//                         currentDate: shiftDetails.currentDate,
//                         currentTime: shiftDetails.currentTime,
//                         shift: shiftDetails.shift,
//                         line: shiftDetails.line,
//                         lineId: shiftDetails.lineId
//                     };
    
                    
//                     instance.loadData(JSON.stringify(updatedFilter));
//                 } catch (error) {
//                     console.error("Error processing shift details response:", error);
//                 }
//             };
    
//             callback.onFailure = function(errorDescription) {
//                 console.error("Failed to fetch shift details:", errorDescription);
//             };
    
//             palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
//         } catch (error) {
//             console.error("Error in refreshShiftDetails:", error);
//         }
//     }

//     loadData(filterData) {
//         try {
//             var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
//             proxy.url = "http://localhost:8081/productionLoadTimeChart";
//             proxy.payLoad = filterData;
//             proxy.method = "POST";
//             proxy.contentType = "application/json; charset=utf-8";
//             proxy.timeout = 20000;
//             proxy.keepAlive = false;

//             let instance = this;
//             var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

//             callback.onSuccess = function(responseData) {
//                 try {
//                     console.log("Raw response data:", responseData);
//                     var responseObj = JSON.parse(responseData);
//                     console.log("Parsed response object:", responseObj);
                    
//                     // Update the loadtime entity with the response data
//                     instance.loadtime.populateFields(responseObj);
                    
//                     // Update the UI
//                     instance.setRecordData(instance.loadtime);
                    
//                     console.log("Updated loadtime entity:", instance.loadtime);
//                 } catch (error) {
//                     console.error("Error processing success response: ", error);
//                 }
//             }

//             callback.onFailure = function(errorDescription) {
//                 console.error("Failure: " + errorDescription);
//             }

//             palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
//         } catch (error) {
//             console.error("Error loading data: ", error);
//         }
//     }


//     // setRecordData(chartEntity) {
//     //     try {
//     //         if (!this.timeChart) {
//     //             console.error("TimeChart is not initialized");
//     //             return;
//     //         }
    
//     //         this.actionWidgetList.setRecordData(chartEntity);
    
//     //         if (chartEntity.timeSlot && chartEntity.timeSlot.length > 0) {
//     //             const { startTime, endTime } = chartEntity.timeSlot[0];
//     //             this.timeChart.setStartTime(startTime);
//     //             this.timeChart.setEndTime(endTime);
//     //         }
    
//     //         const colorsArr = [
//     //             "#E6F3FF", "#B3D9FF", "#80BFFF", "#4DA6FF", "#1A8CFF",
//     //             "#0066CC", "#004C99", "#003366", "#001933", "#000D1A",
//     //             "#E6FFE6", "#B3FFB3", "#80FF80", "#4DFF4D", "#1AFF1A",
//     //             "#00CC00", "#009900", "#006600", "#003300", "#001A00",
//     //             "#CCCCCC"
//     //         ];
    
//     //         const breakColor = '#CCCCCC';
//     //         let planColorIndex = 0;
//     //         let actualColorIndex = 10;
    
//     //         function isBreakEvent(event) {
//     //             const isBreak = (event.break && event.break.toLowerCase().includes('break')) ||
//     //                            (event.dieSet && event.dieSet.toLowerCase().includes('break')) ||
//     //                            (typeof event === 'string' && event.toLowerCase().includes('break')) ||
//     //                            (event.break === 'BRK1' || event.break === 'BRK2' ||
//     //                             event.dieSet === 'BRK1' || event.dieSet === 'BRK2');
                
//     //             console.log("Event being checked:", event);
//     //             console.log("Is this event a break?", isBreak);
                
//     //             return isBreak;
//     //         }
    
//     //         function getColorForEvent(event, isActual) {
//     //             if (isBreakEvent(event)) {
//     //                 console.log("Grey color for break event");
//     //                 return colorsArr[20]; // Using the last color (grey) for breaks
//     //             }
                
//     //             if (isActual) {
//     //                 const color = colorsArr[actualColorIndex];
//     //                 actualColorIndex = (actualColorIndex + 1) % 10 + 10;
//     //                 return color;
//     //             } else {
//     //                 const color = colorsArr[planColorIndex];
//     //                 planColorIndex = (planColorIndex + 1) % 10;
//     //                 return color;
//     //             }
//     //         }
    
//     //         const planEvents = chartEntity.planData.map(event => {
//     //             const eventName = event.dieSet || event.break;
//     //             const planEvent = new palms.exported.framework.selfValidatingControls.CalenderEventData(
//     //                 event.planStart,
//     //                 event.planEnd,
//     //                 eventName
//     //             );
//     //             planEvent.setColor(getColorForEvent(event, false));
//     //             return planEvent;
//     //         });
    
//     //         const actualEvents = chartEntity.actualData
//     //             .filter(event => event.actualStart && event.actualEnd)
//     //             .map(event => {
//     //                 const eventName = event.dieSet || event.break;
//     //                 const actualEvent = new palms.exported.framework.selfValidatingControls.CalenderEventData(
//     //                     event.actualStart,
//     //                     event.actualEnd,
//     //                     eventName
//     //                 );
//     //                 actualEvent.setColor(getColorForEvent(event, true));
//     //                 return actualEvent;
//     //             });
    
//     //         this.timeChart.setEvents("PLAN", planEvents);
//     //         this.timeChart.setEvents("ACTUAL", actualEvents);
//     //         this.timeChart.render();
//     //     } catch (error) {
//     //         console.error("Error in setRecordData:", error);
//     //     }
//     // }
    
    
//     setRecordData(chartEntity) {
//         try {
//             if (!this.timeChart) {
//                 console.error("TimeChart is not initialized");
//                 return;
//             }
    
//             this.actionWidgetList.setRecordData(chartEntity);
    
//             if (chartEntity.timeSlot && chartEntity.timeSlot.length > 0) {
//                 const { startTime, endTime } = chartEntity.timeSlot[0];
//                 this.timeChart.setStartTime(startTime);
//                 this.timeChart.setEndTime(endTime);
//             }
    
//             const breakColor = '#CCCCCC';
    
//             const planColorPalette = [
//                 '#E6F3FF', '#B3D9FF', '#80BFFF', '#4DA6FF', '#1A8CFF',
//                 '#0066CC', '#004C99', '#003366', '#001933', '#000D1A'
//             ];
//             const actualColorPalette = [
//                 '#E6FFE6', '#B3FFB3', '#80FF80', '#4DFF4D', '#1AFF1A',
//                 '#00CC00', '#009900', '#006600', '#003300', '#001A00'
//             ];
    
//             const planColorIndexByDieset = {};
//             const actualColorIndexByDieset = {};
    
//             function isBreakEvent(event) {
//                 const isBreak = (event.break && event.break.toLowerCase().includes('break')) ||
//                                (event.dieSet && event.dieSet.toLowerCase().includes('break')) ||
//                                (typeof event === 'string' && event.toLowerCase().includes('break')) ||
//                                (event.break === 'BRK1' || event.break === 'BRK2' ||
//                                 event.dieSet === 'BRK1' || event.dieSet === 'BRK2');
    
//                 return isBreak;
//             }
    
//             function getColorForEvent(event, isActual) {
//                 if (isBreakEvent(event)) {
//                     return breakColor;
//                 }
    
//                 const dieset = event.dieSet || event.break || '';
//                 let colorIndexByDieset = isActual ? actualColorIndexByDieset : planColorIndexByDieset;
//                 let colorPalette = isActual ? actualColorPalette : planColorPalette;
    
//                 // Check if this dieset has already been assigned a color
//                 let colorIndex = colorIndexByDieset[dieset];
                
//                 // If no color has been assigned to this dieset
//                 if (colorIndex === undefined) {
//                     // Count unique diesets for this type (plan or actual)
//                     const uniqueDiesetCount = Object.keys(colorIndexByDieset).length;
                    
//                     // If we've exceeded the base palette, start a new cycle
//                     if (uniqueDiesetCount >= colorPalette.length) {
//                         // Use modulo to create a cycle, but shift the palette to provide visual distinction
//                         const cycleNumber = Math.floor(uniqueDiesetCount / colorPalette.length);
//                         colorIndex = (uniqueDiesetCount % colorPalette.length + cycleNumber) % colorPalette.length;
//                     } else {
//                         // Use the next available index in the first cycle
//                         colorIndex = uniqueDiesetCount;
//                     }
                    
//                     // Store the color index for this dieset
//                     colorIndexByDieset[dieset] = colorIndex;
//                 }
    
//                 return colorPalette[colorIndex];
//             }
    
//             const planEvents = chartEntity.planData.map(event => {
//                 const eventName = event.dieSet || event.break || '';
//                 return {
//                     startTime: event.planStart,
//                     endTime: event.planEnd,
//                     text: eventName,
//                     color: getColorForEvent(event, false)
//                 };
//             });
    
//             const completedEvents = chartEntity.actualData
//                 .filter(event => event.actualStart && event.actualEnd)
//                 .map(event => {
//                     const eventName = event.dieSet || event.break || '';
//                     return {
//                         startTime: event.actualStart,
//                         endTime: event.actualEnd,
//                         text: eventName,
//                         color: getColorForEvent(event, true)
//                     };
//                 });
    
//             const startOnlyEvents = chartEntity.actualData
//                 .filter(event => event.actualStart && !event.actualEnd)
//                 .map(event => {
//                     const eventName = event.dieSet || event.break || '';
//                     return {
//                         startTime: event.actualStart,
//                         endTime: event.actualStart,
//                         text: eventName,
//                         color: getColorForEvent(event, true),
//                         isStartOnly: true
//                     };
//                 });
    
//             const createCalenderEvent = (eventData) => {
//                 const calEvent = new palms.exported.framework.selfValidatingControls.CalenderEventData(
//                     eventData.startTime,
//                     eventData.endTime,
//                     eventData.text
//                 );
//                 calEvent.setColor(eventData.color);
//                 return calEvent;
//             };
    
//             const finalPlanEvents = planEvents.map(createCalenderEvent);
//             const finalActualEvents = [
//                 ...completedEvents.map(createCalenderEvent),
//                 ...startOnlyEvents.map(createCalenderEvent)
//             ];
    
//             this.timeChart.setEvents("PLAN", finalPlanEvents);
//             this.timeChart.setEvents("ACTUAL", finalActualEvents);
//             this.timeChart.render();
//         } catch (error) {
//             console.error("Error in setRecordData:", error);
//             console.error("Error details:", error.stack);
//         }
//     }


//     fetchNewData() {
//         return new ProductionLoadTimeChartEntity();
//     }
// }

class ProductionLoadTimeChartActionPanel extends palms.exported.framework.ActionForm {
    constructor() {
        super();
        this.timeChart = null;
        this.loadtime = new ProductionLoadTimeChartEntity();
        this.actionWidgetList = new ProductionLoadTimeChartActionWidgetsList(this.loadtime, this);
        this.fullScreen = false;
        this.registerFullScreenEvent();
        this.repeatedScheduler = null;
        this.refreshInterval = null;
    }

    onAttach() {
        let instance = this;
        try {
            this.openFullscreen(this.getElement());
            super.onAttach();
            
            // Set up auto-refresh
            this.refreshInterval = setInterval(() => {
                console.log("Auto-refresh triggered in action panel");
                this.refreshShiftDetails();
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

    openFullscreen(elem) {
        try {
            if (
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
                } else {
                    return false;
                }
            }
        } catch (err) {
            console.error("Error in openFullscreen():", err.message);
        }
    }

    closeFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    registerFullScreenEvent() {
        document.addEventListener("fullscreenchange", (event) => this.onFullScreenChange(event));
        document.addEventListener("webkitfullscreenchange", (event) => this.onFullScreenChange(event));
        document.addEventListener("msfullscreenchange", (event) => this.onFullScreenChange(event));
    }

    onFullScreenChange(event) {
        this.fullScreen = !this.fullScreen;
        if (this.fullScreen) {
            let style = super.getStyle();
            style.backgroundColor = '#F5F5DC';
            style.padding = '10px';
        } else {
            let style = super.getStyle();
            style.backgroundColor = 'transparent';
            style.padding = '';
        }
    }

    initialize() {
        try {
            super.initialize();
            super.addStyleName('ProductionLoadTimeChartActionPanel');

            const layouter = new palms.exported.framework.RecordWidgetsLayouterNColumn(this.actionWidgetList, 5);
            layouter.setAllowGroup(true);
            this.actionWidgetList.initialize();
            layouter.initialize();
            super.addWidgetControl(layouter.asWidget(), 'NORTH');
            super.setCellWidth(layouter.asWidget(), '100%');
            super.setCellHeight(layouter.asWidget(), '90px');

            this.timeChart = new palms.exported.framework.selfValidatingControls.TimeChart();
            this.timeChart.setInterval(10);
            super.addWidgetControl(this.timeChart, 'CENTER');
            super.setCellWidth(this.timeChart, '75%');
            super.setCellHeight(this.timeChart, '100%');
        } catch (error) {
            console.error("Error during initialization: ", error);
        }
    }

    refreshShiftDetails() {
        try {
            if (!this.loadtime || !this.loadtime.lineID) {
                console.error("LineID not available:", this.loadtime);
                return;
            }
    
            // var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            // proxy.url = "http://localhost:8081/getShiftDetails";
            const host = new LoadTimeChartDetails();
            var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            proxy.url = host.url + "getShiftDetails"; // Backend service URL

            proxy.payLoad = JSON.stringify({

                lineId: this.loadtime.lineID
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


    loadData(filterData) {
        try {
            // var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            // proxy.url = "http://localhost:8081/productionLoadTimeChart";
            const host = new LoadTimeChartDetails();
            var proxy = new palms.exported.framework.entity.entities.customSearchViews.WebServiceProxyCustomSearchViewEntity();
            proxy.url = host.url + "productionLoadTimeChart"; // Backend service URL
            proxy.payLoad = filterData;
            proxy.method = "POST";
            proxy.contentType = "application/json; charset=utf-8";
            proxy.timeout = 20000;
            proxy.keepAlive = false;

            let instance = this;
            var callback = new palms.exported.framework.webServiceAccess.WebServiceCallback();

            callback.onSuccess = function(responseData) {
                try {
                    console.log("Raw response data:", responseData);
                    var responseObj = JSON.parse(responseData);
                    console.log("Parsed response object:", responseObj);
                    
                    // Update the loadtime entity with the response data
                    instance.loadtime.populateFields(responseObj);
                    
                    // Update the UI
                    instance.setRecordData(instance.loadtime);
                    
                    console.log("Updated loadtime entity:", instance.loadtime);
                } catch (error) {
                    console.error("Error processing success response: ", error);
                }
            }

            callback.onFailure = function(errorDescription) {
                console.error("Failure: " + errorDescription);
            }

            palms.exported.framework.webServiceAccess.WAOs.InvokeWebService(proxy, callback);
        } catch (error) {
            console.error("Error loading data: ", error);
        }
    }


    // setRecordData(chartEntity) {
    //     try {
    //         if (!this.timeChart) {
    //             console.error("TimeChart is not initialized");
    //             return;
    //         }
    
    //         this.actionWidgetList.setRecordData(chartEntity);
    
    //         if (chartEntity.timeSlot && chartEntity.timeSlot.length > 0) {
    //             const { startTime, endTime } = chartEntity.timeSlot[0];
    //             this.timeChart.setStartTime(startTime);
    //             this.timeChart.setEndTime(endTime);
    //         }
    
    //         const breakColor = '#CCCCCC';
    
    //         const planColorPalette = [
    //             '#E6F3FF', '#B3D9FF', '#80BFFF', '#4DA6FF', '#1A8CFF',
    //             '#0066CC', '#004C99', '#003366', '#001933', '#000D1A'
    //         ];
    //         const actualColorPalette = [
    //             '#E6FFE6', '#B3FFB3', '#80FF80', '#4DFF4D', '#1AFF1A',
    //             '#00CC00', '#009900', '#006600', '#003300', '#001A00'
    //         ];
    
    //         const planColorIndexByDieset = {};
    //         const actualColorIndexByDieset = {};
    
    //         function isBreakEvent(event) {
    //             const isBreak = (event.break && event.break.toLowerCase().includes('break')) ||
    //                            (event.dieSet && event.dieSet.toLowerCase().includes('break')) ||
    //                            (typeof event === 'string' && event.toLowerCase().includes('break')) ||
    //                            (event.break === 'BRK1' || event.break === 'BRK2' ||
    //                             event.dieSet === 'BRK1' || event.dieSet === 'BRK2');
    
    //             return isBreak;
    //         }
    
    //         function getColorForEvent(event, isActual) {
    //             if (isBreakEvent(event)) {
    //                 return breakColor;
    //             }
    
    //             const dieset = event.dieSet || event.break || '';
    //             let colorIndexByDieset = isActual ? actualColorIndexByDieset : planColorIndexByDieset;
    //             let colorPalette = isActual ? actualColorPalette : planColorPalette;
    
    //             // Check if this dieset has already been assigned a color
    //             let colorIndex = colorIndexByDieset[dieset];
                
    //             // If no color has been assigned to this dieset
    //             if (colorIndex === undefined) {
    //                 // Count unique diesets for this type (plan or actual)
    //                 const uniqueDiesetCount = Object.keys(colorIndexByDieset).length;
                    
    //                 // If we've exceeded the base palette, start a new cycle
    //                 if (uniqueDiesetCount >= colorPalette.length) {
    //                     // Use modulo to create a cycle, but shift the palette to provide visual distinction
    //                     const cycleNumber = Math.floor(uniqueDiesetCount / colorPalette.length);
    //                     colorIndex = (uniqueDiesetCount % colorPalette.length + cycleNumber) % colorPalette.length;
    //                 } else {
    //                     // Use the next available index in the first cycle
    //                     colorIndex = uniqueDiesetCount;
    //                 }
                    
    //                 // Store the color index for this dieset
    //                 colorIndexByDieset[dieset] = colorIndex;
    //             }
    
    //             return colorPalette[colorIndex];
    //         }
    
    //         const planEvents = chartEntity.planData.map(event => {
    //             const eventName = event.dieSet || event.break || '';
    //             return {
    //                 startTime: event.planStart,
    //                 endTime: event.planEnd,
    //                 text: eventName,
    //                 color: getColorForEvent(event, false)
    //             };
    //         });
    
    //         const completedEvents = chartEntity.actualData
    //             .filter(event => event.actualStart && event.actualEnd)
    //             .map(event => {
    //                 const eventName = event.dieSet || event.break || '';
    //                 return {
    //                     startTime: event.actualStart,
    //                     endTime: event.actualEnd,
    //                     text: eventName,
    //                     color: getColorForEvent(event, true)
    //                 };
    //             });
    
    //         const startOnlyEvents = chartEntity.actualData
    //             .filter(event => event.actualStart && !event.actualEnd)
    //             .map(event => {
    //                 const eventName = event.dieSet || event.break || '';
    //                 return {
    //                     startTime: event.actualStart,
    //                     endTime: event.actualStart,
    //                     text: eventName,
    //                     color: getColorForEvent(event, true),
    //                     isStartOnly: true
    //                 };
    //             });
    
    //         const createCalendarEvent = (eventData) => {
    //             const calEvent = new palms.exported.framework.selfValidatingControls.CalendarEventData(
    //                 eventData.startTime,
    //                 eventData.endTime,
    //                 eventData.text
    //             );
    //             calEvent.setColor(eventData.color);
    //             return calEvent;
    //         };
    
    //         const finalPlanEvents = planEvents.map(createCalendarEvent);
    //         const finalActualEvents = [
    //             ...completedEvents.map(createCalendarEvent),
    //             ...startOnlyEvents.map(createCalendarEvent)
    //         ];
    
    //         this.timeChart.setEvents("PLAN", finalPlanEvents);
    //         this.timeChart.setEvents("ACTUAL", finalActualEvents);
    //         this.timeChart.render();
    //     } catch (error) {
    //         console.error("Error in setRecordData:", error);
    //         console.error("Error details:", error.stack);
    //     }
    // }

    setRecordData(chartEntity) {
        try {
            if (!this.timeChart) {
                console.error("TimeChart is not initialized");
                return;
            }
    
            this.actionWidgetList.setRecordData(chartEntity);
    
            if (chartEntity.timeSlot && chartEntity.timeSlot.length > 0) {
                const { startTime, endTime } = chartEntity.timeSlot[0];
                this.timeChart.setStartTime(startTime);
                this.timeChart.setEndTime(endTime);
            }
    
            const breakColor = '#CCCCCC';
            const planLineStopColor = '#E0E0E0';  
    
            const planColorPalette = [
                '#E6F3FF', '#B3D9FF', '#80BFFF', '#4DA6FF', '#1A8CFF',
                '#0066CC', '#004C99', '#003366', '#001933', '#000D1A'
            ];
            const actualColorPalette = [
                '#E6FFE6', '#B3FFB3', '#80FF80', '#4DFF4D', '#1AFF1A',
                '#00CC00', '#009900', '#006600', '#003300', '#001A00'
            ];
    
            const planColorIndexByDieset = {};
            const actualColorIndexByDieset = {};
    
            function isBreakEvent(event) {
                return (event.break && event.break.toLowerCase().includes('break')) ||
                       (event.dieSet && event.dieSet.toLowerCase().includes('break')) ||
                       (event.break === 'BRK1' || event.break === 'BRK2' ||
                        event.dieSet === 'BRK1' || event.dieSet === 'BRK2');
            }
    
            function formatEventText(event) {
                if (isBreakEvent(event) || event.dieSet === 'Planned Line Stop') {
                    return event.dieSet || event.break || '';
                }
            
                const eventName = event.dieSet || event.break || '';
                let displayText = eventName;
            
                if (event.planLotSize || event.actualLotSize) {
                    let lotSize = event.planLotSize || event.actualLotSize;
                    let quantity = '';
                    
                    // Parsing logic for negative values
                    if (lotSize.includes('Qty- -')) {
                        const matches = lotSize.match(/Qty- -(\d+)/);
                        if (matches && matches[1]) {
                            quantity = `-${matches[1]}`;
                        }
                    } else {
                        const matches = lotSize.match(/Qty- (\d+)/);
                        if (matches && matches[1]) {
                            quantity = matches[1];
                        }
                    }
            
                    displayText = `${eventName}\n\nQty = ${quantity}`;
                }
                
                // Updated to use queuedTime instead of 'Queued time'
                if (event.queuedTime) {
                    displayText += `\nQueued Time: ${event.queuedTime}`;
                }
                
                return displayText;
            }
    
            function getColorForEvent(event, isActual) {
                if (event.dieSet === 'Planned Line Stop') {
                    return planLineStopColor;
                }
    
                if (isBreakEvent(event)) {
                    return breakColor;
                }
    
                const dieset = event.dieSet || event.break || '';
                let colorIndexByDieset = isActual ? actualColorIndexByDieset : planColorIndexByDieset;
                let colorPalette = isActual ? actualColorPalette : planColorPalette;
    
                let colorIndex = colorIndexByDieset[dieset];
                
                if (colorIndex === undefined) {
                    const uniqueDiesetCount = Object.keys(colorIndexByDieset).length;
                    
                    if (uniqueDiesetCount >= colorPalette.length) {
                        const cycleNumber = Math.floor(uniqueDiesetCount / colorPalette.length);
                        colorIndex = (uniqueDiesetCount % colorPalette.length + cycleNumber) % colorPalette.length;
                    } else {
                        colorIndex = uniqueDiesetCount;
                    }
                    
                    colorIndexByDieset[dieset] = colorIndex;
                }
    
                return colorPalette[colorIndex];
            }
    
            // Explicitly create events arrays
            const planEvents = chartEntity.planData.map(event => ({
                startTime: event.planStart,
                endTime: event.planEnd,
                text: formatEventText(event),
                color: getColorForEvent(event, false),
                originalEvent: event
            }));
    
            const completedEvents = chartEntity.actualData
                .filter(event => event.actualStart && event.actualEnd)
                .map(event => ({
                    startTime: event.actualStart,
                    endTime: event.actualEnd,
                    text: formatEventText(event),
                    color: getColorForEvent(event, true),
                    originalEvent: event
                }));
    
            const startOnlyEvents = chartEntity.actualData
                .filter(event => event.actualStart && !event.actualEnd)
                .map(event => ({
                    startTime: event.actualStart,
                    endTime: event.actualStart,
                    text: formatEventText(event),
                    color: getColorForEvent(event, true),
                    isStartOnly: true,
                    originalEvent: event
                }));
    
            const createCalendarEvent = (eventData) => {
                try {
                    // Validate required parameters
                    if (!eventData.startTime || !eventData.endTime) {
                        console.error('Invalid event data:', eventData);
                        return null;
                    }
    
                    // Create CalendarEventData with required parameters
                    const calEvent = new palms.exported.framework.selfValidatingControls.CalendarEventData(
                        eventData.startTime,
                        eventData.endTime,
                        eventData.text || ''
                    );
    
                    // Set color if available
                    if (eventData.color) {
                        calEvent.setColor(eventData.color);
                    }
    
                    // Add delay for start-only events
                    if (eventData.isStartOnly) {
                        calEvent.addDelay((short));  // Adding a minimal delay
                    }
    
                    return calEvent;
                } catch (error) {
                    console.error('Error creating calendar event:', error);
                    console.error('Event data:', eventData);
                    return null;
                }
            };
    
            // Filter out any null events
            const finalPlanEvents = planEvents
                .map(createCalendarEvent)
                .filter(event => event !== null);
    
            const finalActualEvents = [
                ...completedEvents.map(createCalendarEvent),
                ...startOnlyEvents.map(createCalendarEvent)
            ].filter(event => event !== null);
    
            // Set events and render
            this.timeChart.setEvents("PLAN", finalPlanEvents);
            this.timeChart.setEvents("ACTUAL", finalActualEvents);
            this.timeChart.render();
    
        } catch (error) {
            console.error("Error in setRecordData:", error);
            console.error("Error details:", error.stack);
        }
    }
    fetchNewData() {
        return new ProductionLoadTimeChartEntity();
    }
}
    



