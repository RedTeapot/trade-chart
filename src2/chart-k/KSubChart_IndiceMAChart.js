;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChartSketch = TradeChart2.KChartSketch,

		KSubChartTypes = TradeChart2.KSubChartTypes,
		KSubChartConfig_CandleConfig = TradeChart2.KSubChartConfig_CandleConfig,
		KSubChart = TradeChart2.KSubChart,
		KSubChart_IndexMARenderResult = TradeChart2.KSubChart_IndexMARenderResult,

		KSubChartSketch_CandleDataSketch = TradeChart2.KSubChartSketch_CandleDataSketch,
		KSubChartSketch_CandleChartSketch = TradeChart2.KSubChartSketch_CandleChartSketch;

	var numBig = function(big){
		return Number(big.toString());
	};
	var roundBig = function(big){
		return Math.round(numBig(big));
	};
	var floorBig = function(big){
		return Math.floor(numBig(big));
	};

	var NOT_SUPPLIED = {};

	/**
	 * @constructor
	 * @augments KSubChart
	 *
	 * K线图子图：指标：MA图
	 * @param {KChart} kChart 附加该子图的K线图
	 */
	var KSubChart_IndexMAChart = function(kChart){
		KSubChart.call(this, kChart, KSubChartTypes.INDICE_MA);
		var self = this;

		/* 渲染配置 */
		var config = new KSubChartConfig_CandleConfig().setUpstreamConfigInstance(kChart.getConfig(), true);

		/**
		 * 获取配置项集合
		 * @override
		 * @returns {KSubChartConfig_CandleConfig}
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * @override
		 *
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} env 当前环境信息
		 * @param {Number} env.drawingOrderIndex 当前子图在该画布上的绘制顺序索引。第一个被绘制：0
		 *
		 * @returns {KSubChart_IndexMARenderResult} K线子图绘制结果
		 */
		this.implRender = function(canvasObj, env){
			return null;
		};
	};
	KSubChart_IndexMAChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_IndexMAChart", KSubChart_IndexMAChart);
})();