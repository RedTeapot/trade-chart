;(function(){
	var TradeChart2 = window.TradeChart2;
	var KDataSketch = TradeChart2.KDataSketch;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * @constructor
	 * @augments KDataSketch
	 *
	 * K线子图：蜡烛图数据概览
	 */
	var KSubChartSketch_CandleDataSketch = function(){
		KDataSketch.apply(this, arguments);
	};
	KSubChartSketch_CandleDataSketch.prototype = Object.create(KDataSketch.prototype);

	/**
	 * 从给定的配置集合中获取指定名称的配置项取值。
	 * 如果给定的配置集合中不存在，则从K线图的全局配置中获取。
	 * 如果全局的配置中也不存在，则返回undefined
	 *
	 * @param {KChart} kChart K线图实例
	 * @param {String} name 配置项名称
	 * @param {KSubChartConfig_candle} config K线子图渲染配置
	 */
	var _getConfigItem = function(kChart, name, config){
		var defaultConfig = TradeChart2.K_SUB_CANDLE_DEFAULT_CONFIG;
		if(null != config && name in config)
			return config[name];
		else if(name in defaultConfig)
			return defaultConfig[name];

		return kChart.getConfigItem(name);
	};

	/**
	 * 扫描给定的K线图实例和K线子图渲染配置，根据K线图实例中的数据生成素描
	 * @param {KChart} kChart K线图实例
	 * @param {KSubChartConfig_candle} kSubChartConfig K线子图渲染配置
	 * @returns {KSubChartSketch_CandleDataSketch}
	 */
	KSubChartSketch_CandleDataSketch.sketch = function(kChart, kSubChartConfig){
		var instance = new KSubChartSketch_CandleDataSketch();

		/* 扫描数据，初步得到概览 */
		var dataList = kChart.getKDataManager().getConvertedRenderingDataList();
		var dataSketch_origin_max = -Infinity,/* 最大价格 */
			dataSketch_origin_min = Infinity,/* 最小价格 */
			dataSketch_origin_avgVariation = 0,/* 价格的平均变动幅度 */
			dataSketch_origin_maxVariation = 0,/* 价格的最大变动幅度 */

			dataSketch_extended_priceCeiling = 0,/* 坐标中价格的最大值 */
			dataSketch_extended_priceFloor = 0,/* 坐标中价格的最小值 */
			dataSketch_extended_pricePrecision = 0;/* 坐标中价格的精度 */

		if(dataList.length === 0){
			dataSketch_origin_max = 0;
			dataSketch_origin_min = 0;
			dataSketch_origin_avgVariation = 0;
			dataSketch_origin_maxVariation = 0;
		}else{
			var previousVolume = 0;
			var variationSum = 0, volumeVariationSum = 0;
			for(var i = 0; i < dataList.length; i++){
				var d = dataList[i];
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

				/* 确定更大的变动幅度 */
				var variation = Math.abs(max - min);
				if(variation > dataSketch_origin_maxVariation)
					dataSketch_origin_maxVariation = variation;
			}
			var len = dataList.length;
			dataSketch_origin_avgVariation = len > 0? (variationSum / len): 0;

			var tmp = dataSketch_origin_avgVariation / 2;

			/* 确定Y轴最小值 */
			dataSketch_extended_priceFloor = util.parseAsNumber(dataSketch_origin_min, 0) - tmp;
			if(!isFinite(dataSketch_extended_priceFloor) || dataSketch_extended_priceFloor < 0)
				dataSketch_extended_priceFloor = 0;

			/* 确定Y轴最大值 */
			dataSketch_extended_priceCeiling = util.parseAsNumber(dataSketch_origin_max, 0) + tmp;
			if(dataSketch_extended_priceCeiling < dataSketch_origin_max)
				dataSketch_extended_priceCeiling = dataSketch_origin_max;
			if(!isFinite(dataSketch_extended_priceCeiling) || dataSketch_extended_priceCeiling < 0)
				dataSketch_extended_priceCeiling = dataSketch_extended_priceFloor;

			/* 确保最大值与最小值不同 */
			var b = new Big(dataSketch_extended_priceFloor);
			if(b.eq(dataSketch_extended_priceCeiling))
				dataSketch_extended_priceCeiling = b.eq(0)? 1: numBig(b.mul(1.3));
		}
		instance.setMinAmount(dataSketch_origin_min)
			.setMaxAmount(dataSketch_origin_max)
			.setAvgAmountVariation(dataSketch_origin_avgVariation)
			.setMaxAmountVariation(dataSketch_origin_maxVariation)
			.setAmountFloor(dataSketch_extended_priceFloor)
			.setAmountCeiling(dataSketch_extended_priceCeiling)
			.setAmountPrecision(dataSketch_extended_pricePrecision);


		/* 根据渲染配置更新概览 */
		/* Y轴最小值 */
		var config_axisYAmountFloor = _getConfigItem(kChart, "axisYAmountFloor", kSubChartConfig);
		var axisYAmountFloor;
		if(null != config_axisYAmountFloor){
			var isFunction = typeof config_axisYAmountFloor === "function";
			if(isFunction)
				axisYAmountFloor = util.try2Call(config_axisYAmountFloor, null,
					instance.getMinAmount(),
					instance.getMaxAmount(),
					instance.getAvgAmountVariation(),
					instance.getMaxAmountVariation()
				);
			else{
				if(!util.isValidNumber(config_axisYAmountFloor))
					console.warn("Invalid configuration value for 'axisYAmountFloor'. Type of 'Number' of 'Function' needed. Auto adjust to 0.");
				axisYAmountFloor = util.parseAsNumber(config_axisYAmountFloor, 0);
			}

			if(!isFinite(axisYAmountFloor) || axisYAmountFloor < 0){
				console.warn((isFunction? "Calculated": "Specified") + " 'axisYAmountFloor': " + axisYAmountFloor + " is infinite or lte 0, auto adjust to 0.");
				axisYAmountFloor = 0;
			}

			instance.setAmountFloor(axisYAmountFloor);
		}
		axisYAmountFloor = instance.getAmountFloor();

		/* Y轴最大值 */
		var config_axisYAmountCeiling = _getConfigItem(kChart, "axisYAmountCeiling", kSubChartConfig);
		var axisYAmountCeiling;
		if(null != config_axisYAmountCeiling){
			var isFunction = typeof config_axisYAmountCeiling === "function";
			if(isFunction)
				axisYAmountCeiling = util.try2Call(config_axisYAmountCeiling, null,
					instance.getMinAmount(),
					instance.getMaxAmount(),
					instance.getAvgAmountVariation(),
					instance.getMaxAmountVariation()
				);
			else{
				if(!util.isValidNumber(config_axisYAmountCeiling))
					console.warn("Invalid configuration value for 'axisYAmountCeiling'. Type of 'Number' of 'Function' needed. Auto adjust to 0.");
				axisYAmountCeiling = util.parseAsNumber(axisYAmountCeiling, 0);
			}

			if(!isFinite(axisYAmountCeiling) || axisYAmountCeiling <= axisYAmountFloor)
				console.warn((isFunction? "Calculated": "Specified") + " 'axisYAmountCeiling': " + axisYAmountCeiling + " is infinite or lte 'axisYAmountFloor'(" + axisYAmountFloor + "), auto adjust to 0.");
			else
				instance.setAmountCeiling(axisYAmountCeiling);
		}

		return instance;
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartSketch_CandleDataSketch", KSubChartSketch_CandleDataSketch);
})();