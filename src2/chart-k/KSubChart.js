;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

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

			return function(){
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
		 * @param {Number} y_axisX 横坐标刻度的纵向位置
		 * @param {XTick[]} axisXTickList 横坐标刻度列表
		 * @param {String} drawContent 绘制内容。both：刻度线和坐标值；tick：只绘制刻度线；label：只绘制坐标值；
		 */
		this.renderAxisXTickList = function(ctx, y_axisX, axisXTickList, drawContent){
			drawContent = null == drawContent? null: String(drawContent).trim().toLowerCase();
			if(drawContent !== "both" && drawContent !== "tick" && drawContent !== "label"){
				console.warn("Unknown draw content: " + drawContent);
				drawContent = "both";
			}

			var ifDrawTick = drawContent === "both" || drawContent === "tick",
				ifDrawLabel = drawContent === "both" || drawContent === "label";

			var config_axisLineColor = this.getConfigItem("axisLineColor"),
				config_axisLabelFont = this.getConfigItem("axisLabelFont"),
				config_axisLabelColor = this.getConfigItem("axisLabelColor"),
				config_axisXLabelOffset = this.getConfigItem("axisXLabelOffset"),
				config_showAxisXLine = this.getConfigItem("showAxisXLine"),
				config_axisTickLineLength = this.getConfigItem("axisTickLineLength"),
				config_showAxisXLabel = this.getConfigItem("showAxisXLabel"),
				config_axisXLabelHorizontalAlign = this.getConfigItem("axisXLabelHorizontalAlign");

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
		 * @param {Number} x_axisY 纵坐标刻度的横向位置
		 * @param {YTick[]} axisYTickList 横坐标刻度列表
		 * @param {String} drawContent 绘制内容。both：刻度线和坐标值；tick：只绘制刻度线；label：只绘制坐标值；
		 */
		this.renderAxisYTickList = function(ctx, x_axisY, axisYTickList, drawContent){
			drawContent = null == drawContent? null: String(drawContent).trim().toLowerCase();
			if(drawContent !== "both" && drawContent !== "tick" && drawContent !== "label"){
				console.warn("Unknown draw content: " + drawContent);
				drawContent = "both";
			}

			var ifDrawTick = drawContent === "both" || drawContent === "tick",
				ifDrawLabel = drawContent === "both" || drawContent === "label";

			var config_paddingLeft = this.getConfigItem("paddingLeft"),
				config_paddingTop = this.getConfigItem("paddingTop"),
				config_axisXTickOffset = this.getConfigItem("axisXTickOffset"),
				config_axisLineColor = this.getConfigItem("axisLineColor"),
				config_axisLabelFont = this.getConfigItem("axisLabelFont"),
				config_axisLabelColor = this.getConfigItem("axisLabelColor"),
				config_axisYLabelFont = this.getConfigItem("axisYLabelFont"),
				config_axisYLabelColor = this.getConfigItem("axisYLabelColor"),
				config_axisTickLineLength = this.getConfigItem("axisTickLineLength"),
				config_showAxisYLine = this.getConfigItem("showAxisYLine"),
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