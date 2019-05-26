;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChartSketch = TradeChart2.KChartSketch,

		SubChartTypes = TradeChart2.SubChartTypes,
		CommonDataManager = TradeChart2.CommonDataManager,
		KSubChartConfig_TrendConfig = TradeChart2.KSubChartConfig_TrendConfig,
		KSubChart = TradeChart2.KSubChart,
		KSubChart_TrendRenderResult = TradeChart2.KSubChart_TrendRenderResult,

		KSubChartSketch_TrendDataSketch = TradeChart2.KSubChartSketch_TrendDataSketch,
		KSubChartSketch_TrendChartSketch = TradeChart2.KSubChartSketch_TrendChartSketch;

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
	 * K线图子图：走势图
	 * @param {KChart} kChart 附加该子图的K线图
	 */
	var KSubChart_TrendChart = function(kChart){
		KSubChart.call(this, kChart, SubChartTypes.K_TREND);
		var self = this;

		/* 渲染配置 */
		var config = new KSubChartConfig_TrendConfig().setUpstreamConfigInstance(kChart.getConfig(), true);

		/**
		 * 获取配置项集合
		 * @override
		 * @returns {KSubChartConfig_TrendConfig}
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
		 * @returns {KSubChart_TrendRenderResult} K线子图绘制结果
		 */
		this.implRender = function(canvasObj, env){
			var config_width = util.calcRenderingWidth(canvasObj, this.getConfigItem("width")),
				config_height = util.calcRenderingHeight(canvasObj, this.getConfigItem("height")),

				config_paddingLeft = this.getConfigItem("paddingLeft"),
				config_paddingTop = this.getConfigItem("paddingTop"),

				config_axisYTickOffset = this.getConfigItem("axisYTickOffset"),

				config_lineWidth = this.getConfigItem("lineWidth"),
				config_lineColor = this.getConfigItem("lineColor"),
				config_enclosedAreaBackground = this.getConfigItem("enclosedAreaBackground"),

				config_ifShowAverageLine = this.getConfigItem("ifShowAverageLine"),
				config_ifShowAverageLine_lineColor = this.getConfigItem("ifShowAverageLine_lineColor");

			var ctx = util.initCanvas(canvasObj, config_width, config_height);
			var dataSketch = (this.getSpecifiedDataSketchMethod() || KSubChartSketch_TrendDataSketch.sketch)(kChart, this.getConfig());

			/* 转换配置项取值 */
			this.convertConfigItemValues(canvasObj, dataSketch);

			var kChartSketch = KChartSketch.sketchByConfig(kChart.getConfig(), config_width),
				kSubChartSketch = KSubChartSketch_TrendChartSketch.sketchByConfig(this.getConfig(), config_height).updateByDataSketch(dataSketch);

			var dataManager = kChart.getDataManager();
			var xPositionAndDataIndexList = self._getRenderingXPositionAndDataIndexListFromRight(kChartSketch);


			/* 绘制的数据个数 */
			var groupCount = xPositionAndDataIndexList.length;

			/* 横坐标位置 */
			var xLeft_axisX_content = kChart._calcAxisXContentLeftPosition(),
				xRight_axisX_content = kChart._calcAxisXContentRightPosition(kChartSketch.getCanvasWidth()),
				xLeftEdge_axisX_content = xLeft_axisX_content,
				xRightEdge_axisX_content = xRight_axisX_content,
				y_axisX = util.getLinePosition(config_paddingTop + kSubChartSketch.getAxisYHeight());

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

			/* 绘制走势图 */
			(function(){
				if(0 === groupCount)
					return;

				ctx.save();

				/* 确定折线点 */
				var dots = [],
					avgDots = [];
				for(var i = 0; i < xPositionAndDataIndexList.length; i++){
					var dp = xPositionAndDataIndexList[i];

					var dataIndex = dp.dataIndex;
					var data = dataManager.getData(dataIndex);
					if(null == data)
						continue;

					var x = util.getLinePosition(dp.x);

					var closePrice = +dataManager.getConvertedData(data).closePrice;
					var y = util.getLinePosition(config_paddingTop + Math.round(calcHeight(closePrice)));
					dots.push([x, y]);

					if(config_ifShowAverageLine){
						var averagePrice = CommonDataManager.getAttachedData(data, "averagePrice");
						var averageY = config_paddingTop + Math.round(calcHeight(averagePrice));
						avgDots.push([x, util.getLinePosition(averageY)]);
					}
				}

				if(dots.length === 1){/* 只有一个点 */
					ctx.beginPath();
					ctx.arc(dots[0][0], dots[0][1], ctx.lineWidth * 2, 0, 2*Math.PI);
					ctx.fillStyle = config_lineColor;
					ctx.fill();

					ctx.restore();
					return;
				}

				/* 裁剪掉蜡烛中越界的部分 - 步骤一：备份可能被覆盖区域的原始像素值 */
				var leftX = 0,
					rightX = xRightEdge_axisX_content + 1;

				// /* 调测裁剪位置及裁剪尺寸 */
				// ctx.strokeStyle = "red";
				// ctx.save();
				// ctx.fillStyle = "red";
				// ctx.fillRect(leftX, config_paddingTop, xLeftEdge_axisX_content, kSubChartSketch.getContentHeight());
				// ctx.fillRect(rightX, config_paddingTop, config_width - xRightEdge_axisX_content - 1, kSubChartSketch.getContentHeight());
				// ctx.stroke();
				// ctx.restore();

				/* getImageData() 以及 putImageData() 方法不受变化影响，因而需要放大处理 */
				var canvasOffsetWidth = ctx.canvas.offsetWidth, canvasOffsetHeight = ctx.canvas.offsetHeight;
				var hScale = canvasOffsetWidth === 0? 1: (ctx.canvas.width / ctx.canvas.offsetWidth),
					vScale = canvasOffsetHeight === 0? 1: (ctx.canvas.height / ctx.canvas.offsetHeight);
				var imgDataHeight = kSubChartSketch.getContentHeight() * vScale,
					imgDataTop = config_paddingTop * vScale,
					leftImgDataLeft = leftX * hScale,
					rightImgDataLeft = rightX * hScale;
				var leftOldImgData = ctx.getImageData(leftImgDataLeft, config_paddingTop * vScale, (xLeftEdge_axisX_content - leftX) * hScale, imgDataHeight),
					rightOldImgData = ctx.getImageData(rightImgDataLeft, config_paddingTop * vScale, (config_width - rightX) * hScale, imgDataHeight);

				// /* 调测裁剪位置及裁剪尺寸 */
				// console.log(rightOldImgData.width, rightOldImgData.height);
				// ctx.putImageData(rightOldImgData, 200, imgDataTop);
				// return;

				/* 绘制折线 */
				ctx.lineWidth = config_lineWidth || 0.5;
				ctx.strokeStyle = config_lineColor;
				ctx.beginPath();
				if(dots.length > 0)
					ctx.moveTo(dots[0][0], dots[0][1]);
				for(var i = 1; i < dots.length; i++)
					ctx.lineTo(dots[i][0], dots[i][1]);
				ctx.stroke();

				/* 绘制分时图背景 */
				var bg = config_enclosedAreaBackground;
				if(null != bg){
					if(dots.length > 0){
						dots.unshift([dots[0][0], y_axisX]);
						dots.push([dots[dots.length - 1][0], y_axisX]);
					}

					ctx.beginPath();
					if(dots.length > 0)
						ctx.moveTo(dots[0][0], dots[0][1]);
					for(i = 1; i < dots.length; i++)
						ctx.lineTo(dots[i][0], dots[i][1]);

					ctx.strokeWidth = 0;
					if(bg instanceof TradeChart2.LinearGradient){
						bg.apply(ctx, config_paddingLeft, config_paddingTop, config_paddingLeft, y_axisX);
					}else
						ctx.fillStyle = bg;
					ctx.fill();
				}

				/* 绘制均线 */
				if(config_ifShowAverageLine && avgDots.length > 1){
					ctx.strokeWidth = 0.5;
					ctx.strokeStyle = config_ifShowAverageLine_lineColor;

					ctx.beginPath();
					ctx.moveTo(avgDots[0][0], avgDots[0][1]);
					for(var i = 1; i < avgDots.length; i++)
						ctx.lineTo(avgDots[i][0], avgDots[i][1]);
					ctx.stroke();
				}

				/* 裁剪掉蜡烛中越界的部分 - 步骤二：将备份的像素值重新覆盖到绘制的蜡烛上 */
				ctx.putImageData(leftOldImgData, leftImgDataLeft, imgDataTop);
				ctx.putImageData(rightOldImgData, rightImgDataLeft, imgDataTop);

				ctx.restore();
			})();

			/* 绘制坐标系标签 */
			finishRemainingAxisXRendering();
			finishRemainingAxisYRendering();

			var renderResult = this._getLatestRenderResult(canvasObj);
			if(null == renderResult){
				renderResult = new KSubChart_TrendRenderResult(this, canvasObj);
				this._setLatestRenderResult(canvasObj, renderResult);
			}
			renderResult.setKChartSketch(kChartSketch)
				.setKSubChartSketch(kSubChartSketch)
				.setDataSketch(dataSketch);
			return renderResult;
		};
	};
	KSubChart_TrendChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_TrendChart", KSubChart_TrendChart);
})();