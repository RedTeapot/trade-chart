/**
 * @typedef {Object} KData 默认所有图形都需要的数据
 * @property {String} time 时间
 */

/**
 * @typedef {Object} KData_Candle 柱状图需要的数据
 * @augments {KData}
 *
 * @property {Number} openPrice 开盘价
 * @property {Number} highPrice 最高价
 * @property {Number} lowPrice 最低价
 * @property {Number} closePrice 收盘价
 */

/**
 * @typedef {Object} KData_Trend 趋势图需要的数据
 * @augments {KData}
 *
 * @property {Number} closePrice 收盘价
 */

/**
 * @typedef {Object} KData_IndexMA MA指标图需要的数据
 * @augments {KData}
 *
 * @property {Number} closePrice 收盘价
 */

/**
 * @typedef {Object} KData_Volume 量图需要的数据
 * @augments {KData}
 *
 * @property {Number} volume 成交量
 */

/**
 * @typedef {Object} KData_Kebab 烤串图需要的数据
 * @augments {KData}
 *
 * @property {Number[]} priceList 价格列表
 */

/**
 * @callback DataParser K线数据解析器
 * @param {Object} originalData 含有最高价、最低价、开盘价，收盘价等任意格式的原始数据
 * @returns {KData}
 */

/**
 * @typedef {Object} XTick 横坐标刻度描述
 * @property {Number} x 横坐标位置
 * @property {String} label 横坐标标签
 * @property {Number} dataIndex 刻度对应的数据的全局索引
 */

/**
 * @typedef {Object} YTick 纵坐标刻度描述
 * @property {Number} y 纵坐标位置
 * @property {Number} amount 纵坐标对应的数值
 * @property {String} label 纵坐标标签
 */

/**
 * @typedef {Object} DataPosition 数据位置
 * @property {Number} x 横坐标位置
 * @property {Number} dataIndex 数据的全局索引
 */

/**
 * @callback KSubChartRenderAction K线子图渲染方法
 * @this {KSubChart}
 * @param {HTMLCanvasElement} canvasObj 画布
 * @param {Object} env 当前环境信息
 * @param {Number} env.drawingOrderIndex 当前子图在该画布上的绘制顺序索引。第一个被绘制：0
 */

/**
 * @callback KSubChartChartSketchAction K线子图素描的生成方法
 * @param {KSubChartConfig} config 绘制配置
 * @param {Number} [height] 绘制高度（当配置中指定的高度为百分比字符串时使用）
 * @returns {KSubChartSketch}
 */

/**
 * @typedef {Object} DataSketchResult 数据概览扫描结果
 * @property {Number} origin_min 原始数据中Y轴量的最小值
 * @property {Number} origin_max 原始数据中Y轴量的最大值
 * @property {Number} origin_avgVariation 原始数据中，每组数据Y轴量的最大值与最小值落差的平均值
 * @property {Number} origin_maxVariation 原始数据中，以组为单位统计的，Y轴量的最大值与最小值的最大落差
 * @property {Number} extended_pricePrecision 扫描得出的数据精度
 */

/**
 * @callback DataSketchMethod 数据概览的生成方法
 * @this {KSubChart}
 * @param {Object[]} originalDataList 要扫描的原始数据列表
 * @returns {DataSketchResult} 生成的数据概览实例
 */

/**
 * @typedef {Object} KSubChartImplementationMetadata K线子图实现的元数据描述
 * @property {Object} defaultConfig 子图的默认配置。配置仅被该子图所识别和支持
 * @property {DataSketchMethod} dataSketchMethod 默认的子图数据概览的生成方法。子图实例可以另外单独设置
 * @property {KSubChartRenderAction} renderAction 子图的渲染方法
 */

/**
 * @callback KSubChart_Kebab_GroupItemBackgroundGenerator K线子图：kebab图中，每个数据条目背景色的生成器
 * @param {Object} convertedData 转换后的数据
 * @param {Number} index 数据在渲染列表中的索引。索引方向：从右向左
 * @returns {String|null}
 */