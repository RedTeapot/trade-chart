;(function(){
	var TradeChart2 = window.TradeChart2;
	var KSubChartSketch = TradeChart2.KSubChartSketch;
	var util = TradeChart2.util;
	var Big = util.Big;

	var numBig = function(big){
		return Number(big.toString());
	};
	var floorBig = function(big){
		return Math.floor(numBig(big));
	};

	/**
	 * 获取指定名称的配置项取值。如果配置项并没有声明，则返回对应的默认配置。如果配置项无法识别，则返回undefined
	 * @param {String} name 配置项名称
	 * @param {KSubChartConfig_volume} config 配置集合
	 * @param {KChartConfig} [kChartConfig] K线图绘制配置
	 * @returns {*}
	 */
	var getConfigItem = function(name, config, kChartConfig){
		var defaultConfig = TradeChart2.K_SUB_VOLUME_DEFAULT_CONFIG;

		if(name in config)
			return config[name];
		else if(name in defaultConfig)
			return defaultConfig[name];

		if(null != kChartConfig && name in kChartConfig)
			return kChartConfig[name];

		defaultConfig = TradeChart2.K_DEFAULT_CONFIG;
		if(name in defaultConfig)
			return defaultConfig[name];
		else{
			console.warn("Unknown configuration item: " + name);
			return undefined;
		}
	};

	/**
	 * @constructor
	 * @augments KSubChartSketch
	 *
	 * 蜡烛图图形素描
	 */
	var KSubChartSketch_VolumeChartSketch = function(){
		KSubChartSketch.apply(this, arguments);

		/**
		 * 使用给定的数据概览更新图形概览
		 * @param {KSubChartSketch_VolumeDataSketch} dataSketch 数据概览
		 * @returns {KSubChartSketch_VolumeChartSketch}
		 */
		this.updateByDataSketch = function(dataSketch){
			var b = new Big(dataSketch.getVolumeCeiling()).minus(dataSketch.getVolumeFloor()).div(Math.max(this.getContentHeight(), 1));
			this.setAmountHeightRatio(b.eq(0)? 1: numBig(b));
			return this;
		};
	};
	KSubChartSketch_VolumeChartSketch.prototype = Object.create(KSubChartSketch.prototype);

	/**
	 * 根据给定的配置，生成素描
	 * @param {KSubChartConfig_candle} config 绘制配置
	 * @param {Number} [height] 绘制高度（当配置中指定的高度为百分比字符串时使用）
	 * @returns {KSubChartSketch_VolumeChartSketch}
	 */
	KSubChartSketch_VolumeChartSketch.sketchByConfig = function(config, height){
		var chartSketch = new KSubChartSketch_VolumeChartSketch();

		var config_height = getConfigItem("height", config),
			config_paddingTop = getConfigItem("paddingTop", config),
			config_paddingBottom = getConfigItem("paddingBottom", config);

		var heightBig = new Big(height || config_height).minus(config_paddingTop).minus(config_paddingBottom);
		chartSketch.setHeight(floorBig(heightBig))
			.setContentHeight(floorBig(heightBig));

		return chartSketch;
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartSketch_VolumeChartSketch", KSubChartSketch_VolumeChartSketch);
})();