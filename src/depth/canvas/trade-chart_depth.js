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
	 * @typedef IntentionData
	 * @type {Object}
	 *
	 * @property {Number} price 价格
	 * @property {Number} amount 数量
	 */

	/**
	 * @typedef IntentionList
	 * @type {{buy: IntentionData[], sale: IntentionData[]}}
	 */

	/** 默认图形绘制选项 */
	var defaultChartConfig = {
		width: "100%",/** 整体图形宽度 */
		height: 300,/** 整体图形高度 */

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
		axisXTickOffset: 5,/** 横坐标刻度距离原点的位移 */
		axisXTickOffsetFromRight: 0,/** 最后一个横坐标刻度距离横坐标结束位置的位移 */
		axisXLabelOffset: 5,/** 横坐标标签距离坐标轴刻度线的距离 */
		axisXLabelSize: 55,/** 横坐标标签文字的长度（取值大小影响如何绘制边界刻度) */
		axisXLabelGenerator: function(convertedData, index, previousConvertedData, nextConvertedData){/* 横坐标标签文字的输出方法 */
			return convertedData.price;
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
		axisYTickOffset: 0,/** 纵坐标刻度距离原点的位移 */
		axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
		axisYPrecision: 2,/** 纵坐标的数字精度 */
		axisYFormatter: function(amount, config){/** 纵坐标数字格式化方法 */
			/** amount：委托量；config：配置 */
			return util.formatMoney(+amount, config.axisYPrecision);
		},
		axisYAmountFloor: function(min, max, avgVariation, maxVariation){
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
		axisYAmountCeiling: function(min, max, avgVariation, maxVariation){
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
		horizontalGridLineColor: "#EAEAEA",/** 网格横线颜色 */

		showVerticalGridLine: true,/** 是否绘制网格竖线 */
		verticalGridLineColor: "#EAEAEA",/** 网格竖线颜色 */

		coordinateBackground: null,/** 坐标系围成的矩形区域的背景色 */
		enclosedAreaBackground4Buyer: "#79EABF",/** 折线与X轴围绕而成的，代表买方的封闭区域的背景色 */
		enclosedAreaBackground4Seller: "#FFE0D1",/** 折线与X轴围绕而成的，代表卖方的封闭区域的背景色 */
		enclosedAreaGap: 20,/** 买方区域与卖方区域之间的横向间隔 */

		showEnclosedAreaEdgeLine: false,/** 是否绘制买卖区域的边界线 */
		enclosedAreaEdgeLineWidth: 1,/** 买卖区域边界线的线条宽度 */
		enclosedAreaEdgeLineColor: "#D0D0D0",/** 买卖区域边界线的线条颜色 */
		enclosedAreaEdgeLineDash: [1],/** 买卖区域边界线的线条的虚线构造方法。如果需要用实线，则用“[1]”表示 */

		showAreaColorBelonging: true,/** 是否呈现区域的买卖性质 */
		enclosedAreaBelongingTextFont: "normal 10px sans-serif, serif",/** 卖方区域的买卖性质文本字体 */
		enclosedAreaBelongingTextColor: null,/** 卖方区域的买卖性质文本颜色 */
		enclosedAreaBelongingText4Buyer: "买",/** 买方区域的买卖性质文本 */
		enclosedAreaBelongingText4Seller: "卖",/** 卖方区域的买卖性质文本 */
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

		return floorBig(new Big(axisWidth - config.axisXTickOffset - config.axisXTickOffsetFromRight - config.enclosedAreaGap).div(2));
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
			width: 0,/* 图表的宽度 */
			height: 0,/* 图表的高度 */
			contentWidth: 0,/* 图表内容的宽度（买方或卖方单方的宽度，约等于图表宽度的一半） */
			contentHeight: 0,/* 图表内容的高度 */
			maxDotCount: 0,/* 可呈现的最多的点的个数（买方或卖方单方区域中可以呈现的点的个数） */
			amountHeightRatio: 0,/* 委托量与高度之间的映射比例 */
		};

		chartSketch.width = calcChartAxisWidth(config);
		chartSketch.height =  Math.floor(config.height - config.paddingTop - config.paddingBottom);
		chartSketch.contentWidth = calcChartContentWidth(config);
		chartSketch.contentHeight = Math.floor(chartSketch.height - config.axisYTickOffset);
		chartSketch.maxDotCount = floorBig(new Big(chartSketch.contentWidth).div(config.dotGap + 1)) + 1;

		return chartSketch;
	};

	/**
	 * 根据给定的配置信息和画布元素，计算最多可以绘制的数据个数（买方或卖方单方区域中可以呈现的点的个数）
	 * @param {HTMLCanvasElement} canvasObj Canvas DOM元素
	 * @param {JsonObject} config 渲染配置
	 */
	var calcMaxDotCount = function(canvasObj, config){
		var maxDotCount = 0;
		mergeDefaultChartConfigAndDo(config, function(mergedConfig){
			/** 百分比尺寸自动转换 */
			if(/%/.test(mergedConfig.width))
				mergedConfig.width = canvasObj.parentElement.clientWidth * parseInt(mergedConfig.width.replace(/%/, "")) / 100;
			if(/%/.test(mergedConfig.height))
				mergedConfig.height = canvasObj.parentElement.clientHeight * parseInt(mergedConfig.height.replace(/%/, "")) / 100;

			maxDotCount = sketchChart(mergedConfig).maxDotCount;
		});

		return maxDotCount;
	};

	/**
	 * 扫描提供的数据，生成绘制所需的元数据
	 * @param {Object[]} datas 数据数组
	 * @param {Function} dataParser 数据转换方法
	 * @param {Object} config 渲染配置
	 * @returns {Object} 元数据集合
	 */
	var sketch = function(datas, dataParser, config){
		var dataSketch_origin_maxAmount = -Infinity,/* 最大委托量 */
			dataSketch_origin_minAmount = Infinity,/* 最小委托量 */
			dataSketch_origin_avgAmountVariation = 0,/* 委托量的平均变动幅度 */
			dataSketch_origin_maxAmountVariation = 0;/* 委托量的最大变动幅度 */

		var extendedData = {
			amountCeiling: 0,/* 坐标中委托量的最大值 */
			amountFloor: 0,/* 坐标中委托量的最小值 */
		};

		var chartSketch = sketchChart(config);

		/* 数据概览扫描 */
		var previousAmount = 0;
		var variationSum = 0;
		datas = (datas.buyer || []).concat(datas.seller || []);
		for(var i = 0; i < datas.length; i++){
			var d = datas[i];
			/* 数据格式转换 */
			d = dataParser? dataParser(d, i): d;

			if(+d.amount > dataSketch_origin_maxAmount)
				dataSketch_origin_maxAmount = +d.amount;
			if(+d.amount < dataSketch_origin_minAmount)
				dataSketch_origin_minAmount = +d.amount;

			var variation = Math.abs(+d.amount - previousAmount);

			/* 确定更大的变动幅度 */
			if(variation > dataSketch_origin_maxAmountVariation)
				dataSketch_origin_maxAmountVariation = variation;

			variationSum += variation;
			previousAmount = +d.amount;
		}
		var len = datas.length;
		dataSketch_origin_avgAmountVariation = len > 0? numBig(new Big(variationSum).div(len)): 0;

		/* 确定Y轴最小值 */
		if(null != config.axisYAmountFloor){
			if(typeof config.axisYAmountFloor == "function")
				extendedData.amountFloor = config.axisYAmountFloor(dataSketch_origin_minAmount, dataSketch_origin_maxAmount, dataSketch_origin_avgAmountVariation, dataSketch_origin_maxAmountVariation);
			else
				extendedData.amountFloor = Number(config.axisYAmountFloor);
		}else
			extendedData.amountFloor = dataSketch_origin_minAmount - numBig(new Big(dataSketch_origin_avgAmountVariation).div(2));
		if(!isFinite(extendedData.amountFloor) || extendedData.amountFloor < 0)
			extendedData.amountFloor = 0;

		/* 确定Y轴最大值 */
		if(null != config.axisYAmountCeiling){
			if(typeof config.axisYAmountCeiling == "function")
				extendedData.amountCeiling = config.axisYAmountCeiling(dataSketch_origin_minAmount, dataSketch_origin_maxAmount, dataSketch_origin_avgAmountVariation, dataSketch_origin_maxAmountVariation);
			else
				extendedData.amountCeiling = Number(config.axisYAmountCeiling);
		}else
			extendedData.amountCeiling = dataSketch_origin_maxAmount + numBig(new Big(dataSketch_origin_avgAmountVariation).div(2));
		if(extendedData.amountCeiling < dataSketch_origin_maxAmount)
			extendedData.amountCeiling = dataSketch_origin_maxAmount;
		if(!isFinite(extendedData.amountCeiling) || extendedData.amountCeiling < 0)
			extendedData.amountCeiling = extendedData.amountFloor;

		/* 确保最大值与最小值不同 */
		var b = new Big(extendedData.amountFloor);
		if(b.eq(extendedData.amountCeiling))
			extendedData.amountCeiling = b.eq(0)? 1: numBig(b.mul(1.3));

		b = new Big(extendedData.amountCeiling - extendedData.amountFloor).div(chartSketch.contentHeight);
		chartSketch.amountHeightRatio = b.eq(0)? 1: numBig(b);

		return {extendedData: extendedData, chart: chartSketch};
	};

	/**
	 * 获取买方区域的横坐标起止坐标（起止坐标上也可以绘图，亦即闭区间）
	 * @param {Object} config 渲染配置
	 * @param {Object} sketch 数据和图形的扫描分析结果
	 */
	var getBuyerAreaXSection = function(config, sketch){
		var minX = Math.floor(config.paddingLeft + config.axisXTickOffset) + 0.5;
		var maxX = minX + Math.floor(sketch.chart.contentWidth - 1);/* -1是因为minX占据了1个像素，其上也可以绘制。下同 */

		return {min: minX, max: maxX};
	};

	/**
	 * 获取卖方区域的横坐标起止坐标（起止坐标上也可以绘图，亦即闭区间）
	 * @param {Object} config 渲染配置
	 * @param {Object} sketch 数据和图形的扫描分析结果
	 */
	var getSellerAreaXSection = function(config, sketch){
		var maxX = Math.floor(config.width - 1 - config.paddingRight - config.axisXTickOffsetFromRight) + 0.5;
		var minX = maxX - Math.floor(sketch.chart.contentWidth - 1);/* -1是因为maxX占据了1个像素，其上也可以绘制。下同 */

		return {min: minX, max: maxX};
	};

	/**
	 * 初始化画布（设置宽高、伸缩比例等）
	 * @param {HTMLCanvasElement} canvasObj 画布
	 * @param {Object} config 渲染配置
	 * @param {{buyer: Object[], seller: Object[]}} datas 数据
	 */
	var initCanvasAndConfig = function(canvasObj, config, datas){
		/* 百分比尺寸自动转换 */
		if(/%/.test(config.width))
			config.width = canvasObj.parentElement.clientWidth * parseInt(config.width.replace(/%/, "")) / 100;
		if(/%/.test(config.height))
			config.height = canvasObj.parentElement.clientHeight * parseInt(config.height.replace(/%/, "")) / 100;
		util.setAttributes(canvasObj, {width: config.width, height: config.height});

		/* 点之间的间隔自动调整 */
		if("auto" == String(config.dotGap).toLowerCase()){
			var contentWidth = calcChartContentWidth(config);
			var dotCount = Math.min(contentWidth, Math.max((datas.buyer || []).length, (datas.seller || []).length));/* 再密集，也只能一个点一个像素 */
			var dotGap = dotCount <= 1? (contentWidth - dotCount): numBig(new Big(contentWidth - dotCount).div(dotCount - 1));

			console.info("Auto set depth chart dot gap to " + dotGap);
			config.dotGap = dotGap;
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
	 * 已完成渲染的深度图
	 * @param {DepthChart} depthChart 深度图实例
	 * @param {JsonObject} sketch 数据和图形的扫描分析结果
	 * @param {JsonObject} config 渲染配置
	 * @param {JsonObject} renderMetadata 渲染时使用的基准数据
	 * @param {Integer} sellerAreaHorizontalOffset 为了实现“向右对齐”效果，所有点在水平方向上执行的横向位移
	 */
	var RenderedDepthChart = function(depthChart, sketch, config, renderMetadata, sellerAreaHorizontalOffset){
		if(!(depthChart instanceof DepthChart))
			throw new Error("Invalid argument. DepthChart instance is needed.");

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
		 * 获取买方区域中被渲染的点的个数
		 * @returns {Integer} 被渲染的点的个数
		 */
		this.getBuyerDotCount = function(){
			var t = depthChart.getDatas();
			t = t && t.buyer || [];
			return Math.min(t.length, sketch.chart.maxDotCount);
		};

		/**
		 * 获取卖方区域中被渲染的点的个数
		 * @returns {Integer} 被渲染的点的个数
		 */
		this.getSellerDotCount = function(){
			var t = depthChart.getDatas();
			t = t && t.seller || [];
			return Math.min(t.length, sketch.chart.maxDotCount);
		};

		/**
		 * 判断指定的相对横坐标是否处于买方区域
		 * 注：买方区域在左侧，卖方区域在右侧。两个区域之间有固定间隔（配置项）的空隙
		 *
		 * @param {Number} x 相对于图形坐标系的横坐标。坐标系原点为画布Canvas的左上角
		 * @returns {Boolean}
		 */
		this.isInBuyerArea = function(x){
			var t = getBuyerAreaXSection(config, sketch);
			return x >= t.min && x <= t.max;
		};

		/**
		 * 判断指定的相对横坐标是否处于卖方区域
		 * 注：买方区域在左侧，卖方区域在右侧。两个区域之间有固定间隔（配置项）的空隙
		 *
		 * @param {Number} x 相对于图形坐标系的横坐标。坐标系原点为画布Canvas的左上角
		 * @returns {Boolean}
		 */
		this.isInSellerArea = function(x){
			var t = getSellerAreaXSection(config, sketch);
			return x >= t.min && x <= t.max;
		};

		/**
		 * 获取指定的相对横坐标对应的数据的位置信息
		 * @param {Number} x 相对于图形坐标系的横坐标。坐标系原点为画布Canvas的左上角
		 * @returns {null|{dataIndex: Number, area: String}} 数据的位置信息。如：{dataIndex: [数据（在卖方或卖方的数组中的）索引], area: [数据隶属的区域（买方：buyer；卖方：seller）]}
		 */
		this.getDataPosition = function(x){
			var buyerAreaXSection = getBuyerAreaXSection(config, sketch),
				sellerAreaXSection = getSellerAreaXSection(config, sketch);

			var isInBuyerArea = this.isInBuyerArea(x),
				isInSellerArea = this.isInSellerArea(x);
			if(!isInBuyerArea && !isInSellerArea)
				return null;

			var f = function(area, x){
				if("seller" == area)
					x -= sellerAreaHorizontalOffset;

				var section = "buyer" == area? buyerAreaXSection: sellerAreaXSection;
				var rst = {dataIndex: null, area: area}, tmpX;

				x = Math.max(section.min, x);
				x = Math.min(section.max, x);

				tmpX = x - section.min;
				rst.dataIndex = roundBig(new Big(tmpX).div(config.dotGap + 1));

				return rst;
			};

			var area = isInBuyerArea? "buyer": "seller";
			var rst = f(area, x);

			var arr = depthChart.getDatas()[area];
			if(rst.dataIndex < 0 || rst.dataIndex >= arr.length)
				return null;

			return rst;
		};

		/**
		 * 获取能够被渲染的原始数据列表
		 */
		this.getRenderingOriginalDatas = function(){
			var datas = depthChart.getDatas() || {};
			var datas4Buyer = datas.buyer || [],
				datas4Seller = datas.seller || [];
			var count4Buyer = Math.min(this.getBuyerDotCount(), datas4Buyer.length),
				count4Seller = Math.min(this.getSellerDotCount(), datas4Seller.length);

			return {buyer: datas4Buyer.slice(0, count4Buyer), seller: datas4Seller.slice(0, count4Seller)};
		};

		/**
		 * 根据提供的点的索引位置和区域信息返回格式转换前的原始数据
		 * @param {Integer} dataIndex 点的索引位置
		 * @param {StringEnum} area 点所在的区域。buyer：买方区域（左侧）；seller：卖方区域（右侧）
		 */
		this.getOriginalData = function(dataIndex, area){
			var list = depthChart.getDatas()[area] || [];
			if(dataIndex < 0 || dataIndex >= list.length)
				return null;

			return list[dataIndex];
		};

		/**
		 * 根据提供的点的索引位置和区域信息返回格式转换后的数据
		 * @param {Integer} dataIndex 点的索引位置（相对于特定的买方数据，或卖方数据）
		 * @param {StringEnum} area 点所在的区域。buyer：买方区域（左侧）；seller：卖方区域（右侧）
		 */
		this.getConvertedData = function(dataIndex, area){
			var d = this.getOriginalData(dataIndex, area);
			if(null == d)
				return d;

			var dataParser = depthChart.getDataParser();
			if(typeof dataParser == "function")
				d = dataParser(d, dataIndex);

			return d;
		};

		/**
		 * 获取指定的相对横坐标对应的数据在画布上的坐标位置
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @returns {Object} 坐标位置，形如：{x: <x>, y: <y>}。如果没有数据与之对应，则返回null。
		 */
		this.getCoordinate = function(x){
			var dataPosition = this.getDataPosition(x);
			if(null == dataPosition)
				return null;

			var buyerAreaXSection = getBuyerAreaXSection(config, sketch, depthChart.getDatas().buyer),
				sellerAreaXSection = getSellerAreaXSection(config, sketch, depthChart.getDatas().seller);

			var minX = "buyer" == dataPosition.area? buyerAreaXSection.min: sellerAreaXSection.min,
				minY = Math.floor(config.paddingTop) + 0.5;

			var data = depthChart.getDatas()[dataPosition.area][dataPosition.dataIndex];
			var dataParser = depthChart.getDataParser();
			data = dataParser? dataParser(data, dataPosition.dataIndex): data;

			var obj = {x: 0, y: 0};
			obj.x = minX + roundBig(new Big(dataPosition.dataIndex).mul(config.dotGap + 1)) + ("seller" == dataPosition.area? sellerAreaHorizontalOffset: 0);
			obj.y = minY + roundBig(new Big(Math.abs(sketch.extendedData.amountCeiling - +data.amount)).div(sketch.chart.amountHeightRatio));

			return obj;
		};
	};

	/**
	 * @constructor
	 * 深度图
	 *
	 * 数据格式：
	 * {
	 *    buyer: [{price: 12.01, amount: 100.01}...], 按价格升序排序
	 *    seller: [{price: 12.01, amount: 100.01}...] 按价格升序排序
	 * }
	 */
	var DepthChart = function(){
		TradeChart.apply(this, arguments);

		/** 数据数组 */
		var datas = {buyer: [], seller: []};
		/** 数据转换方法，用于将提供的数据数组转为本图表兼容的格式 */
		var dataParser;

		/**
		 * 设置数据源
		 * @param {JsonObject} _datas 数据源
		 */
		this.setDatas = function(_datas){
			_datas = _datas || {};
			_datas.buyer = _datas.buyer || [];
			_datas.seller = _datas.seller || [];

			datas = _datas;
			return this;
		};

		/**
		 * 设置买方数据源
		 * @param {Array#JsonObject} _datas 买方数据源
		 */
		this.setBuyerDatas = function(_datas){
			_datas = _datas || [];

			datas = datas || {buyer: [], seller: []};
			datas.buyer = _datas;
			return this;
		};

		/**
		 * 设置卖方数据源
		 * @param {Array#JsonObject} _datas 卖方数据源
		 */
		this.setSellerDatas = function(_datas){
			_datas = _datas || [];

			datas = datas || {buyer: [], seller: []};
			datas.seller = _datas;
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
		 * @param {Function} parser {Function} 数据转换方法
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
		 * 将数据按照价格升序排序
		 * @returns {number}
		 */
		var sortAsAscByPrice = function(a, b){
			a = dataParser? dataParser(a): a;
			b = dataParser? dataParser(b): b;
			return +a.price > +b.price? 1: -1;
		};

		/**
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} domContainerObj 画布
		 * @param {JsonObject} config 渲染配置
		 * @returns {RenderedDepthChart} 绘制的深度图
		 */
		var doRender = function(canvasObj, config){
			initCanvasAndConfig(canvasObj, config, datas);
			var ctx = canvasObj.getContext("2d");

			var maxDotCount = sketchChart(config).maxDotCount;

			/* 数据排序 */
			if(Array.isArray(datas.buyer))
				datas.buyer.sort(sortAsAscByPrice);
			if(Array.isArray(datas.seller))
				datas.seller.sort(sortAsAscByPrice);
			/* 数据裁剪 */
			datas.buyer = datas.buyer.slice(buyerAreaDotCount, datas.buyer.length);
			datas.seller = datas.seller.slice(0, sellerAreaDotCount);

			var _sketch = sketch(datas, dataParser, config);

			var /** 买方区域的起止横轴坐标 */
				buyerAreaXSection = getBuyerAreaXSection(config, _sketch),

				/** 卖方区域的起止横轴坐标 */
				sellerAreaXSection = getSellerAreaXSection(config, _sketch),

				/** 买方区域中要呈现的点的个数 */
				buyerAreaDotCount = Math.min(_sketch.chart.maxDotCount, datas.buyer.length),

				/** 卖方区域中要呈现的点的个数 */
				sellerAreaDotCount = Math.min(_sketch.chart.maxDotCount, datas.seller.length);

			// console.log("Depth chart sketch: " + JSON.stringify(_sketch));
			// console.log("Depth chart buyer area x section: " + JSON.stringify(buyerAreaXSection));
			// console.log("Depth chart buyer area dot count: " + buyerAreaDotCount);
			// console.log("Depth chart seller area x section: " + JSON.stringify(sellerAreaXSection));
			// console.log("Depth chart seller area dot count: " + sellerAreaDotCount);

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
				x_axisY = ifShowAxisYLeft? xLeft_axisX: xRight_axisX,
				yTop_axisY = Math.floor(config.paddingTop) + 0.5,
				yBottom_axisY = y_axisX;

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

				var y_axisXTickLabel = y_axisX + config.axisXLabelOffset;
				if(config.showAxisXLine)
					y_axisXTickLabel += config.axisTickLineLength;

				for(var i = 0; i < axisXTickList.length; i++){
					var tick = axisXTickList[i];
					var tickX = tick.x;

					/* 绘制刻度线 */
					if(config.showAxisXLine && config.showAxisXLabel){
						ctx.beginPath();
						ctx.moveTo(tickX, y_axisX);
						ctx.lineTo(tickX, y_axisX + config.axisTickLineLength);
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
				}

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

				for(var i = 0; i < axisYTickList.length; i++){
					var tick = axisYTickList[i];
					var tickY = tick.y;

					/* 绘制刻度线 */
					if(config.showAxisYLine && config.showAxisYLabel){
						ctx.beginPath();
						ctx.moveTo(x_axisY, tickY);
						ctx.lineTo(x_axisY + axisTickLineOffset, tickY);
						ctx.stroke();
					}
					if(config.showAxisYLabel){
						var axisYLabelVerticalOffset = config.axisYLabelVerticalOffset;
						if(typeof axisYLabelVerticalOffset == "function")
							axisYLabelVerticalOffset = axisYLabelVerticalOffset(i, maxAxisYTickIndex + 1);

						var drawLabel = function(){
							ctx.fillText(tick.label, x_axisY + axisYLabelOffset, tickY + axisYLabelVerticalOffset);
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
				}

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
						ctx.beginPath();
						ctx.moveTo(xLeft_axisX, y_axisX);
						ctx.lineTo(xRight_axisX, y_axisX);
						ctx.stroke();
					}

					/* 上一个绘制的横坐标刻度对应的数据索引 */
					var previousXTickDataIndex = null;

					/**
					 * 根据提供的点的索引位置和区域信息绘制刻度
					 * @param {Integer} i 点的索引位置（相对于特定的买方数据，或卖方数据）
					 * @param {StringEnum} area 点所在的区域。buyer：买方区域（左侧）；seller：卖方区域（右侧）
					 */
					var renderXTick = function(i, area){
						var dotCount = "buyer" == area? buyerAreaDotCount: sellerAreaDotCount;
						if(i < 0 || i >= dotCount)
							return;

						var data = dataParser? dataParser(datas[area][i], i, datas[area]): datas[area][i];
						var minX = "buyer" == area? buyerAreaXSection.min: sellerAreaXSection.min;
						var tickX = minX + numBig(new Big(config.dotGap + 1).mul(i));
						/* 绘制网格竖线 */
						if(ifShowVerticalGridLine){
							ctx.save();
							ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
							ctx.strokeStyle = config.verticalGridLineColor;

							ctx.beginPath();
							ctx.moveTo(tickX, y_axisX);
							ctx.lineTo(tickX, y_axisX - Math.floor(_sketch.chart.height));
							ctx.stroke();
							ctx.restore();
						}

						/* 汇集刻度，用于图形绘制完毕后统一绘制 */
						var label = (function(){
							if(!config.showAxisXLabel)
								return "";

							var previousData = null;
							if(null != previousXTickDataIndex && previousXTickDataIndex >=0 && previousXTickDataIndex < datas[area].length)
								previousData = datas[area][previousXTickDataIndex];
							if(null != previousData && dataParser)
								previousData = dataParser(previousData, previousXTickDataIndex, datas[area]);

							return config.axisXLabelGenerator(data, i, previousData, previousXTickDataIndex);
						})();
						axisXTickList.push({x: tickX, label: label});

						previousXTickDataIndex = i;
					};

					/**
					 * 绘制X轴刻度
					 * @param {StringEnum} area 买方或卖方区域标识。buyer：买方区域；seller：卖方区域
					 */
					var renderAreaTick = function(area){
						var groupSize = Math.max(config.axisXLabelSize, config.dotGap + 1),
							halfLabelSize = floorBig(new Big(config.axisXLabelSize + 1).div(2)),
							dotCount = area == "buyer"? buyerAreaDotCount: sellerAreaDotCount;

						if(dotCount <= 0)
							return;

						var availableTotalSpace = _sketch.chart.contentWidth,
							usingSpace = numBig(new Big(dotCount - 1).mul(config.dotGap + 1)) + 1;
						var tickAreaSpace = Math.min(availableTotalSpace, usingSpace);

						var axisXTickInterval = ceilBig(new Big(groupSize).div(config.dotGap + 1));
						var axisXTickCount = floorBig(new Big(tickAreaSpace).div(axisXTickInterval));
						for(var i = 0; i < axisXTickCount; i++){
							renderXTick(i * axisXTickInterval, area);
						}
						if((axisXTickCount - 1) * axisXTickInterval != dotCount - 1)
							renderXTick(dotCount - 1, area);
					};

					/* 绘制买方区域X轴刻度（买方区域在左侧） */
					renderAreaTick("buyer");
					/* 绘制卖方区域X轴刻度（卖方区域在右侧） */
					renderAreaTick("seller");
				})();

				/* 绘制Y轴 */
				;(function(){
					if(config.showAxisYLine){
						/* 绘制Y轴坐标线 */
						ctx.beginPath();
						ctx.moveTo(x_axisY, yTop_axisY);
						ctx.lineTo(x_axisY, yBottom_axisY);
						ctx.stroke();
					}

					/* 绘制Y轴刻度 */
					var axisYAmountInterval = numBig(new Big(_sketch.extendedData.amountCeiling - _sketch.extendedData.amountFloor).div(config.axisYMidTickQuota + 1));

					var b = new Big(axisYAmountInterval);
					var axisYHeightInterval = numBig(b.div(_sketch.chart.amountHeightRatio));
					var maxAxisYTickIndex = config.axisYMidTickQuota + 1;
					for(var i = 0; i <= maxAxisYTickIndex; i++){
						var amount = _sketch.extendedData.amountFloor + numBig(b.mul(i)),
							tickOffset = numBig(new Big(maxAxisYTickIndex - i).mul(axisYHeightInterval));
						var tickY = yTop_axisY + Math.round(tickOffset);

						/* 绘制网格横线, 最后（自上而下）一条网格横线和坐标轴重合时不绘制 */
						if(ifShowHorizontalGridLine && i > 0){
							ctx.save();
							ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
							ctx.strokeStyle = config.horizontalGridLineColor;


							ctx.beginPath();
							ctx.moveTo(x_axisY, tickY);
							ctx.lineTo(x_axisY + Math.floor(_sketch.chart.width), tickY);
							ctx.stroke();
							ctx.restore();
						}

						/* 汇集刻度，用于图形绘制完毕后统一绘制 */
						var format = config.axisYFormatter || util.formatMoney;
						axisYTickList.push({y: tickY, label: format(amount, config)});
					}
				})();

				/* 绘制坐标区域背景 */
				var bg = config.coordinateBackground;
				if(null != bg){
					ctx.save();
					ctx.beginPath();

					ctx.rect(Math.floor(config.paddingLeft) + 0.5, Math.floor(config.paddingTop) + 0.5, _sketch.chart.width, _sketch.chart.height);

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

			/* 绘制区域 */
			var sellerAreaHorizontalOffset = 0;/* 为了实现“向右对齐”效果，所有点在水平方向上执行的横向位移 */
			;(function(){
				/**
				 * 计算区域内的折线点
				 * @param {StringEnum} area 买方或卖方区域标识。buyer：买方区域；seller：卖方区域
				 */
				var getDots = function(area){
					var dots = [];
					var i = 0, dotX, dotY,
						dotCount = "buyer" == area? buyerAreaDotCount: sellerAreaDotCount,
						minX = "buyer" == area? buyerAreaXSection.min: sellerAreaXSection.min;
					for(; i < dotCount; i++){
						var data = datas[area][i];
						/* 数据格式转换 */
						data = dataParser? dataParser(data, i): data;

						var amountVariation = _sketch.extendedData.amountCeiling - +data.amount;
						var height = numBig(new Big(amountVariation).div(_sketch.chart.amountHeightRatio));
						dotX = minX + roundBig(new Big(config.dotGap + 1).mul(i));/* 保留两位小数 */
						dotY = yTop_axisY + Math.floor(height);
						dots.push([dotX, dotY]);
					}

					return dots;
				};

				/* 确定买方区域折线点 */
				var buyerDots = [];
				/* 第一个点和最后一个点是X轴的起始点和终止点。中间部分是折线点 */
				buyerDots = buyerDots.concat(getDots("buyer"));
				if(buyerDots.length > 0){
					buyerDots.unshift([buyerAreaXSection.min, y_axisX - 1]);
					buyerDots.push([buyerDots[buyerDots.length - 1][0], y_axisX - 1]);
				}
				/* 确定卖方区域折线点 */
				var sellerDots = [];
				/* 第一个点和最后一个点是X轴的起始点和终止点。中间部分是折线点 */
				sellerDots = sellerDots.concat(getDots("seller"));
				if(sellerDots.length > 0){
					sellerDots.unshift([sellerAreaXSection.min, y_axisX - 1]);
					sellerDots.push([sellerDots[sellerDots.length - 1][0], y_axisX - 1]);

					/* 卖方区域需向右对齐（最后一条数据在图形的最右侧） */
					sellerAreaHorizontalOffset = Math.floor(sellerAreaXSection.max - sellerDots[sellerDots.length - 1][0]);
					if(sellerAreaHorizontalOffset > 0)
						sellerDots.forEach(function(d){
							d[0] += sellerAreaHorizontalOffset;
						});
				}

				/**
				 * 绘制区域
				 * @param {StringEnum} area 买方或卖方区域标识。buyer：买方区域；seller：卖方区域
				 */
				var renderArea = function(area){
					var dots = "buyer" == area? buyerDots: sellerDots,
						enclosedAreaBackground = config["buyer" == area? "enclosedAreaBackground4Buyer": "enclosedAreaBackground4Seller"];

					if(null == dots || dots.length < 4)
						return;

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(dots[0][0], dots[0][1]);
					for(var i = 1; i < dots.length; i++)
						ctx.lineTo(dots[i][0], dots[i][1]);

					ctx.strokeWidth = 0;
					var bg = enclosedAreaBackground;
					if(bg instanceof TradeChart.LinearGradient){
						bg.apply(ctx, config.paddingLeft, config.paddingTop, config.paddingLeft, config.paddingTop + _sketch.chart.height);
					}else
						ctx.fillStyle = bg;

					ctx.fill();
					ctx.restore();
				};

				/* 绘制买方区域 */
				renderArea("buyer");
				/* 绘制卖方区域 */
				renderArea("seller");
			})();

			/* 其它处理 */
			;(function(){
				/* 绘制区域边界线 */
				if(config.showEnclosedAreaEdgeLine){
					ctx.save();

					config.enclosedAreaEdgeLineWidth && (ctx.lineWidth = config.enclosedAreaEdgeLineWidth);
					config.enclosedAreaEdgeLineColor && (ctx.strokeStyle = config.enclosedAreaEdgeLineColor);
					config.enclosedAreaEdgeLineDash && ctx.setLineDash && ctx.setLineDash(config.enclosedAreaEdgeLineDash);

					ctx.beginPath();
					ctx.moveTo(buyerAreaXSection.max, y_axisX - 1);/* -1 以不“压着坐标轴” */
					ctx.lineTo(buyerAreaXSection.max, yTop_axisY);
					ctx.stroke();

					ctx.moveTo(sellerAreaXSection.min, y_axisX - 1);/* -1 以不“压着坐标轴” */
					ctx.lineTo(sellerAreaXSection.min, yTop_axisY);
					ctx.stroke();

					ctx.restore();
				}

				/* 呈现区域的买卖性质 */
				if(config.showAreaColorBelonging){
					ctx.save();

					ctx.textBaseline = "top";
					config.enclosedAreaBelongingTextFont && (ctx.font = config.enclosedAreaBelongingTextFont);
					config.enclosedAreaBelongingTextColor && (ctx.fillStyle = config.enclosedAreaBelongingTextColor);

					var text4Buyer = config.enclosedAreaBelongingText4Buyer;
					if(null != text4Buyer && "" != (text4Buyer = String(text4Buyer).trim())){
						ctx.beginPath();
						var x = numBig(new Big(buyerAreaXSection.min + buyerAreaXSection.max).div(2));
						ctx.fillText(text4Buyer, x, config.paddingTop + 20);
						ctx.stroke();
					}

					var text4Seller = config.enclosedAreaBelongingText4Seller;
					if(null != text4Seller && "" != (text4Seller = String(text4Seller).trim())){
						ctx.beginPath();
						var x = numBig(new Big(sellerAreaXSection.min + sellerAreaXSection.max).div(2));
						ctx.fillText(text4Seller, x, config.paddingTop + 20);
						ctx.stroke();
					}

					ctx.restore();
				}
			})();

			/* 绘制坐标系刻度 */
			;(function(){
				drawAxisXTickList();
				drawAxisYTickList();
			})();


			var pixelRatio = util.pixelRatio();
			var renderMetadata = {
				scaleX: pixelRatio,
				scaleY: pixelRatio,
				cssWidth: config.width,
				cssHeight: config.height
			};
			Object.freeze && Object.freeze(renderMetadata);

			return new RenderedDepthChart(this, _sketch, util.cloneObject(config), renderMetadata, sellerAreaHorizontalOffset);
		};

		/**
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} domContainerObj 画布
		 * @param {JsonObject} config 渲染配置
		 * @returns {RenderedDepthChart} 绘制的深度图
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
		 * @param {HTMLElement} domContainerObj DOM容器
		 * @param {JsonObject} config 渲染配置
		 * @returns {RenderedDepthChart} 绘制的深度图
		 */
		this.renderAt = function(domContainerObj, config){
			var canvasObj = document.createElement("canvas");
			domContainerObj.appendChild(canvasObj);

			return this.render(canvasObj, config);
		};
	};
	DepthChart.prototype = Object.create(TradeChart.prototype);

	DepthChart.calcMaxDotCount = calcMaxDotCount;
	TradeChart.defineChart("DepthChart", DepthChart);
})();