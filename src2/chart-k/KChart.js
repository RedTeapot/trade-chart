;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util,
		Big = TradeChart2.Big,
		KChartConfig = TradeChart2.KChartConfig,
		KDataManager = TradeChart2.KDataManager,
		KChartSketch = TradeChart2.KChartSketch,
		eventDrive = TradeChart2.eventDrive;

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
	 * 验证配置并自动纠正错误的配置
	 * @param {KChartConfig} config K线绘制配置
	 */
	var validateConfig = function(config){
		var v;

		/* 线宽需要为奇数 */
		var groupLineWidth = config.getConfigItemValue("groupLineWidth");
		if(groupLineWidth === 0)
			groupLineWidth = 1;
		if(groupLineWidth % 2 === 0){
			v = groupLineWidth + 1;
			console.warn("K line with should be odd(supplied: " + groupLineWidth + "), auto adjust to " + v);
			config.setConfigItemValue("groupLineWidth", groupLineWidth = v);
		}

		/* 柱宽需大于等于线宽+2 */
		var groupBarWidth = config.getConfigItemValue("groupBarWidth");
		var tmp = groupLineWidth + 2;
		if(groupBarWidth < tmp){
			console.warn("K chart bar width should be greater than group line width plus 2, auto adjust to " + tmp + ". Configured bar width: " + groupBarWidth + ", configured line with: " + groupLineWidth);
			config.setConfigItemValue("groupBarWidth", groupBarWidth = tmp);
		}
		if(groupBarWidth % 2 === 0){
			v = groupBarWidth + 1;
			console.warn("K bar width should odd(supplied: " + groupBarWidth + "), auto adjust to " + v);
			config.setConfigItemValue("groupBarWidth", groupBarWidth = v);
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
		var config = new KChartConfig();

		/** 附加的K线子图列表 */
		var attachedKSubCharts = [];

		/** 与该实例相关联的数据管理器 */
		var kDataManager = new KDataManager();

		/**
		 * 从初次绘制开始到现在，用户通过拖拉的方式达到的“绘制位置的横向位移”
		 * 取值为正，则代表图形向右移动；取值为负，则代表图形向左移动。
		 */
		var renderingOffset = 0;
		/**
		 * 图形向右移动的累计位移
		 */
		var totalRenderingOffset = 0;

		var fireEvent_renderingPositionChanges = function(){
			self.fire(evtName_renderingPositionChanges, null, false);
		};

		var setTotalRenderingOffset = function(v){
			var h = self.calcHalfGroupBarWidth(),
				g = self.getConfigItem("groupGap"),
				b = self.getConfigItem("groupBarWidth");
			var groupSize = b + g;

			var elapsedDataCount = Math.floor(v / groupSize);
			var tmp = v % groupSize;
			if(tmp < b){
				elapsedDataCount += 0;
				renderingOffset = tmp;
			}else{
				elapsedDataCount += 1;
				renderingOffset = (g - (tmp - b)) * -1;
			}

			var ifChanges = totalRenderingOffset != v;
			totalRenderingOffset = v;
			if(ifChanges)
				fireEvent_renderingPositionChanges();

			return elapsedDataCount;
		};


		/* 代理 KDataManager 的方法 */
		[
			"prependDataList",
			"appendDataList",
			"getDataList",
			"getConvertedDataList",
			"getRenderingDataCount",
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

			if(totalRenderingOffset !== 0){
				fireEvent_renderingPositionChanges();

				totalRenderingOffset = 0;
				renderingOffset = 0;
			}

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
		 * 计算可以达到左侧极限的最大位移量
		 * @param {Number} canvasWidth 画布宽度
		 */
		var calculateMaxOffsetToReachLeftEdge = function(canvasWidth){
			var h = self.calcHalfGroupBarWidth(),
				b = self.getConfigItem("groupBarWidth"),
				g = self.getConfigItem("groupGap");

			var dataCount = kDataManager.getVisibleDataCount();
			if(dataCount <= 1)
				return 0;

			var gap = (dataCount - 1) * g,
				bar = (dataCount - 2) * b + 2 * (h + 1);

			/* 剩余要渲染的数据全部绘制所需要占用的长度 */
			var totalLength = gap + bar;
			/* 内容区域的横坐标长度 */
			var axisXContentLength = self.calcAxisXContentRightPosition(canvasWidth) - self.calcAxisXContentLeftPosition() + 1;

			var rst = 0;
			if(totalLength <= axisXContentLength)
				rst = 0;
			else
				rst = totalLength - axisXContentLength;

			// console.log("@@@", rst, axisXContentLength, totalLength);

			return rst;
		};

		/**
		 * 检查当前呈现的数据是否已经达到左侧极限
		 * @param {Number} maxGroupCount 最大显示数据量
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {Boolean}
		 */
		var checkIfReachesLeftLimit = function(maxGroupCount, canvasWidth){
			return kDataManager.checkIfFirstVisibleDataIsShown(maxGroupCount) && totalRenderingOffset >= calculateMaxOffsetToReachLeftEdge(canvasWidth);
		};

		/**
		 * 检查当前呈现的数据是否已经达到右侧极限
		 * @returns {Boolean}
		 */
		var checkIfReachesRightLimit = function(){
			return kDataManager.checkIfLastVisibleDataIsShown() && totalRenderingOffset <= 0;
		};

		/**
		 * 更新“绘制位置的横向位移”，使其在既有基础上累加上给定的偏移量
		 * 绘制的起点位置，为图形右侧
		 *
		 * @param {Number} amount 要累加的横向偏移量。正数代表图形向右移动；负数代表图形向左移动
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {KChart}
		 */
		this.updateRenderingOffsetBy = function(amount, canvasWidth){
			amount = util.parseAsNumber(amount, 0);
			if(0 === amount)
				return this;

			TradeChart2.showLog && console.debug("Rendering position ~ TotalRenderingOffset: " + totalRenderingOffset + ", renderingOffset: " + renderingOffset + ", elapsedDataCount: " + kDataManager.getElapsedVisibleDataCount());

			var maxGroupCount = KChartSketch.calcMaxGroupCount(config, canvasWidth);
			var elapsedDataCount = 0, offset;

			var ifMovingToRight = amount > 0;
			if(ifMovingToRight){/* 向右拖动 */
				/* 检查是否达到左侧临界处 */
				var maxOffset = calculateMaxOffsetToReachLeftEdge(canvasWidth);
				if(checkIfReachesLeftLimit(maxGroupCount, canvasWidth)){
					TradeChart2.showLog && console.info("Reaches left edge, set total rendering offset to " + maxOffset);
					elapsedDataCount = setTotalRenderingOffset(maxOffset);
					kDataManager.setElapsedDataCount(elapsedDataCount);
					return this;
				}

				offset = Math.min(maxOffset, totalRenderingOffset + amount);
				elapsedDataCount = setTotalRenderingOffset(offset);
				kDataManager.setElapsedDataCount(elapsedDataCount);
			}else{
				/* 检查是否达到右侧临界处 */
				if(checkIfReachesRightLimit()){
					TradeChart2.showLog && console.info("Reaches right limit");
					elapsedDataCount = setTotalRenderingOffset(0);
					kDataManager.setElapsedDataCount(elapsedDataCount);
					return this;
				}

				offset = Math.max(0, totalRenderingOffset + amount);
				elapsedDataCount = setTotalRenderingOffset(offset);
				kDataManager.setElapsedDataCount(elapsedDataCount);
			}

			return this;
		};

		/**
		 * 重置“绘制位置的横向位移”为0
		 * @returns {KChart}
		 */
		this.resetRenderingOffset = function(){
			if(totalRenderingOffset !== 0)
				fireEvent_renderingPositionChanges();

			totalRenderingOffset = 0;
			renderingOffset = 0;
			return this;
		};

		/**
		 * 设置绘制配置
		 * @param {Object} _config 图形绘制配置
		 */
		this.setConfig = function(_config){
			if(null == config || typeof config !== "object"){
				console.warn("Invalid config");
				return this;
			}

			config.setConfig(_config);
			validateConfig(config);

			return this;
		};

		/**
		 * 获取图形绘制配置
		 * @returns {KChartConfig}
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
			return config.getConfigItemValue(name);
		};



		/**
		 * 计算横坐标左侧位置（坐标原点为：画布左上角）
		 * @returns {Number}
		 */
		this.calcAxisXLeftPosition = function(){
			var config_paddingLeft = this.getConfigItem("paddingLeft");
			return util.getLinePosition(config_paddingLeft);
		};

		/**
		 * 计算横坐标正文区域左侧位置（坐标原点为：画布左上角）
		 * @returns {Number}
		 */
		this.calcAxisXContentLeftPosition = function(){
			var config_axisXTickOffset = this.getConfigItem("axisXTickOffset");

			var xLeft_axisX = this.calcAxisXLeftPosition();
			return xLeft_axisX + Math.floor(config_axisXTickOffset);
		};

		/**
		 * 计算横坐标右侧位置（坐标原点为：画布左上角）
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {Number}
		 */
		this.calcAxisXRightPosition = function(canvasWidth){
			var xLeft_axisX = this.calcAxisXLeftPosition();
			var axisXWidth = canvasWidth - this.getConfigItem("paddingLeft") - this.getConfigItem("paddingRight");
			if(axisXWidth <= 0)
				return xLeft_axisX;

			return xLeft_axisX + Math.floor(axisXWidth - 1);/* xLeft_axis占据1像素 */
		};

		/**
		 * 计算横坐标正文区域右侧位置（坐标原点为：画布左上角）
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {Number}
		 */
		this.calcAxisXContentRightPosition = function(canvasWidth){
			var config_axisXTickOffsetFromRight = this.getConfigItem("axisXTickOffsetFromRight");
			var xRight_axisX = this.calcAxisXRightPosition(canvasWidth);
			return xRight_axisX - Math.floor(config_axisXTickOffsetFromRight);
		};

		/**
		 * 根据给定的配置信息计算蜡烛一半的宽度
		 * @returns {Number}
		 */
		this.calcHalfGroupBarWidth = function(){
			return Math.floor(this.getConfigItem("groupBarWidth") / 2);
		};

		/**
		 * 根据给定的配置信息计算一组数据绘制宽度的一半的宽度
		 * @returns {Number}
		 */
		this.calcHalfGroupSize = function(){
			var config_groupGap = this.getConfigItem("groupGap"),
				config_groupBarWidth = this.getConfigItem("groupBarWidth"),
				config_axisXLabelSize = this.getConfigItem("axisXLabelSize");

			return Math.max((config_groupBarWidth + config_groupGap) / 2, config_axisXLabelSize / 2);
		};

		/**
		 * 根据设定的配置，计算横坐标刻度标签的刻度跨度，亦即一个刻度覆盖几组数据
		 * @returns {Number}
		 */
		this.calcAxisXLabelTickSpan = function(){
			var config_groupGap = this.getConfigItem("groupGap"),
				config_groupBarWidth = this.getConfigItem("groupBarWidth"),
				config_axisXLabelSize = this.getConfigItem("axisXLabelSize");

			return Math.ceil(config_axisXLabelSize / (config_groupBarWidth + config_groupGap));
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