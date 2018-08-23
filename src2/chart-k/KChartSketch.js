;(function(){
	var TradeChart2 = window.TradeChart2;
	var KChart = TradeChart2.chart.KChart;
	var Big = TradeChart.util.Big;

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
		/** 图表高度（纵坐标覆盖区域） */
		var height;
		/** 图表正文区域宽度 */
		var contentWidth;
		/** 图表正文区域高度 */
		var contentHeight;
		/** 可呈现的最多的数据组的个数 */
		var maxGroupCount;
		/** 纵坐标可呈现的量差与高度差之间的映射比例。用于决定给定的一个量需要占据多少像素 */
		var amountHeightRatio;


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
		 * 获取图表高度（纵坐标覆盖区域）
		 * @returns {Number}
		 */
		this.getHeight = function(){
			return height;
		};

		/**
		 * 设置图表高度（纵坐标覆盖区域）
		 * @param {Number} v 图表高度（纵坐标覆盖区域）
		 * @returns {KChartSketch}
		 */
		this.setHeight = function(v){
			height = v;
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
		 * 获取图表正文区域高度
		 * @returns {Number}
		 */
		this.getContentHeight = function(){
			return contentHeight;
		};

		/**
		 * 设置图表正文区域高度
		 * @param {Number} v 图表正文区域高度
		 * @returns {KChartSketch}
		 */
		this.setContentHeight = function(v){
			contentHeight = v;
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

		/**
		 * 获取纵坐标可呈现的量差与高度差之间的映射比例
		 * @returns {Number}
		 */
		this.getAmountHeightRatio = function(){
			return amountHeightRatio;
		};

		/**
		 * 设置纵坐标可呈现的量差与高度差之间的映射比例
		 * @param {Number} v 纵坐标可呈现的量差与高度差之间的映射比例
		 * @returns {KChartSketch}
		 */
		this.setAmountHeightRatio = function(v){
			amountHeightRatio = v;
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
			.setHeight(Math.floor(config.height - config.paddingTop - config.paddingBottom))
			.setContentWidth(Math.floor(chartSketch.getWidth() - config.axisXTickOffset - config.axisXTickOffsetFromRight))
			.setContentHeight(Math.floor(chartSketch.getHeight() - config.axisYTickOffset))
			.setMaxGroupCount(floorBig(new Big(chartSketch.getContentWidth()).minus(config.groupLineWidth).div(config.groupGap + config.groupBarWidth)) + 1);

		return chartSketch;
	};

	KChart.KChartSketch = KChartSketch;
})();