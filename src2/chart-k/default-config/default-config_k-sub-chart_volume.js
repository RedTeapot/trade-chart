;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var Big = util.Big;

	var numBig = function(big){
		return Number(big.toString());
	};

	/**
	 * 默认的，适用于K线图“量图”子图的配置项
	 * @type {KSubChartConfig_volume}
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
		showVerticalGridLine: true,/** 是否绘制网格横线 */
		horizontalGridLineColor: "#A0A0A0",/** 网格横线颜色 */
		verticalGridLineColor: "#A0A0A0",/** 网格竖线颜色 */
		gridLineDash: [1, 3, 3],/** 网格横线的虚线构造方法。如果需要用实线，则用“[1]”表示 */

		axisYPosition: "left",/** 纵坐标位置。left：左侧；right：右侧 */
		axisYLabelPosition: "outside",/** 纵坐标标签位置。outside：外侧；inside：内侧 */
		axisYLabelOffset: 5,/** 纵坐标标签距离坐标轴刻度线的距离 */
		axisYLabelFont: null,/** 纵坐标的坐标标签字体 */
		axisYLabelColor: null,/** 纵坐标的坐标标签颜色 */
		axisYLabelVerticalOffset: function(){/** 纵坐标标签纵向位移 */
			return 0;
		},
		axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
		axisYPrecision: "auto",/** 纵坐标的数字精度（仅在没有指定配置项：axisYFormatter时有效。如果指定了axisYFormatter，将直接使用指定的格式化方法返回的值）。auto：根据给定的数据自动检测 */
		axisYFormatter: function(price, config){/** 纵坐标数字格式化方法 */
			/** price：价格；config：配置 */
			return util.formatMoney(price, config.axisYPrecision || defaultConfig.axisYPrecision || 0);
		},
		axisYAmountFloor: null,
		axisYAmountFloorLabelFont: null,/** 纵坐标最小值的坐标标签字体 */
		axisYAmountFloorLabelColor: null,/** 纵坐标最小值的坐标标签颜色 */
		axisYAmountCeiling: null,
		axisYAmountCeilingLabelFont: null,/** 纵坐标最小值的坐标标签字体 */
		axisYAmountCeilingLabelColor: null,/** 纵坐标最小值的坐标标签颜色 */

		appreciatedColor: "#d58c2a",/** 收盘价大于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
		depreciatedColor: "#21CB21",/** 收盘价小于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
		keepedColor: "#DEDEDE",/** 收盘价等于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色 */
	};
	Object.freeze && Object.freeze(defaultConfig);

	/* 暴露默认配置 */
	util.defineReadonlyProperty(TradeChart2, "K_SUB_VOLUME_DEFAULT_CONFIG", defaultConfig);
})();