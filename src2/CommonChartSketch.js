;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	/**
	 * @constructor
	 * 图形素描
	 */
	var CommonChartSketch = function(){
		/** 画布宽度 */
		var canvasWidth;
		/** 图表横坐标宽度 */
		var axisXWidth;
		/** 图表正文区域宽度 */
		var contentWidth;
		/** 可呈现的最多的数据组的个数 */
		var maxGroupCount;

		/**
		 * 获取画布宽度
		 * @returns {Number}
		 */
		this.getCanvasWidth = function(){
			return canvasWidth;
		};

		/**
		 * 设置画布宽度
		 * @param {Number} v 画布宽度
		 * @returns {CommonChartSketch}
		 */
		this.setCanvasWidth = function(v){
			canvasWidth = v;
			return this;
		};

		/**
		 * 获取图表横坐标宽度
		 * @returns {Number}
		 */
		this.getAxisXWidth = function(){
			return axisXWidth;
		};

		/**
		 * 设置图表横坐标宽度
		 * @param {Number} v 图表横坐标宽度
		 * @returns {CommonChartSketch}
		 */
		this.setAxisXWidth = function(v){
			axisXWidth = v;
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
		 * @returns {CommonChartSketch}
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
		 * @returns {CommonChartSketch}
		 */
		this.setMaxGroupCount = function(v){
			maxGroupCount = v;
			return this;
		};
	};

	util.defineReadonlyProperty(TradeChart2, "CommonChartSketch", CommonChartSketch);
})();