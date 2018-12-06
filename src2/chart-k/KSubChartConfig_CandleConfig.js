;(function(){
	var TradeChart2 = window.TradeChart2;
	var CommonChartConfig = TradeChart2.CommonChartConfig;
	var util = TradeChart2.util;

	/**
	 * 默认的，适用于K线图“蜡烛图”子图的配置项
	 */
	var defaultConfig = {
		axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移，取值为正则向上偏移 */
	};
	Object.freeze && Object.freeze(defaultConfig);

	/**
	 * 默认的，适用于K线图“蜡烛图”子图的配置项
	 * @param {Object} config
	 *
	 * @constructor
	 * @augments CommonChartConfig
	 */
	var KSubChartConfig_CandleConfig = function(config){
		var dftConfig = util.setDftValue(null, defaultConfig);
		util.setDftValue(dftConfig, TradeChart2["K_SUB_DEFAULT_CONFIG"]);

		config = config || {};
		CommonChartConfig.call(this, config, dftConfig);
	};
	KSubChartConfig_CandleConfig.prototype = Object.create(CommonChartConfig.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChartConfig_CandleConfig", KSubChartConfig_CandleConfig);
	util.defineReadonlyProperty(TradeChart2, "K_SUB_CANDLE_DEFAULT_CONFIG", defaultConfig);
})();