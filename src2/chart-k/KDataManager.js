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
	 * 附加至数据对象的，代表关联的其它数据存取上下文的属性名称
	 * @type {string}
	 */
	var attrName_dataAttachContext = "_trade-chart2.data-attach-context__";

	/**
	 * 为给定的数据对象创建用于附加其它关联数据的存取上下文
	 * @param {Object} data
	 * @returns {Object|null}
	 */
	var buildDataAttachContext = function (data) {
		if(null == data || typeof data !== "object"){
			console.warn("Data of type of 'Object' is required.");
			return null;
		}

		data[attrName_dataAttachContext] = data[attrName_dataAttachContext] || {};
		return data[attrName_dataAttachContext];
	};

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

		/**
		 * 新附加的，即使拖动也不可见的数据量。
		 * 引入该元素，用于辅助确定图形向右拖动时的最大位移量，使得最早的数据可以恰好呈现在开始位置的正中间。
		 * 引入该元素后，即使在图形的向右拖动过程中附加新的K线数据，也不会影响要查阅的历史数据的集合，从而可以确定的计算最大位移量
		 *
		 * @type {number}
		 */
		var invisibleDataCount = 0;

		/** 向右拖动时经过的，不再可见的较新的数据个数 */
		var elapsedDataCount = 0;


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
		 * 获取向右拖动时经过的，消失的数据个数
		 * @returns {Number}
		 */
		this.getElapsedVisibleDataCount = function(){
			return elapsedDataCount;
		};

		/**
		 * 获取可见的，或拖动后可见的数据量
		 * @returns {Number}
		 */
		this.getVisibleDataCount = function(){
			return dataList.length - invisibleDataCount;
		};

		/**
		 * 获取新附加的，即使拖动也不可见的数据量
		 * @returns {Number}
		 */
		this.getInvisibleDataCount = function(){
			return invisibleDataCount;
		};

		/**
		 * 获取自右向左的第一个被渲染的数据的自左向右索引位置。
		 * 如果数据列表为空，则返回-1
		 * @returns {Number|null}
		 */
		this.getFirstRenderingDataIndexFromRight = function(){
			if(0 === dataList.length)
				return -1;

			var t = invisibleDataCount + elapsedDataCount;
			return dataList.length - 1 - t;
		};

		/**
		 * 检查当前第一个可视数据是否已被呈现
		 * @param {Number} maxGroupCount 最大显示数据量
		 * @returns {Boolean}
		 */
		this.checkIfFirstVisibleDataIsShown = function(maxGroupCount){
			var visibleDataCount = this.getVisibleDataCount();
			if(visibleDataCount <= maxGroupCount)
				return true;

			return elapsedDataCount + maxGroupCount >= visibleDataCount;
		};

		/**
		 * 检查当前最后一个可视数据是否已被呈现
		 * @returns {Boolean}
		 */
		this.checkIfLastVisibleDataIsShown = function(){
			return elapsedDataCount === 0;
		};

		/**
		 * 使用给定的偏移量更新“向右拖动时经过的，消失的较新的数据个数”
		 * @param {Number} offset 偏移量
		 * @param {Number} [maxGroupCount] 最大显示数据量，用于锁定偏移量，使得没有更多数据时不会继续减少可见数据
		 * @returns {Boolean} 偏移量是否发生变更
		 */
		this.updateElapsedDataCountBy = function(offset, maxGroupCount){
			if(0 === offset)
				return false;

			var visibleDataCount = this.getVisibleDataCount();
			var v = elapsedDataCount + offset;
			v = Math.max(v, 0);
			v = Math.min(v, visibleDataCount - 1);
			v = Math.max(v, 0);

			if(util.isValidNumber(maxGroupCount)){
				maxGroupCount = util.parseAsNumber(maxGroupCount);

				if(visibleDataCount >= maxGroupCount){
					var maxCount = visibleDataCount - maxGroupCount;
					if(v > maxCount)
						v = maxCount;
				}else
					v = 0;
			}

			if(v !== elapsedDataCount){
				TradeChart2.showLog && console.log("Update elapsed data count to " + v + " from " + elapsedDataCount);
				elapsedDataCount = v;
				this.fire(evtName_renderingDataChanges, null, false);
				return true;
			}

			return false;
		};

		/**
		 * 设置“向右拖动时经过的，不再可见的较新的数据个数”
		 * @param {Number} _elapsedDataCount 个数
		 */
		this.setElapsedDataCount = function(_elapsedDataCount){
			if(elapsedDataCount !== _elapsedDataCount){
				TradeChart2.showLog && console.log("Update elapsed data count to " + _elapsedDataCount + " from " + elapsedDataCount);

				elapsedDataCount = _elapsedDataCount;
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
			if(!ifResetsElapsedDataCount){
				invisibleDataCount += datas.length;
			}else{
				var flag = elapsedDataCount !== 0;
				elapsedDataCount = 0;
				invisibleDataCount = 0;

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
			invisibleDataCount = 0;

			return this;
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
			var visibleDataCount = this.getVisibleDataCount();
			var count = visibleDataCount - elapsedDataCount;

			if(util.isValidNumber(maxGroupCount)){
				var beginIndex = count - maxGroupCount;
				if(beginIndex < 0)
					beginIndex = 0;

				return count - beginIndex;
			}else
				return count;
		};

		/**
		 * 结合用户的拖动位置，从右向左获取可以被渲染的数据列表
		 *
		 * @param {Number} [maxGroupCount] 图形正文区域可以呈现的最大数据量
		 * @returns {Array<UserSuppliedData>}
		 */
		this.getRenderingDataList = function(maxGroupCount){
			var visibleDataCount = this.getVisibleDataCount();
			var endIndex = visibleDataCount - elapsedDataCount;

			if(util.isValidNumber(maxGroupCount)){
				var beginIndex = endIndex - maxGroupCount;
				if(beginIndex < 0)
					beginIndex = 0;

				return dataList.slice(beginIndex, endIndex);
			}else
				return dataList.slice(0, endIndex);
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
		 * 获取指定索引，或原始数据对应的被转换后的数据
		 * @param {Number|Object} index 要获取的数据的索引，或原始数据
		 * @returns {KData}
		 */
		this.getConvertedData = function(index){
			if(typeof index === "number"){
				var data = this.getData(index);
				if(null == data)
					return data;

				return convertData(data);
			}else if(null != index && typeof index === 'object')
				return convertData(index);
			else
				console.warn("Illegal argument!", index);
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
		 * @returns {Function} 数据转换方法
		 */
		this.getDataParser = function(){
			return dataParser;
		};

		eventDrive(this);
	};

	/**
	 * 从给定的数据上获取附加的其它关联数据
	 * @param {Object} data 附加了其它关联数据的数据对象
	 * @param {String} key 关联数据的唯一性标识
	 * @returns {*}
	 */
	KDataManager.getAttachedData = function(data, key){
		if(null == data || typeof data !== "object"){
			console.warn("Attach target should be of type 'Object'");
			return null;
		}

		return buildDataAttachContext(data)[key];
	};

	/**
	 * 附加关联数据至给定的数据对象上
	 * @param {Object} data 要附加其它数据的数据对象
	 * @param {String} key 关联数据的唯一性标识
	 * @param {*} value 附加的数据内容
	 */
	KDataManager.setAttachedData = function(data, key, value){
		if(null == data || typeof data !== "object")
			throw new Error("Attach target should be of type 'Object'");

		buildDataAttachContext(data)[key] = value;
	};

	/**
	 * 从给定的数据对象上移除可能附加有的其它数据
	 * @param {Object} data 可能附加了其它数据的数据对象
	 * @param {String} key 要移除的关联数据的唯一性标识
	 * @returns {*} 对应的附加数据
	 */
	KDataManager.removeAttachedData = function(data, key){
		if(null == data || typeof data !== "object")
			return null;

		if(!(attrName_dataAttachContext in data))
			return null;

		var val = data[attrName_dataAttachContext][key];
		delete data[attrName_dataAttachContext][key];
		return val;
	};

	util.defineReadonlyProperty(TradeChart2, "KDataManager", KDataManager);
})();