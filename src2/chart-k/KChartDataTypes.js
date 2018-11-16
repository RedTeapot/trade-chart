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
 */

/**
 * @typedef {Object} YTick 纵坐标刻度描述
 * @property {Number} y 纵坐标位置
 * @property {String} label 纵坐标标签
 */