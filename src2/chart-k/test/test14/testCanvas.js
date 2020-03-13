util.loadData(function(datas){
	var kChartConfig = {
		width: "100%",/* 整体图形宽度 */

		paddingLeft: 60,
		paddingRight: 60,

		groupBarWidth: 13,/** 蜡烛的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间 */
		groupGap: 5,

		axisXTickGenerateIndicator: function(convertedData, env){/* 特定数据对应的横坐标刻度绘制与否的指示器 */
			return env.dataOverallIndexFromRightToLeft % 10 === 0;
		},
		axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
		axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
		axisLabelFont: null,
		axisLabelColor: "#333",

		axisXTickOffset: 10,/* 横坐标刻度距离原点的位移 */
		axisXTickOffsetFromRight: 10,/* 横坐标右侧刻度距离原点的位移 */
	};

	/**
	 * 烤串图配置
	 */
	var kKebabConfig = {
		height: "100%",

		paddingTop: 30,
		paddingBottom: 30,

		showHorizontalGridLine: false,
		showVerticalGridLine: false,

		axisYTickOffset: 10,
		groupItemHeight: 5,
		groupHorizontalPadding: "20%",
		groupItemColor: "orange",
		groupBackground: function(convertedData, i){
			// return i % 2 === 0? "#EEEEEE": null;
			return i % 2 === 0? new TradeChart2.LinearGradient(["0:rgba(241,242,244, 1)", "0.7:rgba(241,242,244, 0.7)","1:rgba(241,242,244, 0.2)"]): null
		}
	};

	var kebabContainerObj = document.querySelector(".kebab"),
		dataDetailObj = document.querySelector(".data-detail");

	var KChart = TradeChart2.KChart,
		KSubChartOperationUtil = TradeChart2.KSubChartOperationUtil,
		util = TradeChart2.util;

	datas = [];
	for(var i = 0; i < 300; i++){
		var priceList = [];
		var len = 1 + Math.floor(Math.random() * 2);
		for(var j = 0; j < len; j++){
			priceList.push((0.2 + Math.random()).toFixed(1));
		}

		datas.push({
			time: i,
			priceList: priceList
		});
	}

	if(false)
	datas = [
		{
			time: 0,
			priceList: [6]
		},
		{
			time: 1,
			priceList: [7, 1]
		},
		{
			time: 2,
			priceList: [8, 4]
		}
	];

	if(false)
	datas = [
		{
			time: 0,
			priceList: [0.6]
		},
		{
			time: 1,
			priceList: [0.7, 1.1]
		},
		{
			time: 2,
			priceList: [0.8, 0.4]
		}
	];

	if(false)
	datas = [
		{
			time: 0,
			priceList: [1.1]
		},
		{
			time: 1,
			priceList: [0.4]
		},
		{
			time: 2,
			priceList: [0.4]
		}
	];

	var kChart = new KChart().setConfig(kChartConfig).setDataList(datas);

	/* 烤串图 */
	var subChart_kebab = kChart.newSubChart(TradeChart2.SubChartTypes.K_KEBAB).setConfig(kKebabConfig);
	var result_kebab = subChart_kebab.renderIn(kebabContainerObj);

	var kebabOperationCanvasObj = kebabContainerObj.querySelector(".operation");
	KSubChartOperationUtil.addKSubChartOperationSupport(
		kebabOperationCanvasObj,
		result_kebab,
		{
			dataHighlightAction: util.bindActions([
				KSubChartOperationUtil.newDataHighlightAction_4CandleChart(kebabOperationCanvasObj, result_kebab),
				function(convertedData, dataMetadata){
					dataDetailObj.innerHTML = null == convertedData? "--": (dataMetadata.dataIndex + " --> " + JSON.stringify(convertedData));
				}
			]),
			revertDataHighlightAction: util.bindActions([
				KSubChartOperationUtil.newRevertDataHighlightAction_4CandleChart(kebabOperationCanvasObj, result_kebab),
				function(){
					dataDetailObj.innerHTML = "";
				}
			])
		}
	);

	window.kChart = kChart;
	window.subChart_kebab = subChart_kebab;
	window.result_kebab = result_kebab;
});