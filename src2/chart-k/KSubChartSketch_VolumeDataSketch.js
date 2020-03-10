;(function(){
	var TradeChart2 = window.TradeChart2;
	var CommonDataSketch = TradeChart2.CommonDataSketch;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * @constructor
	 * @augments CommonDataSketch
	 *
	 * K线子图：蜡烛图数据概览
	 */
	var KSubChartSketch_VolumeDataSketch = function(){
		CommonDataSketch.apply(this, arguments);
	};
	KSubChartSketch_VolumeDataSketch.prototype = Object.create(CommonDataSketch.prototype);

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
	 * @param {KSubChartConfig_VolumeConfig} kSubChartConfig K线子图渲染配置
	 * @returns {KSubChartSketch_VolumeDataSketch}
	 */
	KSubChartSketch_VolumeDataSketch.sketch = function(kChart, kSubChartConfig){
		var instance = new KSubChartSketch_VolumeDataSketch();

		/* 扫描数据，初步得到概览 */
		var dataList = kChart.getDataManager().getConvertedRenderingDataList();
		var dataSketch_origin_maxVolume = -Infinity,/* 最大交易量 */
			dataSketch_origin_minVolume = Infinity,/* 最小交易量 */
			dataSketch_origin_avgVolumeVariation = 0,/* 交易量的平均变动幅度 */
			dataSketch_origin_maxVolumeVariation = 0,/* 交易量的最大变动幅度 */

			dataSketch_extended_volumeCeiling = 0,/* 坐标中成交量的最大值 */
			dataSketch_extended_volumeFloor = 0,/* 坐标中成交量的最小值 */
			dataSketch_extended_volumePrecision = 0;/* 坐标中成交量的精度 */

		if(dataList.length === 0){
			dataSketch_origin_maxVolume = 0;
			dataSketch_origin_minVolume = 0;
			dataSketch_origin_avgVolumeVariation = 0;
			dataSketch_origin_maxVolumeVariation = 0;
		}else{
			var previousVolume = 0;
			var variationSum = 0, volumeVariationSum = 0;
			for(var i = 0; i < dataList.length; i++){
				var d = dataList[i];
				if(null == d || typeof d !== "object")
					continue;

				var volume = util.parseAsNumber(d.volume, 0);

				/* 数据精度确定 */
				dataSketch_extended_volumePrecision = Math.max(
					dataSketch_extended_volumePrecision,
					util.getPrecision(volume)
				);

				if(volume > dataSketch_origin_maxVolume)
					dataSketch_origin_maxVolume = volume;
				if(volume < dataSketch_origin_minVolume)
					dataSketch_origin_minVolume = volume;

				/* 确定更大的变动幅度 */
				var volumeVariation = Math.abs(volume - previousVolume);
				if(volumeVariation > dataSketch_origin_maxVolumeVariation)
					dataSketch_origin_maxVolumeVariation = volumeVariation;

				volumeVariationSum += volumeVariation;
			}
			var len = dataList.length;
			dataSketch_origin_avgVolumeVariation = len > 0? volumeVariationSum / len: 0;

			var tmp = dataSketch_origin_avgVolumeVariation / 2;

			/* 确定Y轴最小值 */
			dataSketch_extended_volumeFloor = util.parseAsNumber(dataSketch_origin_minVolume, 0) - tmp;
			if(!isFinite(dataSketch_extended_volumeFloor) || dataSketch_extended_volumeFloor < 0)
				dataSketch_extended_volumeFloor = 0;

			/* 确定Y轴最大值 */
			dataSketch_extended_volumeCeiling = util.parseAsNumber(dataSketch_origin_maxVolume, 0) + tmp;
			if(dataSketch_extended_volumeCeiling < dataSketch_origin_maxVolume)
				dataSketch_extended_volumeCeiling = dataSketch_origin_maxVolume;
			if(!isFinite(dataSketch_extended_volumeCeiling) || dataSketch_extended_volumeCeiling < 0)
				dataSketch_extended_volumeCeiling = dataSketch_extended_volumeFloor;

			/* 确保最大值与最小值不同 */
			if(Math.abs(dataSketch_extended_volumeCeiling - dataSketch_extended_volumeFloor) < 1e-8)
				dataSketch_extended_volumeCeiling = dataSketch_extended_volumeFloor < 1e-8? 1: dataSketch_extended_volumeFloor * 1.3;
		}
		instance.setMinAmount(dataSketch_origin_minVolume)
			.setMaxAmount(dataSketch_origin_maxVolume)
			.setAvgAmountVariation(dataSketch_origin_avgVolumeVariation)
			.setMaxAmountVariation(dataSketch_origin_maxVolumeVariation)
			.setAmountFloor(dataSketch_extended_volumeFloor)
			.setAmountCeiling(dataSketch_extended_volumeCeiling)
			.setAmountPrecision(dataSketch_extended_volumePrecision);


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
				console.warn((isFunction? "Calculated": "Specified") + " 'axisYAmountCeiling': " + axisYAmountCeiling + " is infinite or lte 'axisYAmountFloor'(" + axisYAmountFloor + ").");
			else
				instance.setAmountCeiling(axisYAmountCeiling);
		}

		return instance;
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartSketch_VolumeDataSketch", KSubChartSketch_VolumeDataSketch);
})();