;(function(){
	var TradeChart2 = window.TradeChart2;
	var CommonChartConfig = TradeChart2.CommonChartConfig;
	var util = TradeChart2.util;

	/**
	 * 默认的，适用于K线图“量图”子图的配置项
	 */
	var defaultConfig = {
	};
	Object.freeze && Object.freeze(defaultConfig);

	/**
	 * 默认的，适用于K线图“量图”子图的配置项
	 * @param {Object} config
	 *
	 * @constructor
	 * @augments CommonChartConfig
	 */
	var KSubChartConfig_VolumeConfig = function(config){
		var dftConfig = util.setDftValue(null, defaultConfig);
		util.setDftValue(dftConfig, TradeChart2["K_SUB_DEFAULT_CONFIG"]);

		config = config || {};
		CommonChartConfig.call(this, config, dftConfig);
	};
	KSubChartConfig_VolumeConfig.prototype = Object.create(CommonChartConfig.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChartConfig_VolumeConfig", KSubChartConfig_VolumeConfig);
	util.defineReadonlyProperty(TradeChart2, "K_SUB_VOLUME_DEFAULT_CONFIG", defaultConfig);
})();