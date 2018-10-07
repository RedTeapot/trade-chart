;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = util.Big;

	var numBig = function(big){
		return Number(big.toString());
	};
	var floorBig = function(big){
		return Math.floor(numBig(big));
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

		/** 绘制配置 */
		var config = {};

		/** 数据数组 */
		var dataList = [];

		/** 数据转换方法，用于将提供的数据数组转为本图表兼容的格式 */
		var dataParser;

		/** 附加的K线子图列表 */
		var attachedKSubCharts = [];

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

			if(name in config)
				return config[name];
			else if(name in defaultConfig)
				return defaultConfig[name];
			else{
				console.warn("Unknown k chart configuration item: " + name);
				return undefined;
			}
		};

		/**
		 * 设置数据源
		 * @param {Array<KData|Object>} _datas 数据源，可以是本插件约定格式的数据，也可以是任意其它格式的数据。如果是其它格式的数据，则需要同步提供数据解析器，以指导本插件解析数据
		 */
		this.setDataList = function(_datas){
			if(!Array.isArray(_datas)){
				console.warn("Supplied k data should be an array.");
				return this;
			}

			dataList = _datas;
			return this;
		};

		/**
		 * 获取设置的数据源
		 * @returns {Array<KData|Object>}
		 */
		this.getDataList = function(){
			return dataList;
		};

		/**
		 * 获取指定的相对横坐标对应的数据索引
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布Canvas的左上角
		 * @returns {Number} 相对横坐标对应的数据索引。如果位置在区域左侧，则返回0；如果在区域右侧，则返回最后一条数据的索引。如果数据区域中没有任何数据，则返回-1
		 */
		this.getDataIndex = function(x){
			//TODO
			return -1;
		};

		/**
		 * 获取指定索引对应的原始数据
		 * @param {Number} index 要获取的数据的索引
		 */
		this.getData = function(index){
			if(!util.isValidNumber(index))
				throw new Error("Invalid index: " + index + " to retrieve converted data.");

			index = util.parseAsNumber(index);
			if(index < 0 || index > dataList.length){
				console.warn("Out of bound access for converted data of index: " + index);
				return null;
			}

			return dataList[index];
		};

		/**
		 * 获取指定索引对应的被转换后的数据
		 * @param {Number} index 要获取的数据的索引
		 */
		this.getConvertedData = function(index){
			var data = this.getData(index);
			if(null == data)
				return data;

			if(typeof dataParser === "function"){
				try{
					data = dataParser(data, index, dataList);
				}catch(e){
					console.error("Fail to convert data of index: " + index + " using supplied data parser.", data);
					console.error(e);
				}
			}

			return data;
		};

		/**
		 * 设置数据转换方法，当要扫描的数据是其它格式的数据时，用于指导本插件解析数据的解析器
		 * @param parser {Function} 数据转换方法
		 */
		this.setDataParser = function(parser){
			if(typeof parser !== "function"){
				console.warn("Data parser should be of type: 'Function'.");
				return this;
			}

			dataParser = parser;
			return this;
		};

		/**
		 * 获取数据转换方法
		 * @return {Function} 数据转换方法
		 */
		this.getDataParser = function(){
			return dataParser;
		};

		/**
		 * 根据给定的配置信息计算蜡烛一半的宽度
		 * @param {KChartConfig} [config] 绘制配置
		 * @returns {Number}
		 */
		this.calcHalfGroupBarWidth = function(config){
			config = config || this.getConfig();

			var attrName = "groupBarWidth";
			var groupBarWidth = config[attrName] || this.getConfigItem(attrName);

			return floorBig(new Big(groupBarWidth).minus(1).div(2));
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
	};
	KChart.prototype = Object.create(TradeChart2.prototype);

	util.defineReadonlyProperty(TradeChart2, "KChart", KChart);
})();