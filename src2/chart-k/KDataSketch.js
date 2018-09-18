;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = util.Big;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * @constructor
	 * K线数据素描
	 */
	var KDataSketch = function(){
		/** 最小价格 */
		var minPrice;
		/** 最大价格 */
		var maxPrice;
		/** 价格的平均变动幅度 */
		var avgVariation;
		/** 价格的最大变动幅度 */
		var maxVariation;

		/** 纵坐标轴价格的最小值 */
		var priceFloor;
		/** 纵坐标轴价格的最大值 */
		var priceCeiling;
		/** 纵坐标轴价格的精度 */
		var pricePrecision;

		/**
		 * 获取素描得出的最小价格
		 * @returns {Number}
		 */
		this.getMinPrice = function(){
			return minPrice;
		};

		/**
		 * 设置素描得出的最小价格
		 * @param {Number} price 素描得出的最小价格
		 * @returns {KDataSketch}
		 */
		this.setMinPrice = function(price){
			minPrice = price;
			return this;
		};

		/**
		 * 获取素描得出的最大价格
		 * @returns {Number} 素描得出的最大价格
		 */
		this.getMaxPrice = function(){
			return maxPrice;
		};

		/**
		 * 设置素描得出的最大价格
		 * @param {Number} v 素描得出的最大价格
		 * @returns {KDataSketch}
		 */
		this.setMaxPrice = function(v){
			maxPrice = v;
			return this;
		};

		/**
		 * 获取价格的平均变动幅度
		 * @returns {Number}
		 */
		this.getAvgVariation = function(){
			return avgVariation;
		};

		/**
		 * 设置价格的平均变动幅度
		 * @param {Number} v 价格的平均变动幅度
		 * @returns {KDataSketch}
		 */
		this.setAvgVariation = function(v){
			avgVariation = v;
			return this;
		};

		/**
		 * 获取价格的最大变动幅度
		 * @returns {Number}
		 */
		this.getMaxVariation = function(){
			return maxVariation;
		};

		/**
		 * 设置价格的最大变动幅度
		 * @param {Number} v 价格的最大变动幅度
		 * @returns {KDataSketch}
		 */
		this.setMaxVariation = function(v){
			maxVariation = v;
			return this;
		};

		/**
		 * 获取纵坐标轴价格的最小值
		 * @returns {Number}
		 */
		this.getPriceFloor = function(){
			return priceFloor;
		};

		/**
		 * 设置纵坐标轴价格的最小值
		 * @param {Number} v 纵坐标轴价格的最小值
		 * @returns {KDataSketch}
		 */
		this.setPriceFloor = function(v){
			priceFloor = v;
			return this;
		};

		/**
		 * 获取纵坐标轴价格的最大值
		 * @returns {Number}
		 */
		this.getPriceCeiling = function(){
			return priceCeiling;
		};

		/**
		 * 设置纵坐标轴价格的最大值
		 * @param {Number} v 纵坐标轴价格的最大值
		 * @returns {KDataSketch}
		 */
		this.setPriceCeiling = function(v){
			priceCeiling = v;
			return this;
		};

		/**
		 * 获取纵坐标轴价格的精度
		 * @returns {Number}
		 */
		this.getPricePrecision = function(){
			return pricePrecision;
		};

		/**
		 * 设置纵坐标轴价格的精度
		 * @param {Number} v 纵坐标轴价格的精度
		 * @returns {KDataSketch}
		 */
		this.setPricePrecision = function(v){
			pricePrecision = v;
			return this;
		};
	};

	/**
	 * 扫描给定的数据，生成素描
	 * @param {Array<KData|Object>} dataList 要扫描的数据列表。可以是本插件约定格式的数据，也可以是任意其它格式的数据。如果是其它格式的数据，则需要同步提供数据解析器，以指导本插件解析数据
	 * @param {KDataParser} [dataParser] 当要扫描的数据是其它格式的数据时，用于指导本插件解析数据的解析器
	 * @returns {KDataSketch}
	 */
	KDataSketch.sketchData = function(dataList, dataParser){
		if(!Array.isArray(dataList))
			throw new Error("Invalid data list to sketch. Type of 'Array' is required.");
		if(arguments.length > 1 && typeof dataParser != "function")
			throw new Error("Invalid data parser to sketch data. Type of 'Function' is required.");

		var dataSketch_origin_max = -Infinity,/* 最大价格 */
			dataSketch_origin_min = Infinity,/* 最小价格 */
			dataSketch_origin_avgVariation = 0,/* 价格的平均变动幅度 */
			dataSketch_origin_maxVariation = 0,/* 价格的最大变动幅度 */

			dataSketch_extended_priceCeiling = 0,/* 坐标中价格的最大值 */
			dataSketch_extended_priceFloor = 0,/* 坐标中价格的最小值 */
			dataSketch_extended_pricePrecision = 0;/* 坐标中价格的精度 */

		if(dataList.length == 0){
			dataSketch_origin_max = undefined;
			dataSketch_origin_min = undefined;
			dataSketch_origin_avgVariation = undefined;
			dataSketch_origin_maxVariation = undefined;
		}else{
			var variationSum = 0;
			for(var i = 0; i < dataList.length; i++){
				var d = dataList[i];
				if(typeof dataParser == "function")
					d = dataParser(d, i, dataList);
				if(null == d || typeof d != "object")
					continue;

				var openPrice = +d.openPrice,
					highPrice = +d.highPrice,
					lowPrice = +d.lowPrice,
					closePrice = +d.closePrice;

				/* 数据精度确定 */
				dataSketch_extended_pricePrecision = Math.max(
					dataSketch_extended_pricePrecision,
					util.getPrecision(openPrice),
					util.getPrecision(highPrice),
					util.getPrecision(lowPrice),
					util.getPrecision(closePrice)
				);

				var max = Math.max(openPrice, highPrice, lowPrice, closePrice),
					min = Math.min(openPrice, highPrice, lowPrice, closePrice);
				if(max > dataSketch_origin_max)
					dataSketch_origin_max = max;
				if(min < dataSketch_origin_min)
					dataSketch_origin_min = min;

				/* 确定更大的价格变动幅度 */
				var variation = Math.abs(max - min);
				if(variation > dataSketch_origin_maxVariation)
					dataSketch_origin_maxVariation = variation;

				variationSum += variation;
			}
			var len = dataList.length;
			dataSketch_origin_avgVariation = len > 0? numBig(new Big(variationSum).div(len)): 0;

			/* 确定Y轴最小值 */
			dataSketch_extended_priceFloor = dataSketch_origin_min - numBig(new Big(dataSketch_origin_avgVariation).div(2));
			if(!isFinite(dataSketch_extended_priceFloor) || dataSketch_extended_priceFloor < 0)
				dataSketch_extended_priceFloor = 0;

			/* 确定Y轴最大值 */
			dataSketch_extended_priceCeiling = dataSketch_origin_max + numBig(new Big(dataSketch_origin_avgVariation).div(2));
			if(dataSketch_extended_priceCeiling < dataSketch_origin_max)
				dataSketch_extended_priceCeiling = dataSketch_origin_max;
			if(!isFinite(dataSketch_extended_priceCeiling) || dataSketch_extended_priceCeiling < 0)
				dataSketch_extended_priceCeiling = dataSketch_extended_priceFloor;

			/* 确保最大值与最小值不同 */
			var b = new Big(dataSketch_extended_priceFloor);
			if(b.eq(dataSketch_extended_priceCeiling))
				dataSketch_extended_priceCeiling = b.eq(0)? 1: numBig(b.mul(1.3));
		}

		return new KDataSketch()
			.setMinPrice(dataSketch_origin_min)
			.setMaxPrice(dataSketch_origin_max)
			.setAvgVariation(dataSketch_origin_avgVariation)
			.setMaxVariation(dataSketch_origin_maxVariation)
			.setPriceFloor(dataSketch_extended_priceFloor)
			.setPriceCeiling(dataSketch_extended_priceCeiling)
			.setPricePrecision(dataSketch_extended_pricePrecision);
	};

	util.defineReadonlyProperty(TradeChart2, "KDataSketch", KDataSketch);
})();