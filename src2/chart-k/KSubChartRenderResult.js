;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;
	var KChartSketch = TradeChart2.KChartSketch;

	var numBig = function(big){
		return Number(big.toString());
	};
	var roundBig = function(big){
		return Math.round(numBig(big));
	};
	var ceilBig = function(big){
		return Math.ceil(numBig(big));
	};
	var floorBig = function(big){
		return Math.floor(numBig(big));
	};

	/**
	 * @constructor
	 * K线子图绘制结果
	 * @param {KSubChart} kSubChart 关联的，生成绘制结果的K线子图实例
	 * @param {KChartSketch} kChartSketch K线图形素描
	 * @param {KSubChartSketch} kSubChartSketch K线子图形素描
	 * @param {HTMLCanvasElement} canvasObj 绘制的画布所在的DOM元素
	 * @param {KSubChartConfig} config 绘制过程使用的配置
	 */
	var KSubChartRenderResult = function(kSubChart, kChartSketch, kSubChartSketch, canvasObj, config){
		var self = this;

		/**
		 * 获取绘制所使用的指定名称的配置项取值
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getConfigItem = function(name){
			return kSubChart.getConfigItem(name);
		};

		/**
		 * 获取K线图形素描
		 * @returns {KChartSketch}
		 */
		this.getKChartSketch = function(){
			return kChartSketch;
		};

		/**
		 * 获取K线子图形素描
		 * @returns {KSubChartSketch}
		 */
		this.getKSubChartSketch = function(){
			return kSubChartSketch;
		};

		/**
		 * 获取渲染使用的子图渲染配置
		 * @returns {KSubChartConfig}
		 */
		this.getKSubChartConfig = function(){
			return config;
		};

		/**
		 * 获取呈现绘制结果的画布DOM元素
		 * @returns {HTMLCanvasElement} 绘制的画布所在的DOM元素
		 */
		this.getCanvasDomElement = function(){
			return canvasObj;
		};

		/**
		 * 获取关联的，生成绘制结果的K线子图实例
		 * @returns {KSubChart}
		 */
		this.getKSubChart = function(){
			return kSubChart;
		};

		/**
		 * 获取关联的，持有“生成绘制结果的K线子图”的K线图实例
		 * @returns {KChart}
		 */
		this.getKChart = function(){
			return kSubChart.getKChart();
		};

		/**
		 * 获取可以渲染的最多的数据个数
		 * @returns {Number}
		 */
		this.getMaxGroupCount = function(){
			return KChartSketch.calcMaxGroupCount(this.getKChart().getConfig(), util.calcRenderingWidth(canvasObj, this.getConfigItem("width")));
		};

		/**
		 * 获取渲染出来的数据个数
		 * @returns {Number}
		 */
		this.getRenderingGroupCount = function(){
			var kChart = this.getKChart();
			var maxGroupCount = this.getMaxGroupCount(),
				dataCount = kChart.getRenderingDataCount();
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
			return this.getKChart().getKDataManager().getConvertedRenderingDataList(this.getRenderingGroupCount());
		};

		/**
		 * 获取图形正文的横向绘制偏移（用于满足场景：'数据量不足以展现满屏时，需要保证图形显示在左侧，而非右侧'）
		 * @returns {Number} 取值为正，代表图形正文向左偏移
		 */
		this.getChartContentHorizontalRenderingOffset = function(){
			return kSubChart.getChartContentHorizontalRenderingOffset(kChartSketch);
		};

		/**
		 * 根据给定的相对横坐标位置，获取距离右侧边界位置的空间中渲染的数据个数（包括给定位置所匹配的数据）
		 * @param {Number} x 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 */
		var getRightSideDataCount = function(x){
			var kChart = kSubChart.getKChart();
			x -= kChart.getRenderingOffset();
			x += self.getChartContentHorizontalRenderingOffset();

			var h = kChart.calcHalfGroupBarWidth();
			var minX = Math.floor(kChart.calcAxisXContentLeftPosition()) - h;
			var maxX = minX + kChartSketch.getContentWidth() - 1 + 2 * h;

			if (x < minX || x > maxX){
				console.warn("No in region", x, minX, maxX);
				return -1;
			}

			var kDataManager = kChart.getKDataManager();
			var firstIndex = kDataManager.getFirstRenderingDataIndexFromRight();
			if(-1 === firstIndex){
				console.warn("No data rendered.");
				return -1;
			}

			var b = self.getConfigItem("groupBarWidth"),
				g = self.getConfigItem("groupGap");
			var groupSize = b + g;

			var tmpX = maxX - x;
			var c = Math.floor(tmpX / groupSize),
				t = tmpX % groupSize;
			if(t >= b + Math.floor(g / 2))
				c += 1;

			return c;
		};

		/**
		 * 获取指定的相对横坐标对应的数据索引
		 * @param {Number} x 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @returns {Number} 相对横坐标对应的数据索引。如果位置在区域左侧，则返回0；如果在区域右侧，则返回最后一条数据的索引。如果数据区域中没有任何数据，则返回-1
		 */
		this.getRenderingDataIndex = function(x){
			var t = getRightSideDataCount(x);
			if(-1 === t){
				console.warn("No data rendered on the right side");
				return -1;
			}

			var firstIndex = kSubChart.getKChart().getKDataManager().getFirstRenderingDataIndexFromRight();
			var index = firstIndex - t;
			// console.log("getRenderingDataIndex:", x, index, firstIndex, t);
			return index;
		};

		/**
		 * 根据给定的数据索引，获取其在画布上 的渲染位置（中心位置）
		 * @param {Number} dataIndex 被渲染的数据的索引位置（相对于整个数据）
		 * @returns {Number} 渲染位置，亦即数据的中心位置在画布上的横坐标。坐标原点为画布的左上角。如果数据没有被渲染，则返回-1
		 */
		this.getRenderingHorizontalPosition = function(dataIndex){
			var kChart = kSubChart.getKChart();

			var firstIndex = kSubChart.getKChart().getKDataManager().getFirstRenderingDataIndexFromRight();
			if(firstIndex === -1){
				console.log("No data rendered");
				return -1;
			}

			var lastIndex = firstIndex - this.getRenderingGroupCount() - 1;
			if(dataIndex < lastIndex || dataIndex > firstIndex){
				console.warn("Not in data region ", dataIndex, firstIndex, lastIndex);
				return -1;
			}

			var b = self.getConfigItem("groupBarWidth"),
				g = self.getConfigItem("groupGap");
			var groupSize = b + g;

			var x = kChart.calcAxisXContentRightPosition(kChartSketch.getCanvasWidth()) - (firstIndex - dataIndex) * groupSize + kChart.getRenderingOffset() - this.getChartContentHorizontalRenderingOffset();
			return util.getLinePosition(x);
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
		 * 使用渲染配置初始化给定的画布，用于实现“将呈现绘制结果的画布的属性同样应用到其它画布上，以辅助实现画布层叠显示需要”的效果
		 * @param {HTMLCanvasElement} canvasObj 要被初始化的画布
		 * @returns {CanvasRenderingContext2D} 被初始化的画布的上下文
		 */
		this.initCanvas = function(canvasObj){
			return util.initCanvas(canvasObj, this.getConfigItem("width"), this.getConfigItem("height"));
		};
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartRenderResult", KSubChartRenderResult);
})();