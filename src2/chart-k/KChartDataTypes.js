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
 * @callback KDataParser K线数据解析器
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
 * @callback DataSketchAction 数据概览的生成方法
 * @param {KChart} kChart K线图实例
 * @param {KSubChartConfig} kSubChartConfig K线子图渲染配置
 * @returns {CommonDataSketch} 生成的数据概览实例
 */

/**
 * @typedef {Object} KSubChartImplementationMetadata K线子图实现的元数据描述
 * @property {Object} defaultConfig 子图的默认配置。配置仅被该子图所识别和支持
 // * @property {KSubChartChartSketchAction} chartSketchAction 子图图形素描的生成方法
 // * @property {DataSketchAction} dataSketchAction 子图数据概览的生成方法
 * @property {KSubChartRenderAction} renderAction 子图的渲染方法
 */