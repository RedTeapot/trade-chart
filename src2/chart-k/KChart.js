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
	 * 事件名称：渲染位置发生了变更
	 * @type {string}
	 */
	var evtName_renderingPositionChanges = "renderingpositionchange";

	/**
	 * 获取指定名称的配置项取值。如果配置项并没有声明，则返回对应的默认配置。如果配置项无法识别，则返回undefined
	 * @param {String} name 配置项名称
	 * @param {KChartConfig} config 配置集合
	 * @returns {*}
	 */
	var getConfigItem = function(name, config){
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
	 * 验证配置并自动纠正错误的配置
	 * @param {KChartConfig} config K线绘制配置
	 */
	var validateConfig = function(config){
		/* 线宽需要为奇数 */
		var groupLineWidth = getConfigItem("groupLineWidth", config);
		if(groupLineWidth === 0)
			groupLineWidth = 1;
		if(groupLineWidth % 2 === 0){
			var v = groupLineWidth + 1;
			console.warn("K line with should be odd(supplied: " + groupLineWidth + "), auto adjust to " + v);
			config.groupLineWidth = groupLineWidth = v;
		}

		/* 柱宽需大于等于线宽+2 */
		var groupBarWidth = getConfigItem("groupBarWidth", config);
		var tmp = groupLineWidth + 2;
		if(groupBarWidth < tmp){
			console.warn("K chart bar width should be greater than group line width plus 2, auto adjust to " + tmp + ". Configured bar width: " + groupBarWidth + ", configured line with: " + groupLineWidth);
			config.groupBarWidth = groupBarWidth = tmp;
		}
		if(groupBarWidth % 2 === 0){
			var v = groupBarWidth + 1;
			console.warn("K bar width should odd(supplied: " + groupBarWidth + "), auto adjust to " + v);
			config.groupBarWidth = groupBarWidth = v;
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

		/**
		 * 从初次绘制开始到现在，用户通过拖拉的方式达到的“绘制位置的横向位移”
		 * 取值为正，则代表图形向右移动；取值为负，则代表图形向左移动。
		 *
		 * 设定
		 * 1. half = 蜡烛宽度的一半
		 * 2. gap = 蜡烛之间的见习
		 *
		 * 基于“第一个蜡烛的中心位置与正文区域左边界重合”的前提，绘制位置的横向位移offset在不同的区间范围内需执行不同操作：
		 * 1. offset 在区间 [0, half + gap) 时，什么也不做
		 * 2. offset 在区间 [half + gap, half + gap + half) 时，kDataManager 的绘制索引±1
		 * 3. offset 在区间 [half + gap + half, ...) 时，调整 offset，使得 offset = offset - (half + gap + half)
		 * @type {number}
		 */
		var renderingOffset = 0;


		/* 代理 KDataManager 的方法 */
		[
			"prependDataList",
			"appendDataList",
			"getDataList",
			"getConvertedDataList",
			"getRenderingDataList",
			"getConvertedRenderingDataList",
			"getData",
			"getConvertedData",
			"setDataParser",
			"getDataParser",
		].forEach(function(m){
			self[m] = function(){
				var v = kDataManager[m].apply(kDataManager, arguments);
				return v === kDataManager? self: v;
			};
		});

		util.defineReadonlyProperty(this, "id", util.randomString("k-", 3));

		/**
		 * 获取关联的K线数据管理器
		 * @returns {KDataManager}
		 */
		this.getKDataManager = function(){
			return kDataManager;
		};

		/**
		 * 设置数据源（代理KDataManager）
		 * @param {Array<UserSuppliedData>} dataList 数据源
		 * @returns {KChart}
		 */
		this.setDataList = function(dataList){
			if(!Array.isArray(dataList)){
				console.warn("Supplied k data should be an array.");
				return this;
			}

			kDataManager.setDataList(dataList);

			if(renderingOffset !== 0)
				this.fire(evtName_renderingPositionChanges);
			renderingOffset = 0;

			return this;
		};

		/**
		 * 获取当前的“绘制位置的横向位移”
		 * @returns {Number}
		 */
		this.getRenderingOffset = function(){
			return renderingOffset;
		};

		/**
		 * 更新“绘制位置的横向位移”，使其在既有基础上累加上给定的偏移量
		 * @param {Number} amount 要累加的横向偏移量
		 * @returns {KChart}
		 */
		this.updateRenderingOffsetBy = function(amount){
			amount = Number(amount);
			if(isNaN(amount))
				amount = 0;

			if(0 === amount)
				return this;

			var half = this.calcHalfGroupBarWidth(),
				gap = this.getConfigItem("groupGap"),
				barSize = this.getConfigItem("groupBarWidth"),
				halfBarSizeBig = new Big(this.calcHalfGroupBarWidth());

			var barSizeBig = new Big(barSize);
			var offsetBig = new Big(renderingOffset).plus(amount);
			var ifMovingToRight = offsetBig.gt(0);

			offsetBig = offsetBig.abs();
			renderingOffset = numBig(offsetBig);

			var tmp = barSizeBig.plus(gap);

			var indexOffset = Math.floor(Number(offsetBig.div(tmp).toString()));
			offsetBig = offsetBig.mod(tmp).abs();
			renderingOffset = Number(offsetBig.toString());

			tmp = halfBarSizeBig.plus(gap);
			if(offsetBig.gt(tmp)){
				indexOffset += 1;
				offsetBig = halfBarSizeBig.plus(1).minus(offsetBig.minus(tmp)).mul(-1);
				renderingOffset = Number(offsetBig.toString());
			}

			indexOffset = indexOffset * (ifMovingToRight? -1: 1);
			this.fire(evtName_renderingPositionChanges);

			kDataManager.updateFirstVisibleDataIndexBy(indexOffset);

			return this;
		};

		/**
		 * 重置“绘制位置的横向位移”为0
		 * @returns {KChart}
		 */
		this.resetRenderingOffset = function(){
			if(renderingOffset !== 0)
				this.fire(evtName_renderingPositionChanges);

			renderingOffset = 0;
			return this;
		};

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
			return getConfigItem(name, config);
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
		this.calcHalfGroupSize = function(){
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