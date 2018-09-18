;(function(){
	var TradeChart2 = window.TradeChart2;
	var KSubChartTypes = TradeChart2.KSubChartTypes,
		KSubChart = TradeChart2.KSubChart,
		KSubChartRenderResult = TradeChart2.KSubChartRenderResult;
	var util = TradeChart2.util;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * @constructor
	 * @augments KSubChart
	 *
	 * K线图子图：蜡烛图
	 * @param {KChart} kChart 附加该子图的K线图
	 */
	var KSubChart_VolumeChart = function(kChart){
		KSubChart.call(this, kChart, KSubChartTypes.VOLUME);

		/**
		 * @override
		 *
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} config 渲染配置
		 * @returns {KSubChartRenderResult} 绘制的K线图
		 */
		this.render = function(canvasObj, config){

			/**
			 * 从给定的配置集合中获取指定名称的配置项取值。
			 * 如果给定的配置集合中不存在，则从K线图的全局配置中获取。
			 * 如果全局的配置中也不存在，则返回undefined
			 *
			 * @param {String} name 配置项名称
			 */
			var getConfigItem = function(name){
				var defaultConfig = TradeChart2.K_SUB_VOLUME_DEFAULT_CONFIG;
				if(name in config)
					return config[name];
				else if(name in defaultConfig)
					return defaultConfig[name];

				return kChart.getConfigItem(name);
			};

			var config_width = getConfigItem("width"),
				config_height = getConfigItem("height");

			/* 百分比尺寸自动转换 */
			if(/%/.test(config_width))
				config_width = canvasObj.parentElement.clientWidth * parseInt(config_width.replace(/%/, "")) / 100;
			if(/%/.test(config_height))
				config_height = canvasObj.parentElement.clientHeight * parseInt(config_height.replace(/%/, "")) / 100;
			util.setAttributes(canvasObj, {width: config_width, height: config_height});
			var ctx = util.initCanvas(canvasObj, config_width, config_height);

			var dataList = this.getKChart().getDataList(),
				dataParser = this.getKChart().getDataParser();

			//TODO

			return new KSubChartRenderResult(this, config);
		};
	};
	KSubChart_VolumeChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_VolumeChart", KSubChart_VolumeChart);
})();