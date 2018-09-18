;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = util.Big;

	var KDataSketch = TradeChart2.KDataSketch,
		KChartSketch = TradeChart2.KChartSketch,

		KSubChartTypes = TradeChart2.KSubChartTypes,
		KSubChart = TradeChart2.KSubChart,
		KSubChartRenderResult = TradeChart2.KSubChartRenderResult,

		KSubChartSketch_CandleChartSketch = TradeChart2.KSubChartSketch_CandleChartSketch;

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
	 * @augments KSubChart
	 *
	 * K线图子图：蜡烛图
	 * @param {KChart} kChart 附加该子图的K线图
	 */
	var KSubChart_CandleChart = function(kChart){
		KSubChart.call(this, kChart, KSubChartTypes.CANDLE);

		/**
		 * 从给定的配置集合中获取指定名称的配置项取值。
		 * 如果给定的配置集合中不存在，则从K线图的全局配置中获取。
		 * 如果全局的配置中也不存在，则返回undefined
		 *
		 * @param {String} name 配置项名称
		 */
		var _getConfigItem = function(name, config){
			var defaultConfig = TradeChart2.K_SUB_CANDLE_DEFAULT_CONFIG;
			if(name in config)
				return config[name];
			else if(name in defaultConfig)
				return defaultConfig[name];

			return kChart.getConfigItem(name);
		};

		var calculateAndUpdateAxisYFloorAndCeiling = function(kDataSketch, config){
			/* Y轴最小值 */
			var config_axisYPriceFloor = _getConfigItem("axisYPriceFloor", config);
			var axisYPriceFloor;
			if(null != config_axisYPriceFloor){
				var isFunction = typeof config_axisYPriceFloor === "function";
				if(isFunction)
					axisYPriceFloor = util.try2Call(config_axisYPriceFloor, null,
						kDataSketch.getMinPrice(),
						kDataSketch.getMaxPrice(),
						kDataSketch.getAvgPriceVariation(),
						kDataSketch.getMaxPriceVariation()
					);
				else{
					if(!util.isValidNumber(config_axisYPriceFloor))
						console.warn("Invalid configuration value for 'axisYPriceFloor'. Type of 'Number' of 'Function' needed. Auto adjust to 0.");
					axisYPriceFloor = util.parseAsNumber(config_axisYPriceFloor, 0);
				}

				if(!isFinite(axisYPriceFloor) || axisYPriceFloor < 0){
					console.warn((isFunction? "Calculated": "Specified") + " 'axisYPriceFloor': " + axisYPriceFloor + " is infinite or lte 0, auto adjust to 0.");
					axisYPriceFloor = 0;
				}
				
				kDataSketch.setPriceFloor(axisYPriceFloor);
			}
			axisYPriceFloor = kDataSketch.getPriceFloor();

			/* Y轴最大值 */
			var config_axisYPriceCeiling = _getConfigItem("axisYPriceCeiling", config);
			var axisYPriceCeiling;
			if(null != config_axisYPriceCeiling){
				var isFunction = typeof config_axisYPriceCeiling === "function";
				if(isFunction)
					axisYPriceCeiling = util.try2Call(config_axisYPriceCeiling, null,
						kDataSketch.getMinPrice(),
						kDataSketch.getMaxPrice(),
						kDataSketch.getAvgPriceVariation(),
						kDataSketch.getMaxPriceVariation()
					);
				else{
					if(!util.isValidNumber(config_axisYPriceCeiling))
						console.warn("Invalid configuration value for 'axisYPriceCeiling'. Type of 'Number' of 'Function' needed. Auto adjust to 0.");
					axisYPriceCeiling = util.parseAsNumber(axisYPriceCeiling, 0);
				}

				if(!isFinite(axisYPriceCeiling) || axisYPriceCeiling <= axisYPriceFloor)
					console.warn((isFunction? "Calculated": "Specified") + " 'axisYPriceCeiling': " + axisYPriceCeiling + " is infinite or lte 'axisYPriceFloor'(" + axisYPriceFloor + "), auto adjust to 0.");
				else
					kDataSketch.setPriceCeiling(axisYPriceCeiling);
			}
		};

		/**
		 * @override
		 *
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {KSubChartConfig_candle} config 渲染配置
		 * @returns {KSubChartRenderResult} K线子图绘制结果
		 */
		this.render = function(canvasObj, config){

			/**
			 * 从给定的配置集合中获取指定名称的配置项取值。
			 * 如果给定的配置集合中不存在，则从K线图的全局配置中获取。
			 * 如果全局的配置中也不存在，则返回undefined
			 *
			 * @param {String} name 配置项名称
			 */
			var getConfigItem = function(name){
				return _getConfigItem(name, config);
			};

			var config_width = getConfigItem("width"),
				config_height = getConfigItem("height"),

				config_groupGap = getConfigItem("groupGap"),

				config_paddingLeft = getConfigItem("paddingLeft"),
				config_paddingTop = getConfigItem("paddingTop"),

				config_keepedColor = getConfigItem("keepedColor"),
				config_appreciatedColor = getConfigItem("appreciatedColor"),
				config_depreciatedColor = getConfigItem("depreciatedColor"),

				config_bg = getConfigItem("coordinateBackground"),

				config_showVerticalGridLine = getConfigItem("showVerticalGridLine"),
				config_showHorizontalGridLine = getConfigItem("showHorizontalGridLine"),
				config_verticalGridLineColor = getConfigItem("verticalGridLineColor"),
				config_horizontalGridLineColor = getConfigItem("horizontalGridLineColor"),

				config_gridLineDash = getConfigItem("gridLineDash") || [1],

				config_axisLineColor = getConfigItem("axisLineColor"),
				config_axisLabelFont = getConfigItem("axisLabelFont"),
				config_axisLabelColor = getConfigItem("axisLabelColor"),
				config_axisTickLineLength = getConfigItem("axisTickLineLength"),

				config_showAxisYLine = getConfigItem("showAxisYLine"),
				config_showAxisYLabel = getConfigItem("showAxisYLabel"),
				config_axisYPosition = getConfigItem("axisYPosition"),
				config_axisYPrecision = getConfigItem("axisYPrecision"),
				config_axisYFormatter = getConfigItem("axisYFormatter"),
				config_axisYLabelPosition = getConfigItem("axisYLabelPosition"),
				config_axisYLabelFont = getConfigItem("axisYLabelFont"),
				config_axisYLabelColor = getConfigItem("axisYLabelColor"),
				config_axisYLabelOffset = getConfigItem("axisYLabelOffset"),
				config_axisYPriceFloor = getConfigItem("axisYPriceFloor"),
				config_axisYMidTickQuota = getConfigItem("axisYMidTickQuota"),
				config_axisYLabelVerticalOffset = getConfigItem("axisYLabelVerticalOffset"),
				config_axisYPriceFloorLabelFont = getConfigItem("axisYPriceFloorLabelFont"),
				config_axisYPriceFloorLabelColor = getConfigItem("axisYPriceFloorLabelColor"),

				config_axisYPriceCeilingLabelFont = getConfigItem("axisYPriceCeilingLabelFont"),
				config_axisYPriceCeilingLabelColor = getConfigItem("axisYPriceCeilingLabelColor"),

				config_showAxisXLine = getConfigItem("showAxisXLine"),
				config_showAxisXLabel = getConfigItem("showAxisXLabel"),
				config_axisXLabelGenerator = getConfigItem("axisXLabelGenerator"),
				config_axisXLabelOffset = getConfigItem("axisXLabelOffset"),
				config_axisXLabelSize = getConfigItem("axisXLabelSize"),
				config_axisXTickOffset = getConfigItem("axisXTickOffset"),
				config_axisXLabelHorizontalAlign = getConfigItem("axisXLabelHorizontalAlign"),

				config_groupBarWidth = getConfigItem("groupBarWidth"),
				config_groupLineWidth = getConfigItem("groupLineWidth");

			var ifShowAxisYLeft = "left" === String(config_axisYPosition).toLowerCase(),
				ifShowAxisYLabelOutside = "outside" === String(config_axisYLabelPosition).toLowerCase();

			var dataList = this.getKChart().getDataList(),
				dataParser = this.getKChart().getDataParser();

			/* 百分比尺寸自动转换 */
			if(/%/.test(config_width))
				config_width = canvasObj.parentElement.clientWidth * parseInt(config_width.replace(/%/, "")) / 100;
			if(/%/.test(config_height))
				config_height = canvasObj.parentElement.clientHeight * parseInt(config_height.replace(/%/, "")) / 100;
			util.setAttributes(canvasObj, {width: config_width, height: config_height});
			var ctx = util.initCanvas(canvasObj, config_width, config_height);

			var kDataSketch = KDataSketch.sketchData(dataList, dataParser),
				kChartSketch = KChartSketch.sketchByConfig(this.getKChart().getConfig(), config_width),
				kSubChartSketch = KSubChartSketch_CandleChartSketch.sketchByConfig(config, config_height);

			/* 使能配置 */
			calculateAndUpdateAxisYFloorAndCeiling(kDataSketch, config);

			var b = new Big(kDataSketch.getPriceCeiling()).minus(kDataSketch.getPriceFloor()).div(Math.max(kSubChartSketch.getContentHeight(), 1));
			kSubChartSketch.setAmountHeightRatio(b.eq(0)? 1: numBig(b));

			/* 横坐标位置 */
			var xLeft_axisX = Math.floor(config_paddingLeft) + 0.5,
				xRight_axisX = xLeft_axisX + Math.floor(kChartSketch.getWidth()),
				y_axisX = Math.floor(config_paddingTop + kSubChartSketch.getHeight()) + 0.5,

				x_axisY = ifShowAxisYLeft? xLeft_axisX: xRight_axisX,
				yTop_axisY = Math.floor(config_paddingTop) + 0.5,
				yBottom_axisY = y_axisX;

			/* 绘制的数据个数 */
			var groupCount = Math.min(kChartSketch.getMaxGroupCount(), dataList.length);
			/* 一组数据的宽度 */
			var groupSize = config_groupBarWidth + config_groupGap;
			/* 蜡烛一半的宽度 */
			var halfGroupBarWidth = this.getKChart().calcHalfGroupBarWidth();
			/* 一组数据宽度的一半 */
			var halfGroupSize = Math.max(numBig(new Big(groupSize).div(2)), numBig(new Big(config_axisXLabelSize).div(2)));
			/* 横坐标刻度之间相差的数据的个数 */
			var axisXTickInterval = ceilBig(new Big(config_axisXLabelSize).div(groupSize));
			/* 横坐标刻度个数 */
			var axisXTickCount = floorBig(new Big(groupCount).div(axisXTickInterval));
			/** 相邻两个纵坐标刻度之间的价格悬差 */
			var axisYPriceInterval = numBig(new Big(kDataSketch.getPriceCeiling()).minus(kDataSketch.getPriceFloor()).div(config_axisYMidTickQuota + 1));
			/** 相邻两个纵坐标刻度之间的高度悬差 */
			var axisYHeightInterval = kSubChartSketch.calculateHeight(axisYPriceInterval);
			/* 是否绘制网格横线/竖线 */
			var ifShowVerticalGridLine = config_showVerticalGridLine && config_verticalGridLineColor,
				ifShowHorizontalGridLine = config_showHorizontalGridLine && config_horizontalGridLineColor;


			/**
			 * 获取指定价钱对应的物理高度
			 * @param {Number} price1 价钱1
			 * @param {Number} [price2=kDataSketch.getPriceCeiling()] 价钱2
			 * @returns {Number} 物理高度
			 */
			var getHeight = function(price1, price2){
				if(arguments.length < 2)
					price2 = kDataSketch.getPriceCeiling();

				return kSubChartSketch.calculateHeight(numBig(new Big(price2).minus(price1).abs()));
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
			 * 绘制横坐标刻度
			 */
			var drawAxisXTickList = function(){
				ctx.save();

				ctx.lineWidth = 1;
				config_axisLineColor && (ctx.strokeStyle = config_axisLineColor);
				config_axisLabelFont && (ctx.font = config_axisLabelFont);
				config_axisLabelColor && (ctx.fillStyle = config_axisLabelColor);
				ctx.textAlign = "center";
				ctx.textBaseline = "top";

				var y_axisXTickLabel = config_axisXLabelOffset + y_axisX;
				if(config_showAxisXLine)
					y_axisXTickLabel += config_axisTickLineLength;

				for(var i = 0; i < axisXTickList.length; i++){
					var tick = axisXTickList[i];
					var tickX = tick.x;

					/* 绘制刻度线 */
					if(config_showAxisXLine && config_showAxisXLabel){
						ctx.beginPath();
						ctx.moveTo(tickX, y_axisX);
						ctx.lineTo(tickX, y_axisX + config_axisTickLineLength);
						ctx.stroke();
					}

					/* 绘制坐标取值 */
					if(config_showAxisXLabel){
						ctx.save();

						if(typeof config_axisXLabelHorizontalAlign === "function")
							config_axisXLabelHorizontalAlign = config_axisXLabelHorizontalAlign(i, axisXTickList.length);
						config_axisXLabelHorizontalAlign && (ctx.textAlign = config_axisXLabelHorizontalAlign);
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
				config_axisLineColor && (ctx.strokeStyle = config_axisLineColor);
				config_axisLabelFont && (ctx.font = config_axisLabelFont);
				config_axisLabelColor && (ctx.fillStyle = config_axisLabelColor);
				config_axisYLabelFont && (ctx.font = config_axisYLabelFont);
				config_axisYLabelColor && (ctx.fillStyle = config_axisYLabelColor);

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

				var axisTickLineOffset = sign * config_axisTickLineLength,
					axisYLabelOffset = sign * ((config_showAxisYLine? config_axisTickLineLength: 0) + config_axisYLabelOffset);
				var maxAxisYTickIndex = config_axisYMidTickQuota + 1;

				for(var i = 0; i < axisYTickList.length; i++){
					var tick = axisYTickList[i];
					var tickY = tick.y;

					/* 绘制刻度线 */
					if(config_showAxisYLine && config_showAxisYLabel){
						ctx.beginPath();
						ctx.moveTo(x_axisY, yTop_axisY + tickY);
						ctx.lineTo(x_axisY + axisTickLineOffset, yTop_axisY + tickY);
						ctx.stroke();
					}
					if(config_showAxisYLabel){
						if(typeof config_axisYLabelVerticalOffset === "function")
							config_axisYLabelVerticalOffset = config_axisYLabelVerticalOffset(i, maxAxisYTickIndex + 1);

						var drawLabel = function(){
							ctx.fillText(tick.label, x_axisY + axisYLabelOffset, yTop_axisY + tickY + config_axisYLabelVerticalOffset);
						};

						if(i === 0){
							ctx.save();
							config_axisYPriceFloorLabelFont && (ctx.font = config_axisYPriceFloorLabelFont);
							config_axisYPriceFloorLabelColor && (ctx.fillStyle = config_axisYPriceFloorLabelColor);

							drawLabel();

							ctx.restore();
						}else if(i === maxAxisYTickIndex){
							ctx.save();
							config_axisYPriceCeilingLabelFont && (ctx.font = config_axisYPriceCeilingLabelFont);
							config_axisYPriceCeilingLabelColor && (ctx.fillStyle = config_axisYPriceCeilingLabelColor);

							drawLabel();

							ctx.restore();
						}else
							drawLabel();
					}
				}

				ctx.restore();
			};

			/* 绘制坐标系 */
			(function(){
				ctx.save();

				ctx.lineWidth = 1;
				config_axisLineColor && (ctx.strokeStyle = config_axisLineColor);

				/* 绘制坐标区域背景 */
				if(null != config_bg){
					ctx.save();
					ctx.beginPath();

					/* 蜡烛图 */
					ctx.rect(xLeft_axisX, yTop_axisY, kChartSketch.getWidth(), kSubChartSketch.getHeight());

					ctx.strokeWidth = 0;
					if(config_bg instanceof TradeChart2.LinearGradient){
						config_bg.apply(ctx, config_paddingLeft, config_paddingTop, config_paddingLeft, config_paddingTop + kSubChartSketch.getHeight());
					}else
						ctx.fillStyle = config_bg;

					ctx.fill();
					ctx.restore();
				}

				/* 绘制X轴 */
				(function(){
					/* 绘制X轴坐标线 */
					if(config_showAxisXLine){
						ctx.beginPath();
						ctx.moveTo(xLeft_axisX, y_axisX);
						ctx.lineTo(xRight_axisX, y_axisX);
						ctx.stroke();
					}

					/* 上一个绘制的横坐标刻度对应的数据索引 */
					var previousXTickDataIndex = null;

					/**
					 * 根据提供的数据的索引位置绘制刻度
					 * @param {Number} i 数据的索引位置
					 */
					var renderXTick = function(i){
						if(i < 0 || i >= groupCount)
							return;

						var tickX = Math.floor(xLeft_axisX + config_axisXTickOffset + i * groupSize) + 0.5;

						var data = dataList[i];
						/* 数据格式转换 */
						data = dataParser? dataParser(data, i, dataList): data;

						/* 绘制网格竖线 */
						if(ifShowVerticalGridLine){
							ctx.save();
							ctx.setLineDash && ctx.setLineDash(config_gridLineDash);
							config_verticalGridLineColor && (ctx.strokeStyle = config_verticalGridLineColor);

							/* 蜡烛图 */
							ctx.beginPath();
							ctx.moveTo(tickX, y_axisX - 1);
							ctx.lineTo(tickX, y_axisX - 1 - Math.floor(kSubChartSketch.getHeight()));
							ctx.stroke();
							ctx.restore();
						}

						/* 汇集刻度，用于图形绘制完毕后统一绘制 */
						var label = (function(){
							if(!config_showAxisXLabel)
								return "";

							var previousData = null;
							if(null != previousXTickDataIndex && previousXTickDataIndex >= 0 && previousXTickDataIndex < dataList.length)
								previousData = dataList[previousXTickDataIndex];
							if(null != previousData && dataParser)
								previousData = dataParser(previousData, previousXTickDataIndex, dataList);

							return config_axisXLabelGenerator(data, i, previousData, previousXTickDataIndex);
						})();
						axisXTickList.push({x: tickX, label: label});

						previousXTickDataIndex = i;
					};

					/* 绘制X轴刻度 */
					var edgeTickDataIndex,/** 处于边界位置的刻度所对应的数据索引 */
						lastTickDataIndex;/** 最后一个的刻度所对应的数据索引 */
					edgeTickDataIndex = groupCount - 1;

					var b = new Big(axisXTickInterval);
					for(var i = 0; i <= axisXTickCount - 1; i++){
						renderXTick(roundBig(b.mul(i)));
					}
					lastTickDataIndex = Math.min(roundBig(b.mul(i)), groupCount - 1);

					b = new Big(groupSize);
					var totalSpace = Math.min(numBig(b.mul(groupCount - 1)), kChartSketch.getContentWidth());
					var remainingSpace = totalSpace - (numBig(b.mul(lastTickDataIndex)) - halfGroupBarWidth + halfGroupSize);
					if(remainingSpace < halfGroupSize){
						/* 剩余空间不足，只绘制边界刻度 */
						renderXTick(edgeTickDataIndex);
					}else{
						/* 绘制最后一个刻度和边界刻度 */
						renderXTick(edgeTickDataIndex);
						if(lastTickDataIndex !== edgeTickDataIndex)
							renderXTick(lastTickDataIndex);
					}
				})();

				/* 绘制Y轴 */
				(function(){
					/* 绘制Y轴坐标线 */
					if(config_showAxisYLine){
						ctx.beginPath();
						ctx.moveTo(x_axisY, yTop_axisY);
						ctx.lineTo(x_axisY, yBottom_axisY);
						ctx.stroke();
					}

					var isAxisYPrecisionAuto = "auto" == String(config_axisYPrecision).trim().toLowerCase();
					var axisYPrecisionBak = config_axisYPrecision;
					var ifDeclaredAxisYPrecision = "axisYPrecision" in config;
					if(isAxisYPrecisionAuto)
						config.axisYPrecision = kDataSketch.getPricePrecision();

					/* 绘制Y轴刻度（自下而上） */
					var maxAxisYTickIndex = config_axisYMidTickQuota + 1;
					for(var i = 0; i <= maxAxisYTickIndex; i++){
						var price = kDataSketch.getPriceFloor() + numBig(new Big(axisYPriceInterval).mul(i)),
							tickOffset = numBig(new Big(axisYHeightInterval).mul(maxAxisYTickIndex - i));
						var tickY = Math.round(tickOffset);

						/* 绘制网格横线 */
						if(ifShowHorizontalGridLine && i > 0){/* 坐标轴横线上不再绘制 */
							ctx.save();
							ctx.setLineDash && ctx.setLineDash(config_gridLineDash);
							config_horizontalGridLineColor && (ctx.strokeStyle = config_horizontalGridLineColor);

							ctx.beginPath();
							ctx.moveTo(x_axisY, yTop_axisY + tickY);
							ctx.lineTo(x_axisY + (ifShowAxisYLeft? 1: -1) * Math.floor(kChartSketch.getWidth()), yTop_axisY + tickY);
							ctx.stroke();
							ctx.restore();
						}

						/* 汇集刻度，用于图形绘制完毕后统一绘制 */
						axisYTickList.push({y: tickY, price: price, label: config_axisYFormatter(price, config)});
					}

					/* 自动检测精度，规避多个刻度使用相同取值的情况 */
					var flag = false;
					do{
						flag = false;
						for(var i = 0; i < axisYTickList.length - 1; i++)
							for(var j = i + 1; j < axisYTickList.length; j++){
								if(axisYTickList[i].label === axisYTickList[j].label){
									flag = true;
									break;
								}

								if(flag)
									break;
							}

						if(flag && config.axisYPrecision < 20){
							config.axisYPrecision += 1;
							for(var i = 0; i < axisYTickList.length; i++)
								axisYTickList[i].label = config_axisYFormatter(axisYTickList[i].price, config);
						}
					}while(flag);

					if(ifDeclaredAxisYPrecision)
						config.axisYPrecision = axisYPrecisionBak;
					else
						delete config.axisYPrecision;
				})();

				ctx.restore();
			})();

			/* 绘制蜡烛图 */
			(function(){
				ctx.save();

				/**
				 * 绘制给定索引对应的数据的蜡烛
				 * @param {Number} i 数据索引
				 * @param {Function} [callback] 绘制完成后执行的方法
				 */
				var renderCandle = function(i, callback){
					var data = dataList[i];
					/* 数据格式转换 */
					data = dataParser? dataParser(data, i, dataList): data;

					var x = Math.floor(xLeft_axisX + config_axisXTickOffset + numBig(new Big(groupSize).mul(i)) - halfGroupBarWidth);

					var isAppreciated = data.closePrice > data.openPrice,
						isKeeped = Math.abs(data.closePrice - data.openPrice) < 2e-7;
					ctx.fillStyle = ctx.strokeStyle = isKeeped? config_keepedColor: (isAppreciated? config_appreciatedColor: config_depreciatedColor);

					var maxLinePrice = Math.max(data.highPrice, data.lowPrice),
						maxBarPrice = Math.max(data.openPrice, data.closePrice);

					/* 绘制线 */
					var lineX = x + floorBig(new Big(config_groupBarWidth).minus(config_groupLineWidth).div(2)),
						lineYTop = Math.floor(yTop_axisY + getHeight(maxLinePrice));
					var lineYBottom = lineYTop + Math.floor(getHeight(data.highPrice, data.lowPrice));
					if(Math.abs(lineYBottom - lineYTop) < 2e-7)
						lineYBottom += 1;
					if(config_groupLineWidth > 1){
						ctx.strokeWidth = 0;
						ctx.fillRect(lineX, lineYTop, config_groupLineWidth, Math.abs(lineYBottom - lineYTop));
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
					if(0 === barHeight)
						barHeight = 1;
					ctx.strokeWidth = 0;
					ctx.fillRect(barX, barY, config_groupBarWidth, barHeight);

					util.try2Call(callback, null, data, i, lineX, barX);
				};

				/* 绘制蜡烛图及量图 */
				for(var i = 0; i < groupCount; i++)
					renderCandle(i);

				ctx.restore();
			})();

			/* 绘制绘制坐标系刻度 */
			(function(){
				drawAxisXTickList();
				drawAxisYTickList();
			})();

			return new KSubChartRenderResult(this, config);
		};
	};
	KSubChart_CandleChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_CandleChart", KSubChart_CandleChart);
})();