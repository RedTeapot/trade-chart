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
	 * @param {HTMLCanvasElement} canvasObj 绘制的画布所在的DOM元素
	 * @param {KSubChartConfig} config 绘制过程使用的配置
	 */
	var KSubChartRenderResult = function(kSubChart, canvasObj, config){
		var self = this;

		/**
		 * 获取绘制所使用的指定名称的配置项取值
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getConfigItem = function(name){
			var v = kSubChart.getConfigItem(name, config);
			if("width" === name)
				v = util.calcRenderingWidth(canvasObj, v);
			else if("height" === name)
				v = util.calcRenderingHeight(canvasObj, v);

			return v;
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
		 * 获取可以渲染出来的数据个数
		 * @returns {Number}
		 */
		this.getRenderingGroupCount = function(){
			var kChart = this.getKChart();
			var maxGroupCount = KChartSketch.calcMaxGroupCount(kChart.getConfig(), util.calcRenderingWidth(canvasObj, this.getConfigItem("width"))),
				dataCount = kChart.getRenderingDataList().length;
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
		 * 获取图形正文区域的最小横坐标值，对应于最左侧蜡烛的中间位置
		 */
		var getMinX = function(){
			var config_paddingLeft = self.getConfigItem("paddingLeft"),
				config_axisXTickOffset = self.getConfigItem("axisXTickOffset");

			return Math.floor(config_paddingLeft + config_axisXTickOffset);
		};

		/**
		 * 获取图形正文区域的最大横坐标值，对应于做最右侧蜡烛的中间位置
		 */
		var getMaxX = function(){
			var config_width = util.calcRenderingWidth(canvasObj, self.getConfigItem("width")),
				config_paddingRight = self.getConfigItem("paddingRight"),
				config_axisXTickOffsetFromRight = self.getConfigItem("axisXTickOffsetFromRight");
			return Math.floor(config_width - config_paddingRight - config_axisXTickOffsetFromRight);
		};

		/**
		 * 获取第一条可见数据的索引位置
		 * @returns {number}
		 */
		var getFirstVisibleDataIndex = function(){
			var kDataManager = self.getKChart().getKDataManager();
			return kDataManager.getDataList().length - kDataManager.getElapsedNewerDataCount() - self.getRenderingGroupCount();
		};

		/**
		 * 获取指定的相对横坐标对应的数据索引
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @returns {Number} 相对横坐标对应的数据索引。如果位置在区域左侧，则返回0；如果在区域右侧，则返回最后一条数据的索引。如果数据区域中没有任何数据，则返回-1
		 */
		this.getRenderingDataIndex = function(x){
			var groupCount = this.getRenderingGroupCount();
			var minX = getMinX(),
				maxX = getMaxX();

			if (x < minX || x > maxX){
				return -1;
			}

			var tmpX = x - minX;
			var groupSizeBig = new Big(this.getConfigItem("groupBarWidth")).plus(this.getConfigItem("groupGap"));

			var tmp = new Big(tmpX).div(groupSizeBig);
			var index = roundBig(tmp);

			if(index >= groupCount){
				if(groupCount > 0)
					index = groupCount - 1;
				else
					index = -1;
			}

			return index + getFirstVisibleDataIndex();
		};

		/**
		 * 根据给定的数据索引，获取其在画布上的渲染位置（中心位置）
		 * @param {Number} dataIndex 被渲染的数据的索引位置
		 * @returns {Number} 渲染位置，亦即数据的中心位置在画布上的横坐标。坐标原点为画布的左上角。如果数据没有被渲染，则返回-1
		 */
		this.getRenderingHorizontalPosition = function(dataIndex){
			dataIndex -= getFirstVisibleDataIndex();
			var renderingGroupCount = this.getRenderingGroupCount();
			if(dataIndex < 0 || dataIndex >= renderingGroupCount)
				return -1;

			var config_axisXTickOffset = this.getConfigItem("axisXTickOffset"),
				config_paddingLeft = this.getConfigItem("paddingLeft"),
				config_groupGap = this.getConfigItem("groupGap"),
				config_groupBarWidth = this.getConfigItem("groupBarWidth");

			var xLeft_axisX = util.getLinePosition(config_paddingLeft),
				groupSizeBig = new Big(config_groupBarWidth + config_groupGap);

			return util.getLinePosition(xLeft_axisX + config_axisXTickOffset + kSubChart.getKChart().getRenderingOffset() + numBig(groupSizeBig.mul(dataIndex)));
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