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
	 * @typedef {Object} TrendData
	 *
	 * @property {String} time 时间
	 * @property {Number} price 价格
	 * @property {Number} avgPrice 均价
	 * @property {Number} openPrice 开盘价
	 * @property {Number} closePrice 收盘价
	 * @property {Number} volume 成交量
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

		/**
		 * 相邻两个点之间的间隔。
		 *
		 * 1. 赋值整数，以指定固定间隔（此时会根据可显示的数据量自动舍去超出渲染范围的的数据，从而导致可能只显示前一部分数据）；
		 * 2. 赋值字符串：“auto”以渲染所有数据，并自动计算两个点之间的距离。
		 */
		dotGap: 5,

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
		axisXLabelSize: 55,/** 横坐标标签文字的长度（用于决定如何绘制边界刻度) */
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
		axisYLabelOffset: 5,/* 纵坐标标签距离坐标轴刻度线的横向距离 */
		axisYLabelVerticalOffset: function(i, n){/** 纵坐标标签纵向位移 */
			//i: 自下而上的刻度索引。从0开始
			//n：刻度的总个数，包括最小值和最大值
			return 0;
		},
		axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移 */
		axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
		axisYPrecision: "auto",/** 纵坐标的数字精度。auto：根据给定的数据自动检测 */
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

		showVerticalGridLine: true,/** 是否绘制网格竖线 */
		verticalGridLineColor: "#A0A0A0",/** 网格竖线颜色 */

		lineWidth: 1,/** 折线线宽 */
		lineColor: null,/** 折线颜色 */

		coordinateBackground: null,/** 坐标系围成的矩形区域的背景色 */
		enclosedAreaBackground: null,/** 折线与X轴围绕而成的封闭区域的背景色 */

		showVolume: false,  /** 是否显示量图 */
		volumeWidth: 3, /** 量图每个柱状图的宽度。最好为奇数，从而使得线可以正好在正中间*/
		volumeAreaRatio: 0.33, /** 量图区域所占比例 0~1 */
		volumeMarginTop: 15,/** 量图区的顶部外边距 （即与图形区的间距）*/
		volumeAxisYTickOffset: 0, /** 量图纵坐标刻度距离原点的位移 */
		volumeAxisYMidTickQuota: 2, /** 量图纵坐标刻度个数（不包括最小值和最大值） */
		volumeAxisYFloor: null, /** 量图纵坐标最小刻度, 为null时自动 */
		volumeAxisYPrecision: "auto",/** 量图纵坐标的数字精度。auto：根据给定的数据自动检测 */
		volumeAxisYFormatter: function(volume, config){/** 量图纵坐标数字格式化方法 */
			/** volume：数量；config：配置 */
			return util.formatMoney(volume, config.volumeAxisYPrecision);
		},
		volumeAxisYLabelFont: null,/** 量图纵坐标的坐标标签字体 */
		volumeAxisYLabelColor: null,/** 量图纵坐标的坐标标签颜色 */
		volumeAxisYLabelVerticalOffset: function(i, n){/** 量图纵坐标标签纵向位移 */
			//i: 自下而上的刻度索引。从0开始
			//n：刻度的总个数，包括最小值和最大值
			return 0;
		},
		volumeColor: "orange", /** 量图颜色（柱状图）, 可以为数组*/
		appreciatedVolumeColor: "orange",/** 收盘价大于开盘价时，绘制量图用的画笔或油漆桶颜色 */
		depreciatedVolumeColor: "orange",/** 收盘价小于开盘价时，绘制量图用的画笔或油漆桶颜色 */

		showAvgPriceLine: false, /** 是否显示均价 */
		avgPriceLineWidth: 1, /** 均线线宽 */
		avgPriceLineColor: "orange", /** 均线颜色 */

		lastClosingPrice: null,/** 昨日收盘价 */
		showLastClosingPriceLine: false,/** 是否显示昨日收盘价对应的线条（简称：昨日收盘线） */
		showLastClosingPriceLine_lineWidth: 1,/** 昨日收盘线线宽 */
		showLastClosingPriceLine_lineColor: null,/** 昨日收盘线线条颜色 */
		showLastClosingPriceLine_lineDash: [1, 3, 3],/** 昨日收盘线线条的虚线构造方法。如果需要用实线，则用“[1]”表示 */

		/**
		 * 交易节信息（全部展示时使用）。
		 * 数据格式：
		 * {
		 *    begin: 该交易节开始时间（HH:mm）,
		 *    end：该交易节开始时间（HH:mm）
		 *    minutes：该交易节分钟数
		 * }
		 */
		timeSections: [],
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
	 * 根据给定的配置，计算图形坐标系的宽度
	 * @param {JsonObject} config 渲染配置
	 */
	var calcChartAxisWidth = function(config){
		return Math.floor(config.width - config.paddingLeft - config.paddingRight);
	};

	/**
	 * 根据给定的配置，计算图形内容区域（买方或卖方单方的宽度，约等于图表宽度的一半）的宽度
	 * @param {JsonObject} config 渲染配置
	 */
	var calcChartContentWidth = function(config){
		var axisWidth = calcChartAxisWidth(config);
		return Math.floor(axisWidth - config.axisXTickOffset - config.axisXTickOffsetFromRight);
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
			maxDotCount: 0,/** 可呈现的最多的点的个数 */
			priceHeightRatio: 0,/** 价格与高度之间的映射比例 */
			volumeHeightRatio: 0/** 交易量与高度之间的映射比例 */
		};

		var ifShowAxisYLeft = "left" == String(config.axisYPosition).toLowerCase();

		chartSketch.width = calcChartAxisWidth(config);
		chartSketch.contentWidth = calcChartContentWidth(config);

		/* 量图 */
		if(config.showVolume){
			chartSketch.height = Math.round(numBig(new Big(config.height).mul(1- config.volumeAreaRatio)) - config.paddingTop - config.volumeMarginTop);
			chartSketch.volumeHeight = Math.round(numBig(new Big(config.height).mul(config.volumeAreaRatio)) - config.paddingBottom);
			chartSketch.volumeContentHeight = Math.floor(chartSketch.volumeHeight);
		}else{
			chartSketch.height =  Math.floor(config.height - config.paddingTop - config.paddingBottom);
		}
		chartSketch.contentHeight = Math.floor(chartSketch.height - config.axisYTickOffset);
		chartSketch.maxDotCount = floorBig(new Big(chartSketch.contentWidth).div(config.dotGap + 1)) + 1;

		return chartSketch;
	};

	/**
	 * 根据给定的配置信息和画布元素，计算最多可以绘制的数据个数
	 * @param {HTMLCanvasElement} canvasObj Canvas DOM元素
	 * @param {Object} config 渲染配置
	 */
	var calcMaxDotCount = function(canvasObj, config){
		var maxDotCount = 0;

		mergeDefaultChartConfigAndDo(config, function(mergedConfig){
			/** 百分比尺寸自动转换 */
			if(/%/.test(mergedConfig.width))
				mergedConfig.width = canvasObj.parentElement.clientWidth * parseInt(mergedConfig.width.replace(/%/, "")) / 100;
			if(/%/.test(mergedConfig.height))
				mergedConfig.height = canvasObj.parentElement.clientHeight * parseInt(mergedConfig.height.replace(/%/, "")) / 100;

			/**
			 * 点之间的间隔自动调整
			 * 如果点之间的间隔为auto，则在数据量最大的情况下，点与点之间的间隔将为0。
			 * 由于该方法不便于要求调用端提供数据，因此将“武断”地返回间隔为0情况下可绘制的最大数据量，即为可绘制区域的宽度（根据render方法的间隔自动调整方法得出）
			 */
			if("auto" == String(mergedConfig.dotGap).toLowerCase()){
				mergedConfig.dotGap = 0;
			}

			var maxVolumeWidth = floorBig(new Big(mergedConfig.dotGap + 1).div(2)) * 2 + 1;
			if(config.volumeWidth > maxVolumeWidth){
				console.warn("Configured volume width(" + config.volumeWidth + ") is too big, auto adjust to " + maxVolumeWidth);
				mergedConfig.volumeWidth = maxVolumeWidth;
			}

			maxDotCount = sketchChart(mergedConfig).maxDotCount;
		});

		return maxDotCount;
	};

	/**
	 * 从给定的数字中获取该数字所使用的精度
	 * @param {Integer} num 数字精度
	 */
	var getPrecision = function(num){
		var tmp = String(num);
		var lastDotIndex = tmp.lastIndexOf(".");
		if(-1 == lastDotIndex)
			return 0;

		return tmp.substring(lastDotIndex + 1).length;
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
			dataSketch_origin_maxVolumeVariation = 0;/* 交易量的最大变动幅度 */

		var extendedData = {
			priceCeiling: 0,/* 坐标中价格的最大值 */
			priceFloor: 0,/* 坐标中价格的最小值 */
			pricePrecision: 0,/* 坐标中价格的精度 */

			volumeCeiling: 0,/* 坐标中成交量的最大值 */
			volumeFloor: 0,/* 坐标中成交量的最小值 */
			volumePrecision: 0/* 坐标中成交量的精度 */
		};
		var chartSketch = sketchChart(config);

		/* 数据概览扫描 */
		var lastClosingPrice = util.parseAsNumber(config.lastClosingPrice, 0);
		var previous = {price: 0, volume: 0};
		var variationSum = 0, volumeVariationSum = 0;
		var axisYPrecision = 0, volumeAxisYPrecision = 0;
		for(var i = 0; i < datas.length && i < chartSketch.maxDotCount; i++){
			var d = datas[i];
			/* 数据格式转换 */
			d = dataParser? dataParser(d, i, datas): d;

			var price = +d.price || 0;
			var avgPrice = util.parseAsNumber(d.avgPrice, price),
				openPrice = util.parseAsNumber(d.openPrice, price),
				closePrice = util.parseAsNumber(d.closePrice, price);

			if(i == 0){
				previous = d;
				lastClosingPrice = util.parseAsNumber(price, 0);
			}

			dataSketch_origin_min = Math.min(price, avgPrice, openPrice, closePrice, dataSketch_origin_min);
			dataSketch_origin_max = Math.max(price, avgPrice, openPrice, closePrice, dataSketch_origin_max);

			if(+d.volume > dataSketch_origin_maxVolume)
				dataSketch_origin_maxVolume = +d.volume;
			if(+d.volume < dataSketch_origin_minVolume)
				dataSketch_origin_minVolume = +d.volume;

			var variation = Math.abs(price - +previous.price),
				volumeVariation = Math.abs(+d.volume - +previous.volume);

			/* 确定更大的变动幅度 */
			if(variation > dataSketch_origin_maxVariation)
				dataSketch_origin_maxVariation = variation;
			if(volumeVariation > dataSketch_origin_maxVolumeVariation)
				dataSketch_origin_maxVolumeVariation = volumeVariation;

			variationSum += variation;
			volumeVariationSum += volumeVariation;

			/* 数据精度确定 */
			[price, avgPrice, openPrice, closePrice].forEach(function(digit){
				extendedData.pricePrecision = Math.max(extendedData.pricePrecision, getPrecision(digit));
			});
			extendedData.volumePrecision = Math.max(extendedData.volumePrecision, getPrecision(d.volume));

			previous = d;
		}
		var len = datas.length;
		dataSketch_origin_avgVariation = len > 0? numBig(new Big(variationSum).div(len)): 0;
		dataSketch_origin_avgVolumeVariation = len > 0? numBig(new Big(volumeVariationSum).div(len)): 0;

		/* 确定Y轴最小值 */
		if(null != config.axisYPriceFloor){
			if(typeof config.axisYPriceFloor == "function")
				extendedData.priceFloor = config.axisYPriceFloor(dataSketch_origin_min, dataSketch_origin_max, dataSketch_origin_avgVariation, dataSketch_origin_maxVariation);
			else
				extendedData.priceFloor = Number(config.axisYPriceFloor);
		}else
			extendedData.priceFloor = dataSketch_origin_min - numBig(new Big(dataSketch_origin_avgVariation).div(2));
		extendedData.priceFloor = Math.min(extendedData.priceFloor, lastClosingPrice);
		if(!isFinite(extendedData.priceFloor) || extendedData.priceFloor < 0)
			extendedData.priceFloor = 0;

		/* 确定Y轴最大值 */
		if(null != config.axisYPriceCeiling){
			if(typeof config.axisYPriceCeiling == "function")
				extendedData.priceCeiling = config.axisYPriceCeiling(dataSketch_origin_min, dataSketch_origin_max, dataSketch_origin_avgVariation, dataSketch_origin_maxVariation);
			else
				extendedData.priceCeiling = Number(config.axisYPriceCeiling);
		}else
			extendedData.priceCeiling = dataSketch_origin_max + numBig(new Big(dataSketch_origin_avgVariation).div(2));
		if(extendedData.priceCeiling < dataSketch_origin_max)
			extendedData.priceCeiling = dataSketch_origin_max;
		extendedData.priceCeiling = Math.max(extendedData.priceCeiling, lastClosingPrice);
		if(!isFinite(extendedData.priceCeiling) || extendedData.priceCeiling < 0)
			extendedData.priceCeiling = extendedData.priceFloor;

		/* 确保最大值与最小值不同 */
		var b = new Big(extendedData.priceFloor);
		if(b.eq(extendedData.priceCeiling))
			extendedData.priceCeiling = b.eq(0)? 1: numBig(b.mul(1.3));

		/* 确定量图Y轴最小值 */
		b = new Big(dataSketch_origin_avgVolumeVariation).div(2);
		if(null != config.volumeAxisYFloor){
			extendedData.volumeFloor = Number(config.volumeAxisYFloor);
		}else
			extendedData.volumeFloor = dataSketch_origin_minVolume - numBig(b);
		if(!isFinite(extendedData.volumeFloor) || extendedData.volumeFloor < 0)
			extendedData.volumeFloor = 0;

		/* 确定量图Y轴最大值 */
		extendedData.volumeCeiling = dataSketch_origin_maxVolume + numBig(b);
		if(!isFinite(extendedData.volumeCeiling) || extendedData.volumeCeiling < 0)
			extendedData.volumeCeiling = 0;

		/* 确保最大值与最小值不同 */
		b = new Big(extendedData.volumeFloor);
		if(b.eq(extendedData.volumeCeiling))
			extendedData.volumeCeiling = b.eq(0)? 1: numBig(b.mul(1.3));

		b = new Big(extendedData.priceCeiling - extendedData.priceFloor).div(Math.max(chartSketch.contentHeight, 1));
		chartSketch.priceHeightRatio = b.eq(0)? 1: numBig(b);
		b = new Big(extendedData.volumeCeiling - extendedData.volumeFloor).div(Math.max(chartSketch.volumeContentHeight, 1));
		chartSketch.volumeHeightRatio = b.eq(0)? 1: numBig(b);

		return {extendedData: extendedData, chart: chartSketch};
	};

	/**
	 * 初始化画布（设置宽高、伸缩比例等）
	 * @param {HTMLCanvasElement} canvasObj 画布
	 * @param {Object} config 渲染配置
	 * @param {Object[]} datas 数据数组
	 */
	var initCanvasAndConfig = function(canvasObj, config, datas){
		/* 历史兼容，待移除 */
		if(!!config.showTrendAll)
			config.dotGap = "auto";

		/* 历史兼容，带移除 */
		if(!!config.axisYVolumeFloor){
			config.volumeAxisYFloor = config.axisYVolumeFloor;
			delete config.axisYVolumeFloor;
		}

		/* 百分比尺寸自动转换 */
		if(/%/.test(config.width))
			config.width = canvasObj.parentElement.clientWidth * parseInt(config.width.replace(/%/, "")) / 100;
		if(/%/.test(config.height))
			config.height = canvasObj.parentElement.clientHeight * parseInt(config.height.replace(/%/, "")) / 100;
		util.setAttributes(canvasObj, {width: config.width, height: config.height});

		/* 点之间的间隔自动调整 */
		if("auto" == String(config.dotGap).toLowerCase()){
			var contentWidth = calcChartContentWidth(config);
			var dotCount = Math.min(contentWidth, datas.length);/* 再密集，也只能一个点一个像素 */
			var dotGap = dotCount <= 1? (contentWidth - dotCount): ((contentWidth - dotCount) / (dotCount - 1));

			console.info("Auto set trend chart dot gap to " + dotGap);
			config.dotGap = dotGap;
		}

		var maxVolumeWidth = floorBig(new Big(config.dotGap + 1).div(2)) * 2 + 1;
		if(config.volumeWidth > maxVolumeWidth){
			console.warn("Configured volume width(" + config.volumeWidth + ") is too big, auto adjust to " + maxVolumeWidth);
			config.volumeWidth = maxVolumeWidth;
		}

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
	 * 已完成渲染的分时图
	 * @param {TrendChart} trendChart 分时图实例
	 * @param {Object} sketch 数据和图形的扫描分析结果
	 * @param {Object} config 渲染配置
	 * @param {Object} renderMetadata 渲染时使用的基准数据
	 */
	var RenderedTrendChart = function(trendChart, sketch, config, renderMetadata){
		if(!(trendChart instanceof TrendChart))
			throw new Error("Invalid argument. TrendChart instance is needed.");

		/**
		 * 获取渲染用到的配置数据
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * 获取数据和图形的扫描分析结果
		 * @returns {Object}
		 */
		this.getSketch = function(){
			return sketch;
		};

		/**
		 * 获取渲染时使用的基准数据
		 */
		this.getRenderMetadata = function(){
			return renderMetadata;
		};

		/**
		 * 获取被渲染的点的个数
		 * @returns {Integer} 被渲染的点的个数
		 */
		this.getDotCount = function(){
			return Math.min(trendChart.getDatas().length, sketch.chart.maxDotCount);
		};

		/**
		 * 获取被渲染的原始数据列表
		 */
		this.getRenderingOriginalDatas = function(){
			var datas = trendChart.getDatas() || [];
			var count = Math.min(this.getDotCount(), datas.length);

			return datas.slice(0, count);
		};

		/**
		 * 获取被渲染的转换后的数据列表
		 */
		this.getRenderingConvertedDatas = function(){
			var originalDatas = this.getRenderingOriginalDatas();
			var datas = originalDatas;

			var dataParser = trendChart.getDataParser();
			if(typeof dataParser == "function")
				datas = originalDatas.map(function(d, dataIndex){
					return dataParser(d, dataIndex, originalDatas || []);
				});

			return datas;
		};

		/**
		 * 获取指定的相对横坐标对应的数据索引
		 * @param {Number} x 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @reutrns {Integer} 相对横坐标对应的数据索引。如果位置在区域左侧，则返回0；如果在区域右侧，则返回最后一条数据的索引。如果数据区域中没有任何数据，则返回-1
		 */
		this.getDataIndex = function(x){
			var dotCount = this.getDotCount();
			var minX = Math.floor(config.paddingLeft + config.axisXTickOffset) + 0.5;
			var maxX = minX + sketch.chart.contentWidth;

			if (x < minX){
				x = minX;
			} else if (x > maxX){
				x = maxX;
			}

			var tmpX = x - minX;
			var index = roundBig(new Big(tmpX).div(config.dotGap + 1));

			if(index < 0)
				index = 0;
			else if(index >= dotCount){
				if(dotCount > 0)
					index = dotCount - 1;
				else
					index = -1;
			}

			return index;
		};

		/**
		 * 根据提供的点的索引位置返回格式转换前的原始数据
		 * @param {Integer} dataIndex 点的索引位置
		 */
		this.getOriginalData = function(dataIndex){
			var list = trendChart.getDatas() || [];
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
				d = dataParser(d, dataIndex, trendChart.getDatas() || []);

			return d;
		};

		/**
		 * 获取指定的相对横坐标对应的数据在画布上的坐标位置
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @return {Object} 坐标位置，形如：{x: <x>, y: <y>}。如果没有数据与之对应，则返回null。
		 */
		this.getCoordinate = function(x){
			var dataIndex = this.getDataIndex(x);
			if(-1 == dataIndex)
				return null;

			var minX = Math.floor(config.paddingLeft + config.axisXTickOffset) + 0.5,
				minY = Math.floor(config.paddingTop) + 0.5;

			var data = trendChart.getDatas()[dataIndex];
			var dataParser = trendChart.getDataParser();
			data = dataParser? dataParser(data, dataIndex, trendChart.getDatas() || []): data;

			var obj = {x: 0, y: 0};
			obj.x = minX + roundBig(new Big(dataIndex).mul(config.dotGap + 1));
			obj.y = minY + roundBig(new Big(Math.abs(sketch.extendedData.priceCeiling - data.price)).div(sketch.chart.priceHeightRatio));

			return obj;
		};
	};

	/**
	 * @constructor
	 * 分时图
	 * 数据格式：{time: "", price: 12.01}
	 *
	 */
	var TrendChart = function(){
		TradeChart.apply(this, arguments);

		/** 数据数组 */
		var datas;
		/** 数据转换方法，用于将提供的数据数组转为本图表兼容的格式 */
		var dataParser;

		/**
		 * 设置数据源
		 * @param {Object[]} _datas 数据源
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
		 * @param {Function} parser 数据转换方法
		 */
		this.setDataParser = function(parser){
			dataParser = parser;
			return this;
		};

		/**
		 * 获取数据转换方法
		 * @returns {Function} 数据转换方法
		 */
		this.getDataParser = function(){
			return dataParser;
		};

		/**
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} config 渲染配置
		 * @return {RenderedTrendChart} 绘制的分时图
		 */
		var doRender = function(canvasObj, config){
			initCanvasAndConfig(canvasObj, config, datas);
			var ctx = canvasObj.getContext("2d");

			var _sketch = sketch(datas, dataParser, config);
			if("auto" == String(config.axisYPrecision).toLowerCase())
				config.axisYPrecision = _sketch.extendedData.pricePrecision + 1;
			if("auto" == String(config.volumeAxisYPrecision).toLowerCase())
				config.volumeAxisYPrecision = _sketch.extendedData.volumePrecision + 1;

			// console.log("Trend chart sketch", JSON.stringify(_sketch));
			// console.log("Trend chart config", config);

			/** 绘制的数据个数 */
			var dotCount = Math.min(_sketch.chart.maxDotCount, datas.length);
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
						/* 分时图 */
						ctx.moveTo(tickX, y_axisX);
						ctx.lineTo(tickX, y_axisX + config.axisTickLineLength);
						/* 量图 */
						if(config.showVolume){
							ctx.moveTo(tickX, y_volume_axisX);
							ctx.lineTo(tickX, y_volume_axisX + config.axisTickLineLength);
						}
						ctx.stroke();
					}
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
						ctx.moveTo(x_axisY, tickY);
						ctx.lineTo(x_axisY + axisTickLineOffset, tickY);
						ctx.stroke();
					}
					if(config.showAxisYLabel){
						var volumeAxisYLabelVerticalOffset = config.volumeAxisYLabelVerticalOffset;
						if(typeof volumeAxisYLabelVerticalOffset == "function")
							volumeAxisYLabelVerticalOffset = volumeAxisYLabelVerticalOffset(i, maxVolumeAxisYTickIndex + 1);
						ctx.fillText(tick.label, x_axisY + axisYLabelOffset, tickY + volumeAxisYLabelVerticalOffset);
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
					ctx.save();

					if(config.showAxisXLine){
						/* 绘制分时图X轴 */
						ctx.beginPath();
						ctx.moveTo(xLeft_axisX, y_axisX);
						ctx.lineTo(xRight_axisX, y_axisX);
						ctx.stroke();

						/* 绘制量图X轴 */
						if(config.showVolume){
							ctx.beginPath();
							ctx.moveTo(xLeft_axisX, y_volume_axisX);
							ctx.lineTo(xRight_axisX, y_volume_axisX);
							ctx.stroke();
						}
					}

					/**
					 * 绘制刻度
					 * @param {String} label 刻度文本
					 * @param {Float} x 刻度所在的横坐标位置（原点位置为坐标轴原点的横坐标 + 横坐标偏移）。如果没有提供，则根据点的索引位置自动计算
					 */
					var renderXTick = function(label, x){
						var tickX = xLeft_axisX + config.axisXTickOffset + Math.floor(x);

						/* 绘制网格竖线 */
						if(ifShowVerticalGridLine){
							ctx.save();
							ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
							ctx.strokeStyle = config.verticalGridLineColor;

							ctx.beginPath();
							/* 分时图 */
							ctx.moveTo(tickX, y_axisX - 1);
							ctx.lineTo(tickX, y_axisX - 1 - Math.floor(_sketch.chart.height));
							/* 量图 */
							if(config.showVolume){
								ctx.moveTo(tickX, y_volume_axisX - 1);
								ctx.lineTo(tickX, y_volume_axisX - 1 - Math.floor(_sketch.chart.volumeHeight));
							}
							ctx.stroke();
							ctx.restore();
						}

						/* 汇集刻度，用于图形绘制完毕后统一绘制 */
						axisXTickList.push({x: tickX, label: label});
					};

					/* 上一个绘制的横坐标刻度对应的数据索引 */
					var previousXTickDataIndex = null;

					/**
					 * 根据提供的点的索引位置绘制刻度
					 * @param {Integer} i 数据的索引位置
					 * @param {String} [label] 刻度文本。缺省时，将使用axisXLabelGenerator自动生成（默认为time字段）
					 */
					var renderXTickByDataIndex = function(i, label){
						if(i < 0 || i >= dotCount)
							return;

						if(arguments.length < 2){
							var data = dataParser? dataParser(datas[i], i, datas): datas[i];

							var previousData = null;
							if(null != previousXTickDataIndex && previousXTickDataIndex >=0 && previousXTickDataIndex < datas.length)
								previousData = datas[previousXTickDataIndex];
							if(null != previousData && dataParser)
								previousData = dataParser(previousData, previousXTickDataIndex, datas);

							label = config.axisXLabelGenerator(data, i, previousData, previousXTickDataIndex);
						}
						previousXTickDataIndex = i;

						var x = numBig(new Big(config.dotGap + 1).mul(i));
						return renderXTick(label, x);
					};

					/* 绘制刻度线 */
					if(Array.isArray(config.timeSections) && config.timeSections.length > 0){/* 此时忽略dotGap配置，显示所有数据 */
						var totalMinutes = config.timeSections.reduce(function(sum, timeSection){
							return sum + timeSection.minutes;
						}, 0);

						var _axisXTicks = [];
						/** 最小的“交易节宽度与横坐标总宽度的比值” */
						var minTimeSectionWidthRatio = config.timeSections.reduce(function(min, timeSection, i){
							if(_axisXTicks.length == 0){
								_axisXTicks.push({
									x: 0,
									label: timeSection.begin
								});
							}else
								_axisXTicks[_axisXTicks.length - 1].label += "/" + timeSection.begin;

							var timeSectionWidthRatio = numBig(new Big(timeSection.minutes).div(totalMinutes));
							_axisXTicks.push({
								x: _axisXTicks[_axisXTicks.length - 1].x + timeSectionWidthRatio * _sketch.chart.contentWidth,
								label: timeSection.end
							});

							return Math.min(min, timeSectionWidthRatio);
						}, Infinity);

						/* 根据横坐标文本长度，决定呈现每个交易节的起止时间，还是只呈现第一个交易节的开始时间和最后一个交易节的结束时间 */
						if(minTimeSectionWidthRatio * _sketch.chart.contentWidth > config.axisXLabelSize){
							_axisXTicks.forEach(function(tick){
								renderXTick(tick.label, tick.x);
							});
						}else{
							renderXTick(_axisXTicks[0].label, _axisXTicks[0].x);

							var lastTick = _axisXTicks[_axisXTicks.length - 1];
							renderXTick(lastTick.label, lastTick.x);
						}
					}else{
						var groupSize = config.dotGap + 1,
							halfGroupSize = numBig(new Big(config.axisXLabelSize).div(2));

						var axisXTickInterval = ceilBig(new Big(config.axisXLabelSize).div(groupSize));/* 横坐标刻度之间相差的点的个数 */
						var axisXTickCount = floorBig(new Big(dotCount).div(axisXTickInterval)),
							lastTickDataIndex;

						var b = new Big(axisXTickInterval);
						for(var i = 0; i < axisXTickCount; i++)
							renderXTickByDataIndex(roundBig(b.mul(i)));
						lastTickDataIndex = roundBig(b.mul(i));

						var totalSpace = Math.min(numBig(new Big(dotCount - 1).mul(groupSize)), _sketch.chart.contentWidth);
						var remainingSpace = totalSpace - (numBig(new Big(lastTickDataIndex).mul(groupSize)) + halfGroupSize);

						// var totalSpace = _sketch.chart.contentWidth;
						// var remainingSpace = totalSpace - (renderedTickCount * axisXTickInterval * (config.dotGap + 1)  + config.axisXLabelSize / 2);
						if(remainingSpace < halfGroupSize){
							/* 剩余空间不足，只绘制边界刻度 */
							renderXTickByDataIndex(dotCount - 1);
						}else{
							var k = dotCount - 1,
								j = Math.min(lastTickDataIndex, k);

							/* 绘制最后一个刻度和边界刻度 */
							renderXTickByDataIndex(j);
							if(j != k)
								renderXTickByDataIndex(k);
						}
					}

					ctx.restore();
				})();

				/* 绘制Y轴 */
				;(function(){
					if(config.showAxisYLine){
						/* 绘制分时图Y轴 */
						ctx.beginPath();
						ctx.moveTo(x_axisY, yTop_axisY);
						ctx.lineTo(x_axisY, yBottom_axisY);
						ctx.stroke();

						/* 绘制量图Y轴 */
						if(config.showVolume){
							ctx.beginPath();
							ctx.moveTo(x_axisY, yTop_volume_axisY);
							ctx.lineTo(x_axisY, yBottom_volume_axisY);
							ctx.stroke();
						}
					}

					/* 绘制Y轴刻度（自下而上） */
					var maxAxisYTickIndex = config.axisYMidTickQuota + 1;
					for(var i = 0; i <= maxAxisYTickIndex; i++){
						var price = _sketch.extendedData.priceFloor + numBig(new Big(axisYPriceInterval).mul(i)),
							tickOffset = numBig(new Big(maxAxisYTickIndex - i).mul(axisYHeightInterval));
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
						var format = config.axisYFormatter || defaultChartConfig.axisYFormatter;
						axisYTickList.push({y: tickY, label: format(price, config)});
					}
					/* 量图 */
					if(config.showVolume){
						var axisYVolumeInterval = numBig(new Big(_sketch.extendedData.volumeCeiling - _sketch.extendedData.volumeFloor).div(config.volumeAxisYMidTickQuota + 1));
						var maxVolumeAxisYTickIndex = config.volumeAxisYMidTickQuota + 1;

						if(_sketch.chart.volumeHeightRatio != 0){
							var axisYHeightIntervalAux = axisYVolumeInterval / _sketch.chart.volumeHeightRatio;
							var previousVolume = null;
							for(var i = 0; i <= maxVolumeAxisYTickIndex; i++){
								var volume = _sketch.extendedData.volumeFloor + numBig(new Big(axisYVolumeInterval).mul(i));
								volume = (config.volumeAxisYFormatter || defaultChartConfig.volumeAxisYFormatter)(volume, config);
								if(volume == previousVolume)
									continue;

								previousVolume = volume;
								var tickOffset = numBig(new Big(maxVolumeAxisYTickIndex - i).mul(axisYHeightIntervalAux));
								var tickY = yTop_volume_axisY + Math.round(tickOffset);

								/* 绘制网格横线 */
								if(ifShowHorizontalGridLine && i > 0){/* 坐标轴横线上不再绘制 */
									ctx.save();
									ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
									ctx.strokeStyle = config.horizontalGridLineColor;

									ctx.beginPath();
									ctx.moveTo(x_axisY, tickY);
									ctx.lineTo(x_axisY + (ifShowAxisYLeft? 1: -1) * Math.floor(_sketch.chart.width), tickY);
									ctx.stroke();
									ctx.restore();
								}

								/* 汇集刻度，用于图形绘制完毕后统一绘制 */
								volumeAxisYTickList.push({y: tickY, label: volume});
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

					/* 分时图 */
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

			/* 绘制折线图 */
			;(function(){
				ctx.save();

				config.lineWidth && (ctx.lineWidth = config.lineWidth);
				config.lineColor && (ctx.strokeStyle = config.lineColor);

				/* 确定折线点及绘制量图 */
				var volumeWidth = config.volumeWidth || (config.dotGap - config.volumeInterval),
					halfVolumeWidth = roundBig(new Big(volumeWidth - 1).div(2));
				var startX = xLeft_axisX + Math.floor(config.axisXTickOffset);
				var dots = [],/** 第一个点和最后一个点是X轴的起始点和终止点。中间部分是折线点 */
				avgPriceDots = [];/** 均线点 */
				dots.push([startX, y_axisX]);
				var dotX, dotY, data;
				for(var i = 0; i < dotCount; i++){
					data = datas[i];
					/* 数据格式转换 */
					data = dataParser? dataParser(data, i, datas): data;

					/* 分时图折线 */
					dotX = startX + floorBig(new Big(config.dotGap + 1).mul(i));
					dotY = yTop_axisY + Math.floor(getHeight(data.price));
					dots.push([dotX, dotY]);

					/* 均线折线 */
					if(config.showAvgPriceLine && data.avgPrice != null){
						dotY = yTop_axisY + Math.floor(getHeight(data.avgPrice));
						avgPriceDots.push([dotX, dotY]);
					}

					/* 绘制量图 */
					if(config.showVolume){
						ctx.save();

						var isOpenPriceEmpty = null == data.openPrice || "" == String(data.openPrice).trim(),
							isClosePriceEmpty = null == data.closePrice || "" == String(data.closePrice).trim();
						var isOpenPriceValid = !isOpenPriceEmpty && !isNaN(data.openPrice = Number(data.openPrice)),
							isClosePriceValid = !isClosePriceEmpty && !isNaN(data.closePrice = Number(data.closePrice));
						var isKeeped = !isOpenPriceValid || !isClosePriceValid || Math.abs(+data.closePrice - +data.openPrice) < 2e-7,
							isAppreciated = !isKeeped && (data.closePrice > data.openPrice),
							isDepreciated = !isKeeped && (data.closePrice < data.openPrice);

						var volumeColor = config.volumeColor;
						if(Array.isArray(volumeColor))
							volumeColor = volumeColor[i % volumeColor.length];
						else
							volumeColor = isKeeped? config.volumeColor: (isAppreciated? config.appreciatedVolumeColor: config.depreciatedVolumeColor);
						ctx.fillStyle = volumeColor;
						ctx.strokeWidth = 0;

						var volumeHeight = ceilBig(new Big(data.volume).div(_sketch.chart.volumeHeightRatio));
						var volumeX = Math.floor(dotX - halfVolumeWidth),
							volumeY = Math.floor(y_volume_axisX);

						ctx.fillRect(volumeX, volumeY - volumeHeight, volumeWidth, volumeHeight);
						ctx.restore();
					}
				}
				if(dots.length > 0)
					dots.push([dots[dots.length - 1][0], y_axisX]);

				/* 绘制分时图折线 */
				if(dots.length - 2 == 1){/* 只有一个点 */
					ctx.beginPath();
					ctx.arc(dots[1][0], dots[1][1], ctx.lineWidth * 2, 0, 2*Math.PI);
					ctx.fillStyle = config.lineColor;
					ctx.fill();
				}else if(dots.length - 2 > 1){
					ctx.beginPath();
					ctx.moveTo(dots[1][0], dots[1][1]);
					for(var i = 2; i < dots.length - 1; i++){
						ctx.lineTo(dots[i][0], dots[i][1]);
					}
					ctx.stroke();
				}

				/* 绘制分时图背景 */
				var bg = config.enclosedAreaBackground;
				if(null != bg){
					ctx.save();

					ctx.beginPath();
					ctx.moveTo(dots[0][0], dots[0][1]);
					for(i = 1; i < dots.length; i++){
						ctx.lineTo(dots[i][0], dots[i][1]);
					}

					ctx.strokeWidth = 0;
					if(bg instanceof TradeChart.LinearGradient){
						bg.apply(ctx, config.paddingLeft, config.paddingTop, config.paddingLeft, config.paddingTop + _sketch.chart.height);
					}else
						ctx.fillStyle = bg;
					ctx.fill();

					ctx.restore();
				}

				/* 绘制昨日收盘线 */
				if(config.showLastClosingPriceLine){
					var lastClosingPrice = config.lastClosingPrice;
					if(null != lastClosingPrice && !isNaN(lastClosingPrice = Number(lastClosingPrice))){
						var y_lastClosingPriceLine = Math.floor(yTop_axisY + getHeight(lastClosingPrice)) + 0.5;

						ctx.save();
						ctx.setLineDash(config.showLastClosingPriceLine_lineDash || [1]);
						ctx.lineWidth = config.showLastClosingPriceLine_lineWidth;
						ctx.strokeStyle = config.showLastClosingPriceLine_lineColor;

						ctx.beginPath();
						ctx.moveTo(xLeft_axisX, y_lastClosingPriceLine);
						ctx.lineTo(xRight_axisX, y_lastClosingPriceLine);
						ctx.stroke();

						ctx.restore();
					}
				}

				/* 绘制均线 */
				if(config.showAvgPriceLine && avgPriceDots.length > 0){
					ctx.save();

					ctx.strokeWidth = 1;
					config.avgPriceLineWidth && (ctx.lineWidth = config.avgPriceLineWidth);
					config.avgPriceLineColor && (ctx.strokeStyle = config.avgPriceLineColor);

					ctx.beginPath();
					ctx.moveTo(avgPriceDots[0][0], avgPriceDots[0][1]);
					avgPriceDots.forEach(function(avgPriceDot){
						ctx.lineTo(avgPriceDot[0], avgPriceDot[1]);
					});
					ctx.stroke();

					ctx.restore();
				}

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

			return new RenderedTrendChart(this, _sketch, util.cloneObject(config), renderMetadata);
		};

		/**
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} config 渲染配置
		 * @return {RenderedTrendChart} 绘制的分时图
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
		 * @param config {Object} 渲染配置
		 * @return {RenderedTrendChart} 绘制的分时图
		 */
		this.renderAt = function(domContainerObj, config){
			var canvasObj = document.createElement("canvas");
			domContainerObj.appendChild(canvasObj);

			return this.render(canvasObj, config);
		};
	};
	TrendChart.prototype = Object.create(TradeChart.prototype);

	TrendChart.calcMaxDotCount = calcMaxDotCount;
	TradeChart.defineChart("TrendChart", TrendChart);
})();