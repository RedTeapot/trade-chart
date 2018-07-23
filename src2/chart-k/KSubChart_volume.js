;(function(){
	var TradeChart2 = window.TradeChart2;
	var KChart = TradeChart2.chart.KChart;
	var KSubChart = KChart.KSubChart,
		RenderedKSubChart = KChart.RenderedKSubChart;
	var util = TradeChart2.util;

	var numBig = function(big){
		return Number(big.toString());
	};
	var roundBig = function(big){
		return Math.round(numBig(big));
	};
	var floorBig = function(big){
		return Math.floor(numBig(big));
	};
	var ceilBig = function(big){
		return Math.ceil(numBig(big));
	};


	/**
	 * 默认的，适用于“量图”子图的配置项
	 * @type {Object<String, *>}
	 */
	var defaultMainChartConfig = {
		height: 300,/** 图表整体高度 */

		paddingTop: 20,/** 图表内边距 - 上侧 */
		paddingBottom: 20,/** 图表内边距 - 下侧 */
		paddingLeft: 60,/** 图表内边距 - 左侧 */
		paddingRight: 20,/** 图表内边距 - 右侧 */

		showAxisXLine: true,/** 是否绘制横坐标轴 */
		showAxisXLabel: true,/** 是否绘制横坐标刻度值 */
		showAxisYLine: true,/** 是否绘制纵坐标轴 */
		showAxisYLabel: true,/** 是否绘制纵坐标刻度值 */

		axisYLabelVerticalOffset: function(i, n){/** 纵坐标标签纵向位移 */
			//i: 自下而上的刻度索引。从0开始
			//n：刻度的总个数，包括最小值和最大值
			return 0;
		},
		axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移 */
		axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
		axisYPrecision: "auto",/** 纵坐标的数字精度（仅在没有指定配置项：axisYFormatter时有效。如果指定了axisYFormatter，将直接使用指定的格式化方法返回的值）。auto：根据给定的数据自动检测 */
		axisYFormatter: function(price, config){/** 纵坐标数字格式化方法 */
			/** price：价格；config：配置 */
			return util.formatMoney(price, config.axisYPrecision);
		},
		axisYPriceFloor: function(min, max, avgVariation, maxVariation){
			if(!isFinite(min))
				min = 0;
			if(!isFinite(avgVariation))
				avgVariation = 0;

			min = Math.max(min, 0);
			avgVariation = Math.abs(avgVariation);

			return numBig(new Big(min).minus(new Big(avgVariation).div(2)));
		},
		axisYPriceFloorLabelFont: null,/** 纵坐标最小值的坐标标签字体 */
		axisYPriceFloorLabelColor: null,/** 纵坐标最小值的坐标标签颜色 */
		axisYPriceCeiling: function(min, max, avgVariation, maxVariation){
			if(!isFinite(max))
				max = 0;
			if(!isFinite(avgVariation))
				avgVariation = 0;

			max = Math.max(max, 0);
			avgVariation = Math.abs(avgVariation);

			return numBig(new Big(max).plus(new Big(avgVariation).div(2)));
		},
		axisYPriceCeilingLabelFont: null,/** 纵坐标最小值的坐标标签字体 */
		axisYPriceCeilingLabelColor: null,/** 纵坐标最小值的坐标标签颜色 */

		appreciatedColor: "#d58c2a",/** 收盘价大于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
		depreciatedColor: "#21CB21",/** 收盘价小于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
		keepedColor: "white",/** 收盘价等于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
	};

	/**
	 * @constructor
	 * 完成绘制了的成交量子图
	 */
	var RenderedKSubChart_volume = function(){
		//TODO
	};

	var VolumeChart = function(){
		KSubChart.call(this, "volume");

		/**
		 * @override
		 *
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} config 渲染配置
		 * @returns {RenderedKChart} 绘制的K线图
		 */
		this.render = function(canvasObj, config){
			//TODO
			return new RenderedKSubChart_volume();
		};
	};
	VolumeChart.prototype = Object.create(KSubChart.prototype);

	KChart.defineSubChart("VolumeChart", VolumeChart);
})();