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


		//TODO 验证被动绘制的正确性
		var evtRenderTimer,
			evtRenderDelay = 50;
		var evtRenderAction = function(e){
			clearTimeout(evtRenderTimer);
			evtRenderTimer = setTimeout(function(){
				self.render();
			}, evtRenderDelay);
		};
		kChart.on("renderingpositionchange", evtRenderAction);
		kChart.getKDataManager().on("storeddatachange, renderingdatachange", evtRenderAction);
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChart", KSubChart);
})();