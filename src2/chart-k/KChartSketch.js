;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = TradeChart2.Big;

	var numBig = function(big){
		return Number(big.toString());
	};
	var floorBig = function(big){
		return Math.floor(numBig(big));
	};
	var ceilBig = function(big){
		return Math.ceil(numBig(big));
	};

	/**
	 * @constructor
	 * K线图形素描
	 */
	var KChartSketch = function(){
		/** 图表宽度（横坐标覆盖区域） */
		var width;
		/** 图表正文区域宽度 */
		var contentWidth;
		/** 可呈现的最多的数据组的个数 */
		var maxGroupCount;


		/**
		 * 获取图表宽度（横坐标覆盖区域）
		 * @returns {Number}
		 */
		this.getWidth = function(){
			return width;
		};

		/**
		 * 设置图表宽度（横坐标覆盖区域）
		 * @param {Number} v 图表宽度（横坐标覆盖区域）
		 * @returns {KChartSketch}
		 */
		this.setWidth = function(v){
			width = v;
			return this;
		};

		/**
		 * 获取图表正文区域宽度
		 * @returns {Number}
		 */
		this.getContentWidth = function(){
			return contentWidth;
		};

		/**
		 * 设置图表正文区域宽度
		 * @param {Number} v 图表正文区域宽度
		 * @returns {KChartSketch}
		 */
		this.setContentWidth = function(v){
			contentWidth = v;
			return this;
		};

		/**
		 * 获取可呈现的最多的数据组的个数
		 * @returns {Number}
		 */
		this.getMaxGroupCount = function(){
			return maxGroupCount;
		};

		/**
		 * 设置可呈现的最多的数据组的个数
		 * @param {Number} v 可呈现的最多的数据组的个数
		 * @returns {KChartSketch}
		 */
		this.setMaxGroupCount = function(v){
			maxGroupCount = v;
			return this;
		};
	};

	/**
	 * 获取指定名称的配置项取值。如果配置项并没有声明，则返回对应的默认配置。如果配置项无法识别，则返回undefined
	 * @param {String} name 配置项名称
	 * @param {KChartConfig} config 配置集合
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

		var config_width = getConfigItem("width", config),
			config_paddingLeft = getConfigItem("paddingLeft", config),
			config_paddingRight = getConfigItem("paddingRight", config),
			config_axisXTickOffset = getConfigItem("axisXTickOffset", config),
			config_axisXTickOffsetFromRight = getConfigItem("axisXTickOffsetFromRight", config),
			config_groupGap = getConfigItem("groupGap", config),
			config_groupBarWidth = getConfigItem("groupBarWidth", config);

		var widthBig = new Big(util.isValidNumber(width)? width: config_width).minus(config_paddingLeft).minus(config_paddingRight);
		var contentWidthBig = widthBig.minus(config_axisXTickOffset).minus(config_axisXTickOffsetFromRight);
		chartSketch.setWidth(floorBig(widthBig))
			.setContentWidth(floorBig(contentWidthBig))
			.setMaxGroupCount(KChartSketch.calcMaxGroupCount(config, width));

		return chartSketch;
	};

	/**
	 * 根据给定的配置计算可以绘制的最大数据个数
	 * @param {KChartConfig} config 绘制配置
	 * @param {Number} [width] 绘制宽度（当配置中指定的宽度为百分比字符串时使用）
	 * @returns {Number}
	 */
	KChartSketch.calcMaxGroupCount = function(config, width){
		var config_width = getConfigItem("width", config),
			config_paddingLeft = getConfigItem("paddingLeft", config),
			config_paddingRight = getConfigItem("paddingRight", config),
			config_axisXTickOffset = getConfigItem("axisXTickOffset", config),
			config_axisXTickOffsetFromRight = getConfigItem("axisXTickOffsetFromRight", config),
			config_groupGap = getConfigItem("groupGap", config),
			config_groupBarWidth = getConfigItem("groupBarWidth", config);

		// debugger;
		var widthBig = new Big(util.isValidNumber(width)? width: config_width).minus(config_paddingLeft).minus(config_paddingRight);
		var contentWidthBig = widthBig.minus(config_axisXTickOffset).minus(config_axisXTickOffsetFromRight);

		/* 柱状图可以超越正文区域的边界并显示出柱子宽度的一半（两侧都可以） */
		var newWidth = floorBig(contentWidthBig.plus(config_groupBarWidth).minus(1));

		var L = newWidth, B = config_groupBarWidth, G = config_groupGap;
		return (function(){
			if(L <= 0 || B <= 0)
				return 0;
			if(G < 0)
				G = 0;

			var t = (B + G);
			if(t === 0)
				return 0;

			var i = 0, n = 0, tmp = L;
			while(true){
				if(tmp <= 0)
					return n;

				if(i % 2 === 0 || G === 0){/* 处理柱子 */
					if(tmp >= B){
						n += 1;
						tmp -= B;
					}else{
						// if(tmp > 2){
						// 	n += 2;
						// 	tmp -= 2 * B;
						// }else
							if(tmp > 1){
							n += 1;
							tmp -= 1 * B;
						}
					}
				}else{/* 处理间隙 */
					if(tmp < G)
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