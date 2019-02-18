;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util,
		Big = TradeChart2.Big,
		CommonChartConfig = TradeChart2.CommonChartConfig,
		ChartSketch = TradeChart2.ChartSketch;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * K线图形素描
	 *
	 * @constructor
	 * @augments {ChartSketch}
	 */
	var KChartSketch = function(){
		ChartSketch.apply(this, arguments);
	};
	KChartSketch.prototype = Object.create(ChartSketch.prototype);

	/**
	 * 获取指定名称的配置项取值。如果配置项并没有声明，则返回对应的默认配置。如果配置项无法识别，则返回undefined
	 * @param {String} name 配置项名称
	 * @param {Object} config 配置集合
	 * @returns {*}
	 */
	var getConfigItem = function(name, config){
		var defaultConfig = TradeChart2.K_DEFAULT_CONFIG;

		if(null != config && name in config)
			return config[name];
		else if(name in defaultConfig)
			return defaultConfig[name];
		else{
			console.warn("Unknown configuration item: " + name);
			return undefined;
		}
	};

	/**
	 * 根据给定的配置，生成素描
	 * @param {KChartConfig} config 绘制配置
	 * @param {Number} [width] 绘制宽度（当配置中指定的宽度为百分比字符串时使用）
	 * @returns {KChartSketch}
	 */
	KChartSketch.sketchByConfig = function(config, width){
		var chartSketch = new KChartSketch();

		var config_width = config.getConfigItemValue("width"),
			config_paddingLeft = config.getConfigItemValue("paddingLeft"),
			config_paddingRight = config.getConfigItemValue("paddingRight"),
			config_axisXTickOffset = config.getConfigItemValue("axisXTickOffset"),
			config_axisXTickOffsetFromRight = config.getConfigItemValue("axisXTickOffsetFromRight");

		var canvasWidth = util.isValidNumber(width)? width: config_width;
		var axisXWidth = canvasWidth - config_paddingLeft - config_paddingRight;
		var contentWidth = axisXWidth - config_axisXTickOffset - config_axisXTickOffsetFromRight;

		chartSketch.setCanvasWidth(canvasWidth)
			.setAxisXWidth(axisXWidth)
			.setContentWidth(contentWidth)
			.setMaxGroupCount(KChartSketch.calcMaxGroupCount(config, width));

		return chartSketch;
	};

	/**
	 * 根据给定的配置计算可以绘制的最大群组个数。
	 * 当群组之间的间隔固定时，计算得出的最大群组个数恰巧等于正文区域可渲染的数据组数；
	 * 当群组之间的间隔不固定时，计算的出的最大群组个数会大于正文区域可渲染的数据组数；
	 *
	 * @param {KChartConfig} config 绘制配置
	 * @param {Number} [width] 绘制实际宽度（当配置中指定的宽度为百分比字符串时使用）
	 * @returns {Number}
	 */
	KChartSketch.calcMaxGroupCount = function(config, width){
		var config_width = config.getConfigItemValue("width"),
			config_paddingLeft = config.getConfigItemValue("paddingLeft"),
			config_paddingRight = config.getConfigItemValue("paddingRight"),
			config_axisXTickOffset = config.getConfigItemValue("axisXTickOffset"),
			config_axisXTickOffsetFromRight = config.getConfigItemValue("axisXTickOffsetFromRight"),
			config_groupBarWidth = config.getConfigItemValue("groupBarWidth");

		var maxGroupGap = CommonChartConfig.getMaxGroupGap(config);

		// debugger;
		var axisXWidth = (util.isValidNumber(width)? width: config_width) - config_paddingLeft - config_paddingRight;
		var contentWidth = axisXWidth - config_axisXTickOffset - config_axisXTickOffsetFromRight;

		/* 柱状图可以超越正文区域的边界并显示出柱子宽度的一半（两侧都可以） */
		var newWidth = contentWidth + config_groupBarWidth - 1;

		var L = newWidth, B = config_groupBarWidth, G = maxGroupGap;
		return (function(){
			if(L <= 0 || B <= 0)
				return 0;
			if(G < 0)
				G = 0;

			var t = (B + G);
			if(t === 0)
				return 0;

			/* 从右向左逐个扣除柱子和间隙所占据的空间，进而得出可渲染的最大数据个数 */
			var i = 0, n = 0, tmp = L;
			while(true){
				if(tmp <= 0)
					return n;

				if(i % 2 === 0 || G === 0){/* 处理柱子 */
					if(tmp > 0){/* 只要剩余有空间，就可以绘制柱子，只不过是看不到全貌而已 */
						n += 1;
						tmp -= B;
					}
				}else{/* 处理间隙 */
					if(tmp < G)/* 不足够留作间隙 */
						return n;
					else
						tmp -= G;
				}

				i++;
			}
		})();
	};

	util.defineReadonlyProperty(TradeChart2, "KChartSketch", KChartSketch);
})();