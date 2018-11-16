;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChartSketch = TradeChart2.KChartSketch,

		KSubChartTypes = TradeChart2.KSubChartTypes,
		KSubChart = TradeChart2.KSubChart,
		KSubChart_VolumeRenderResult = TradeChart2.KSubChart_VolumeRenderResult,

		KSubChartSketch_VolumeDataSketch = TradeChart2.KSubChartSketch_VolumeDataSketch,
		KSubChartSketch_VolumeChartSketch = TradeChart2.KSubChartSketch_VolumeChartSketch;

	var numBig = function(big){
		return Number(big.toString());
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
		 * @param {KSubChartConfig_candle} config 渲染配置
		 * @returns {*}
		 */
		this.getConfigItem = function(name, config){
			var defaultConfig = TradeChart2["K_SUB_VOLUME_DEFAULT_CONFIG"];
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
			var self = this;

			if(null == config || typeof config !== "object"){
				if(NOT_SUPPLIED !== lastRenderingConfig){
					TradeChart2.showLog && console.info("Using last render config", lastRenderingConfig);
					config = lastRenderingConfig;
				}
			}else
				lastRenderingConfig = config;

			if(!(canvasObj instanceof HTMLCanvasElement)){
				if(NOT_SUPPLIED !== lastRenderingCanvasObj){
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

				config_keepingColor = getConfigItem("keepingColor"),
				config_appreciatedColor = getConfigItem("appreciatedColor"),
				config_depreciatedColor = getConfigItem("depreciatedColor"),

				config_axisLineWidth = getConfigItem("axisLineWidth"),
				config_axisLineColor = getConfigItem("axisLineColor"),

				config_axisXTickOffset = getConfigItem("axisXTickOffset"),
				config_axisXTickOffsetFromRight = getConfigItem("axisXTickOffsetFromRight"),
				config_axisYPosition = getConfigItem("axisYPosition"),

				config_groupGap = getConfigItem("groupGap"),
				config_groupBarWidth = getConfigItem("groupBarWidth");

			var ifShowAxisYLeft = "left" === String(config_axisYPosition).toLowerCase();

			var ctx = util.initCanvas(canvasObj, config_width, config_height);

			var kDataSketch = KSubChartSketch_VolumeDataSketch.sketch(kChart, config),
				kChartSketch = KChartSketch.sketchByConfig(kChart.getConfig(), config_width),
				kSubChartSketch = KSubChartSketch_VolumeChartSketch.sketchByConfig(config, config_height).updateByDataSketch(kDataSketch);

			var xPositionList = self.getRenderingXPositionListFromRight(config, kChartSketch);
			var dataList = kChart.getKDataManager().getConvertedRenderingDataList(kChartSketch.getMaxGroupCount());

			/* 绘制的数据个数 */
			var groupCount = Math.min(kChartSketch.getMaxGroupCount(), dataList.length);
			/* 一组数据的宽度 */
			var groupSize = config_groupBarWidth + config_groupGap;
			/* 蜡烛一半的宽度 */
			var halfGroupBarWidth = kChart.calcHalfGroupBarWidth();

			/* 横坐标位置 */
			var xLeft_axisX = kChart.calcAxisXLeftPosition(),
				xRight_axisX = kChart.calcAxisXRightPosition(kChartSketch.getCanvasWidth()),
				xLeft_axisX_content = kChart.calcAxisXContentLeftPosition(),
				xRight_axisX_content = kChart.calcAxisXContentRightPosition(kChartSketch.getCanvasWidth()),
				xLeftEdge_axisX_content = xLeft_axisX_content - halfGroupBarWidth,
				xRightEdge_axisX_content = xRight_axisX_content + halfGroupBarWidth,
				y_axisX = Math.floor(config_paddingTop + kSubChartSketch.getHeight()),

				x_axisY = ifShowAxisYLeft? xLeft_axisX: xRight_axisX;
			var xRightBig_axisX_content = new Big(xRight_axisX_content);

			/**
			 * 获取指定成交量对应的物理高度
			 * @param {Number} volume1 成交量1
			 * @param {Number} [volume2=kDataSketch.getAmountFloor()] 成交量2
			 * @returns {Number} 物理高度
			 */
			var calcHeight = function(volume1, volume2){
				if(arguments.length < 2)
					volume2 = kDataSketch.getAmountFloor();

				return kSubChartSketch.calculateHeight(Math.abs(volume2 - volume1));
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

			/* 清空既有内容 */
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			/* 绘制坐标系 */
			(function(){
				ctx.save();

				config_axisLineWidth && (ctx.lineWidth = config_axisLineWidth);
				config_axisLineColor && (ctx.strokeStyle = config_axisLineColor);

				/* 绘制坐标区域背景 */
				self.renderBackground(ctx, config, kChartSketch.getAxisXWidth(), kSubChartSketch.getHeight());

				/* 绘制X轴 */
				axisXTickList = self.renderAxisX(ctx, config, kChartSketch, kSubChartSketch);

				/* 绘制Y轴 */
				axisYTickList = self.renderAxisY(ctx, config, kChartSketch, kSubChartSketch, kDataSketch);

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
				 * @param {Number} i 数据索引（从右向左）
				 */
				var renderVolume = function(i){
					var dataIndex = groupCount - 1 - i;
					var data = dataList[dataIndex];
					var x = xPositionList[i] - halfGroupBarWidth;

					if(i === 0){
						TradeChart2.showLog && console.info("First volume left position: " + x + " on sub chart: " + self.id);
					}

					var volumeHeight = Math.ceil(calcHeight(data.volume));
					if(0 === volumeHeight)
						return;

					var barX = x;
					var barY = Math.floor(y_axisX - volumeHeight);

					var cutY = barY;
					if(cutY > 1)
						cutY -= 2;
					else if(cutY > 0)
						cutY -= 1;
					var cutHeight = volumeHeight + 4;

					var isAppreciated = data.closePrice > data.openPrice,
						isKeeping = Math.abs(data.closePrice - data.openPrice) < 2e-7;

					ctx.strokeWidth = 0;
					ctx.fillStyle = ctx.strokeStyle = isKeeping? config_keepingColor: (isAppreciated? config_appreciatedColor: config_depreciatedColor);

					if(i === 0 || i === groupCount - 1){
						/* 裁剪掉蜡烛中越界的部分 - 步骤一：备份可能被覆盖区域的原始像素值 */
						var oldImgData;
						if(i === 0)
							oldImgData = ctx.getImageData(xRightEdge_axisX_content + 1, cutY, config_width - xRightEdge_axisX_content - 1, cutHeight);
						else
							oldImgData = ctx.getImageData(0, cutY, xLeftEdge_axisX_content, cutHeight);
					}


					ctx.fillRect(barX, barY, config_groupBarWidth, volumeHeight);

					if(i === 0 || i === groupCount - 1){
						/* 裁剪掉蜡烛中越界的部分 - 步骤二：将备份的像素值重新覆盖到绘制的蜡烛上 */
						if(i === 0)
							ctx.putImageData(oldImgData, xRightEdge_axisX_content + 1, cutY);
						else
							ctx.putImageData(oldImgData, 0, cutY);
					}
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

			return new KSubChart_VolumeRenderResult(this, kChartSketch, kSubChartSketch, canvasObj, config);
		};
	};
	KSubChart_VolumeChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_VolumeChart", KSubChart_VolumeChart);
})();