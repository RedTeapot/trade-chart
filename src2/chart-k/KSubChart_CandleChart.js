;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChart = TradeChart2.KChart,
		KChartSketch = TradeChart2.KChartSketch,

		SubChartTypes = TradeChart2.SubChartTypes,
		KSubChartSketch = TradeChart2.KSubChartSketch,
		KSubChartRenderResult = TradeChart2.KSubChartRenderResult,

		KSubChartSketch_CandleDataSketch = TradeChart2.KSubChartSketch_CandleDataSketch;

	/**
	 * 默认的，适用于K线图“蜡烛图”子图的配置项
	 */
	var defaultConfig = {
		appreciatedColor: "#d58c2a",/** 收盘价大于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
		depreciatedColor: "#21CB21",/** 收盘价小于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
		keepingColor: "#DEDEDE",/** 收盘价等于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */

		axisYTickOffset: 0/* 纵坐标刻度距离原点的位移，取值为正则向上偏移 */
	};

	/**
	 * 根据给定的配置，生成素描
	 * @param {KSubChartConfig} config 绘制配置
	 * @param {Number} [height] 绘制高度（当配置中指定的高度为百分比字符串时使用）
	 * @returns {KSubChartSketch}
	 */
	var getChartSketchByConfig = function(config, height){
		var chartSketch = new KSubChartSketch();

		var config_height = config.getConfigItemValue("height"),
			config_paddingTop = config.getConfigItemValue("paddingTop"),
			config_paddingBottom = config.getConfigItemValue("paddingBottom"),
			config_axisYTickOffset = config.getConfigItemValue("axisYTickOffset");

		var canvasHeight = util.isValidNumber(height)? height: config_height;
		var axisYHeight = canvasHeight - config_paddingTop - config_paddingBottom;
		var contentHeight = axisYHeight - config_axisYTickOffset;
		chartSketch.setCanvasHeight(canvasHeight)
			.setAxisYHeight(Math.max(axisYHeight, 0))
			.setContentHeight(Math.max(contentHeight, 0));

		return chartSketch;
	};

	/**
	 * K线图子图：蜡烛图
	 */
	KChart.implSubChart(SubChartTypes.K_CANDLE, {
		defaultConfig: defaultConfig,

		dataSketchMethod: function(originalDataList){
			var dataList = this.getKChart().getDataManager().getConvertedData(originalDataList);
			var dataSketch_origin_max = -Infinity,/* 最大价格 */
				dataSketch_origin_min = Infinity,/* 最小价格 */
				dataSketch_origin_avgVariation = 0,/* 价格的平均变动幅度 */
				dataSketch_origin_maxVariation = 0,/* 价格的最大变动幅度 */

				dataSketch_extended_pricePrecision = 0;/* 坐标中价格的精度 */

			var variationSum = 0;
			for(var i = 0; i < dataList.length; i++){
				var d = dataList[i];
				if(null == d || typeof d !== "object")
					continue;

				var openPrice = +d.openPrice,
					highPrice = +d.highPrice,
					lowPrice = +d.lowPrice,
					closePrice = +d.closePrice;

				/* 数据精度确定 */
				dataSketch_extended_pricePrecision = Math.max(
					dataSketch_extended_pricePrecision,
					util.getMaxPrecision([openPrice, highPrice, lowPrice, closePrice])
				);

				var max = Math.max(openPrice, highPrice, lowPrice, closePrice),
					min = Math.min(openPrice, highPrice, lowPrice, closePrice);
				if(max > dataSketch_origin_max)
					dataSketch_origin_max = max;
				if(min < dataSketch_origin_min)
					dataSketch_origin_min = min;

				/* 确定更大的变动幅度 */
				var variation = Math.abs(max - min);
				if(variation > dataSketch_origin_maxVariation)
					dataSketch_origin_maxVariation = variation;
				variationSum += variation;
			}
			var len = dataList.length;
			dataSketch_origin_avgVariation = len > 0? (variationSum / len): 0;

			return {
				origin_min: dataSketch_origin_min,
				origin_max: dataSketch_origin_max,
				origin_avgVariation: dataSketch_origin_avgVariation,
				origin_maxVariation: dataSketch_origin_maxVariation,
				extended_pricePrecision: dataSketch_extended_pricePrecision
			};
		},

		renderAction: function(canvasObj, env){
			var self = this;
			var kChart = this.getKChart();

			var config_width = util.calcRenderingWidth(canvasObj, this.getConfigItemValue("width")),
				config_height = util.calcRenderingHeight(canvasObj, this.getConfigItemValue("height")),
				config_paddingTop = this.getConfigItemValue("paddingTop"),

				config_axisYTickOffset = this.getConfigItemValue("axisYTickOffset"),

				config_keepingColor = this.getConfigItemValue("keepingColor"),
				config_appreciatedColor = this.getConfigItemValue("appreciatedColor"),
				config_depreciatedColor = this.getConfigItemValue("depreciatedColor"),

				config_groupBarWidth = this.getConfigItemValue("groupBarWidth"),
				config_groupLineWidth = this.getConfigItemValue("groupLineWidth");

			var ctx = util.initCanvas(canvasObj, config_width, config_height);
			var dataSketch = this.sketchData();

			/* 转换配置项取值 */
			this.convertConfigItemValues(canvasObj, dataSketch);

			var kChartSketch = KChartSketch.sketchByConfig(kChart.getConfig(), config_width),
				kSubChartSketch = getChartSketchByConfig(this.getConfig(), config_height).updateByDataSketch(dataSketch);

			var dataManager = kChart.getDataManager();
			var xPositionAndDataListList = self._getRenderingXPositionAndDataIndexListFromRight(kChartSketch);

			/* 绘制的数据个数 */
			var groupCount = xPositionAndDataListList.length;
			/* 蜡烛一半的宽度 */
			var halfGroupBarWidth = kChart._calcHalfGroupBarWidth();

			/* 横坐标位置 */
			var xLeft_axisX = kChart._calcAxisXLeftPosition(),
				xRight_axisX = kChart._calcAxisXRightPosition(kChartSketch.getCanvasWidth()),
				xLeft_axisX_content = kChart._calcAxisXContentLeftPosition(),
				xRight_axisX_content = kChart._calcAxisXContentRightPosition(kChartSketch.getCanvasWidth()),
				xLeftEdge_axisX_content = xLeft_axisX_content - halfGroupBarWidth,
				xRightEdge_axisX_content = xRight_axisX_content + halfGroupBarWidth,

				$yTop_axisY = config_paddingTop;

			/**
			 * 获取指定价格对应的物理高度
			 * @param {Number} price1 价格1
			 * @param {Number} [price2=dataSketch.getAmountCeiling()] 价格2
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
				self._renderBackground(ctx, kChartSketch.getAxisXWidth(), kSubChartSketch.getAxisYHeight());

				/* 绘制Y轴、Y轴刻度、网格横线 */
				config_axisYTickOffset = util.parseAsNumber(config_axisYTickOffset, 0);
				finishRemainingAxisYRendering = self._renderAxisY(ctx, kChartSketch, kSubChartSketch, dataSketch, {
					axisYTickConverter: function(tick){
						tick.y -= config_axisYTickOffset;
						return tick;
					}
				});

				/* 绘制X轴、X轴刻度、网格竖线 */
				finishRemainingAxisXRendering = self._renderAxisX(ctx, kChartSketch, kSubChartSketch);

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
					var dp = xPositionAndDataListList[i];

					var data = dataManager.getConvertedData(dp.dataIndex);
					if(null == data)
						return;

					var x = dp.x - halfGroupBarWidth;

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
				};

				/* 裁剪掉蜡烛中越界的部分 - 步骤一：备份可能被覆盖区域的原始像素值 */
				var leftX = 0,
					rightX = xRightEdge_axisX_content + 1;

				/* getImageData() 以及 putImageData() 方法不受变化影响，因而需要放大处理 */
				var canvasOffsetWidth = ctx.canvas.offsetWidth, canvasOffsetHeight = ctx.canvas.offsetHeight;
				var hScale = canvasOffsetWidth === 0? 1: (ctx.canvas.width / ctx.canvas.offsetWidth),
					vScale = canvasOffsetHeight === 0? 1: (ctx.canvas.height / ctx.canvas.offsetHeight);
				var imgDataHeight = kSubChartSketch.getContentHeight() * vScale,
					imgDataTop = config_paddingTop * vScale,
					leftImgDataLeft = leftX * hScale,
					rightImgDataLeft = rightX * hScale;

				var leftOldImgData = null,
					rightOldImgData = null;
				try{
					leftOldImgData = ctx.getImageData(
						leftX,
						config_paddingTop * vScale,
						(xLeftEdge_axisX_content - leftX) * hScale,
						imgDataHeight
					);
					rightOldImgData = ctx.getImageData(
						rightX,
						config_paddingTop * vScale,
						(config_width - rightX) * hScale,
						imgDataHeight
					);
				}catch(e){
					console.error(e);
				}

				for(var i = 0; i < xPositionAndDataListList.length; i++)
					renderCandle(i);

				/* 裁剪掉蜡烛中越界的部分 - 步骤二：将备份的像素值重新覆盖到绘制的蜡烛上 */
				if(null != leftOldImgData)
					ctx.putImageData(leftOldImgData, leftImgDataLeft, imgDataTop);
				if(null != rightOldImgData)
					ctx.putImageData(rightOldImgData, rightImgDataLeft, imgDataTop);

				ctx.restore();
			})();

			/* 绘制坐标系标签 */
			finishRemainingAxisXRendering();
			finishRemainingAxisYRendering();

			var renderResult = this._getLatestRenderResult(canvasObj);
			if(null == renderResult){
				renderResult = new KSubChartRenderResult(this, canvasObj);
				this._setLatestRenderResult(canvasObj, renderResult);
			}
			renderResult.setKChartSketch(kChartSketch)
				.setKSubChartSketch(kSubChartSketch)
				.setDataSketch(dataSketch);
			return renderResult;
		}
	});
})();