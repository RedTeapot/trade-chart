;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util,
		eventDrive = TradeChart2.eventDrive,
		CommonDataManager = TradeChart2.CommonDataManager,
		CommonChartConfig = TradeChart2.CommonChartConfig;

	/**
	 * 事件名称：图形渲染位置发生了变更
	 * @type {string}
	 */
	var evtName_renderingPositionChanges = "renderingpositionchange";

	/**
	 * @constructor
	 * 分时图、K线图的原型构造器
	 *
	 * @augments TradeChart2
	 */
	var CommonChart = function(){
		var self = this;
		TradeChart2.apply(this, arguments);

		/** 与该实例相关联的数据管理器 */
		var dataManager = new CommonDataManager();

		/**
		 * 从初次绘制开始到现在，用户通过拖拉的方式达到的“绘制位置的横向位移”
		 * 取值为正，则代表图形向右偏移；取值为负，则代表图形向左偏移。
		 */
		var renderingOffset = 0;

		/**
		 * 图形向右移动的累计位移
		 */
		var totalRenderingOffset = 0;

		var fireEvent_renderingPositionChanges = function(){
			self.fire(evtName_renderingPositionChanges, null, false);
		};

		/**
		 * 根据给定的位移量，计算对应可以略过的数据群组个数，以及渲染偏移量
		 * @param {Number} newTotalRenderingOffset 位移量
		 * @returns {Number} 略过的数据群组个数
		 */
		var setTotalRenderingOffsetFromLeft = function(newTotalRenderingOffset){
			var config_groupBarWidth = self.getConfigItemValue("groupBarWidth");

			var rightMostRenderingDataIndex = dataManager.getRightMostRenderableDataIndex();
			var elapsedDataCount = 0,
				tmp = newTotalRenderingOffset;
			while(true){
				var rightIndex = rightMostRenderingDataIndex - elapsedDataCount;
				var leftIndex = rightIndex - 1;
				if(leftIndex < 0)
					break;

				/**
				 * 不同数据之间的间隙可能是不同的，需要分别计算、累加
				 */
				var gap = self.getGroupGap(leftIndex, rightIndex);
				var groupSize = gap + config_groupBarWidth;

				if(tmp >= groupSize){/* 位移量超过1组数据 */
					tmp -= groupSize;
					elapsedDataCount += 1;
				}else if(tmp < config_groupBarWidth){/* 位移量不足柱宽 */
					renderingOffset = tmp;
					break;
				}else{/* 位移量超过柱宽，但间隙不足 */
					elapsedDataCount += 1;

					/* 记录剩余间隙，用于横向偏移整个图形，从而保持图形的渲染位置与鼠标拖动位移一直 */
					renderingOffset = (gap - (tmp - config_groupBarWidth)) * -1;
					break;
				}
			}

			/* 更新渲染偏移量 */
			var ifChanges = totalRenderingOffset !== newTotalRenderingOffset;
			totalRenderingOffset = newTotalRenderingOffset;
			if(ifChanges)
				fireEvent_renderingPositionChanges();

			return elapsedDataCount;
		};

		/* 代理 CommonDataManager 的方法 */
		[
			"prependDataList",
			"appendDataList",
			"getDataCount",
			"getDataList",
			"getConvertedDataList",
			"getRenderingGroupCount",
			"getRenderingDataList",
			"getConvertedRenderingDataList",
			"getData",
			"getConvertedData",
			"setDataParser",
			"getDataParser",
		].forEach(function(m){
			self[m] = function(){
				var v = dataManager[m].apply(dataManager, arguments);
				return v === dataManager? self: v;
			};
		});

		/**
		 * 获取关联的K线数据管理器
		 * @returns {CommonDataManager}
		 */
		this.getDataManager = function(){
			return dataManager;
		};

		/**
		 * 设置数据源（代理CommonDataManager）
		 * @param {Array<UserSuppliedData>} dataList 数据源
		 * @returns {CommonChart}
		 */
		this.setDataList = function(dataList){
			if(!Array.isArray(dataList)){
				console.warn("Illegal argument. Type of 'Object[]' is required.");
				return this;
			}

			/**
			 * 设置数据后需要重新渲染，因而需要检测并发起“渲染位置发生改变”事件
			 */
			if(totalRenderingOffset !== 0){
				totalRenderingOffset = 0;
				renderingOffset = 0;

				dataManager.setDataList(dataList, evtName_renderingPositionChanges);
			}else
				dataManager.setDataList(dataList);

			return this;
		};

		/**
		 * 设置绘制配置
		 * @param {Object} _config 图形绘制配置
		 * @returns {CommonChart}
		 */
		this.setConfig = function(_config){
			if(null == _config || typeof _config !== "object"){
				console.warn("Illegal argument. Type of 'Object' is required.");
				return this;
			}

			this.getConfig().setConfigContent(_config);
			return this;
		};

		/**
		 * 获取图形绘制配置实例
		 * @returns {CommonChartConfig}
		 */
		this.getConfig = function(){
			console.warn("Not implemented!");
			return null;
		};

		/**
		 * 获取指定名称的配置项取值。如果配置项并没有声明，则返回对应的默认配置。如果配置项无法识别，则返回null
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getConfigItemValue = function(name){
			return this.getConfig().getConfigItemValue(name);
		};

		/**
		 * 获取当前的“绘制位置的横向位移”
		 * @returns {Number}
		 */
		this.getRenderingOffset = function(){
			return renderingOffset;
		};

		/**
		 * 获取相邻两组数据之间间隙的最小值
		 * @returns {Number|null}
		 */
		this.getMinGroupGap = function(){
			return CommonChart.getMinGroupGap(this.getConfig());
		};

		/**
		 * 获取给定两个相邻索引对应的数据之间的间隙
		 * @param {Number} leftDataIndex 间隙左侧数据的全局索引（从左向右）
		 * @param {Number} rightDataIndex 间隙右侧数据的全局索引（从左向右）
		 * @returns {*}
		 */
		this.getGroupGap = function(leftDataIndex, rightDataIndex){
			return CommonChart.getGroupGap(this, leftDataIndex, rightDataIndex);
		};

		/**
		 * 根据给定的最左侧数据索引和最右侧数据索引，计算两组数据之间的所有间隙空间总和
		 * @param {Number} leftMostDataIndex 最左侧数据的全局索引（从左向右）
		 * @param {Number} rightMostDataIndex 最右侧数据的全局索引（从左向右）
		 * @returns {Number}
		 */
		this.sumGroupGap = function(leftMostDataIndex, rightMostDataIndex){
			if(leftMostDataIndex < 0)
				leftMostDataIndex = 0;

			var index = this.getDataManager().getRenderableGroupCount() - 1;
			if(rightMostDataIndex > index)
				rightMostDataIndex = index;

			if(rightMostDataIndex <= leftMostDataIndex)
				return 0;

			var config_groupGap = this.getConfigItemValue("groupGap");
			var t = typeof config_groupGap;
			if(t === "number")
				return (rightMostDataIndex - leftMostDataIndex) * config_groupGap;
			else if(t === "function"){
				var gap = 0;
				for(var i = leftMostDataIndex; i < rightMostDataIndex; i++)
					gap += util.try2Call(config_groupGap, null, i, i + 1);

				return gap;
			}else{
				console.error("Unknown group gap('groupGap') value: " + config_groupGap);
				return 0;
			}
		};

		/**
		 * 计算可以拖动图形达到左侧极限的最大位移量。单位：像素
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {Number}
		 */
		var calculateMaxOffsetToReachLeftEdge = function(canvasWidth){
			var h = self._calcHalfGroupBarWidth(),
				b = self.getConfigItemValue("groupBarWidth");

			var dataCount = dataManager.getRenderableGroupCount();
			if(dataCount <= 1)
				return 0;

			var gap = self.sumGroupGap(0, dataManager.getRightMostRenderableDataIndex()),
				bar = dataCount * b - 2 * h;

			/* 数据全部绘制所需要占用的长度 */
			var totalLength = gap + bar;
			/* 内容区域的横坐标长度。+1 是因为虽然 2-1=1，但 1~2 共2个像素可渲染 */
			var axisXContentLength = self._calcAxisXContentRightPosition(canvasWidth) - self._calcAxisXContentLeftPosition() + 1;

			var rst = 0;
			if(totalLength <= axisXContentLength)
				rst = 0;
			else
				rst = totalLength - axisXContentLength;

			return rst;
		};

		/**
		 * 检查当前呈现的数据是否已经达到左侧极限
		 * @param {Number} maxGroupCount 最大显示数据量
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {Boolean}
		 */
		var checkIfReachesLeftLimit = function(maxGroupCount, canvasWidth){
			return dataManager.checkIfLeftMostRenderableGroupIsVisible(maxGroupCount)
				&& totalRenderingOffset >= calculateMaxOffsetToReachLeftEdge(canvasWidth);
		};

		/**
		 * 检查当前呈现的数据是否已经达到右侧极限
		 * @returns {Boolean}
		 */
		var checkIfReachesRightLimit = function(){
			return dataManager.checkIfRightMostRenderableGroupIsVisible() && totalRenderingOffset <= 0;
		};

		/**
		 * 更新“绘制位置的横向位移”，使其在既有基础上累加上给定的偏移量
		 * 绘制的起点位置，为图形右侧
		 *
		 * @param {Number} amount 要累加的横向偏移量。正数代表图形向右移动；负数代表图形向左移动
		 * @param {Number} maxGroupCount 根据当前配置可绘制的最大的数据量
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {CommonChart}
		 */
		this.updateRenderingOffsetBy = function(amount, maxGroupCount, canvasWidth){
			amount = util.parseAsNumber(amount, 0);
			if(0 === amount)
				return this;

			TradeChart2.showLog && console.debug("Rendering position ~ TotalRenderingOffset: " + totalRenderingOffset + ", renderingOffset: " + renderingOffset + ", elapsedDataCount: " + dataManager.getElapsedRenderableGroupCount() + ".");

			var elapsedDataCount = 0, offset;
			var ifMovingToRight = amount > 0;
			if(ifMovingToRight){/* 向右拖动 */
				/* 检查是否达到左侧临界处 */
				var maxOffset = calculateMaxOffsetToReachLeftEdge(canvasWidth);
				TradeChart2.showLog && console.debug("Max offset to reach left edge: " + maxOffset);
				if(checkIfReachesLeftLimit(maxGroupCount, canvasWidth)){
					TradeChart2.showLog && console.info("Reaches left edge, set total rendering offset to " + maxOffset);
					elapsedDataCount = setTotalRenderingOffsetFromLeft(maxOffset);
					dataManager.setElapsedRenderableGroupCount(elapsedDataCount);
					return this;
				}

				offset = Math.min(maxOffset, totalRenderingOffset + amount);
				elapsedDataCount = setTotalRenderingOffsetFromLeft(offset);
				dataManager.setElapsedRenderableGroupCount(elapsedDataCount);
			}else{
				/* 检查是否达到右侧临界处 */
				if(checkIfReachesRightLimit()){
					TradeChart2.showLog && console.info("Reaches right limit");
					elapsedDataCount = setTotalRenderingOffsetFromLeft(0);
					dataManager.setElapsedRenderableGroupCount(elapsedDataCount);
					return this;
				}

				offset = Math.max(0, totalRenderingOffset + amount);
				elapsedDataCount = setTotalRenderingOffsetFromLeft(offset);
				dataManager.setElapsedRenderableGroupCount(elapsedDataCount);
			}

			return this;
		};

		/**
		 * 重置“绘制位置的横向位移”为0
		 * @returns {CommonChart}
		 */
		this.resetRenderingOffset = function(){
			if(totalRenderingOffset !== 0)
				fireEvent_renderingPositionChanges();

			totalRenderingOffset = 0;
			renderingOffset = 0;
			return this;
		};



		/**
		 * 根据给定的配置信息计算蜡烛一半的宽度
		 * @returns {Number}
		 */
		this._calcHalfGroupBarWidth = function(){
			return Math.floor(this.getConfigItemValue("groupBarWidth") / 2);
		};

		/**
		 * 计算横坐标左侧位置（坐标原点为：画布左上角）
		 * @returns {Number}
		 */
		this._calcAxisXLeftPosition = function(){
			var config_paddingLeft = this.getConfigItemValue("paddingLeft");
			return util.getLinePosition(config_paddingLeft);
		};

		/**
		 * 计算横坐标右侧位置（坐标原点为：画布左上角）
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {Number}
		 */
		this._calcAxisXRightPosition = function(canvasWidth){
			var xLeft_axisX = this._calcAxisXLeftPosition();
			var axisXWidth = canvasWidth - this.getConfigItemValue("paddingLeft") - this.getConfigItemValue("paddingRight");
			if(axisXWidth <= 0)
				return xLeft_axisX;

			return xLeft_axisX + Math.floor(axisXWidth - 1);/* xLeft_axis占据1像素 */
		};

		/**
		 * 计算横坐标坐标轴的宽度
		 * @param {Number} [canvasWidth] 绘制宽度（当配置中指定的宽度为百分比字符串时使用）
		 * @returns {number}
		 */
		this._calcAxisXWidth = function(canvasWidth){
			var config_width = this.getConfigItemValue("width"),
				config_paddingLeft = this.getConfigItemValue("paddingLeft"),
				config_paddingRight = this.getConfigItemValue("paddingRight");

			canvasWidth = util.isValidNumber(canvasWidth)? canvasWidth: config_width;
			return canvasWidth - config_paddingLeft - config_paddingRight;
		};


		eventDrive(this);
	};
	CommonChart.prototype = Object.create(TradeChart2.prototype);

	/**
	 * 获取相邻两组数据之间间隙的最小值
	 * @param {CommonChartConfig} config 配置集合
	 * @returns {Number|null}
	 */
	CommonChart.getMinGroupGap = function(config){
		var config_groupGap = config.getConfigItemValue("groupGap");
		var t = typeof config_groupGap;
		if(t === "number")
			return config_groupGap;
		else if(t === "function"){
			if(typeof config_groupGap.implGetMinValue === "function")
				return util.try2Call(config_groupGap.implGetMinValue);
			else{
				console.error("No method of name: 'implGetMinValue' found in given group gap('groupGap') calculator, using constant 0 instead.", config_groupGap);
				return 0;
			}
		}else if(/^autoDividedByFixedGroupCount(?::\d+)?$/.test(String(config_groupGap).trim()))
			return 0;
		else{
			console.error("Can not determine the min group gap('groupGap') by value: " + config_groupGap + ", using constant 0 instead.");
			return 0;
		}
	};

	/**
	 * 获取给定两个相邻索引对应的数据之间的间隙
	 * @param {CommonChartConfig} config 配置集合
	 * @param {Number} leftDataIndex 间隙左侧数据的全局索引（从左向右）
	 * @param {Number} rightDataIndex 间隙右侧数据的全局索引（从左向右）
	 * @returns {*}
	 */
	CommonChart.getGroupGap = function(config, leftDataIndex, rightDataIndex){
		var config_groupGap = config.getConfigItemValue("groupGap");
		var t = typeof config_groupGap;
		if(t === "number")
			return config_groupGap;
		else if(t === "function")
			return util.try2Call(config_groupGap, null, leftDataIndex, rightDataIndex);
		else{
			console.error("Unknown group gap('groupGap') value: " + config_groupGap + ", using constant 0 instead.");
			return 0;
		}
	};


	util.defineReadonlyProperty(TradeChart2, "CommonChart", CommonChart);
})();