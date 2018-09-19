/**
 * @typedef {Object} KData
 *
 * @property {String} time 时间
 * @property {Number} openPrice 开盘价
 * @property {Number} highPrice 最高价
 * @property {Number} lowPrice 最低价
 * @property {Number} closePrice 收盘价
 */

/**
 * @callback KDataParser
 * @param {Object} originalData 含有最高价、最低价、开盘价，收盘价等任意格式的原始数据
 * @returns {KData}
 */

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
 * @callback KSubChartConfig_candle~axisYPriceFloor
 * @param {Number} min 要绘制的数据集中出现的最小数值
 * @param {Number} max 要绘制的数据集中出现的最大数值
 * @param {Number} avgVariation 要绘制的数据集中数据变化幅度的平均值（以每条数据的最大数值和最小数值计算变化幅度）
 * @param {Number} maxVariation 要绘制的数据集中数据变化幅度的最大值
 */

/**
 * @callback KSubChartConfig_volume~axisYPriceFloor
 * @param {Number} min 要绘制的数据集中出现的最小数值
 * @param {Number} max 要绘制的数据集中出现的最大数值
 * @param {Number} avgVariation 要绘制的数据集中数据变化幅度的平均值（以每条数据的最大数值和最小数值计算变化幅度）
 * @param {Number} maxVariation 要绘制的数据集中数据变化幅度的最大值
 */

/**
 * @callback KSubChartConfig_candle~axisYPriceCeiling
 * @param {Number} min 要绘制的数据集中出现的最小数值
 * @param {Number} max 要绘制的数据集中出现的最大数值
 * @param {Number} avgVariation 要绘制的数据集中数据变化幅度的平均值（以每条数据的最大数值和最小数值计算变化幅度）
 * @param {Number} maxVariation 要绘制的数据集中数据变化幅度的最大值
 */

/**
 * @callback KSubChartConfig_volume~axisYPriceCeiling
 * @param {Number} min 要绘制的数据集中出现的最小数值
 * @param {Number} max 要绘制的数据集中出现的最大数值
 * @param {Number} avgVariation 要绘制的数据集中数据变化幅度的平均值（以每条数据的最大数值和最小数值计算变化幅度）
 * @param {Number} maxVariation 要绘制的数据集中数据变化幅度的最大值
 */


/**
 * @typedef {Object} KChartConfig
 *
 * @property {String|Number} width 图表整体宽度。可以为固定的数字（单位：像素），也可以是相对画布Canvas父元素高度的百分比字符串，如：“100%”
 *
 * @property {Number} paddingLeft 图表内边距 - 左侧
 * @property {Number} paddingRight 图表内边距 - 右侧
 *
 * @property {Number} groupLineWidth 蜡烛线的宽度。最好为奇数，从而使得线可以正好在正中间
 * @property {Number} groupBarWidth 蜡烛的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间
 * @property {Number} groupGap 相邻两组数据之间的间隔
 *
 * @property {Number} axisTickLineLength 坐标轴刻度线的长度
 * @property {String} axisLabelFont 坐标标签字体
 * @property {String} axisLabelColor 坐标标签颜色
 * @property {String} axisLineColor 坐标轴颜色
 *
 * @property {Number} axisXTickOffset 横坐标刻度距离原点的位移（无论Y轴显示在哪侧，都应用在左侧）
 * @property {Number} axisXTickOffsetFromRight 最后一个横坐标刻度距离横坐标结束位置的位移
 * @property {Number} axisXLabelOffset 横坐标标签距离坐标轴刻度线的距离
 * @property {Number} axisXLabelSize 横坐标标签文字的长度（用于决定以何种方式绘制最后一个刻度：只绘制边界刻度，还是边界刻度和最后一个刻度都绘制）
 * @property {Function} axisXLabelGenerator 横坐标标签文字的输出方法
 * @property {String|Function} axisXLabelHorizontalAlign 横坐标标签的水平对齐方式。start：左对齐；center：居中；end：右对齐
 *
 * @property {String} axisYPosition 纵坐标位置。left：左侧；right：右侧
 * @property {String} axisYLabelPosition 纵坐标标签位置。outside：外侧；inside：内侧
 * @property {Number} axisYLabelOffset 纵坐标标签距离坐标轴刻度线的距离
 * @property {String} axisYLabelFont 纵坐标的坐标标签字体
 * @property {String} axisYLabelColor 纵坐标的坐标标签颜色
 */


/**
 * @typedef {Object} KSubChartConfig
 *
 * @property {String|Number} height 图表整体高度。可以为固定的数字（单位：像素），也可以是相对画布Canvas父元素高度的百分比字符串，如：“100%”
 *
 * @property {Number} paddingTop 图表内边距 - 上侧
 * @property {Number} paddingBottom 图表内边距 - 下侧
 *
 * @property {Boolean} showAxisXLine 是否绘制横坐标轴
 * @property {Boolean} showAxisXLabel 是否绘制横坐标刻度值
 * @property {Boolean} showAxisYLine 是否绘制纵坐标轴
 * @property {Boolean} showAxisYLabel 是否绘制纵坐标刻度值
 *
 * @property {Boolean} showHorizontalGridLine 是否绘制网格横线
 * @property {Boolean} showVerticalGridLine 是否绘制网格竖线
 * @property {String} horizontalGridLineColor 网格横线颜色
 * @property {String} verticalGridLineColor 网格竖线颜色
 * @property {Number[]} gridLineDash 网格横线的虚线构造方法。如果需要用实线，则用 [1] 表示
 *
 * @property {Number|Function} axisYLabelVerticalOffset 纵坐标标签纵向位移
 * @property {Number} axisYTickOffset 纵坐标刻度距离原点的位移
 * @property {Number} axisYMidTickQuota 纵坐标刻度个数（不包括最小值和最大值）
 * @property {Number|String} axisYPrecision 纵坐标的数字精度（仅在没有指定配置项：axisYFormatter时有效。如果指定了axisYFormatter，将直接使用指定的格式化方法返回的值）。auto：根据给定的数据自动检测
 * @property {Function} axisYFormatter 纵坐标数字格式化方法
 */

/**
 * @typedef {KSubChartConfig} KSubChartConfig_candle
 *
 * @property {Number|Function} axisYPriceFloor 纵坐标最小值
 * @property {String} axisYPriceFloorLabelFont 纵坐标最小值的坐标标签字体
 * @property {String} axisYPriceFloorLabelColor 纵坐标最小值的坐标标签颜色
 *
 * @property {Number|Function} axisYPriceCeiling 纵坐标最大值
 * @property {String} axisYPriceCeilingLabelFont 纵坐标最大值的坐标标签字体
 * @property {String} axisYPriceCeilingLabelColor 纵坐标最大值的坐标标签颜色
 *
 * @property {String} appreciatedColor 收盘价大于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色
 * @property {String} depreciatedColor 收盘价小于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色
 * @property {String} keepedColor 收盘价等于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色
 */

/**
 * @typedef {KSubChartConfig} KSubChartConfig_volume
 *
 * @property {Number|Function} axisYPriceFloor 纵坐标最小值
 * @property {String} axisYPriceFloorLabelFont 纵坐标最小值的坐标标签字体
 * @property {String} axisYPriceFloorLabelColor 纵坐标最小值的坐标标签颜色
 *
 * @property {Number|Function} axisYPriceCeiling 纵坐标最大值
 * @property {String} axisYPriceCeilingLabelFont 纵坐标最大值的坐标标签字体
 * @property {String} axisYPriceCeilingLabelColor 纵坐标最大值的坐标标签颜色
 *
 * @property {String} appreciatedColor 收盘价大于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色
 * @property {String} depreciatedColor 收盘价小于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色
 * @property {String} keepedColor 收盘价等于开盘价时，绘制蜡烛和线时用的画笔或油漆桶颜色
 */

/**
 * @typedef {Object} XTick
 * @property {Number} x 横坐标位置
 * @property {String} label 横坐标标签
 */

/**
 * @typedef {Object} YTick
 * @property {Number} y 纵坐标位置
 * @property {String} label 纵坐标标签
 */
