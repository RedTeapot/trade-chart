util.loadData(function(datas){
	var kChartConfig = {
		width: "100%",/* 整体图形宽度 */

		paddingLeft: 60,
		paddingRight: 60,

		groupLineWidth: 3,/** 蜡烛线的宽度。最好为奇数，从而使得线可以正好在正中间 */
		groupBarWidth: 9,/** 蜡烛的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间 */
		groupGap: 3,

		axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
		axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
		axisLabelFont: null,
		axisLabelColor: "#333",

		axisXTickOffset: 10,/* 横坐标刻度距离原点的位移 */
		axisXTickOffsetFromRight: 20,/* 横坐标右侧刻度距离原点的位移 */
		axisXTickInterval: 30,/** 横坐标刻度之间相差的点的个数 */
	};

	var kTrendConfig = {
		height: "100%",

		paddingTop: 30,
		paddingBottom: 30,

		lineColor: "#969696",
		coordinateBackground: "transparent",
		enclosedAreaBackground: new TradeChart2.LinearGradient(["0:rgba(241,242,244, 1)", "0.7:rgba(241,242,244, 0.7)","1:rgba(241,242,244, 0.1)"]),
	};
	var kVolumeConfig = {
		height: "100%",

		paddingTop: 10,
		paddingBottom: 30,

		showAxisXLine: true,/** 是否绘制横坐标轴 */
		showAxisXLabel: true,/** 是否绘制横坐标刻度值 */
		showAxisYLine: true,/** 是否绘制纵坐标轴 */
		showAxisYLabel: true,/** 是否绘制纵坐标刻度值 */

		axisYPosition: "right",
		axisYTickOffset: 10,

		showVerticalGridLine: false,
		showHorizontalGridLine: false,

		coordinateBackground: null
	};

	var trendCanvasObj = document.querySelector(".column .trend canvas"),
		volumeCanvasObj = document.querySelector(".column .volume canvas"),
		trendOperationCanvasObj = document.querySelector(".column .trend .operation"),
		volumeOperationCanvasObj = document.querySelector(".column .volume .operation"),

		dataDetailObj = document.querySelector(".data-detail");


	var KChart = TradeChart2.KChart,
		util = TradeChart2.util;
	var sepIndex = Math.floor(datas.length - 20);
	var kChart = new KChart().setConfig(kChartConfig).setDataList(datas.slice(0));
	window.kChart = kChart;

	/* 走势图 */
	var subChart_trend = kChart.newSubChart(TradeChart2.SubChartTypes.K_TREND).setConfig(kTrendConfig);
	var result_trend = subChart_trend.render(trendCanvasObj);
	result_trend.applyRenderingCanvasSettingTo(trendOperationCanvasObj);
	window.subChart_trend = subChart_trend;
	window.result_trend = result_trend;

	/* 量图 */
	var subChart_volume = kChart.newSubChart(TradeChart2.SubChartTypes.K_VOLUME).setConfig(kVolumeConfig);
	var result_volume = subChart_volume.render(volumeCanvasObj);
	result_volume.applyRenderingCanvasSettingTo(volumeOperationCanvasObj);
	window.subChart_volume = subChart_volume;
	window.result_volume = result_volume;

	var drawHorizontalLineAndDot = function(dataMetadata){
		var x = dataMetadata.renderingHorizontalPosition;
		if(-1 === x)
			return;

		var y = result_trend._calcYPosition(dataMetadata.convertedData.closePrice);

		var trendCanvasCtx = trendOperationCanvasObj.getContext("2d");
		trendCanvasCtx.save();

		trendCanvasCtx.lineWidth = 0.5;
		trendCanvasCtx.setLineDash([5, 5]);

		/* 横线 */
		var left = kChart._calcAxisXLeftPosition(),
			right = kChart._calcAxisXRightPosition(trendCanvasCtx.canvas.width);
		var dataSketch = result_trend.getDataSketch();
		trendCanvasCtx.beginPath();
		trendCanvasCtx.moveTo(left, y);
		trendCanvasCtx.lineTo(right, y);
		trendCanvasCtx.stroke();

		/* 大圆点 */
		var dotRadius = 10;
		trendCanvasCtx.fillStyle = "#21E050";
		trendCanvasCtx.globalAlpha = 0.3;
		trendCanvasCtx.beginPath();
		trendCanvasCtx.moveTo(x, y);
		trendCanvasCtx.arc(x, y, dotRadius, 2 * Math.PI, 0);
		trendCanvasCtx.closePath();
		trendCanvasCtx.fill();

		/* 小圆点 */
		trendCanvasCtx.globalAlpha = 1;
		trendCanvasCtx.beginPath();
		trendCanvasCtx.moveTo(x, y);
		trendCanvasCtx.arc(x, y, dotRadius / 2, 2 * Math.PI, 0);
		trendCanvasCtx.closePath();
		trendCanvasCtx.fill();

		trendCanvasCtx.restore();
	};

	var drawVerticalLine = function(canvasObj, dataMetadata, top, bottom){
		var detailCtx = canvasObj.getContext("2d");
		detailCtx.clearRect(0, 0, detailCtx.canvas.width, detailCtx.canvas.height);

		var x = dataMetadata.renderingHorizontalPosition;
		if(-1 === x)
			return;

		/* 竖线 */
		detailCtx.save();
		detailCtx.lineWidth = 0.5;
		detailCtx.setLineDash([5, 5]);
		detailCtx.beginPath();
		detailCtx.moveTo(x, top);
		detailCtx.lineTo(x, bottom);
		detailCtx.stroke();
		detailCtx.restore();
	};

	var ops = {
		revertDataHighlightAction: function(lastMetadata){
			var f = function(canvasObj){
				var detailCtx = canvasObj.getContext("2d");
				detailCtx.clearRect(0, 0, detailCtx.canvas.width, detailCtx.canvas.height);
			};

			f(trendOperationCanvasObj);
			f(volumeOperationCanvasObj);
		},
		dataHighlightAction: function(convertedData, dataMetadata){
			drawVerticalLine(
				volumeOperationCanvasObj,
				dataMetadata,
				TradeChart2.util.getLinePosition(0),
				TradeChart2.util.getLinePosition(result_volume.getKSubChartSketch().getCanvasHeight() - result_volume.getConfigItem("paddingBottom"))
			);

			drawVerticalLine(
				trendOperationCanvasObj,
				dataMetadata,
				TradeChart2.util.getLinePosition(result_trend.getConfigItem("paddingTop")),
				TradeChart2.util.getLinePosition(result_trend.getKSubChartSketch().getCanvasHeight())
			);
			drawHorizontalLineAndDot(dataMetadata);

			dataDetailObj.innerHTML = null == convertedData? "--": (dataMetadata.dataIndex + " --> " + JSON.stringify(convertedData));
		}
	};

	util.addKSubChartOperationSupport(trendOperationCanvasObj, result_trend, ops);
	util.addKSubChartOperationSupport(volumeOperationCanvasObj, result_volume, ops);
});