;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	/**
	 * @constructor
	 * K线子图绘制结果
	 * @param {KSubChart} kSubChart 关联的，生成绘制结果的K线子图实例
	 * @param {Object} config 绘制过程使用的配置
	 */
	var KSubChartRenderResult = function(kSubChart, config){

		/**
		 * 获取渲染用到的配置数据
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * 获取关联的，生成绘制结果的K线子图实例
		 * @returns {KSubChart}
		 */
		this.getRenderingKSubChart = function(){
			return kSubChart;
		};

		/**
		 * 获取关联的，持有“生成绘制结果的K线子图”的K线图实例
		 * @returns {KChart}
		 */
		this.getRenderingKChart = function(){
			return this.getRenderingKSubChart().getKChart();
		};
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartRenderResult", KSubChartRenderResult);
})();