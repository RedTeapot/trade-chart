;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;
	var KDataManager = TradeChart2.KDataManager;
	var eventDrive = TradeChart2.eventDrive;

	var numBig = function(big){
		return Number(big.toString());
	};
	var floorBig = function(big){
		return Math.floor(numBig(big));
	};
	var ceilBig = function(big){
		return Math.ceil(numBig(big));
	};

	/**
	 * 验证配置并自动纠正错误的配置
	 * @param {KChartConfig} config K线绘制配置
	 */
	var validateConfig = function(config){
		/* 错误的配置项目检查 */
		var tmp = config.groupLineWidth + 2;
		if(config.groupBarWidth < tmp){
			console.warn("K chart bar width should be greater than group line width plus 2. Configured bar width: " + config.groupBarWidth + ", configured line with: " + config.groupLineWidth);
			config.groupBarWidth = tmp;
		}
	};

	/**
	 * @constructor
	 * K线图（OHLC图）
	 */
	var KChart = function(){
		TradeChart2.apply(this, arguments);
		var self = this;

		/** 绘制配置 */
		var config = {};

		/** 附加的K线子图列表 */
		var attachedKSubCharts = [];

		/** 与该实例相关联的数据管理器 */
		var kDataManager = new KDataManager();


		/* 代理 KDataManager 的方法 */
		for(var p in kDataManager)
			if(typeof kDataManager[p] === "function")
				this[p] = (function(p){
					return function(){
						var v = kDataManager[p].apply(kDataManager, arguments);
						return v === kDataManager? self: v;
					};
				})(p);

		/**
		 * 设置绘制配置
		 * @param {Object} _config 图形绘制配置
		 */
		this.setConfig = function(_config){
			if(null != _config && typeof _config === "object")
				for(var p in _config)
					config[p] = _config[p];

			validateConfig(config);

			return this;
		};

		/**
		 * 获取图形绘制配置
		 * @returns {*}
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * 获取指定名称的配置项取值。如果配置项并没有声明，则返回对应的默认配置。如果配置项无法识别，则返回undefined
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getConfigItem = function(name){
			var defaultConfig = TradeChart2.K_DEFAULT_CONFIG;

			if(null != config && name in config)
				return config[name];
			else if(name in defaultConfig)
				return defaultConfig[name];
			else{
				console.warn("Unknown k chart configuration item: " + name);
				return undefined;
			}
		};

		/**
		 * 根据给定的配置信息计算蜡烛一半的宽度
		 * @returns {Number}
		 */
		this.calcHalfGroupBarWidth = function(){
			var groupBarWidth = this.getConfigItem("groupBarWidth");
			return floorBig(new Big(groupBarWidth).minus(1).div(2));
		};

		/**
		 * 根据给定的配置信息计算一组数据绘制宽度的一半的宽度
		 * @returns {Number}
		 */
		this.calcHalfGroupSize = function(config){
			var config_groupGap = this.getConfigItem("groupGap"),
				config_groupBarWidth = this.getConfigItem("groupBarWidth"),
				config_axisXLabelSize = this.getConfigItem("axisXLabelSize");

			var groupSizeBig = new Big(config_groupBarWidth + config_groupGap);
			return Math.max(numBig(groupSizeBig.div(2)), numBig(new Big(config_axisXLabelSize).div(2)));
		};

		/**
		 * 根据设定的配置，计算横坐标刻度标签的刻度跨度，亦即一个刻度覆盖几组数据
		 * @returns {Number}
		 */
		this.calcAxisXLabelTickSpan = function(){
			var config_groupGap = this.getConfigItem("groupGap"),
				config_groupBarWidth = this.getConfigItem("groupBarWidth"),
				config_axisXLabelSize = this.getConfigItem("axisXLabelSize");

			var groupSizeBig = new Big(config_groupBarWidth + config_groupGap);
			return ceilBig(new Big(config_axisXLabelSize).div(groupSizeBig));
		};

		/**
		 * 为该K线图创建指定类型的子图
		 * @param {KSubChartTypes} subChartType 要创建的K线子图类型
		 */
		this.newSubChart = function(subChartType){
			var kSubChart;
			switch(String(subChartType).trim().toLowerCase()){
			case TradeChart2.KSubChartTypes.CANDLE:
				kSubChart = new TradeChart2.KSubChart_CandleChart(this);
				break;

			case TradeChart2.KSubChartTypes.VOLUME:
				kSubChart = new TradeChart2.KSubChart_VolumeChart(this);
				break;

			default:
				throw new Error("Unknown sub chart type: " + subChartType);
			}
			attachedKSubCharts.push(kSubChart);

			return kSubChart;
		};

		/**
		 * 移除子图
		 * @param {KSubChart} subChart 要移除的子图
		 */
		this.removeSubChart = function(subChart){
			var index = attachedKSubCharts.indexOf(subChart);
			if(index !== -1)
				attachedKSubCharts.splice(index, 1);

			return this;
		};

		eventDrive(this);
	};
	KChart.prototype = Object.create(TradeChart2.prototype);

	util.defineReadonlyProperty(TradeChart2, "KChart", KChart);
})();