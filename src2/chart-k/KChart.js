;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	var floorBig = function(big){
		return Math.floor(numBig(big));
	};

	/**
	 * 默认的，作用于主图和子图的全局配置项
	 * @type {KChartConfig}
	 */
	var defaultConfig = {
		width: "100%",/** 图表整体宽度 */

		paddingLeft: 60,/** 图表内边距 - 左侧 */
		paddingRight: 20,/** 图表内边距 - 右侧 */

		groupLineWidth: 1,/** 蜡烛线的宽度。最好为奇数，从而使得线可以正好在正中间 */
		groupBarWidth: 5,/** 蜡烛的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间 */
		groupGap: 3,/** 相邻两组数据之间的间隔 */

		axisTickLineLength: 6,/** 坐标轴刻度线的长度 */
		axisLabelFont: "normal 10px sans-serif, serif",/** 坐标标签字体 */
		axisLabelColor: null,/** 坐标标签颜色 */
		axisLineColor: null,/** 坐标轴颜色 */

		axisXTickOffset: 5,/** 横坐标刻度距离原点的位移（无论Y轴显示在哪侧，都应用在左侧） */
		axisXTickOffsetFromRight: 0,/** 最后一个横坐标刻度距离横坐标结束位置的位移 */
		axisXLabelOffset: 5,/** 横坐标标签距离坐标轴刻度线的距离 */
		axisXLabelSize: 55,/** 横坐标标签文字的长度（用于决定以何种方式绘制最后一个刻度：只绘制边界刻度，还是边界刻度和最后一个刻度都绘制） */
		axisXLabelGenerator: function(convertedData, index, previousConvertedData, nextConvertedData){/** 横坐标标签文字的输出方法 */
			return convertedData.time;
		},
		axisXLabelHorizontalAlign: function(i, n){/** 横坐标标签的水平对齐方式。start：左对齐；center：居中；end：右对齐 */
			return "center";
		},

		axisYPosition: "left",/** 纵坐标位置。left：左侧；right：右侧 */
		axisYLabelPosition: "outside",/** 纵坐标标签位置。outside：外侧；inside：内侧 */
		axisYLabelOffset: 5,/** 纵坐标标签距离坐标轴刻度线的距离 */
		axisYLabelFont: null,/** 纵坐标的坐标标签字体 */
		axisYLabelColor: null,/** 纵坐标的坐标标签颜色 */
	};
	Object.seal && Object.seal(defaultConfig);

	/**
	 * @constructor
	 * K线图（OHLC图）
	 */
	var KChart = function(){
		TradeChart2.apply(this, arguments);

		/** 绘制配置 */
		var config = {};

		/** 数据数组 */
		var dataList;

		/** 数据转换方法，用于将提供的数据数组转为本图表兼容的格式 */
		var dataParser;

		/** 附加的K线子图列表 */
		var attachedKSubCharts = [];

		/**
		 * 设置绘制配置
		 * @param {Object} _config 图形绘制配置
		 */
		this.setConfig = function(_config){
			if(null != _config && typeof _config == "object")
				for(var p in _config)
					config[p] = _config[p];

			/* 错误的配置项目检查 */
			if(config.groupBarWidth < config.groupLineWidth + 2)
				throw new Error("K chart bar width should be greater than group line width plus 2.");

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
			if(name in config)
				return config[name];
			else if(name in defaultConfig)
				return defaultConfig[name];
			else{
				console.warn("Unknown configuration item: " + name);
				return undefined;
			}
		};

		/**
		 * 设置数据源
		 * @param {Array<KData|Object>} _datas 数据源
		 */
		this.setDataList = function(_datas){
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
		 * 设置数据转换方法
		 * @param parser {Function} 数据转换方法
		 */
		this.setDataParser = function(parser){
			if(typeof parser != "function"){
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
			return floorBig(new Big(config.groupBarWidth).minus(1).div(2));
		};

		/**
		 * 为该K线图创建指定类型的子图
		 * @param {KSubChartTypes} subChartType 要创建的K线子图类型
		 */
		this.newSubChart = function(subChartType){
			var kSubChart;
			switch(subChartType){
			case KChart.KSubChartTypes.CANDLE:
				kSubChart = new KChart.subChart.CandleChart(this);
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
			if(index != -1)
				attachedKSubCharts.splice(index, 1);

			return this;
		};
	};
	KChart.prototype = Object.create(TradeChart2.prototype);

	/**
	 * 子图图表类集合
	 */
	var subCharts = {};

	/**
	 * 子图图表定义
	 * @param {String} name 图表名称
	 * @param {Function} obj 图表实现
	 */
	util.defineReadonlyProperty(KChart, "defineSubChart", function(name, obj){
		if(name in subCharts)
			throw new Error("Sub chart of name: " + name + " exists already.");

		subCharts[name] = obj;
	});
	util.defineReadonlyProperty(KChart, "subChart", subCharts);

	/* 暴露默认配置 */
	util.defineReadonlyProperty(KChart, "DEFAULT_CONFIG", defaultConfig);

	TradeChart2.defineChart("KChart", KChart);
})();