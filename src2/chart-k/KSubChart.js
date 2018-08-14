;(function(){
	var TradeChart2 = window.TradeChart2;
	var KChart = TradeChart2.chart.KChart;

	/**
	 * @constructor
	 * K线子图
	 * @param {KChart} kChart 附加该子图的K线图
	 * @param {KSubChartTypes} type 子图类型。如：volume - 量图；ma - MA指标图
	 */
	var KSubChart = function(kChart, type){
		/**
		 * 获取该子图的子图类型
		 * @returns {KSubChartTypes}
		 */
		this.getType = function(){
			return type;
		};

		/**
		 * 获取附加该子图的K线图
		 * @returns {KChart}
		 */
		this.getKChart = function(){
			return kChart;
		};

		/**
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} config 渲染配置
		 * @returns {KSubChartRenderResult} 绘制的K线子图
		 */
		this.render = function(canvasObj, config){
			console.warn("Not implemented for k sub chart: " + this.getType());
		};
	};

	KChart.KSubChart = KSubChart;
})();