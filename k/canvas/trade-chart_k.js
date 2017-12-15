;(function(){
	var TradeChart = window.TradeChart;
	var util = TradeChart.util;

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
		}, chartSketch = {
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

		chartSketch.width = Math.floor(config.width - config.paddingLeft - config.paddingRight);
		chartSketch.contentWidth = Math.floor(chartSketch.width - config.axisXTickOffset);
		/* 量图 */
		if(config.showVolume){
			chartSketch.height = Math.round(config.height * (1- config.volumeAreaRatio) - config.paddingTop - config.volumeMarginTop);
			chartSketch.volumeHeight = Math.round(config.height * config.volumeAreaRatio - config.paddingBottom);
			chartSketch.volumeContentHeight = Math.floor(chartSketch.volumeHeight - config.volumeAxisYTickOffset);
		}else{
			chartSketch.height = Math.floor(config.height - config.paddingTop - config.paddingBottom);
		}
		chartSketch.contentHeight = Math.floor(chartSketch.height - config.axisYTickOffset);
		chartSketch.maxGroupCount = Math.floor((chartSketch.contentWidth - config.groupLineWidth) / (config.groupGap + config.groupBarWidth)) + 1;

		/* 数据概览扫描 */
		var previous = {volume: 0};
		var variationSum = 0, volumeVariationSum = 0;
		for(var i = 0; i < datas.length && i < chartSketch.maxGroupCount; i++){
			var d = datas[i];
			/* 数据格式转换 */
			d = dataParser? dataParser(d, i): d;

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

		var getMinX = function(){
			return Math.floor(config.paddingLeft + config.axisXTickOffset) - Math.floor((config.groupBarWidth - config.groupLineWidth) / 2);
		};

		var getMaxX = function(){
			var groupCount = self.getGroupCount();
			return getMinX() + groupCount * config.groupBarWidth + (groupCount - 1) * config.groupGap;/** N组数据之间有N-1个间隙 */
		};

		/**
		 * 获取指定的相对横坐标对应的数据索引
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @reutrn {Integer} 相对横坐标对应的数据索引。如果没有数据与之对应，则返回-1
		 */
		this.getDataIndex = function(x){
			var groupCount = this.getGroupCount();
			var minX = getMinX();
			var maxX = getMaxX();

			if (x < minX){
				x = minX;
			} else if (x > maxX){
				x = maxX;
			}

			var tmpX = x - minX;
			var index = Math.ceil(tmpX / (config.groupBarWidth + Math.floor(config.groupGap))) - 1;
			return index;
		};

		/**
		 * 获取指定的相对横坐标对应的数据在画布上的坐标位置（左侧位置）
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @return {JsonObject} 坐标位置，形如：{x: <x>, y: <y>}。如果没有数据与之对应，则返回null。
		 */
		this.getCoordinate = function(x){
			var dataIndex = this.getDataIndex(x);
			if(-1 == dataIndex)
				return null;

			var minX = getMinX();

			var obj = {x: 0, y: -1};/** 纵坐标不确定 */
			obj.x = minX + dataIndex * (config.groupBarWidth + config.groupGap);

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
		 * @param config.enclosedAreaBackground {String|TradeChart.LinearGradient} 折线与X轴围成的区域的背景色
		 * @return {RenderedKChart} 绘制的K线图
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

				groupLineWidth: 1,/** 蜡烛线的宽度。最好为奇数，从而使得线可以正好在正中间 */
				groupBarWidth: 5,/** 蜡烛的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间 */
				groupGap: 3,/** 相邻两组数据之间的间隔 */

				axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
				axisLabelFont: "normal 10px sans-serif, serif",/** 坐标标签字体 */
				axisLabelColor: null,/** 坐标标签颜色 */
				axisLineColor: null,/** 坐标轴颜色 */

				axisXTickOffset: 5,/* 横坐标刻度距离原点的位移 */
				axisXLabelOffset: 5,/* 横坐标标签距离坐标轴刻度线的距离 */
				axisXLabelSize: 55,/* 横坐标标签文字的长度（用于决定以何种方式绘制最后一个刻度：只绘制边界刻度，还是边界刻度和最后一个刻度都绘制） */

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
			});

			if(config.groupBarWidth < config.groupLineWidth + 2)
				throw new Error("Bar width should be bigger than group line width plus 2.");

			/** 百分比尺寸自动转换 */
			if(/%/.test(config.width))
				config.width = canvasObj.parentElement.clientWidth * parseInt(config.width.replace(/%/, "")) / 100;
			if(/%/.test(config.height))
				config.height = canvasObj.parentElement.clientHeight * parseInt(config.height.replace(/%/, "")) / 100;
			util.setAttributes(canvasObj, {width: config.width, height: config.height});

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

			var renderMetadata = {
				scaleX: pixelRatio,
				scaleY: pixelRatio,
				cssWidth: config.width,
				cssHeight: config.height
			};
			Object.freeze && Object.freeze(renderMetadata);

			var _sketch = sketch(datas, dataParser, config);
			console.log("K chart sketch", _sketch);

			/**
			 * 获取指定价钱对应的物理高度
			 * @param price1 {Number} 价钱1
			 * @param price2 {Number} 价钱2。缺省时，为_sketch.data.extended.priceCeiling
			 * @return {Number} 物理高度
			 */
			var getHeight = function(price1, price2){
				if(arguments.length < 2)
					price2 = _sketch.data.extended.priceCeiling;
				return Math.abs(price2 - price1) / _sketch.chart.priceHeightRatio;
			};

			/** 绘制坐标区域背景 */
			if(config.coordinateBackground){
				ctx.save();
				ctx.beginPath();
				ctx.rect(Math.floor(config.paddingLeft) + 0.5, Math.floor(config.paddingTop) + 0.5, _sketch.chart.width, _sketch.chart.height);
				/* 量图 */
				if(config.showVolume){
					ctx.rect(Math.floor(config.paddingLeft) + 0.5, Math.floor(config.paddingTop + _sketch.chart.height + config.volumeMarginTop) + 0.5, _sketch.chart.width, _sketch.chart.volumeHeight);
				}

				var bg = config.coordinateBackground;
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
				x2_axisX = x_axisX + _sketch.chart.width,
				y_axisX = Math.floor(config.paddingTop + _sketch.chart.height) + 0.5;

			/** 绘制X轴坐标线 */
			ctx.beginPath();
			ctx.moveTo(x_axisX, y_axisX);
			ctx.lineTo(x2_axisX, y_axisX);
			/* 量图 */
			if(config.showVolume){
				var y_axisX_volume = Math.floor(config.paddingTop + _sketch.chart.height + config.volumeMarginTop + _sketch.chart.volumeHeight) + 0.5;
				ctx.moveTo(x_axisX, y_axisX_volume);
				ctx.lineTo(x2_axisX, y_axisX_volume);
			}
			ctx.stroke();

			/**
			 * 根据提供的群组的索引位置绘制刻度
			 * @param {Integer} i 群组的索引位置
			 */
			var renderXTick = function(i){
				var data = datas[i];
				/* 数据格式转换 */
				data = dataParser? dataParser(data, i): data;

				var x = Math.floor(i * (config.groupBarWidth + config.groupGap) + config.axisXTickOffset - halfGroupBarWidth);
				var tickX = x + Math.floor((config.groupBarWidth + 1 - config.groupLineWidth) / 2);

				/** 绘制网格横线 */
				if(showVerticalGridLine){
					ctx.save();
					ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
					ctx.strokeStyle = config.verticalGridLineColor;

					ctx.beginPath();
					ctx.moveTo(x_axisX + tickX, y_axisX);
					ctx.lineTo(x_axisX + tickX, y_axisX - Math.floor(_sketch.chart.height));
					/* 量图 */
					if(config.showVolume){
						ctx.moveTo(x_axisX + tickX, y_axisX_volume);
						ctx.lineTo(x_axisX + tickX, y_axisX_volume - Math.floor(_sketch.chart.volumeHeight));
					}
					ctx.stroke();
					ctx.restore();
				}

				/** 绘制刻度线 */
				ctx.beginPath();
				ctx.moveTo(x_axisX + tickX, y_axisX);
				ctx.lineTo(x_axisX + tickX, y_axisX + config.axisTickLineLength);
				/* 量图 */
				if(config.showVolume){
					ctx.moveTo(x_axisX + tickX, y_axisX_volume);
					ctx.lineTo(x_axisX + tickX, y_axisX_volume + config.axisTickLineLength);
					ctx.fillText(data.time, x_axisX + tickX, y_axisX_volume + config.axisTickLineLength + config.axisXLabelOffset);
				}else{
					ctx.fillText(data.time, x_axisX + tickX, y_axisX + config.axisTickLineLength + config.axisXLabelOffset);
				}
				ctx.stroke();
			};

			/** 绘制X轴刻度 */
			var halfGroupBarWidth = Math.floor((config.groupBarWidth - config.groupLineWidth) / 2);
			var groupCount = Math.min(_sketch.chart.maxGroupCount, datas.length);
			var axisXTickInterval = Math.ceil(config.axisXLabelSize / (config.groupBarWidth + config.groupGap));//两个坐标的最小间距
			var i = 0, axisXTickCount = Math.floor(groupCount / axisXTickInterval);
			for(; i < axisXTickCount - 1; i++)
				renderXTick(i * axisXTickInterval);
			/* 绘制最后一个刻度和边界刻度 */
			var remainingSize = Math.ceil((groupCount - 1 - i * axisXTickInterval) * (config.groupBarWidth + config.groupGap));
			if(remainingSize < config.axisXLabelSize){
				/* 剩余空间不足，只绘制边界刻度 */
				var index = groupCount - 1;
				if(index >= 0 && index < groupCount)
					renderXTick(index);
			}else{
				/* 绘制最后一个刻度和边界刻度 */
				var index = i * axisXTickInterval;
				if(index >= 0 && index < groupCount)
					renderXTick(index);

				index = groupCount - 1;
				if(index >= 0 && index < groupCount)
					renderXTick(index);
			}

			var x_axisY = x_axisX,
				y_axisY = Math.floor(config.paddingTop) + 0.5,
				y2_axisY = y_axisX;

			/** 绘制Y轴坐标线 */
			ctx.beginPath();
			ctx.moveTo(x_axisY, y_axisY);
			ctx.lineTo(x_axisY, y2_axisY);
			/* 量图 */
			if(config.showVolume){
				var y_axisY_volume = Math.floor(config.paddingTop + _sketch.chart.height + config.volumeMarginTop) + 0.5;
				var y2_axisY_volume = y_axisX_volume;
				ctx.moveTo(x_axisY, y_axisY_volume);
				ctx.lineTo(x_axisY, y2_axisY_volume);
			}
			ctx.stroke();

			ctx.textAlign = "end";
			ctx.textBaseline = "middle";

			/** 绘制Y轴刻度 */
			var axisYPriceInterval = (_sketch.data.extended.priceCeiling - _sketch.data.extended.priceFloor) / (config.axisYMidTickQuota + 1);
			var axisYHeightInterval = axisYPriceInterval / _sketch.chart.priceHeightRatio;
			for(var i = 0; i <= config.axisYMidTickQuota + 1; i++){
				var price = _sketch.data.extended.priceFloor + i * axisYPriceInterval,
					tickOffset = (config.axisYMidTickQuota + 1 - i) * axisYHeightInterval;
				var tickY = Math.round(tickOffset);

				/** 绘制网格横线, 最后一条网格横线和坐标轴重合时不绘制 */
				if(showHorizontalGridLine && (config.axisYTickOffset != 0 || i > 0)){
					ctx.save();
					ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
					ctx.strokeStyle = config.horizontalGridLineColor;

					ctx.beginPath();
					ctx.moveTo(x_axisY, y_axisY + tickY);
					ctx.lineTo(x_axisY + Math.floor(_sketch.chart.width), y_axisY + tickY);
					ctx.stroke();
					ctx.restore();
				}

				/** 绘制刻度线 */
				ctx.beginPath();
				ctx.moveTo(x_axisY, y_axisY + tickY);
				ctx.lineTo(x_axisY - config.axisTickLineLength, y_axisY + tickY);
				ctx.stroke();
				var format = config.axisYFormatter || util.formatMoney;
				ctx.fillText(format(price, config), x_axisY - config.axisTickLineLength - config.axisYLabelOffset, y_axisY + tickY + config.axisYLabelVerticalOffset);
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

						/** 绘制网格横线, 最后一条网格横线和坐标轴重合时不绘制 */
						if(showHorizontalGridLine && (config.volumeAxisYTickOffset != 0 || i > 0)){
							ctx.save();
							ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
							ctx.strokeStyle = config.horizontalGridLineColor;

							ctx.beginPath();
							ctx.moveTo(x_axisY, y_axisY_volume + tickY);
							ctx.lineTo(x_axisY + Math.floor(_sketch.chart.width), y_axisY_volume + tickY);
							ctx.stroke();
							ctx.restore();
						}

						/** 绘制刻度线 */
						ctx.beginPath();
						ctx.moveTo(x_axisY, y_axisY_volume + tickY);
						ctx.lineTo(x_axisY - config.axisTickLineLength, y_axisY_volume + tickY);
						ctx.stroke();
						ctx.fillText(Math.floor(volume), x_axisY - config.axisTickLineLength - config.axisYLabelOffset, y_axisY_volume + tickY + config.axisYLabelVerticalOffset);
					}
				}else{
					/** 绘制刻度线 */
					ctx.beginPath();
					ctx.moveTo(x_axisY, y2_axisY_volume);
					ctx.lineTo(x_axisY - config.axisTickLineLength, y2_axisY_volume);
					ctx.stroke();
					ctx.fillText(0, x_axisY - config.axisTickLineLength - config.axisYLabelOffset, y2_axisY_volume + config.axisYLabelVerticalOffset);
				}
			}

			ctx.restore();

			/** 绘制蜡烛 */
			ctx.save();
			var startX = Math.floor(x_axisX + config.axisXTickOffset - halfGroupBarWidth);
			var MADotsArr = [], dotX, dotY;/** MA线数组 */
			for(var i = 0; i < groupCount; i++){
				var data = datas[i];
				/* 数据格式转换 */
				data = dataParser? dataParser(data, i): data;

				var isAppreciated = data.closePrice > data.openPrice,
					isDepreciated = data.closePrice < data.openPrice,
					isKeeped = Math.abs(data.closePrice - data.openPrice) < 2e-7;

				var maxLinePrice = Math.max(data.highPrice, data.lowPrice),
					maxBarPrice = Math.max(data.openPrice, data.closePrice);

				var x = startX + Math.floor(i * (config.groupBarWidth + config.groupGap));
				ctx.fillStyle = ctx.strokeStyle = isKeeped? config.keepedColor: (isAppreciated? config.appreciatedColor: config.depreciatedColor);

				/** 绘制线 */
				var lineX = x + halfGroupBarWidth,
					lineY = Math.floor(config.paddingTop) + Math.floor(getHeight(maxLinePrice));
				var lineY2 = lineY + Math.floor(getHeight(data.highPrice, data.lowPrice));
				if(lineY2 == lineY)
					lineY2 += 1;
				ctx.beginPath();
				if(config.groupLineWidth > 1){
					ctx.rect(lineX, lineY, config.groupLineWidth, Math.abs(lineY2 - lineY));
					// ctx.stroke();
					ctx.fill();
				}else{
					ctx.moveTo(lineX + 0.5, lineY + 0.5);
					ctx.lineTo(lineX + 0.5, lineY2 + 0.5);
					ctx.stroke();
				}

				/** 绘制蜡烛 */
				var barX = x,
					barY = Math.floor(config.paddingTop) + Math.floor(getHeight(maxBarPrice));
				var barHeight = Math.floor(getHeight(data.openPrice, data.closePrice));
				if(0 == barHeight)
					barHeight = 1;

				ctx.beginPath();
				ctx.rect(barX, barY, config.groupBarWidth, barHeight);
				// ctx.stroke();
				ctx.fill();

				/** 确定MA线 */
				dotX = x + halfGroupBarWidth;
				config.showMAArr.forEach(function(num, i){
					if(MADotsArr[i] == null)
						MADotsArr[i] = [];
					if(data["MA"+num] != null){
						dotY = Math.floor(config.paddingTop) + Math.floor(getHeight(data["MA"+num]));
						MADotsArr[i].push([dotX, dotY]);
					}
				});

				data = null;
			}
			ctx.restore();

			/** 绘制MA线 */
			ctx.save();
			var MALabel, MALabelX = config.MALabelX;
			config.showMAArr.forEach(function(num, i){
				ctx.beginPath();
				ctx.strokeStyle = config.MAColorArr[i];
				ctx.fillStyle = config.MAColorArr[i];
				MADotsArr[i] && MADotsArr[i].forEach(function(MADot){
					ctx.lineTo(MADot[0], MADot[1]);
				});
				ctx.stroke();

				/* 绘制MA标题 */
				MALabel = "MA" + num;
				if(i > 0)
					MALabelX += ctx.measureText(MALabel).width + config.MALabelSpace;
				ctx.fillText(MALabel, MALabelX, config.MALabelY);
			});
			ctx.restore();

			/* 量图 */
			if(config.showVolume){
				/** 确定最高点（柱子顶部中点）*/
				var volumeDots = [];
				var i = 0, dotX, dotY;
				for(; i < groupCount; i++){
					var data = datas[i];
					/* 数据格式转换 */
					data = dataParser? dataParser(data, i): data;

					var volumeVariation = _sketch.data.extended.volumeCeiling - data.volume;
					var height = volumeVariation / _sketch.chart.volumeHeightRatio;

					dotX = startX + Math.floor(i * (config.groupBarWidth + config.groupGap));
					dotY = Math.floor(height);

					volumeDots.push([dotX, dotY]);

					data = null;
				}

				/** 绘制柱状图 */
				ctx.save();
				ctx.beginPath();
				volumeDots.forEach(function(volumeDot){
					var leftTopPointX = Math.floor(volumeDot[0]);
					var outValue = x_axisX - leftTopPointX;
					ctx.rect(outValue > 0 ? x_axisX : leftTopPointX, y_axisY_volume + volumeDot[1], outValue > 0 ? config.groupBarWidth - outValue : config.groupBarWidth, _sketch.chart.volumeHeight - volumeDot[1]);
				});
				ctx.fillStyle = config.volumeColor;
				ctx.fill();
				ctx.restore();
			}

			return new RenderedKChart(this, _sketch, config, renderMetadata);
		};

		/**
		 * 渲染图形，并呈现至指定的DOM容器中
		 * @param domContainerObj {HTMLElement} DOM容器
		 * @param config {JsonObject} 渲染配置
		 * @param config.enclosedAreaBackground {String|KChart.LinearGradient} 折线与X轴围成的区域的背景色
		 * @return {RenderedKChart} 绘制的K线图
		 */
		this.renderAt = function(domContainerObj, config){
			var canvasObj = document.createElement("canvas");
			domContainerObj.appendChild(canvasObj);

			return this.render(canvasObj, config);
		};
	};
	KChart.prototype = Object.create(TradeChart.prototype);

	TradeChart.defineChart("KChart", KChart);
})();