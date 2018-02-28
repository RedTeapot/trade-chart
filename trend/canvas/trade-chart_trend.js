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
			maxDotCount: 0,/** 可呈现的最多的点的个数 */
			priceHeightRatio: 0,/** 价格与高度之间的映射比例 */
			volumeHeightRatio: 0/** 交易量与高度之间的映射比例 */
		};

		chartSketch.width = Math.floor(config.width - config.paddingLeft - config.paddingRight);
		chartSketch.contentWidth = Math.floor(chartSketch.width - config.axisXTickOffset);
		/* 量图 */
		if(config.showVolume){
			chartSketch.height =  Math.round(config.height * (1- config.volumeAreaRatio) - config.paddingTop - config.volumeMarginTop);
			chartSketch.volumeHeight =  Math.round(config.height * config.volumeAreaRatio - config.paddingBottom);
			chartSketch.volumeContentHeight = Math.floor(chartSketch.volumeHeight - config.volumeAxisYTickOffset);
		}else{
			chartSketch.height =  Math.floor(config.height - config.paddingTop - config.paddingBottom);
		}
		chartSketch.contentHeight = Math.floor(chartSketch.height - config.axisYTickOffset);
		chartSketch.maxDotCount = Math.floor(chartSketch.contentWidth / config.dotGap) + 1;

		/* 数据概览扫描 */
		var previous = {price: 0, volume: 0};
		var variationSum = 0, volumeVariationSum = 0;
		for(var i = 0; i < datas.length && i < chartSketch.maxDotCount; i++){
			var d = datas[i];
			/* 数据格式转换 */
			d = dataParser? dataParser(d, i): d;

			if(d.avgPrice != null){
				dataSketch.origin.max = Math.max(+d.price, +d.avgPrice, dataSketch.origin.max);
				dataSketch.origin.min = Math.min(+d.price, +d.avgPrice, dataSketch.origin.min);
			}else{
				if(+d.price > dataSketch.origin.max)
					dataSketch.origin.max = +d.price;
				if(+d.price < dataSketch.origin.min)
					dataSketch.origin.min = +d.price;
			}
			if(+d.volume > dataSketch.origin.maxVolume)
				dataSketch.origin.maxVolume = +d.volume;
			if(+d.volume < dataSketch.origin.minVolume)
				dataSketch.origin.minVolume = +d.volume;

			var variation = Math.abs(+d.price - +previous.price);
			var volumeVariation = Math.abs(+d.volume - +previous.volume);

			/* 确定更大的变动幅度 */
			if(variation > dataSketch.origin.maxVariation)
				dataSketch.origin.maxVariation = variation;
			if(volumeVariation > dataSketch.origin.maxVolumeVariation)
				dataSketch.origin.maxVolumeVariation = volumeVariation;

			variationSum += variation;
			volumeVariationSum += volumeVariation;

			previous = d;
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

		if(null != config.axisYVolumeFloor){
			dataSketch.extended.volumeFloor = Number(config.axisYVolumeFloor);
		}else
			dataSketch.extended.volumeFloor = dataSketch.origin.minVolume - (dataSketch.origin.avgVolumeVariation / 2);
		dataSketch.extended.volumeCeiling = dataSketch.origin.maxVolume + (dataSketch.origin.avgVolumeVariation / 2);
		dataSketch.extended.volumeFloor = dataSketch.extended.volumeFloor < 0? 0: dataSketch.extended.volumeFloor;

		chartSketch.priceHeightRatio = (dataSketch.extended.priceCeiling - dataSketch.extended.priceFloor) / chartSketch.contentHeight;
		chartSketch.volumeHeightRatio = (dataSketch.extended.volumeCeiling - dataSketch.extended.volumeFloor) / chartSketch.volumeContentHeight;

		return {data: dataSketch, chart: chartSketch};
	};

	/**
	 * @constructor
	 * 已完成渲染的分时图
	 * @param trendChart {TrendChart} 分时图实例
	 * @param sketch {JsonObject} 数据和图形的扫描分析结果
	 * @param config {JsonObject} 渲染配置
	 * @param renderMetadata {JsonObject} 渲染时使用的基准数据
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
		 * 获取渲染时使用的基准数据
		 */
		this.getRenderMetadata = function(){
			return renderMetadata;
		};

		/**
		 * 获取被渲染的点的个数
		 * @return {Integer} 被渲染的点的个数
		 */
		this.getDotCount = function(){
			return Math.min(trendChart.getDatas().length, sketch.chart.maxDotCount);
		};

		/**
		 * 获取指定的相对横坐标对应的数据索引
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @reutrn {Integer} 相对横坐标对应的数据索引。如果没有数据与之对应，则返回-1
		 */
		this.getDataIndex = function(x){
			var dotCount = this.getDotCount();
			var minX = Math.floor(config.paddingLeft + config.axisXTickOffset) + 0.5;
			var maxX = minX + (dotCount - 1) * config.dotGap;/** N个点之间有N-1个间隙 */

			if (x < minX){
				x = minX;
			} else if (x > maxX){
				x = maxX;
			}

			var tmpX = x - minX;
			var index = Math.round(tmpX / config.dotGap);
			return index;
		};

		/**
		 * 获取指定的相对横坐标对应的数据在画布上的坐标位置
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @return {JsonObject} 坐标位置，形如：{x: <x>, y: <y>}。如果没有数据与之对应，则返回null。
		 */
		this.getCoordinate = function(x){
			var dataIndex = this.getDataIndex(x);
			if(-1 == dataIndex)
				return null;

			var minX = Math.floor(config.paddingLeft + config.axisXTickOffset) + 0.5,
				minY = Math.floor(config.paddingTop) + 0.5;

			var data = trendChart.getDatas()[dataIndex];
			var dataParser = trendChart.getDataParser();
			data = dataParser? dataParser(data): data;

			var obj = {x: 0, y: 0};
			obj.x = minX + dataIndex * config.dotGap;
			obj.y = minY + (Math.abs(sketch.data.extended.priceCeiling - data.price) / sketch.chart.priceHeightRatio);

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
		 * @return {RenderedTrendChart} 绘制的分时图
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
				 * //TODO 数据没有交易节信息的场景，尚未响应该属性取值为auto的配置
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

				showVerticalGridLine: true,/** 是否绘制网格竖线 */
				verticalGridLineColor: "#A0A0A0",/** 网格竖线颜色 */

				lineWidth: 1,/** 折线线宽 */
				lineColor: null,/** 折线颜色 */

				coordinateBackground: null,/** 坐标系围成的矩形区域的背景色 */
				enclosedAreaBackground: null,/** 折线与X轴围绕而成的封闭区域的背景色 */

				showVolume: false,  /** 是否显示量图 */
				volumeAreaRatio: 0.33, /** 量图区域所占比例 0~1 */
				volumeMarginTop: 15,/** 量图区的顶部外边距 （即与图形区的间距）*/
				volumeAxisYTickOffset: 0, /** 量图纵坐标刻度距离原点的位移 */
				volumeAxisYMidTickQuota: 2, /** 纵坐标刻度个数（不包括最小值和最大值） */
				axisYVolumeFloor: null, /** 纵坐标最小刻度, 为null时自动 */
				volumeColor: "orange", /** 量图颜色（柱状图）, 可以为数组*/
				volumeInterval: 2, /** 量图每个柱状图的间隔, 小于相邻两个点之间的间隔*/

				showAvgPriceLine: false, /** 是否显示均价 */
				avgPriceLineWidth: 1, /** 均线线宽 */
				avgPriceLineColor: "orange", /** 均线颜色 */
			});

			/* 历史兼容，待移除 */
			if(!!config.showTrendAll)
				config.dotGap = "auto";

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
			console.log("Trend chart sketch", JSON.stringify(_sketch));

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

			/** 绘制坐标系 */
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
			 * 根据提供的点的索引位置绘制刻度
			 * @param {Integer} i 点的索引位置
			 */
			var renderXTick = function(i){
				var dotCount = Math.min(_sketch.chart.maxDotCount, datas.length);
				if(i < 0 || i >= dotCount)
					return;

				var data, tickX;
				if(isNaN(i)){
					data = i;
					tickX = Math.floor(i.XRate * _sketch.chart.contentWidth) + config.axisXTickOffset;
				}else{
					/** 数据格式转换 */
					data = dataParser? dataParser(datas[i], i): datas[i];
					tickX = Math.floor(i * config.dotGap) + config.axisXTickOffset;
				}

				/** 绘制网格竖线 */
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
			var dotCount = Math.min(_sketch.chart.maxDotCount, datas.length);
			if(config.dotGap == "auto" && config.timeSections != null && config.timeSections.length > 0){
				var totalMinutes = config.timeSections.reduce(function(sum, timeSection){
					return sum + timeSection.minutes;
				}, 0);

				/* 绘制交易节时间 */
				var axisXTicks = [], minTimeSectionWidthRatio = Infinity;
				config.timeSections.forEach(function(timeSection){
					if(axisXTicks.length == 0){
						axisXTicks.push({
							time: timeSection.begin,
							XRate: 0
						});
					}else{
						axisXTicks[axisXTicks.length - 1].time += "/" + timeSection.begin;
					}

					axisXTicks.push({
						time: timeSection.end,
						XRate: axisXTicks[axisXTicks.length-1].XRate + timeSection.minutes / totalMinutes
					});

					minTimeSectionWidthRatio = Math.min(minTimeSectionWidthRatio, timeSection.minutes / totalMinutes);
				});

				/* 根据横坐标文本长度，决定呈现每个交易节的起止时间，还是只呈现第一个交易节的开始时间和最后一个交易节的结束时间 */
				if(minTimeSectionWidthRatio * _sketch.chart.contentWidth > config.axisXLabelSize){
					axisXTicks.forEach(renderXTick);
				}else{
					renderXTick(axisXTicks[0]);
					renderXTick(axisXTicks[axisXTicks.length - 1]);
				}
			}else{
				var axisXTickInterval = Math.ceil(config.axisXLabelSize / config.dotGap);/* 横坐标刻度之间相差的点的个数 */
				var i = 0, axisXTickCount = Math.floor(dotCount / axisXTickInterval);
				for(; i < axisXTickCount - 1; i++)
					renderXTick(i * axisXTickInterval);
				var remainingSize = Math.ceil((dotCount - 1 - i * axisXTickInterval) * config.dotGap);
				if(remainingSize < config.axisXLabelSize){
					/* 剩余空间不足，只绘制边界刻度 */
					renderXTick(dotCount - 1);
				}else{
					var j = i * axisXTickInterval,
						k = dotCount - 1;

					/* 绘制最后一个刻度和边界刻度 */
					renderXTick(j);
					if(j != k)
						renderXTick(k);
				}
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

						/** 绘制网格横线, 最后（自上而下）一条网格横线和坐标轴重合时不绘制 */
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

			/** 确定折线点 */
			var dots = [];/** 第一个点和最后一个点是X轴的起始点和终止点。中间部分是折线点 */
			var avgPriceDots = [];/** 均线 */
			dots.push([x_axisX + config.axisXTickOffset, y_axisX]);
			var i = 0, dotX, dotY;
			for(; i < dotCount; i++){
				var data = datas[i];
				/* 数据格式转换 */
				data = dataParser? dataParser(data, i): data;

				var priceVariation = _sketch.data.extended.priceCeiling - data.price;
				var height = priceVariation / _sketch.chart.priceHeightRatio;
				dotX = Math.floor((i * config.dotGap + config.axisXTickOffset + x_axisX) * 100)/100;/* 保留两位小数 */
				dotY = Math.floor(config.paddingTop + height) + 0.5;
				dots.push([dotX, dotY]);

				/* 均线 */
				if(config.showAvgPriceLine && data.avgPrice != null){
					var avgPriceVariation = _sketch.data.extended.priceCeiling - data.avgPrice;
					var avgHeight = avgPriceVariation / _sketch.chart.priceHeightRatio;
					dotY = Math.floor(config.paddingTop + avgHeight) + 0.5;
					avgPriceDots.push([dotX, dotY]);
				}

				data = null;
			}
			dots.push([Math.floor(((dotCount - 1) * config.dotGap + config.axisXTickOffset + x_axisX) * 100)/100, y_axisX]);

			/** 绘制折现区域 */
			config.lineWidth && (ctx.lineWidth = config.lineWidth);
			config.lineColor && (ctx.strokeStyle = config.lineColor);
			if(dots.length == 3){
				//只有一个点时
				ctx.beginPath();
				ctx.arc(dots[1][0], dots[1][1], ctx.lineWidth*2, 0, 2*Math.PI);
				ctx.fillStyle = config.lineColor;
				ctx.fill();
			}else{
				ctx.beginPath();
				for(i = 1; i < dots.length - 1; i++){
					ctx.lineTo(dots[i][0], dots[i][1]);
				}
				ctx.stroke();
			}

			/** 绘制折现区域渐变背影 */
			if(config.enclosedAreaBackground){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(dots[0][0], dots[0][1]);
				for(i = 1; i < dots.length; i++){
					ctx.lineTo(dots[i][0], dots[i][1]);
				}

				var bg = config.enclosedAreaBackground;
				if(bg instanceof TradeChart.LinearGradient){
					bg = ctx.createLinearGradient(config.paddingLeft, config.paddingTop, config.paddingLeft, config.paddingTop + _sketch.chart.height);
					config.enclosedAreaBackground.getStops().forEach(function(stop){
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

			/** 绘制均线 */
			if(config.showAvgPriceLine){
				ctx.save();
				ctx.beginPath();
				config.avgPriceLineWidth && (ctx.lineWidth = config.avgPriceLineWidth);
				config.avgPriceLineColor && (ctx.strokeStyle = config.avgPriceLineColor);
				avgPriceDots.forEach(function(avgPriceDot){
					ctx.lineTo(avgPriceDot[0], avgPriceDot[1]);
				});
				ctx.stroke();
				ctx.restore();
			}

			/* 量图 */
			if(config.showVolume){
				/** 确定最高点（柱子顶部中点）*/
				var volumeDots = [];
				var i = 0, dotX, dotY;
				for(; i < dotCount; i++){
					var data = datas[i];
					/* 数据格式转换 */
					data = dataParser? dataParser(data, i): data;

					var volumeVariation = _sketch.data.extended.volumeCeiling - data.volume;
					var height = volumeVariation / _sketch.chart.volumeHeightRatio;

					dotX = Math.floor(i * config.dotGap * 100)/100 + config.axisXTickOffset + x_axisX;
					dotY = Math.floor(height);

					volumeDots.push([dotX, dotY]);

					data = null;
				}

				/** 绘制柱状图 */
				ctx.save();
				var volumeWidth = config.dotGap - config.volumeInterval;//柱状图宽度
				if (volumeWidth <= 0){
					volumeWidth = config.dotGap;
				}
				volumeDots.forEach(function(volumeDot, i){
					ctx.beginPath();
					var leftTopPointX = config.dotGap == "auto" ? Math.floor((volumeDot[0] - volumeWidth / 2) * 100)/100: Math.floor(volumeDot[0] - volumeWidth / 2);
					var outValue = x_axisX - leftTopPointX;
					ctx.rect(outValue > 0 ? x_axisX : leftTopPointX, y_axisY_volume + volumeDot[1], outValue > 0 ? volumeWidth - outValue : volumeWidth, _sketch.chart.volumeHeight - volumeDot[1]);
					var volumeColor = config.volumeColor;
					if(config.volumeColor instanceof Array){
						volumeColor = config.volumeColor[i % config.volumeColor.length];
					}
					ctx.fillStyle = volumeColor;
					ctx.fill();
				});
				ctx.restore();
			}

			return new RenderedTrendChart(this, _sketch, config, renderMetadata);
		};

		/**
		 * 渲染图形，并呈现至指定的DOM容器中
		 * @param domContainerObj {HTMLElement} DOM容器
		 * @param config {JsonObject} 渲染配置
		 * @param config.enclosedAreaBackground {String|TrendChart.LinearGradient} 折线与X轴围成的区域的背景色
		 * @return {RenderedTrendChart} 绘制的分时图
		 */
		this.renderAt = function(domContainerObj, config){
			var canvasObj = document.createElement("canvas");
			domContainerObj.appendChild(canvasObj);

			return this.render(canvasObj, config);
		};
	};
	TrendChart.prototype = Object.create(TradeChart.prototype);

	TradeChart.defineChart("TrendChart", TrendChart);
})();