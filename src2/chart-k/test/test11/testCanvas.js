util.loadData(function(datas){
	var kChartConfig = {
		width: "100%",/* 整体图形宽度 */

		paddingLeft: 60,
		paddingRight: 60,

		groupLineWidth: 3,/** 蜡烛线的宽度。最好为奇数，从而使得线可以正好在正中间 */
		groupBarWidth: 21,/** 蜡烛的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间 */
		groupGap: "autoDividedByFixedGroupCount:173",

		axisXTickGenerateIndicator: function(convertedData, env){/* 特定数据对应的横坐标刻度绘制与否的指示器 */
			return env.dataOverallIndexFromRightToLeft % 10 === 0;
		},
		axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
		axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
		axisLabelFont: null,
		axisLabelColor: "#333",

		axisXTickOffset: 0,/* 横坐标刻度距离原点的位移 */
		axisXTickOffsetFromRight: 0,/* 横坐标右侧刻度距离原点的位移 */
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
		KSubChartOperationUtil = TradeChart2.KSubChartOperationUtil,
		util = TradeChart2.util;
	var sepIndex = Math.floor(datas.length - 20);
	var kChart = new KChart().setConfig(kChartConfig).setDataList(datas.slice(0));
	window.kChart = kChart;

	/* 走势图 */
	var subChart_trend = kChart.newSubChart(TradeChart2.SubChartTypes.K_TREND).setConfig(kTrendConfig);
	var result_trend = subChart_trend.render(trendCanvasObj);

	/* 量图 */
	var subChart_volume = kChart.newSubChart(TradeChart2.SubChartTypes.K_VOLUME).setConfig(kVolumeConfig);
	var result_volume = subChart_volume.render(volumeCanvasObj);

	KSubChartOperationUtil.addKSubChartOperationSupport(trendOperationCanvasObj, result_trend, {
		revertDataHighlightAction: KSubChartOperationUtil.newRevertDataHighlightAction_4TrendChart(trendOperationCanvasObj, result_trend),
		dataHighlightAction: KSubChartOperationUtil.newDataHighlightAction_4TrendChart(trendOperationCanvasObj, result_trend)
	});

	KSubChartOperationUtil.addKSubChartOperationSupport(volumeOperationCanvasObj, result_volume, {
		revertDataHighlightAction: KSubChartOperationUtil.newRevertDataHighlightAction_4CandleChart(volumeOperationCanvasObj, result_volume, {
			renderHorizontalLine: false
		}),
		dataHighlightAction: KSubChartOperationUtil.newDataHighlightAction_4CandleChart(volumeOperationCanvasObj, result_volume, {
			renderHorizontalLine: false
		})
	});
});