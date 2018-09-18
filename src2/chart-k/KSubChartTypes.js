;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	/**
	 * 支持的K线子图类型
	 * @readonly
	 * @enum {String}
	 */
	var KSubChartTypes = {
		/** 蜡烛图 */
		CANDLE: "candle",

		/** 量图 */
		VOLUME: "volume",
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartTypes", KSubChartTypes);
})();