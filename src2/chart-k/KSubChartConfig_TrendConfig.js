;(function(){
	var TradeChart2 = window.TradeChart2;
	var CommonChartConfig = TradeChart2.CommonChartConfig;
	var util = TradeChart2.util;

	/**
	 * 默认的，适用于K线图“走势图”子图的配置项
	 */
	var defaultConfig = {
		axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移，取值为正则向上偏移 */

		lineWidth: 0.5,/* 走势线的线条宽度 */
		lineColor: "#999999",/* 走势线的线条颜色 */
		enclosedAreaBackground: null,/* 折线与X轴围绕而成的封闭区域的背景色 */

		ifShowAverageLine: true,/* 是否绘制均线 */
		ifShowAverageLine_lineColor: "#e06600",/* 绘制均线时所采用的线条颜色 */
	};
	Object.freeze && Object.freeze(defaultConfig);

	/**
	 * 默认的，适用于K线图“走势图”子图的配置项
	 * @param {Object} config
	 *
	 * @constructor
	 * @augments CommonChartConfig
	 */
	var KSubChartConfig_TrendConfig = function(config){
		var dftConfig = util.setDftValue(null, defaultConfig);
		util.setDftValue(dftConfig, TradeChart2["K_SUB_DEFAULT_CONFIG"]);

		config = config || {};
		CommonChartConfig.call(this, config, dftConfig);
	};
	KSubChartConfig_TrendConfig.prototype = Object.create(CommonChartConfig.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChartConfig_TrendConfig", KSubChartConfig_TrendConfig);
	util.defineReadonlyProperty(TradeChart2, "K_SUB_TREND_DEFAULT_CONFIG", defaultConfig);
})();