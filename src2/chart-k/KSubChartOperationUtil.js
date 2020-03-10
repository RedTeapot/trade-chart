;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util,
		Big = TradeChart2.Big,
		SubChartTypes = TradeChart2.SubChartTypes;

	/**
	 * @typedef {Object} HighlightingMetadata 高亮动作的元数据描述
	 * @property {Event} event 关联的事件
	 * @property {Number} dataIndex 高亮的数据在数据列表中的索引位置
	 * @property {Object} convertedData 高亮的格式转换之后的数据
	 * @property {*} originalData 高亮的格式转换之前的数据
	 */

	/**
	 * @callback ActionToHighlightViewingData 高亮/标识查阅的数据的方法
	 * @param {Object} convertedData 被转换之后的数据
	 * @param {HighlightingMetadata} dataMetadata 数据查阅动作的元数据描述
	 */

	/**
	 * @callback ActionToRevertViewingDataHighlighting 撤销查阅数据的高亮/标识效果时需要执行的方法
	 * @param {HighlightingMetadata} lastDataMetadata 最后一次高亮动作的元数据描述
	 */



	/**
	 * 创建新的、适用于“蜡烛图”的，绑定了给定操作画布的、用于高亮数据果的方法
	 * @param {HTMLCanvasElement} operationCanvasObj 悬浮于渲染画布之上提供操作支持的画布
	 * @param {KSubChartRenderResult} kSubChartRenderResult 图形渲染结果
	 * @param {Object} [ops] 控制选项
	 * @param {Boolean} [ops.lineWidth=0.5] 线条宽度
	 * @param {Boolean} [ops.lineColor=#4C9FE3] 线条颜色
	 * @param {Boolean} [ops.lineDash=[5,5]] 线条的虚线构造方法。如果需要用实线，则用 [1] 表示
	 * @param {Boolean} [ops.renderHorizontalLine=true] 是否在鼠标位置绘制横线
	 * @param {Boolean} [ops.verticalLineTop] 竖线的顶部位置
	 * @param {Boolean} [ops.verticalLineBottom] 竖线的底部位置
	 * @returns {Function}
	 */
	var newDataHighlightAction_4CandleChart = function(operationCanvasObj, kSubChartRenderResult, ops){
		ops = util.setDftValue(ops, {
			lineWidth: 0.5,
			lineColor: "#4C9FE3",
			lineDash: [5, 5],

			renderHorizontalLine: true,
			verticalLineTop: kSubChartRenderResult.getConfigItemValue("paddingTop"),
			verticalLineBottom: kSubChartRenderResult.getKSubChartSketch().getCanvasHeight() - kSubChartRenderResult.getConfigItemValue("paddingBottom")
		});

		return function(convertedData, dataMetadata){
			var detailCtx = operationCanvasObj.getContext("2d");

			var x = dataMetadata.renderingHorizontalPosition;
			if(-1 == x)
				return;

			detailCtx.save();

			detailCtx.lineWidth = ops.lineWidth || 0.5;
			detailCtx.strokeStyle = ops.lineColor || "#4C9FE3";
			detailCtx.setLineDash(ops.lineDash || [5, 5]);
			detailCtx.beginPath();

			var yTop = ops.verticalLineTop,
				yBottom = ops.verticalLineBottom;

			detailCtx.moveTo(x, util.getLinePosition(yTop));
			detailCtx.lineTo(x, util.getLinePosition(yBottom));

			if(ops.renderHorizontalLine){
				var xLeft = kSubChartRenderResult.getKChart()._calcAxisXLeftPosition(),
					xRight = kSubChartRenderResult.getKChart()._calcAxisXRightPosition(detailCtx.canvas.width),
					xY = util.getLinePosition(dataMetadata.event.layerY);

				if(xY > yTop && xY < yBottom){
					detailCtx.moveTo(xLeft, xY);
					detailCtx.lineTo(xRight, xY);
				}
			}

			detailCtx.stroke();
			detailCtx.restore();
		};
	};

	/**
	 * 创建新的、适用于“蜡烛图”的，绑定了给定操作画布的、用于撤销数据高亮效果的方法
	 * @param {HTMLCanvasElement} operationCanvasObj 悬浮于渲染画布之上提供操作支持的画布
	 * @param {KSubChartRenderResult} kSubChartRenderResult 图形渲染结果
	 * @param {Object} [ops] 控制选项
	 * @param {Boolean} [ops.renderHorizontalLine=true] 高亮数据时是否绘制了横线
	 * @returns {Function}
	 */
	var newRevertDataHighlightAction_4CandleChart = function(operationCanvasObj, kSubChartRenderResult, ops){
		ops = util.setDftValue(ops, {
			renderHorizontalLine: true
		});

		return function(lastMetadata){
			var detailCtx = operationCanvasObj.getContext("2d");

			var canvasWidth = detailCtx.canvas.width,
				canvasHeight = detailCtx.canvas.height;

			var len = 3;
			var left = 0, width = canvasWidth;
			if(null != lastMetadata){
				var x = lastMetadata.renderingHorizontalPosition;
				left = Math.max(0, x - len);
				width = 2 * len;
			}
			detailCtx.clearRect(left, 0, width, canvasHeight);

			if(ops.renderHorizontalLine){
				var top = 0, height = canvasHeight;
				if(null != lastMetadata){
					var y = lastMetadata.event.layerY;
					top = Math.max(0, y - len);
					height = 2 * len;
				}
				detailCtx.clearRect(0, top, canvasWidth, height);
			}
		};
	};

	/**
	 * 创建新的、适用于“走势图”的，绑定了给定操作画布的、用于高亮数据果的方法
	 * @param {HTMLCanvasElement} operationCanvasObj 悬浮于渲染画布之上提供操作支持的画布
	 * @param {KSubChartRenderResult} kSubChartRenderResult 图形渲染结果
	 * @param {Object} [ops] 控制选项
	 * @param {Boolean} [ops.lineWidth=0.5] 线条宽度
	 * @param {Boolean} [ops.lineColor=#4C9FE3] 线条颜色
	 * @param {Boolean} [ops.lineDash=[5,5]] 线条的虚线构造方法。如果需要用实线，则用 [1] 表示
	 * @param {Boolean} [ops.outerDotRadius=10] 外层圆的半径
	 * @param {Boolean} [ops.outerDotColor=#21E050] 外层圆的填充颜色
	 * @param {Boolean} [ops.outerDotAlpha=0.3] 外层圆的透明度
	 * @param {Boolean} [ops.innerDotRadius=5] 内层圆的半径
	 * @param {Boolean} [ops.innerDotColor=#21E050] 内层圆的填充颜色
	 * @param {Boolean} [ops.innerDotAlpha=1] 内层圆的透明度
	 * @param {Boolean} [ops.verticalLineTop] 竖线的顶部位置
	 * @param {Boolean} [ops.verticalLineBottom] 竖线的底部位置
	 * @returns {Function}
	 */
	var newDataHighlightAction_4TrendChart = function(operationCanvasObj, kSubChartRenderResult, ops){
		ops = util.setDftValue(ops, {
			lineWidth: 0.5,
			lineColor: "#4C9FE3",
			lineDash: [5, 5],

			outerDotRadius: 10,
			outerDotColor: "#21E050",
			outerDotAlpha: 0.3,

			innerDotRadius: 5,
			innerDotColor: "#21E050",
			innerDotAlpha: 1,

			verticalLineTop: kSubChartRenderResult.getConfigItemValue("paddingTop"),
			verticalLineBottom: kSubChartRenderResult.getKSubChartSketch().getCanvasHeight() - kSubChartRenderResult.getConfigItemValue("paddingBottom")
		});

		return function(convertedData, dataMetadata){
			var x = dataMetadata.renderingHorizontalPosition;
			if(-1 === x)
				return;

			var y = kSubChartRenderResult._calcYPosition(dataMetadata.convertedData.closePrice);

			var trendCanvasCtx = operationCanvasObj.getContext("2d");
			trendCanvasCtx.save();

			trendCanvasCtx.lineWidth = ops.lineWidth || 0.5;
			trendCanvasCtx.strokeStyle = ops.lineColor || "#4C9FE3";
			trendCanvasCtx.setLineDash(ops.lineDash || [5, 5]);

			/* 横线 */
			var left = kSubChartRenderResult.getKChart()._calcAxisXLeftPosition(),
				right = kSubChartRenderResult.getKChart()._calcAxisXRightPosition(trendCanvasCtx.canvas.width);
			var dataSketch = kSubChartRenderResult.getDataSketch();
			trendCanvasCtx.beginPath();
			trendCanvasCtx.moveTo(left, y);
			trendCanvasCtx.lineTo(right, y);
			trendCanvasCtx.stroke();

			/* 竖线 */
			var yTop = ops.verticalLineTop,
				yBottom = ops.verticalLineBottom;

			trendCanvasCtx.beginPath();
			trendCanvasCtx.moveTo(x, util.getLinePosition(yTop));
			trendCanvasCtx.lineTo(x, util.getLinePosition(yBottom));
			trendCanvasCtx.stroke();

			/* 大圆点 */
			var dotRadius = ops.outerDotRadius || 10;
			trendCanvasCtx.fillStyle = ops.outerDotColor || "#21E050";
			trendCanvasCtx.globalAlpha = ops.outerDotAlpha || 0.3;
			trendCanvasCtx.beginPath();
			trendCanvasCtx.moveTo(x, y);
			trendCanvasCtx.arc(x, y, dotRadius, 2 * Math.PI, 0);
			trendCanvasCtx.closePath();
			trendCanvasCtx.fill();

			/* 小圆点 */
			dotRadius = ops.innerDotRadius || (dotRadius / 2);
			trendCanvasCtx.fillStyle = ops.innerDotColor || "#21E050";
			trendCanvasCtx.globalAlpha = ops.innerDotAlpha || 1;
			trendCanvasCtx.beginPath();
			trendCanvasCtx.moveTo(x, y);
			trendCanvasCtx.arc(x, y, dotRadius, 2 * Math.PI, 0);
			trendCanvasCtx.closePath();
			trendCanvasCtx.fill();

			trendCanvasCtx.restore();
		};
	};

	/**
	 * 创建新的、适用于“走势图”的，绑定了给定操作画布的、用于撤销数据高亮效果的方法
	 * @param {HTMLCanvasElement} operationCanvasObj 悬浮于渲染画布之上提供操作支持的画布
	 * @param {KSubChartRenderResult} kSubChartRenderResult 图形渲染结果
	 * @returns {Function}
	 */
	var newRevertDataHighlightAction_4TrendChart = function(operationCanvasObj, kSubChartRenderResult){
		return function(lastMetadata){
			var detailCtx = operationCanvasObj.getContext("2d");

			var canvasWidth = detailCtx.canvas.width,
				canvasHeight = detailCtx.canvas.height;

			var len = 25;
			var left = 0, width = canvasWidth;
			if(null != lastMetadata){
				var x = lastMetadata.renderingHorizontalPosition;
				left = Math.max(0, x - len);
				width = 2 * len;
			}
			detailCtx.clearRect(left, 0, width, canvasHeight);

			var top = 0, height = canvasHeight;
			if(null != lastMetadata){
				var y = kSubChartRenderResult._calcYPosition(lastMetadata.convertedData.closePrice);
				top = Math.max(0, y - len);
				height = 2 * len;
			}
			detailCtx.clearRect(0, top, canvasWidth, height);
		};
	};

	var defaultLayerXRetrieveMethod = function(e){
		if(!e.changedTouches)
			return e.layerX;

		var x = e.changedTouches[0].clientX;
		var target = e.changedTouches[0].target;

		var left = 0;
		while(true){
			left += target.offsetLeft;
			target = target.offsetParent;
			if(null == target)
				break;
		}

		return x - left;
	};

	/**
	 * 为K线图子图添加图形交互支持
	 * @param {HTMLCanvasElement} operationCanvasObj 悬浮于绘制正文的画布之上的操作画布
	 * @param {KSubChartRenderResult} kSubChartRenderResult 图形绘制结果
	 * @param {Object} [ops] 控制选项
	 * @param {Function} [ops.layerXRetrieveMethod] 根据点击位置确定要查阅的数据时，“点击位置相对于画布左上角的横坐标”的获取方法
	 * @param {ActionToHighlightViewingData} [ops.dataHighlightAction] 数据的高亮方法
	 * @param {ActionToRevertViewingDataHighlighting} [ops.revertDataHighlightAction] 撤销数据高亮效果所需要执行的方法
	 */
	var addKSubChartOperationSupport = function(operationCanvasObj, kSubChartRenderResult, ops){
		ops = ops || {};
		kSubChartRenderResult.applyRenderingCanvasSettingTo(operationCanvasObj);

		var isModeViewDetail = true,
			lastX = 0,
			lastMetadata = null;

		var kChart = kSubChartRenderResult.getKChart(),
			canvasObj = kSubChartRenderResult.getCanvasDomElement(),
			detailCtx = operationCanvasObj.getContext("2d");

		var dataHighlightAction, revertDataHighlightAction;
		if(typeof ops.dataHighlightAction === "function")
			dataHighlightAction = ops.dataHighlightAction;
		else{
			switch(kSubChartRenderResult.getKSubChart().getType()){
			case SubChartTypes.K_TREND:
				dataHighlightAction = newDataHighlightAction_4TrendChart(operationCanvasObj, kSubChartRenderResult);
				break;

			case SubChartTypes.K_CANDLE:
			case SubChartTypes.K_VOLUME:
			case SubChartTypes.K_INDEX_MA:
			default:
				dataHighlightAction = newDataHighlightAction_4CandleChart(operationCanvasObj, kSubChartRenderResult);
				break;
			}
		}
		if(typeof ops.revertDataHighlightAction === "function")
			revertDataHighlightAction = ops.revertDataHighlightAction;
		else{
			switch(kSubChartRenderResult.getKSubChart().getType()){
			case SubChartTypes.K_TREND:
				revertDataHighlightAction = newRevertDataHighlightAction_4TrendChart(operationCanvasObj, kSubChartRenderResult);
				break;

			case SubChartTypes.K_CANDLE:
			case SubChartTypes.K_VOLUME:
			case SubChartTypes.K_INDEX_MA:
			default:
				revertDataHighlightAction = newRevertDataHighlightAction_4CandleChart(operationCanvasObj, kSubChartRenderResult);
				break;
			}
		}

		var layerXRetrieveMethod;
		if(typeof ops.layerXRetrieveMethod === "function")
			layerXRetrieveMethod = ops.layerXRetrieveMethod;
		else
			layerXRetrieveMethod = defaultLayerXRetrieveMethod;

		var viewDetail = function(e){
			var x = layerXRetrieveMethod(e);
			util.try2Call(revertDataHighlightAction, null, lastMetadata);

			var dataIndex = kSubChartRenderResult.getRenderingDataIndex(x);
			if(-1 === dataIndex)
				return;

			var convertedData = kSubChartRenderResult.getConvertedRenderingData(x),
				position = kSubChartRenderResult.getRenderingHorizontalPosition(dataIndex);

			var metadata = {
				event: e,
				dataIndex: dataIndex,
				renderingHorizontalPosition: -1 === dataIndex? 0: position,
				convertedData: convertedData,
				originalData: kSubChartRenderResult.getRenderingData(x)
			};

			util.try2Call(dataHighlightAction, operationCanvasObj, convertedData, metadata);
			lastMetadata = metadata;
		};

		var viewHistory = function(layerX){
			util.try2Call(revertDataHighlightAction);

			var offsetX = layerX - lastX;
			kChart.updateRenderingOffsetBy(offsetX, canvasObj.width);
			lastX = layerX;
		};

		operationCanvasObj.addEventListener("mousedown", function(e){
			isModeViewDetail = false;
			lastX = e.layerX;
		});
		operationCanvasObj.addEventListener("mousemove", function(e){
			if(!isModeViewDetail)
				viewHistory(e.layerX);
			else
				viewDetail(e);
		});
		operationCanvasObj.addEventListener("mouseout", function(e){
			util.try2Call(revertDataHighlightAction);
		});

		operationCanvasObj.addEventListener("touchstart", function(e){
			viewDetail(e);
		}, {passive: true});
		operationCanvasObj.addEventListener("touchmove", function(e){
			viewDetail(e);
		}, {passive: true});
		document.addEventListener("mouseup", function(evt){
			if(evt.target !== operationCanvasObj)
				return;

			isModeViewDetail = true;
			viewDetail(evt);
		});
		document.addEventListener("blur", function(evt){
			util.try2Call(revertDataHighlightAction);
		});
	};

	var KSubChartOperationUtil = {
		newRevertDataHighlightAction_4CandleChart: newRevertDataHighlightAction_4CandleChart,
		newDataHighlightAction_4CandleChart: newDataHighlightAction_4CandleChart,
		newRevertDataHighlightAction_4TrendChart: newRevertDataHighlightAction_4TrendChart,
		newDataHighlightAction_4TrendChart: newDataHighlightAction_4TrendChart,

		addKSubChartOperationSupport: addKSubChartOperationSupport
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartOperationUtil", KSubChartOperationUtil);
})();