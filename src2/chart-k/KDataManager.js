;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var eventDrive = TradeChart2.eventDrive;

	/**
	 * @constructor
	 * K线图数据管理器
	 */
	var KDataManager = function(){
		/** 数据数组 */
		var dataList = [];

		/** 数据转换方法，用于将提供的数据数组转为本图表兼容的格式 */
		var dataParser;

		/**
		 * 从初次绘制开始到现在，用户通过拖拉的方式达到的“绘制位置的横向位移”
		 * 取值为正，则代表图形向右移动；取值为负，则代表图形向左移动。
		 *
		 * @type {number}
		 */
		var renderingOffset = 0;

		/**
		 * 获取当前的“绘制位置的横向位移”
		 * @returns {Number}
		 */
		this.getRenderingOffset = function(){
			return renderingOffset;
		};

		/**
		 * 更新“绘制位置的横向位移”，使其在既有基础上累加上给定的偏移量
		 * @param {Number} amount 要累加的横向偏移量
		 * @returns {KDataManager}
		 */
		this.updateRenderingOffsetBy = function(amount){
			amount = Number(amount);
			if(isNaN(amount))
				amount = 0;

			renderingOffset += amount;

			if(amount !== 0)
				this.fire("renderoffsetchange", {renderingOffset: renderingOffset});

			return this;
		};

		/**
		 * 重置“绘制位置的横向位移”为0
		 * @returns {KDataManager}
		 */
		this.resetRenderingOffset = function(){
			if(renderingOffset !== 0)
				this.fire("renderoffsetchange", {renderingOffset: 0});

			renderingOffset = 0;
			return this;
		};

		/**
		 * 设置数据源
		 * @param {Array<KData|Object>} _datas 数据源，可以是本插件约定格式的数据，也可以是任意其它格式的数据。如果是其它格式的数据，则需要同步提供数据解析器，以指导本插件解析数据
		 * @returns {KDataManager}
		 */
		this.setDataList = function(_datas){
			if(!Array.isArray(_datas)){
				console.warn("Supplied k data should be an array.");
				return this;
			}

			dataList = _datas;
			return this;
		};

		/**
		 * 获取设置的数据源
		 * @returns {Array<KData|Object>}
		 */
		this.getDataList = function(){
			return dataList;
		};

		/**
		 * 结合用户的拖动位置，获取可以被渲染的数据列表。
		 * 没有拖动时，第一条被绘制的数据，应为提供的数据源中的第一个。
		 * 没有拖动时，绘制的第一个蜡烛图的正中间与正文区域的左侧重合。
		 *
		 * @returns {Array<KData|Object>}
		 */
		this.getRenderingDataList = function(){
			//TODO
			return dataList;
		};

		/**
		 * 获取指定索引对应的原始数据
		 * @param {Number} index 要获取的数据的索引
		 * @returns {KData|Object}
		 */
		this.getData = function(index){
			if(!util.isValidNumber(index))
				throw new Error("Invalid index: " + index + " to retrieve converted data.");

			index = util.parseAsNumber(index);
			if(index < 0 || index > dataList.length){
				console.warn("Out of bound access for converted data of index: " + index);
				return null;
			}

			return dataList[index];
		};

		/**
		 * 获取指定索引对应的被转换后的数据
		 * @param {Number} index 要获取的数据的索引
		 */
		this.getConvertedData = function(index){
			var data = this.getData(index);
			if(null == data)
				return data;

			if(typeof dataParser === "function"){
				try{
					data = dataParser(data, index, dataList);
				}catch(e){
					console.error("Fail to convert data of index: " + index + " using supplied data parser.", data);
					console.error(e);
				}
			}

			return data;
		};

		/**
		 * 设置数据转换方法，当要扫描的数据是其它格式的数据时，用于指导本插件解析数据的解析器
		 * @param parser {Function} 数据转换方法
		 * @returns {KDataManager}
		 */
		this.setDataParser = function(parser){
			if(typeof parser !== "function"){
				console.warn("Data parser should be of type: 'Function'.");
				return this;
			}

			dataParser = parser;
			return this;
		};

		/**
		 * 获取数据转换方法
		 * @return {Function} 数据转换方法
		 */
		this.getDataParser = function(){
			return dataParser;
		};

		eventDrive(this);
	};

	util.defineReadonlyProperty(TradeChart2, "KDataManager", KDataManager);
})();