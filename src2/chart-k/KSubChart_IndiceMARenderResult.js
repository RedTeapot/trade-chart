;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var KSubChartRenderResult = TradeChart2.KSubChartRenderResult;

	/**
	 * @constructor
	 * K线子图绘制结果
	 */
	var KSubChart_IndexMARenderResult = function(){
		KSubChartRenderResult.apply(this, arguments);
		var self = this;
	};
	KSubChart_IndexMARenderResult.prototype = Object.create(KSubChartRenderResult.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_IndexMARenderResult", KSubChart_IndexMARenderResult);
})();