;(function(){
	var TradeChart2 = window.TradeChart2;
	var CommonChartConfig = TradeChart2.CommonChartConfig;
	var util = TradeChart2.util;

	/**
	 * @callback KChartConfig~axisXLabelGenerator
	 * @param {KData} convertedData 转换后的K线数据
	 * @param {Number} index 数据在渲染的数据列表中的索引
	 * @param {KData} previousConvertedData 上一个标签对应的转换后的K线数据
	 * @param {KData} nextConvertedData 下一个标签对应的转换后的K线数据
	 */

	/**
	 * @callback KChartConfig~axisXLabelHorizontalAlign
	 * @param {Number} index 要绘制的横坐标标签索引
	 * @param {Number} count 要绘制的横坐标标签的个数
	 */

	/**
	 * 默认的，作用于主图和子图的全局配置项
	 */
	var defaultConfig = {
		axisTickLineLength: 6,/** 坐标轴刻度线的长度 */
		axisLabelFont: "normal 10px sans-serif, serif",/** 坐标标签字体 */
		axisLabelColor: null,/** 坐标标签颜色 */
		axisLineColor: null,/** 坐标轴颜色 */
		axisLineWidth: 0.5,/** 坐标轴线条宽度 */

		axisXTickOffset: 5,/** 横坐标刻度距离原点的位移（无论Y轴显示在哪侧，都应用在左侧） */
		axisXTickOffsetFromRight: 0,/** 最后一个横坐标刻度距离横坐标结束位置的位移 */
		axisXLabelOffset: 5,/** 横坐标标签距离坐标轴刻度线的距离 */
		axisXLabelSize: 55,/** 横坐标标签文字的长度（用于决定以何种方式绘制最后一个刻度：只绘制边界刻度，还是边界刻度和最后一个刻度都绘制） */
		axisXLabelGenerator: function(convertedData, index, previousConvertedData, nextConvertedData){/** 横坐标标签文字的输出方法 */
			return convertedData.time;
		},
		axisXLabelHorizontalAlign: function(i, n){/** 横坐标标签的水平对齐方式。start：左对齐；center：居中；end：右对齐 */
			return "center";
		}
	};
	Object.freeze && Object.freeze(defaultConfig);

	/**
	 * K线图绘制配置
	 * @param {Object} config
	 *
	 * @constructor
	 * @augments CommonChartConfig
	 */
	var KChartConfig = function(config){
		var dftConfig = util.setDftValue(null, defaultConfig);
		util.setDftValue(dftConfig, TradeChart2["COMMON_DEFAULT_CONFIG"]);

		config = config || {};
		CommonChartConfig.call(this, config, dftConfig);
	};
	KChartConfig.prototype = Object.create(CommonChartConfig.prototype);

	util.defineReadonlyProperty(TradeChart2, "KChartConfig", KChartConfig);
	util.defineReadonlyProperty(TradeChart2, "K_DEFAULT_CONFIG", defaultConfig);
})();