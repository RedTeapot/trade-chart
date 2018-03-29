;(function(){
	var TradeChart = window.TradeChart;
	var util = TradeChart.util;

	/** 默认图形绘制选项 */
	var defaultChartConfig = {
		width: "100%",/* 整体图形宽度 */
		height: 300,/* 整体图形高度 */

		/** 图形内边距（坐标系外边距） */
		paddingTop: 20,
		paddingBottom: 20,
		paddingLeft: 60,
		paddingRight: 20,

		groupLineWidth: 1,/** 蜡烛线的宽度。最好为奇数，从而使得线可以正好在正中间 */
		groupBarWidth: 5,/** 蜡烛的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间 */
		groupGap: 3,/** 相邻两组数据之间的间隔 */

		axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
		axisLabelFont: "normal 10px sans-serif, serif",/** 坐标标签字体 */
		axisLabelColor: null,/** 坐标标签颜色 */
		axisLineColor: null,/** 坐标轴颜色 */

		axisXTickOffset: 5,/* 横坐标刻度距离原点的位移（无论Y轴显示在哪侧，都应用在左侧） */
		axisXTickOffsetFromRight: 0,/* 最后一个横坐标刻度距离横坐标结束位置的位移 */
		axisXLabelOffset: 5,/* 横坐标标签距离坐标轴刻度线的距离 */
		axisXLabelSize: 55,/* 横坐标标签文字的长度（用于决定以何种方式绘制最后一个刻度：只绘制边界刻度，还是边界刻度和最后一个刻度都绘制） */

		axisYPosition: "left",/** 纵坐标位置。left：左侧；right：右侧 */
		axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移 */
		axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
		axisYPrecision: 2,/** 纵坐标的数字精度（仅在没有指定配置项：axisYFormatter时有效。如果指定了axisYFormatter，将直接使用指定的格式化方法返回的值） */
		axisYFormatter: function(price, config){/** 纵坐标数字格式化方法 */
			/** price：价格；config：配置 */
			return util.formatMoney(price, config.axisYPrecision);
		},
		axisYLabelVerticalOffset: 0,/** 纵坐标标签纵向位移 */
		axisYLabelOffset: 5,/* 纵坐标标签距离坐标轴刻度线的距离 */
		axisYPriceFloor: function(min, max, avgVariation, maxVariation){
			return min - avgVariation / 2;
		},
		axisYPriceCeiling: function(min, max, avgVariation, maxVariation){
			return max + avgVariation / 2;
		},

		gridLineDash: [1, 3, 3],/** 网格横线的虚线构造方法。如果需要用实线，则用“[1]”表示 */
		showHorizontalGridLine: true,/** 是否绘制网格横线 */
		horizontalGridLineColor: "#A0A0A0",/** 网格横线颜色 */

		showVerticalGridLine: true,/** 是否绘制网格横线 */
		verticalGridLineColor: "#A0A0A0",/** 网格竖线颜色 */

		appreciatedColor: "red",/** 收盘价大于开盘价时的绘制蜡烛和线时用的画笔和油漆桶颜色 */
		depreciatedColor: "#21CB21",/** 收盘价小于开盘价时的绘制蜡烛和线时用的画笔和油漆桶颜色 */
		keepedColor: "white",/** 收盘价等于开盘价时的绘制蜡烛和线时用的画笔和油漆桶颜色 */

		coordinateBackground: null,/** 坐标系围成的矩形区域的背景色 */

		showVolume: false,  /** 是否显示量图 */
		volumeAreaRatio: 0.33, /** 量图区域所占比例 0~1 */
		volumeMarginTop: 15,/** 量图区的顶部外边距 （即与图形区的间距）*/
		volumeAxisYTickOffset: 0, /** 量图纵坐标刻度距离原点的位移 */
		volumeAxisYMidTickQuota: 2, /** 纵坐标刻度个数（不包括最小值和最大值） */
		axisYVolumeFloor: null, /** 纵坐标最小刻度, 为null时自动 */
		volumeColor: "orange", /** 量图颜色（柱状图）*/

		showMAArr: [5, 10, 20, 30], /** 要显示的MA线 */
		MAColorArr: ["orange", "blue", "purple", "black"], /** 每条MA线对应的颜色 */
		MALabelX: 60, /** MA标题的起始位置横坐标 */
		MALabelY: 10, /** MA标题的起始位置纵坐标 */
		MALabelSpace: 10 /** MA标题间距 */
	};

	/**
	 * 根据给定的配置信息计算绘制所需要的图形信息
	 * @param {HTMLCanvasElement} canvasObj Canvas DOM元素
	 * @param {JsonObject} config 渲染配置
	 */
	var sketchChart = function(config){
		var width = config.width,
			height = config.height;

		var chartSketch = {
			width: 0,/** 图表的宽度 */
			contentWidth: 0,/** 图表内容的宽度 */
			height: 0,/** 图表的高度 */
			contentHeight: 0,/** 图表内容的高度 */
			volumeHeight: 0,/** 量图高度 */
			volumeContentHeight: 0,/** 量图内容的高度 */
			maxGroupCount: 0,/** 可呈现的最多的数据组的个数 */
			priceHeightRatio: 0,/** 高度与价格之间的映射比例 */
			volumeHeightRatio: 0/** 交易量与高度之间的映射比例 */
		};

		var ifShowAxisYLeft = "left" == String(config.axisYPosition).toLowerCase();

		chartSketch.width = Math.floor(config.width - config.paddingLeft - config.paddingRight);
		chartSketch.contentWidth = Math.floor(chartSketch.width - config.axisXTickOffset - config.axisXTickOffsetFromRight);
		/* 量图 */
		if(config.showVolume){
			chartSketch.height = Math.round(config.height * (1 - config.volumeAreaRatio) - config.paddingTop - config.volumeMarginTop);
			chartSketch.volumeHeight = Math.round(config.height * config.volumeAreaRatio - config.paddingBottom);
			chartSketch.volumeContentHeight = Math.floor(chartSketch.volumeHeight - config.volumeAxisYTickOffset);
		}else{
			chartSketch.height = Math.floor(config.height - config.paddingTop - config.paddingBottom);
		}
		chartSketch.contentHeight = Math.floor(chartSketch.height - config.axisYTickOffset);
		chartSketch.maxGroupCount = Math.floor((chartSketch.contentWidth - config.groupLineWidth) / (config.groupGap + config.groupBarWidth)) + 1;

		return chartSketch;
	};

	/**
	 * 根据给定的配置信息和画布元素，计算最多可以绘制的数据个数
	 * @param {HTMLCanvasElement} canvasObj Canvas DOM元素
	 * @param {JsonObject} config 渲染配置
	 */
	var calcMaxGroupCount = function(canvasObj, config){
		config = util.cloneObject(config, true);

		/** 百分比尺寸自动转换 */
		if(/%/.test(config.width))
			config.width = canvasObj.parentElement.clientWidth * parseInt(config.width.replace(/%/, "")) / 100;
		if(/%/.test(config.height))
			config.height = canvasObj.parentElement.clientHeight * parseInt(config.height.replace(/%/, "")) / 100;

		return sketchChart(config).maxGroupCount;
	};

	/**
	 * 根据给定的配置信息计算蜡烛一半的宽度
	 */
	var calcHalfGroupBarWidth = function(config){
		var halfGroupBarWidth = Math.floor((config.groupBarWidth - config.groupLineWidth) / 2 + (config.groupLineWidth - 1) / 2);
		return halfGroupBarWidth;
	};

	/**
	 * 扫描提供的数据，生成绘制所需的元数据
	 * @param datas {JsonArray} 数据数组
	 * @param dataParser {Function} 数据转换方法
	 * @param config {JsonObject} 渲染配置
	 * @return {JsonObject} 元数据集合
	 */
	var sketch = function(datas, dataParser, config){
		var dataSketch = {
			origin: {
				max: -Infinity,/* 最大价格 */
				min: Infinity,/* 最小价格 */
				avgVariation: 0,/* 价格的平均变动幅度 */
				maxVariation: 0,/* 价格的最大变动幅度 */
				maxVolume: -Infinity,/* 最大交易量 */
				minVolume: Infinity,/* 最小交易量 */
				avgVolumeVariation: 0,/* 交易量的平均变动幅度 */
				maxVolumeVariation: 0/* 交易量的最大变动幅度 */
			},
			extended: {
				priceCeiling: 0,/* 坐标中价格的最大值 */
				priceFloor: 0,/* 坐标中价格的最小值 */
				volumeCeiling: 0,/* 坐标中成交量的最大值 */
				volumeFloor: 0/* 坐标中成交量的最小值 */
			}
		}, chartSketch = sketchChart(config);

		/* 数据概览扫描 */
		var previous = {volume: 0};
		var variationSum = 0, volumeVariationSum = 0;
		for(var i = 0; i < datas.length && i < chartSketch.maxGroupCount; i++){
			var d = datas[i];
			/* 数据格式转换 */
			d = dataParser? dataParser(d, i, datas): d;

			var max = Math.max(+d.openPrice, +d.highPrice, +d.lowPrice, +d.closePrice),
				min = Math.min(+d.openPrice, +d.highPrice, +d.lowPrice, +d.closePrice);
			config.showMAArr.forEach(function(num){
				if(d["MA"+num] != null){
					max =  Math.max(+d["MA"+num], max);
					min =  Math.min(+d["MA"+num], min);
				}
			});
			if(max > dataSketch.origin.max)
				dataSketch.origin.max = max;
			if(min < dataSketch.origin.min)
				dataSketch.origin.min = min;
			if(+d.volume > dataSketch.origin.maxVolume)
				dataSketch.origin.maxVolume = +d.volume;
			if(+d.volume < dataSketch.origin.minVolume)
				dataSketch.origin.minVolume = +d.volume;

			var variation = Math.abs(max - min);
			var volumeVariation = Math.abs(+d.volume - +previous.volume);

			/* 确定更大的价格变动幅度 */
			if(variation > dataSketch.origin.maxVariation)
				dataSketch.origin.maxVariation = variation;
			if(volumeVariation > dataSketch.origin.maxVolumeVariation)
				dataSketch.origin.maxVolumeVariation = volumeVariation;

			variationSum += variation;
			volumeVariationSum += volumeVariation;

			previous.volume = d.volume;
		}
		dataSketch.origin.avgVariation = variationSum / datas.length;
		dataSketch.origin.avgVolumeVariation = volumeVariationSum / datas.length;

		if(null != config.axisYPriceFloor){
			if(typeof config.axisYPriceFloor == "function")
				dataSketch.extended.priceFloor = config.axisYPriceFloor(dataSketch.origin.min, dataSketch.origin.max, dataSketch.origin.avgVariation, dataSketch.origin.maxVariation);
			else
				dataSketch.extended.priceFloor = Number(config.axisYPriceFloor);
		}else
			dataSketch.extended.priceFloor = dataSketch.origin.min - (dataSketch.origin.avgVariation / 2);
		if(null != config.axisYPriceCeiling){
			if(typeof config.axisYPriceCeiling == "function")
				dataSketch.extended.priceCeiling = config.axisYPriceCeiling(dataSketch.origin.min, dataSketch.origin.max, dataSketch.origin.avgVariation, dataSketch.origin.maxVariation);
			else
				dataSketch.extended.priceCeiling = Number(config.axisYPriceCeiling);
		}else
			dataSketch.extended.priceCeiling = dataSketch.origin.max + (dataSketch.origin.avgVariation / 2);
		dataSketch.extended.priceFloor = dataSketch.extended.priceFloor < 0? 0: dataSketch.extended.priceFloor;
		dataSketch.extended.priceCeiling = dataSketch.extended.priceCeiling < dataSketch.origin.max? dataSketch.origin.max: dataSketch.extended.priceCeiling;
		dataSketch.extended.priceCeiling = (dataSketch.extended.priceCeiling - dataSketch.extended.priceFloor < 2E-7)? (dataSketch.extended.priceFloor + 1): dataSketch.extended.priceCeiling;

		if(null != config.axisYVolumeFloor)
			dataSketch.extended.volumeFloor = Number(config.axisYVolumeFloor);
		else
			dataSketch.extended.volumeFloor = dataSketch.origin.minVolume - (dataSketch.origin.avgVolumeVariation / 2);
		dataSketch.extended.volumeCeiling = dataSketch.origin.maxVolume + (dataSketch.origin.avgVolumeVariation / 2);
		dataSketch.extended.volumeFloor = dataSketch.extended.volumeFloor < 0? 0: dataSketch.extended.volumeFloor;

		chartSketch.priceHeightRatio = (dataSketch.extended.priceCeiling - dataSketch.extended.priceFloor) / chartSketch.contentHeight;
		chartSketch.volumeHeightRatio = (dataSketch.extended.volumeCeiling - dataSketch.extended.volumeFloor) / chartSketch.volumeContentHeight;

		return {data: dataSketch, chart: chartSketch};
	};

	/**
	 * 初始化画布（设置宽高、伸缩比例等）
	 * @param domContainerObj {HTMLCanvasElement} 画布
	 * @param config {JsonObject} 渲染配置
	 */
	var initCanvasAndConfig = function(canvasObj, config){
		/* 百分比尺寸自动转换 */
		if(/%/.test(config.width))
			config.width = canvasObj.parentElement.clientWidth * parseInt(config.width.replace(/%/, "")) / 100;
		if(/%/.test(config.height))
			config.height = canvasObj.parentElement.clientHeight * parseInt(config.height.replace(/%/, "")) / 100;
		util.setAttributes(canvasObj, {width: config.width, height: config.height});

		/* 高分辨率适应 */
		var pixelRatio = util.pixelRatio();
		if(pixelRatio > 1){
			canvasObj.style.width = config.width + "px";
			canvasObj.style.height = config.height + "px";

			canvasObj.width = pixelRatio * config.width;
			canvasObj.height = pixelRatio * config.height;

			var ctx = canvasObj.getContext("2d");
			ctx.scale(pixelRatio, pixelRatio);
		}
	};

	/**
	 * @constructor
	 * 已完成渲染的K线图
	 * @param kChart {KChart} K线图实例
	 * @param sketch {JsonObject} 数据和图形的扫描分析结果
	 * @param config {JsonObject} 渲染配置
	 * @param renderMetadata {JsonObject} 渲染时使用的基准数据
	 */
	var RenderedKChart = function(kChart, sketch, config, renderMetadata){
		if(!(kChart instanceof KChart))
			throw new Error("Invalid arguemnt. KChart instance is needed.");

		var self = this;

		/**
		 * 获取渲染用到的配置数据
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * 获取渲染时使用的基准数据
		 */
		this.getRenderMetadata = function(){
			return renderMetadata;
		};

		/**
		 * 获取被渲染的群组的个数
		 * @return {Integer} 被渲染的群组的个数
		 */
		this.getGroupCount = function(){
			return Math.min(kChart.getDatas().length, sketch.chart.maxGroupCount);
		};

		/**
		 * 获取图形正文区域的最小横坐标值
		 */
		var getMinX = function(){
			return Math.floor(config.paddingLeft + config.axisXTickOffset);

			// var ifShowAxisYLeft = "left" == String(config.axisYPosition).toLowerCase();
			// var t = config.paddingLeft;
			//
			// if(ifShowAxisYLeft)
			// 	return Math.floor(t + config.axisXTickOffset);
			// else
			// 	return Math.floor(t);
		};

		/**
		 * 获取图形正文区域的最大横坐标值
		 */
		var getMaxX = function(){
			return Math.floor(config.width - config.paddingRight);

			// var ifShowAxisYLeft = "left" == String(config.axisYPosition).toLowerCase();
			// var x = Math.floor(config.width - config.paddingRight);
			// return ifShowAxisYLeft? x: (x - config.axisXTickOffset);
		};

		/**
		 * 获取能够被渲染的原始数据列表
		 */
		this.getRenderingOriginalDatas = function(){
			var datas = kChart.getDatas() || [];
			var count = Math.min(this.getGroupCount(), datas.length);

			return datas.slice(0, count);
		};

		/**
		 * 获取指定的相对横坐标对应的数据索引
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @reutrn {Integer} 相对横坐标对应的数据索引。如果没有数据与之对应，则返回-1
		 */
		this.getDataIndex = function(x){
			var groupCount = this.getGroupCount();
			var minX = getMinX(),
				maxX = getMaxX();

			if (x < minX){
				x = minX;
			} else if (x > maxX){
				x = maxX;
			}

			var tmpX = x - minX;
			var index = Math.ceil(tmpX / Math.floor(config.groupBarWidth + config.groupGap)) - 1;
			if(index < 0 || index >= groupCount)
				return -1;

			return index;
		};

		/**
		 * 根据提供的点的索引位置返回格式转换前的原始数据
		 * @param {Integer} dataIndex 点的索引位置
		 */
		this.getOriginalData = function(dataIndex){
			var list = kChart.getDatas() || [];
			if(dataIndex < 0 || dataIndex >= list.length)
				return null;

			var d = list[dataIndex];
			return d;
		};

		/**
		 * 根据提供的点的索引位置返回格式转换后的数据
		 * @param {Integer} dataIndex 点的索引位置
		 */
		this.getConvertedData = function(dataIndex){
			var d = this.getOriginalData(dataIndex);
			if(null == d)
				return d;

			var dataParser = trendChart.getDataParser();
			if(typeof dataParser == "function")
				d = dataParser(d, dataIndex, kChart.getDatas() || []);

			return d;
		};

		/**
		 * 获取指定的相对横坐标对应的数据在画布上的坐标位置（左侧位置）
		 * @param {Number} x 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @param {StringEnum} [position=left] 返回的坐标的横坐标位置。left：左侧位置；center：中间位置
		 * @returns {JsonObject} 坐标位置，形如：{x: <x>, y: <y>}。如果没有数据与之对应，则返回null。
		 */
		this.getCoordinate = function(x, position){
			var dataIndex = this.getDataIndex(x);
			if(-1 == dataIndex)
				return null;

			if(arguments.length < 2 || util.isEmptyString(position))
				position = "left";
			position = String(position).trim().toLowerCase();

			var ifShowAxisYLeft = "left" == String(config.axisYPosition).toLowerCase();
			var groupSize = config.groupBarWidth + config.groupGap;

			var obj = {x: 0, y: -1};/** 纵坐标不确定 */
			var minX = getMinX();
			obj.x = minX + dataIndex * groupSize;

			// if(ifShowAxisYLeft){
			// 	var minX = getMinX();
			// 	obj.x = minX + dataIndex * groupSize;
			// }else{
			// 	var maxX = getMaxX(),
			// 		groupCount = this.getGroupCount();
			// 	obj.x = maxX - (groupCount - 1 - dataIndex) * groupSize;
			// }

			if("left" == position)
				obj.x -= calcHalfGroupBarWidth(config);

			return obj;
		};
	};

	/**
	 * @constructor
	 * K线图（OHLC图）
	 * 数据格式：{time: "", openPrice: <Number>, highPrice: <Number>, lowPrice: <Number>, closePrice: <Number>}
	 */
	var KChart = function(){
		TradeChart.apply(this, arguments);

		/** 数据数组 */
		var datas;
		/** 数据转换方法，用于将提供的数据数组转为本图表兼容的格式 */
		var dataParser;

		/**
		 * 设置数据源
		 * @param _datas {JsonArray} 数据源
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
		 * 渲染图形，并呈现至指定的画布中
		 * @param domContainerObj {HTMLCanvasElement} 画布
		 * @param config {JsonObject} 渲染配置
		 * @returns {RenderedKChart} 绘制的K线图
		 */
		this.render = function(canvasObj, config){
			config = util.cloneObject(config, true);
			config = util.setDftValue(config, defaultChartConfig);

			if(config.groupBarWidth < config.groupLineWidth + 2)
				throw new Error("Bar width should be bigger than group line width plus 2.");

			initCanvasAndConfig(canvasObj, config);
			var ctx = canvasObj.getContext("2d");

			var _sketch = sketch(datas, dataParser, config);
			console.log("K chart sketch", _sketch);
			console.log("K chart config", config);

			/** 蜡烛一半的宽度 */
			var halfGroupBarWidth = calcHalfGroupBarWidth(config);
			/** 一组数据的宽度 */
			var groupSize = config.groupBarWidth + config.groupGap;
			/** 一组数据宽度的一半 */
			var halfGroupSize = Math.max(groupSize / 2, config.axisXLabelSize / 2);
			/** 绘制的数据个数 */
			var groupCount = Math.min(_sketch.chart.maxGroupCount, datas.length);
			/** 横坐标刻度之间相差的数据的个数 */
			var axisXTickInterval = Math.ceil(config.axisXLabelSize / groupSize);
			/** 横坐标刻度个数 */
			var axisXTickCount = Math.floor(groupCount / axisXTickInterval);
			/** 相邻两个纵坐标刻度之间的价格悬差 */
			var axisYPriceInterval = (_sketch.data.extended.priceCeiling - _sketch.data.extended.priceFloor) / (config.axisYMidTickQuota + 1);
			/** 相邻两个纵坐标刻度之间的高度悬差 */
			var axisYHeightInterval = axisYPriceInterval / _sketch.chart.priceHeightRatio;

			var axisYPosition = String(config.axisYPosition).toLowerCase();
			var ifShowAxisYLeft = "left" == axisYPosition,
				ifShowAxisYRight = "right" == axisYPosition;

			var ifShowVerticalGridLine = config.showVerticalGridLine && config.verticalGridLineColor,
				ifShowHorizontalGridLine = config.showHorizontalGridLine && config.horizontalGridLineColor;

			var xLeft_axisX = Math.floor(config.paddingLeft) + 0.5,
				xRight_axisX = xLeft_axisX + Math.floor(_sketch.chart.width),
				y_axisX = Math.floor(config.paddingTop + _sketch.chart.height) + 0.5,
				y_volume_axisX,

				x_axisY = ifShowAxisYLeft? xLeft_axisX: xRight_axisX,
				yTop_axisY = Math.floor(config.paddingTop) + 0.5,
				yBottom_axisY = y_axisX,
				yTop_volume_axisY,
				yBottom_volume_axisY;

			if(config.showVolume){
				yTop_volume_axisY = Math.floor(y_axisX + config.volumeMarginTop) + 0.5;
				y_volume_axisX = Math.floor(yTop_volume_axisY + _sketch.chart.volumeHeight) + 0.5;
				yBottom_volume_axisY = y_volume_axisX;
			}

			/**
			 * 获取指定价钱对应的物理高度
			 * @param {Number} price1 价钱1
			 * @param {Number} [price2=_sketch.data.extended.priceCeiling] 价钱2
			 * @returns {Number} 物理高度
			 */
			var getHeight = function(price1, price2){
				if(arguments.length < 2)
					price2 = _sketch.data.extended.priceCeiling;
				return Math.abs(price2 - price1) / _sketch.chart.priceHeightRatio;
			};

			/* 绘制坐标系 */
			;(function(){
				ctx.save();

				ctx.lineWidth = 1;
				config.axisLineColor && (ctx.strokeStyle = config.axisLineColor);
				config.axisLabelFont && (ctx.font = config.axisLabelFont);
				config.axisLabelColor && (ctx.fillStyle = config.axisLabelColor);

				/* 绘制X轴及刻度 */
				;(function(){
					/* 绘制X轴坐标线 */
					ctx.beginPath();
					/* 蜡烛图 */
					ctx.moveTo(xLeft_axisX, y_axisX);
					ctx.lineTo(xRight_axisX, y_axisX);
					/* 量图 */
					if(config.showVolume){
						ctx.moveTo(xLeft_axisX, y_volume_axisX);
						ctx.lineTo(xRight_axisX, y_volume_axisX);
					}
					ctx.stroke();

					/**
					 * 根据提供的数据的索引位置绘制刻度
					 * @param {Integer} i 数据的索引位置
					 */
					var renderXTick = function(i){
						if(i < 0 || i >= groupCount)
							return;

						ctx.save();

						ctx.textAlign = "center";
						ctx.textBaseline = "top";

						var data = datas[i];
						/* 数据格式转换 */
						data = dataParser? dataParser(data, i, datas): data;

						var tickX = Math.floor(xLeft_axisX + i * groupSize + config.axisXTickOffset) + 0.5;
						// if(fromLeft)
						// 	tickX = Math.floor(xLeft_axisX + i * groupSize + config.axisXTickOffset) + 0.5;
						// else
							// tickX = Math.floor(xRight_axisX - (groupCount - 1 - i) * groupSize - config.axisXTickOffset) + 0.5;

						/* 绘制网格竖线 */
						if(ifShowVerticalGridLine){
							ctx.save();
							ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
							config.verticalGridLineColor && (ctx.strokeStyle = config.verticalGridLineColor);

							ctx.beginPath();
							/* 蜡烛图 */
							ctx.moveTo(tickX, y_axisX - 1);
							ctx.lineTo(tickX, y_axisX - 1 - Math.floor(_sketch.chart.height));
							/* 量图 */
							if(config.showVolume){
								ctx.moveTo(tickX, y_volume_axisX);
								ctx.lineTo(tickX, y_volume_axisX - Math.floor(_sketch.chart.volumeHeight));
							}
							ctx.stroke();
							ctx.restore();
						}

						config.axisLineColor && (ctx.strokeStyle = config.axisLineColor);

						/* 绘制刻度线 */
						ctx.beginPath();
						/* 蜡烛图 */
						ctx.moveTo(tickX, y_axisX);
						ctx.lineTo(tickX, y_axisX + config.axisTickLineLength);
						/* 量图 */
						if(config.showVolume){
							ctx.moveTo(tickX, y_volume_axisX);
							ctx.lineTo(tickX, y_volume_axisX + config.axisTickLineLength);
						}
						/* 绘制坐标取值 */
						ctx.fillText(data.time, tickX, (config.showVolume? y_volume_axisX: y_axisX) + config.axisTickLineLength + config.axisXLabelOffset);
						ctx.stroke();

						ctx.restore();
					};

					/* 赋值：ifShowAxisYLeft的表现效果太差 */
					var renderFromLeftToRight = true;

					/* 绘制X轴刻度 */
					var edgeTickDataIndex,/** 处于边界位置的刻度所对应的数据索引 */
						lastTickDataIndex;/** 最后一个的刻度所对应的数据索引 */
					if(renderFromLeftToRight){/* 从左向右 */
						edgeTickDataIndex = groupCount - 1;
						for(var i = 0; i <= axisXTickCount - 1; i++){
							var k = Math.round(i * axisXTickInterval);
							renderXTick(k, true);
						}
						lastTickDataIndex = Math.min(Math.round(i * axisXTickInterval), groupCount - 1);
					}else{/* 从右向左 */
						edgeTickDataIndex = 0;
						for(var i = groupCount - 1, j = 0; i >= 0, j <= axisXTickCount - 1; i -= axisXTickInterval, j++){
							var k = Math.round(i);
							renderXTick(k, true);
						}
						lastTickDataIndex = Math.max(Math.round(i), 0);
					}

					var totalSpace = Math.min((groupCount - 1) * groupSize, _sketch.chart.contentWidth);
					var remainingSpace = totalSpace - (lastTickDataIndex * groupSize - halfGroupBarWidth + halfGroupSize);
					if(remainingSpace < halfGroupSize){
						/* 剩余空间不足，只绘制边界刻度 */
						renderXTick(edgeTickDataIndex, renderFromLeftToRight);
					}else{
						/* 绘制最后一个刻度和边界刻度 */
						renderXTick(edgeTickDataIndex, renderFromLeftToRight);
						if(lastTickDataIndex != edgeTickDataIndex)
							renderXTick(lastTickDataIndex, renderFromLeftToRight);
					}
				})();

				/* 绘制Y轴及刻度 */
				;(function(){
					ctx.save();

					/* 绘制Y轴坐标线 */
					ctx.beginPath();
					/* 蜡烛图 */
					ctx.moveTo(x_axisY, yTop_axisY);
					ctx.lineTo(x_axisY, yBottom_axisY);
					/* 量图 */
					if(config.showVolume){
						ctx.moveTo(x_axisY, yTop_volume_axisY);
						ctx.lineTo(x_axisY, yBottom_volume_axisY);
					}
					ctx.stroke();

					ctx.textBaseline = "middle";
					ctx.textAlign = ifShowAxisYLeft? "end": "start";

					var axisTickLineOffset = (ifShowAxisYLeft? -1: 1) * config.axisTickLineLength,
						axisYLabelOffset = (ifShowAxisYLeft? -1: 1) * (config.axisTickLineLength + config.axisYLabelOffset);

					/* 绘制Y轴刻度 */
					for(var i = 0; i <= config.axisYMidTickQuota + 1; i++){
						var price = _sketch.data.extended.priceFloor + i * axisYPriceInterval,
							tickOffset = (config.axisYMidTickQuota + 1 - i) * axisYHeightInterval;
						var tickY = Math.round(tickOffset);

						/* 绘制网格横线 */
						if(ifShowHorizontalGridLine && i > 0){/* 坐标轴横线上不再绘制 */
							ctx.save();
							ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
							ctx.strokeStyle = config.horizontalGridLineColor;

							ctx.beginPath();
							ctx.moveTo(x_axisY, yTop_axisY + tickY);
							ctx.lineTo(x_axisY + (ifShowAxisYLeft? 1: -1) * Math.floor(_sketch.chart.width), yTop_axisY + tickY);
							ctx.stroke();
							ctx.restore();
						}

						/* 绘制刻度线 */
						ctx.beginPath();
						ctx.moveTo(x_axisY, yTop_axisY + tickY);
						ctx.lineTo(x_axisY + axisTickLineOffset, yTop_axisY + tickY);
						ctx.stroke();
						var format = config.axisYFormatter || util.formatMoney;
						ctx.fillText(format(price, config), x_axisY + axisYLabelOffset, yTop_axisY + tickY + config.axisYLabelVerticalOffset);
					}
					/* 量图 */
					if(config.showVolume){
						var axisYVolumeInterval = (_sketch.data.extended.volumeCeiling - _sketch.data.extended.volumeFloor) / (config.volumeAxisYMidTickQuota + 1);
						if(_sketch.chart.volumeHeightRatio != 0){
							var axisYHeightIntervalAux = axisYVolumeInterval / _sketch.chart.volumeHeightRatio;
							for(var i = 0; i <= config.volumeAxisYMidTickQuota + 1; i++){
								var volume = _sketch.data.extended.volumeFloor + i * axisYVolumeInterval,
									tickOffset = (config.volumeAxisYMidTickQuota + 1 - i) * axisYHeightIntervalAux;
								var tickY = Math.round(tickOffset);

								/* 绘制网格横线 */
								if(ifShowHorizontalGridLine && i > 0){/* 坐标轴横线上不再绘制 */
									ctx.save();
									ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
									ctx.strokeStyle = config.horizontalGridLineColor;

									ctx.beginPath();
									ctx.moveTo(x_axisY, yTop_volume_axisY + tickY);
									ctx.lineTo(x_axisY + (ifShowAxisYLeft? 1: -1) * Math.floor(_sketch.chart.width), yTop_volume_axisY + tickY);
									ctx.stroke();
									ctx.restore();
								}

								/* 绘制刻度线 */
								ctx.beginPath();
								ctx.moveTo(x_axisY, yTop_volume_axisY + tickY);
								ctx.lineTo(x_axisY + axisTickLineOffset, yTop_volume_axisY + tickY);
								ctx.stroke();
								ctx.fillText(Math.floor(volume), x_axisY + axisYLabelOffset, yTop_volume_axisY + tickY + config.axisYLabelVerticalOffset);
							}
						}else{
							/* 绘制刻度线 */
							ctx.beginPath();
							ctx.moveTo(x_axisY, yBottom_volume_axisY);
							ctx.lineTo(x_axisY + axisTickLineOffset, yBottom_volume_axisY);
							ctx.stroke();
							ctx.fillText(0, x_axisY + axisYLabelOffset, yBottom_volume_axisY + config.axisYLabelVerticalOffset);
						}
					}

					ctx.restore();
				})();

				/* 绘制坐标区域背景 */
				var bg = config.coordinateBackground;
				if(null != bg){
					ctx.save();
					ctx.beginPath();

					/* 蜡烛图 */
					ctx.rect(xLeft_axisX, yTop_axisY, _sketch.chart.width, _sketch.chart.height);
					/* 量图 */
					!!config.showVolume && ctx.rect(xLeft_axisX, yTop_volume_axisY, _sketch.chart.width, _sketch.chart.volumeHeight);

					ctx.strokeWidth = 0;
					if(bg instanceof TradeChart.LinearGradient){
						bg.apply(ctx, config.paddingLeft, config.paddingTop, config.paddingLeft, config.paddingTop + _sketch.chart.height);
					}else
						ctx.fillStyle = bg;

					ctx.fill();
					ctx.restore();
				}

				ctx.restore();
			})();

			/* 绘制蜡烛 */
			;(function(){
				ctx.save();

				/**
				 * 绘制给定索引对应的数据的蜡烛
				 * @param {Integer} i 数据索引
				 * @param {Function} [callback] 绘制完成后执行的方法
				 */
				var renderCandle = function(i, callback){
					var data = datas[i];
					/* 数据格式转换 */
					data = dataParser? dataParser(data, i, datas): data;

					var x = Math.floor(xLeft_axisX + config.axisXTickOffset + i * groupSize - halfGroupBarWidth);
					// if(fromLeft)
					// 	x = Math.floor(xLeft_axisX + config.axisXTickOffset + i * groupSize - halfGroupBarWidth);
					// else
					// 	x = Math.floor(xRight_axisX - config.axisXTickOffset - (groupCount - 1 - i) * groupSize - halfGroupBarWidth);

					var isAppreciated = data.closePrice > data.openPrice,
						isDepreciated = data.closePrice < data.openPrice,
						isKeeped = Math.abs(data.closePrice - data.openPrice) < 2e-7;
					ctx.fillStyle = ctx.strokeStyle = isKeeped? config.keepedColor: (isAppreciated? config.appreciatedColor: config.depreciatedColor);

					var maxLinePrice = Math.max(data.highPrice, data.lowPrice),
						maxBarPrice = Math.max(data.openPrice, data.closePrice);

					/* 绘制线 */
					var lineX = x + Math.floor((config.groupBarWidth - config.groupLineWidth) / 2),
						lineYTop = Math.floor(yTop_axisY + getHeight(maxLinePrice));
					var lineYBottom = lineYTop + Math.floor(getHeight(data.highPrice, data.lowPrice));
					if(Math.abs(lineYBottom - lineYTop) < 2e-7)
						lineYBottom += 1;
					ctx.beginPath();
					if(config.groupLineWidth > 1){
						ctx.strokeWidth = 0;
						ctx.rect(lineX, lineYTop, config.groupLineWidth, Math.abs(lineYBottom - lineYTop));
						ctx.fill();
					}else{
						ctx.strokeWidth = 1;
						ctx.moveTo(lineX + 0.5, lineYTop + 0.5);
						ctx.lineTo(lineX + 0.5, lineYBottom + 0.5);
						ctx.stroke();
					}

					/* 绘制蜡烛 */
					ctx.beginPath();
					var barX = x,
						barY = Math.floor(yTop_axisY + getHeight(maxBarPrice)) + 0.5;
					var barHeight = Math.floor(getHeight(data.openPrice, data.closePrice));
					if(0 == barHeight)
						barHeight = 1;
					ctx.beginPath();
					ctx.strokeWidth = 0;
					ctx.rect(barX, barY, config.groupBarWidth, barHeight);
					ctx.fill();

					if(typeof callback == "function")
						callback(data, i, lineX, barX);
				};

				var maDots = [];
				var f = function(data, i, lineX, barX){
					/* 整理MA线数据 */
					config.showMAArr.forEach(function(num, k){
						if(maDots[k] == null)
							maDots[k] = [];

						var d = data["MA" + num];
						if(null == d)
							return;

						var dotX = lineX + Math.floor((config.groupLineWidth + 1) / 2),
							dotY = Math.floor(yTop_axisY + getHeight(d));
						maDots[k].push([dotX, dotY]);
					});

					/* 绘制量图 */
					if(config.showVolume){
						ctx.save();
						ctx.fillStyle = config.volumeColor;

						var volumeHeight = Math.floor(data.volume / _sketch.chart.volumeHeightRatio) + config.volumeAxisYTickOffset;
						ctx.strokeWidth = 0;
						ctx.rect(barX, Math.floor(y_volume_axisX - volumeHeight), config.groupBarWidth, volumeHeight);
						ctx.fill();
						ctx.restore();
					}
				};

				/* 绘制蜡烛图及量图 */
				for(var i = 0; i < groupCount; i++)
					renderCandle(i, f);

				/* 绘制MA线 */
				ctx.textAlign = ifShowAxisYLeft? "start": "end";
				ctx.textBaseline = "top";
				config.showMAArr.forEach(function(num, i){
					if(!Array.isArray(maDots[i]) || maDots[i].length == 0)
						return;

					ctx.strokeStyle = config.MAColorArr[i];
					ctx.fillStyle = config.MAColorArr[i];

					ctx.beginPath();
					ctx.moveTo(maDots[i][0][0], maDots[i][0][1]);
					maDots[i].forEach(function(MADot, k){
						if(k == 0)
							return;

						ctx.lineTo(MADot[0], MADot[1]);
					});
					ctx.stroke();

					var labelText = "MA" + num;
					var labelX = ifShowAxisYLeft? config.MALabelX: (xRight_axisX - config.MALabelX),
						labelSize = ctx.measureText(labelText).width + config.MALabelSpace;
					/* 绘制MA标题 */
					labelX += i * labelSize * (ifShowAxisYLeft? 1: -1);
					ctx.fillText(labelText, labelX, config.MALabelY);
				});

				ctx.restore();
			})();

			var pixelRatio = util.pixelRatio();
			var renderMetadata = {
				scaleX: pixelRatio,
				scaleY: pixelRatio,
				cssWidth: config.width,
				cssHeight: config.height
			};
			Object.freeze && Object.freeze(renderMetadata);

			return new RenderedKChart(this, _sketch, config, renderMetadata);
		};

		/**
		 * 渲染图形，并呈现至指定的DOM容器中
		 * @param domContainerObj {HTMLElement} DOM容器
		 * @param config {JsonObject} 渲染配置
		 * @return {RenderedKChart} 绘制的K线图
		 */
		this.renderAt = function(domContainerObj, config){
			var canvasObj = document.createElement("canvas");
			domContainerObj.appendChild(canvasObj);

			return this.render(canvasObj, config);
		};
	};
	KChart.prototype = Object.create(TradeChart.prototype);

	KChart.calcMaxGroupCount = calcMaxGroupCount;
	KChart.calcHalfGroupBarWidth = calcHalfGroupBarWidth;
	TradeChart.defineChart("KChart", KChart);
})();