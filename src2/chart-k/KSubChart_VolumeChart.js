;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChart = TradeChart2.KChart,
		KChartSketch = TradeChart2.KChartSketch,

		SubChartTypes = TradeChart2.SubChartTypes,
		KSubChartSketch = TradeChart2.KSubChartSketch,
		KSubChartRenderResult = TradeChart2.KSubChartRenderResult,

		KSubChartSketch_VolumeDataSketch = TradeChart2.KSubChartSketch_VolumeDataSketch,
		KSubChartSketch_VolumeChartSketch = TradeChart2.KSubChartSketch_VolumeChartSketch;

	/**
	 * 默认的，适用于K线图“量图”子图的配置项
	 */
	var defaultConfig = {
		appreciatedColor: "#d58c2a",/** 收盘价大于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
		depreciatedColor: "#21CB21",/** 收盘价小于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
		keepingColor: "#DEDEDE",/** 收盘价等于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
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
			config_paddingBottom = config.getConfigItemValue("paddingBottom");

		var canvasHeight = util.isValidNumber(height)? height: config_height;
		var axisYHeight = canvasHeight - config_paddingTop - config_paddingBottom;
		chartSketch.setCanvasHeight(canvasHeight)
			.setAxisYHeight(Math.max(axisYHeight, 0))
			.setContentHeight(chartSketch.getAxisYHeight());

		return chartSketch;
	};

	/**
	 * K线图子图：量图
	 */
	KChart.implSubChart(SubChartTypes.K_VOLUME, {
		defaultConfig: defaultConfig,

		dataSketchMethod: function(originalDataList){
			var dataList = this.getKChart().getDataManager().getConvertedData(originalDataList);
			var dataSketch_origin_max = -Infinity,/* 最大价格 */
				dataSketch_origin_min = Infinity,/* 最小价格 */
				dataSketch_origin_avgVariation = 0,/* 价格的平均变动幅度 */
				dataSketch_origin_maxVariation = 0,/* 价格的最大变动幅度 */

				dataSketch_extended_amountPrecision = 0;/* 坐标中价格的精度 */

			var previousVolume = 0;
			var variationSum = 0, volumeVariationSum = 0;
			for(var i = 0; i < dataList.length; i++){
				var d = dataList[i];
				if(null == d || typeof d !== "object")
					continue;

				var volume = util.parseAsNumber(d.volume, 0);

				/* 数据精度确定 */
				dataSketch_extended_amountPrecision = Math.max(
					dataSketch_extended_amountPrecision,
					util.getPrecision(volume)
				);

				if(volume > dataSketch_origin_max)
					dataSketch_origin_max = volume;
				if(volume < dataSketch_origin_min)
					dataSketch_origin_min = volume;

				/* 确定更大的变动幅度 */
				var volumeVariation = Math.abs(volume - previousVolume);
				if(volumeVariation > dataSketch_origin_maxVariation)
					dataSketch_origin_maxVariation = volumeVariation;

				volumeVariationSum += volumeVariation;
			}
			var len = dataList.length;
			dataSketch_origin_avgVariation = len > 0? volumeVariationSum / len: 0;

			return {
				origin_min: dataSketch_origin_min,
				origin_max: dataSketch_origin_max,
				origin_avgVariation: dataSketch_origin_avgVariation,
				origin_maxVariation: dataSketch_origin_maxVariation,
				extended_pricePrecision: dataSketch_extended_amountPrecision
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

				config_keepingColor = this.getConfigItemValue("keepingColor"),
				config_appreciatedColor = this.getConfigItemValue("appreciatedColor"),
				config_depreciatedColor = this.getConfigItemValue("depreciatedColor"),

				config_groupBarWidth = this.getConfigItemValue("groupBarWidth");

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
				y_axisX = Math.floor(config_paddingTop + kSubChartSketch.getAxisYHeight()),

				yBottom_axisY = config_paddingTop + kSubChartSketch.getAxisYHeight();

			/**
			 * 获取指定成交量对应的物理高度
			 * @param {Number} volume1 成交量1
			 * @param {Number} [volume2=dataSketch.getAmountFloor()] 成交量2
			 * @returns {Number} 物理高度
			 */
			var calcHeight = function(volume1, volume2){
				if(arguments.length < 2)
					volume2 = dataSketch.getAmountFloor();

				return kSubChartSketch.calculateHeight(Math.abs(volume2 - volume1));
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
				finishRemainingAxisYRendering = self._renderAxisY(ctx, kChartSketch, kSubChartSketch, dataSketch);

				/* 绘制X轴、X轴刻度、网格竖线 */
				finishRemainingAxisXRendering = self._renderAxisX(ctx, kChartSketch, kSubChartSketch);

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
					var dp = xPositionAndDataIndexList[i];

					var dataIndex = groupCount - 1 - i;
					var data = dataManager.getConvertedData(dp.dataIndex);
					if(null == data)
						return;

					var x = dp.x - halfGroupBarWidth;

					if(i === 0){
						TradeChart2.showLog && console.info("First volume left position: " + x + " on sub chart: " + self.id + ".");
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
					ctx.fillRect(barX, barY, config_groupBarWidth, volumeHeight);
				};

				/* 裁剪掉蜡烛中越界的部分 - 步骤一：备份可能被覆盖区域的原始像素值 */
				var leftX = 0,
					rightX = xRightEdge_axisX_content + 1;
				var imgDataHeight = kSubChartSketch.getContentHeight() + 5,
					imgDataTop = config_paddingTop,
					leftImgDataLeft = leftX,
					rightImgDataLeft = rightX;

				var leftOldImgData = null,
					rightOldImgData = null;
				try{
					leftOldImgData = ctx.getImageData(
						leftImgDataLeft,
						imgDataTop,
						xLeftEdge_axisX_content - leftX,
						imgDataHeight
					);
					rightOldImgData = ctx.getImageData(
						rightImgDataLeft,
						imgDataTop,
						config_width - rightX,
						imgDataHeight
					);
				}catch(e){
					console.error(e);
				}

				for(var i = 0; i < xPositionAndDataIndexList.length; i++)
					renderVolume(i);

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