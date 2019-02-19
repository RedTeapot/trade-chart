;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChartSketch = TradeChart2.KChartSketch,

		SubChartTypes = TradeChart2.SubChartTypes,
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
		KSubChart.call(this, kChart, SubChartTypes.K_VOLUME);
		var self = this;

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
		 * 转换配置项取值，完成“由 用户语义贴切的配置值 向 技术可行的配置值 的转换”
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {DataSketch} dataSketch 数据概览
		 *
		 * @returns {KSubChart_VolumeChart}
		 */
		this.convertConfigItemValues = function(canvasObj, dataSketch){
			var config_width = util.calcRenderingWidth(canvasObj, this.getConfigItem("width")),
				config_height = util.calcRenderingHeight(canvasObj, this.getConfigItem("height")),

				config_axisYPrecision = this.getConfigItem("axisYPrecision");

			kChart.getConfig().setConfigItemConvertedValue("width", config_width);
			config.setConfigItemConvertedValue("height", config_height);

			if("auto" === String(config_axisYPrecision).trim().toLowerCase())
				config.setConfigItemConvertedValue("axisYPrecision", dataSketch.getAmountPrecision());

			return this;
		};

		/**
		 * @override
		 *
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} env 当前环境信息
		 * @param {Number} env.drawingOrderIndex 当前子图在该画布上的绘制顺序索引。第一个被绘制：0
		 *
		 * @returns {KSubChart_VolumeRenderResult} 绘制的K线图
		 */
		this.implRender = function(canvasObj, env){
			var config_width = util.calcRenderingWidth(canvasObj, this.getConfigItem("width")),
				config_height = util.calcRenderingHeight(canvasObj, this.getConfigItem("height")),

				config_paddingTop = this.getConfigItem("paddingTop"),

				config_keepingColor = this.getConfigItem("keepingColor"),
				config_appreciatedColor = this.getConfigItem("appreciatedColor"),
				config_depreciatedColor = this.getConfigItem("depreciatedColor"),

				config_groupBarWidth = this.getConfigItem("groupBarWidth");

			var ctx = util.initCanvas(canvasObj, config_width, config_height);

			var dataSketch = (this.getSpecifiedDataSketchMethod() || KSubChartSketch_VolumeDataSketch.sketch)(kChart, this.getConfig()),
				kChartSketch = KChartSketch.sketchByConfig(kChart.getConfig(), config_width),
				kSubChartSketch = KSubChartSketch_VolumeChartSketch.sketchByConfig(this.getConfig(), config_height).updateByDataSketch(dataSketch);

			/* 转换配置项取值 */
			this.convertConfigItemValues(canvasObj, dataSketch);

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
				xLeftEdge_axisX_content = xLeft_axisX_content - halfGroupBarWidth,
				xRightEdge_axisX_content = xRight_axisX_content + halfGroupBarWidth,
				y_axisX = Math.floor(config_paddingTop + kSubChartSketch.getAxisYHeight());

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
					var x = dp.x - halfGroupBarWidth;

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
					ctx.fillRect(barX, barY, config_groupBarWidth, volumeHeight);
				};

				/* 裁剪掉蜡烛中越界的部分 - 步骤一：备份可能被覆盖区域的原始像素值 */
				var leftX = 0,
					rightX = xRightEdge_axisX_content + 1;
				var leftOldImgData = ctx.getImageData(leftX, config_paddingTop, xLeftEdge_axisX_content, kSubChartSketch.getContentHeight()),
					rightOldImgData = ctx.getImageData(rightX, config_paddingTop, config_width - xRightEdge_axisX_content - 1, kSubChartSketch.getContentHeight());

				for(var i = 0; i < xPositionAndDataIndexList.length; i++)
					renderVolume(i);

				/* 裁剪掉蜡烛中越界的部分 - 步骤二：将备份的像素值重新覆盖到绘制的蜡烛上 */
				ctx.putImageData(leftOldImgData, leftX, config_paddingTop);
				ctx.putImageData(rightOldImgData, rightX, config_paddingTop);

				ctx.restore();
			})();

			/* 绘制坐标系标签 */
			finishRemainingAxisXRendering();
			finishRemainingAxisYRendering();

			var renderResult = this._getLatestRenderResult(canvasObj);
			if(null == renderResult){
				renderResult = new KSubChart_VolumeRenderResult(this, canvasObj);
				this._setLatestRenderResult(canvasObj, renderResult);
			}
			renderResult.setKChartSketch(kChartSketch)
				.setKSubChartSketch(kSubChartSketch)
				.setDataSketch(dataSketch);
			return renderResult;
		};
	};
	KSubChart_VolumeChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_VolumeChart", KSubChart_VolumeChart);
})();