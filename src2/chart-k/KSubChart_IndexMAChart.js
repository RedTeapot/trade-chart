;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var KChartSketch = TradeChart2.KChartSketch,
		CommonDataManager = TradeChart2.CommonDataManager,

		SubChartTypes = TradeChart2.SubChartTypes,
		KSubChartConfig_IndexMAConfig = TradeChart2.KSubChartConfig_IndexMAConfig,
		KSubChart = TradeChart2.KSubChart,
		KSubChart_IndexMARenderResult = TradeChart2.KSubChart_IndexMARenderResult,

		KSubChartSketch_IndexMADataSketch = TradeChart2.KSubChartSketch_IndexMADataSketch,
		KSubChartSketch_IndexMAChartSketch = TradeChart2.KSubChartSketch_IndexMAChartSketch;

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
	 * K线图子图：指标：MA图
	 * @param {KChart} kChart 附加该子图的K线图
	 */
	var KSubChart_IndexMAChart = function(kChart){
		KSubChart.call(this, kChart, SubChartTypes.K_INDEX_MA);
		var self = this;

		/* 渲染配置 */
		var config = new KSubChartConfig_IndexMAConfig().setUpstreamConfigInstance(kChart.getConfig(), true);

		/**
		 * 获取配置项集合
		 * @override
		 * @returns {KSubChartConfig_IndexMAConfig}
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
		 * @returns {KSubChart_IndexMARenderResult} K线子图绘制结果
		 */
		this.implRender = function(canvasObj, env){
			var self = this;

			var config_width = util.calcRenderingWidth(canvasObj, this.getConfigItem("width")),
				config_height = util.calcRenderingHeight(canvasObj, this.getConfigItem("height")),
				config_paddingTop = this.getConfigItem("paddingTop"),
				config_axisYTickOffset = this.getConfigItem("axisYTickOffset");

			kChart.getConfig().setConfigItemConvertedValue("width", config_width);
			config.setConfigItemConvertedValue("height", config_height);

			var ctx = util.initCanvas(canvasObj, config_width, config_height);

			var dataSketch = (this.getSpecifiedDataSketchMethod() || KSubChartSketch_IndexMADataSketch.sketch)(kChart, this.getConfig()),
				kChartSketch = KChartSketch.sketchByConfig(kChart.getConfig(), config_width),
				kSubChartSketch = KSubChartSketch_IndexMAChartSketch.sketchByConfig(this.getConfig(), config_height).updateByDataSketch(dataSketch);

			var xPositionList = self._getRenderingXPositionListFromRight(kChartSketch);
			var kDataManager = kChart.getDataManager();
			var dataList = kDataManager.getRenderingDataList(xPositionList.length);

			/* 绘制的数据个数 */
			var groupCount = dataList.length;
			/* 蜡烛一半的宽度 */
			var halfGroupBarWidth = kChart._calcHalfGroupBarWidth();

			/* 横坐标位置 */
			var xLeft_axisX = kChart._calcAxisXLeftPosition(),
				xRight_axisX = kChart._calcAxisXRightPosition(kChartSketch.getCanvasWidth()),
				xLeft_axisX_content = kChart._calcAxisXContentLeftPosition(),
				xRight_axisX_content = kChart._calcAxisXContentRightPosition(kChartSketch.getCanvasWidth()),
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
			var maArray = self.getConfigItem("maIndexList") || [];
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
				var _dataList = kDataManager.getDataList();
				for(var i = 0; i < _dataList.length; i++){
					var d = _dataList[i];
					if(null == d || typeof d !== "object")
						continue;

					var k = "closePrice";
					var closePrice = CommonDataManager.getAttachedData(d, k);
					if(null != closePrice)
						continue;

					closePrice = +kDataManager.getConvertedData(d).closePrice;
					CommonDataManager.setAttachedData(d, k, closePrice);
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
							CommonDataManager.setAttachedData(d, maKey, sum / ma);
						}
					}
				}
			})();

			/* 绘制MA图 */
			xPositionList.reverse();
			(function(){
				var maIndexColorMap = self.getConfigItem("maIndexColorMap") || {};

				ctx.save();
				ctx.lineWidth = 0.5;

				/* 裁剪掉蜡烛中越界的部分 - 步骤一：备份可能被覆盖区域的原始像素值 */
				var leftX = 0,
					leftY = 0,

					rightX = xRightEdge_axisX_content + 1,
					rightY = 0;
				var leftOldImgData = ctx.getImageData(leftX, leftY, xLeftEdge_axisX_content, kSubChartSketch.getContentHeight()),
					rightOldImgData = ctx.getImageData(rightX, rightY, config_width - xRightEdge_axisX_content - 1, kSubChartSketch.getContentHeight());

				for(var k = 0; k < maArray.length; k++){
					var ma = maArray[k];
					var maKey = "MA" + ma;

					ctx.strokeStyle = maIndexColorMap[maKey];

					var isFirstDot = true;
					for(var i = 0; i < dataList.length; i++){
						var maAmount = CommonDataManager.getAttachedData(dataList[i], maKey);
						if(null == maAmount)
							continue;

						var x = util.getLinePosition(xPositionList[i]),
							y = util.getLinePosition($yTop_axisY + calcHeight(maAmount));
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
				ctx.putImageData(leftOldImgData, leftX, leftY);
				ctx.putImageData(rightOldImgData, rightX, rightY);

				ctx.restore();
			})();

			/* 绘制坐标系标签 */
			finishRemainingAxisXRendering();
			finishRemainingAxisYRendering();

			var renderResult = this._getLatestRenderResult(canvasObj);
			if(null == renderResult){
				renderResult = new KSubChart_IndexMARenderResult(this, canvasObj);
				this._setLatestRenderResult(canvasObj, renderResult);
			}
			renderResult.setKChartSketch(kChartSketch)
				.setKSubChartSketch(kSubChartSketch)
				.setDataSketch(dataSketch);
			return renderResult;
		};
	};
	KSubChart_IndexMAChart.prototype = Object.create(KSubChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChart_IndexMAChart", KSubChart_IndexMAChart);
})();