;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util,
		Big = TradeChart2.Big,
		CommonChart = TradeChart2.CommonChart,
		KChartConfig = TradeChart2.KChartConfig,
		CommonDataManager = TradeChart2.CommonDataManager,
		CommonChartConfig = TradeChart2.CommonChartConfig,
		KChartSketch = TradeChart2.KChartSketch,
		eventDrive = TradeChart2.eventDrive;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * 验证配置并自动纠正错误的配置
	 * @param {KChartConfig} config K线绘制配置
	 */
	var validateConfig = function(config){
		var v;

		/* 线宽需要为奇数 */
		var groupLineWidth = config.getConfigItemValue("groupLineWidth");
		if(groupLineWidth === 0)
			groupLineWidth = 1;
		if(groupLineWidth % 2 === 0){
			v = groupLineWidth + 1;
			console.warn("K line with should be odd(supplied: " + groupLineWidth + "), auto adjust to " + v);
			config.setOriginalConfigItemValue("groupLineWidth", groupLineWidth = v);
		}

		/* 柱宽需大于等于线宽+2 */
		var groupBarWidth = config.getConfigItemValue("groupBarWidth");
		var tmp = groupLineWidth + 2;
		if(groupBarWidth < tmp){
			console.warn("K chart bar width should be greater than group line width plus 2, auto adjust to " + tmp + ". Configured bar width: " + groupBarWidth + ", configured line with: " + groupLineWidth);
			config.setOriginalConfigItemValue("groupBarWidth", groupBarWidth = tmp);
		}
		if(groupBarWidth % 2 === 0){
			v = groupBarWidth + 1;
			console.warn("K bar width should odd(supplied: " + groupBarWidth + "), auto adjust to " + v);
			config.setOriginalConfigItemValue("groupBarWidth", groupBarWidth = v);
		}
	};

	/**
	 * @constructor
	 * K线图（OHLC图）
	 *
	 * @augments CommonChart
	 */
	var KChart = function(){
		CommonChart.apply(this, arguments);
		var self = this;

		/** 绘制配置 */
		var config = new KChartConfig();


		util.defineReadonlyProperty(this, "id", util.randomString("k-", 3));


		var super_updateRenderingOffsetBy = this.updateRenderingOffsetBy;

		/**
		 * 更新“绘制位置的横向位移”，使其在既有基础上累加上给定的偏移量
		 * 绘制的起点位置，为图形右侧
		 *
		 * @param {Number} amount 要累加的横向偏移量。正数代表图形向右移动；负数代表图形向左移动
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {KChart}
		 */
		this.updateRenderingOffsetBy = function(amount, canvasWidth){
			amount = util.parseAsNumber(amount, 0);
			if(0 === amount)
				return this;

			var maxGroupCount = KChartSketch.calcMaxGroupCount(config, canvasWidth);
			super_updateRenderingOffsetBy(amount, maxGroupCount, canvasWidth);

			return this;
		};

		/**
		 * 获取图形绘制配置
		 * @override
		 * @returns {KChartConfig}
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * 计算横坐标正文区域左侧位置（坐标原点为：画布左上角）
		 * @returns {Number}
		 */
		this._calcAxisXContentLeftPosition = function(){
			var config_axisXTickOffset = this.getConfigItem("axisXTickOffset");

			var xLeft_axisX = this._calcAxisXLeftPosition();
			return xLeft_axisX + Math.floor(config_axisXTickOffset);
		};

		/**
		 * 计算横坐标正文区域右侧位置（坐标原点为：画布左上角）
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {Number}
		 */
		this._calcAxisXContentRightPosition = function(canvasWidth){
			var config_axisXTickOffsetFromRight = this.getConfigItem("axisXTickOffsetFromRight");
			var xRight_axisX = this._calcAxisXRightPosition(canvasWidth);
			return xRight_axisX - Math.floor(config_axisXTickOffsetFromRight);
		};
	};
	KChart.prototype = Object.create(CommonChart.prototype);

	util.defineReadonlyProperty(TradeChart2, "KChart", KChart);
})();