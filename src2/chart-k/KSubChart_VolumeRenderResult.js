;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var KSubChartRenderResult = TradeChart2.KSubChartRenderResult;

	/**
	 * @constructor
	 * K线子图绘制结果
	 * @param {KSubChart} kSubChart 关联的，生成绘制结果的K线子图实例
	 * @param {HTMLCanvasElement} canvasObj 绘制的画布所在的DOM元素
	 * @param {KSubChartConfig} config 绘制过程使用的配置
	 */
	var KSubChart_VolumeRenderResult = function(kSubChart, canvasObj, config){
		KSubChartRenderResult.apply(this, arguments);
		var self = this;
	};
	KSubChart_VolumeRenderResult.prototype = Object.create(KSubChartRenderResult.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_VolumeRenderResult", KSubChart_VolumeRenderResult);
})();