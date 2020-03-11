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
		 *    此时，将自动调整groupLineWidth和groupBarWidth，使得图形可以能够在一屏之内显示完全。如果n被忽略，则自动将n视为当前数据的总个数
		 */
		groupGap: 3
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

	/**
	 * 一个key可以在多个方面有不同的取值
	 * @param {String} setName 名称
	 * @param {*} defaultValue 没有指定方面时要返回的默认值
	 * @constructor
	 */
	var NameValueBindingSet = function(setName, defaultValue){
		util.defineReadonlyProperty(this, "name", setName);

		var bindingList = [];

		var getBinding = function(name){
			for(var i = 0; i < bindingList.length; i++)
				if(bindingList[i].name === name)
					return bindingList[i];

			return null;
		};

		this.has = function(aspect){
			var binding = getBinding(aspect);
			if(null === binding)
				return false;

			return true;
		};

		this.getValue = function(aspect){
			if(arguments.length === 0)
				return defaultValue;

			var binding = getBinding(aspect);
			if(null === binding)
				return null;

			return binding.getValue();
		};

		this.setValue = function(aspect, value){
			if(arguments.length === 1){/* setValue(defaultValue) */
				defaultValue = arguments[0];
			}else{
				var binding = getBinding(aspect);
				if(null === binding){
					binding = new NameValueBinding(aspect, value);
					bindingList.push(binding);
				}

				binding.setValue(value);
				return this;
			}
		};

		this.removeValue = function(aspect){
			var index = -1;
			for(var i = 0; i < bindingList.length; i++)
				if(bindingList[i].name === aspect){
					index = i;
					break;
				}

			if(index > -1)
				bindingList.splice(index, 1);

			return this;
		};
	};

	/**
	 * 绘制配置
	 * @param {Object} configContent 绘制配置
	 * @param {Object} dftConfigContent 默认绘制配置
	 *
	 * @constructor
	 */
	var CommonChartConfig = function(configContent, dftConfigContent){
		var self = this;

		configContent = configContent || {};
		dftConfigContent = dftConfigContent || {};
		util.setDftValue(configContent, dftConfigContent);

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
		 * 批量设置配置内容
		 * @param {Object} _configContent 绘制配置
		 * @returns {CommonChartConfig}
		 */
		this.setConfigContent = function(_configContent){
			configContent = util.setDftValue(_configContent, dftConfigContent);
			convertedConfigValue = {};

			return this;
		};

		/**
		 * 获取当前实例绑定的配置集合
		 * @returns {Object}
		 */
		this.getConfigContent = function(){
			return configContent;
		};

		/**
		 * 判断当前实例绑定的配置集合中是否含有指定的配置项，不包括上游配置
		 * @param {String} configItemName 配置项名称
		 * @returns {Boolean}
		 */
		this.isItemConfigured = function(configItemName){
			return configItemName in configContent;
		};

		/**
		 * 判断当前实例是否支持指定的配置项，不包括上游配置
		 * @param {String} name 配置项名称
		 * @returns {Boolean}
		 */
		this.supportsConfigItem = function(name){
			return name in dftConfigContent;
		};

		/**
		 * 获取当前实例支持的配置项名称列表，不包括上游配置
		 * @returns {String[]}
		 */
		this.getSupportedConfigItemNames = function(){
			var names = Object.keys(dftConfigContent);
			return names;
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
		var getConfigInstanceThatSupportsConfigItemOfName = function(name){
			var t = self;
			while(null != t){
				if(t.supportsConfigItem(name))
					return t;

				t = t.getUpstreamConfigInstance();
			}

			return null;
		};

		/**
		 * 获取指定名称对应的配置项取值。如果配置项取值的取值被做了转换，则返回转换后的值。配置项查找范围包括上游配置
		 * @param {String} name 配置项名称
		 * @param {String} [aspect=default] 配置项取值的转换方面
		 * @returns {*}
		 */
		this.getConfigItemValue = function(name, aspect){
			if(arguments.length < 2)
				aspect = "default";

			if(name in convertedConfigValue)
				return convertedConfigValue[name].getValue(aspect);
			else if(name in configContent){
				return configContent[name];
			}else if(name in dftConfigContent)
				return dftConfigContent[name];

			if(null != upstreamConfig)
				return upstreamConfig.getConfigItemValue(name, aspect);
			else
				return undefined;
		};

		/**
		 * 获取指定名称对应的配置项的原始取值（转换之前的取值）。配置项查找范围包括上游配置
		 * @param {String} name 配置项名称
		 * @returns {*}
		 */
		this.getOriginalConfigItemValue = function(name){
			if(name in configContent){
				return configContent[name];
			}else if(name in dftConfigContent)
				return dftConfigContent[name];

			if(null != upstreamConfig)
				return upstreamConfig.getOriginalConfigItemValue(name);
			else
				return null;
		};

		/**
		 * 设置配置项取值。配置项查找范围包括上游配置
		 * @param {String} name 配置项名称
		 * @param {*} value 配置项取值
		 * @returns {CommonChartConfig}
		 */
		this.setOriginalConfigItemValue = function(name, value){
			var instance = getConfigInstanceThatSupportsConfigItemOfName(name);

			if(null == instance){
				console.warn("Unknown chart config item: " + name);
				configContent[name] = value;
			}else
				instance.getConfigContent()[name] = value;

			return this;
		};

		/**
		 * 设置被转换了的配置项取值。配置项查找范围包括上游配置
		 * @param {String} name 配置项名称
		 * @param {*} convertedValue 转换后的配置项取值
		 * @param {String} [aspect=default] 配置项取值的转换方面
		 * @returns {CommonChartConfig}
		 */
		this.setConfigItemConvertedValue = function(name, convertedValue, aspect){
			if(arguments.length < 3)
				aspect = "default";

			var instance = getConfigInstanceThatSupportsConfigItemOfName(name);
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
		 * 移除设置的被转换了的配置项取值。配置项查找范围包括上游配置
		 * @param {String} name 配置项名称
		 * @param {String} [aspect=default] 配置项取值的转换方面
		 * @returns {CommonChartConfig}
		 */
		this.removeConfigItemConvertedValue = function(name, aspect){
			if(arguments.length < 3)
				aspect = "default";

			var instance = getConfigInstanceThatSupportsConfigItemOfName(name);
			var _convertedConfig;

			if(null == instance){
				console.warn("Unknown chart config item: " + name);
				_convertedConfig = convertedConfigValue;
			}else
				_convertedConfig = instance.getConvertedConfig();

			if(!(name in _convertedConfig))
				return this;

			_convertedConfig[name].removeValue(aspect);
			return this;
		};

		/**
		 * 重置指定的配置项取值为默认取值。配置项查找范围包括上游配置
		 * @param {String} name 配置项名称
		 * @returns {CommonChartConfig}
		 */
		this.resetConfigItemValueToDefault = function(name){
			var instance = getConfigInstanceThatSupportsConfigItemOfName(name);
			var _convertedConfig, _config;

			if(null == instance){
				console.warn("Unknown chart config item: " + name);
				_convertedConfig = convertedConfigValue;
				_config = configContent;
			}else{
				_convertedConfig = instance.getConvertedConfig();
				_config = instance.getConfigContent();
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

		/**
		 * 判断当前实例的配置是否与给定实例的配置等价
		 * @param {CommonChartConfig} configInstance 要比较的实例
		 * @param {String[]} [comparingConfigItemNames] 要比较的配置项名称列表。如果没有提供，或为空数组，则使用各自的局部配置进行比较，不包括上游配置
		 * @returns {Boolean}
		 */
		this.equalTo = function(configInstance, comparingConfigItemNames){
			if(configInstance === this)
				return true;
			if(!(configInstance instanceof CommonChartConfig))
				return false;

			if(!Array.isArray(comparingConfigItemNames) || comparingConfigItemNames.length === 0){
				var keys1 = this.getSupportedConfigItemNames(),
					keys2 = configInstance.getSupportedConfigItemNames();

				if(keys1.length !== keys2.length)
					return false;

				comparingConfigItemNames = keys1;
				for(var i = 0; i < keys2.length; i++){
					var k = keys2[i];
					if(comparingConfigItemNames.indexOf(k) === -1)
						comparingConfigItemNames.push(k);
				}
			}

			for(var i = 0; i < comparingConfigItemNames.length; i++){
				var name = comparingConfigItemNames[i];

				if(this.getConfigItemValue(name) !== configInstance.getConfigItemValue(name))
					return false;
			}

			return true;
		};
	};

	util.defineReadonlyProperty(TradeChart2, "CommonChartConfig", CommonChartConfig);
	util.defineReadonlyProperty(TradeChart2, "COMMON_DEFAULT_CONFIG", defaultConfig);
})();