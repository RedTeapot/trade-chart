;(function(){
	var TradeChart2 = window.TradeChart2;
	var KSubChartSketch = TradeChart2.KSubChartSketch;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * @constructor
	 * @augments KSubChartSketch
	 *
	 * “指标：MA图”图形素描
	 */
	var KSubChartSketch_IndexMAChartSketch = function(){
		KSubChartSketch.apply(this, arguments);
	};
	KSubChartSketch_IndexMAChartSketch.prototype = Object.create(KSubChartSketch.prototype);

	/**
	 * 根据给定的配置，生成素描
	 * @param {KSubChartConfig_IndexMAConfig} config 绘制配置
	 * @param {Number} [height] 绘制高度（当配置中指定的高度为百分比字符串时使用）
	 * @returns {KSubChartSketch_IndexMAChartSketch}
	 */
	KSubChartSketch_IndexMAChartSketch.sketchByConfig = function(config, height){
		var chartSketch = new KSubChartSketch_IndexMAChartSketch();

		var config_height = config.getConfigItemValue("height"),
			config_paddingTop = config.getConfigItemValue("paddingTop"),
			config_paddingBottom = config.getConfigItemValue("paddingBottom"),
			config_axisYTickOffset = config.getConfigItemValue("axisYTickOffset");

		var canvasHeight = util.isValidNumber(height)? height: config_height;
		var axisYHeight = canvasHeight - config_paddingTop - config_paddingBottom;
		var contentHeight = axisYHeight - config_axisYTickOffset;
		chartSketch.setCanvasHeight(canvasHeight)
			.setAxisYHeight(Math.max(axisYHeight, 0))
			.setContentHeight(Math.max(contentHeight, 0));

		return chartSketch;
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartSketch_IndexMAChartSketch", KSubChartSketch_IndexMAChartSketch);
})();