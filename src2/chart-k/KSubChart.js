;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util,
		KSubChartConfig = TradeChart2.KSubChartConfig,
		Big = TradeChart2.Big;

	var numBig = function(big){
		return Number(big.toString());
	};
	var roundBig = function(big){
		return Math.round(numBig(big));
	};
	var ceilBig = function(big){
		return Math.ceil(numBig(big));
	};

	var NOT_SUPPLIED = {};

	/**
	 * @callback DataSketchMethod
	 * @param {KChart} kChart K线图实例
	 * @param {KSubChartConfig} kSubChartConfig K线子图渲染配置
	 */

	/**
	 * @typdef {Object} CanvasAndRenderResultBinding 画布及其子图在其上的最后一次绘制结果
	 * @property {HTMLCanvasElement} canvas 画布
	 * @property {String} subChartType 绘制的子图的类型
	 * @property {KSubChartRenderResult} renderResult 最后一次绘制结果
	 */

	/**
	 * @constructor
	 * K线子图
	 * @param {KChart} kChart 附加该子图的K线图
	 * @param {KSubChartTypes} type 子图类型。如：volume - 量图；
	 */
	var KSubChart = function(kChart, type){
		var self = this;

		/**
		 * 最后一次执行绘制操作时绘制到的目标Canvas
		 * @type {HTMLCanvasElement}
		 */
		var lastRenderingCanvasObj = NOT_SUPPLIED;

		/* 渲染配置 */
		var config = new KSubChartConfig().setUpstreamConfigInstance(kChart.getConfig(), true);

		/**
		 * 另外指定的数据概览的生成方法。默认为null，亦即各个子图使用各个子图配套的概览生成方法。
		 * 当需要将多个子图绘制到同一个画布上时，需要统一画布纵坐标的刻度分布及取值，此时需要统一各个子图的数据概览的生成方法。
		 *
		 * @type {DataSketchMethod}
		 */
		var specifiedDataSketchMethod = null;

		/**
		 * 绘制结果列表
		 * 设定：
		 * 1. 一个画布对应一个最近的绘制结果
		 * 2. 一个子图可以在多个画布上绘制，分别对应多个相同数量的绘制结果
		 *
		 * @type {CanvasAndRenderResultBinding[]}
		 */
		var latestRenderResultList = [];


		util.defineReadonlyProperty(this, "id", util.randomString("k-" + type + "-", 5));

		/**
		 * 获取该子图的子图类型
		 * @returns {KSubChartTypes}
		 */
		this.getType = function(){
			return type;
		};

		/**
		 * 获取附加该子图的K线图
		 * @returns {KChart}
		 */
		this.getKChart = function(){
			return kChart;
		};

		/**
		 * 获取配置项集合
		 * @returns {KSubChartConfig}
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * 设置配置
		 * @param {Object} _config 配置项集合
		 * @returns {KSubChart}
		 */
		this.setConfig = function(_config){
			this.getConfig().setConfig(_config);
			return this;
		};

		/**
		 * 获取指定名称的配置项取值。如果配置项并没有声明，则返回对应的默认配置。如果配置项无法识别，则返回undefined
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getConfigItem = function(name){
			return this.getConfig().getConfigItemValue(name);
		};

		/**
		 * 获取另外指定的数据概览的生成方法
		 * @returns {DataSketchMethod}
		 */
		this.getSpecifiedDataSketchMethod = function(){
			return specifiedDataSketchMethod;
		};

		/**
		 * 设置数据概览的生成方法
		 * @param {DataSketchMethod} method
		 */
		this.setSpecifiedDataSketchMethod = function(method){
			if(typeof method !== "function"){
				console.warn("Data sketch method should be of type: 'Function'.");
				return this;
			}

			specifiedDataSketchMethod = method;
			return this;
		};

		/**
		 * 获取给定画布上的最后一次绘制结果
		 * @param {HTMLCanvasElement} [canvasObj] 画布。如果没有提供该参数，则使用 lastRenderingCanvasObj
		 * @returns {KSubChartRenderResult|null}
		 */
		this.getLatestRenderResult = function(canvasObj){
			if(arguments.length < 1 && NOT_SUPPLIED != lastRenderingCanvasObj)
				canvasObj = lastRenderingCanvasObj;

			for(var i = 0; i < latestRenderResultList.length; i++)
				if(latestRenderResultList[i].canvas == canvasObj && latestRenderResultList[i].subChartType === type){
					return latestRenderResultList[i].renderResult;
				}

			return null;
		};

		/**
		 * 设置/添加特定画布及其最后一次绘制结果的对应关系
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {KSubChartRenderResult} renderResult 在该画布上的最后一次绘制结果
		 * @returns {KSubChart}
		 */
		this.setLatestRenderResult = function(canvasObj, renderResult){
			for(var i = 0; i < latestRenderResultList.length; i++)
				if(latestRenderResultList[i].canvas == canvasObj && latestRenderResultList[i].subChartType === type){
					latestRenderResultList[i].renderResult = renderResult;
					return this;
				}

			latestRenderResultList.push({
				canvas: canvasObj,
				subChartType: type,
				renderResult: renderResult
			});

			return this;
		};

		/**
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @returns {KSubChartRenderResult} 绘制的K线子图
		 */
		this.render = function(canvasObj){
			if(!(canvasObj instanceof HTMLCanvasElement)){
				if(NOT_SUPPLIED !== lastRenderingCanvasObj){
					canvasObj = lastRenderingCanvasObj;
				}else{
					throw new Error("No canvas element supplied to render");
				}
			}else
				lastRenderingCanvasObj = canvasObj;

			/* 记录画布上画质的图形类型，实现“第一个图形绘画时清空画布既有内容，后续图形绘画时，叠加绘制” */
			canvasObj.renderingKSubChartTypes = canvasObj.renderingKSubChartTypes || [];
			var subTypes = canvasObj.renderingKSubChartTypes;
			subTypes.push(this.getType());

			return self.implRender.call(self, canvasObj, {
				/* 当前子图在该画布上的绘制顺序索引。第一个被绘制：0 */
				drawingOrderIndex: subTypes.indexOf(this.getType())
			});
		};

		/**
		 * 在指定的容器中渲染图形，自动创建画布
		 * @param {Element} containerObj 画布容器
		 */
		this.renderIn = function(containerObj){
			var typeAttrName = "data-type",
				subTypeAttrName = "data-sub-type";

			var chartObj = containerObj.querySelector(".trade-chart[" + typeAttrName + "=k][" + subTypeAttrName + "=" + type + "]");
			var canvasObj = null;
			if(null == chartObj){
				chartObj = document.createElement("div");
				chartObj.className = "trade-chart";
				chartObj.setAttribute(typeAttrName, "k");
				chartObj.setAttribute(subTypeAttrName, type);

				canvasObj = document.createElement("canvas");
				var detailCanvasObj = document.createElement("canvas");
				detailCanvasObj.className = "detail";

				chartObj.appendChild(canvasObj);
				chartObj.appendChild(detailCanvasObj);
				containerObj.appendChild(chartObj);

				var config_width = util.calcRenderingWidth(canvasObj, this.getConfigItem("width")),
					config_height = util.calcRenderingHeight(canvasObj, this.getConfigItem("height"));

				util.initCanvas(canvasObj, config_width, config_height);
				util.initCanvas(detailCanvasObj, config_width, config_height);
			}else{
				canvasObj.querySelector("canvas:not(.detail)");
			}


			return this.render(canvasObj);
		};

		/**
		 * 由子类实现的图形渲染方法
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} env 当前环境信息
		 * @param {Number} env.drawingOrderIndex 当前子图在该画布上的绘制顺序索引。第一个被绘制：0
		 * @returns {KSubChartRenderResult} 绘制的K线子图
		 */
		this.implRender = function(canvasObj, env){
			console.warn("Not implemented for k sub chart: " + this.getType());
			return null;
		};



		/**
		 * 获取图形正文的横向绘制偏移（用于满足场景：'数据量不足以展现满屏时，需要保证图形显示在左侧，而非右侧'）
		 * @param {KChartSketch} kChartSketch 图形概览
		 * @returns {Number} 取值为正，代表图形正文向左偏移
		 */
		this.getChartContentHorizontalRenderingOffset = function(kChartSketch){
			var config_groupBarWidth = self.getConfigItem("groupBarWidth"),
				config_groupGap = self.getConfigItem("groupGap");

			var maxGroupCount = kChartSketch.getMaxGroupCount(),
				halfGroupBarSize = kChart.calcHalfGroupBarWidth(),
				groupSize = config_groupBarWidth + config_groupGap,
				groupCount = kChart.getKDataManager().getRenderingDataCount(maxGroupCount);

			/**
			 * 数据量不足以展现满屏时，需要保证图形显示在左侧，而非右侧
			 */
			var offset = 0;
			if(groupCount < maxGroupCount && groupCount !== 0){
				var length_gap = (groupCount - 1) * config_groupGap;
				var length_bar = (groupCount >= 2? (groupCount - 2) * config_groupBarWidth: 0) + 2 * (halfGroupBarSize + 1);
				offset = kChartSketch.getContentWidth() - (length_gap + length_bar);
			}else
				offset = 0;

			return offset;
		};

		/**
		 * 绘制图形区域背景
		 * @param {CanvasRenderingContext2D} ctx 画布绘图上下文
		 * @param {Number} width 图形区域的宽度
		 * @param {Number} height 图形区域的高度
		 */
		this.renderBackground = function(ctx, width, height){
			var config_bg = this.getConfigItem("coordinateBackground");
			if(util.isEmptyString(config_bg))
				return;

			var config_paddingLeft = Math.floor(this.getConfigItem("paddingLeft")),
				config_paddingTop = Math.floor(this.getConfigItem("paddingTop"));

			ctx.save();
			ctx.beginPath();
			ctx.rect(config_paddingLeft, config_paddingTop, width, height);

			if(config_bg instanceof TradeChart2.LinearGradient){
				config_bg.apply(ctx, config_paddingLeft, config_paddingTop, config_paddingLeft, config_paddingTop + height);
			}else
				ctx.fillStyle = config_bg;

			ctx.fill();
			ctx.restore();
		};

		/**
		 * 获取右侧开始的，可被渲染的数据的渲染位置列表。用于使用统一的方法决定横坐标位置，而非各个子图自行计算。
		 * 返回的位置，是渲染目的地的中心位置
		 * @param {KChartSketch} kChartSketch 图形概览
		 * @returns {Number[]}
		 */
		this.getRenderingXPositionListFromRight = function(kChartSketch){
			var config_groupBarWidth = this.getConfigItem("groupBarWidth"),
				config_groupGap = this.getConfigItem("groupGap");

			var xRight_axisX_content = kChart.calcAxisXContentRightPosition(kChartSketch.getCanvasWidth());

			var maxGroupCount = kChartSketch.getMaxGroupCount(),
				halfGroupBarSize = kChart.calcHalfGroupBarWidth(),
				groupSize = config_groupBarWidth + config_groupGap,
				groupCount = kChart.getKDataManager().getRenderingDataCount(maxGroupCount);

			/**
			 * 第一个位置是图形上在最右侧渲染的数据的位置
			 * @type {Number[]}
			 */
			var arr = [];

			var offset = this.getChartContentHorizontalRenderingOffset(kChartSketch);/* 数据量不足以展现满屏时，需要保证图形显示在左侧，而非右侧 */
			for(var i = 0; i < groupCount; i++)
				arr.push(Math.floor(xRight_axisX_content + kChart.getRenderingOffset() - groupSize * i - offset));

			return arr;
		};

		/**
		 * 获取从右侧开始的，可被渲染的横坐标刻度的位置列表。
		 * 返回的位置，是刻度的中心位置
		 * @param {KChartSketch} kChartSketch 图形概览
		 * @returns {XTick[]}
		 */
		this.getRenderingXTickListFromRight = function(kChartSketch){
			var config_groupBarWidth = this.getConfigItem("groupBarWidth"),
				config_groupGap = this.getConfigItem("groupGap"),
				config_showAxisXLabel = this.getConfigItem("showAxisXLabel"),
				config_axisXLabelGenerator = this.getConfigItem("axisXLabelGenerator");

			var xLeft_axisX_content = kChart.calcAxisXContentLeftPosition(),
				xRight_axisX_content = kChart.calcAxisXContentRightPosition(kChartSketch.getCanvasWidth());

			var kDataManager = kChart.getKDataManager();
			var dataList = kDataManager.getConvertedRenderingDataList(kChartSketch.getMaxGroupCount());

			/* 绘制的数据个数 */
			var groupCount = dataList.length;
			/* 一组数据的宽度 */
			var groupSize = config_groupBarWidth + config_groupGap;
			/* 是否绘制网格横线/竖线 */
			/* 一个横坐标刻度横跨的数据个数 */
			var axisXLabelTickSpan = kChart.calcAxisXLabelTickSpan();
			/* 图形的整体横向便宜，用于实现“数据量不足以展现满屏时，需要保证图形显示在左侧，而非右侧” */
			var offset = this.getChartContentHorizontalRenderingOffset(kChartSketch);

			/* 上一个绘制的横坐标刻度对应的数据索引 */
			var previousXTickDataIndex = null;

			/**
			 * 根据提供的数据的索引位置获取刻度绘制点
			 * @param {Number} i 从右向左方向的数据索引位置。索引为0的数据在最后
			 */
			var getXTick = function(i){
				if(i < 0 || i >= groupCount)
					return null;

				var dataOverallIndexFromRightToLeft = kDataManager.getElapsedVisibleDataCount() + i;
				var ifShowTick = dataOverallIndexFromRightToLeft % axisXLabelTickSpan === 0;
				if(!ifShowTick)
					return null;

				var tickX = Math.floor(xRight_axisX_content + kChart.getRenderingOffset() - groupSize * i);
				ifShowTick = tickX >= xLeft_axisX_content && tickX <= xRight_axisX_content;
				if(!ifShowTick)
					return null;

				var dataIndex = groupCount - 1 - i;
				var data = dataList[dataIndex];

				/* 汇集刻度，用于图形绘制完毕后统一绘制 */
				var label = (function(){
					if(!config_showAxisXLabel)
						return "";

					var previousData = null;
					if(null != previousXTickDataIndex)
						previousData = kDataManager.getConvertedData(previousXTickDataIndex);

					return config_axisXLabelGenerator(data, i, previousData, previousXTickDataIndex);
				})();
				previousXTickDataIndex = i;

				return {x: tickX - offset, label: label};
			};

			/* 绘制X轴刻度 */
			var axisXTickList = [];
			for(var i = 0; i < groupCount; i++){
				var t = getXTick(i);
				if(null != t)
					axisXTickList.push(t);
			}

			return axisXTickList;
		};

		/**
		 * 获取自下而上顺序的Y轴刻度列表
		 * @param {KSubChartSketch} kSubChartSketch 子图概览
		 * @param {KDataSketch} kDataSketch 数据概览
		 * @returns {YTick[]}
		 */
		this.getRenderingYTickListFromBottom = function(kSubChartSketch, kDataSketch){
			var config_paddingTop = this.getConfigItem("paddingTop"),
				config_axisYPrecision = this.getConfigItem("axisYPrecision"),
				config_axisYMidTickQuota = this.getConfigItem("axisYMidTickQuota"),
				config_horizontalGridLineColor = this.getConfigItem("horizontalGridLineColor"),
				config_axisYFormatter = this.getConfigItem("axisYFormatter");

			var y_axisX = util.getLinePosition(config_paddingTop + kSubChartSketch.getAxisYHeight());

			/** 相邻两个纵坐标刻度之间的价格悬差 */
			var axisYAmountInterval = (kDataSketch.getAmountCeiling() - kDataSketch.getAmountFloor()) / (config_axisYMidTickQuota + 1);
			/** 相邻两个纵坐标刻度之间的高度悬差 */
			var axisYHeightInterval = kSubChartSketch.calculateHeight(axisYAmountInterval);
			var isAxisYPrecisionAuto = "auto" === String(config_axisYPrecision).trim().toLowerCase();

			if(isAxisYPrecisionAuto)
				config.setConfigItemConvertedValue("axisYPrecision", kDataSketch.getAmountPrecision());

			/**
			 * 要绘制的纵坐标刻度集合
			 * @type {YTick[]}
			 */
			var axisYTickList = [];

			/**
			 * 汇集Y轴刻度（自下而上）
			 * 如果相同位置，或相同标签的刻度已经存在，则不再添加
			 */
			var maxAxisYTickIndex = config_axisYMidTickQuota + 1;
			for(var i = 0; i <= maxAxisYTickIndex; i++){
				var tickAmount = kDataSketch.getAmountFloor() + axisYAmountInterval * i,
					tickY = y_axisX - Math.round(axisYHeightInterval * i);
				var tickLabel = config_axisYFormatter(tickAmount, config);

				for(var j = 0; j < axisYTickList.length; j++){
					var tick = axisYTickList[j];
					if(tick.label === tickLabel || Math.abs(tick.y - tickY) < 1){
						console.warn("Found potential existing tick while adding tick: " + tickLabel + "(" + tickAmount + ") at " + tickY, JSON.stringify(tick));
						continue;
					}
				}

				axisYTickList.push({y: tickY, amount: tickAmount, label: tickLabel});
			}

			/* 检测汇集的Y轴刻度，规避多个刻度使用相同取值的情况 */
			var ifExistsDuplicateLabel = false;
			do{
				for(var i = 0; i < axisYTickList.length - 1; i++){
					for(var j = i + 1; j < axisYTickList.length; j++){
						if(axisYTickList[i].label === axisYTickList[j].label){
							ifExistsDuplicateLabel = true;
							break;
						}
					}

					if(ifExistsDuplicateLabel)
						break;
				}

				var precision = config.getConfigItemValue("axisYPrecision");
				if(ifExistsDuplicateLabel && precision < 20){/* 最多保留20位精度 */
					precision += 1;
					config.setConfigItemConvertedValue("axisYPrecision", precision);
					for(var i = 0; i < axisYTickList.length; i++)
						axisYTickList[i].label = config_axisYFormatter(axisYTickList[i].amount, config);
					ifExistsDuplicateLabel = false;/* 假定精度+1后不会出现相同取值的刻度，然后开始验证/检测 */
				}else
					break;
			}while(ifExistsDuplicateLabel);

			return axisYTickList;
		};

		/**
		 * 绘制X轴
		 * @param {CanvasRenderingContext2D} ctx 画布绘图上下文
		 * @param {KChartSketch} kChartSketch 图形概览
		 * @param {KSubChartSketch} kSubChartSketch  子图图形概览
		 * @returns {Function} 完成剩余的X轴绘制工作，子图在其图形正文绘制完成后调用
		 */
		this.renderAxisX = function(ctx, kChartSketch, kSubChartSketch){
			/**
			 * 完成剩余的X轴绘制工作。
			 * 为达到良好的视觉效果，图形绘制的先后顺序，应为：
			 * 1. X轴横线、X轴刻度线、X轴刻度线对应的纵向网格线
			 * 2. 图形正文（蜡烛图、量图等）
			 * 3. X轴刻度标签
			 *
			 * 本方法完成1，然后由子图完成2，然后由子图完成3。
			 * 为简化子图代码逻辑，本方法实现3的绘制逻辑，并将
			 * 绘制逻辑返回给子图，最后由子图调用实现绘制
			 */
			var finishRemainingAxisXRendering = function(){};

			var config_showAxisXLine = this.getConfigItem("showAxisXLine");
			if(!config_showAxisXLine)
				return finishRemainingAxisXRendering;

			var config_axisLineWidth = this.getConfigItem("axisLineWidth"),
				config_axisLineColor = this.getConfigItem("axisLineColor"),
				config_axisLabelFont = this.getConfigItem("axisLabelFont"),
				config_axisLabelColor = this.getConfigItem("axisLabelColor"),
				config_showVerticalGridLine = this.getConfigItem("showVerticalGridLine"),
				config_verticalGridLineColor = this.getConfigItem("verticalGridLineColor"),
				config_gridLineDash = this.getConfigItem("gridLineDash"),
				config_axisTickLineLength = this.getConfigItem("axisTickLineLength"),
				config_axisXLabelOffset = this.getConfigItem("axisXLabelOffset"),
				config_showAxisXLabel = this.getConfigItem("showAxisXLabel"),
				config_axisXLabelHorizontalAlign = this.getConfigItem("axisXLabelHorizontalAlign"),
				config_paddingTop = this.getConfigItem("paddingTop");

			var xLeft_axisX = kChart.calcAxisXLeftPosition(),
				xRight_axisX = kChart.calcAxisXRightPosition(kChartSketch.getCanvasWidth()),/* 闭区间，亦即此像素点仍然是坐标轴的一部分 */
				y_axisX = util.getLinePosition(config_paddingTop + kSubChartSketch.getAxisYHeight());


			ctx.save();
			ctx.lineWidth = config_axisLineWidth;
			ctx.strokeStyle = config_axisLineColor;

			/* 绘制X轴坐标线 */
			ctx.beginPath();
			ctx.moveTo(Math.floor(xLeft_axisX), y_axisX);
			ctx.lineTo(Math.floor(xRight_axisX + 1), y_axisX);
			ctx.stroke();

			/* 绘制X轴刻度线 */
			var axisXTickList = this.getRenderingXTickListFromRight(kChartSketch);
			for(var i = 0; i < axisXTickList.length; i++){
				var tickX = util.getLinePosition(axisXTickList[i].x);

				ctx.beginPath();
				ctx.moveTo(tickX, y_axisX + 1);
				ctx.lineTo(tickX, y_axisX + 1 + config_axisTickLineLength);
				ctx.stroke();
			}

			/* 绘制网格竖线 */
			if(config_showVerticalGridLine){
				ctx.strokeStyle = config_verticalGridLineColor;
				ctx.setLineDash && ctx.setLineDash(config_gridLineDash);

				for(var i = 0; i < axisXTickList.length; i++){
					var tickX = util.getLinePosition(axisXTickList[i].x);
					ctx.beginPath();
					ctx.moveTo(tickX, y_axisX - 1);
					ctx.lineTo(tickX, y_axisX - 1 - Math.floor(kSubChartSketch.getAxisYHeight()));
					ctx.stroke();
				}
			}

			ctx.restore();

			/* 实现逻辑：绘制X轴刻度标签 */
			if(config_showAxisXLabel){
				finishRemainingAxisXRendering = function(){
					ctx.save();
					ctx.font = config_axisLabelFont;
					ctx.fillStyle = config_axisLabelColor;
					ctx.textAlign = "center";
					ctx.textBaseline = "top";

					var y_axisXTickLabel = y_axisX + config_axisTickLineLength + config_axisXLabelOffset;
					for(var i = 0; i < axisXTickList.length; i++){
						var tickX = util.getLinePosition(axisXTickList[i].x),
							tickLabel = axisXTickList[i].label;

						if(typeof config_axisXLabelHorizontalAlign === "function")
							config_axisXLabelHorizontalAlign = config_axisXLabelHorizontalAlign(i, axisXTickList.length);
						config_axisXLabelHorizontalAlign && (ctx.textAlign = config_axisXLabelHorizontalAlign);

						ctx.fillText(tickLabel, tickX, y_axisXTickLabel);
					}

					ctx.restore();
				};
			}

			return finishRemainingAxisXRendering;
		};

		/**
		 * 绘制Y轴
		 * @param {CanvasRenderingContext2D} ctx 画布绘图上下文
		 * @param {KChartSketch} kChartSketch 图形概览
		 * @param {KSubChartSketch} kSubChartSketch 子图图形概览
		 * @param {KDataSketch} kDataSketch 数据概览
		 *
		 * @param {Object} [ops] 控制选项
		 * @param {Function} [ops.axisYTickConverter] 总坐标刻度转换器（用于辅助子图实现纵坐标刻度调整，如位置向上偏移等）
		 *
		 * @returns {Function} 完成剩余的Y轴绘制工作，子图在其图形正文绘制完成后调用
		 */
		this.renderAxisY = function(ctx, kChartSketch, kSubChartSketch, kDataSketch, ops){
			/**
			 * 完成剩余的Y轴绘制工作。
			 * 为达到良好的视觉效果，图形绘制的先后顺序，应为：
			 * 1. Y轴横线、Y轴刻度线、Y轴刻度线对应的纵向网格线
			 * 2. 图形正文（蜡烛图、量图等）
			 * 3. Y轴刻度标签
			 *
			 * 本方法完成1，然后由子图完成2，然后由子图完成3。
			 * 为简化子图代码逻辑，本方法实现3的绘制逻辑，并将
			 * 绘制逻辑返回给子图，最后由子图调用实现绘制
			 */
			var finishRemainingAxisYRendering = function(){};

			var config_showAxisYLine = this.getConfigItem("showAxisYLine");
			if(!config_showAxisYLine)
				return finishRemainingAxisYRendering;

			var config_paddingTop = this.getConfigItem("paddingTop"),
				config_axisLineWidth = this.getConfigItem("axisLineWidth"),
				config_axisLineColor = this.getConfigItem("axisLineColor"),
				config_axisLabelFont = this.getConfigItem("axisLabelFont"),
				config_axisLabelColor = this.getConfigItem("axisLabelColor"),
				config_axisYLabelFont = this.getConfigItem("axisYLabelFont"),
				config_axisYLabelColor = this.getConfigItem("axisYLabelColor"),
				config_showHorizontalGridLine = this.getConfigItem("showHorizontalGridLine"),
				config_horizontalGridLineColor = this.getConfigItem("horizontalGridLineColor"),
				config_gridLineDash = this.getConfigItem("gridLineDash"),
				config_axisTickLineLength = this.getConfigItem("axisTickLineLength"),
				config_axisYLabelOffset = this.getConfigItem("axisYLabelOffset"),
				config_axisYMidTickQuota = this.getConfigItem("axisYMidTickQuota"),
				config_showAxisYLabel = this.getConfigItem("showAxisYLabel"),
				config_axisYLabelVerticalOffset = this.getConfigItem("axisYLabelVerticalOffset"),
				config_axisYAmountFloorLabelFont = this.getConfigItem("axisYAmountFloorLabelFont"),
				config_axisYAmountFloorLabelColor = this.getConfigItem("axisYAmountFloorLabelColor"),
				config_axisYAmountCeilingLabelFont = this.getConfigItem("axisYAmountCeilingLabelFont"),
				config_axisYAmountCeilingLabelColor = this.getConfigItem("axisYAmountCeilingLabelColor"),
				config_axisYPosition = this.getConfigItem("axisYPosition"),
				config_axisYLabelPosition = this.getConfigItem("axisYLabelPosition");

			var ifShowAxisYLeft = "left" === String(config_axisYPosition).toLowerCase(),
				ifShowAxisYLabelOutside = "outside" === String(config_axisYLabelPosition).toLowerCase();

			var xLeft_axisX = kChart.calcAxisXLeftPosition(),
				xRight_axisX = kChart.calcAxisXRightPosition(kChartSketch.getCanvasWidth()),
				y_axisX = util.getLinePosition(config_paddingTop + kSubChartSketch.getAxisYHeight()),

				x_axisY = ifShowAxisYLeft? xLeft_axisX: xRight_axisX,
				yTop_axisY = Math.floor(config_paddingTop),
				yBottom_axisY = Math.floor(y_axisX);

			var axisYTickBeginX;
			if(ifShowAxisYLeft && ifShowAxisYLabelOutside || !ifShowAxisYLeft && !ifShowAxisYLabelOutside)
				axisYTickBeginX = Math.floor(x_axisY) - config_axisTickLineLength;
			else
				axisYTickBeginX = Math.floor(x_axisY) + 1;

			var sign;
			if(ifShowAxisYLeft){
				sign = ifShowAxisYLabelOutside? -1: 1;
			}else{
				sign = ifShowAxisYLabelOutside? 1: -1;
			}
			var axisYLabelOffset = sign * ((config_showAxisYLine? config_axisTickLineLength: 0) + config_axisYLabelOffset);

			ctx.save();
			ctx.lineWidth = config_axisLineWidth;
			ctx.strokeStyle = config_axisLineColor;

			/* 绘制Y轴坐标线 */
			ctx.beginPath();
			ctx.moveTo(x_axisY, yTop_axisY);
			ctx.lineTo(x_axisY, yBottom_axisY);
			ctx.stroke();

			/* 绘制Y轴刻度线 */
			var axisYTickList = this.getRenderingYTickListFromBottom(kSubChartSketch, kDataSketch);

			/* 辅助子图实现纵坐标刻度调整，如向上偏移等 */
			if(null != ops && typeof ops.axisYTickConverter === "function")
				axisYTickList.map(ops.axisYTickConverter);

			for(var i = 0; i < axisYTickList.length; i++){
				var tickY = util.getLinePosition(axisYTickList[i].y);

				ctx.beginPath();
				ctx.moveTo(axisYTickBeginX, tickY);
				ctx.lineTo(axisYTickBeginX + config_axisTickLineLength, tickY);
				ctx.stroke();
			}

			/* 绘制网格横线 */
			if(config_showHorizontalGridLine){
				ctx.strokeStyle = config_horizontalGridLineColor;
				ctx.setLineDash && ctx.setLineDash(config_gridLineDash);

				for(var i = 0; i < axisYTickList.length; i++){
					var tickY = util.getLinePosition(axisYTickList[i].y);

					ctx.beginPath();
					ctx.moveTo(x_axisY, tickY);
					ctx.lineTo(x_axisY + (ifShowAxisYLeft? 1: -1) * Math.floor(kChartSketch.getAxisXWidth()), tickY);
					ctx.stroke();
				}
			}
			ctx.restore();

			/* 实现逻辑：绘制Y轴刻度标签 */
			if(config_showAxisYLabel){
				finishRemainingAxisYRendering = function(){
					ctx.save();
					ctx.font = config_axisLabelFont;
					ctx.fillStyle = config_axisLabelColor;
					if(ifShowAxisYLeft){
						ctx.textAlign = ifShowAxisYLabelOutside? "end": "start";
					}else{
						ctx.textAlign = ifShowAxisYLabelOutside? "start": "end";
					}
					ctx.textBaseline = "middle";

					var maxAxisYTickIndex = config_axisYMidTickQuota + 1;

					for(var i = 0; i < axisYTickList.length; i++){
						var tickY = util.getLinePosition(axisYTickList[i].y),
							tickLabel = axisYTickList[i].label;

						if(typeof config_axisYLabelVerticalOffset === "function")
							config_axisYLabelVerticalOffset = config_axisYLabelVerticalOffset(i, maxAxisYTickIndex + 1);

						var drawLabel = function(){
							ctx.fillText(tickLabel, x_axisY + axisYLabelOffset, tickY + config_axisYLabelVerticalOffset);
						};

						if(i > 0 && i < maxAxisYTickIndex)
							drawLabel();
						else if(i === 0){
							ctx.save();
							config_axisYAmountFloorLabelFont && (ctx.font = config_axisYAmountFloorLabelFont);
							config_axisYAmountFloorLabelColor && (ctx.fillStyle = config_axisYAmountFloorLabelColor);
							drawLabel();
							ctx.restore();
						}else if(i === maxAxisYTickIndex){
							ctx.save();
							config_axisYAmountCeilingLabelFont && (ctx.font = config_axisYAmountCeilingLabelFont);
							config_axisYAmountCeilingLabelColor && (ctx.fillStyle = config_axisYAmountCeilingLabelColor);
							drawLabel();
							ctx.restore();
						}
					}

					ctx.restore();
				};
			}

			return finishRemainingAxisYRendering;
		};

		var evtRenderAction = function(e){
			TradeChart2.showLog && console.debug("Auto render for " + self.id + " by event: " + e.type);
			self.render();
		};
		kChart.on("renderingpositionchange", evtRenderAction);
		kChart.getKDataManager().on("storeddatachange, renderingdatachange", evtRenderAction);

		TradeChart2.showLog && console.info("Create k sub chart: " + this.id);
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChart", KSubChart);
})();