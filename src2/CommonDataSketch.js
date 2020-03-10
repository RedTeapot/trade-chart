;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	/**
	 * @constructor
	 * 数据素描
	 */
	var CommonDataSketch = function(){
		/** 最小Y轴量 */
		var minAmount;
		/** 最大Y轴量 */
		var maxAmount;
		/** Y轴量的平均变动幅度 */
		var avgAmountVariation;
		/** Y轴量的最大变动幅度 */
		var maxAmountVariation;

		/** Y轴量的最小值 */
		var amountFloor;
		/** Y轴量的最大值 */
		var amountCeiling;
		/** Y轴量的精度 */
		var amountPrecision;


		/**
		 * 获取素描得出的最小Y轴量
		 * @returns {Number}
		 */
		this.getMinAmount = function(){
			return minAmount;
		};
		/**
		 * 设置素描得出的最小Y轴量
		 * @param {Number} amount 素描得出的最小Y轴量
		 * @returns {CommonDataSketch}
		 */
		this.setMinAmount = function(amount){
			minAmount = amount;
			return this;
		};

		/**
		 * 获取素描得出的最大Y轴量
		 * @returns {Number} 素描得出的最大Y轴量
		 */
		this.getMaxAmount = function(){
			return maxAmount;
		};
		/**
		 * 设置素描得出的最大Y轴量
		 * @param {Number} v 素描得出的最大Y轴量
		 * @returns {CommonDataSketch}
		 */
		this.setMaxAmount = function(v){
			maxAmount = v;
			return this;
		};

		/**
		 * 获取Y轴量的平均变动幅度
		 * @returns {Number}
		 */
		this.getAvgAmountVariation = function(){
			return avgAmountVariation;
		};
		/**
		 * 设置Y轴量的平均变动幅度
		 * @param {Number} v Y轴量的平均变动幅度
		 * @returns {CommonDataSketch}
		 */
		this.setAvgAmountVariation = function(v){
			avgAmountVariation = v;
			return this;
		};

		/**
		 * 获取Y轴量的最大变动幅度
		 * @returns {Number}
		 */
		this.getMaxAmountVariation = function(){
			return maxAmountVariation;
		};
		/**
		 * 设置Y轴量的最大变动幅度
		 * @param {Number} v Y轴量的最大变动幅度
		 * @returns {CommonDataSketch}
		 */
		this.setMaxAmountVariation = function(v){
			maxAmountVariation = v;
			return this;
		};

		/**
		 * 获取Y轴量的最小值
		 * @returns {Number}
		 */
		this.getAmountFloor = function(){
			return amountFloor;
		};
		/**
		 * 设置Y轴量的最小值
		 * @param {Number} v Y轴量的最小值
		 * @returns {CommonDataSketch}
		 */
		this.setAmountFloor = function(v){
			amountFloor = v;
			return this;
		};

		/**
		 * 获取Y轴量的最大值
		 * @returns {Number}
		 */
		this.getAmountCeiling = function(){
			return amountCeiling;
		};
		/**
		 * 设置Y轴量的最大值
		 * @param {Number} v Y轴量的最大值
		 * @returns {CommonDataSketch}
		 */
		this.setAmountCeiling = function(v){
			amountCeiling = v;
			return this;
		};

		/**
		 * 获取Y轴量的精度
		 * @returns {Number}
		 */
		this.getAmountPrecision = function(){
			return amountPrecision;
		};
		/**
		 * 设置Y轴量的精度
		 * @param {Number} v Y轴量的精度
		 * @returns {CommonDataSketch}
		 */
		this.setAmountPrecision = function(v){
			amountPrecision = v;
			return this;
		};
	};

	util.defineReadonlyProperty(TradeChart2, "CommonDataSketch", CommonDataSketch);
})();