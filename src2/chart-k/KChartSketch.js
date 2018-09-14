;(function(){
	var TradeChart2 = window.TradeChart2;
	var KChart = TradeChart2.chart.KChart;
	var Big = TradeChart2.util.Big;

	var numBig = function(big){
		return Number(big.toString());
	};
	var floorBig = function(big){
		return Math.floor(numBig(big));
	};

	/**
	 * @constructor
	 * K线图形素描
	 */
	var KChartSketch = function(){
		/** 图表宽度（横坐标覆盖区域） */
		var width;
		/** 图表正文区域宽度 */
		var contentWidth;
		/** 可呈现的最多的数据组的个数 */
		var maxGroupCount;


		/**
		 * 获取图表宽度（横坐标覆盖区域）
		 * @returns {Number}
		 */
		this.getWidth = function(){
			return width;
		};

		/**
		 * 设置图表宽度（横坐标覆盖区域）
		 * @param {Number} v 图表宽度（横坐标覆盖区域）
		 * @returns {KChartSketch}
		 */
		this.setWidth = function(v){
			width = v;
			return this;
		};

		/**
		 * 获取图表正文区域宽度
		 * @returns {Number}
		 */
		this.getContentWidth = function(){
			return contentWidth;
		};

		/**
		 * 设置图表正文区域宽度
		 * @param {Number} v 图表正文区域宽度
		 * @returns {KChartSketch}
		 */
		this.setContentWidth = function(v){
			contentWidth = v;
			return this;
		};

		/**
		 * 获取可呈现的最多的数据组的个数
		 * @returns {Number}
		 */
		this.getMaxGroupCount = function(){
			return maxGroupCount;
		};

		/**
		 * 设置可呈现的最多的数据组的个数
		 * @param {Number} v 可呈现的最多的数据组的个数
		 * @returns {KChartSketch}
		 */
		this.setMaxGroupCount = function(v){
			maxGroupCount = v;
			return this;
		};
	};

	/**
	 * 根据给定的配置，生成素描
	 * @param {Object} config 绘制配置
	 * @returns {KChartSketch}
	 */
	KChartSketch.sketchByConfig = function(config){
		var chartSketch = new KChartSketch();

		chartSketch.setWidth(Math.floor(config.width - config.paddingLeft - config.paddingRight))
			.setContentWidth(Math.floor(chartSketch.getWidth() - config.axisXTickOffset - config.axisXTickOffsetFromRight))
			.setMaxGroupCount(floorBig(new Big(chartSketch.getContentWidth()).minus(config.groupLineWidth).div(config.groupGap + config.groupBarWidth)) + 1);

		return chartSketch;
	};

	KChart.KChartSketch = KChartSketch;
})();