;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;
	var KChartSketch = TradeChart2.KChartSketch;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * @constructor
	 * K线子图绘制结果
	 * @param {KSubChart} kSubChart 关联的，生成绘制结果的K线子图实例
	 * @param {HTMLCanvasElement} canvasObj 绘制的画布所在的DOM元素
	 */
	var KSubChartRenderResult = function(kSubChart, canvasObj){
		var self = this;

		var kChartSketch,
			kSubChartSketch,
			dataSketch;

		/**
		 * 获取绘制所使用的指定名称的配置项取值
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getConfigItemValue = function(name){
			return kSubChart.getConfigItemValue(name);
		};

		/**
		 * 设置K线图形素描
		 * @param {KChartSketch} _kChartSketch 图形素描
		 * @returns {KSubChartRenderResult}
		 */
		this.setKChartSketch = function(_kChartSketch){
			kChartSketch = _kChartSketch;
			return this;
		};
		/**
		 * 获取K线图形素描
		 * @returns {KChartSketch} 图形素描
		 */
		this.getKChartSketch = function(){
			return kChartSketch;
		};

		/**
		 * 设置K线子图图形素描
		 * @param {KSubChartSketch}_kSubChartSketch K线子图图形素描
		 * @returns {KSubChartRenderResult}
		 */
		this.setKSubChartSketch = function(_kSubChartSketch){
			kSubChartSketch = _kSubChartSketch;
			return this;
		};
		/**
		 * 获取K线子图图形素描
		 * @returns {KSubChartSketch} K线子图图形素描
		 */
		this.getKSubChartSketch = function(){
			return kSubChartSketch;
		};

		/**
		 * 设置K线数据素描
		 * @param {CommonDataSketch} _dataSketch K线数据素描
		 * @returns {KSubChartRenderResult}
		 */
		this.setDataSketch = function(_dataSketch){
			dataSketch = _dataSketch;
			return this;
		};
		/**
		 * 获取K线数据素描
		 * @returns {CommonDataSketch} K线数据素描
		 */
		this.getDataSketch = function(){
			return dataSketch;
		};

		/**
		 * 获取呈现绘制结果的画布DOM元素
		 * @returns {HTMLCanvasElement} 绘制的画布所在的DOM元素
		 */
		this.getCanvasDomElement = function(){
			return canvasObj;
		};

		/**
		 * 清除画布
		 * @returns {KSubChartRenderResult}
		 */
		this.clearCanvas = function(){
			canvasObj.getContext("2d").clearRect(0, 0, canvasObj.width, canvasObj.height);
			return this;
		};

		/**
		 * 获取关联的，持有“生成绘制结果的K线子图”的K线图实例
		 * @returns {KChart}
		 */
		this.getKChart = function(){
			return kSubChart.getKChart();
		};

		/**
		 * 获取关联的，生成绘制结果的K线子图实例
		 * @returns {KSubChart}
		 */
		this.getKSubChart = function(){
			return kSubChart;
		};

		/**
		 * 获取可以渲染的最多的数据个数
		 * @returns {Number}
		 */
		this.getMaxGroupCount = function(){
			return KChartSketch.calcMaxGroupCount(this.getKChart().getConfig(), util.calcRenderingWidth(canvasObj, this.getConfigItemValue("width")));
		};

		/**
		 * 获取渲染出来的数据个数
		 * @returns {Number}
		 */
		this.getRenderingGroupCount = function(){
			var kChart = this.getKChart();
			var maxGroupCount = this.getMaxGroupCount(),
				dataCount = kChart.getRenderingGroupCount();
			return Math.max(Math.min(maxGroupCount, dataCount), 0);
		};

		/**
		 * 获取可以渲染出来的数据列表
		 * @returns {Array<KData|Object>}
		 */
		this.getRenderingDataList = function(){
			return this.getKChart().getRenderingDataList(this.getRenderingGroupCount());
		};

		/**
		 * 获取可以渲染出来的，被转换后的数据列表
		 * @returns {Array<KData>}
		 */
		this.getConvertedRenderingDataList = function(){
			return this.getKChart().getDataManager().getConvertedRenderingDataList(this.getRenderingGroupCount());
		};

		/**
		 * 获取图形正文的横向绘制偏移（用于满足场景：'数据量不足以展现满屏时，需要保证图形显示在左侧，而非右侧'）
		 * @returns {Number} 取值为正，代表图形正文向左偏移
		 */
		this.getChartContentHorizontalRenderingOffset = function(){
			return kSubChart._getChartContentHorizontalRenderingOffsetFromRight(kChartSketch);
		};

		/**
		 * 获取自左向右第一个渲染的数据自左向右的索引位置
		 * @returns {Number}
		 */
		this.getLeftMostRenderingDataIndex = function(){
			var dataManager = this.getKChart().getDataManager();
			var rightMostRenderingDataIndex = dataManager.getRightMostRenderingDataIndex();
			if(-1 === rightMostRenderingDataIndex){
				TradeChart2.showLog && console.warn("No data rendered.");
				return -1;
			}

			var renderingGroupCount = this.getRenderingGroupCount();
			if(renderingGroupCount === 0)
				return -1;

			return rightMostRenderingDataIndex - renderingGroupCount + 1;
		};

		/**
		 * 获取指定的相对横坐标对应的数据索引
		 * @param {Number} x 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @returns {Number} 相对横坐标对应的数据索引。如果位置在区域左侧，则返回0；如果在区域右侧，则返回最后一条数据的索引。如果数据区域中没有任何数据，则返回-1
		 */
		this.getRenderingDataIndex = function(x){
			var kChart = kSubChart.getKChart();

			var h = kChart._calcHalfGroupBarWidth();
			var minX = Math.floor(kChart._calcAxisXContentLeftPosition()) - h;
			var maxX = (minX + h) + kChartSketch.getContentWidth() - 1 + h;

			if (x < minX || x > maxX){
				TradeChart2.showLog && console.warn("Not in region.", x, minX, maxX);
				return -1;
			}

			var dataManager = kChart.getDataManager();
			var rightMostRenderingDataIndex = dataManager.getRightMostRenderingDataIndex();
			if(-1 === rightMostRenderingDataIndex){
				TradeChart2.showLog && console.warn("No data rendered.");
				return -1;
			}

			var b = self.getConfigItemValue("groupBarWidth");

			var rightMostDataPosition = kSubChart._getRightMostDataHorizontalRenderingPosition(self.getKChartSketch());
			var tmpX = rightMostDataPosition - x, index = rightMostRenderingDataIndex;

			while(true){
				var leftIndex = index - 1;
				if(leftIndex < 0)
					break;

				var gap = kChart.getGroupGap(leftIndex, index);
				var halfGap = Math.ceil(gap / 2);
				if(tmpX < h + halfGap)
					break;

				index -= 1;
				tmpX -= gap + b;
			}

			return index;
		};

		/**
		 * 根据给定的数据索引，获取其在画布上的渲染位置（中心位置）
		 * @param {Number} dataIndex 被渲染的数据的索引位置（相对于整个数据）
		 * @returns {Number} 渲染位置，亦即数据的中心位置在画布上的横坐标。坐标原点为画布的左上角。如果数据没有被渲染，则返回-1
		 */
		this.getRenderingHorizontalPosition = function(dataIndex){
			var kChart = kSubChart.getKChart();

			var rightMostRenderingDataIndex = kSubChart.getKChart().getDataManager().getRightMostRenderingDataIndex();
			if(rightMostRenderingDataIndex === -1){
				TradeChart2.showLog && console.log("No data rendered");
				return -1;
			}

			var leftMostRenderingDataIndex = rightMostRenderingDataIndex - this.getRenderingGroupCount() - 1;
			if(dataIndex < leftMostRenderingDataIndex || dataIndex > rightMostRenderingDataIndex){
				TradeChart2.showLog && console.warn("Not in data region for index: " + dataIndex + ". Max: " + rightMostRenderingDataIndex + ", min: " + leftMostRenderingDataIndex);
				return -1;
			}

			var rightMostDataPosition = kSubChart._getRightMostDataHorizontalRenderingPosition(self.getKChartSketch());
			var config_groupBarWidth = self.getConfigItemValue("groupBarWidth");

			var totalGapSize = kChart.sumGroupGap(dataIndex, rightMostRenderingDataIndex),
				totalBarSize = Math.abs(rightMostRenderingDataIndex - dataIndex) * config_groupBarWidth;

			var position = util.getLinePosition(rightMostDataPosition - totalGapSize - totalBarSize);
			var xLeft_axisX = kChart._calcAxisXLeftPosition(),
				xRight_axisX = kChart._calcAxisXRightPosition(kChartSketch.getCanvasWidth());
			if(position < xLeft_axisX || position > xRight_axisX)
				return -1;
			// console.log(111, dataIndex, rightMostDataPosition, totalGapSize, totalBarSize, "->", position);
			return position;
		};

		/**
		 * 获取指定的相对横坐标对应的原始数据
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @returns {KData|Object|null}
		 */
		this.getRenderingData = function(x){
			var index = this.getRenderingDataIndex(x);
			if(-1 === index)
				return null;

			return this.getKChart().getData(index);
		};

		/**
		 * 获取指定的相对横坐标对应的被转换后的数据
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @returns {KData|null}
		 */
		this.getConvertedRenderingData = function(x){
			var index = this.getRenderingDataIndex(x);
			if(-1 === index)
				return null;

			return this.getKChart().getConvertedData(index);
		};

		/**
		 * 将当前画布的渲染配置应用到给定的其它画布上，以辅助实现画布层叠显示需要
		 * @param {HTMLCanvasElement} canvasObj 要被初始化的画布
		 * @returns {CanvasRenderingContext2D} 被初始化的画布的上下文
		 */
		this.applyRenderingCanvasSettingTo = function(canvasObj){
			return util.initCanvas(canvasObj, this.getConfigItemValue("width"), this.getConfigItemValue("height"));
		};

		/**
		 * 根据给定的量计算其在画布上对应的纵坐标位置
		 * @param {Number} amount 纵坐标量
		 * @returns {*}
		 */
		this._calcYPosition = function(amount){
			if(null == kSubChartSketch || null == dataSketch)
				return null;

			return util.getLinePosition(kSubChart.getConfigItemValue("paddingTop") + kSubChartSketch.calculateHeight(Math.abs(dataSketch.getAmountCeiling() - amount)));
		};
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartRenderResult", KSubChartRenderResult);
})();