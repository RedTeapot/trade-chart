;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	/**
	 * 默认的，作用于所有类型图形的全局配置项
	 */
	var defaultConfig = {
		width: "100%",/** 图表整体宽度 */

		paddingLeft: 60,/** 图表内边距 - 左侧 */
		paddingRight: 20,/** 图表内边距 - 右侧 */

		groupLineWidth: 1,/** 绘制中间位置线的宽度。最好为奇数，从而使得线可以正好在正中间 */
		groupBarWidth: 5,/** 绘制柱的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间 */
		groupGap: 3,/** 相邻两组数据之间的间隔 */
	};
	Object.freeze && Object.freeze(defaultConfig);

	/**
	 * 绘制配置
	 * @param {Object} config 绘制配置
	 * @param {Object} dftConfig 默认绘制配置
	 *
	 * @constructor
	 */
	var CommonChartConfig = function(config, dftConfig){
		config = config || {};
		dftConfig = dftConfig || {};
		util.setDftValue(config, dftConfig);

		/* 上游配置 */
		var upstreamConfig = null;

		/**
		 * 取值被转换了的配置项集合。
		 * 部分配置项因为需要对外开放，所以可能具有一定的语义，但不利于程序工作，
		 * 此时可借助配置项取值转换，将识别语义后得到的对应的量化数字暂存起来，当
		 * 语义化的配置没有改变时，读取暂存的量化数字。
		 * 例如：对外开放的配置项：width 可以设置为100%，代表“与父容器宽度相当”，
		 * 但转换后的数字，即为具体的宽度像素值，如：1921。
		 *
		 * @type {Object<String, *>}
		 */
		var convertedConfigValue = {};



		/**
		 * 批量设置配置
		 * @param {Object} _config 绘制配置
		 * @returns {CommonChartConfig}
		 */
		this.setConfig = function(_config){
			config = util.setDftValue(_config, dftConfig);
			convertedConfigValue = {};

			return this;
		};

		/**
		 * 获取配置集合
		 * @returns {Object}
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * 判断是否含有指定的配置项
		 * @param {String} name 配置项名称
		 * @returns {Boolean}
		 */
		this.hasConfigItem = function(name){
			return name in config;
		};

		/**
		 * 判断是否支持指定的配置项
		 * @param {String} name 配置项名称
		 * @returns {Boolean}
		 */
		this.supportsConfigItem = function(name){
			return name in dftConfig;
		};

		/**
		 * 获取指定名称对应的配置项取值
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getConfigItemValue = function(name){
			if(name in convertedConfigValue)
				return convertedConfigValue[name];
			else if(name in config){
				return config[name];
			}else if(name in dftConfig)
				return dftConfig[name];

			if(null != upstreamConfig)
				return upstreamConfig.getConfigItemValue(name);
			else
				return null;
		};

		/**
		 * 设置配置项取值
		 * @param {String} name 配置项名称
		 * @param {*} value 配置项取值
		 * @returns {CommonChartConfig}
		 */
		this.setConfigItemValue = function(name, value){
			if(!this.supportsConfigItem(name)){
				console.warn("Unknown k chart config item: " + name);
			}

			config[name] = value;
			return this;
		};

		/**
		 * 设置被转换了的配置项取值
		 * @param {String} name 配置项名称
		 * @param {*} convertedValue 转换后的配置项取值
		 * @returns {CommonChartConfig}
		 */
		this.setConfigItemConvertedValue = function(name, convertedValue){
			if(!this.supportsConfigItem(name)){
				console.warn("Unknown k chart config item: " + name);
			}

			convertedConfigValue[name] = convertedValue;
			return this;
		};

		/**
		 * 移除设置的被转换了的配置项取值
		 * @param {String} name 配置项名称
		 * @returns {CommonChartConfig}
		 */
		this.removeConfigItemConvertedValue = function(name){
			if(!this.supportsConfigItem(name)){
				console.warn("Unknown k chart config item: " + name);
			}

			delete convertedConfigValue[name];
			return this;
		};

		/**
		 * 重置指定的配置项取值为默认取值
		 * @param {String} name 配置项名称
		 * @returns {CommonChartConfig}
		 */
		this.resetConfigItemValueToDefault = function(name){
			if(!this.supportsConfigItem(name)){
				console.warn("Unknown k chart config item: " + name);
			}

			delete config[name];
			delete convertedConfigValue[name];
			return this;
		};

		/**
		 * 设置上游配置实例
		 * @param {CommonChartConfig} c 上游配置
		 * @param {Boolean} [prependAsUpMost] 向上游添加为最上游的
		 * @returns {CommonChartConfig}
		 */
		this.setUpstreamConfigInstance = function(c, prependAsUpMost){
			if(arguments.length < 2)
				prependAsUpMost = false;

			if(!(c instanceof CommonChartConfig)){
				console.warn("Invalid upstream config. Type of CommonChartConfig is required.");
				return this;
			}

			if(prependAsUpMost){
				var t = this;
				while(true){
					var k = t.getUpstreamConfigInstance();
					if(null != k)
						t = k;
					else
						break;
				}

				t.setUpstreamConfigInstance(c);
				return this;
			}

			upstreamConfig = c;
			return this;
		};

		/**
		 * 获取上游配置实例
		 * @returns {CommonChartConfig|null}
		 */
		this.getUpstreamConfigInstance = function(){
			return upstreamConfig;
		};
	};

	util.defineReadonlyProperty(TradeChart2, "CommonChartConfig", CommonChartConfig);
	util.defineReadonlyProperty(TradeChart2, "COMMON_DEFAULT_CONFIG", defaultConfig);
})();