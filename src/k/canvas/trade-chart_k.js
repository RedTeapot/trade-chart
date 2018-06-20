;(function(){
	var TradeChart = window.TradeChart;
	var util = TradeChart.util;
	var Big = util.Big;

	var numBig = function(big){
		return Number(big.toString());
	};
	var roundBig = function(big){
		return Math.round(numBig(big));
	};
	var floorBig = function(big){
		return Math.floor(numBig(big));
	};
	var ceilBig = function(big){
		return Math.ceil(numBig(big));
	};

	/**
	 * @typedef KData
	 * @type {Object}
	 *
	 * @property {String} time 时间
	 * @property {Number} openPrice 开盘价
	 * @property {Number} highPrice 最高价
	 * @property {Number} lowPrice 最低价
	 * @property {Number} closePrice 收盘价
	 * @property {Number} volume 成交量
	 *
	 * @property {Number} MA5 MA5指标
	 * @property {Number} MA10 MA10指标
	 * @property {Number} MA20 MA20指标
	 * @property {Number} MA30 MA30指标
	 */

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

		axisTickLineLength: 6,/** 坐标轴刻度线的长度 */
		axisLabelFont: "normal 10px sans-serif, serif",/** 坐标标签字体 */
		axisLabelColor: null,/** 坐标标签颜色 */
		axisLineColor: null,/** 坐标轴颜色 */

		showAxisXLine: true,/** 是否绘制横坐标轴 */
		showAxisXLabel: true,/** 是否绘制横坐标刻度值 */
		axisXTickOffset: 5,/** 横坐标刻度距离原点的位移（无论Y轴显示在哪侧，都应用在左侧） */
		axisXTickOffsetFromRight: 0,/** 最后一个横坐标刻度距离横坐标结束位置的位移 */
		/**
		 * 横坐标标签位置
		 *
		 * the-very-bottom：图形下方（无论是否绘制量图）
		 * beneath-trend-above-volume：如果有量图，则在折线图下方，量图上方。如果没有量图，则等同于the-very-bottom
		 */
		axisXLabelPosition: "the-very-bottom",
		axisXLabelOffset: 5,/** 横坐标标签距离坐标轴刻度线的距离 */
		axisXLabelSize: 55,/** 横坐标标签文字的长度（用于决定以何种方式绘制最后一个刻度：只绘制边界刻度，还是边界刻度和最后一个刻度都绘制） */
		axisXLabelGenerator: function(convertedData, index, previousConvertedData, nextConvertedData){/* 横坐标标签文字的输出方法 */
			return convertedData.time;
		},
		axisXLabelHorizontalAlign: function(i, n){/** 横坐标标签的水平对齐方式。start：左对齐；center：居中；end：右对齐 */
			return "center";
		},

		showAxisYLine: true,/** 是否绘制纵坐标轴 */
		showAxisYLabel: true,/** 是否绘制纵坐标刻度值 */
		axisYPosition: "left",/** 纵坐标位置。left：左侧；right：右侧 */
		axisYLabelPosition: "outside",/** 纵坐标标签位置。outside：外侧；inside：内侧 */
		axisYLabelFont: null,/** 纵坐标的坐标标签字体 */
		axisYLabelColor: null,/** 纵坐标的坐标标签颜色 */
		axisYLabelOffset: 5,/* 纵坐标标签距离坐标轴刻度线的距离 */
		axisYLabelVerticalOffset: function(i, n){/** 纵坐标标签纵向位移 */
			//i: 自下而上的刻度索引。从0开始
			//n：刻度的总个数，包括最小值和最大值
			return 0;
		},
		axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移 */
		axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
		axisYPrecision: 2,/** 纵坐标的数字精度（仅在没有指定配置项：axisYFormatter时有效。如果指定了axisYFormatter，将直接使用指定的格式化方法返回的值） */
		axisYFormatter: function(price, config){/** 纵坐标数字格式化方法 */
			/** price：价格；config：配置 */
			return util.formatMoney(price, config.axisYPrecision);
		},
		axisYPriceFloor: function(min, max, avgVariation, maxVariation){
			if(!isFinite(min))
				min = 0;
			if(!isFinite(avgVariation))
				avgVariation = 0;

			min = Math.max(min, 0);
			avgVariation = Math.abs(avgVariation);

			return numBig(new Big(min).minus(new Big(avgVariation).div(2)));
		},
		axisYPriceFloorLabelFont: null,/** 纵坐标最小值的坐标标签字体 */
		axisYPriceFloorLabelColor: null,/** 纵坐标最小值的坐标标签颜色 */
		axisYPriceCeiling: function(min, max, avgVariation, maxVariation){
			if(!isFinite(max))
				max = 0;
			if(!isFinite(avgVariation))
				avgVariation = 0;

			max = Math.max(max, 0);
			avgVariation = Math.abs(avgVariation);

			return numBig(new Big(max).plus(new Big(avgVariation).div(2)));
		},
		axisYPriceCeilingLabelFont: null,/** 纵坐标最小值的坐标标签字体 */
		axisYPriceCeilingLabelColor: null,/** 纵坐标最小值的坐标标签颜色 */

		gridLineDash: [1, 3, 3],/** 网格横线的虚线构造方法。如果需要用实线，则用“[1]”表示 */
		showHorizontalGridLine: true,/** 是否绘制网格横线 */
		horizontalGridLineColor: "#A0A0A0",/** 网格横线颜色 */

		showVerticalGridLine: true,/** 是否绘制网格横线 */
		verticalGridLineColor: "#A0A0A0",/** 网格竖线颜色 */

		appreciatedColor: "red",/** 收盘价大于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
		depreciatedColor: "#21CB21",/** 收盘价小于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
		keepedColor: "white",/** 收盘价等于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */

		coordinateBackground: null,/** 坐标系围成的矩形区域的背景色 */

		showVolume: false,  /** 是否显示量图 */
		volumeAreaRatio: 0.33, /** 量图区域所占比例 0~1 */
		volumeMarginTop: 15,/** 量图区的顶部外边距 （即与图形区的间距）*/
		volumeAxisYTickOffset: 0, /** 量图纵坐标刻度距离原点的位移 */
		volumeAxisYMidTickQuota: 2, /** 量图纵坐标刻度个数（不包括最小值和最大值） */
		volumeAxisYFloor: null, /** 量图纵坐标最小刻度, 为null时自动 */
		volumeAxisYLabelFont: null,/** 量图纵坐标的坐标标签字体 */
		volumeAxisYLabelColor: null,/** 量图纵坐标的坐标标签颜色 */
		volumeAxisYLabelVerticalOffset: function(i, n){/** 量图纵坐标标签纵向位移 */
			//i: 自下而上的刻度索引。从0开始
			//n：刻度的总个数，包括最小值和最大值
			return 0;
		},
		volumeColor: "orange", /** 量图颜色（柱状图）*/
		appreciatedVolumeColor: "orange",/** 收盘价大于开盘价时，绘制量图用的画笔或油漆桶颜色 */
		depreciatedVolumeColor: "orange",/** 收盘价小于开盘价时，绘制量图用的画笔或油漆桶颜色 */

		showMAArr: [5, 10, 20, 30], /** 要显示的MA线 */
		MAColorArr: ["orange", "blue", "purple", "black"], /** 每条MA线对应的颜色 */
		MALabelX: 60, /** MA标题的起始位置横坐标 */
		MALabelY: 10, /** MA标题的起始位置纵坐标 */
		MALabelSpace: 10 /** MA标题间距 */
	};

	/**
	 * 使用给定的配置合并默认配置，并使用合并结果执行给定的动作
	 * @param {Object} config 要合并的配置
	 * @param {Function} callback 要执行的动作
	 */
	var mergeDefaultChartConfigAndDo = (function(){
		var tmp = util.setDftValue(null, defaultChartConfig);

		var reset = function(){
			for(var p in tmp){
				if(p in defaultChartConfig)
					tmp[p] = defaultChartConfig[p];
				else
					delete tmp[p];
			}
		};

		return function(config, callback){
			reset();
			if(null != config && typeof config == "object")
				for(var p in config)
					tmp[p] = config[p];

			util.try2Call(callback, null, tmp);
			reset();
		};
	})();

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
			chartSketch.height = roundBig(new Big(config.height).mul(1 - config.volumeAreaRatio).minus(config.paddingTop + config.volumeMarginTop));
			chartSketch.volumeHeight = roundBig(new Big(config.height).mul(config.volumeAreaRatio).minus(config.paddingBottom));
			chartSketch.volumeContentHeight = Math.floor(chartSketch.volumeHeight);
		}else{
			chartSketch.height = Math.floor(config.height - config.paddingTop - config.paddingBottom);
		}
		chartSketch.contentHeight = Math.floor(chartSketch.height - config.axisYTickOffset);
		chartSketch.maxGroupCount = floorBig(new Big(chartSketch.contentWidth).minus(config.groupLineWidth).div(config.groupGap + config.groupBarWidth)) + 1;

		return chartSketch;
	};

	/**
	 * 根据给定的配置信息和画布元素，计算最多可以绘制的数据个数
	 * @param {HTMLCanvasElement} canvasObj Canvas DOM元素
	 * @param {JsonObject} config 渲染配置
	 */
	var calcMaxGroupCount = function(canvasObj, config){
		var maxGroupCount = 0;

		mergeDefaultChartConfigAndDo(config, function(mergedConfig){
			/** 百分比尺寸自动转换 */
			if(/%/.test(mergedConfig.width))
				mergedConfig.width = canvasObj.parentElement.clientWidth * parseInt(mergedConfig.width.replace(/%/, "")) / 100;
			if(/%/.test(mergedConfig.height))
				mergedConfig.height = canvasObj.parentElement.clientHeight * parseInt(mergedConfig.height.replace(/%/, "")) / 100;

			maxGroupCount = sketchChart(mergedConfig).maxGroupCount;
		});

		return maxGroupCount;
	};

	/**
	 * 根据给定的配置信息计算蜡烛一半的宽度
	 */
	var calcHalfGroupBarWidth = function(config){
		return floorBig(new Big(config.groupBarWidth - config.groupLineWidth).div(2).plus(new Big(config.groupLineWidth - 1).div(2)));
	};

	/**
	 * 扫描提供的数据，生成绘制所需的元数据
	 * @param {Object[]} datas 数据数组
	 * @param {Function} dataParser 数据转换方法
	 * @param {Object} config 渲染配置
	 * @returns {Object} 元数据集合
	 */
	var sketch = function(datas, dataParser, config){
		var dataSketch_origin_max = -Infinity,/* 最大价格 */
			dataSketch_origin_min = Infinity,/* 最小价格 */
			dataSketch_origin_avgVariation = 0,/* 价格的平均变动幅度 */
			dataSketch_origin_maxVariation = 0,/* 价格的最大变动幅度 */
			dataSketch_origin_maxVolume = -Infinity,/* 最大交易量 */
			dataSketch_origin_minVolume = Infinity,/* 最小交易量 */
			dataSketch_origin_avgVolumeVariation = 0,/* 交易量的平均变动幅度 */
			dataSketch_origin_maxVolumeVariation = 0,/* 交易量的最大变动幅度 */

			dataSketch_extended_priceCeiling = 0,/* 坐标中价格的最大值 */
			dataSketch_extended_priceFloor = 0,/* 坐标中价格的最小值 */
			dataSketch_extended_volumeCeiling = 0,/* 坐标中成交量的最大值 */
			dataSketch_extended_volumeFloor = 0;/* 坐标中成交量的最小值 */

		var chartSketch = sketchChart(config);

		/* 数据概览扫描 */
		var previousVolume = 0;
		var variationSum = 0, volumeVariationSum = 0;
		for(var i = 0; i < datas.length && i < chartSketch.maxGroupCount; i++){
			var d = datas[i];
			/* 数据格式转换 */
			d = dataParser? dataParser(d, i, datas): d;

			var max = Math.max(+d.openPrice, +d.highPrice, +d.lowPrice, +d.closePrice),
				min = Math.min(+d.openPrice, +d.highPrice, +d.lowPrice, +d.closePrice);
			for(var j = 0; j < config.showMAArr.length; j++){
				var num = config.showMAArr[j];
				if(d["MA"+num] != null){
					max = Math.max(+d["MA"+num], max);
					min = Math.min(+d["MA"+num], min);
				}
			}
			if(max > dataSketch_origin_max)
				dataSketch_origin_max = max;
			if(min < dataSketch_origin_min)
				dataSketch_origin_min = min;
			if(+d.volume > dataSketch_origin_maxVolume)
				dataSketch_origin_maxVolume = +d.volume;
			if(+d.volume < dataSketch_origin_minVolume)
				dataSketch_origin_minVolume = +d.volume;

			var variation = Math.abs(max - min);
			var volumeVariation = Math.abs(+d.volume - +previousVolume);

			/* 确定更大的价格变动幅度 */
			if(variation > dataSketch_origin_maxVariation)
				dataSketch_origin_maxVariation = variation;
			if(volumeVariation > dataSketch_origin_maxVolumeVariation)
				dataSketch_origin_maxVolumeVariation = volumeVariation;

			variationSum += variation;
			volumeVariationSum += volumeVariation;

			previousVolume = d.volume;
		}
		var len = datas.length;
		dataSketch_origin_avgVariation = len > 0? numBig(new Big(variationSum).div(len)): 0;
		dataSketch_origin_avgVolumeVariation = len > 0? numBig(new Big(volumeVariationSum).div(len)): 0;

		/* 确定Y轴最小值 */
		if(null != config.axisYPriceFloor){
			if(typeof config.axisYPriceFloor == "function")
				dataSketch_extended_priceFloor = config.axisYPriceFloor(dataSketch_origin_min, dataSketch_origin_max, dataSketch_origin_avgVariation, dataSketch_origin_maxVariation);
			else
				dataSketch_extended_priceFloor = Number(config.axisYPriceFloor);
		}else
			dataSketch_extended_priceFloor = dataSketch_origin_min - numBig(new Big(dataSketch_origin_avgVariation).div(2));
		if(!isFinite(dataSketch_extended_priceFloor) || dataSketch_extended_priceFloor < 0)
			dataSketch_extended_priceFloor = 0;

		/* 确定Y轴最大值 */
		if(null != config.axisYPriceCeiling){
			if(typeof config.axisYPriceCeiling == "function")
				dataSketch_extended_priceCeiling = config.axisYPriceCeiling(dataSketch_origin_min, dataSketch_origin_max, dataSketch_origin_avgVariation, dataSketch_origin_maxVariation);
			else
				dataSketch_extended_priceCeiling = Number(config.axisYPriceCeiling);
		}else
			dataSketch_extended_priceCeiling = dataSketch_origin_max + numBig(new Big(dataSketch_origin_avgVariation).div(2));
		if(dataSketch_extended_priceCeiling < dataSketch_origin_max)
			dataSketch_extended_priceCeiling = dataSketch_origin_max;
		if(!isFinite(dataSketch_extended_priceCeiling) || dataSketch_extended_priceCeiling < 0)
			dataSketch_extended_priceCeiling = dataSketch_extended_priceFloor;

		/* 确保最大值与最小值不同 */
		var b = new Big(dataSketch_extended_priceFloor);
		if(b.eq(dataSketch_extended_priceCeiling))
			dataSketch_extended_priceCeiling = b.eq(0)? 1: numBig(b.mul(1.3));

		/* 确定量图Y轴最小值 */
		b = new Big(dataSketch_origin_avgVolumeVariation).div(2);
		if(null != config.volumeAxisYFloor)
			dataSketch_extended_volumeFloor = Number(config.volumeAxisYFloor);
		else
			dataSketch_extended_volumeFloor = dataSketch_origin_minVolume - numBig(b);
		if(!isFinite(dataSketch_extended_volumeFloor) || dataSketch_extended_volumeFloor < 0)
			dataSketch_extended_volumeFloor = 0;

		/* 确定量图Y轴最大值 */
		dataSketch_extended_volumeCeiling = dataSketch_origin_maxVolume + numBig(b);
		if(!isFinite(dataSketch_extended_volumeCeiling) || dataSketch_extended_volumeCeiling < 0)
			dataSketch_extended_volumeCeiling = 0;

		/* 确保最大值与最小值不同 */
		b = new Big(dataSketch_extended_volumeFloor);
		if(b.eq(dataSketch_extended_volumeCeiling))
			dataSketch_extended_volumeCeiling = b.eq(0)? 1: numBig(b.mul(1.3));

		b = new Big(dataSketch_extended_priceCeiling - dataSketch_extended_priceFloor).div(Math.max(chartSketch.contentHeight, 1));
		chartSketch.priceHeightRatio = b.eq(0)? 1: numBig(b);
		b = new Big(dataSketch_extended_volumeCeiling - dataSketch_extended_volumeFloor).div(Math.max(chartSketch.volumeContentHeight, 1));
		chartSketch.volumeHeightRatio = b.eq(0)? 1: numBig(b);

		var extendedData = {
			priceCeiling: dataSketch_extended_priceCeiling,
			priceFloor: dataSketch_extended_priceFloor,
			volumeCeiling: dataSketch_extended_volumeCeiling,
			volumeFloor: dataSketch_extended_volumeFloor
		};
		return {extendedData: extendedData, chart: chartSketch};
	};

	/**
	 * 初始化画布（设置宽高、伸缩比例等）
	 * @param domContainerObj {HTMLCanvasElement} 画布
	 * @param config {JsonObject} 渲染配置
	 */
	var initCanvasAndConfig = function(canvasObj, config){
		/* 历史兼容，待移除 */
		if(!!config.axisYVolumeFloor)
			config.volumeAxisYFloor = config.axisYVolumeFloor;

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

			var index = ceilBig(new Big(tmpX).div(Math.floor(config.groupBarWidth + config.groupGap))) - 1;
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
		var doRender = function(canvasObj, config){
			if(config.groupBarWidth < config.groupLineWidth + 2)
				throw new Error("Bar width should be bigger than group line width plus 2.");

			initCanvasAndConfig(canvasObj, config);
			var ctx = canvasObj.getContext("2d");

			var _sketch = sketch(datas, dataParser, config);
			// console.log("K chart sketch", _sketch);
			// console.log("K chart config", config);

			/** 蜡烛一半的宽度 */
			var halfGroupBarWidth = calcHalfGroupBarWidth(config);
			/** 一组数据的宽度 */
			var groupSize = config.groupBarWidth + config.groupGap;
			/** 一组数据宽度的一半 */
			var halfGroupSize = Math.max(numBig(new Big(groupSize).div(2)), numBig(new Big(config.axisXLabelSize).div(2)));
			/** 绘制的数据个数 */
			var groupCount = Math.min(_sketch.chart.maxGroupCount, datas.length);
			/** 横坐标刻度之间相差的数据的个数 */
			var axisXTickInterval = ceilBig(new Big(config.axisXLabelSize).div(groupSize));
			axisXTickInterval = Math.max(axisXTickInterval, 1);
			/** 横坐标刻度个数 */
			var axisXTickCount = floorBig(new Big(groupCount).div(axisXTickInterval));
			/** 相邻两个纵坐标刻度之间的价格悬差 */
			var axisYPriceInterval = numBig(new Big(_sketch.extendedData.priceCeiling - _sketch.extendedData.priceFloor).div(config.axisYMidTickQuota + 1));
			/** 相邻两个纵坐标刻度之间的高度悬差 */
			var axisYHeightInterval = numBig(new Big(axisYPriceInterval).div(_sketch.chart.priceHeightRatio));

			var axisYPosition = String(config.axisYPosition).toLowerCase();
			var ifShowAxisYLeft = "left" == axisYPosition,
				ifShowAxisYRight = "right" == axisYPosition;

			var axisYLabelPosition = String(config.axisYLabelPosition).toLowerCase();
			var ifShowAxisYLabelOutside = "outside" == axisYLabelPosition,
				ifShowAxisYLabelInside = "inside" == axisYLabelPosition;

			var ifShowVerticalGridLine = config.showVerticalGridLine && config.verticalGridLineColor,
				ifShowHorizontalGridLine = config.showHorizontalGridLine && config.horizontalGridLineColor;

			var xLeft_axisX = Math.floor(config.paddingLeft) + 0.5,
				xRight_axisX = xLeft_axisX + Math.floor(_sketch.chart.width),
				y_axisX = Math.floor(config.paddingTop + _sketch.chart.height) + 0.5,
				y_volume_axisX = y_axisX,

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
			 * @param {Number} [price2=_sketch.extendedData.priceCeiling] 价钱2
			 * @returns {Number} 物理高度
			 */
			var getHeight = function(price1, price2){
				if(arguments.length < 2)
					price2 = _sketch.extendedData.priceCeiling;

				return numBig(new Big(Math.abs(price2 - price1)).div(_sketch.chart.priceHeightRatio));
			};

			/**
			 * @typedef {Object} XTick
			 * @property {Number} x 横坐标位置
			 * @property {String} label 横坐标标签
			 */

			/**
			 * @typedef {Object} YTick
			 * @property {Number} y 纵坐标位置
			 * @property {String} label 纵坐标标签
			 */

			/**
			 * 要绘制的横坐标刻度集合
			 * @type {XTick[]}
			 */
			var axisXTickList = [];

			/**
			 * 要绘制的纵坐标刻度集合
			 * @type {YTick[]}
			 */
			var axisYTickList = [];

			/**
			 * 要绘制的量图纵坐标刻度集合
			 * @type {YTick[]}
			 */
			var volumeAxisYTickList = [];


			/**
			 * 绘制横坐标刻度
			 */
			var drawAxisXTickList = function(){
				ctx.save();

				ctx.lineWidth = 1;
				config.axisLineColor && (ctx.strokeStyle = config.axisLineColor);
				config.axisLabelFont && (ctx.font = config.axisLabelFont);
				config.axisLabelColor && (ctx.fillStyle = config.axisLabelColor);
				ctx.textAlign = "center";
				ctx.textBaseline = "top";

				var tmp;
				var axisXLabelPosition = config.axisXLabelPosition || "the-very-bottom";
				axisXLabelPosition = String(axisXLabelPosition).trim().toLowerCase();
				switch(axisXLabelPosition){
				case "the-very-bottom":
					tmp = config.showVolume? y_volume_axisX: y_axisX;
					break;

				case "beneath-trend-above-volume":
					tmp = y_axisX;
					break;

				default:
					console.warn("Unknown axis x label position: '" + axisXLabelPosition + "'");
					tmp = config.showVolume? y_volume_axisX: y_axisX;
					break;
				}

				var y_axisXTickLabel = config.axisXLabelOffset + tmp;
				if(config.showAxisXLine)
					y_axisXTickLabel += config.axisTickLineLength;

				axisXTickList.forEach(function(tick, i){
					var tickX = tick.x;

					/* 绘制刻度线 */
					if(config.showAxisXLine && config.showAxisXLabel){
						ctx.beginPath();
						/* 蜡烛图 */
						ctx.moveTo(tickX, y_axisX);
						ctx.lineTo(tickX, y_axisX + config.axisTickLineLength);
						/* 量图 */
						if(config.showVolume){
							ctx.moveTo(tickX, y_volume_axisX);
							ctx.lineTo(tickX, y_volume_axisX + config.axisTickLineLength);
						}
						ctx.stroke();
					}

					/* 绘制坐标取值 */
					if(config.showAxisXLabel){
						ctx.save();
						var axisXLabelHorizontalAlign = config.axisXLabelHorizontalAlign;
						if(typeof axisXLabelHorizontalAlign)
							axisXLabelHorizontalAlign = axisXLabelHorizontalAlign(i, axisXTickList.length);
						axisXLabelHorizontalAlign && (ctx.textAlign = axisXLabelHorizontalAlign);

						ctx.fillText(tick.label, tickX, y_axisXTickLabel);

						ctx.restore();
					}
				});

				ctx.restore();
			};

			/**
			 * 绘制纵坐标刻度
			 */
			var drawAxisYTickList = function(){
				ctx.save();

				ctx.lineWidth = 1;
				config.axisLineColor && (ctx.strokeStyle = config.axisLineColor);
				config.axisLabelFont && (ctx.font = config.axisLabelFont);
				config.axisLabelColor && (ctx.fillStyle = config.axisLabelColor);
				config.axisYLabelFont && (ctx.font = config.axisYLabelFont);
				config.axisYLabelColor && (ctx.fillStyle = config.axisYLabelColor);
				if(ifShowAxisYLeft){
					ctx.textAlign = ifShowAxisYLabelOutside? "end": "start";
				}else{
					ctx.textAlign = ifShowAxisYLabelOutside? "start": "end";
				}
				ctx.textBaseline = "middle";

				var sign;
				if(ifShowAxisYLeft){
					sign = ifShowAxisYLabelOutside? -1: 1;
				}else{
					sign = ifShowAxisYLabelOutside? 1: -1;
				}

				var axisTickLineOffset = sign * config.axisTickLineLength,
					axisYLabelOffset = sign * ((config.showAxisYLine? config.axisTickLineLength: 0) + config.axisYLabelOffset);
				var maxAxisYTickIndex = config.axisYMidTickQuota + 1;

				axisYTickList.forEach(function(tick, i){
					var tickY = tick.y;

					/* 绘制刻度线 */
					if(config.showAxisYLine && config.showAxisYLabel){
						ctx.beginPath();
						ctx.moveTo(x_axisY, yTop_axisY + tickY);
						ctx.lineTo(x_axisY + axisTickLineOffset, yTop_axisY + tickY);
						ctx.stroke();
					}
					if(config.showAxisYLabel){
						var axisYLabelVerticalOffset = config.axisYLabelVerticalOffset;
						if(typeof axisYLabelVerticalOffset == "function")
							axisYLabelVerticalOffset = axisYLabelVerticalOffset(i, maxAxisYTickIndex + 1);

						var drawLabel = function(){
							ctx.fillText(tick.label, x_axisY + axisYLabelOffset, yTop_axisY + tickY + axisYLabelVerticalOffset);
						};

						if(i == 0){
							ctx.save();
							config.axisYPriceFloorLabelFont && (ctx.font = config.axisYPriceFloorLabelFont);
							config.axisYPriceFloorLabelColor && (ctx.fillStyle = config.axisYPriceFloorLabelColor);

							drawLabel();

							ctx.restore();
						}else if(i == maxAxisYTickIndex){
							ctx.save();
							config.axisYPriceCeilingLabelFont && (ctx.font = config.axisYPriceCeilingLabelFont);
							config.axisYPriceCeilingLabelColor && (ctx.fillStyle = config.axisYPriceCeilingLabelColor);

							drawLabel();

							ctx.restore();
						}else
							drawLabel();
					}
				});

				ctx.restore();
			};

			/**
			 * 绘制量图纵坐标刻度
			 */
			var drawVolumeAxisYTickList = function(){
				ctx.save();

				ctx.lineWidth = 1;
				config.axisLineColor && (ctx.strokeStyle = config.axisLineColor);
				config.axisLabelFont && (ctx.font = config.axisLabelFont);
				config.axisLabelColor && (ctx.fillStyle = config.axisLabelColor);
				config.volumeAxisYLabelFont && (ctx.font = config.volumeAxisYLabelFont);
				config.volumeAxisYLabelColor && (ctx.fillStyle = config.volumeAxisYLabelColor);
				if(ifShowAxisYLeft){
					ctx.textAlign = ifShowAxisYLabelOutside? "end": "start";
				}else{
					ctx.textAlign = ifShowAxisYLabelOutside? "start": "end";
				}
				ctx.textBaseline = "middle";

				var sign;
				if(ifShowAxisYLeft){
					sign = ifShowAxisYLabelOutside? -1: 1;
				}else{
					sign = ifShowAxisYLabelOutside? 1: -1;
				}

				var axisTickLineOffset = sign * config.axisTickLineLength,
					axisYLabelOffset = sign * ((config.showAxisYLine? config.axisTickLineLength: 0) + config.axisYLabelOffset);
				var maxVolumeAxisYTickIndex = config.volumeAxisYMidTickQuota + 1;

				volumeAxisYTickList.forEach(function(tick, i){
					var tickY = tick.y;

					/* 绘制刻度线 */
					if(config.showAxisYLine && config.showAxisYLabel){
						ctx.beginPath();
						ctx.moveTo(x_axisY, yTop_volume_axisY + tickY);
						ctx.lineTo(x_axisY + axisTickLineOffset, yTop_volume_axisY + tickY);
						ctx.stroke();
					}
					if(config.showAxisYLabel){
						var volumeAxisYLabelVerticalOffset = config.volumeAxisYLabelVerticalOffset;
						if(typeof volumeAxisYLabelVerticalOffset == "function")
							volumeAxisYLabelVerticalOffset = volumeAxisYLabelVerticalOffset(i, maxVolumeAxisYTickIndex + 1);
						ctx.fillText(tick.label, x_axisY + axisYLabelOffset, yTop_volume_axisY + tickY + volumeAxisYLabelVerticalOffset);
					}
				});

				ctx.restore();
			};

			/* 绘制坐标系 */
			;(function(){
				ctx.save();

				ctx.lineWidth = 1;
				config.axisLineColor && (ctx.strokeStyle = config.axisLineColor);

				/* 绘制X轴 */
				;(function(){
					if(config.showAxisXLine){
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
					}

					/**
					 * 根据提供的数据的索引位置绘制刻度
					 * @param {Integer} i 数据的索引位置
					 */
					var renderXTick = function(i){
						if(i < 0 || i >= groupCount)
							return;

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

						/* 汇集刻度，用于图形绘制完毕后统一绘制 */
						var label = (function(){
							if(!config.showAxisXLabel)
								return "";

							var previousData = i == 0? null: datas[i - 1],
								nextData = datas[i + 1];
							if(null != previousData && dataParser)
								previousData = dataParser(previousData, i - 1, datas);
							if(null != nextData && dataParser)
								nextData = dataParser(nextData, i + 1, datas);
							return config.axisXLabelGenerator(data, i, previousData, nextData);
						})();
						axisXTickList.push({x: tickX, label: label});
					};

					/* 赋值：从右向左绘制的表现效果太差（数据量不足一屏时，靠右显示） */
					var renderFromLeftToRight = true;

					/* 绘制X轴刻度 */
					var edgeTickDataIndex,/** 处于边界位置的刻度所对应的数据索引 */
					lastTickDataIndex;/** 最后一个的刻度所对应的数据索引 */
					if(renderFromLeftToRight){/* 从左向右 */
						edgeTickDataIndex = groupCount - 1;

						var b = new Big(axisXTickInterval);
						for(var i = 0; i <= axisXTickCount - 1; i++){
							var k = roundBig(b.mul(i));
							renderXTick(k, true);
						}
						lastTickDataIndex = Math.min(roundBig(b.mul(i)), groupCount - 1);
					}else{/* 从右向左 */
						edgeTickDataIndex = 0;
						for(var i = groupCount - 1, j = 0; i >= 0, j <= axisXTickCount - 1; i -= axisXTickInterval, j++){
							var k = Math.round(i);
							renderXTick(k, true);
						}
						lastTickDataIndex = Math.max(Math.round(i), 0);
					}

					b = new Big(groupSize);
					var totalSpace = Math.min(numBig(b.mul(groupCount - 1)), _sketch.chart.contentWidth);
					var remainingSpace = totalSpace - (numBig(b.mul(lastTickDataIndex)) - halfGroupBarWidth + halfGroupSize);
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

				/* 绘制Y轴 */
				;(function(){
					/* 绘制Y轴坐标线 */
					if(config.showAxisYLine){
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
					}

					/* 绘制Y轴刻度（自下而上） */
					var maxAxisYTickIndex = config.axisYMidTickQuota + 1;
					for(var i = 0; i <= maxAxisYTickIndex; i++){
						var price = _sketch.extendedData.priceFloor + numBig(new Big(axisYPriceInterval).mul(i)),
							tickOffset = numBig(new Big(axisYHeightInterval).mul(maxAxisYTickIndex - i));
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

						/* 汇集刻度，用于图形绘制完毕后统一绘制 */
						var format = config.axisYFormatter || util.formatMoney;
						axisYTickList.push({y: tickY, label: format(price, config)});
					}
					/* 量图 */
					if(config.showVolume){
						var axisYVolumeInterval = numBig(new Big(_sketch.extendedData.volumeCeiling - _sketch.extendedData.volumeFloor).div(config.volumeAxisYMidTickQuota + 1));
						var maxVolumeAxisYTickIndex = config.volumeAxisYMidTickQuota + 1;

						if(_sketch.chart.volumeHeightRatio != 0){
							var axisYHeightIntervalAux = numBig(new Big(axisYVolumeInterval).div(_sketch.chart.volumeHeightRatio));
							for(var i = 0; i <= maxVolumeAxisYTickIndex; i++){
								var volume = _sketch.extendedData.volumeFloor + numBig(new Big(axisYVolumeInterval).mul(i)),
									tickOffset = numBig(new Big(axisYHeightIntervalAux).mul(maxVolumeAxisYTickIndex - i));
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

								/* 汇集刻度，用于图形绘制完毕后统一绘制 */
								volumeAxisYTickList.push({y: tickY, label: Math.floor(volume)});
							}
						}else{
							/* 汇集刻度，用于图形绘制完毕后统一绘制 */
							volumeAxisYTickList.push({y: yBottom_volume_axisY, label: 0});
						}
					}
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

			/* 绘制蜡烛图及量图 */
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

					var x = Math.floor(xLeft_axisX + config.axisXTickOffset + numBig(new Big(groupSize).mul(i)) - halfGroupBarWidth);
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
					var lineX = x + floorBig(new Big(config.groupBarWidth - config.groupLineWidth).div(2)),
						lineYTop = Math.floor(yTop_axisY + getHeight(maxLinePrice));
					var lineYBottom = lineYTop + Math.floor(getHeight(data.highPrice, data.lowPrice));
					if(Math.abs(lineYBottom - lineYTop) < 2e-7)
						lineYBottom += 1;
					if(config.groupLineWidth > 1){
						ctx.strokeWidth = 0;
						ctx.fillRect(lineX, lineYTop, config.groupLineWidth, Math.abs(lineYBottom - lineYTop));
					}else{
						ctx.strokeWidth = 1;

						ctx.beginPath();
						ctx.moveTo(lineX + 0.5, lineYTop + 0.5);
						ctx.lineTo(lineX + 0.5, lineYBottom + 0.5);
						ctx.stroke();
					}

					/* 绘制蜡烛 */
					var barX = x,
						barY = Math.floor(yTop_axisY + getHeight(maxBarPrice));
					var barHeight = Math.floor(getHeight(data.openPrice, data.closePrice));
					if(0 == barHeight)
						barHeight = 1;
					ctx.strokeWidth = 0;
					ctx.fillRect(barX, barY, config.groupBarWidth, barHeight);

					util.try2Call(callback, null, data, i, lineX, barX);
				};

				var maDots = [];
				var f = function(data, i, lineX, barX){
					var isAppreciated = data.closePrice > data.openPrice,
						isDepreciated = data.closePrice < data.openPrice,
						isKeeped = Math.abs(data.closePrice - data.openPrice) < 2e-7;

					/* 整理MA线数据 */
					for(var k = 0; k < config.showMAArr.length; k++){
						var num = config.showMAArr[k];
						if(maDots[k] == null)
							maDots[k] = [];

						var d = data["MA" + num];
						if(null == d)
							continue;

						var dotX = lineX + floorBig(new Big(config.groupLineWidth + 1).div(2)),
							dotY = Math.floor(yTop_axisY + getHeight(d));
						maDots[k].push([dotX, dotY]);
					}

					/* 绘制量图 */
					if(config.showVolume){
						ctx.save();
						ctx.strokeWidth = 0;
						ctx.fillStyle = isAppreciated? config.appreciatedVolumeColor: (isKeeped? config.volumeColor: config.depreciatedVolumeColor);

						var volumeHeight = ceilBig(new Big(data.volume).minus(_sketch.extendedData.volumeFloor).div(_sketch.chart.volumeHeightRatio));
						ctx.fillRect(barX, Math.floor(y_volume_axisX - volumeHeight), config.groupBarWidth, volumeHeight);
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
					for(var k = 1; k < maDots[i].length; k++){
						var MADot = maDots[i];
						ctx.lineTo(MADot[0], MADot[1]);
					}
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

			/* 绘制坐标系刻度 */
			;(function(){
				drawAxisXTickList();
				drawAxisYTickList();
				drawVolumeAxisYTickList();
			})();

			var pixelRatio = util.pixelRatio();
			var renderMetadata = {
				scaleX: pixelRatio,
				scaleY: pixelRatio,
				cssWidth: config.width,
				cssHeight: config.height
			};
			Object.freeze && Object.freeze(renderMetadata);

			return new RenderedKChart(this, _sketch, util.cloneObject(config), renderMetadata);
		};

		/**
		 * 渲染图形，并呈现至指定的画布中
		 * @param domContainerObj {HTMLCanvasElement} 画布
		 * @param config {JsonObject} 渲染配置
		 * @returns {RenderedKChart} 绘制的K线图
		 */
		this.render = function(canvasObj, config){
			var self = this;

			var rst = null;
			mergeDefaultChartConfigAndDo(config, function(mergedConfig){
				rst = util.try2Call(doRender, self, canvasObj, mergedConfig);
			});

			return rst;
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