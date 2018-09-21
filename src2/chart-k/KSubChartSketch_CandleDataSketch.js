;(function(){
	var TradeChart2 = window.TradeChart2;
	var KDataSketch = TradeChart2.KDataSketch;
	var util = TradeChart2.util;
	var Big = util.Big;

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
		if(name in config)
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
		var kDataSketch = KDataSketch.sketchFromKChartInstance(kChart);

		/* 根据渲染配置更新概览 */
		/* Y轴最小值 */
		var config_axisYAmountFloor = _getConfigItem(kChart, "axisYAmountFloor", kSubChartConfig);
		var axisYAmountFloor;
		if(null != config_axisYAmountFloor){
			var isFunction = typeof config_axisYAmountFloor === "function";
			if(isFunction)
				axisYAmountFloor = util.try2Call(config_axisYAmountFloor, null,
					kDataSketch.getMinPrice(),
					kDataSketch.getMaxPrice(),
					kDataSketch.getAvgPriceVariation(),
					kDataSketch.getMaxPriceVariation()
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

			kDataSketch.setPriceFloor(axisYAmountFloor);
		}
		axisYAmountFloor = kDataSketch.getPriceFloor();

		/* Y轴最大值 */
		var config_axisYAmountCeiling = _getConfigItem(kChart, "axisYAmountCeiling", kSubChartConfig);
		var axisYAmountCeiling;
		if(null != config_axisYAmountCeiling){
			var isFunction = typeof config_axisYAmountCeiling === "function";
			if(isFunction)
				axisYAmountCeiling = util.try2Call(config_axisYAmountCeiling, null,
					kDataSketch.getMinPrice(),
					kDataSketch.getMaxPrice(),
					kDataSketch.getAvgPriceVariation(),
					kDataSketch.getMaxPriceVariation()
				);
			else{
				if(!util.isValidNumber(config_axisYAmountCeiling))
					console.warn("Invalid configuration value for 'axisYAmountCeiling'. Type of 'Number' of 'Function' needed. Auto adjust to 0.");
				axisYAmountCeiling = util.parseAsNumber(axisYAmountCeiling, 0);
			}

			if(!isFinite(axisYAmountCeiling) || axisYAmountCeiling <= axisYAmountFloor)
				console.warn((isFunction? "Calculated": "Specified") + " 'axisYAmountCeiling': " + axisYAmountCeiling + " is infinite or lte 'axisYAmountFloor'(" + axisYAmountFloor + "), auto adjust to 0.");
			else
				kDataSketch.setPriceCeiling(axisYAmountCeiling);
		}

		/* 代理属性 */
		for(var p in kDataSketch){
			if(typeof kDataSketch[p] === "function")
				instance[p] = (function(p){
					return function(){
						return kDataSketch[p].apply(kDataSketch, arguments);
					};
				})(p);
			else
				instance[p] = kDataSketch[p];
		}

		return instance;
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartSketch_CandleDataSketch", KSubChartSketch_CandleDataSketch);
})();