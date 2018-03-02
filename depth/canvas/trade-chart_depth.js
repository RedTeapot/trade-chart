;(function(){
	var TradeChart = window.TradeChart;
	var util = TradeChart.util;

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
		return Math.floor((axisWidth - config.axisXTickOffset - config.enclosedAreaGap) / 2);
	};

	/**
	 * 扫描提供的数据，生成绘制所需的元数据
	 * @param {Array#JsonObject} datas 数据数组
	 * @param {Function} dataParser 数据转换方法
	 * @param {JsonObject} config 渲染配置
	 * @returns {JsonObject} 元数据集合
	 */
	var sketch = function(datas, dataParser, config){
		var dataSketch = {
			origin: {
				maxAmount: -Infinity,/* 最大委托量 */
				minAmount: Infinity,/* 最小委托量 */
				avgAmountVariation: 0,/* 委托量的平均变动幅度 */
				maxAmountVariation: 0,/* 委托量的最大变动幅度 */
			},
			extended: {
				amountCeiling: 0,/* 坐标中委托量的最大值 */
				amountFloor: 0,/* 坐标中委托量的最小值 */
			}
		}, chartSketch = {
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
		chartSketch.maxDotCount = Math.floor(chartSketch.contentWidth / config.dotGap) + 1;

		/* 数据概览扫描 */
		var previous = {amount: 0};
		var variationSum = 0;
		datas = (datas.buyer || []).concat(datas.seller || []);
		for(var i = 0; i < datas.length; i++){
			var d = datas[i];
			/* 数据格式转换 */
			d = dataParser? dataParser(d, i): d;

			if(+d.amount > dataSketch.origin.maxAmount)
				dataSketch.origin.maxAmount = +d.amount;
			if(+d.amount < dataSketch.origin.minAmount)
				dataSketch.origin.minAmount = +d.amount;

			var variation = Math.abs(+d.amount - +previous.amount);

			/* 确定更大的变动幅度 */
			if(variation > dataSketch.origin.maxAmountVariation)
				dataSketch.origin.maxAmountVariation = variation;

			variationSum += variation;
			previous = d;
		}
		dataSketch.origin.avgAmountVariation = variationSum / datas.length;

		if(null != config.axisYAmountFloor){
			if(typeof config.axisYAmountFloor == "function")
				dataSketch.extended.amountFloor = config.axisYAmountFloor(dataSketch.origin.minAmount, dataSketch.origin.maxAmount, dataSketch.origin.avgAmountVariation, dataSketch.origin.maxAmountVariation);
			else
				dataSketch.extended.amountFloor = Number(config.axisYAmountFloor);
		}else
			dataSketch.extended.amountFloor = dataSketch.origin.minAmount - (dataSketch.origin.avgAmountVariation / 2);
		if(null != config.axisYAmountCeiling){
			if(typeof config.axisYAmountCeiling == "function")
				dataSketch.extended.amountCeiling = config.axisYAmountCeiling(dataSketch.origin.minAmount, dataSketch.origin.maxAmount, dataSketch.origin.avgAmountVariation, dataSketch.origin.maxAmountVariation);
			else
				dataSketch.extended.amountCeiling = Number(config.axisYAmountCeiling);
		}else
			dataSketch.extended.amountCeiling = dataSketch.origin.maxAmount + (dataSketch.origin.avgAmountVariation / 2);
		dataSketch.extended.amountFloor = dataSketch.extended.amountFloor < 0? 0: dataSketch.extended.amountFloor;
		dataSketch.extended.amountCeiling = dataSketch.extended.amountCeiling < dataSketch.origin.maxAmount? dataSketch.origin.maxAmount: dataSketch.extended.amountCeiling;
		dataSketch.extended.amountCeiling = (dataSketch.extended.amountCeiling - dataSketch.extended.amountFloor < 2E-7)? (dataSketch.extended.amountFloor + 1): dataSketch.extended.amountCeiling;

		chartSketch.amountHeightRatio = (dataSketch.extended.amountCeiling - dataSketch.extended.amountFloor) / chartSketch.contentHeight;

		return {data: dataSketch, chart: chartSketch};
	};

	/**
	 * 获取买方区域的横坐标起止坐标
	 * @param {JsonObject} config 渲染配置
	 * @param {JsonObject} sketch 数据和图形的扫描分析结果
	 */
	var getBuyerAreaXSection = function(config, sketch){
		var minX = Math.floor(config.paddingLeft + config.axisXTickOffset) + 0.5;
		var maxX = minX + Math.floor(sketch.chart.contentWidth);

		return {min: minX, max: maxX};
	};

	/**
	 * 获取卖方区域的横坐标起止坐标
	 * @param {JsonObject} config 渲染配置
	 * @param {JsonObject} sketch 数据和图形的扫描分析结果
	 */
	var getSellerAreaXSection = function(config, sketch){
		var maxX = Math.floor(config.width - config.paddingRight) + 0.5;
		var minX = maxX - Math.floor(sketch.chart.contentWidth);

		return {min: minX, max: maxX};
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
		 * @returns {JsonObject} 数据的位置信息。如：{dataIndex: [数据（在卖方或卖方的数组中的）索引], area: [数据隶属的区域（买方：buyer；卖方：seller）]}
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
				rst.dataIndex = Math.round(tmpX / config.dotGap);
				
				return rst;
			};
			
			var area = isInBuyerArea? "buyer": "seller";
			var rst = f(area, x);
			if(rst.dataIndex >= depthChart.getDatas()[area].length)
				return null;

			return rst;
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
			
			var d = list[dataIndex];
			return d;
		};

		/**
		 * 根据提供的点的索引位置和区域信息返回格式转换后的数据
		 * @param {Integer} dataIndex 点的索引位置（相对于特定的买方数据，或卖方数据）
		 * @param {StringEnum} area 点所在的区域。buyer：买方区域（左侧）；seller：卖方区域（右侧）
		 */
		this.getConvertedData = function(dataIndex, area){
			var d = this.getOriginalData(dataIndex);
			if(null == d)
				return d;
			
			if(typeof dataParser == "function")
				d = dataParser(d);
				
			return d;
		};

		/**
		 * 获取指定的相对横坐标对应的数据在画布上的坐标位置
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @returns {JsonObject} 坐标位置，形如：{x: <x>, y: <y>}。如果没有数据与之对应，则返回null。
		 */
		this.getCoordinate = function(x){
			var dataPosition = this.getDataPosition(x);
			if(null == dataPosition)
				return null;

			var buyerAreaXSection = getBuyerAreaXSection(config, sketch),
				sellerAreaXSection = getSellerAreaXSection(config, sketch);

			var minX = "buyer" == dataPosition.area? buyerAreaXSection.min: sellerAreaXSection.min,
				minY = Math.floor(config.paddingTop) + 0.5;
			
			var data = depthChart.getDatas()[dataPosition.area][dataPosition.dataIndex];
			var dataParser = depthChart.getDataParser();
			data = dataParser? dataParser(data): data;

			var obj = {x: 0, y: 0};
			obj.x = minX + Math.floor(dataPosition.dataIndex * config.dotGap) + ("seller" == dataPosition.area? sellerAreaHorizontalOffset: 0);
			obj.y = minY + Math.floor(Math.abs(sketch.data.extended.amountCeiling - data.amount) / sketch.chart.amountHeightRatio);

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
			if(null != _datas){
				_datas.buyer = _datas.buyer || [];
				_datas.seller = _datas.seller || [];
			}

			datas = _datas;
			return this;
		};

		/**
		 * 设置买方数据源
		 * @param {Array#JsonObject} _datas 买方数据源
		 */
		this.setBuyerDatas = function(_datas){
			datas = datas || {buyer: [], seller: []};
			datas.buyer = _datas;
			return this;
		};

		/**
		 * 设置卖方数据源
		 * @param {Array#JsonObject} _datas 卖方数据源
		 */
		this.setSellerDatas = function(_datas){
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
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} domContainerObj 画布
		 * @param {JsonObject} config 渲染配置
		 * @returns {RenderedDepthChart} 绘制的深度图
		 */
		this.render = function(canvasObj, config){
			config = util.cloneObject(config, true);
			config = util.setDftValue(config, {
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

				axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
				axisLabelFont: "normal 10px sans-serif, serif",/** 坐标标签字体 */
				axisLabelColor: null,/** 坐标标签颜色 */
				axisLineColor: null,/** 坐标轴颜色 */

				axisXTickOffset: 5,/* 横坐标刻度距离原点的位移 */
				axisXLabelOffset: 5,/* 横坐标标签距离坐标轴刻度线的距离 */
				axisXLabelSize: 55,/* 横坐标标签文字的长度（用于决定如何绘制边界刻度) */

				axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移 */
				axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
				axisYPrecision: 2,/** 纵坐标的数字精度 */
				axisYFormatter: function(amount, config){/** 纵坐标数字格式化方法 */
					/** amount：委托量；config：配置 */
					return util.formatMoney(amount, config.axisYPrecision);
				},
				axisYLabelVerticalOffset: 0,/** 纵坐标标签纵向位移 */
				axisYLabelOffset: 5,/* 纵坐标标签距离坐标轴刻度线的距离 */
				axisYAmountFloor: function(min, max, avgVariation, maxVariation){
					return min - avgVariation / 2;
				},
				axisYAmountCeiling: function(min, max, avgVariation, maxVariation){
					return max + avgVariation / 2;
				},

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
			});

			/* 百分比尺寸自动转换 */
			if(/%/.test(config.width))
				config.width = canvasObj.parentElement.clientWidth * parseInt(config.width.replace(/%/, "")) / 100;
			if(/%/.test(config.height))
				config.height = canvasObj.parentElement.clientHeight * parseInt(config.height.replace(/%/, "")) / 100;
			util.setAttributes(canvasObj, {width: config.width, height: config.height});

			/* 点之间的间隔自动调整 */
			if("auto" == String(config.dotGap).toLowerCase()){
				var contentWidth = calcChartContentWidth(config);
				var dotGap = contentWidth / (Math.max((datas.buyer || []).length, (datas.seller || []).length) - 1);
				if(dotGap < 1)
					dotGap = 1;
				
				console.log("Depth chart auto set dot gap to " + dotGap);
				config.dotGap = dotGap;
			}
			
			var _sketch = sketch(datas, dataParser, config);
			console.log("Depth chart sketch: " + JSON.stringify(_sketch));

			/** 买方区域的起止横轴坐标 */
			var buyerAreaXSection = getBuyerAreaXSection(config, _sketch),

				/** 卖方区域的起止横轴坐标 */
				sellerAreaXSection = getSellerAreaXSection(config, _sketch),
				
				/** 买方区域中要呈现的点的个数 */
				buyerAreaDotCount = Math.min(_sketch.chart.maxDotCount, datas.buyer.length),

				/** 卖方区域中要呈现的点的个数 */
				sellerAreaDotCount = Math.min(_sketch.chart.maxDotCount, datas.seller.length);

			/** 横坐标刻度之间相差的点的个数 */
			var axisXTickInterval = Math.ceil(config.axisXLabelSize / config.dotGap);

			console.log("Depth chart buyer area x section: " + JSON.stringify(buyerAreaXSection));
			console.log("Depth chart buyer area dot count: " + buyerAreaDotCount);
			console.log("Depth chart seller area x section: " + JSON.stringify(sellerAreaXSection));
			console.log("Depth chart seller area dot count: " + sellerAreaDotCount);
			console.log("Depth chart x tick interval: " + axisXTickInterval);
			

			/* 数据排序 */
			if(Array.isArray(datas.buyer))
				datas.buyer.sort(function(a, b){
					return a.price > b.price? 1: -1;
				});
			if(Array.isArray(datas.seller))
				datas.seller.sort(function(a, b){
					return a.price > b.price? 1: -1;
				});

			var ctx = canvasObj.getContext("2d");

			/** 高分辨率适应 */
			var pixelRatio = util.pixelRatio();
			if(pixelRatio > 1){
				canvasObj.style.width = config.width + "px";
				canvasObj.style.height = config.height + "px";

				canvasObj.width = pixelRatio * config.width;
				canvasObj.height = pixelRatio * config.height;

				ctx.scale(pixelRatio, pixelRatio);
			}

			/* 绘制坐标区域背景 */
			var bg = config.coordinateBackground;
			if(bg){
				ctx.save();
				ctx.beginPath();
				ctx.rect(Math.floor(config.paddingLeft) + 0.5, Math.floor(config.paddingTop) + 0.5, _sketch.chart.width, _sketch.chart.height);

				if(bg instanceof TradeChart.LinearGradient){
					bg = ctx.createLinearGradient(config.paddingLeft, config.paddingTop, config.paddingLeft, config.paddingTop + _sketch.chart.height);
					config.coordinateBackground.getStops().forEach(function(stop){
						var offset = stop.offset;
						if(/%/.test(offset))
							offset = parseInt(offset.replace(/%/, "")) / 100;

						bg.addColorStop(offset, stop.color);
					});
				}

				ctx.fillStyle = bg;
				ctx.fill();
				ctx.restore();
			}

			/* 绘制坐标系 */
			ctx.save();
			ctx.lineWidth = 1;
			ctx.textAlign = "center";
			ctx.textBaseline = "top";
			config.axisLineColor && (ctx.strokeStyle = config.axisLineColor);
			config.axisLabelFont && (ctx.font = config.axisLabelFont);
			config.axisLabelColor && (ctx.fillStyle = config.axisLabelColor);

			var showVerticalGridLine = config.showVerticalGridLine && config.verticalGridLineColor,
				showHorizontalGridLine = config.showHorizontalGridLine && config.horizontalGridLineColor;

			var x_axisX = Math.floor(config.paddingLeft) + 0.5,
				x2_axisX = x_axisX + Math.floor(_sketch.chart.width),
				y_axisX = Math.floor(config.paddingTop + _sketch.chart.height) + 0.5;

			/* 绘制X轴坐标线 */
			ctx.beginPath();
			ctx.moveTo(x_axisX, y_axisX);
			ctx.lineTo(x2_axisX, y_axisX);
			ctx.stroke();

			/**
			 * 根据提供的点的索引位置和区域信息绘制刻度
			 * @param {Integer} i 点的索引位置（相对于特定的买方数据，或卖方数据）
			 * @param {StringEnum} area 点所在的区域。buyer：买方区域（左侧）；seller：卖方区域（右侧）
			 */
			var renderXTick = function(i, area){
				var dotCount = "buyer" == area? buyerAreaDotCount: sellerAreaDotCount;
				if(i < 0 || i >= dotCount)
					return;

				var data = dataParser? dataParser(datas[area][i], i): datas[area][i];
				var minX = "buyer" == area? buyerAreaXSection.min: sellerAreaXSection.min;
				var tickX = minX + Math.floor(i * config.dotGap);

				console.log("X tick", area, i, tickX);

				/* 绘制网格竖线 */
				if(showVerticalGridLine){
					ctx.save();
					ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
					ctx.strokeStyle = config.verticalGridLineColor;

					ctx.beginPath();
					ctx.moveTo(tickX, y_axisX);
					ctx.lineTo(tickX, y_axisX - Math.floor(_sketch.chart.height));
					ctx.stroke();
					ctx.restore();
				}

				/* 绘制刻度线 */
				ctx.beginPath();
				ctx.moveTo(tickX, y_axisX);
				ctx.lineTo(tickX, y_axisX + config.axisTickLineLength);

				ctx.fillText(data.price, tickX, y_axisX + config.axisTickLineLength + config.axisXLabelOffset);
				ctx.stroke();
			};

			/**
			 * 绘制X轴刻度
			 * @param {StringEnum} area 买方或卖方区域标识。buyer：买方区域；seller：卖方区域
			 */
			var renderAreaTick = function(area){
				var dotCount = Math.min(_sketch.chart.maxDotCount, datas[area].length);
				var i = 0, axisXTickCount = Math.floor(dotCount / axisXTickInterval);

				for(; i < axisXTickCount - 1; i++)
					renderXTick(i * axisXTickInterval, area);
				var remainingSize = Math.ceil(_sketch.chart.contentWidth - i * axisXTickInterval * config.dotGap);
				if(remainingSize < config.axisXLabelSize){
					/* 剩余空间不足，只绘制边界刻度 */
					renderXTick(dotCount - 1, area);
				}else{
					var j = i * axisXTickInterval,
						k = dotCount - 1;

					/* 绘制最后一个刻度和边界刻度 */
					renderXTick(j, area);
					if(j != k)
						renderXTick(k, area);
				}
			};
			
			/* 绘制买方区域X轴刻度（买方区域在左侧） */
			renderAreaTick("buyer");
			/* 绘制卖方区域X轴刻度（卖方区域在右侧） */
			renderAreaTick("seller");

			var x_axisY = x_axisX,
				y_axisY = Math.floor(config.paddingTop) + 0.5,
				y2_axisY = y_axisX;

			/* 绘制Y轴坐标线 */
			ctx.beginPath();
			ctx.moveTo(x_axisY, y_axisY);
			ctx.lineTo(x_axisY, y2_axisY);
			ctx.stroke();

			ctx.textAlign = "end";
			ctx.textBaseline = "middle";

			/* 绘制Y轴刻度 */
			var axisYAmountInterval = (_sketch.data.extended.amountCeiling - _sketch.data.extended.amountFloor) / (config.axisYMidTickQuota + 1);
			var axisYHeightInterval = axisYAmountInterval / _sketch.chart.amountHeightRatio;
			for(var i = 0; i <= config.axisYMidTickQuota + 1; i++){
				var amount = _sketch.data.extended.amountFloor + i * axisYAmountInterval,
					tickOffset = (config.axisYMidTickQuota + 1 - i) * axisYHeightInterval;
				var tickY = Math.round(tickOffset);

				/* 绘制网格横线, 最后（自上而下）一条网格横线和坐标轴重合时不绘制 */
				ctx.save();
				if(showHorizontalGridLine && (config.axisYTickOffset != 0 || i > 0)){
					ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
					ctx.strokeStyle = config.horizontalGridLineColor;

					ctx.beginPath();
					ctx.moveTo(x_axisY, y_axisY + tickY);
					ctx.lineTo(x_axisY + Math.floor(_sketch.chart.width), y_axisY + tickY);
					ctx.stroke();
				}
				ctx.restore();

				/** 绘制刻度线 */
				ctx.beginPath();
				ctx.moveTo(x_axisY, y_axisY + tickY);
				ctx.lineTo(x_axisY - config.axisTickLineLength, y_axisY + tickY);
				ctx.stroke();
				var format = config.axisYFormatter || util.formatMoney;
				ctx.fillText(format(amount, config), x_axisY - config.axisTickLineLength - config.axisYLabelOffset, y_axisY + tickY + config.axisYLabelVerticalOffset);
			}
			ctx.restore();

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

					var amountVariation = _sketch.data.extended.amountCeiling - data.amount;
					var height = amountVariation / _sketch.chart.amountHeightRatio;
					dotX = minX + Math.floor(i * config.dotGap);/* 保留两位小数 */
					dotY = Math.floor(config.paddingTop + height) + 0.5;
					dots.push([dotX, dotY]);
				}

				return dots;
			};

			/* 确定买方区域折线点 */
			var buyerDots = [];
			/* 第一个点和最后一个点是X轴的起始点和终止点。中间部分是折线点 */
			buyerDots = buyerDots.concat(getDots("buyer"));
			if(buyerDots.length > 0){
				buyerDots.unshift([buyerAreaXSection.min, y_axisX]);
				buyerDots.push([buyerDots[buyerDots.length - 1][0], y_axisX]);
			}
			/* 确定卖方区域折线点 */
			var sellerDots = [];
			/* 第一个点和最后一个点是X轴的起始点和终止点。中间部分是折线点 */
			sellerDots = sellerDots.concat(getDots("seller"));
			var sellerAreaHorizontalOffset = 0;/* 为了实现“向右对齐”效果，所有点在水平方向上执行的横向位移 */
			if(sellerDots.length > 0){
				sellerDots.unshift([sellerAreaXSection.min, y_axisX]);
				sellerDots.push([sellerDots[sellerDots.length - 1][0], y_axisX]);

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

				if(null == dots || dots.length == 0)
					return;

				ctx.save();
				ctx.beginPath();
				ctx.moveTo(dots[0][0], dots[0][1]);
				for(var i = 1; i < dots.length; i++){
					ctx.lineTo(dots[i][0], dots[i][1]);
				}
				var bg = enclosedAreaBackground;
				if(bg instanceof TradeChart.LinearGradient){
					bg = ctx.createLinearGradient(config.paddingLeft, config.paddingTop, config.paddingLeft, config.paddingTop + _sketch.chart.height);
					enclosedAreaBackground.getStops().forEach(function(stop){
						var offset = stop.offset;
						if(/%/.test(offset))
							offset = parseInt(offset.replace(/%/, "")) / 100;
	
						bg.addColorStop(offset, stop.color);
					});
				}
				ctx.fillStyle = bg;
				ctx.fill();
				ctx.restore();
			};

			/* 绘制买方区域 */
			renderArea("buyer");
			/* 绘制卖方区域 */
			renderArea("seller");

			/* 绘制区域边界线 */
			if(config.showEnclosedAreaEdgeLine){
				ctx.save();

				config.enclosedAreaEdgeLineWidth && (ctx.lineWidth = config.enclosedAreaEdgeLineWidth);
				config.enclosedAreaEdgeLineColor && (ctx.strokeStyle = config.enclosedAreaEdgeLineColor);
				config.enclosedAreaEdgeLineDash && ctx.setLineDash && ctx.setLineDash(config.enclosedAreaEdgeLineDash);

				ctx.moveTo(buyerAreaXSection.max, y_axisX - 1);/* -1 以不“压着坐标轴” */
				ctx.lineTo(buyerAreaXSection.max, y_axisY);
				ctx.stroke();

				ctx.moveTo(sellerAreaXSection.min, y_axisX - 1);/* -1 以不“压着坐标轴” */
				ctx.lineTo(sellerAreaXSection.min, y_axisY);
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
					var x = (buyerAreaXSection.min + buyerAreaXSection.max) / 2;
					ctx.fillText(text4Buyer, x, config.paddingTop + 20);
					ctx.stroke();
				}

				var text4Seller = config.enclosedAreaBelongingText4Seller;
				if(null != text4Seller && "" != (text4Seller = String(text4Seller).trim())){
					ctx.beginPath();
					var x = (sellerAreaXSection.min + sellerAreaXSection.max) / 2;
					ctx.fillText(text4Seller, x, config.paddingTop + 20);
					ctx.stroke();
				}

				ctx.restore();
			}

			var renderMetadata = {
				scaleX: pixelRatio,
				scaleY: pixelRatio,
				cssWidth: config.width,
				cssHeight: config.height
			};
			Object.freeze && Object.freeze(renderMetadata);

			return new RenderedDepthChart(this, _sketch, config, renderMetadata, sellerAreaHorizontalOffset);
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

	TradeChart.defineChart("DepthChart", DepthChart);
})();