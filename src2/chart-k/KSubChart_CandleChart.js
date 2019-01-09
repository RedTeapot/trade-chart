;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChartSketch = TradeChart2.KChartSketch,

		SubChartTypes = TradeChart2.SubChartTypes,
		KSubChartConfig_CandleConfig = TradeChart2.KSubChartConfig_CandleConfig,
		KSubChart = TradeChart2.KSubChart,
		KSubChart_CandleRenderResult = TradeChart2.KSubChart_CandleRenderResult,

		KSubChartSketch_CandleDataSketch = TradeChart2.KSubChartSketch_CandleDataSketch,
		KSubChartSketch_CandleChartSketch = TradeChart2.KSubChartSketch_CandleChartSketch;

	var numBig = function(big){
		return Number(big.toString());
	};
	var roundBig = function(big){
		return Math.round(numBig(big));
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
	var KSubChart_CandleChart = function(kChart){
		KSubChart.call(this, kChart, SubChartTypes.K_CANDLE);
		var self = this;

		/* 渲染配置 */
		var config = new KSubChartConfig_CandleConfig().setUpstreamConfigInstance(kChart.getConfig(), true);

		/**
		 * 获取配置项集合
		 * @override
		 * @returns {KSubChartConfig_CandleConfig}
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * @override
		 *
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} env 当前环境信息
		 * @param {Number} env.drawingOrderIndex 当前子图在该画布上的绘制顺序索引。第一个被绘制：0
		 *
		 * @returns {KSubChart_CandleRenderResult} K线子图绘制结果
		 */
		this.implRender = function(canvasObj, env){
			var config_width = util.calcRenderingWidth(canvasObj, this.getConfigItem("width")),
				config_height = util.calcRenderingHeight(canvasObj, this.getConfigItem("height")),

				config_paddingLeft = this.getConfigItem("paddingLeft"),
				config_paddingTop = this.getConfigItem("paddingTop"),

				config_axisYTickOffset = this.getConfigItem("axisYTickOffset"),

				config_keepingColor = this.getConfigItem("keepingColor"),
				config_appreciatedColor = this.getConfigItem("appreciatedColor"),
				config_depreciatedColor = this.getConfigItem("depreciatedColor"),

				config_groupGap = this.getConfigItem("groupGap"),
				config_groupBarWidth = this.getConfigItem("groupBarWidth"),
				config_groupLineWidth = this.getConfigItem("groupLineWidth");

			kChart.getConfig().setConfigItemConvertedValue("width", config_width);
			config.setConfigItemConvertedValue("height", config_height);

			var ctx = util.initCanvas(canvasObj, config_width, config_height);

			var dataSketch = (this.getSpecifiedDataSketchMethod() || KSubChartSketch_CandleDataSketch.sketch)(kChart, this.getConfig()),
				kChartSketch = KChartSketch.sketchByConfig(kChart.getConfig(), config_width),
				kSubChartSketch = KSubChartSketch_CandleChartSketch.sketchByConfig(this.getConfig(), config_height).updateByDataSketch(dataSketch);

			var xPositionList = self.getRenderingXPositionListFromRight(kChartSketch);
			var dataList = kChart.getDataManager().getConvertedRenderingDataList(kChartSketch.getMaxGroupCount());

			/* 绘制的数据个数 */
			var groupCount = dataList.length;
			/* 蜡烛一半的宽度 */
			var halfGroupBarWidth = kChart.calcHalfGroupBarWidth();

			/* 横坐标位置 */
			var xLeft_axisX = kChart.calcAxisXLeftPosition(),
				xRight_axisX = kChart.calcAxisXRightPosition(kChartSketch.getCanvasWidth()),
				xLeft_axisX_content = kChart.calcAxisXContentLeftPosition(),
				xRight_axisX_content = kChart.calcAxisXContentRightPosition(kChartSketch.getCanvasWidth()),
				xLeftEdge_axisX_content = xLeft_axisX_content - halfGroupBarWidth,
				xRightEdge_axisX_content = xRight_axisX_content + halfGroupBarWidth,

				$yTop_axisY = config_paddingTop;/* 整数使用$开头*/

			/**
			 * 获取指定价钱对应的物理高度
			 * @param {Number} price1 价钱1
			 * @param {Number} [price2=dataSketch.getAmountCeiling()] 价钱2
			 * @returns {Number} 物理高度
			 */
			var calcHeight = function(price1, price2){
				if(arguments.length < 2)
					price2 = dataSketch.getAmountCeiling();

				return kSubChartSketch.calculateHeight(Math.abs(price2 - price1));
			};

			/* 清空既有内容 */
			if(env.drawingOrderIndex === 0)
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
				config_axisYTickOffset = util.parseAsNumber(config_axisYTickOffset, 0);
				finishRemainingAxisYRendering = self.renderAxisY(ctx, kChartSketch, kSubChartSketch, dataSketch, {
					axisYTickConverter: function(tick){
						tick.y -= config_axisYTickOffset;
						return tick;
					}
				});

				ctx.restore();
			})();

			/* 绘制蜡烛图 */
			(function(){
				ctx.save();

				var linePosition = Math.floor((config_groupBarWidth - config_groupLineWidth) / 2);

				/**
				 * 绘制给定索引对应的数据的蜡烛
				 * @param {Number} i 数据索引（从右向左）
				 */
				var renderCandle = function(i){
					var dataIndex = groupCount - 1 - i;
					var data = dataList[dataIndex];
					var x = xPositionList[i] - halfGroupBarWidth;

					if(i === 0){
						TradeChart2.showLog && console.info("First candle left position: " + x + " on sub chart: " + self.id);
					}

					var isAppreciated = data.closePrice > data.openPrice,
						isKeeping = Math.abs(data.closePrice - data.openPrice) < 1e-8;
					var maxLinePrice = Math.max(data.highPrice, data.lowPrice),
						maxBarPrice = Math.max(data.openPrice, data.closePrice);

					var lineX = x + linePosition,
						lineYTop = $yTop_axisY + calcHeight(maxLinePrice);
					var lineYBottom = lineYTop + calcHeight(data.highPrice, data.lowPrice);
					if(Math.abs(lineYBottom - lineYTop) < 1)
						lineYBottom += 1;

					var barX = x,
						barY = $yTop_axisY + calcHeight(maxBarPrice);
					var barHeight = calcHeight(data.openPrice, data.closePrice);
					if(barHeight < 1)
						barHeight = 1;

					if(i === 0 || i === groupCount - 1){
						/* 裁剪掉蜡烛中越界的部分 - 步骤一：备份可能被覆盖区域的原始像素值 */
						var minY = Math.min(lineYTop, barY),
							maxHeight = Math.max(lineYBottom - lineYTop, barHeight) + 4;
						if(minY > 1)
							minY -= 2;
						else if(minY > 0)
							minY -= 1;

						var oldImgData;

						if(i === 0)
							oldImgData = ctx.getImageData(xRightEdge_axisX_content + 1, minY, config_width - xRightEdge_axisX_content - 1, maxHeight);
						else
							oldImgData = ctx.getImageData(0, minY, xLeftEdge_axisX_content, maxHeight);
					}

					/* 绘制线 */
					ctx.fillStyle = ctx.strokeStyle = isKeeping? config_keepingColor: (isAppreciated? config_appreciatedColor: config_depreciatedColor);
					if(config_groupLineWidth > 1){
						ctx.strokeWidth = 0;
						ctx.fillRect(Math.floor(lineX), Math.round(lineYTop), config_groupLineWidth, Math.round(Math.abs(lineYBottom - lineYTop)));
					}else{
						lineX = util.getLinePosition(lineX);

						ctx.strokeWidth = 1;
						ctx.beginPath();
						ctx.moveTo(lineX, util.getLinePosition(lineYTop));
						ctx.lineTo(lineX, util.getLinePosition(lineYBottom));
						ctx.stroke();
					}

					/* 绘制蜡烛 */
					ctx.strokeWidth = 0;
					ctx.fillRect(Math.floor(barX), Math.round(barY), config_groupBarWidth, Math.round(barHeight));

					if(i === 0 || i === groupCount - 1){
						/* 裁剪掉蜡烛中越界的部分 - 步骤二：将备份的像素值重新覆盖到绘制的蜡烛上 */
						if(i === 0)
							ctx.putImageData(oldImgData, xRightEdge_axisX_content + 1, minY);
						else
							ctx.putImageData(oldImgData, 0, minY);
					}
				};

				for(var i = 0; i < groupCount; i++)
					renderCandle(i);

				ctx.restore();
			})();

			/* 绘制坐标系标签 */
			finishRemainingAxisXRendering();
			finishRemainingAxisYRendering();

			var renderResult = this.getLatestRenderResult(canvasObj);
			if(null == renderResult){
				renderResult = new KSubChart_CandleRenderResult(this, canvasObj);
				this.setLatestRenderResult(canvasObj, renderResult);
			}
			renderResult.setKChartSketch(kChartSketch)
				.setKSubChartSketch(kSubChartSketch)
				.setDataSketch(dataSketch);
			return renderResult;
		};
	};
	KSubChart_CandleChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_CandleChart", KSubChart_CandleChart);
})();