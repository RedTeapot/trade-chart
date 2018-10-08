;(function(){
	var TradeChart2 = window.TradeChart2;
	var KSubChartSketch_ChartSketch = TradeChart2.KSubChartSketch_ChartSketch;
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
	 * @param {KSubChartConfig_candle} config 配置集合
	 * @param {KChartConfig} [kChartConfig] K线图绘制配置
	 * @returns {*}
	 */
	var getConfigItem = function(name, config, kChartConfig){
		var defaultConfig = TradeChart2.K_SUB_CANDLE_DEFAULT_CONFIG;

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
	 * @augments KSubChartSketch_ChartSketch
	 *
	 * 蜡烛图图形素描
	 */
	var KSubChartSketch_CandleChartSketch = function(){
		KSubChartSketch_ChartSketch.apply(this, arguments);

		/**
		 * 使用给定的数据概览更新图形概览
		 * @param {KSubChartSketch_CandleDataSketch} dataSketch 数据概览
		 * @returns {KSubChartSketch_CandleChartSketch}
		 */
		this.updateByDataSketch = function(dataSketch){
			var b = new Big(dataSketch.getPriceCeiling()).minus(dataSketch.getPriceFloor()).div(Math.max(this.getContentHeight(), 1));
			this.setAmountHeightRatio(b.eq(0)? 1: numBig(b));
			return this;
		};
	};
	KSubChartSketch_CandleChartSketch.prototype = Object.create(KSubChartSketch_ChartSketch.prototype);

	/**
	 * 根据给定的配置，生成素描
	 * @param {KSubChartConfig_candle} config 绘制配置
	 * @param {Number} [height] 绘制高度（当配置中指定的高度为百分比字符串时使用）
	 * @returns {KSubChartSketch_CandleChartSketch}
	 */
	KSubChartSketch_CandleChartSketch.sketchByConfig = function(config, height){
		var chartSketch = new KSubChartSketch_CandleChartSketch();

		var config_height = getConfigItem("height", config),
			config_paddingTop = getConfigItem("paddingTop", config),
			config_paddingBottom = getConfigItem("paddingBottom", config),
			config_axisYTickOffset = getConfigItem("axisYTickOffset", config);

		var heightBig = new Big(util.isValidNumber(height)? height: config_height).minus(config_paddingTop).minus(config_paddingBottom);
		var contentHeightBig = heightBig.minus(config_axisYTickOffset);
		chartSketch.setHeight(Math.max(floorBig(heightBig), 0))
			.setContentHeight(Math.max(floorBig(contentHeightBig), 0));

		return chartSketch;
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartSketch_CandleChartSketch", KSubChartSketch_CandleChartSketch);
})();