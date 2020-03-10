;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var eventDrive = TradeChart2.eventDrive;

	/**
	 * @typedef {Object} UserSuppliedData 数据源，可以是本插件约定格式的数据，也可以是任意其它格式的数据。如果是其它格式的数据，则需要同步提供数据解析器，以指导本插件解析数据
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
	var attrName_dataAttachContext = "__trade-chart2.data-attach-context__";

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

		if(!(attrName_dataAttachContext in data))
			Object.defineProperty(data, attrName_dataAttachContext, {value: {}, writable: false, configurable: false, enumerable: false});

		return data[attrName_dataAttachContext];
	};

	/**
	 *
	 */

	/**
	 * @constructor
	 * 通用数据管理器
	 */
	var CommonDataManager = function(){
		var self = this;

		/** 数据数组 */
		var dataList = [];

		/** 数据转换方法，用于将提供的数据数组转为本图表兼容的格式 */
		var dataParser;

		/**
		 * 新附加的，即使拖动也不可见的数据量。
		 * 引入该元素，用于辅助确定图形向右拖动时的最大位移量，使得最早的数据可以恰好呈现在开始位置的正中间。
		 * 引入该元素后，即使在图形的向右拖动过程中附加新的图形数据，也不会影响要查阅的历史数据的集合，从而可以确定的计算最大位移量
		 *
		 * @type {number}
		 */
		var unrenderableGroupCount = 0;

		/** 向右拖动时经过的，不再可见的较新的数据个数 */
		var elapsedRenderableDataCount = 0;


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
		 * 获取数据总量
		 * @returns {number}
		 */
		this.getTotalGroupCount = function(){
			return dataList.length;
		};

		/**
		 * 获取可以被渲染的数据量
		 * @returns {Number}
		 */
		this.getRenderableGroupCount = function(){
			return dataList.length - unrenderableGroupCount;
		};

		/**
		 * 获取（新附加的）不能被渲染的数据量
		 * @returns {Number}
		 */
		this.getUnrenderableGroupCount = function(){
			return unrenderableGroupCount;
		};

		/**
		 * 结合用户的拖动位置，从右向左获取需要/正在被渲染的数据个数
		 * @param {Number} [expectedRenderingGroupCount] 期望要渲染的数据量
		 * @returns {Number} 实际可以被渲染的数据量（可能小于期望值）
		 */
		this.getRenderingGroupCount = function(expectedRenderingGroupCount){
			var renderableGroupCount = this.getRenderableGroupCount();
			var count = renderableGroupCount - elapsedRenderableDataCount;

			if(util.isValidNumber(expectedRenderingGroupCount)){
				var beginIndex = count - expectedRenderingGroupCount;
				if(beginIndex < 0)
					beginIndex = 0;

				return count - beginIndex;
			}else
				return count;
		};

		/**
		 * 获取向右拖动时经过的，消失的可以被渲染的数据个数
		 * @returns {Number}
		 */
		this.getElapsedRenderableGroupCount = function(){
			return elapsedRenderableDataCount;
		};

		/**
		 * 设置“向右拖动时经过的，不再可见的较新的数据个数”
		 * @param {Number} _elapsedRenderableGroupCount 个数
		 * @returns {CommonDataManager}
		 */
		this.setElapsedRenderableGroupCount = function(_elapsedRenderableGroupCount){
			if(elapsedRenderableDataCount !== _elapsedRenderableGroupCount){
				TradeChart2.showLog && console.log("Update elapsed data count to " + _elapsedRenderableGroupCount + " from " + elapsedRenderableDataCount);

				elapsedRenderableDataCount = _elapsedRenderableGroupCount;
				this.fire(evtName_renderingDataChanges, null, false);
				return true;
			}

			return false;
		};

		/**
		 * 获取当前自右向左第一个可以被绘制的数据的，自左向右的全局索引位置。
		 * 如果数据列表为空，则返回-1
		 * @returns {Number}
		 */
		this.getRightMostRenderableDataIndex = function(){
			if(0 === dataList.length)
				return -1;

			var t = unrenderableGroupCount;
			return dataList.length - 1 - t;
		};

		/**
		 * 获取当前自右向左第一个当前被渲染的数据的，自左向右的全局索引位置。
		 * 如果数据列表为空，则返回-1
		 * @returns {Number}
		 */
		this.getRightMostRenderingDataIndex = function(){
			var index = this.getRightMostRenderableDataIndex();
			if(-1 === index)
				return -1;

			return index - elapsedRenderableDataCount;
		};

		/**
		 * 获取当前自右向左第一个被渲染的数据的，自右向左的全局索引位置。
		 * 如果数据列表为空，则返回-1
		 * @returns {Number}
		 */
		this.getRightMostRenderingDataIndexFromRight = function(){
			if(0 === dataList.length)
				return -1;

			return unrenderableGroupCount + elapsedRenderableDataCount;
		};

		/**
		 * 检查最左侧的可以被渲染的数据当前是否已经被渲染并可见
		 * @param {Number} maxVisibleGroupCount 渲染出来可见的最大数据量
		 * @returns {Boolean}
		 */
		this.checkIfLeftMostRenderableGroupIsVisible = function(maxVisibleGroupCount){
			var renderableGroupCount = this.getRenderableGroupCount();
			if(renderableGroupCount <= maxVisibleGroupCount)
				return true;

			return elapsedRenderableDataCount + maxVisibleGroupCount >= renderableGroupCount;
		};

		/**
		 * 检查最右侧的可以被渲染的数据当前是否已经被渲染并可见
		 * @returns {Boolean}
		 */
		this.checkIfRightMostRenderableGroupIsVisible = function(){
			return elapsedRenderableDataCount === 0;
		};

		/**
		 * 向前追加数据，亦即追加更早的数据
		 * @param {Array<UserSuppliedData>} datas 数据源
		 * @returns {CommonDataManager}
		 */
		this.prependDataList = function(datas){
			if(!Array.isArray(datas)){
				console.warn("Supplied chart data should be an array.");
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
		 * @returns {CommonDataManager}
		 */
		this.appendDataList = function(datas, ifResetsElapsedDataCount){
			if(arguments.length < 2)
				ifResetsElapsedDataCount = false;

			if(!Array.isArray(datas)){
				console.warn("Supplied chart data should be an array.");
				return this;
			}

			var ifFireEvent_renderingDataChanges = false;

			dataList = dataList.concat(datas);
			if(!ifResetsElapsedDataCount){
				unrenderableGroupCount += datas.length;
			}else{
				var isRenderingLatestData = elapsedRenderableDataCount !== 0;

				elapsedRenderableDataCount = 0;
				unrenderableGroupCount = 0;

				/**
				 * 如果当前展现的数据是最新数据（追加前），则触发事件，
				 * 使得应用程序可以实现“最新数据发生变化时，能够通过简
				 * 单地更新数据实现自动重绘”的效果
				 */
				if(isRenderingLatestData)
					ifFireEvent_renderingDataChanges = true;
			}

			/**
			 * 将多个事件放在一个fire方法中调用，可以规避同一个监听器的连续多次执行。
			 * 如果监听器是图形绘制，则避免冗余绘制动作，提升绘制效率。
			 */
			if(ifFireEvent_renderingDataChanges)
				this.fire([evtName_renderingDataChanges, evtName_storedDataChanges], null, false);
			else
				this.fire(evtName_storedDataChanges, null, false);

			return this;
		};

		/**
		 * 设置数据源
		 * @param {Array<UserSuppliedData>} _dataList 数据源
		 * @param {String|String[]} [firingEventNames] 要同步发起的事件名称列表
		 * @returns {CommonDataManager}
		 */
		this.setDataList = function(_dataList, firingEventNames){
			if(!Array.isArray(_dataList)){
				console.warn("Supplied chart data should be an array.");
				return this;
			}

			if(arguments.length > 1 && !Array.isArray(firingEventNames))
				firingEventNames = [String(firingEventNames)];

			var ifDataChanges = _dataList !== dataList;
			if(!ifDataChanges)
				return this;

			dataList = _dataList;

			/**
			 * 将多个事件放在一个fire方法中调用，可以规避同一个监听器的连续多次执行。
			 * 如果监听器是图形绘制，则避免冗余绘制动作，提升绘制效率。
			 */
			var eventNames = [evtName_renderingDataChanges, evtName_storedDataChanges];
			if(Array.isArray(firingEventNames) && firingEventNames.length > 0){
				for(var i = 0; i < firingEventNames.length; i++){
					var firingEventName = firingEventNames[i];
					if(util.isEmptyString(firingEventName))
						continue;

					if(eventNames.indexOf(firingEventName) === -1)
						eventNames.push(firingEventName);
				}
			}
			this.fire(eventNames, null, false);

			elapsedRenderableDataCount = 0;
			unrenderableGroupCount = 0;

			return this;
		};

		/**
		 * 获取设置的数据源中的数据个数
		 * @returns {number}
		 */
		this.getDataCount = function(){
			return dataList.length;
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
		 * @returns {Object[]}
		 */
		this.getConvertedDataList = function(){
			return dataList.map(convertData);
		};

		/**
		 * 结合用户的拖动位置，获取被渲染的数据列表
		 * @param {Number} [expectedRenderingGroupCount] 期望要渲染的数据量
		 * @returns {UserSuppliedData[]}
		 */
		this.getRenderingDataList = function(expectedRenderingGroupCount){
			var visibleDataCount = this.getRenderableGroupCount();
			var endIndex = visibleDataCount - elapsedRenderableDataCount;

			if(util.isValidNumber(expectedRenderingGroupCount)){
				var beginIndex = endIndex - expectedRenderingGroupCount;
				if(beginIndex < 0)
					beginIndex = 0;

				return dataList.slice(beginIndex, endIndex);
			}else
				return dataList.slice(0, endIndex);
		};

		/**
		 * 结合用户的拖动位置，获取被渲染的数据列表
		 * @param {Number} [expectedRenderingGroupCount] 期望要渲染的数据量
		 * @returns {KData[]}
		 */
		this.getConvertedRenderingDataList = function(expectedRenderingGroupCount){
			var list = this.getRenderingDataList(expectedRenderingGroupCount);
			if(typeof dataParser !== "function")
				return list;

			return list.map(convertData);
		};

		/**
		 * 获取指定索引对应的原始数据
		 * @param {Number} index 要获取的数据的索引（自左向右）
		 * @returns {Object}
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
		 * 获取指定索引或原始数据对应的，被转换后的数据
		 * @param {Number|Object} index 要获取的数据的索引（自左向右），或原始数据
		 * @returns {Object}
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
				console.warn("Illegal argument. Type of 'Number' or 'Object' is required.", index);
		};

		/**
		 * 设置数据转换方法，当要扫描的数据是其它格式的数据时，用于指导本插件解析数据的解析器
		 * @param parser {Function} 数据转换方法
		 * @returns {CommonDataManager}
		 */
		this.setDataParser = function(parser){
			if(typeof parser !== "function"){
				console.warn("Illegal argument. Type of 'Function' is required.");
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
	 * 附加关联数据至给定的数据对象上
	 * @param {Object} data 要附加其它数据的数据对象
	 * @param {String} key 关联数据的唯一性标识
	 * @param {*} value 附加的数据内容
	 */
	CommonDataManager.attachData = function(data, key, value){
		if(null == data || typeof data !== "object")
			throw new Error("Attach target should be of type 'Object'.");

		buildDataAttachContext(data)[key] = value;
	};

	/**
	 * 从给定的数据上获取附加的其它关联数据
	 * @param {Object} data 附加了其它关联数据的数据对象
	 * @param {String} key 关联数据的唯一性标识
	 * @returns {*}
	 */
	CommonDataManager.getAttachedData = function(data, key){
		if(null == data || typeof data !== "object"){
			console.warn("Attach target should be of type 'Object'.");
			return null;
		}

		return buildDataAttachContext(data)[key];
	};

	/**
	 * 从给定的数据对象上移除可能附加有的其它数据
	 * @param {Object} data 可能附加了其它数据的数据对象
	 * @param {String} key 要移除的关联数据的唯一性标识
	 * @returns {*} 对应的附加数据
	 */
	CommonDataManager.removeAttachedData = function(data, key){
		if(null == data || typeof data !== "object")
			return null;

		if(!(attrName_dataAttachContext in data))
			return null;

		var val = data[attrName_dataAttachContext][key];
		delete data[attrName_dataAttachContext][key];
		return val;
	};

	util.defineReadonlyProperty(TradeChart2, "CommonDataManager", CommonDataManager);
})();