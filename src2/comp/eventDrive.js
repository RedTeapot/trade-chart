;(function(){
	var TradeChart2 = window.TradeChart2;

	/**
	 * 附加至监听器的，代表“对于同一个触发源（对应于一次fire方法的调用），是否只执行一次”的属性名称
	 * @type {string}
	 */
	var attrName_ifTriggerOnlyOnceForTheSameTrigger = "__trade-chart2.if-exec-only-once-for-the-same-trigger__";

	/**
	 * @constructor
	 *
	 * 事件
	 * @param type {String} 事件类型（名称）
	 * @param data {JSON} 需要传递至监听器的数据
	 */
	var Event = function(type, data){
		this.type = type;
		this.timestamp = new Date().getTime();
		this.data = data;

		Object.freeze && Object.freeze(this);
	};

	var convertToArray = function(type){
		if(Array.isArray(type))
			return type;

		return String(type).replace(/(\s*,){2,}/, ",").toLowerCase().split(/\s*,\s*/);
	};

	/**
	 * 为指定的对象添加事件驱动机制
	 * @param {Object} obj 要添加事件驱动机制的对象
	 * @param {Object} [ctx=null] 监听器触发时的this上下文
	 */
	var eventDrive = function(obj, ctx){
		if(arguments.length < 2 || undefined === ctx)
			ctx = null;

		/* 所有事件处理器。key为事件类型字符串（全小写），value为对应添加的事件处理器数组 */
		var eventHandlers = {};

		var build = function(type){
			eventHandlers[type] = eventHandlers[type] || [];
		};

		/**
		 * 添加事件监听器
		 * @param {String|String[]} type 事件类型。可以同时传入多个类型，多个类型之间使用英文半角逗号分隔
		 * @param {Function} handler 事件处理器
		 * @param {Boolean} [ifExecHandleOnlyOnceForTheSameTrigger=true] 对于同一个触发源（对应于一次fire方法的调用），是否只执行一次
		 */
		obj.on = function(type, handler, ifExecHandleOnlyOnceForTheSameTrigger){
			if(typeof handler !== "function"){
				console.error("Illegal argument. Type of 'Function' is required.");
				return;
			}

			if(arguments.length < 3)
				ifExecHandleOnlyOnceForTheSameTrigger = true;

			handler[attrName_ifTriggerOnlyOnceForTheSameTrigger] = !!ifExecHandleOnlyOnceForTheSameTrigger;

			var types = convertToArray(type);
			for(var i = 0; i < types.length; i++){
				var _type = types[i];
				build(_type);
				if(eventHandlers[_type].indexOf(handler) !== -1){
					console.warn("Handle of name: '" + handler.name + "' for type: '" + type + "' exists already.");
					continue;
				}

				/* 加入列表 */
				eventHandlers[_type].push(handler);
			}
		};

		/**
		 * 移除事件监听器
		 * @param {String|String[]} type 事件类型。可以同时传入多个类型，多个类型之间使用英文半角逗号分隔
		 * @param {Function} handler 事件处理器
		 */
		obj.off = function(type, handler){
			if(typeof handler !== "function")
				return;

			var types = convertToArray(type);
			for(var i = 0; i < types.length; i++){
				var _type = types[i];
				build(_type);
				var index = eventHandlers[_type].indexOf(handler);
				if(index === -1)
					continue;

				/* 加入列表 */
				eventHandlers[_type].splice(index, 1);
			}
		};

		/**
		 * 触发事件
		 * @param {String|String[]} type 事件类型。可以同时传入多个类型，多个类型之间使用英文半角逗号分隔
		 * @param data {*} 附加的数据。亦即，需要传递至监听器的数据
		 * @param [async=true] {Boolean} 是否以异步的方式执行处理器
		 */
		obj.fire = function(type, data, async){
			if(arguments.length < 3)
				async = true;

			var executedHandlers = [];

			var types = convertToArray(type);
			for(var k = 0; k < types.length; k++){
				var _type = types[k];

				if(!(_type in eventHandlers) || eventHandlers[_type].length === 0)
					return;

				build(_type);
				var event = new Event(_type, data);

				/** 触发监听器 */
				var t = (function(event){
					return function(){

						for(var i = 0; i < eventHandlers[_type].length; i++){
							var handler = eventHandlers[_type][i];
							var isHandlerExecuted = executedHandlers.indexOf(handler) !== -1;

							/**
							 * 如果监听器设定为“对于同一个触发源（对应于一次fire方法的调用），只执行一次”，
							 * 且监听器已经执行过，则不再执行
							 */
							if(isHandlerExecuted && handler[attrName_ifTriggerOnlyOnceForTheSameTrigger])
								return;

							try{
								handler.call(ctx, event);
							}catch(e){
								console.error(e, e.stack);
							}

							if(!isHandlerExecuted)
								executedHandlers.push(handler);
						}
					};
				})(event);

				if(async)
					setTimeout(t, 0);
				else
					t();
			}
		};
	};

	TradeChart2.eventDrive = eventDrive;
})();