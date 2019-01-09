;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	/**
	 * 支持的K线子图类型
	 * @readonly
	 * @enum {String}
	 */
	var SubChartTypes = {
		/** 蜡烛图 */
		K_CANDLE: "k_candle",

		/** 量图 */
		K_VOLUME: "k_volume",

		/** 指标：MA */
		K_INDEX_MA: "k_index_ma",
	};

	util.defineReadonlyProperty(TradeChart2, "SubChartTypes", SubChartTypes);
})();