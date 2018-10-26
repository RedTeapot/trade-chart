;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

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
	 * K线子图
	 * @param {KChart} kChart 附加该子图的K线图
	 * @param {KSubChartTypes} type 子图类型。如：volume - 量图；ma - MA指标图
	 */
	var KSubChart = function(kChart, type){
		var self = this;

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
		 * 获取指定名称的配置项取值。如果配置项并没有声明，则返回对应的默认配置。如果配置项无法识别，则返回undefined
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getConfigItem = function(name, config){
			console.warn("Not implemented!");
			return null;
		};

		/**
		 * 渲染图形，并呈现至指定的画布中
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} config 渲染配置
		 * @returns {KSubChartRenderResult} 绘制的K线子图
		 */
		this.render = (function(){
			var lastCall = NOT_SUPPLIED;
			var a = {
				withParams: true,
				timestamp: -Infinity,
				result: null
			};
			var gap = 50;

			var tmp = function(canvasObj, config){
				var now = Date.now();
				var ifHasParams = arguments.length !== 0;

				var f = function(){
					var v = self.implRender.apply(self, arguments);

					if(NOT_SUPPLIED === lastCall)
						lastCall = {};

					lastCall.result = v;
					lastCall.timestamp = now;
					lastCall.withParams = ifHasParams;

					return v;
				};

				/**
				 * 消除单位时间内的无参重复调用
				 */
				if(!ifHasParams){
					if(NOT_SUPPLIED === lastCall || lastCall.withParams || now - lastCall.timestamp >= gap)
						return f();

					lastCall.timestamp = now;
					return lastCall.result;
				}else
					return f();
			};

			return function(canvasObj, config){
				return self.implRender.apply(self, arguments);
			};
		})();

		/**
		 * 由子类实现的图形渲染方法
		 * @param {HTMLCanvasElement} canvasObj 画布
		 * @param {Object} config 渲染配置
		 * @returns {KSubChartRenderResult} 绘制的K线子图
		 */
		this.implRender = function(canvasObj, config){
			console.warn("Not implemented for k sub chart: " + this.getType());
			return null;
		};



		/**
		 * 绘制横坐标刻度
		 * @param {CanvasRenderingContext2D} ctx 画布绘图上下文
		 * @param {KSubChartConfig} config 渲染配置
		 * @param {Number} y_axisX 横坐标刻度的纵向位置
		 * @param {XTick[]} axisXTickList 横坐标刻度列表
		 * @param {String} drawContent 绘制内容。both：刻度线和坐标值；tick：只绘制刻度线；label：只绘制坐标值；
		 */
		this.renderAxisXTickList = function(ctx, config, y_axisX, axisXTickList, drawContent){
			drawContent = null == drawContent? null: String(drawContent).trim().toLowerCase();
			if(drawContent !== "both" && drawContent !== "tick" && drawContent !== "label"){
				console.warn("Unknown draw content: " + drawContent);
				drawContent = "both";
			}

			var ifDrawTick = drawContent === "both" || drawContent === "tick",
				ifDrawLabel = drawContent === "both" || drawContent === "label";

			var config_axisLineColor = this.getConfigItem("axisLineColor", config),
				config_axisLabelFont = this.getConfigItem("axisLabelFont", config),
				config_axisLabelColor = this.getConfigItem("axisLabelColor", config),
				config_axisXLabelOffset = this.getConfigItem("axisXLabelOffset", config),
				config_showAxisXLine = this.getConfigItem("showAxisXLine", config),
				config_axisTickLineLength = this.getConfigItem("axisTickLineLength", config),
				config_showAxisXLabel = this.getConfigItem("showAxisXLabel", config),
				config_axisXLabelHorizontalAlign = this.getConfigItem("axisXLabelHorizontalAlign", config);

			ctx.save();

			ctx.lineWidth = 1;

			config_axisLineColor && (ctx.strokeStyle = config_axisLineColor);
			config_axisLabelFont && (ctx.font = config_axisLabelFont);
			config_axisLabelColor && (ctx.fillStyle = config_axisLabelColor);
			ctx.textAlign = "center";
			ctx.textBaseline = "top";

			var y_axisXTickLabel = config_axisXLabelOffset + y_axisX;
			if(config_showAxisXLine)
				y_axisXTickLabel += config_axisTickLineLength;

			for(var i = 0; i < axisXTickList.length; i++){
				var tick = axisXTickList[i];
				var tickX = tick.x;

				/* 绘制刻度线 */
				if(ifDrawTick && config_showAxisXLine){
					ctx.beginPath();
					ctx.moveTo(tickX, y_axisX);
					ctx.lineTo(tickX, y_axisX + config_axisTickLineLength);
					ctx.stroke();
				}

				/* 绘制坐标取值 */
				if(ifDrawLabel && config_showAxisXLabel){
					ctx.save();

					if(typeof config_axisXLabelHorizontalAlign === "function")
						config_axisXLabelHorizontalAlign = config_axisXLabelHorizontalAlign(i, axisXTickList.length);
					config_axisXLabelHorizontalAlign && (ctx.textAlign = config_axisXLabelHorizontalAlign);
					ctx.fillText(tick.label, tickX, y_axisXTickLabel);
					ctx.restore();
				}
			}

			ctx.restore();
		};

		/**
		 * 绘制纵坐标刻度
		 * @param {CanvasRenderingContext2D} ctx 画布绘图上下文
		 * @param {KSubChartConfig} config 渲染配置
		 * @param {Number} x_axisY 纵坐标刻度的横向位置
		 * @param {YTick[]} axisYTickList 横坐标刻度列表
		 * @param {String} drawContent 绘制内容。both：刻度线和坐标值；tick：只绘制刻度线；label：只绘制坐标值；
		 */
		this.renderAxisYTickList = function(ctx, config, x_axisY, axisYTickList, drawContent){
			drawContent = null == drawContent? null: String(drawContent).trim().toLowerCase();
			if(drawContent !== "both" && drawContent !== "tick" && drawContent !== "label"){
				console.warn("Unknown draw content: " + drawContent);
				drawContent = "both";
			}

			var ifDrawTick = drawContent === "both" || drawContent === "tick",
				ifDrawLabel = drawContent === "both" || drawContent === "label";

			var config_paddingTop = this.getConfigItem("paddingTop", config),
				config_axisLineColor = this.getConfigItem("axisLineColor", config),
				config_axisLabelFont = this.getConfigItem("axisLabelFont", config),
				config_axisLabelColor = this.getConfigItem("axisLabelColor", config),
				config_axisYLabelFont = this.getConfigItem("axisYLabelFont", config),
				config_axisYLabelColor = this.getConfigItem("axisYLabelColor", config),
				config_axisTickLineLength = this.getConfigItem("axisTickLineLength", config),
				config_showAxisYLine = this.getConfigItem("showAxisYLine", config),
				config_axisYLabelOffset = this.getConfigItem("axisYLabelOffset", config),
				config_axisYMidTickQuota = this.getConfigItem("axisYMidTickQuota", config),
				config_showAxisYLabel = this.getConfigItem("showAxisYLabel", config),
				config_axisYLabelVerticalOffset = this.getConfigItem("axisYLabelVerticalOffset", config),
				config_axisYAmountFloorLabelFont = this.getConfigItem("axisYAmountFloorLabelFont", config),
				config_axisYAmountFloorLabelColor = this.getConfigItem("axisYAmountFloorLabelColor", config),
				config_axisYAmountCeilingLabelFont = this.getConfigItem("axisYAmountCeilingLabelFont", config),
				config_axisYAmountCeilingLabelColor = this.getConfigItem("axisYAmountCeilingLabelColor", config),
				config_axisYPosition = this.getConfigItem("axisYPosition", config),
				config_axisYLabelPosition = this.getConfigItem("axisYLabelPosition", config);

			var ifShowAxisYLeft = "left" === String(config_axisYPosition).toLowerCase(),
				ifShowAxisYLabelOutside = "outside" === String(config_axisYLabelPosition).toLowerCase();

			var yTop_axisY = util.getLinePosition(config_paddingTop);

			ctx.save();

			ctx.lineWidth = 1;
			config_axisLineColor && (ctx.strokeStyle = config_axisLineColor);
			config_axisLabelFont && (ctx.font = config_axisLabelFont);
			config_axisLabelColor && (ctx.fillStyle = config_axisLabelColor);
			config_axisYLabelFont && (ctx.font = config_axisYLabelFont);
			config_axisYLabelColor && (ctx.fillStyle = config_axisYLabelColor);

			if(ifShowAxisYLeft){
				ctx.textAlign = ifShowAxisYLabelOutside? "end": "start";
			}else{
				ctx.textAlign = ifShowAxisYLabelOutside? "start": "end";
			}
			ctx.textBaseline = "middle";

			var sign;
			if(ifShowAxisYLeft){
				sign = ifShowAxisYLabelOutside? -1: 1;
			}else{
				sign = ifShowAxisYLabelOutside? 1: -1;
			}

			var axisTickLineOffset = sign * config_axisTickLineLength,
				axisYLabelOffset = sign * ((config_showAxisYLine? config_axisTickLineLength: 0) + config_axisYLabelOffset);
			var maxAxisYTickIndex = config_axisYMidTickQuota + 1;

			for(var i = 0; i < axisYTickList.length; i++){
				var tick = axisYTickList[i];
				var tickY = tick.y;

				/* 绘制刻度线 */
				if(ifDrawTick && config_showAxisYLine){
					ctx.beginPath();
					ctx.moveTo(x_axisY, yTop_axisY + tickY);
					ctx.lineTo(x_axisY + axisTickLineOffset, yTop_axisY + tickY);
					ctx.stroke();
				}

				if(ifDrawLabel && config_showAxisYLabel){
					if(typeof config_axisYLabelVerticalOffset === "function")
						config_axisYLabelVerticalOffset = config_axisYLabelVerticalOffset(i, maxAxisYTickIndex + 1);

					var drawLabel = function(){
						ctx.fillText(tick.label, x_axisY + axisYLabelOffset, yTop_axisY + tickY + config_axisYLabelVerticalOffset);
					};

					if(i === 0){
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
					}else
						drawLabel();
				}
			}

			ctx.restore();
		};

		/**
		 * 绘制图形区域背景
		 * @param {CanvasRenderingContext2D} ctx 画布绘图上下文
		 * @param {KSubChartConfig} config 渲染配置
		 * @param {Number} width 图形区域的宽度
		 * @param {Number} height 图形区域的高度
		 */
		this.renderBackground = function(ctx, config, width, height){
			var config_bg = this.getConfigItem("coordinateBackground", config);
			if(util.isEmptyString(config_bg))
				return;

			var config_paddingLeft = this.getConfigItem("paddingLeft", config),
				config_paddingTop = this.getConfigItem("paddingTop", config);


			var yTop_axisY = util.getLinePosition(config_paddingTop),
				xLeft_axisX = util.getLinePosition(config_paddingLeft);

			ctx.save();
			ctx.beginPath();
			ctx.rect(xLeft_axisX, yTop_axisY, util.getLinePosition(width), util.getLinePosition(height));

			ctx.strokeWidth = 0;
			if(config_bg instanceof TradeChart2.LinearGradient){
				config_bg.apply(ctx, config_paddingLeft, config_paddingTop, config_paddingLeft, config_paddingTop + height);
			}else
				ctx.fillStyle = config_bg;

			ctx.fill();
			ctx.restore();
		};

		/**
		 * 绘制X轴
		 * @param {CanvasRenderingContext2D} ctx 画布绘图上下文
		 * @param {KSubChartConfig} config 渲染配置
		 * @param {KChartSketch} kChartSketch
		 * @param {KSubChartSketch_ChartSketch} kSubChartSketch
		 * @returns {XTick[]}
		 */
		this.renderAxisX = function(ctx, config, kChartSketch, kSubChartSketch){
			var config_showAxisXLine = this.getConfigItem("showAxisXLine", config),
				config_paddingLeft = this.getConfigItem("paddingLeft", config),
				config_paddingTop = this.getConfigItem("paddingTop", config),
				config_axisXTickOffset = this.getConfigItem("axisXTickOffset", config),
				config_groupBarWidth = this.getConfigItem("groupBarWidth", config),
				config_groupGap = this.getConfigItem("groupGap", config),
				config_gridLineDash = this.getConfigItem("gridLineDash", config),
				config_verticalGridLineColor = this.getConfigItem("verticalGridLineColor", config),
				config_showVerticalGridLine = this.getConfigItem("showVerticalGridLine", config),
				config_showAxisXLabel = this.getConfigItem("showAxisXLabel", config),
				config_axisXLabelGenerator = this.getConfigItem("axisXLabelGenerator", config);

			var xLeft_axisX = util.getLinePosition(config_paddingLeft),
				xRight_axisX = xLeft_axisX + Math.floor(kChartSketch.getWidth()),
				xLeft_content = xLeft_axisX + Math.floor(config_axisXTickOffset),
				y_axisX = util.getLinePosition(config_paddingTop + kSubChartSketch.getHeight());

			/* 绘制的数据个数 */
			var groupCount = Math.min(kChartSketch.getMaxGroupCount(), kChart.getKDataManager().getConvertedRenderingDataList().length);
			/* 一组数据的宽度 */
			var groupSizeBig = new Big(config_groupBarWidth).plus(config_groupGap);
			/* 蜡烛一半的宽度 */
			var halfGroupBarWidth = kChart.calcHalfGroupBarWidth();
			/* 一组数据宽度的一半 */
			var halfGroupSize = kChart.calcHalfGroupSize();
			/* 是否绘制网格横线/竖线 */
			var ifShowVerticalGridLine = config_showVerticalGridLine && !util.isEmptyString(config_verticalGridLineColor);
			/* 一个横坐标刻度横跨的数据个数 */
			var axisXLabelTickSpan = kChart.calcAxisXLabelTickSpan();
			/* 横坐标刻度个数 */
			var axisXTickCount = floorBig(new Big(groupCount).div(axisXLabelTickSpan));

			/* 绘制X轴坐标线 */
			if(config_showAxisXLine){
				ctx.beginPath();
				ctx.moveTo(xLeft_axisX, y_axisX);
				ctx.lineTo(xRight_axisX, y_axisX);
				ctx.stroke();
			}

			/* 上一个绘制的横坐标刻度对应的数据索引 */
			var previousXTickDataIndex = null;

			var axisXTickList = [];

			/**
			 * 根据提供的数据的索引位置绘制刻度
			 * @param {Number} i 数据的索引位置
			 */
			var renderXTick = function(i){
				if(i < 0 || i >= groupCount)
					return;

				var tickX = util.getLinePosition(groupSizeBig.mul(i).plus(xLeft_content).plus(kChart.getRenderingOffset()));
				var data = kChart.getKDataManager().getConvertedData(i);

				// if(i == 0)
				// 	console.log(">>", tickX, xLeft_content, kChart.getRenderingOffset());

				var ifRender = tickX >= xLeft_content;
				if(!ifRender)
					return;

				/* 绘制网格竖线 */
				if(ifShowVerticalGridLine){
					ctx.save();
					ctx.setLineDash && ctx.setLineDash(config_gridLineDash);
					config_verticalGridLineColor && (ctx.strokeStyle = config_verticalGridLineColor);

					ctx.beginPath();
					ctx.moveTo(tickX, y_axisX - 1);
					ctx.lineTo(tickX, y_axisX - 1 - Math.floor(kSubChartSketch.getHeight()));
					ctx.stroke();
					ctx.restore();
				}

				/* 汇集刻度，用于图形绘制完毕后统一绘制 */
				var label = (function(){
					if(!config_showAxisXLabel)
						return "";

					var previousData = null;
					if(null != previousXTickDataIndex)
						previousData = kChart.getKDataManager().getConvertedData(previousXTickDataIndex);

					return config_axisXLabelGenerator(data, i, previousData, previousXTickDataIndex);
				})();
				axisXTickList.push({x: tickX, label: label});

				previousXTickDataIndex = i;
			};

			/* 绘制X轴刻度 */
			var edgeTickDataIndex,/** 处于边界位置的刻度所对应的数据索引 */
			lastTickDataIndex;/** 最后一个的刻度所对应的数据索引 */
			edgeTickDataIndex = groupCount - 1;

			var b = new Big(axisXLabelTickSpan);
			for(var i = 0; i <= axisXTickCount - 1; i++){
				renderXTick(roundBig(b.mul(i)));
			}
			lastTickDataIndex = Math.min(roundBig(b.mul(i)), groupCount - 1);

			var totalSpace = Math.min(numBig(groupSizeBig.mul(groupCount - 1)), kChartSketch.getContentWidth());
			var remainingSpace = totalSpace - (numBig(groupSizeBig.mul(lastTickDataIndex)) - halfGroupBarWidth + halfGroupSize);
			if(remainingSpace < halfGroupSize){
				/* 剩余空间不足，只绘制边界刻度 */
				renderXTick(edgeTickDataIndex);
			}else{
				/* 绘制最后一个刻度和边界刻度 */
				renderXTick(edgeTickDataIndex);
				if(lastTickDataIndex !== edgeTickDataIndex)
					renderXTick(lastTickDataIndex);
			}

			return axisXTickList;
		};

		/**
		 * 绘制Y轴
		 * @param {CanvasRenderingContext2D} ctx 画布绘图上下文
		 * @param {KSubChartConfig} config 渲染配置
		 * @param {KChartSketch} kChartSketch
		 * @param {KSubChartSketch_ChartSketch} kSubChartSketch
		 * @param {KDataSketch} kDataSketch
		 * @returns {YTick[]}
		 */
		this.renderAxisY = function(ctx, config, kChartSketch, kSubChartSketch, kDataSketch){
			var config_showAxisYLine = this.getConfigItem("showAxisYLine", config),
				config_paddingLeft = this.getConfigItem("paddingLeft", config),
				config_paddingTop = this.getConfigItem("paddingTop", config),
				config_axisYPosition = this.getConfigItem("axisYPosition", config),
				config_axisYLabelPosition = this.getConfigItem("axisYLabelPosition", config),
				config_axisYPrecision = this.getConfigItem("axisYPrecision", config),
				config_axisYMidTickQuota = this.getConfigItem("axisYMidTickQuota", config),
				config_gridLineDash = this.getConfigItem("gridLineDash", config),
				config_horizontalGridLineColor = this.getConfigItem("horizontalGridLineColor", config),
				config_showHorizontalGridLine = this.getConfigItem("showHorizontalGridLine", config),
				config_axisYFormatter = this.getConfigItem("axisYFormatter", config);

			var ifShowAxisYLeft = "left" === String(config_axisYPosition).toLowerCase(),
				ifShowAxisYLabelOutside = "outside" === String(config_axisYLabelPosition).toLowerCase();

			var xLeft_axisX = util.getLinePosition(config_paddingLeft),
				xRight_axisX = xLeft_axisX + Math.floor(kChartSketch.getWidth()),
				y_axisX = util.getLinePosition(config_paddingTop + kSubChartSketch.getHeight()),

				x_axisY = ifShowAxisYLeft? xLeft_axisX: xRight_axisX,
				yTop_axisY = util.getLinePosition(config_paddingTop),
				yBottom_axisY = y_axisX;

			/** 相邻两个纵坐标刻度之间的价格悬差 */
			var axisYAmountInterval = numBig(new Big(kDataSketch.getAmountCeiling()).minus(kDataSketch.getAmountFloor()).div(config_axisYMidTickQuota + 1));
			/** 相邻两个纵坐标刻度之间的高度悬差 */
			var axisYHeightInterval = kSubChartSketch.calculateHeight(axisYAmountInterval);
			/* 是否绘制网格横线/竖线 */
			var ifShowHorizontalGridLine = config_showHorizontalGridLine && config_horizontalGridLineColor;



			/**
			 * 要绘制的纵坐标刻度集合
			 * @type {YTick[]}
			 */
			var axisYTickList = [];

			/**
			 * 添加纵坐标刻度。如果相同位置，或相同标签的刻度已经存在，则不再添加
			 * @param {Number} tickY 纵坐标刻度位置
			 * @param {Number} tickAmount 该刻度对应的价钱
			 */
			var try2AddAxisYTick = function(tickY, tickAmount){
				var tickAmountBig = new Big(tickAmount);
				var tickLabel = config_axisYFormatter(tickAmount, config);

				for(var i = 0; i < axisYTickList.length; i++){
					var tick = axisYTickList[i];
					if(tick.label === tickLabel || Math.abs(tick.y - tickY) < 1 || tickAmountBig.eq(tick.amount)){
						console.warn("Found potential existing tick while adding tick: " + tickLabel + "(" + tickAmount + ") at " + tickY, JSON.stringify(tick));
						return;
					}
				}

				axisYTickList.push({y: tickY, amount: tickAmount, label: tickLabel});
			};

			if(config_showAxisYLine){
				ctx.beginPath();
				ctx.moveTo(x_axisY, yTop_axisY);
				ctx.lineTo(x_axisY, yBottom_axisY);
				ctx.stroke();
			}

			var isAxisYPrecisionAuto = "auto" === String(config_axisYPrecision).trim().toLowerCase();
			var axisYPrecisionBak = config_axisYPrecision;
			var ifDeclaredAxisYPrecision = "axisYPrecision" in config;
			if(isAxisYPrecisionAuto)
				config.axisYPrecision = kDataSketch.getAmountPrecision();

			/* 绘制Y轴刻度（自下而上） */
			var maxAxisYTickIndex = config_axisYMidTickQuota + 1;
			for(var i = 0; i <= maxAxisYTickIndex; i++){
				var amount = kDataSketch.getAmountFloor() + numBig(new Big(axisYAmountInterval).mul(i)),
					tickOffset = numBig(new Big(axisYHeightInterval).mul(maxAxisYTickIndex - i));
				var tickY = Math.round(tickOffset);

				/* 绘制网格横线 */
				if(ifShowHorizontalGridLine && i > 0){/* 坐标轴横线上不再绘制 */
					ctx.save();
					ctx.setLineDash && ctx.setLineDash(config_gridLineDash);
					config_horizontalGridLineColor && (ctx.strokeStyle = config_horizontalGridLineColor);

					ctx.beginPath();
					ctx.moveTo(x_axisY, yTop_axisY + tickY);
					ctx.lineTo(x_axisY + (ifShowAxisYLeft? 1: -1) * Math.floor(kChartSketch.getWidth()), yTop_axisY + tickY);
					ctx.stroke();
					ctx.restore();
				}

				/* 汇集刻度，用于图形绘制完毕后统一绘制 */
				try2AddAxisYTick(tickY, amount);
			}

			/* 自动检测精度，规避多个刻度使用相同取值的情况 */
			var flag = false;
			do{
				flag = false;
				for(var i = 0; i < axisYTickList.length - 1; i++)
					for(var j = i + 1; j < axisYTickList.length; j++){
						if(axisYTickList[i].label === axisYTickList[j].label){
							flag = true;
							break;
						}

						if(flag)
							break;
					}

				if(flag && config.axisYPrecision < 20){
					config.axisYPrecision += 1;
					for(var i = 0; i < axisYTickList.length; i++)
						axisYTickList[i].label = config_axisYFormatter(axisYTickList[i].amount, config);
				}else
					break;
			}while(flag);

			if(ifDeclaredAxisYPrecision)
				config.axisYPrecision = axisYPrecisionBak;
			else
				delete config.axisYPrecision;

			return axisYTickList;
		};


		console.info("Create k sub chart: " + this.id);

		var evtRenderTimer,
			evtRenderDelay = 50;
		var evtRenderAction = function(e){
			clearTimeout(evtRenderTimer);
			evtRenderTimer = setTimeout(function(){
				console.debug("Auto render for sub chart: " + self.id + " by event: " + e.type);

				self.render();
			}, evtRenderDelay);
		};
		kChart.on("renderingpositionchange", evtRenderAction);
		kChart.getKDataManager().on("storeddatachange, renderingdatachange", evtRenderAction);
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChart", KSubChart);
})();