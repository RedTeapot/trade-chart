;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var commonDefaultConfig = TradeChart2.K_SUB_DEFAULT_CONFIG;

	/**
	 * 默认的，适用于K线图“蜡烛图”子图的配置项
	 * @type {KSubChartConfig_candle}
	 */
	var defaultConfig = util.setDftValue({
		axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移 */
	}, commonDefaultConfig);
	Object.freeze && Object.freeze(defaultConfig);

	/* 暴露默认配置 */
	util.defineReadonlyProperty(TradeChart2, "K_SUB_CANDLE_DEFAULT_CONFIG", defaultConfig);
})();