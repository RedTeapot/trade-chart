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
		axisXLabelSize: 100,
	};

	var kCandleConfig = {
		height: "100%",

		paddingTop: 20,
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
	var kIndexMAConfig = {
		height: "100%",

		paddingTop: 20,
		paddingBottom: 30,

		showAxisXLine: true,/** 是否绘制横坐标轴 */
		showAxisXLabel: false,/** 是否绘制横坐标刻度值 */
		showAxisYLine: true,/** 是否绘制纵坐标轴 */
		showAxisYLabel: true,/** 是否绘制纵坐标刻度值 */
		gridLineDash: [5, 5],

		axisYTickOffset: 10,/* 纵坐标刻度距离原点的位移 */
	};

	var containerObj = document.querySelector(".container");

	var KChart = TradeChart2.KChart;
	var kChart = new KChart().setConfig(kChartConfig).setDataList(datas.slice(0));

	var kSubChart_candle = kChart.newSubChart(TradeChart2.SubChartTypes.K_CANDLE).setConfig(kCandleConfig);
	kSubChart_candle.renderIn(containerObj);

	var kSubChart_index_ma = kChart.newSubChart(TradeChart2.SubChartTypes.K_INDEX_MA).setConfig(kIndexMAConfig);
	kSubChart_index_ma.renderIn(containerObj);
});