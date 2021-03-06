;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChart = TradeChart2.KChart,
		KChartSketch = TradeChart2.KChartSketch,
		CommonDataManager = TradeChart2.CommonDataManager,

		SubChartTypes = TradeChart2.SubChartTypes,
		KSubChartSketch = TradeChart2.KSubChartSketch,
		KSubChartRenderResult = TradeChart2.KSubChartRenderResult,

		KSubChartSketch_IndexMADataSketch = TradeChart2.KSubChartSketch_IndexMADataSketch;

	/**
	 * 默认的，适用于K线图“指标：MA图”子图的配置项
	 */
	var defaultConfig = {
		axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移，取值为正则向上偏移 */
		maIndexList: ["MA5", "MA10", "MA20", "MA30"],/* MA指标列表 */
		maIndexColorMap: {/* MA指标对应的线条颜色列表 */
			"MA5": "orange",
			"MA10": "blue",
			"MA20": "purple",
			"MA30": "black"
		}
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
	 * K线图子图：MA指标图
	 */
	KChart.implSubChart(SubChartTypes.K_INDEX_MA, {
		defaultConfig: defaultConfig,

		dataSketchMethod: function(originalDataList){
			var kDataManager = this.getKChart().getDataManager();

			var dataList = originalDataList;
			var dataSketch_origin_max = -Infinity,/* 最大价格 */
				dataSketch_origin_min = Infinity,/* 最小价格 */
				dataSketch_origin_avgVariation = 0,/* 价格的平均变动幅度 */
				dataSketch_origin_maxVariation = 0,/* 价格的最大变动幅度 */

				dataSketch_extended_pricePrecision = 0;/* 坐标中价格的精度 */

			/* 确定MA指标 */
			var maArray = this.getConfigItemValue("maIndexList");
			maArray = maArray.map(function(d){
				return util.parseAsNumber(d.replace(/[^\d]/gm, ""), 0);
			}).reduce(function(rst, d){
				if(isFinite(d) && d > 0 && rst.indexOf(d) === -1)
					rst.push(d);

				return rst;
			}, []).sort(function(a, b){
				return a > b? 1: -1;
			});

			/* 缓存需要被反复使用的收盘价，降低计算量 */
			for(var i = 0; i < dataList.length; i++){
				var d = dataList[i];
				if(null == d || typeof d !== "object")
					continue;

				var closePrice = +kDataManager.getConvertedData(d).closePrice;
				CommonDataManager.attachData(d, "closePrice", closePrice);
			}

			/* 附加MA数据，供绘制时使用 */
			if(maArray.length > 0){
				var minMA = maArray[0];

				for(var i = minMA - 1; i < dataList.length; i++){/* 为每个数据计算MA指标 */
					var d = dataList[i];

					for(var j = 0; j < maArray.length; j++){/* 计算每一个MA指标 */
						var ma = maArray[j];
						if(i < ma - 1)/* 检查数据跨度是否足够计算当前MA指标 */
							break;/* ma按指标升序排序，如果当前索引所涵盖的数据个数不足以满足当下MA指标，则必然无法满足需要更大数据覆盖面的指标 */

						var sum = 0;
						for(var k = 0; k < ma; k++){
							sum += CommonDataManager.getAttachedData(dataList[i - k], "closePrice") || 0;
						}
						CommonDataManager.attachData(d, "MA" + ma, sum / ma);
					}
				}
			}

			var previousClosePrice = null;
			var variationSum = 0;
			for(var i = 0; i < dataList.length; i++){
				var d = dataList[i];
				var closePrice = +kDataManager.getConvertedData(d).closePrice;

				/* 数据精度确定 */
				dataSketch_extended_pricePrecision = Math.max(
					dataSketch_extended_pricePrecision,
					util.getPrecision(closePrice)
				);

				if(closePrice > dataSketch_origin_max)
					dataSketch_origin_max = closePrice;
				if(closePrice < dataSketch_origin_min)
					dataSketch_origin_min = closePrice;

				/* 确定更大的变动幅度 */
				if(null !== previousClosePrice){
					var variation = Math.abs(closePrice - previousClosePrice);
					if(variation > dataSketch_origin_maxVariation)
						dataSketch_origin_maxVariation = variation;
					variationSum += variation;
				}

				previousClosePrice = closePrice;
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
				config_axisYTickOffset = this.getConfigItemValue("axisYTickOffset");

			var ctx = util.initCanvas(canvasObj, config_width, config_height);

			var kChartSketch = KChartSketch.sketchByConfig(kChart.getConfig(), config_width),
				kSubChartSketch = getChartSketchByConfig(this.getConfig(), config_height).updateByDataSketch(dataSketch);

			var dataManager = kChart.getDataManager();
			var xPositionAndDataIndexList = self._getRenderingXPositionAndDataIndexListFromRight(kChartSketch);

			/* 绘制的数据个数 */
			var groupCount = xPositionAndDataIndexList.length;
			/* 蜡烛一半的宽度 */
			var halfGroupBarWidth = kChart._calcHalfGroupBarWidth();

			/* 横坐标位置 */
			var xLeft_axisX = kChart._calcAxisXLeftPosition(),
				xRight_axisX = kChart._calcAxisXRightPosition(kChartSketch.getCanvasWidth()),
				xLeft_axisX_content = kChart._calcAxisXContentLeftPosition(),
				xRight_axisX_content = kChart._calcAxisXContentRightPosition(kChartSketch.getCanvasWidth()),
				xLeftEdge_axisX_content = Math.max(xLeft_axisX_content - halfGroupBarWidth, 0),
				xRightEdge_axisX_content = xRight_axisX_content + halfGroupBarWidth,

				yBottom_axisY = config_paddingTop + kSubChartSketch.getAxisYHeight();

			/**
			 * 获取指定价钱对应的物理高度
			 * @param {Number} price1 价钱1
			 * @param {Number} [price2] 价钱2
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

			/* 确定MA指标 */
			var maArray = self.getConfigItemValue("maIndexList") || [];
			maArray = maArray.map(function(d){
				return util.parseAsNumber(d.replace(/[^\d]/gm, ""), 0);
			}).reduce(function(rst, d){
				if(isFinite(d) && d > 0 && rst.indexOf(d) === -1)
					rst.push(d);

				return rst;
			}, []);

			/* 计算并附加MA数据 */
			(function(){
				/* 缓存需要被反复使用的收盘价，降低计算量 */
				var _dataList = dataManager.getDataList();
				for(var i = 0; i < _dataList.length; i++){
					var d = _dataList[i];
					if(null == d || typeof d !== "object")
						continue;

					var k = "closePrice";
					var closePrice = CommonDataManager.getAttachedData(d, k);
					if(null != closePrice)
						continue;

					closePrice = +dataManager.getConvertedData(d).closePrice;
					CommonDataManager.attachData(d, k, closePrice);
				}

				/* 附加MA数据，供绘制时使用 */
				if(maArray.length > 0){
					var minMA = maArray[0];

					for(var i = minMA - 1; i < _dataList.length; i++){/* 为每个数据计算MA指标 */
						var d = _dataList[i];

						for(var j = 0; j < maArray.length; j++){/* 计算每一个MA指标 */
							var ma = maArray[j];
							if(i < ma - 1)/* 检查数据跨度是否足够计算当前MA指标 */
								break;/* ma按指标升序排序，如果当前索引所涵盖的数据个数不足以满足当下MA指标，则必然无法满足需要更大数据覆盖面的指标 */

							var maKey = "MA" + ma;
							var maAmount = CommonDataManager.getAttachedData(d, maKey);
							if(null != maAmount)
								continue;

							var sum = 0;
							for(var k = 0; k < ma; k++){
								sum += CommonDataManager.getAttachedData(_dataList[i - k], "closePrice") || 0;
							}
							CommonDataManager.attachData(d, maKey, sum / ma);
						}
					}
				}
			})();

			/* 绘制MA图 */
			xPositionAndDataIndexList.reverse();
			(function(){
				var maIndexColorMap = self.getConfigItemValue("maIndexColorMap") || {};

				ctx.save();
				ctx.lineWidth = 0.5;

				/* 裁剪掉蜡烛中越界的部分 - 步骤一：备份可能被覆盖区域的原始像素值 */
				var leftX = 0,
					rightX = xRightEdge_axisX_content + 1;
				var imgDataHeight = kSubChartSketch.getContentHeight() + 5,
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
						0,
						leftImgDataWidth,
						imgDataHeight
					);
				if(rightImgDataWidth > 0 && imgDataHeight > 0)
					rightOldImgData = util.getCanvasImageData(
						ctx,
						rightImgDataLeft,
						0,
						rightImgDataWidth,
						imgDataHeight
					);

				for(var k = 0; k < maArray.length; k++){
					var ma = maArray[k];
					var maKey = "MA" + ma;

					ctx.strokeStyle = maIndexColorMap[maKey];

					var isFirstDot = true;
					for(var i = 0; i < groupCount; i++){
						var dp = xPositionAndDataIndexList[i];

						var maAmount = CommonDataManager.getAttachedData(dataManager.getData(dp.dataIndex), maKey);
						if(null == maAmount)
							continue;

						var x = util.getLinePosition(dp.x),
							y = util.getLinePosition(yBottom_axisY - calcHeight(maAmount));
						// TradeChart2.showLog && console.log(maKey, i, x, y);

						if(isFirstDot){
							ctx.beginPath();
							ctx.moveTo(x, y);
						}else
							ctx.lineTo(x, y);

						isFirstDot = false;
					}
					ctx.stroke();
				}

				/* 裁剪掉蜡烛中越界的部分 - 步骤二：将备份的像素值重新覆盖到绘制的蜡烛上 */
				if(null != leftOldImgData)
					util.putCanvasImageData(ctx, leftOldImgData, leftImgDataLeft, 0);
				if(null != rightOldImgData)
					util.putCanvasImageData(ctx, rightOldImgData, rightImgDataLeft, 0);

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