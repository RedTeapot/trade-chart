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
 * @typedef {Object} KDataSketchConfig
 */

/**
 * @callback KDataParser
 * @param {Object} originalData 含有最高价、最低价、开盘价，收盘价等的任意格式的数据
 * @returns {KData}
 */