util.loadData(function(datas){
	var kChartConfig = {
		width: "100%",/* 整体图形宽度 */

		paddingLeft: 60,
		paddingRight: 60,

		groupGap: 3,

		axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
		axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
		axisLabelFont: null,

		axisXTickOffset: 20,/* 横坐标刻度距离原点的位移 */
		axisXTickOffsetFromRight: 20,/* 横坐标刻度距离原点的位移 */
		axisXTickInterval: 30,/** 横坐标刻度之间相差的点的个数 */
	};

	var kCandleConfig = {
		height: "100%",

		paddingTop: 20,
		paddingBottom: 30,

		showAxisXLabel: false,

		axisYTickOffset: 10,/* 纵坐标刻度距离原点的位移 */

		coordinateBackground: "#F0F0F0"
	};
	var kVolumeConfig = {
		height: "100%",

		paddingTop: 20,
		paddingBottom: 30,

		axisYPosition: "right",
		axisYTickOffset: 10,

		showVerticalGridLine: false,
		horizontalGridLineColor: false,

		coordinateBackground: null
	};

	var row_candleObj = document.querySelector(".row .candle canvas"),
		row_volumeObj = document.querySelector(".row .volume canvas"),
		row_candleDetailObj = document.querySelector(".row .candle .detail"),
		row_volumeDetailObj = document.querySelector(".row .volume .detail"),

		column_candleObj = document.querySelector(".column .candle canvas"),
		column_volumeObj = document.querySelector(".column .volume canvas"),
		column_candleDetailObj = document.querySelector(".column .candle .detail"),
		column_volumeDetailObj = document.querySelector(".column .volume .detail"),

		dataDetailObj = document.querySelector(".data-detail");

	column_candleObj.detailCanvas = column_candleDetailObj;
	column_volumeObj.detailCanvas = column_volumeDetailObj;
	row_candleObj.detailCanvas = row_candleDetailObj;
	row_volumeObj.detailCanvas = row_volumeDetailObj;

	var KChart = TradeChart2.KChart;
	var kChart = new KChart().setDataParser(function(d, i){
		var obj = {time: util.formatDate(new Date(d.i * 1000), "HH:mm"), openPrice: d.o, closePrice: d.c, highPrice: d.h, lowPrice: d.l, volume: d.a};
		if(isNaN(obj.openPrice)){
			console.error(d, i, obj.openPrice);
			obj.openPrice = 0;
		}
		if(isNaN(obj.closePrice)){
			console.error(d, i, obj.closePrice);
			obj.closePrice = 0;
		}
		if(isNaN(obj.highPrice)){
			console.error(d, i, obj.highPrice);
			obj.highPrice = 0;
		}
		if(isNaN(obj.lowPrice)){
			console.error(d, i, obj.lowPrice);
			obj.lowPrice = 0;
		}

		return obj;
	}).setDataList(datas).setConfig(kChartConfig);

	/* 蜡烛图 */
	var subChart_candle = kChart.newSubChart(TradeChart2.SubChartTypes.K_CANDLE).setConfig(kCandleConfig);
	var rowResult_candle = subChart_candle.render(row_candleObj);
	window.rowResult_candle = rowResult_candle;
	rowResult_candle.initCanvas(row_candleDetailObj);

	var columnResult_candle = subChart_candle.render(column_candleObj);
	window.columnResult_candle = columnResult_candle;
	columnResult_candle.initCanvas(column_candleDetailObj);

	/* 量图 */
	var subChart_volume = kChart.newSubChart(TradeChart2.SubChartTypes.K_VOLUME).setConfig(kVolumeConfig);
	var rowResult_volume = subChart_volume.render(row_volumeObj);
	window.rowResult_volume = rowResult_volume;
	rowResult_volume.initCanvas(row_volumeDetailObj);

	var columnResult_volume = subChart_volume.render(column_volumeObj);
	window.columnResult_volume = columnResult_volume;
	columnResult_volume.initCanvas(column_volumeDetailObj);

	var drawLine4DataIndex = function(result, dataIndex, top, bottom){
		var canvasObj = result.getCanvasDomElement();
		var detailCtx = canvasObj.detailCanvas.getContext("2d");
		detailCtx.clearRect(0, 0, canvasObj.width, canvasObj.height);

		var x = result.getRenderingHorizontalPosition(dataIndex);
		if(-1 == x)
			return;

		detailCtx.lineWidth = 0.5;
		detailCtx.setLineDash([5, 5]);
		detailCtx.beginPath();
		detailCtx.moveTo(x, top);
		detailCtx.lineTo(x, bottom);
		detailCtx.stroke();
	};

	var drawLineAndShowDataDetail4X = function(result, x, top, bottom){
		var canvasObj = result.getCanvasDomElement();
		var detailCtx = canvasObj.detailCanvas.getContext("2d");
		detailCtx.clearRect(0, 0, canvasObj.width, canvasObj.height);

		var convertedData = result.getConvertedRenderingData(x);
		dataDetailObj.innerHTML = null == convertedData? "--": JSON.stringify(convertedData);
		if(null == convertedData)
			return;

		var dataIndex = result.getRenderingDataIndex(x);
		drawLine4DataIndex(result, dataIndex, top, bottom);
	};

	/* 纵向排列时的明细查看 */
	var f = function(e){
		var x = e.layerX;

		drawLineAndShowDataDetail4X(columnResult_candle, x,
			columnResult_candle.getConfigItem("paddingTop"),
			TradeChart2.util.getLinePosition(columnResult_candle.getConfigItem("height"))
		);
		drawLineAndShowDataDetail4X(columnResult_volume, x,
			TradeChart2.util.getLinePosition(0),
			TradeChart2.util.getLinePosition(columnResult_volume.getConfigItem("height") - columnResult_volume.getConfigItem("paddingBottom"))
		);
	};
	column_candleDetailObj.addEventListener("mousemove", f);
	column_volumeDetailObj.addEventListener("mousemove", f);

	var g = function(e){
		var x = e.layerX;

		drawLineAndShowDataDetail4X(rowResult_candle, x,
			columnResult_candle.getConfigItem("paddingTop"),
			TradeChart2.util.getLinePosition(rowResult_candle.getConfigItem("height") - rowResult_candle.getConfigItem("paddingBottom"))
		);
		drawLineAndShowDataDetail4X(rowResult_volume, x,
			columnResult_candle.getConfigItem("paddingTop"),
			TradeChart2.util.getLinePosition(rowResult_volume.getConfigItem("height") - rowResult_volume.getConfigItem("paddingBottom"))
		);
	};
	row_candleDetailObj.addEventListener("mousemove", g);
	row_volumeDetailObj.addEventListener("mousemove", g);

});