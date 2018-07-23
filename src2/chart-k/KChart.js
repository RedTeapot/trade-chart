;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	/**
	 * @typedef KData
	 * @type {Object}
	 *
	 * @property {String} time 时间
	 * @property {Number} openPrice 开盘价
	 * @property {Number} highPrice 最高价
	 * @property {Number} lowPrice 最低价
	 * @property {Number} closePrice 收盘价
	 */


	/**
	 * 默认的，作用于主图和子图的全局配置项
	 * @type {Object<String, *>}
	 */
	var defaultGlobalChartConfig = {
		width: "100%",/** 图表整体宽度 */

		paddingTop: 20,/** 图表内边距 - 上侧 */
		paddingBottom: 20,/** 图表内边距 - 下侧 */
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

		showHorizontalGridLine: true,/** 是否绘制网格横线 */
		showVerticalGridLine: true,/** 是否绘制网格横线 */
		horizontalGridLineColor: "#A0A0A0",/** 网格横线颜色 */
		verticalGridLineColor: "#A0A0A0",/** 网格竖线颜色 */
		gridLineDash: [1, 3, 3],/** 网格横线的虚线构造方法。如果需要用实线，则用“[1]”表示 */
	};


	/**
	 * @constructor
	 * 绘制的K线子图
	 */
	var RenderedKSubChart = function(){
		/**
		 * 获取渲染用到的配置数据
		 */
		this.getConfig = function(){
			console.error("Not implemented.");
		};
	};

	/**
	 * @constructor
	 * K线子图
	 * @param {String} type 子图类型。如：volume - 量图；ma - MA指标图
	 */
	var KSubChart = function(type){
		/**
		 * 获取该子图的子图类型
		 * @returns {String}
		 */
		this.getType = function(){
			return type;
		};

		/**
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} config 渲染配置
		 * @returns {RenderedKSubChart} 绘制的K线子图
		 */
		this.render = function(canvasObj, config){
			console.warn("Not implemented for k sub chart: " + this.getType());
		};
	};

	/**
	 * @constructor
	 * K线图（OHLC图）
	 */
	var KChart = function(){
		TradeChart2.apply(this, arguments);

		/** 数据数组 */
		var datas;

		/** 数据转换方法，用于将提供的数据数组转为本图表兼容的格式 */
		var dataParser;

		/** 附加的K线子图列表 */
		var attachedKSubCharts = [];


		/**
		 * 设置数据源
		 * @param _datas {KData[]} 数据源
		 */
		this.setDatas = function(_datas){
			datas = _datas;
			return this;
		};

		/**
		 * 获取设置的数据源
		 */
		this.getDatas = function(){
			return datas;
		};

		/**
		 * 设置数据转换方法
		 * @param parser {Function} 数据转换方法
		 */
		this.setDataParser = function(parser){
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
		 * 附加子图
		 * @param {KSubChart} subChart 要附加的子图
		 */
		this.attachSubChart = function(subChart){
			if(attachedKSubCharts.indexOf(subChart) == -1)
				attachedKSubCharts.push(subChart);

			return this;
		};

		/**
		 * 移除子图
		 * @param {KSubChart} subChart 要移除的子图
		 */
		this.detachSubChart = function(subChart){
			var index = attachedKSubCharts.indexOf(subChart);
			if(index != -1)
				attachedKSubCharts.splice(index, 1);

			return this;
		};
	};
	KChart.prototype = Object.create(TradeChart2.prototype);

	KChart.KSubChart = KSubChart;
	KChart.RenderedKSubChart = RenderedKSubChart;

	/**
	 * 子图图表类集合
	 */
	var subCharts = {};

	/**
	 * 子图图表定义
	 * @param {String} name 图表名称
	 * @param {Function} obj 图表实现
	 */
	KChart.defineSubChart = function(name, obj){
		if(name in subCharts)
			throw new Error("Sub chart of name: " + name + " exists already.");

		subCharts[name] = obj;
	};
	Object.defineProperty(KChart, "subChart", {value: subCharts, configurable: false, writable: false});

	TradeChart2.defineChart("KChart", KChart);
})();