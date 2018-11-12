;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var eventDrive = TradeChart2.eventDrive;

	/**
	 * @typedef {KData|Object} UserSuppliedData 数据源，可以是本插件约定格式的数据，也可以是任意其它格式的数据。如果是其它格式的数据，则需要同步提供数据解析器，以指导本插件解析数据
	 */

	/**
	 * 事件名称：数据仓库中的数据发生了变更
	 * @type {string}
	 */
	var evtName_storedDataChanges = "storeddatachange";

	/**
	 * 事件名称：要渲染的第一条数据发生了变更
	 * @type {string}
	 */
	var evtName_renderingDataChanges = "renderingdatachange";

	/**
	 * @constructor
	 * K线图数据管理器
	 */
	var KDataManager = function(){
		var self = this;

		/** 数据数组 */
		var dataList = [];

		/** 数据转换方法，用于将提供的数据数组转为本图表兼容的格式 */
		var dataParser;

		/* 向右拖动时经过的，不再可见的较新的数据个数 */
		var elapsedDataCount = 0;

		/**
		 * 检查当前呈现的数据是否已经达到左侧极限
		 * @param {Number} maxGroupCount 最大显示数据量
		 * @returns {Boolean}
		 */
		this.checkIfReachesLeftLimit = function(maxGroupCount){
			return elapsedDataCount + maxGroupCount >= dataList.length;
		};

		/**
		 * 检查当前呈现的数据是否已经达到右侧极限
		 * @returns {Boolean}
		 */
		this.checkIfReachesRightLimit = function(){
			return elapsedDataCount === 0;
		};

		/**
		 * 使用给定的偏移量更新“向右拖动时经过的，不再可见的较新的数据个数”
		 * @param {Number} offset 偏移量
		 * @param {Number} [maxGroupCount] 最大显示数据量，用于锁定偏移量，使得没有更多数据时不会继续减少可见数据
		 * @returns {Boolean} 偏移量是否发生变更
		 */
		this.updateElapsedDataCountBy = function(offset, maxGroupCount){
			var v = elapsedDataCount + offset;
			v = Math.max(v, 0);
			v = Math.min(v, dataList.length - 1);

			if(util.isValidNumber(maxGroupCount)){
				maxGroupCount = util.parseAsNumber(maxGroupCount);

				if(dataList.length >= maxGroupCount){
					v = Math.min(v, dataList.length - maxGroupCount);
				}else
					v = 0;
			}

			if(v !== elapsedDataCount){
				elapsedDataCount = v;

				TradeChart2.showLog && console.log("Update elapsed data count to " + v + " from " + elapsedDataCount);
				this.fire(evtName_renderingDataChanges, null, false);
				return true;
			}

			return false;
		};

		/**
		 * 向前追加数据，亦即追加更早的数据
		 * @param {Array<UserSuppliedData>} datas 数据源
		 * @returns {KDataManager}
		 */
		this.prependDataList = function(datas){
			if(!Array.isArray(datas)){
				console.warn("Supplied k data should be an array.");
				return this;
			}

			dataList = datas.concat(dataList);
			this.fire(evtName_storedDataChanges, null, false);

			return this;
		};

		/**
		 * 向后追加数据，亦即追加较新的数据
		 * @param {Array<UserSuppliedData>} datas 数据源
		 * @param {Boolean} [ifResetsElapsedDataCount=false] 是否同步重置“向右拖动时经过的，不再可见的较新的数据个数”
		 * @returns {KDataManager}
		 */
		this.appendDataList = function(datas, ifResetsElapsedDataCount){
			if(arguments.length < 2)
				ifResetsElapsedDataCount = false;

			if(!Array.isArray(datas)){
				console.warn("Supplied k data should be an array.");
				return this;
			}

			dataList = dataList.concat(datas);
			if(!ifResetsElapsedDataCount)
				elapsedDataCount += datas.length;
			else{
				var flag = elapsedDataCount !== 0;
				elapsedDataCount = 0;

				if(flag)
					this.fire(evtName_renderingDataChanges, null, false);
			}
			this.fire(evtName_storedDataChanges, null, false);

			return this;
		};

		/**
		 * 设置数据源
		 * @param {Array<UserSuppliedData>} _datas 数据源
		 * @returns {KDataManager}
		 */
		this.setDataList = function(_datas){
			if(!Array.isArray(_datas)){
				console.warn("Supplied k data should be an array.");
				return this;
			}

			if(_datas !== dataList)
				this.fire(evtName_storedDataChanges, null, false);
			dataList = _datas;

			var ifChanges = false;
			if(elapsedDataCount !== 0)
				ifChanges = true;

			if(ifChanges)
				this.fire(evtName_renderingDataChanges, null, false);/* 数据发生变更，回到初始位置 */

			elapsedDataCount = 0;

			return this;
		};

		var convertData = function(d){
			if(null == d || typeof d !== "object")
				return d;

			if(typeof dataParser !== "function")
				return d;

			var index = dataList.indexOf(d);
			try{
				return dataParser(d, index, dataList);
			}catch(e){
				console.error("Fail to convert data of index: " + index + " using supplied data parser.", d);
				console.error(e);
				return d;
			}
		};

		/**
		 * 获取设置的数据源
		 * @returns {Array<UserSuppliedData>}
		 */
		this.getDataList = function(){
			return dataList;
		};

		/**
		 * 获取转换后的设置的数据源
		 * @returns {KData[]}
		 */
		this.getConvertedDataList = function(){
			return dataList.map(convertData);
		};

		/**
		 * 结合用户的拖动位置，从右向左获取可以被渲染的数据个数
		 *
		 * @param {Number} [maxGroupCount] 图形正文区域可以呈现的最大数据量
		 * @returns {Number}
		 */
		this.getRenderingDataCount = function(maxGroupCount){
			if(util.isValidNumber(maxGroupCount)){
				var endIndex = dataList.length - elapsedDataCount;
				var beginIndex = endIndex - maxGroupCount;
				if(beginIndex < 0)
					beginIndex = 0;

				return endIndex - beginIndex;
			}else
				return dataList.length - elapsedDataCount;
		};

		/**
		 * 结合用户的拖动位置，从右向左获取可以被渲染的数据列表
		 *
		 * @param {Number} [maxGroupCount] 图形正文区域可以呈现的最大数据量
		 * @returns {Array<UserSuppliedData>}
		 */
		this.getRenderingDataList = function(maxGroupCount){
			if(util.isValidNumber(maxGroupCount)){
				var endIndex = dataList.length - elapsedDataCount;
				var beginIndex = endIndex - maxGroupCount;
				if(beginIndex < 0)
					beginIndex = 0;

				return dataList.slice(beginIndex, endIndex);
			}else
				return dataList.slice(0, dataList.length - elapsedDataCount);
		};

		/**
		 * 结合用户的拖动位置，获取可以被渲染的数据列表。
		 * 没有拖动时，第一条被绘制的数据，应为提供的数据源中的第一个。
		 * 没有拖动时，绘制的第一个蜡烛图的正中间与正文区域的左侧重合。
		 *
		 * @param {Number} [maxGroupCount] 图形正文区域可以呈现的最大数据量
		 * @returns {KData[]}
		 */
		this.getConvertedRenderingDataList = function(maxGroupCount){
			var list = this.getRenderingDataList(maxGroupCount);
			if(typeof dataParser !== "function")
				return list;

			return list.map(convertData);
		};

		/**
		 * 获取向右拖动时经过的，不再可见的数据个数
		 * @returns {Number}
		 */
		this.getElapsedNewerDataCount = function(){
			return elapsedDataCount;
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
				console.warn("Out of bound access of index: " + index);
				return null;
			}

			return dataList[index];
		};

		/**
		 * 获取指定索引对应的被转换后的数据
		 * @param {Number} index 要获取的数据的索引
		 * @returns {KData}
		 */
		this.getConvertedData = function(index){
			var data = this.getData(index);
			if(null == data)
				return data;

			return convertData(data);
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