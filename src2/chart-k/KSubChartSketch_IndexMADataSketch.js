;(function(){
	var TradeChart2 = window.TradeChart2;
	var CommonDataSketch = TradeChart2.CommonDataSketch,
		util = TradeChart2.util,
		Big = TradeChart2.Big,
		CommonDataManager = TradeChart2.CommonDataManager;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * @constructor
	 * @augments CommonDataSketch
	 *
	 * K线子图：“指标：MA图”图数据概览
	 */
	var KSubChartSketch_IndexMADataSketch = function(){
		CommonDataSketch.apply(this, arguments);
	};
	KSubChartSketch_IndexMADataSketch.prototype = Object.create(CommonDataSketch.prototype);

	/**
	 * 从给定的配置集合中获取指定名称的配置项取值。
	 * 如果给定的配置集合中不存在，则从K线图的全局配置中获取。
	 * 如果全局的配置中也不存在，则返回undefined
	 *
	 * @param {KChart} kChart K线图实例
	 * @param {String} name 配置项名称
	 * @param {KSubChartConfig_CandleConfig} config K线子图渲染配置
	 */
	var _getConfigItem = function(kChart, name, config){
		if(config.supportsConfigItem(name))
			return config.getConfigItemValue(name);

		return kChart.getConfigItemValue(name);
	};

	/**
	 * 扫描给定的K线图实例和K线子图渲染配置，根据K线图实例中的数据生成素描
	 * @param {KChart} kChart K线图实例
	 * @param {KSubChartConfig_IndexMAConfig} kSubChartConfig K线子图渲染配置
	 * @returns {KSubChartSketch_IndexMADataSketch}
	 */
	KSubChartSketch_IndexMADataSketch.sketch = function(kChart, kSubChartConfig){
		var instance = new KSubChartSketch_IndexMADataSketch();

		/* 扫描数据，初步得到概览 */
		var kDataManager = kChart.getDataManager();
		var dataList = kDataManager.getRenderingDataList();
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
			/* 确定MA指标 */
			var maArray = _getConfigItem(kChart, "maIndexList", kSubChartConfig) || [];
			maArray = maArray.map(function(d){
				return util.parseAsNumber(d.replace(/[^\d]/gm, ""), 0);
			}).reduce(function(rst, d){
				if(isFinite(d) && d > 0 && rst.indexOf(d) === -1)
					rst.push(d);

				return rst;
			}, []).sort(function(a, b){
				return a > b? 1: -1;
			});

			/* 缓存需要被反复使用的收盘价，降低计算量 */
			for(var i = 0; i < dataList.length; i++){
				var d = dataList[i];
				if(null == d || typeof d !== "object")
					continue;

				var closePrice = +kDataManager.getConvertedData(d).closePrice;
				CommonDataManager.attachData(d, "closePrice", closePrice);
			}

			/* 附加MA数据，供绘制时使用 */
			if(maArray.length > 0){
				var minMA = maArray[0];

				for(var i = minMA - 1; i < dataList.length; i++){/* 为每个数据计算MA指标 */
					var d = dataList[i];

					for(var j = 0; j < maArray.length; j++){/* 计算每一个MA指标 */
						var ma = maArray[j];
						if(i < ma - 1)/* 检查数据跨度是否足够计算当前MA指标 */
							break;/* ma按指标升序排序，如果当前索引所涵盖的数据个数不足以满足当下MA指标，则必然无法满足需要更大数据覆盖面的指标 */

						var sum = 0;
						for(var k = 0; k < ma; k++){
							sum += CommonDataManager.getAttachedData(dataList[i - k], "closePrice") || 0;
						}
						CommonDataManager.attachData(d, "MA" + ma, sum / ma);
					}
				}
			}

			var previousClosePrice = null;
			var variationSum = 0;
			for(var i = 0; i < dataList.length; i++){
				var d = dataList[i];
				var closePrice = +kDataManager.getConvertedData(d).closePrice;

				/* 数据精度确定 */
				dataSketch_extended_pricePrecision = Math.max(
					dataSketch_extended_pricePrecision,
					util.getPrecision(closePrice)
				);

				if(closePrice > dataSketch_origin_max)
					dataSketch_origin_max = closePrice;
				if(closePrice < dataSketch_origin_min)
					dataSketch_origin_min = closePrice;

				/* 确定更大的变动幅度 */
				if(null !== previousClosePrice){
                    var variation = Math.abs(closePrice - previousClosePrice);
                    if(variation > dataSketch_origin_maxVariation)
                        dataSketch_origin_maxVariation = variation;
                    variationSum += variation;
                }

                previousClosePrice = closePrice;
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
			if(Math.abs(dataSketch_extended_priceCeiling - dataSketch_extended_priceFloor) < 1e-8)
				dataSketch_extended_priceCeiling = dataSketch_extended_priceFloor < 1e-8? 1: dataSketch_extended_priceFloor * 1.3;
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
				console.warn((isFunction? "Calculated": "Specified") + " 'axisYAmountCeiling': " + axisYAmountCeiling + " is infinite or lte 'axisYAmountFloor'(" + axisYAmountFloor + ")");
			else
				instance.setAmountCeiling(axisYAmountCeiling);
		}

		return instance;
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartSketch_IndexMADataSketch", KSubChartSketch_IndexMADataSketch);
})();