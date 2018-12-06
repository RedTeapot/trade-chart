;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChartSketch = TradeChart2.KChartSketch,

		KSubChartTypes = TradeChart2.KSubChartTypes,
		KSubChartConfig_VolumeConfig = TradeChart2.KSubChartConfig_VolumeConfig,
		KSubChart = TradeChart2.KSubChart,
		KSubChart_VolumeRenderResult = TradeChart2.KSubChart_VolumeRenderResult,

		KSubChartSketch_VolumeDataSketch = TradeChart2.KSubChartSketch_VolumeDataSketch,
		KSubChartSketch_VolumeChartSketch = TradeChart2.KSubChartSketch_VolumeChartSketch;

	var numBig = function(big){
		return Number(big.toString());
	};
	var ceilBig = function(big){
		return Math.ceil(numBig(big));
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

		/* 渲染配置 */
		var config = new KSubChartConfig_VolumeConfig().setUpstreamConfigInstance(kChart.getConfig(), true);

		/**
		 * 获取配置项集合
		 * @override
		 * @returns {*}
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * @override
		 *
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @returns {KSubChart_VolumeRenderResult} 绘制的K线图
		 */
		this.implRender = function(canvasObj){
			var self = this;

			if(!(canvasObj instanceof HTMLCanvasElement)){
				if(NOT_SUPPLIED !== lastRenderingCanvasObj){
					canvasObj = lastRenderingCanvasObj;
				}else{
					throw new Error("No canvas element supplied to render");
				}
			}else
				lastRenderingCanvasObj = canvasObj;

			var config_width = util.calcRenderingWidth(canvasObj, this.getConfigItem("width")),
				config_height = util.calcRenderingHeight(canvasObj, this.getConfigItem("height")),

				config_paddingLeft = this.getConfigItem("paddingLeft"),
				config_paddingTop = this.getConfigItem("paddingTop"),

				config_keepingColor = this.getConfigItem("keepingColor"),
				config_appreciatedColor = this.getConfigItem("appreciatedColor"),
				config_depreciatedColor = this.getConfigItem("depreciatedColor"),

				config_groupGap = this.getConfigItem("groupGap"),
				config_groupBarWidth = this.getConfigItem("groupBarWidth");

			kChart.getConfig().setConfigItemConvertedValue("width", config_width);
			config.setConfigItemConvertedValue("height", config_height);

			var ctx = util.initCanvas(canvasObj, config_width, config_height);

			var kDataSketch = KSubChartSketch_VolumeDataSketch.sketch(kChart, this.getConfig()),
				kChartSketch = KChartSketch.sketchByConfig(kChart.getConfig(), config_width),
				kSubChartSketch = KSubChartSketch_VolumeChartSketch.sketchByConfig(this.getConfig(), config_height).updateByDataSketch(kDataSketch);

			var xPositionList = self.getRenderingXPositionListFromRight(kChartSketch);
			var dataList = kChart.getKDataManager().getConvertedRenderingDataList(kChartSketch.getMaxGroupCount());

			/* 绘制的数据个数 */
			var groupCount = Math.min(kChartSketch.getMaxGroupCount(), dataList.length);
			/* 蜡烛一半的宽度 */
			var halfGroupBarWidth = kChart.calcHalfGroupBarWidth();

			/* 横坐标位置 */
			var xLeft_axisX = kChart.calcAxisXLeftPosition(),
				xRight_axisX = kChart.calcAxisXRightPosition(kChartSketch.getCanvasWidth()),
				xLeft_axisX_content = kChart.calcAxisXContentLeftPosition(),
				xRight_axisX_content = kChart.calcAxisXContentRightPosition(kChartSketch.getCanvasWidth()),
				xLeftEdge_axisX_content = xLeft_axisX_content - halfGroupBarWidth,
				xRightEdge_axisX_content = xRight_axisX_content + halfGroupBarWidth,
				y_axisX = Math.floor(config_paddingTop + kSubChartSketch.getAxisYHeight());

			/**
			 * 获取指定成交量对应的物理高度
			 * @param {Number} volume1 成交量1
			 * @param {Number} [volume2=kDataSketch.getAmountFloor()] 成交量2
			 * @returns {Big} 物理高度
			 */
			var calcHeight = function(volume1, volume2){
				if(arguments.length < 2)
					volume2 = kDataSketch.getAmountFloor();

				return kSubChartSketch.calculateHeight(Math.abs(volume2 - volume1));
			};

			/* 清空既有内容 */
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			/* 绘制坐标系 */
			var finishRemainingAxisXRendering,
				finishRemainingAxisYRendering;
			(function(){
				ctx.save();

				/* 绘制坐标区域背景 */
				self.renderBackground(ctx, kChartSketch.getAxisXWidth(), kSubChartSketch.getAxisYHeight());

				/* 绘制X轴、X轴刻度、网格竖线 */
				finishRemainingAxisXRendering = self.renderAxisX(ctx, kChartSketch, kSubChartSketch);

				/* 绘制Y轴、Y轴刻度、网格横线 */
				finishRemainingAxisYRendering = self.renderAxisY(ctx, kChartSketch, kSubChartSketch, kDataSketch);

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

					var volumeHeight = ceilBig(calcHeight(data.volume));
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

			/* 绘制坐标系标签 */
			finishRemainingAxisXRendering();
			finishRemainingAxisYRendering();

			return new KSubChart_VolumeRenderResult(this, kChartSketch, kSubChartSketch, kDataSketch, canvasObj);
		};
	};
	KSubChart_VolumeChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_VolumeChart", KSubChart_VolumeChart);
})();