;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	/**
	 * @callback GroupGapCalculator~implGetMinValue 自定义相邻两组数据之间的间隔时，间隙的可能最小值的获取方法
	 * @returns {Number}
	 */

	/**
	 * @callback GroupGapCalculator 相邻两组数据之间间隔的计算器
	 * @param {Number} leftDataOverallIndex 间隙左侧数据从左向右的全局索引
	 * @param {Number} rightDataOverallIndex 间隙右侧数据从左向右的全局索引
	 * @returns {Number} 该组数据左方需要留下的，与左侧数据之间的间隔。单位：像素
	 */

	/**
	 * 默认的，作用于所有类型图形的全局配置项
	 */
	var defaultConfig = {
		width: "100%",/** 图表整体宽度 */

		paddingLeft: 60,/** 图表内边距 - 左侧 */
		paddingRight: 20,/** 图表内边距 - 右侧 */

		groupLineWidth: 1,/** 绘制中间位置线的宽度。最好为奇数，从而使得线可以正好在正中间 */
		groupBarWidth: 5,/** 绘制柱的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间 */

		/**
		 * 相邻两组数据之间的间隔
		 * 1. {Number|GroupGapCalculator} 用于指定两组数据之间的固定间隔，如：1，function(){return 3;}等，单位：像素
		 * 2. {String} 字面量：autoDividedByFixedGroupCount:n 用于将可用绘制空间自动计算后平均分摊至要呈现的，固定总组数的数据之间，其中n等于数据的总群组个数。
		 *    此时，将自动调整groupLineWidth和groupBarWidth，使得图形可以能够在一屏之内显示完全
		 */
		groupGap: 3,
	};
	Object.freeze && Object.freeze(defaultConfig);

	var NameValueBinding = function(n, v){
		util.defineReadonlyProperty(this, "name", n);

		this.getValue = function(){
			return v;
		};

		this.setValue = function(_v){
			v = _v;
			return this;
		};
	};

	var NameValueBindingSet = function(setName, defaultValue){
		var bindingList = [];

		var getBinding = function(name){
			for(var i = 0; i < bindingList.length; i++)
				if(bindingList[i].name === name)
					return bindingList[i];

			return null;
		};

		util.defineReadonlyProperty(this, "name", setName);

		this.has = function(name){
			var binding = getBinding(name);
			if(null === binding)
				return false;

			return true;
		};

		this.getValue = function(name){
			if(arguments.length === 0)
				return defaultValue;

			var binding = getBinding(name);
			if(null === binding)
				return null;

			return binding.getValue();
		};

		this.setValue = function(name, value){
			if(arguments.length === 1){
				defaultValue = arguments[0];
			}else{
				var binding = getBinding(name);
				if(null === binding){
					binding = new NameValueBinding(name, value);
					bindingList.push(binding);
				}

				binding.setValue(value);
				return this;
			}
		};
	};

	/**
	 * 获取指定名称的配置项取值。如果配置项并没有声明，则返回对应的默认配置。如果配置项无法识别，则返回undefined
	 * @param {String} name 配置项名称
	 * @param {Object} config 配置集合
	 * @returns {*}
	 */
	var getConfigItem = function(name, config){
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
	 * 获取相邻两组数据之间间隙的最小值
	 * @param {Object} config 配置集合
	 * @returns {Number|null}
	 */
	var getMinGroupGap = function(config){
		var config_groupGap = getConfigItem("groupGap", config);

		var t = typeof config_groupGap;
		if(t === "number")
			return config_groupGap;
		else if(t === "function"){
			if(typeof config_groupGap.implGetMinValue === "function")
				return util.try2Call(config_groupGap.implGetMinValue);
			else{
				console.error("No method of name: 'implGetMinValue' found in given group gap calculator, using constant 0 instead.", config_groupGap);
				return 0;
			}
		}else if(/^autoDividedByFixedGroupCount:\d+$/.test(String(config_groupGap).trim()))
			return 0;
		else{
			console.error("Can not determine the min group gap by value: " + config_groupGap + ", using constant 0 instead.");
			return 0;
		}
	};

	/**
	 * 绘制配置
	 * @param {Object} config 绘制配置
	 * @param {Object} dftConfig 默认绘制配置
	 *
	 * @constructor
	 */
	var CommonChartConfig = function(config, dftConfig){
		var self = this;

		config = config || {};
		dftConfig = dftConfig || {};
		util.setDftValue(config, dftConfig);

		/* 上游配置 */
		var upstreamConfig = null;

		/**
		 * 取值被转换了的配置项集合。
		 * 部分配置项因为需要对外开放，所以可能具有一定的语义，但不利于程序工作。
		 * 此时可借助配置项取值转换，将识别语义后得到的对应的量化数字暂存起来，当
		 * 语义化的配置没有改变时，读取暂存的量化数字。
		 * 例如：对外开放的配置项：width 可以设置为100%，代表“与父容器宽度相当”，
		 * 但转换后的数字，代表的是具体的宽度像素值，如：1921。
		 *
		 * @type {Object<String, NameValueBindingSet>}
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
		 * 获取当前实例绑定的配置集合
		 * @returns {Object}
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * 判断当前实例绑定的配置集合中是否含有指定的配置项
		 * @param {String} name 配置项名称
		 * @returns {Boolean}
		 */
		this.hasConfigItem = function(name){
			return name in config;
		};

		/**
		 * 判断当前实例是否支持指定的配置项
		 * @param {String} name 配置项名称
		 * @returns {Boolean}
		 */
		this.supportsConfigItem = function(name){
			return name in dftConfig;
		};

		/**
		 * 获取当前实例绑定的取值转换了的配置项集合
		 * @returns {Object<String, NameValueBindingSet>}
		 */
		this.getConvertedConfig = function(){
			return convertedConfigValue;
		};

		/**
		 * 从当前位置开始向上游查找支持给定配置项的配置实例。如果没有配置实例支持该配置项，则返回null
		 * @param {String} name 配置项名称
		 * @returns {CommonChartConfig}
		 */
		var getConfigInstanceThatSupportsConfigItem = function(name){
			var t = self;
			while(null != t){
				if(t.supportsConfigItem(name))
					return t;

				t = t.getUpstreamConfigInstance();
			}

			return null;
		};

		/**
		 * 获取指定名称对应的配置项取值。如果配置项取值的取值被做了转换，则返回转换后的值
		 * @param {String} name 配置项名称
		 * @param {String} [aspect=default] 配置项取值的转换方面
		 * @returns {*}
		 */
		this.getConfigItemValue = function(name, aspect){
			if(arguments.length < 2)
				aspect = "default";

			if(name in convertedConfigValue)
				return convertedConfigValue[name].getValue();
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
		 * 获取指定名称对应的配置项的原始取值（转换之前的取值）
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getOriginalConfigItemValue = function(name){
			if(name in config){
				return config[name];
			}else if(name in dftConfig)
				return dftConfig[name];

			if(null != upstreamConfig)
				return upstreamConfig.getOriginalConfigItemValue(name);
			else
				return null;
		};

		/**
		 * 设置配置项取值
		 * @param {String} name 配置项名称
		 * @param {*} value 配置项取值
		 * @returns {CommonChartConfig}
		 */
		this.setOriginalConfigItemValue = function(name, value){
			var instance = getConfigInstanceThatSupportsConfigItem(name);

			if(null == instance){
				console.warn("Unknown chart config item: " + name);
				config[name] = value;
			}else
				instance.getConfig()[name] = value;

			return this;
		};

		/**
		 * 设置被转换了的配置项取值
		 * @param {String} name 配置项名称
		 * @param {*} convertedValue 转换后的配置项取值
		 * @param {String} [aspect=default] 配置项取值的转换方面
		 * @returns {CommonChartConfig}
		 */
		this.setConfigItemConvertedValue = function(name, convertedValue, aspect){
			if(arguments.length < 3)
				aspect = "default";

			var instance = getConfigInstanceThatSupportsConfigItem(name);
			var _convertedConfig;

			if(null == instance){
				console.warn("Unknown chart config item: " + name);
				_convertedConfig = convertedConfigValue;
			}else
				_convertedConfig = instance.getConvertedConfig();

			if(!(name in _convertedConfig))
				_convertedConfig[name] = new NameValueBindingSet(name, arguments.length < 3? convertedValue: null);
			_convertedConfig[name].setValue(aspect, convertedValue);

			return this;
		};

		/**
		 * 移除设置的被转换了的配置项取值
		 * @param {String} name 配置项名称
		 * @returns {CommonChartConfig}
		 */
		this.removeConfigItemConvertedValue = function(name){
			var instance = getConfigInstanceThatSupportsConfigItem(name);
			var _convertedConfig;

			if(null == instance){
				console.warn("Unknown chart config item: " + name);
				_convertedConfig = convertedConfigValue;
			}else
				_convertedConfig = instance.getConvertedConfig();

			delete _convertedConfig[name];
			return this;
		};

		/**
		 * 重置指定的配置项取值为默认取值
		 * @param {String} name 配置项名称
		 * @returns {CommonChartConfig}
		 */
		this.resetConfigItemValueToDefault = function(name){
			var instance = getConfigInstanceThatSupportsConfigItem(name);
			var _convertedConfig, _config;

			if(null == instance){
				console.warn("Unknown chart config item: " + name);
				_convertedConfig = convertedConfigValue;
				_config = config;
			}else{
				_convertedConfig = instance.getConvertedConfig();
				_config = instance.getConfig();
			}

			delete _config[name];
			delete _convertedConfig[name];
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

	/**
	 * 获取相邻两组数据之间间隙的最小值
	 * @param {Object} config 配置集合
	 * @returns {Number|null}
	 */
	CommonChartConfig.getMinGroupGap = getMinGroupGap;

	util.defineReadonlyProperty(TradeChart2, "CommonChartConfig", CommonChartConfig);
	util.defineReadonlyProperty(TradeChart2, "COMMON_DEFAULT_CONFIG", defaultConfig);
})();