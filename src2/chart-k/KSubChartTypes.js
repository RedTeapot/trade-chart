;(function(){
	var TradeChart2 = window.TradeChart2;
	var KChart = TradeChart2.chart.KChart;

	/**
	 * 支持的K线子图类型
	 * @readonly
	 * @enum {String}
	 */
	KChart.KSubChartTypes = {
		/** 蜡烛图 */
		CANDLE: "candle",

		/** 量图 */
		VOLUME: "volume",
	};
})();