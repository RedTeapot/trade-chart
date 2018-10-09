;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var commonDefaultConfig = TradeChart2.K_SUB_DEFAULT_CONFIG;

	/**
	 * 默认的，适用于K线图“量图”子图的配置项
	 * @type {KSubChartConfig_volume}
	 */
	var defaultConfig = util.setDftValue({
	}, commonDefaultConfig);
	Object.freeze && Object.freeze(defaultConfig);

	/* 暴露默认配置 */
	util.defineReadonlyProperty(TradeChart2, "K_SUB_VOLUME_DEFAULT_CONFIG", defaultConfig);
})();