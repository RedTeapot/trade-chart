;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChart = TradeChart2.KChart,
		KChartSketch = TradeChart2.KChartSketch,

		SubChartTypes = TradeChart2.SubChartTypes,
		KSubChartSketch = TradeChart2.KSubChartSketch,
		KSubChartRenderResult = TradeChart2.KSubChartRenderResult,

		KSubChartSketch_KebabDataSketch = TradeChart2.KSubChartSketch_KebabDataSketch;

	/**
	 * 默认的，适用于K线图“烤串图”子图的配置项
	 */
	var defaultConfig = {
		/**
		 * 纵坐标刻度距离原点的位移，取值为正则向上偏移
		 */
		axisYTickOffset: 0,

		/**
		 * 每组数据的水平内边距（左右相等）。不能超过 groupBarWidth 的一半，否则将以“0”对待。
		 * 支持设定为百分比字符串，例如：“20%”，此时计算依据为 groupBarWidth
		 * @type {Number|String}
		 */
		groupHorizontalPadding: 0,

		/**
		 * 每个价格的渲染高度。最好为奇数，从而使得线可以正好在正中间
		 */
		groupItemHeight: 1,

		/**
		 * 每组数据条目渲染前景色
		 * @type {String}
		 */
		groupItemColor: "black",

		/**
		 * 每组数据对应柱状区域的背景色
		 * @type {String|KSubChart_Kebab_GroupItemBackgroundGenerator}
		 */
		groupBackground: null
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
	 * K线图子图：烤串图
	 */
	KChart.implSubChart(SubChartTypes.K_KEBAB, {
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

				/* 数据精度确定 */
				dataSketch_extended_pricePrecision = Math.max(
					dataSketch_extended_pricePrecision,
					util.getMaxPrecision(d.priceList)
				);

				var minAndMax = util.minAndMax(d.priceList);
				if(null == minAndMax)
					continue;

				var max = minAndMax.max,
					min = minAndMax.min;
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

			var dataSketch = this.sketchData();

			/* 转换配置项取值 */
			this.convertConfigItemValues(canvasObj, dataSketch);

			var config_width = util.calcRenderingWidth(canvasObj, this.getConfigItemValue("width")),
				config_height = util.calcRenderingHeight(canvasObj, this.getConfigItemValue("height")),
				config_paddingTop = this.getConfigItemValue("paddingTop"),

				config_groupHorizontalPadding = this.getConfigItemValue("groupHorizontalPadding"),
				config_groupItemHeight = this.getConfigItemValue("groupItemHeight"),
				config_groupItemColor = this.getConfigItemValue("groupItemColor"),
				config_groupBackground = this.getConfigItemValue("groupBackground"),
				config_axisYTickOffset = this.getConfigItemValue("axisYTickOffset"),

				config_groupBarWidth = this.getConfigItemValue("groupBarWidth"),
				config_groupLineWidth = this.getConfigItemValue("groupLineWidth");

			var ctx = util.initCanvas(canvasObj, config_width, config_height);

			var kChartSketch = KChartSketch.sketchByConfig(kChart.getConfig(), config_width),
				kSubChartSketch = getChartSketchByConfig(this.getConfig(), config_height).updateByDataSketch(dataSketch);

			var dataManager = kChart.getDataManager();
			var xPositionAndDataListList = self._getRenderingXPositionAndDataIndexListFromRight(kChartSketch);

			/* 绘制的数据个数 */
			var groupCount = xPositionAndDataListList.length;
			/* 柱宽一半的宽度 */
			var halfGroupBarWidth = kChart._calcHalfGroupBarWidth();

			/* 自动将价格的渲染高度调整为奇数 */
			if(config_groupItemHeight % 2 === 0)
				config_groupItemHeight += 1;
			/* 价格条目渲染高度的一半 */
			var halfGroupItemHeight = Math.floor(config_groupItemHeight / 2);

			/* 每组数据的水平内边距（左右相等） */
			var r = /%/;
			var groupHorizontalPadding = config_groupHorizontalPadding;
			if(r.test(groupHorizontalPadding))
				groupHorizontalPadding = config_groupBarWidth * parseInt(groupHorizontalPadding.replace(r, "")) / 100;
			/* 价格条目渲染宽度 */
			var groupItemWidth = Math.floor(config_groupBarWidth - 2 * groupHorizontalPadding);
			if(groupItemWidth <= 0)
				groupItemWidth = config_groupBarWidth;
			/* 根据宽度重新计算内边距 */
			groupHorizontalPadding = halfGroupBarWidth - Math.floor(groupItemWidth / 2);

			/* 横坐标位置 */
			var xLeft_axisX = kChart._calcAxisXLeftPosition(),
				xRight_axisX = kChart._calcAxisXRightPosition(kChartSketch.getCanvasWidth()),
				xLeft_axisX_content = kChart._calcAxisXContentLeftPosition(),
				xRight_axisX_content = kChart._calcAxisXContentRightPosition(kChartSketch.getCanvasWidth()),
				xLeftEdge_axisX_content = Math.max(xLeft_axisX_content - halfGroupBarWidth, 0),
				xRightEdge_axisX_content = xRight_axisX_content + halfGroupBarWidth,

				yTop_axisY = config_paddingTop - config_axisYTickOffset,
				yBottom_axisY = yTop_axisY + kSubChartSketch.getAxisYHeight(),
				y_axisX = yBottom_axisY;

			/**
			 * 获取指定价格对应的物理高度
			 * @param {Number} price1 价格1
			 * @param {Number} [price2] 价格2
			 * @returns {Number} 物理高度
			 */
			var calcHeight = function(price1, price2){
				if(arguments.length < 2)
					price2 = dataSketch.getAmountFloor();

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

			/* 绘制烤串图 */
			(function(){
				ctx.save();

				var linePosition = Math.floor((config_groupBarWidth - config_groupLineWidth) / 2);
				var rightMostRenderingDataIndexFromRight = dataManager.getRightMostRenderingDataIndexFromRight();

				/**
				 * 绘制给定索引对应的数据的烤串
				 * @param {Number} i 数据索引（从右向左）
				 */
				var renderKebab = function(i){
					var dp = xPositionAndDataListList[i];
					var dataOverallIndexFromRightToLeft = rightMostRenderingDataIndexFromRight + i;

					var data = dataManager.getConvertedData(dp.dataIndex);
					if(null == data)
						return;

					var x = dp.x - halfGroupBarWidth;

					if(i === 0){
						TradeChart2.showLog && console.info("First kebab left position: " + x + " on sub chart: " + self.id);
					}

					var lineX = x + linePosition;
					var barX = x + groupHorizontalPadding;

					/* 绘制背景色 */
					var bg = config_groupBackground;
					if(typeof bg === "function")
						bg = bg(data, dataOverallIndexFromRightToLeft);
					if(null != bg){
						ctx.save();
						ctx.strokeWidth = 0;
						if(bg instanceof TradeChart2.LinearGradient){
							bg.apply(ctx, 0, yTop_axisY, 0, y_axisX);
						}else
							ctx.fillStyle = bg;
						ctx.fillRect(x, config_paddingTop, config_groupBarWidth, kSubChartSketch.getAxisYHeight());
						ctx.restore();
					}

					/* 绘制数据条目 */
					ctx.save();
					ctx.strokeWidth = 0;
					if(!util.isEmptyString(config_groupItemColor))
						ctx.fillStyle = config_groupItemColor;
					if(Array.isArray(data.priceList)){
						for(var i = 0; i < data.priceList.length; i++){
							var price = util.parseAsNumber(data.priceList[i], 0);
							var barY = yBottom_axisY - calcHeight(price) - halfGroupItemHeight;

							ctx.fillRect(Math.floor(barX), Math.round(barY), groupItemWidth, Math.round(config_groupItemHeight));
						}
					}
					ctx.restore();
				};

				/* 裁剪掉蜡烛中越界的部分 - 步骤一：备份可能被覆盖区域的原始像素值 */
				var leftX = 0,
					rightX = xRightEdge_axisX_content + 1;
				var imgDataHeight = kSubChartSketch.getAxisYHeight(),
					imgDataTop = config_paddingTop,
					leftImgDataLeft = leftX,
					leftImgDataWidth = Math.floor(xLeftEdge_axisX_content - leftX),
					rightImgDataLeft = rightX,
					rightImgDataWidth = Math.floor(config_width - rightX);

				var leftOldImgData = null,
					rightOldImgData = null;
				if(leftImgDataWidth > 0 && imgDataHeight > 0)
					leftOldImgData = util.getCanvasImageData(
						ctx,
						leftImgDataLeft,
						imgDataTop,
						leftImgDataWidth,
						imgDataHeight
					);
				if(rightImgDataWidth > 0 && imgDataHeight > 0)
					rightOldImgData = util.getCanvasImageData(
						ctx,
						rightImgDataLeft,
						imgDataTop,
						rightImgDataWidth,
						imgDataHeight
					);

				for(var i = 0; i < xPositionAndDataListList.length; i++)
					renderKebab(i);

				/* 裁剪掉蜡烛中越界的部分 - 步骤二：将备份的像素值重新覆盖到绘制的蜡烛上 */
				if(null != leftOldImgData)
					util.putCanvasImageData(ctx, leftOldImgData, leftImgDataLeft, imgDataTop);
				if(null != rightOldImgData)
					util.putCanvasImageData(ctx, rightOldImgData, rightImgDataLeft, imgDataTop);

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