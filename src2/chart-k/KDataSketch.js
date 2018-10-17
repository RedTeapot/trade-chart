;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

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
		var avgPriceVariation;
		/** 价格的最大变动幅度 */
		var maxPriceVariation;

		/** 价格的最小值 */
		var priceFloor;
		/** 价格的最大值 */
		var priceCeiling;
		/** 价格的精度 */
		var pricePrecision;


		/** 最小成交量 */
		var minVolume;
		/** 最大成交量 */
		var maxVolume;
		/** 成交量的平均变动幅度 */
		var avgVolumeVariation;
		/** 成交量的最大变动幅度 */
		var maxVolumeVariation;

		/** 成交量的最小值 */
		var volumeFloor;
		/** 成交量的最大值 */
		var volumeCeiling;
		/** 成交量的精度 */
		var volumePrecision;


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
		this.getAvgPriceVariation = function(){
			return avgPriceVariation;
		};

		/**
		 * 设置价格的平均变动幅度
		 * @param {Number} v 价格的平均变动幅度
		 * @returns {KDataSketch}
		 */
		this.setAvgPriceVariation = function(v){
			avgPriceVariation = v;
			return this;
		};

		/**
		 * 获取价格的最大变动幅度
		 * @returns {Number}
		 */
		this.getMaxPriceVariation = function(){
			return maxPriceVariation;
		};

		/**
		 * 设置价格的最大变动幅度
		 * @param {Number} v 价格的最大变动幅度
		 * @returns {KDataSketch}
		 */
		this.setMaxPriceVariation = function(v){
			maxPriceVariation = v;
			return this;
		};

		/**
		 * 获取价格的最小值
		 * @returns {Number}
		 */
		this.getPriceFloor = function(){
			return priceFloor;
		};

		/**
		 * 设置价格的最小值
		 * @param {Number} v 价格的最小值
		 * @returns {KDataSketch}
		 */
		this.setPriceFloor = function(v){
			priceFloor = v;
			return this;
		};

		/**
		 * 获取价格的最大值
		 * @returns {Number}
		 */
		this.getPriceCeiling = function(){
			return priceCeiling;
		};

		/**
		 * 设置价格的最大值
		 * @param {Number} v 价格的最大值
		 * @returns {KDataSketch}
		 */
		this.setPriceCeiling = function(v){
			priceCeiling = v;
			return this;
		};

		/**
		 * 获取价格的精度
		 * @returns {Number}
		 */
		this.getPricePrecision = function(){
			return pricePrecision;
		};

		/**
		 * 设置价格的精度
		 * @param {Number} v 价格的精度
		 * @returns {KDataSketch}
		 */
		this.setPricePrecision = function(v){
			pricePrecision = v;
			return this;
		};

		/**
		 * 获取最小成交量
		 * @returns {Number}
		 */
		this.getMinVolume = function(){
			return minVolume;
		};

		/**
		 * 设置最小成交量
		 * @param {Number} v 最小成交量
		 * @returns {KDataSketch}
		 */
		this.setMinVolume = function(v){
			minVolume = v;
			return this;
		};

		/**
		 * 获取最大成交量
		 * @returns {Number}
		 */
		this.getMaxVolume = function(){
			return maxVolume;
		};

		/**
		 * 设置最大成交量
		 * @param {Number} v 最大成交量
		 * @returns {KDataSketch}
		 */
		this.setMaxVolume = function(v){
			maxVolume = v;
			return this;
		};

		/**
		 * 获取成交量的平均变动幅度
		 * @returns {Number}
		 */
		this.getAvgVolumeVariation = function(){
			return avgVolumeVariation;
		};

		/**
		 * 设置成交量的平均变动幅度
		 * @param {Number} v 成交量的平均变动幅度
		 * @returns {KDataSketch}
		 */
		this.setAvgVolumeVariation = function(v){
			avgVolumeVariation = v;
			return this;
		};

		/**
		 * 获取成交量的最大变动幅度
		 * @returns {Number}
		 */
		this.getMaxVolumeVariation = function(){
			return maxVolumeVariation;
		};

		/**
		 * 设置成交量的最大变动幅度
		 * @param {Number} v 成交量的最大变动幅度
		 * @returns {KDataSketch}
		 */
		this.setMaxVolumeVariation = function(v){
			maxVolumeVariation = v;
			return this;
		};

		/**
		 * 获取成交量的最小值
		 * @returns {Number}
		 */
		this.getVolumeFloor = function(){
			return volumeFloor;
		};

		/**
		 * 设置成交量的最小值
		 * @param {Number} v 成交量的最小值
		 * @returns {KDataSketch}
		 */
		this.setVolumeFloor = function(v){
			volumeFloor = v;
			return this;
		};

		/**
		 * 获取成交量的最大值
		 * @returns {Number}
		 */
		this.getVolumeCeiling = function(){
			return volumeCeiling;
		};

		/**
		 * 设置成交量的最大值
		 * @param {Number} v 成交量的最大值
		 * @returns {KDataSketch}
		 */
		this.setVolumeCeiling = function(v){
			volumeCeiling = v;
			return this;
		};

		/**
		 * 获取成交量的精度
		 * @returns {Number}
		 */
		this.getVolumePrecision = function(){
			return volumePrecision;
		};

		/**
		 * 设置成交量的精度
		 * @param {Number} v 成交量的精度
		 * @returns {KDataSketch}
		 */
		this.setVolumePrecision = function(v){
			volumePrecision = v;
			return this;
		};
	};

	/**
	 * 扫描给定的K线图实例，根据实例中的数据生成素描
	 * @param {KChart} kChart K线图实例
	 * @returns {KDataSketch}
	 */
	KDataSketch.sketchFromKChartInstance = function(kChart){
		var dataList = kChart.getRenderingDataList();
		if(!Array.isArray(dataList))
			throw new Error("Invalid data list to sketch. Type of 'Array' is required.");

		var dataSketch_origin_max = -Infinity,/* 最大价格 */
			dataSketch_origin_min = Infinity,/* 最小价格 */
			dataSketch_origin_avgVariation = 0,/* 价格的平均变动幅度 */
			dataSketch_origin_maxVariation = 0,/* 价格的最大变动幅度 */

			dataSketch_origin_maxVolume = -Infinity,/* 最大交易量 */
			dataSketch_origin_minVolume = Infinity,/* 最小交易量 */
			dataSketch_origin_avgVolumeVariation = 0,/* 交易量的平均变动幅度 */
			dataSketch_origin_maxVolumeVariation = 0,/* 交易量的最大变动幅度 */

			dataSketch_extended_priceCeiling = 0,/* 坐标中价格的最大值 */
			dataSketch_extended_priceFloor = 0,/* 坐标中价格的最小值 */
			dataSketch_extended_pricePrecision = 0,/* 坐标中价格的精度 */

			dataSketch_extended_volumeCeiling = 0,/* 坐标中成交量的最大值 */
			dataSketch_extended_volumeFloor = 0,/* 坐标中成交量的最小值 */
			dataSketch_extended_volumePrecision = 0;/* 坐标中成交量的精度 */

		if(dataList.length === 0){
			dataSketch_origin_max = 0;
			dataSketch_origin_min = 0;
			dataSketch_origin_avgVariation = 0;
			dataSketch_origin_maxVariation = 0;

			dataSketch_origin_maxVolume = 0;
			dataSketch_origin_minVolume = 0;
			dataSketch_origin_avgVolumeVariation = 0;
			dataSketch_origin_maxVolumeVariation = 0;
		}else{
			var previousVolume = 0;
			var variationSum = 0, volumeVariationSum = 0;
			for(var i = 0; i < dataList.length; i++){
				var d = kChart.getConvertedData(i);
				if(null == d || typeof d != "object")
					continue;

				var openPrice = +d.openPrice,
					highPrice = +d.highPrice,
					lowPrice = +d.lowPrice,
					closePrice = +d.closePrice,

					volume = util.parseAsNumber(d.volume, 0);

				/* 数据精度确定 */
				dataSketch_extended_pricePrecision = Math.max(
					dataSketch_extended_pricePrecision,
					util.getPrecision(openPrice),
					util.getPrecision(highPrice),
					util.getPrecision(lowPrice),
					util.getPrecision(closePrice)
				);
				dataSketch_extended_volumePrecision = Math.max(
					dataSketch_extended_volumePrecision,
					util.getPrecision(volume)
				);

				var max = Math.max(openPrice, highPrice, lowPrice, closePrice),
					min = Math.min(openPrice, highPrice, lowPrice, closePrice);
				if(max > dataSketch_origin_max)
					dataSketch_origin_max = max;
				if(min < dataSketch_origin_min)
					dataSketch_origin_min = min;

				if(volume > dataSketch_origin_maxVolume)
					dataSketch_origin_maxVolume = volume;
				if(volume < dataSketch_origin_minVolume)
					dataSketch_origin_minVolume = volume;

				/* 确定更大的变动幅度 */
				var variation = Math.abs(max - min);
				if(variation > dataSketch_origin_maxVariation)
					dataSketch_origin_maxVariation = variation;
				var volumeVariation = Math.abs(volume - previousVolume);
				if(volumeVariation > dataSketch_origin_maxVolumeVariation)
					dataSketch_origin_maxVolumeVariation = volumeVariation;

				variationSum += variation;
				volumeVariationSum += volumeVariation;
			}
			var len = dataList.length;
			dataSketch_origin_avgVariation = len > 0? numBig(new Big(variationSum).div(len)): 0;
			dataSketch_origin_avgVolumeVariation = len > 0? numBig(new Big(volumeVariationSum).div(len)): 0;

			/* 确定Y轴最小值 */
			dataSketch_extended_priceFloor = numBig(new Big(util.parseAsNumber(dataSketch_origin_min, 0)).minus(new Big(dataSketch_origin_avgVariation).div(2)));
			if(!isFinite(dataSketch_extended_priceFloor) || dataSketch_extended_priceFloor < 0)
				dataSketch_extended_priceFloor = 0;

			dataSketch_extended_volumeFloor = numBig(new Big(util.parseAsNumber(dataSketch_origin_minVolume, 0)).minus(new Big(dataSketch_origin_avgVolumeVariation).div(2)));
			if(!isFinite(dataSketch_extended_volumeFloor) || dataSketch_extended_volumeFloor < 0)
				dataSketch_extended_volumeFloor = 0;

			/* 确定Y轴最大值 */
			dataSketch_extended_priceCeiling = numBig(new Big(util.parseAsNumber(dataSketch_origin_max, 0)).plus(new Big(dataSketch_origin_avgVariation).div(2)));
			if(dataSketch_extended_priceCeiling < dataSketch_origin_max)
				dataSketch_extended_priceCeiling = dataSketch_origin_max;
			if(!isFinite(dataSketch_extended_priceCeiling) || dataSketch_extended_priceCeiling < 0)
				dataSketch_extended_priceCeiling = dataSketch_extended_priceFloor;

			dataSketch_extended_volumeCeiling = numBig(new Big(util.parseAsNumber(dataSketch_origin_maxVolume, 0)).plus(new Big(dataSketch_origin_avgVolumeVariation).div(2)));
			if(dataSketch_extended_volumeCeiling < dataSketch_origin_maxVolume)
				dataSketch_extended_volumeCeiling = dataSketch_origin_maxVolume;
			if(!isFinite(dataSketch_extended_volumeCeiling) || dataSketch_extended_volumeCeiling < 0)
				dataSketch_extended_volumeCeiling = dataSketch_extended_volumeFloor;

			/* 确保最大值与最小值不同 */
			var b = new Big(dataSketch_extended_priceFloor);
			if(b.eq(dataSketch_extended_priceCeiling))
				dataSketch_extended_priceCeiling = b.eq(0)? 1: numBig(b.mul(1.3));

			b = new Big(dataSketch_extended_volumeFloor);
			if(b.eq(dataSketch_extended_volumeCeiling))
				dataSketch_extended_volumeCeiling = b.eq(0)? 1: numBig(b.mul(1.3));
		}

		return new KDataSketch()
			.setMinPrice(dataSketch_origin_min)
			.setMaxPrice(dataSketch_origin_max)
			.setAvgPriceVariation(dataSketch_origin_avgVariation)
			.setMaxPriceVariation(dataSketch_origin_maxVariation)
			.setPriceFloor(dataSketch_extended_priceFloor)
			.setPriceCeiling(dataSketch_extended_priceCeiling)
			.setPricePrecision(dataSketch_extended_pricePrecision)

			.setMinVolume(dataSketch_origin_minVolume)
			.setMaxVolume(dataSketch_origin_maxVolume)
			.setAvgVolumeVariation(dataSketch_origin_avgVolumeVariation)
			.setMaxVolumeVariation(dataSketch_origin_maxVolumeVariation)
			.setVolumeFloor(dataSketch_extended_volumeFloor)
			.setVolumeCeiling(dataSketch_extended_volumeCeiling)
			.setVolumePrecision(dataSketch_extended_volumePrecision);
	};

	util.defineReadonlyProperty(TradeChart2, "KDataSketch", KDataSketch);
})();