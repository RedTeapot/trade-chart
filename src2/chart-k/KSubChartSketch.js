;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util,
		Big = TradeChart2.Big;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * @constructor
	 * K线子图形素描
	 */
	var KSubChartSketch = function(){
		/** 画布高度 */
		var canvasHeight;
		/** 纵坐标高度 */
		var axisYHeight;
		/** 图表正文区域高度 */
		var contentHeight;
		/** 纵坐标可呈现的量差与高度差之间的映射比例。用于决定给定的一个量需要占据多少像素 */
		var amountHeightRatio = 1;


		/**
		 * 获取画布高度
		 * @returns {Number}
		 */
		this.getCanvasHeight = function(){
			return canvasHeight;
		};

		/**
		 * 设置画布高度
		 * @param {Number} v 画布高度
		 * @returns {KSubChartSketch}
		 */
		this.setCanvasHeight = function(v){
			canvasHeight = v;
			return this;
		};

		/**
		 * 获取纵坐标高度
		 * @returns {Number}
		 */
		this.getAxisYHeight = function(){
			return axisYHeight;
		};

		/**
		 * 设置纵坐标高度
		 * @param {Number} v 纵坐标高度
		 * @returns {KSubChartSketch}
		 */
		this.setAxisYHeight = function(v){
			axisYHeight = v;
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
		 * @param {Number|Big} v 纵坐标可呈现的量差与高度差之间的映射比例
		 * @returns {KSubChartSketch}
		 */
		this.setAmountHeightRatio = function(v){
			if(null == v || isNaN(v = Number(v)) && !(v instanceof Big)){
				console.error("Specified amount height ratio is not a valid number: " + v);
				return this;
			}

			amountHeightRatio = v instanceof Big? numBig(v): v;
			return this;
		};

		/**
		 * 根据给定的量差计算高度差并返回
		 * @param {Number|Big} amount 量差
		 * @returns {Number}
		 */
		this.calculateHeight = function(amount){
			if(amountHeightRatio === 0)
				return 0;

			return Math.floor((amount instanceof Big? numBig(amount): amount) / amountHeightRatio);
		};

		/**
		 * 使用给定的数据概览更新图形概览
		 * @param {KDataSketch} dataSketch 数据概览
		 * @returns {KSubChartSketch}
		 */
		this.updateByDataSketch = function(dataSketch){
			var ratio = (dataSketch.getAmountCeiling() - dataSketch.getAmountFloor()) / Math.max(this.getContentHeight(), 1);
			this.setAmountHeightRatio(ratio);
			return this;
		};
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartSketch", KSubChartSketch);
})();