util.loadData(function(datas){
	var kChartConfig = {
		width: "100%",/* 整体图形宽度 */

		paddingLeft: 60,
		paddingRight: 60,

		groupLineWidth: 3,/** 蜡烛线的宽度。最好为奇数，从而使得线可以正好在正中间 */
		groupBarWidth: 7,/** 蜡烛的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间 */
		groupGap: 3,

		axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
		axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
		axisLabelFont: null,

		axisXTickOffset: 0,/* 横坐标刻度距离原点的位移 */
		axisXTickOffsetFromRight: 0,/* 横坐标右侧刻度距离原点的位移 */
		axisXTickInterval: 30,/** 横坐标刻度之间相差的点的个数 */
		axisXLabelSize: 100,
	};

	var kCandleConfig = {
		height: "100%",

		paddingTop: 20,
		paddingBottom: 30,

		showAxisXLabel: false,

		axisYTickOffset: 10,/* 纵坐标刻度距离原点的位移 */

		coordinateBackground: "#F0F0F0",
		keepingColor: "blue"
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

	var column_candleObj = document.querySelector(".column .candle canvas"),
		column_volumeObj = document.querySelector(".column .volume canvas"),
		column_candleDetailObj = document.querySelector(".column .candle .detail"),
		column_volumeDetailObj = document.querySelector(".column .volume .detail"),

		dataDetailObj = document.querySelector(".data-detail");

	var moveLeftObj = document.querySelector(".move-left"),
		moveRightObj = document.querySelector(".move-right");

	column_candleObj.detailCanvas = column_candleDetailObj;
	column_volumeObj.detailCanvas = column_volumeDetailObj;

	var KChart = TradeChart2.KChart;
	var sepIndex = Math.floor(datas.length - 10);
	var kChart = new KChart().setConfig(kChartConfig).setDataList(datas);
	window.kChart = kChart;
	window.kdm = kChart.getKDataManager();

	/* 蜡烛图 */
	var subChart_candle = kChart.newSubChart(TradeChart2.KSubChartTypes.CANDLE);
	var result_candle = subChart_candle.render(column_candleObj, kCandleConfig);
	window.subChart_candle = subChart_candle;
	window.result_candle = result_candle;
	result_candle.initCanvas(column_candleDetailObj);

	/* 量图 */
	var subChart_volume = kChart.newSubChart(TradeChart2.KSubChartTypes.VOLUME);
	var result_volume = subChart_volume.render(column_volumeObj, kVolumeConfig);
	window.subChart_volume = subChart_volume;
	window.result_volume = result_volume;
	result_volume.initCanvas(column_volumeDetailObj);


	var isModeViewDetail = true;
	var lastX = 0;
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
		var dataIndex = result.getRenderingDataIndex(x);

		dataDetailObj.innerHTML = null == convertedData? "--": (dataIndex + " --> " + JSON.stringify(convertedData));
		if(null == convertedData)
			return;

		drawLine4DataIndex(result, dataIndex, top, bottom);
	};

	var viewDetail = function(e){
		var x = e.layerX;

		drawLineAndShowDataDetail4X(result_candle, x,
			result_candle.getConfigItem("paddingTop"),
			TradeChart2.util.getLinePosition(result_candle.getConfigItem("height"))
		);
		drawLineAndShowDataDetail4X(result_volume, x,
			TradeChart2.util.getLinePosition(0),
			TradeChart2.util.getLinePosition(result_volume.getConfigItem("height") - result_volume.getConfigItem("paddingBottom"))
		);
	};

	var showPrevious = function(e){
		var x = e.layerX;
		var offsetX = x - lastX;
		kChart.updateRenderingOffsetBy(offsetX, result_candle.getMaxGroupCount());
		lastX = x;
	};

	[column_candleDetailObj, column_volumeDetailObj].forEach(function(obj){
		obj.addEventListener("mousedown", function(e){
			isModeViewDetail = false;
			lastX = e.layerX;
		});
		obj.addEventListener("mousemove", function(e){
			if(!isModeViewDetail)
				showPrevious(e);
			else
				viewDetail(e);
		});
	});
	["mouseup", "blur"].forEach(function(e){
		document.addEventListener(e, function(){
			isModeViewDetail = true;
		});
	});
});