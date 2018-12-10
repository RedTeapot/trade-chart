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
		height: 300,

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
	var kVolumeConfig = {
		height: 200,

		paddingTop: 20,
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

	var containerObj = document.querySelector(".container");

	var sepIndex = 5;
	var KChart = TradeChart2.KChart;
	var kChart = new KChart().setConfig(kChartConfig).setDataList(datas.slice(0, sepIndex));

	/* 蜡烛图 */
	var subChart_candle = kChart.newSubChart(TradeChart2.KSubChartTypes.CANDLE).setConfig(kCandleConfig);
	var result_candle = subChart_candle.renderIn(containerObj);

	/* 量图 */
	var subChart_volume = kChart.newSubChart(TradeChart2.KSubChartTypes.VOLUME).setConfig(kVolumeConfig);
	var result_volume = subChart_volume.renderIn(containerObj);

	var append = function(){
		if(sepIndex >= datas.length)
			return;

		kChart.appendDataList(datas.slice(sepIndex, ++sepIndex), true);
		console.log(kChart.getDataList());
		setTimeout(append, 800);
	};
	append();


	window.kChart = kChart;
	window.kdm = kChart.getKDataManager();
});