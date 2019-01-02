;(function(){
	var TradeChart2 = window.TradeChart2;
	var KDataSketch = TradeChart2.KDataSketch;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * @constructor
	 * @augments KDataSketch
	 *
	 * K线子图：“指标：MA图”图数据概览
	 */
	var KSubChartSketch_IndexMADataSketch = function(){
		KDataSketch.apply(this, arguments);
	};
	KSubChartSketch_IndexMADataSketch.prototype = Object.create(KDataSketch.prototype);

	/**
	 * 从给定的配置集合中获取指定名称的配置项取值。
	 * 如果给定的配置集合中不存在，则从K线图的全局配置中获取。
	 * 如果全局的配置中也不存在，则返回undefined
	 *
	 * @param {KChart} kChart K线图实例
	 * @param {String} name 配置项名称
	 * @param {KSubChartConfig_CandleConfig} config K线子图渲染配置
	 */
	var _getConfigItem = function(kChart, name, config){
		if(config.supportsConfigItem(name))
			return config.getConfigItemValue(name);

		return kChart.getConfigItem(name);
	};

	/**
	 * 扫描给定的K线图实例和K线子图渲染配置，根据K线图实例中的数据生成素描
	 * @param {KChart} kChart K线图实例
	 * @param {KSubChartConfig_IndexMAConfig} kSubChartConfig K线子图渲染配置
	 * @returns {KSubChartSketch_IndexMADataSketch}
	 */
	KSubChartSketch_IndexMADataSketch.sketch = function(kChart, kSubChartConfig){
		var instance = new KSubChartSketch_IndexMADataSketch();
		return instance;
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartSketch_IndexMADataSketch", KSubChartSketch_IndexMADataSketch);
})();