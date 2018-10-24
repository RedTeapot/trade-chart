;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KDataSketch = TradeChart2.KDataSketch,
		KChartSketch = TradeChart2.KChartSketch,

		KSubChartTypes = TradeChart2.KSubChartTypes,
		KSubChart = TradeChart2.KSubChart,
		KSubChart_VolumeRenderResult = TradeChart2.KSubChart_VolumeRenderResult,

		KSubChartSketch_VolumeDataSketch = TradeChart2.KSubChartSketch_VolumeDataSketch,
		KSubChartSketch_VolumeChartSketch = TradeChart2.KSubChartSketch_VolumeChartSketch;

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

	var NOT_SUPPLIED = {};

	/**
	 * @constructor
	 * @augments KSubChart
	 *
	 * K线图子图：蜡烛图
	 * @param {KChart} kChart 附加该子图的K线图
	 */
	var KSubChart_VolumeChart = function(kChart){
		KSubChart.call(this, kChart, KSubChartTypes.VOLUME);
		var self = this;

		/**
		 * 最后一次执行绘制操作时绘制到的目标Canvas
		 * @type {HTMLCanvasElement}
		 */
		var lastRenderingCanvasObj = NOT_SUPPLIED;

		/**
		 * 最后一次执行绘制操作时所使用的绘制配置
		 * @type {KSubChartConfig_volume}
		 */
		var lastRenderingConfig = NOT_SUPPLIED;

		/**
		 * @override
		 * 从给定的配置集合中获取指定名称的配置项取值。
		 * 如果给定的配置集合中不存在，则从K线图的全局配置中获取。
		 * 如果全局的配置中也不存在，则返回undefined
		 *
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getConfigItem = function(name, config){
			var defaultConfig = TradeChart2.K_SUB_VOLUME_DEFAULT_CONFIG;
			if(null != config && name in config)
				return config[name];
			else if(name in defaultConfig)
				return defaultConfig[name];

			return kChart.getConfigItem(name);
		};

		/**
		 * @override
		 *
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {KSubChartConfig_volume} config 渲染配置
		 * @returns {KSubChart_VolumeRenderResult} 绘制的K线图
		 */
		this.implRender = function(canvasObj, config){
			if(null == config || typeof config !== "object"){
				if(NOT_SUPPLIED !== lastRenderingConfig){
					console.info("Using last render config", lastRenderingConfig);
					config = lastRenderingConfig;
				}
			}else
				lastRenderingConfig = config;

			if(!(canvasObj instanceof HTMLCanvasElement)){
				if(NOT_SUPPLIED !== lastRenderingCanvasObj){
					console.info("Rendering onto last used canvas", lastRenderingCanvasObj);
					canvasObj = lastRenderingCanvasObj;
				}else{
					throw new Error("No canvas element supplied to render");
				}
			}else
				lastRenderingCanvasObj = canvasObj;

			var getConfigItem = function(name){
				return self.getConfigItem(name, config);
			};

			var config_width = util.calcRenderingWidth(canvasObj, getConfigItem("width")),
				config_height = util.calcRenderingHeight(canvasObj, getConfigItem("height")),

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

				config_axisLineWidth = getConfigItem("axisLineWidth"),
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
				config_axisYAmountFloor = getConfigItem("axisYAmountFloor"),
				config_axisYMidTickQuota = getConfigItem("axisYMidTickQuota"),
				config_axisYLabelVerticalOffset = getConfigItem("axisYLabelVerticalOffset"),
				config_axisYAmountFloorLabelFont = getConfigItem("axisYAmountFloorLabelFont"),
				config_axisYAmountFloorLabelColor = getConfigItem("axisYAmountFloorLabelColor"),

				config_axisYAmountCeilingLabelFont = getConfigItem("axisYAmountCeilingLabelFont"),
				config_axisYAmountCeilingLabelColor = getConfigItem("axisYAmountCeilingLabelColor"),

				config_showAxisXLine = getConfigItem("showAxisXLine"),
				config_showAxisXLabel = getConfigItem("showAxisXLabel"),
				config_axisXLabelGenerator = getConfigItem("axisXLabelGenerator"),
				config_axisXLabelOffset = getConfigItem("axisXLabelOffset"),
				config_axisXLabelSize = getConfigItem("axisXLabelSize"),
				config_axisXTickOffset = getConfigItem("axisXTickOffset"),
				config_axisXLabelHorizontalAlign = getConfigItem("axisXLabelHorizontalAlign"),

				config_groupGap = getConfigItem("groupGap"),
				config_groupBarWidth = getConfigItem("groupBarWidth"),
				config_groupLineWidth = getConfigItem("groupLineWidth");

			var ifShowAxisYLeft = "left" === String(config_axisYPosition).toLowerCase(),
				ifShowAxisYLabelOutside = "outside" === String(config_axisYLabelPosition).toLowerCase();

			var dataList = kChart.getKDataManager().getConvertedRenderingDataList();
			if(dataList.length > 0)
				console.debug("First converted data to draw: " + this.id, kChart.getKDataManager().getFirstVisibleConvertedData());

			var ctx = util.initCanvas(canvasObj, config_width, config_height);

			var kDataSketch = KSubChartSketch_VolumeDataSketch.sketch(kChart, config),
				kChartSketch = KChartSketch.sketchByConfig(kChart.getConfig(), config_width),
				kSubChartSketch = KSubChartSketch_VolumeChartSketch.sketchByConfig(config, config_height).updateByDataSketch(kDataSketch);

			/* 横坐标位置 */
			var xLeft_axisX = util.getLinePosition(config_paddingLeft),
				xRight_axisX = xLeft_axisX + Math.floor(kChartSketch.getWidth()),
				xLeft_content = xLeft_axisX + Math.floor(config_axisXTickOffset),
				y_axisX = util.getLinePosition(config_paddingTop + kSubChartSketch.getHeight()),

				x_axisY = ifShowAxisYLeft? xLeft_axisX: xRight_axisX,
				yTop_axisY = util.getLinePosition(config_paddingTop),
				yBottom_axisY = y_axisX;

			/* 绘制的数据个数 */
			var groupCount = Math.min(kChartSketch.getMaxGroupCount(), dataList.length);
			/* 一组数据的宽度 */
			var groupSizeBig = new Big(config_groupBarWidth + config_groupGap);
			/* 蜡烛一半的宽度 */
			var halfGroupBarWidth = kChart.calcHalfGroupBarWidth();
			/* 一组数据宽度的一半 */
			var halfGroupSize = kChart.calcHalfGroupSize();
			/* 一个横坐标刻度横跨的数据个数 */
			var axisXLabelTickSpan = kChart.calcAxisXLabelTickSpan();
			/* 横坐标刻度个数 */
			var axisXTickCount = floorBig(new Big(groupCount).div(axisXLabelTickSpan));
			/** 相邻两个纵坐标刻度之间的价格悬差 */
			var axisYAmountInterval = numBig(new Big(kDataSketch.getVolumeCeiling()).minus(kDataSketch.getVolumeFloor()).div(config_axisYMidTickQuota + 1));
			/** 相邻两个纵坐标刻度之间的高度悬差 */
			var axisYHeightInterval = kSubChartSketch.calculateHeight(axisYAmountInterval);
			/* 是否绘制网格横线/竖线 */
			var ifShowVerticalGridLine = config_showVerticalGridLine && config_verticalGridLineColor,
				ifShowHorizontalGridLine = config_showHorizontalGridLine && config_horizontalGridLineColor;

			/**
			 * 获取指定成交量对应的物理高度
			 * @param {Number} volume1 成交量1
			 * @param {Number} [volume2=kDataSketch.getVolumeFloor()] 成交量2
			 * @returns {Number} 物理高度
			 */
			var calcHeight = function(volume1, volume2){
				if(arguments.length < 2)
					volume2 = kDataSketch.getVolumeFloor();

				return kSubChartSketch.calculateHeight(numBig(new Big(volume2 || 0).minus(volume1 || 0).abs()));
			};

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
			 * 添加纵坐标刻度。如果相同位置，或相同标签的刻度已经存在，则不再添加
			 * @param {Number} tickY 纵坐标刻度位置
			 * @param {Number} tickAmount 该刻度对应的量
			 */
			var try2AddAxisYTick = function(tickY, tickAmount){
				var tickAmountBig = new Big(tickAmount);
				var tickLabel = config_axisYFormatter(tickAmount, config);

				for(var i = 0; i < axisYTickList.length; i++){
					var tick = axisYTickList[i];
					if(tick.label === tickLabel || Math.abs(tick.y - tickY) < 1 || tickAmountBig.eq(tick.amount)){
						console.warn("Found potential existing tick while adding tick: " + tickLabel + "(" + tickAmount + ") at " + tickY, JSON.stringify(tick));
						return;
					}
				}

				axisYTickList.push({y: tickY, amount: tickAmount, label: tickLabel});
			};

			/**
			 * 绘制横坐标刻度
			 * @param {String} drawContent 绘制内容。both：刻度线和坐标值；tick：只绘制刻度线；label：只绘制坐标值；
			 */
			var drawAxisXTickList = function(drawContent){
				self.renderAxisXTickList(ctx, config, y_axisX, axisXTickList, drawContent);
			};

			/**
			 * 绘制纵坐标刻度
			 * @param {String} drawContent 绘制内容。both：刻度线和坐标值；tick：只绘制刻度线；label：只绘制坐标值；
			 */
			var drawAxisYTickList = function(drawContent){
				self.renderAxisYTickList(ctx, config, x_axisY, axisYTickList, drawContent);
			};

			// /* 清空既有内容 */
			// ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			/* 绘制坐标系 */
			(function(){
				ctx.save();

				config_axisLineWidth && (ctx.lineWidth = config_axisLineWidth);
				config_axisLineColor && (ctx.strokeStyle = config_axisLineColor);

				/* 绘制坐标区域背景 */
				self.renderBackground(ctx, config, kChartSketch.getWidth(), kSubChartSketch.getHeight());

				/* 绘制X轴 */
				axisXTickList = self.renderAxisX(ctx, config, kChartSketch, kSubChartSketch);

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
						config.axisYPrecision = kDataSketch.getVolumePrecision();

					/* 绘制Y轴刻度（自下而上） */
					var maxAxisYTickIndex = config_axisYMidTickQuota + 1;
					for(var i = 0; i <= maxAxisYTickIndex; i++){
						var amount = kDataSketch.getVolumeFloor() + numBig(new Big(axisYAmountInterval).mul(i)),
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
						try2AddAxisYTick(tickY, amount);
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
								axisYTickList[i].label = config_axisYFormatter(axisYTickList[i].amount, config);
						}else
							break;
					}while(flag);

					if(ifDeclaredAxisYPrecision)
						config.axisYPrecision = axisYPrecisionBak;
					else
						delete config.axisYPrecision;
				})();

				/* 绘制刻度线 */
				var drawContent = "tick";
				drawAxisXTickList(drawContent);
				drawAxisYTickList(drawContent);

				ctx.restore();
			})();

			/* 绘制量图 */
			(function(){
				ctx.save();

				/**
				 * 绘制给定索引对应的数据的量柱
				 * @param {Number} i 数据索引
				 */
				var renderVolume = function(i){
					var data = dataList[i];
					var x = Math.floor(xLeft_content + kChart.getRenderingOffset() + numBig(groupSizeBig.mul(i)) - halfGroupBarWidth);

					var isAppreciated = data.closePrice > data.openPrice,
						isKeeped = Math.abs(data.closePrice - data.openPrice) < 2e-7;

					ctx.save();
					ctx.strokeWidth = 0;
					ctx.fillStyle = ctx.strokeStyle = isKeeped? config_keepedColor: (isAppreciated? config_appreciatedColor: config_depreciatedColor);

					var barX = x;
					var volumeHeight = Math.ceil(calcHeight(data.volume));
					ctx.fillRect(barX, Math.floor(y_axisX - volumeHeight), config_groupBarWidth, volumeHeight);
					ctx.restore();
				};

				for(var i = 0; i < groupCount; i++)
					renderVolume(i);

				ctx.restore();
			})();

			/* 绘制绘制坐标系刻度 */
			(function(){
				var drawContent = "label";
				drawAxisXTickList(drawContent);
				drawAxisYTickList(drawContent);
			})();

			return new KSubChart_VolumeRenderResult(this, canvasObj, config);
		};
	};
	KSubChart_VolumeChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_VolumeChart", KSubChart_VolumeChart);
})();