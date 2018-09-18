;(function(){
	var TradeChart2 = window.TradeChart2;
	var KSubChartTypes = TradeChart2.KSubChartTypes,
		KSubChart = TradeChart2.KSubChart,
		KSubChartRenderResult = TradeChart2.KSubChartRenderResult;
	var util = TradeChart2.util;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * @constructor
	 * @augments KSubChart
	 *
	 * K线图子图：蜡烛图
	 * @param {KChart} kChart 附加该子图的K线图
	 */
	var KSubChart_VolumeChart = function(kChart){
		KSubChart.call(this, kChart, KSubChartTypes.VOLUME);

		/**
		 * 从给定的配置集合中获取指定名称的配置项取值。
		 * 如果给定的配置集合中不存在，则从K线图的全局配置中获取。
		 * 如果全局的配置中也不存在，则返回undefined
		 *
		 * @param {String} name 配置项名称
		 * @param {Object} config 配置项集合
		 */
		var getConfigItem = function(name, config){
			if(name in config)
				return config[name];

			return kChart.getConfigItem(name);
		};

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
			return new KSubChartRenderResult(this, config);
		};
	};
	KSubChart_VolumeChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_VolumeChart", KSubChart_VolumeChart);
})();