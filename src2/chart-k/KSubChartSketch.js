;(function(){
	var TradeChart2 = window.TradeChart2;
	var KChart = TradeChart2.chart.KChart;
	var util = TradeChart2.util;
	var Big = util.Big;

	var numBig = function(big){
		return Number(big.toString());
	};
	var floorBig = function(big){
		return Math.floor(numBig(big));
	};

	/**
	 * @constructor
	 * K线子图形素描
	 */
	var KSubChartSketch = function(){
		/** 图表高度（纵坐标覆盖区域） */
		var height;
		/** 图表正文区域高度 */
		var contentHeight;
		/** 纵坐标可呈现的量差与高度差之间的映射比例。用于决定给定的一个量需要占据多少像素 */
		var amountHeightRatio;

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
		 * @returns {KSubChartSketch}
		 */
		this.setHeight = function(v){
			height = v;
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
		 * @returns {KSubChartSketch}
		 */
		this.setContentHeight = function(v){
			contentHeight = v;
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
		 * @returns {KSubChartSketch}
		 */
		this.setAmountHeightRatio = function(v){
			if(null == v || isNaN(v = Number(v))){
				console.error("Specified amount height ratio is not a valid number. " + v);
				return this;
			}

			amountHeightRatio = v;
			return this;
		};

		/**
		 * 根据给定的量差计算高度差并返回
		 * @param {Number} amount 量差
		 * @returns {Number}
		 */
		this.calculateHeight = function(amount){
			amount = Math.abs(util.parseAsNumber(amount, 0));
			if(util.parseAsNumber(amountHeightRatio, 0) == 0)
				return 0;

			return numBig(new Big(amount).div(amountHeightRatio));
		};
	};

	/**
	 * 根据给定的配置，生成素描
	 * @param {KSubChartConfig} config 绘制配置
	 * @param {Number} [height] 绘制高度（当配置中指定的高度为百分比字符串时使用）
	 * @returns {KSubChartSketch}
	 */
	KSubChartSketch.sketchByConfig = function(config, height){
		var chartSketch = new KSubChartSketch();

		var heightBig = new Big(height || config.height).minus(config.paddingTop).minus(config.paddingBottom);
		var contentHeightBig = heightBig.minus(config.axisYTickOffset);
		chartSketch.setHeight(floorBig(heightBig))
			.setContentHeight(floorBig(contentHeightBig));

		return chartSketch;
	};

	KChart.KSubChartSketch = KSubChartSketch;
})();