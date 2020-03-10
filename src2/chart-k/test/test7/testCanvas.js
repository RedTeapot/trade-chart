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
	};

	var kCandleConfig = {
		height: "100%",

		paddingTop: 30,
		paddingBottom: 30,

		showAxisXLine: true,/** 是否绘制横坐标轴 */
		showAxisXLabel: false,/** 是否绘制横坐标刻度值 */
		showAxisYLine: true,/** 是否绘制纵坐标轴 */
		showAxisYLabel: true,/** 是否绘制纵坐标刻度值 */
		gridLineDash: [5, 5],

		axisYTickOffset: 10,/* 纵坐标刻度距离原点的位移 */

		coordinateBackground: "#F0F0F0",
		keepingColor: "blue"
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

	var candleCanvasObj = document.querySelector(".column .candle canvas"),
		volumeCanvasObj = document.querySelector(".column .volume canvas"),
		candleOperationCanvasObj = document.querySelector(".column .candle .operation"),
		volumeOperationCanvasObj = document.querySelector(".column .volume .operation"),

		dataDetailObj = document.querySelector(".data-detail");


	var KChart = TradeChart2.KChart,
		util = TradeChart2.util;
	var sepIndex = Math.floor(datas.length - 20);
	var kChart = new KChart().setConfig(kChartConfig).setDataList(datas.slice(0));
	window.kChart = kChart;

	/* 蜡烛图 */
	var subChart_candle = kChart.newSubChart(TradeChart2.SubChartTypes.K_CANDLE).setConfig(kCandleConfig);
	var result_candle = subChart_candle.render(candleCanvasObj);
	result_candle.applyRenderingCanvasSettingTo(candleOperationCanvasObj);
	window.subChart_candle = subChart_candle;
	window.result_candle = result_candle;

	/* 量图 */
	var subChart_volume = kChart.newSubChart(TradeChart2.SubChartTypes.K_VOLUME).setConfig(kVolumeConfig);
	var result_volume = subChart_volume.render(volumeCanvasObj);
	result_volume.applyRenderingCanvasSettingTo(volumeOperationCanvasObj);
	window.subChart_volume = subChart_volume;
	window.result_volume = result_volume;

	var drawLine = function(detailCtx, x, top, bottom){
		detailCtx.clearRect(0, 0, detailCtx.canvas.width, detailCtx.canvas.height);
		if(-1 == x)
			return;

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
				var left = 0, width = detailCtx.canvas.width;
				if(null != lastMetadata){
					var x = lastMetadata.renderingHorizontalPosition;
					var len = 5;
					left = Math.max(0, x - len);
					width = 2 * len;
				}
				detailCtx.clearRect(left, 0, width, detailCtx.canvas.height);
			};

			f(candleOperationCanvasObj);
			f(volumeOperationCanvasObj);
		},
		dataHighlightAction: function(convertedData, dataMetadata){
			drawLine(
				candleOperationCanvasObj.getContext("2d"),
				dataMetadata.renderingHorizontalPosition,
				TradeChart2.util.getLinePosition(result_candle.getConfigItemValue("paddingTop")),
				TradeChart2.util.getLinePosition(result_candle.getKSubChartSketch().getCanvasHeight())
			);
			drawLine(
				volumeOperationCanvasObj.getContext("2d"),
				dataMetadata.renderingHorizontalPosition,
				TradeChart2.util.getLinePosition(0),
				TradeChart2.util.getLinePosition(result_volume.getKSubChartSketch().getCanvasHeight() - result_volume.getConfigItemValue("paddingBottom"))
			);

			dataDetailObj.innerHTML = null == convertedData? "--": (dataMetadata.dataIndex + " --> " + JSON.stringify(convertedData));
		}
	};

	TradeChart2.KSubChartOperationUtil.addKSubChartOperationSupport(candleOperationCanvasObj, result_candle, ops);
	TradeChart2.KSubChartOperationUtil.addKSubChartOperationSupport(volumeOperationCanvasObj, result_volume, ops);
});