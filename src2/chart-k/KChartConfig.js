;(function(){
	var TradeChart2 = window.TradeChart2;
	var CommonChartConfig = TradeChart2.CommonChartConfig;
	var util = TradeChart2.util;

	/**
	 * @callback KChartConfig~axisXTickGenerateIndicator
	 * @param {KData} convertedData 转换后的K线数据
	 * @param {Object} env 当前的环境信息
	 * @param {KChart} env.kChart 当前的K线图实例
	 * @param {Number} env.dataOverallIndexFromRightToLeft 当前数据从右向左的全局索引
	 * @returns {Boolean} 是否需要为当前数据生成横坐标刻度
	 */

	/**
	 * @callback KChartConfig~axisXLabelGenerator
	 * @param {KData} convertedData 转换后的K线数据
	 * @param {Number} index 数据在渲染的数据列表中的索引
	 * @param {KData} previousConvertedData 上一个标签对应的转换后的K线数据
	 * @param {KData} nextConvertedData 下一个标签对应的转换后的K线数据
	 * @returns {String}
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

		axisXTickGenerateIndicator: function(convertedData, env){/* 特定数据对应的横坐标刻度绘制与否的指示器 */
			return env.dataOverallIndexFromRightToLeft % 10 === 0;
		},
		axisXTickOffset: 5,/** 横坐标刻度距离原点的位移（无论Y轴显示在哪侧，都应用在左侧） */
		axisXTickOffsetFromRight: 0,/** 最后一个横坐标刻度距离横坐标结束位置的位移 */
		axisXLabelOffset: 5,/** 横坐标标签距离坐标轴刻度线的距离 */
		axisXLabelSize: 55,/** 横坐标标签文字的长度（用于决定以何种方式绘制最后一个刻度：只绘制边界刻度，还是边界刻度和最后一个刻度都绘制） */
		/**
		 * 横坐标标签文字的输出方法
		 * 索引方向：从右向左
		 */
		axisXLabelGenerator: function(convertedData, index, previousConvertedData, nextConvertedData){
			if(null == convertedData)
				console.error("!", index);
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

		/* 合并通用配置，使得KChartConfig能够以“最顶级配置”的角色存在 */
		util.setDftValue(dftConfig, TradeChart2["COMMON_DEFAULT_CONFIG"]);

		config = config || {};
		CommonChartConfig.call(this, config, dftConfig);
	};
	KChartConfig.prototype = Object.create(CommonChartConfig.prototype);

	util.defineReadonlyProperty(TradeChart2, "KChartConfig", KChartConfig);
	util.defineReadonlyProperty(TradeChart2, "K_DEFAULT_CONFIG", defaultConfig);
})();