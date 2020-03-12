;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util,
		Big = TradeChart2.Big,
		CommonChart = TradeChart2.CommonChart,
		KChartConfig = TradeChart2.KChartConfig,
		CommonDataManager = TradeChart2.CommonDataManager,
		CommonChartConfig = TradeChart2.CommonChartConfig,
		CommonDataSketch = TradeChart2.CommonDataSketch,
		KChartSketch = TradeChart2.KChartSketch,
		KSubChart = TradeChart2.KSubChart,
		eventDrive = TradeChart2.eventDrive;

	/**
	 * K线子图实现
	 * @enum {KSubChart}
	 */
	var subChartImplementations = {};

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
			console.warn("K line with('groupLineWidth') should be odd(supplied: " + groupLineWidth + "), auto adjust to " + v);
			config.setOriginalConfigItemValue("groupLineWidth", groupLineWidth = v);
		}

		/* 柱宽需大于等于线宽+2 */
		var groupBarWidth = config.getConfigItemValue("groupBarWidth");
		var tmp = groupLineWidth + 2;
		if(groupBarWidth < tmp){
			console.warn("K chart bar width('groupBarWidth') should be >= group line width('groupLineWidth') + 2, auto adjust to " + tmp + ". Configured bar width: " + groupBarWidth + ", configured line with: " + groupLineWidth);
			config.setOriginalConfigItemValue("groupBarWidth", groupBarWidth = tmp);
		}
		if(groupBarWidth % 2 === 0){
			v = groupBarWidth + 1;
			console.warn("K bar width should odd(supplied: " + groupBarWidth + "), auto adjust to " + v);
			config.setOriginalConfigItemValue("groupBarWidth", groupBarWidth = v);
		}
	};

	/**
	 * 从给定的配置集合中获取指定名称的配置项取值。
	 * 如果给定的配置集合中不存在，则从K线图的全局配置中获取。
	 * 如果全局的配置中也不存在，则返回undefined
	 *
	 * @param {KChart} kChart K线图实例
	 * @param {String} name 配置项名称
	 * @param {KSubChartConfig} config K线子图渲染配置
	 */
	var _getConfigItem = function(kChart, name, config){
		if(config.supportsConfigItem(name))
			return config.getConfigItemValue(name);

		return kChart.getConfigItemValue(name);
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

		/** 附加的K线子图列表 */
		var attachedKSubCharts = [];


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
		 * 为该K线图创建指定类型的子图
		 * @param {String} subChartType 要创建的K线子图类型
		 * @returns {SubChart}
		 */
		this.newSubChart = function(subChartType){
			subChartType = String(subChartType).trim().toLowerCase();
			if(util.isEmptyString(subChartType))
				throw new Error("Illegal argument. Sub chart type should not be empty.");

			if(!(subChartType in subChartImplementations))
				throw new Error("K sub chart: '" + subChartType + "' is not implemented yet.");

			var kSubChart = new subChartImplementations[subChartType](this);
			attachedKSubCharts.push(kSubChart);

			return kSubChart;
		};

		/**
		 * 移除子图
		 * @param {KSubChart} subChart 要移除的子图
		 */
		this.removeSubChart = function(subChart){
			var index = attachedKSubCharts.indexOf(subChart);
			if(index !== -1)
				attachedKSubCharts.splice(index, 1);

			return this;
		};

		/**
		 * 计算横坐标正文区域左侧位置（坐标原点为：画布左上角）
		 * @returns {Number}
		 */
		this._calcAxisXContentLeftPosition = function(){
			var config_axisXTickOffset = this.getConfigItemValue("axisXTickOffset");

			var xLeft_axisX = this._calcAxisXLeftPosition();
			return xLeft_axisX + Math.floor(config_axisXTickOffset);
		};

		/**
		 * 计算横坐标正文区域右侧位置（坐标原点为：画布左上角）
		 * @param {Number} canvasWidth 画布宽度
		 * @returns {Number}
		 */
		this._calcAxisXContentRightPosition = function(canvasWidth){
			var config_axisXTickOffsetFromRight = this.getConfigItemValue("axisXTickOffsetFromRight");
			var xRight_axisX = this._calcAxisXRightPosition(canvasWidth);
			return xRight_axisX - Math.floor(config_axisXTickOffsetFromRight);
		};

		/**
		 * 计算横坐标正文区域的宽度
		 * @param {Number} [canvasWidth] 画布宽度
		 */
		this._calcAxisXContentWidth = function(canvasWidth){
			var config_axisXTickOffset = this.getConfigItemValue("axisXTickOffset"),
				config_axisXTickOffsetFromRight = this.getConfigItemValue("axisXTickOffsetFromRight");

			var axisXWidth = this._calcAxisXWidth(canvasWidth);
			return axisXWidth - config_axisXTickOffset - config_axisXTickOffsetFromRight;
		};
	};
	KChart.prototype = Object.create(CommonChart.prototype);

	/**
	 * 定义子图，提供子图的实现
	 * @param {String} subChartType 子图类型
	 * @param {KSubChartImplementationMetadata} metadata 实现的元数据描述
	 */
	KChart.implSubChart = function(subChartType, metadata){
		subChartType = String(subChartType || "").trim().toLowerCase();
		if(util.isEmptyString(subChartType))
			throw new Error("Illegal argument. Sub chart type should not be empty.");
		if(subChartType in subChartImplementations)
			throw new Error("K sub chart: '" + subChartType + "' was implemented already.");

		if(null == metadata || typeof metadata !== "object")
			throw new Error("Illegal argument. Sub chart implementation metadata should be of type: 'Object'.");
		var k = "renderAction";
		if(typeof metadata[k] !== "function")
			throw new Error("Illegal implementation metadata. No valid '" + k + "' property of type: 'Function' found.");

		var defaultConfig = metadata.defaultConfig || {};

		/**
		 * 默认的，适用于K线图子图的配置项
		 * @param {Object} config
		 *
		 * @constructor
		 * @augments CommonChartConfig
		 */
		var ImplConfig = function(config){
			var dftConfig = util.setDftValue(null, defaultConfig);
			util.setDftValue(dftConfig, TradeChart2["K_SUB_DEFAULT_CONFIG"]);

			config = config || {};
			CommonChartConfig.call(this, config, dftConfig);
		};
		ImplConfig.prototype = Object.create(CommonChartConfig.prototype);

		/**
		 * @constructor
		 * @augments KSubChart
		 * @this KSubChart
		 *
		 * K线图子图
		 * @param {KChart} kChart 附加该子图的K线图
		 */
		var Impl = function(kChart){
			KSubChart.call(this, kChart, subChartType);

			/* 关联子图配置与K线配置，使得可以从子图配置中获取所有配置 */
			var config = new ImplConfig().setUpstreamConfigInstance(kChart.getConfig(), true);

			/**
			 * 获取配置项集合
			 * @override
			 * @returns {KSubChartConfig}
			 */
			this.getConfig = function(){
				return config;
			};

			/**
			 * @override
			 *
			 * 渲染图形，并呈现至指定的画布中
			 * @param {HTMLCanvasElement} canvasObj 画布
			 * @param {Object} env 当前环境信息
			 * @param {Number} env.drawingOrderIndex 当前子图在该画布上的绘制顺序索引。第一个被绘制：0
			 *
			 * @returns {KSubChartRenderResult} K线子图绘制结果
			 */
			this.implRender = function(canvasObj, env){
				return metadata.renderAction.apply(this, arguments);
			};
		};
		Impl.prototype = Object.create(KSubChart.prototype);

		/**
		 * 扫描给定的K线子图实例，根据K线图实例中的数据生成素描
		 * @param {KSubChart} kSubChart K线子图实例
		 * @param {DataSketchMethod} [dataSketchMethod] 数据概览的生成方法
		 * @returns {CommonDataSketch}
		 */
		Impl.sketchData = function(kSubChart, dataSketchMethod){
			var kChart = kSubChart.getKChart();
			var instance = new CommonDataSketch();

			if(typeof dataSketchMethod !== "function")
				dataSketchMethod = metadata.dataSketchMethod;

			/* 扫描数据，初步得到概览 */
			var kDataManager = kChart.getDataManager();
			var dataList = kDataManager.getRenderingDataList();
			var dataSketch_origin_max = -Infinity,/* 最大价格 */
				dataSketch_origin_min = Infinity,/* 最小价格 */
				dataSketch_origin_avgVariation = 0,/* 价格的平均变动幅度 */
				dataSketch_origin_maxVariation = 0,/* 价格的最大变动幅度 */

				dataSketch_extended_priceCeiling = 0,/* 坐标中价格的最大值 */
				dataSketch_extended_priceFloor = 0,/* 坐标中价格的最小值 */
				dataSketch_extended_pricePrecision = 0;/* 坐标中价格的精度 */

			if(dataList.length === 0){
				dataSketch_origin_max = 0;
				dataSketch_origin_min = 0;
				dataSketch_origin_avgVariation = 0;
				dataSketch_origin_maxVariation = 0;
			}else if(typeof dataSketchMethod === "function"){
				var _sketch = dataSketchMethod.call(kSubChart, dataList);/* 使用原始数据获取扫描结果 */
				if(null != _sketch){
					dataSketch_origin_min = _sketch.origin_min || 0;
					dataSketch_origin_max = _sketch.origin_max || 0;
					dataSketch_origin_avgVariation = _sketch.origin_avgVariation || 0;
					dataSketch_origin_maxVariation = _sketch.origin_maxVariation || 0;
					dataSketch_extended_pricePrecision = _sketch.extended_pricePrecision || 0;

					/* 确定Y轴最小值 */
					var tmp = dataSketch_origin_avgVariation / 2;
					dataSketch_extended_priceFloor = util.parseAsNumber(dataSketch_origin_min, 0) - tmp;
					if(!isFinite(dataSketch_extended_priceFloor) || dataSketch_extended_priceFloor < 0)
						dataSketch_extended_priceFloor = 0;

					/* 确定Y轴最大值 */
					dataSketch_extended_priceCeiling = util.parseAsNumber(dataSketch_origin_max, 0) + tmp;
					if(!isFinite(dataSketch_extended_priceCeiling) || dataSketch_extended_priceCeiling < 0)
						dataSketch_extended_priceCeiling = dataSketch_extended_priceFloor;

					/* 确保最大值与最小值不同 */
					var threshold = 1e-8;
					if(Math.abs(dataSketch_extended_priceCeiling - dataSketch_extended_priceFloor) < threshold)
						dataSketch_extended_priceCeiling = dataSketch_extended_priceFloor * 1.3;
				}
			}
			instance.setMinAmount(dataSketch_origin_min)
				.setMaxAmount(dataSketch_origin_max)
				.setAvgAmountVariation(dataSketch_origin_avgVariation)
				.setMaxAmountVariation(dataSketch_origin_maxVariation)
				.setAmountFloor(dataSketch_extended_priceFloor)
				.setAmountCeiling(dataSketch_extended_priceCeiling)
				.setAmountPrecision(dataSketch_extended_pricePrecision);


			/* 根据渲染配置更新概览 */
			/* Y轴最小值 */
			var config_axisYAmountFloor = kSubChart.getConfigItemValue("axisYAmountFloor");
			var axisYAmountFloor;
			if(null != config_axisYAmountFloor){
				var isFunction = typeof config_axisYAmountFloor === "function";
				if(isFunction)
					axisYAmountFloor = util.try2Call(config_axisYAmountFloor, null,
						instance.getMinAmount(),
						instance.getMaxAmount(),
						instance.getAvgAmountVariation(),
						instance.getMaxAmountVariation()
					);
				else{
					if(!util.isValidNumber(config_axisYAmountFloor))
						console.warn("Invalid configuration value for 'axisYAmountFloor'. Type of 'Number' of 'Function' needed. Auto adjust to 0.");
					axisYAmountFloor = util.parseAsNumber(config_axisYAmountFloor, 0);
				}

				if(!isFinite(axisYAmountFloor) || axisYAmountFloor < 0){
					console.warn((isFunction? "Calculated": "Specified") + " 'axisYAmountFloor': " + axisYAmountFloor + " is infinite or lte 0, auto adjust to 0.");
					axisYAmountFloor = 0;
				}

				instance.setAmountFloor(axisYAmountFloor);
			}
			axisYAmountFloor = instance.getAmountFloor();

			/* Y轴最大值 */
			var config_axisYAmountCeiling = kSubChart.getConfigItemValue("axisYAmountCeiling");
			var axisYAmountCeiling;
			if(null != config_axisYAmountCeiling){
				var isFunction = typeof config_axisYAmountCeiling === "function";
				if(isFunction)
					axisYAmountCeiling = util.try2Call(config_axisYAmountCeiling, null,
						instance.getMinAmount(),
						instance.getMaxAmount(),
						instance.getAvgAmountVariation(),
						instance.getMaxAmountVariation()
					);
				else{
					if(!util.isValidNumber(config_axisYAmountCeiling))
						console.warn("Invalid configuration value for 'axisYAmountCeiling'. Type of 'Number' of 'Function' needed. Auto adjust to 0.");
					axisYAmountCeiling = util.parseAsNumber(axisYAmountCeiling, 0);
				}

				if(!isFinite(axisYAmountCeiling) || axisYAmountCeiling <= axisYAmountFloor)
					console.warn((isFunction? "Calculated": "Specified") + " 'axisYAmountCeiling': " + axisYAmountCeiling + " is infinite or lte 'axisYAmountFloor'(" + axisYAmountFloor + ")");
				else
					instance.setAmountCeiling(axisYAmountCeiling);
			}

			return instance;
		};

		/**
		 * 附加提供的实现元数据
		 * @type {KSubChartImplementationMetadata}
		 */
		Impl.metadata = util.cloneObject(metadata);
		Object.freeze && Object.freeze(Impl.metadata);

		subChartImplementations[subChartType] = Impl;
	};

	/**
	 * 获取给定子图的实现元数据
	 * @param {String} subChartType 子图类型
	 * @returns {KSubChartImplementationMetadata|null}
	 */
	KChart.getSubChartImplementationMetadata = function(subChartType){
		subChartType = String(subChartType || "").trim().toLowerCase();
		if(!(subChartType in subChartImplementations))
			return null;

		return subChartImplementations[subChartType].metadata;
	};

	/**
	 * 扫描给定的K线子图实例，根据K线图实例中的数据生成素描
	 * @param {KSubChart} kSubChart K线子图实例
	 * @param {DataSketchMethod} [dataSketchMethod] 数据概览的生成方法
	 * @returns {CommonDataSketch|null}
	 */
	KChart.sketchData = function(kSubChart, dataSketchMethod){
		var subChartType = kSubChart.getType().toLowerCase();
		if(!(subChartType in subChartImplementations))
			return null;

		return subChartImplementations[subChartType].sketchData(kSubChart, dataSketchMethod);
	};

	util.defineReadonlyProperty(TradeChart2, "KChart", KChart);
})();