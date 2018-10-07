;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var KChartSketch = TradeChart2.KChartSketch;
	var KSubChartRenderResult = TradeChart2.KSubChartRenderResult;

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
		var defaultConfig = TradeChart2.K_SUB_VOLUME_DEFAULT_CONFIG;
		if(name in config)
			return config[name];
		else if(name in defaultConfig)
			return defaultConfig[name];

		return kChart.getConfigItem(name);
	};

	/**
	 * @constructor
	 * K线子图绘制结果
	 * @param {KSubChart} kSubChart 关联的，生成绘制结果的K线子图实例
	 * @param {HTMLCanvasElement} canvasObj 绘制的画布所在的DOM元素
	 * @param {Object} config 绘制过程使用的配置
	 */
	var KSubChart_VolumeRenderResult = function(kSubChart, canvasObj, config){
		KSubChartRenderResult.call(this, kSubChart, config);
		var self = this;

		var getConfigItem = function(name){
			return _getConfigItem(self.getRenderingKChart(), name, config);
		};

		/**
		 * 获取可以渲染出来的数据个数
		 * @returns {Number}
		 */
		this.getRenderingGroupCount = function(){
			var kChart = this.getRenderingKChart();
			var maxGroupCount = KChartSketch.calcMaxGroupCount(kChart.getConfig(), util.calcRenderingWidth(canvasObj, getConfigItem("width"))),
				dataCount = kChart.getDataList().length;
			return Math.max(Math.min(maxGroupCount, dataCount), 0);
		};

		/**
		 * 获取可以渲染出来的数据列表
		 * @returns {Array<KData|Object>}
		 */
		this.getRenderingDataList = function(){
			//TODO
			return null;
		};

		/**
		 * 获取可以渲染出来的，被转换后的数据列表
		 * @returns {Array<KData>}
		 */
		this.getConvertedRenderingDataList = function(){
			//TODO
			return null;
		};
	};
	KSubChart_VolumeRenderResult.prototype = Object.create(KSubChartRenderResult.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_VolumeRenderResult", KSubChart_VolumeRenderResult);
})();