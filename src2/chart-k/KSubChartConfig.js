;(function(){
	var TradeChart2 = window.TradeChart2;
	var CommonChartConfig = TradeChart2.CommonChartConfig;
	var util = TradeChart2.util;

	/**
	 * @callback KSubChartConfig~axisYLabelVerticalOffset
	 * @param {Number} index 要绘制的纵坐标标签索引
	 * @param {Number} count 要绘制的纵坐标标签的个数
	 */

	/**
	 * @callback KSubChartConfig~axisYFormatter
	 * @param {Number} price 要格式化显示的价格
	 * @param {Object} config 绘制配置。综合了 KChartConfig 和 KSubChartConfig
	 */

	/**
	 * @callback KSubChartConfig~axisYAmountFloor
	 * @param {Number} min 要绘制的数据集中出现的最小数值
	 * @param {Number} max 要绘制的数据集中出现的最大数值
	 * @param {Number} avgVariation 要绘制的数据集中数据变化幅度的平均值（以每条数据的最大数值和最小数值计算变化幅度）
	 * @param {Number} maxVariation 要绘制的数据集中数据变化幅度的最大值
	 */

	/**
	 * @callback KSubChartConfig~axisYAmountCeiling
	 * @param {Number} min 要绘制的数据集中出现的最小数值
	 * @param {Number} max 要绘制的数据集中出现的最大数值
	 * @param {Number} avgVariation 要绘制的数据集中数据变化幅度的平均值（以每条数据的最大数值和最小数值计算变化幅度）
	 * @param {Number} maxVariation 要绘制的数据集中数据变化幅度的最大值
	 */

	/**
	 * 默认的，适用于K线图子图的通用配置项
	 */
	var defaultConfig = {
		height: 300,/** 图表整体高度 */

		coordinateBackground: null,/** 图标正文背景 */

		paddingTop: 20,/** 图表内边距 - 上侧 */
		paddingBottom: 20,/** 图表内边距 - 下侧 */

		showAxisXLine: true,/** 是否绘制横坐标轴 */
		showAxisXLabel: true,/** 是否绘制横坐标刻度值 */
		showAxisYLine: true,/** 是否绘制纵坐标轴 */
		showAxisYLabel: true,/** 是否绘制纵坐标刻度值 */

		showHorizontalGridLine: true,/** 是否绘制网格横线 */
		showVerticalGridLine: true,/** 是否绘制网格竖线 */
		horizontalGridLineColor: "#A0A0A0",/** 网格横线颜色 */
		verticalGridLineColor: "#A0A0A0",/** 网格竖线颜色 */
		gridLineDash: [1, 3, 3],/** 网格横线的虚线构造方法。如果需要用实线，则用 [1] 表示 */

		axisYPosition: "left",/** 纵坐标位置。left：左侧；right：右侧 */
		axisYLabelPosition: "outside",/** 纵坐标标签位置。outside：外侧；inside：内侧 */
		axisYLabelOffset: 5,/** 纵坐标标签距离坐标轴刻度线的距离 */
		axisYLabelFont: null,/** 纵坐标的坐标标签字体 */
		axisYLabelColor: null,/** 纵坐标的坐标标签颜色 */
		axisYLabelVerticalOffset: function(){/** 纵坐标标签纵向位移 */
			return 0;
		},
		axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
		/**
		 * 纵坐标的数字精度。仅在没有指定配置项：axisYFormatter时有效。如果指定了axisYFormatter，将直接使用指定的格式化方法返回的值。
		 * 1. {Number} 用于指定固定取值
		 * 2. {String} 字面量：auto[:n] 根据给定的数据自动检测。
		 *    其中，n为“Y轴刻度之间的量差精度比检测到数据精度大”时动态扩展的，用于提升刻度值准确性的精度幅度。
		 *    如果n被忽略，则自动将n视为1。
		 *    例如：如果检测到数据本身的精度为1，制定配置值为: 'auto:2'，则精度可能为 3
		 */
		axisYPrecision: "auto:1",
		axisYFormatter: function(price, config){/** 纵坐标数字格式化方法 */
			/** price：价格；config：配置 */
			return util.formatMoney(price, config.getConfigItemValue("axisYPrecision") || defaultConfig.axisYPrecision || 0);
		},
		axisYAmountFloor: null,/** 纵坐标的最小值 */
		axisYAmountFloorLabelFont: null,/** 纵坐标最小值的坐标标签字体 */
		axisYAmountFloorLabelColor: null,/** 纵坐标最小值的坐标标签颜色 */
		axisYAmountCeiling: null,/** 纵坐标的最大值 */
		axisYAmountCeilingLabelFont: null,/** 纵坐标最大值的坐标标签字体 */
		axisYAmountCeilingLabelColor: null,/** 纵坐标最大值的坐标标签颜色 */
	};
	Object.freeze && Object.freeze(defaultConfig);

	/**
	 * K线子图通用配置
	 * @param {Object} config
	 *
	 * @constructor
	 * @augments CommonChartConfig
	 */
	var KSubChartConfig = function(config){
		var dftConfig = util.setDftValue(null, defaultConfig);

		config = config || {};
		CommonChartConfig.call(this, config, dftConfig);
	};
	KSubChartConfig.prototype = Object.create(CommonChartConfig.prototype);

	util.defineReadonlyProperty(TradeChart2, "KSubChartConfig", KSubChartConfig);
	util.defineReadonlyProperty(TradeChart2, "K_SUB_DEFAULT_CONFIG", defaultConfig);
})();