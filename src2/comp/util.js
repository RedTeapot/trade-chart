;(function(){
	var TradeChart2 = window.TradeChart2;

	/**
	 * 定义只读属性
	 * @param {Object} obj 目标对象
	 * @param {String} name 要定义的属性名称
	 * @param {*} value 要定义的取值
	 */
	var defineReadonlyProperty = function(obj, name, value){
		if(name in obj)
			return;

		Object.defineProperty(obj, name, {value: value, configurable: false, writable: false});
	};

	/**
	 * 设定参数默认值
	 * @param {Object|null} ops 要设置的目标参数集合
	 * @param {Object} dftOps 默认值集合
	 * @param {Function} [overrideCondition] 重载的判定条件
	 */
	var setDftValue = function(ops, dftOps, overrideCondition){
		ops = ops || {};
		dftOps = dftOps || {};

		if(arguments.length < 3 || typeof overrideCondition !== "function"){
			overrideCondition = function(ops, dftOps, p){
				return !(p in ops);
			};
		}

		/* 参数不存在时，从默认参数中读取并赋值 */
		for(var p in dftOps)
			if(overrideCondition(ops, dftOps, p))
				ops[p] = dftOps[p];

		return ops;
	};

	/**
	 * 格式化钱数字
	 * @param {Number} amount 金额
	 * @param {Number} precision 精度。默认2位
	 */
	var formatMoney = (function(){
		var arr = [[1000, "K"], [1000000, "M"], [1000000000, "G"]];

		return function(amount, precision){
			if(arguments.length < 2)
				precision = 2;

			for(var i = 0; i < arr.length; i++){
				if(amount >= arr[i][0])
					return util.cropPrecision(amount / arr[i][0], precision).replace(/(\.[^0])0+/, "$1") + arr[i][1];
			}

			return util.cropPrecision(amount, precision).replace(/(\.[^0])0+$/, "$1");
		};
	})();

	/**
	 * 克隆对象
	 * @param {Object} obj 要克隆的对象
	 * @param {Boolean} [deep=false] 是否深度克隆。深度克隆时，对象将会被拆解重新定义
	 */
	var cloneObject = function(obj, deep){
		if(null === obj)
			return null;
		if(undefined === obj)
			return undefined;

		if(arguments.length < 2)
			deep = false;

		var newObj = {};
		for(var p in obj){
			var v = obj[p];

			if(null == v || typeof v !== "object")
				newObj[p] = v;
			else{
				if(!deep)
					newObj[p] = v;
				else
					newObj[p] = cloneObject(v, true);
			}
		}

		return newObj;
	};

	/**
	 * 设备像素密度
	 */
	var pixelRatio = (function(){
		var ctx = document.createElement("canvas").getContext("2d"),
			dpr = window.devicePixelRatio || 1,
			bspr = ctx.webkitBackingStorePixelRatio ||
				ctx.mozBackingStorePixelRatio ||
				ctx.msBackingStorePixelRatio ||
				ctx.oBackingStorePixelRatio ||
				ctx.backingStorePixelRatio || 1;
		var ratio = dpr / bspr;

		return function(){
			return ratio;
		};
	})();

	/**
	 * 设置属性
	 * @param{HTMLElement} obj  要设置的元素
	 * @param {Object} props 属性集合
	 */
	var setAttributes = function(obj, props){
		if(null == props)
			return;
		for(var p in props)
			obj.setAttribute(p, props[p]);
	};

	/**
	 * 判断给定的字符串是否是空字符串
	 * @param {String} str 要判断的字符串
	 * @param {Boolean} [trim=true] 是否在判断前执行前后空白符号的裁剪操作
	 */
	var isEmptyString = function(str, trim){
		if(arguments.length < 2)
			trim = true;

		if(null === str || undefined === str)
			return true;

		str = String(str);
		if(trim)
			str = str.trim();

		return str.length === 0;
	};

	/**
	 * 获取事件
	 */
	var getEvent = function(args){
		var event = window.event || (function(args){
			while(args){
				if(args[0] && ("type" in args[0]) && (typeof args[0].preventDefault === "function") && ("ctrlKey" in args[0]) && ("altKey" in args[0]) && ("shiftKey" in args[0]))
					return args[0];

				args = args.callee.caller.arguments;
			}
		})(args);

		return event;
	};

	/**
	 * 尝试调用指定的方法
	 * @param {Function} func 待执行的方法
	 * @param {Object} ctx 方法执行时的this上下文
	 * @param {Arguments} args 方法参数列表对象
	 */
	var try2Apply = function(func, ctx, args){
		if(null === func || typeof func !== "function")
			return;

		try{
			return func.apply(ctx, args);
		}catch(e){
			console.error("Error occurred while executing function: " + func.name, e, e.stack);
			return undefined;
		}
	};

	/**
	 * 尝试调用指定的方法
	 * @param {Function} func 待执行的方法
	 * @param {Object} [ctx] 方法执行时的this上下文
	 * @param {*} args... 方法参数列表
	 */
	var try2Call = function(func, ctx, args){
		if(null === func || typeof func !== "function")
			return undefined;

		try{
			var len = arguments.length;

			if(len === 1)
				return func();
			else if(len === 2)
				return func.call(ctx);
			else if(len === 3)
				return func.call(ctx, arguments[2]);
			else if(len === 4)
				return func.call(ctx, arguments[2], arguments[3]);
			else if(len === 5)
				return func.call(ctx, arguments[2], arguments[3], arguments[4]);
			else if(len === 6)
				return func.call(ctx, arguments[2], arguments[3], arguments[4], arguments[5]);
			else if(len === 7)
				return func.call(ctx, arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
			else{
				var tmp = "", index = 2;
				for(var i = index; i < arguments.length; i++)
					tmp += ",arguments[" + i + "]";

				var rst;
				eval("rst = func.call(ctx" + tmp + ")");
				return rst;
			}
		}catch(e){
			console.error("Error occurred while executing function: " + func.name, e);
			return undefined;
		}
	};

	/**
	 * 将多个动作绑定为一个动作
	 * @param {Function[]} actions
	 * @returns {Function}
	 */
	var bindActions = function(actions){
		return function(){
			for(var i = 0; i < actions.length; i++)
				try2Apply(actions[i], null, arguments);
		};
	};

	/**
	 * 将给定的字符串自连n次后返回
	 * @param str {String} 要重复的字符串单元
	 * @param n {Number} 要重复的次数
	 * @return {String} 重复连接后的字符串
	 */
	var repeatString = function(str, n){
		var s = "";
		while(n-- > 0)
			s += str;
		return s;
	};

	/**
	 * 生成随机的唯一字符串
	 */
	var randomString = (function(){
		var i = 0, tailLength = 2;
		var alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

		var getTail = function(){
			var s = repeatString("0", tailLength) + (i++).toString(36);
			if(i > Math.pow(16, tailLength))
				i = 0;

			return s.substring(s.length -tailLength);
		};

		/**
		 * 生成随机的唯一字符串
		 * @param {String} [prefix=""] 前缀
		 * @param {Number} [len=10] 除前缀外，要随机生成的字符串的长度
		 */
		return function(prefix, len){
			if(arguments.length < 2)
				len = 10;
			if(arguments.length < 1)
				prefix = "";

			var minLen = tailLength + 1;
			if(len < minLen)
				throw new Error("Length should not be little than " + minLen);
			len -= tailLength;

			var str = "";
			while(len-- > 0){
				var index = Math.floor(Math.random() * alphabet.length);
				str += alphabet.charAt(index);
			}

			return prefix + str + getTail();
		};
	})();

	/**
	 * 判断给定的元素是否为一个合法的数字，或合法数字的字符串
	 * @param {*} tar 要判断的对象
	 */
	var isValidNumber = function(tar){
		if(typeof tar === "number")
			return true;

		var isEmpty = isEmptyString(tar, true);
		return !isEmpty && (/^-?\d*(?:\.\d+)?$/.test(tar) || /^\d+\.\d*$/.test(tar));
	};

	/**
	 * 解析给定的参数将其以数字形式返回
	 * @param {Big|*} tar 要解析的参数
	 * @param {Number} [dftValue] 如果要解析的参数不是一个合法的数字时，要返回的默认数字
	 * @returns {*}
	 */
	var parseAsNumber = function(tar, dftValue){
		if(typeof tar === "number")
			return tar;
		else{
			if(typeof tar === "string"){
				if(isValidNumber(tar))
					return Number(tar);
			}else if(tar instanceof TradeChart2.Big)
				return Number(tar.toString());

			if(arguments.length > 1)
				return Number(dftValue);

			return tar;
		}
	};

	/**
	 * 解析给定的参数将其以有穷数字形式返回
	 * @param {Big|*} tar 要解析的参数
	 * @param {Number} [dftValue] 如果要解析的参数不是一个合法的数字或不是有穷数字时，要返回的默认数字
	 * @returns {*}
	 */
	var parseAsFiniteNumber = function(tar, dftValue){
		tar = arguments.length > 1? parseAsNumber(tar, dftValue): parseAsNumber(tar);
		if(!isFinite(tar) && arguments.length > 1)
			return dftValue;

		return tar;
	};

	/**
	 * 从给定的数字中获取该数字所使用的精度
	 * @param {Number} num 数字
	 * @returns {Number}
	 */
	var getPrecision = function(num){
		if(null === num || undefined === num)
			return 0;

		var tmp = String(num);
		var lastDotIndex = tmp.lastIndexOf(".");
		if(-1 === lastDotIndex)
			return 0;

		return tmp.length - 1 - lastDotIndex;
	};

	/**
	 * 从给定的数字列表中获取最大的精度
	 * @param {Number[]} nums 数字列表
	 * @returns {Number|null}
	 */
	var getMaxPrecision = function(nums){
		if(!Array.isArray(nums))
			return null;

		var max = 0;
		for(var i = 0; i < nums.length; i++){
			var p = getPrecision(nums[i]);
			if(p > max)
				max = p;
		}

		return max;
	};

	/**
	 * 根据给定的精度截取给定数字的小数位
	 * @param {Number} num 要截取的数字
	 * @param {Number} [precision=0] 要保留的精度
	 * @returns {String}
	 */
	var cropPrecision = function(num, precision){
		if(arguments.length < 2)
			precision = 0;

		var str = String(num);
		var dotIndex = str.indexOf(".");
		if(-1 === dotIndex){
			if(precision === 0)
				return str;
			else
				return str + "." + repeatString("0", precision);
		}else{
			var d = str.substring(0, dotIndex);
			if(precision === 0)
				return d;

			str += repeatString("0", precision);
			return d + str.substring(dotIndex, dotIndex + 1 + precision);
		}


		return "";
	};

	/**
	 * 从给定的数字列表中检索最小的数字并返回
	 * @param {Number[]} nums 数字列表
	 * @returns {Number|null}
	 */
	var min = function(nums){
		if(!Array.isArray(nums) || nums.length === 0)
			return null;

		var min = Infinity;
		for(var i = 0; i < nums.length; i++){
			var p = parseAsNumber(nums[i], 0);
			if(p < min)
				min = p;
		}

		return min;
	};

	/**
	 * 从给定的数字列表中检索最大的数字并返回
	 * @param {Number[]} nums 数字列表
	 * @returns {Number|null}
	 */
	var max = function(nums){
		if(!Array.isArray(nums) || nums.length === 0)
			return null;

		var max = -Infinity;
		for(var i = 0; i < nums.length; i++){
			var p = parseAsNumber(nums[i], 0);
			if(p > max)
				max = p;
		}

		return max;
	};

	/**
	 * 从给定的数字列表中检索最小和最大的数字并返回
	 * @param {Number[]} nums 数字列表
	 * @returns {{min: Number, max: Number}|null}
	 */
	var minAndMax = function(nums){
		if(!Array.isArray(nums) || nums.length === 0)
			return null;

		var min = Infinity, max = -Infinity;
		for(var i = 0; i < nums.length; i++){
			var p = parseAsNumber(nums[i], 0);
			if(p < min)
				min = p;
			if(p > max)
				max = p;
		}

		return {min: min, max: max};
	};

	/**
	 * 使用给定的尺寸初始化画布
	 * @param {HTMLCanvasElement} canvasObj 要初始化的画布
	 * @param {Number} width 画布要呈现的宽度
	 * @param {Number} height 画布要呈现的高度
	 *
	 * @returns {CanvasRenderingContext2D}
	 */
	var canvasInitFlag = randomString("CANVAS_TRADE_CHART_INIT_FLAG");
	var initCanvas = function(canvasObj, width, height){
		var ctx = canvasObj.getContext("2d");

		if(canvasObj[canvasInitFlag]){
			return ctx;
		}

		/* 高分辨率适应 */
		var pr = pixelRatio();
		// pr = 1;
		if(pr > 1){
			canvasObj.style.width = width + "px";
			canvasObj.style.height = height + "px";

			setAttributes(canvasObj, {width: pr * width, height: pr * height});
		}else{
			canvasObj.style.width = "";
			canvasObj.style.height = "";

			setAttributes(canvasObj, {width: width, height: height});
		}

		ctx.scale(pr, pr);
		canvasObj.scale = pr;
		canvasObj[canvasInitFlag] = true;

		return ctx;
	};

	/**
	 * 获取画布特定区域的图像数据
	 * @param {CanvasRenderingContext2D} ctx 绘画上下文
	 * @param {Number} sx
	 * @param {Number} sy
	 * @param {Number} sw
	 * @param {Number} sh
	 * @returns {ImageData}
	 */
	var getCanvasImageData = function(ctx, sx, sy, sw, sh){
		var hScale, vScale;
		if(ctx.canvas[canvasInitFlag] && ctx.canvas.scale){
			hScale = vScale = ctx.canvas.scale;
		}else{
			var canvasOffsetWidth = ctx.canvas.offsetWidth, canvasOffsetHeight = ctx.canvas.offsetHeight;
			hScale = canvasOffsetWidth === 0? 1: (ctx.canvas.width / canvasOffsetWidth);
			vScale = canvasOffsetHeight === 0? 1: (ctx.canvas.height / canvasOffsetHeight);
		}

		sx *= hScale;
		sy *= vScale;
		sw *= hScale;
		sh *= vScale;

		return ctx.getImageData(sx, sy, sw, sh);
	};

	/**
	 * 将图像数据存放至给定画布的给定位置上
	 * @param ctx
	 * @param imageData
	 * @param dx
	 * @param dy
	 */
	var putCanvasImageData = function(ctx, imageData, dx, dy){
		var hScale, vScale;
		if(ctx.canvas[canvasInitFlag] && ctx.canvas.scale){
			hScale = vScale = ctx.canvas.scale;
		}else{
			var canvasOffsetWidth = ctx.canvas.offsetWidth, canvasOffsetHeight = ctx.canvas.offsetHeight;
			hScale = canvasOffsetWidth === 0? 1: (ctx.canvas.width / canvasOffsetWidth);
			vScale = canvasOffsetHeight === 0? 1: (ctx.canvas.height / canvasOffsetHeight);
		}

		dx *= hScale;
		dy *= vScale;

		ctx.putImageData(imageData, dx, dy);
	};

	/**
	 * 计算给定画布的渲染宽度
	 * @param {HTMLCanvasElement} canvasObj 要计算的画布
	 * @param {String|Number} configuredWidth 配置的绘制宽度。支持像素单位的数字和代表百分比的字符串（如：100%）
	 * @returns {Number}
	 */
	var calcRenderingWidth = function(canvasObj, configuredWidth){
		var width = configuredWidth;
		var r = /%/;
		if(r.test(configuredWidth))
			width = canvasObj.parentElement.clientWidth * parseInt(configuredWidth.replace(r, "")) / 100;

		return width;
	};

	/**
	 * 计算给定画布的渲染高度
	 * @param {HTMLCanvasElement} canvasObj 要计算的画布
	 * @param {String|Number} configuredHeight 配置的绘制高度。支持像素单位的数字和代表百分比的字符串（如：100%）
	 * @returns {Number}
	 */
	var calcRenderingHeight = function(canvasObj, configuredHeight){
		var height = configuredHeight;
		var r = /%/;
		if(r.test(configuredHeight))
			height = canvasObj.parentElement.clientHeight * parseInt(configuredHeight.replace(r, "")) / 100;

		return height;
	};

	/**
	 * 根据给定的数据计算返回对应在画布上可以清晰绘制线条的位置
	 * @param {String|Number|Big} d 坐标位置
	 */
	var getLinePosition = function(d){
		return Math.floor(Number(d)) + 0.5;
	};

	/**
	 * 将 Date 转化为指定格式的String
	 * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
	 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
	 * 例子：
	 * "yyyy-MM-dd hh:mm:ss.S" ==> 2006-07-02 08:09:04.423
	 * "yyyy-M-d h:m:s.S"     ==> 2006-7-2 8:9:4.18
	 */
	var formatDate = (function(){
		var zero = "0";
		var processingDate = null;

		var r_y = /y+/g,
			r_M = /M+/g,
			r_d = /d+/g,
			r_H = /H+/g,
			r_h = /h+/g,
			r_m = /m+/g,
			r_s = /s+/g,
			r_q = /q+/g,
			r_S = /S/g;

		var v_y = function(date){return String(date.getFullYear());},
			v_M = function(date){return String(date.getMonth() + 1);},
			v_d = function(date){return String(date.getDate());},
			v_H = function(date){return String(date.getHours());},
			v_h = function(date){var tmp = date.getHours() % 12; return String(tmp == 0? 12: tmp);},
			v_m = function(date){return String(date.getMinutes());},
			v_s = function(date){return String(date.getSeconds());},
			v_q = function(date){return String(Math.floor((date.getMonth() + 3) / 3));},
			v_S = function(date){return String(date.getMilliseconds());};

		var handleFactory = function(v){
			return function($0){
				var tmp = repeatString(zero, $0.length) + v(processingDate);
				return tmp.substring(tmp.length - $0.length);
			};
		};

		var handle_y = function($0){
				return v_y(processingDate).substring(4 - $0.length);
			},
			handle_S = function(){
				return v_S(processingDate);
			};
		var handle_M = handleFactory(v_M),
			handle_d = handleFactory(v_d),
			handle_H = handleFactory(v_H),
			handle_h = handleFactory(v_h),
			handle_m = handleFactory(v_m),
			handle_s = handleFactory(v_s),
			handle_q = handleFactory(v_q);


		return function(date, formatter){
			try{
				processingDate = date;
				return formatter.replace(r_y, handle_y)
				.replace(r_M, handle_M)
				.replace(r_d, handle_d)
				.replace(r_H, handle_H)
				.replace(r_h, handle_h)
				.replace(r_m, handle_m)
				.replace(r_s, handle_s)
				.replace(r_q, handle_q)
				.replace(r_S, handle_S);
			}finally{
				processingDate = null;
			}
		};
	})();

	/**
	 * 工具集合
	 */
	var util = {
		setDftValue: setDftValue,
		cloneObject: cloneObject,
		formatMoney: formatMoney,
		formatDate: formatDate,
		setAttributes: setAttributes,
		pixelRatio: pixelRatio,

		isValidNumber: isValidNumber,
		parseAsNumber: parseAsNumber,
		parseAsFiniteNumber: parseAsFiniteNumber,
		getPrecision: getPrecision,
		getMaxPrecision: getMaxPrecision,
		max: max,
		min: min,
		minAndMax: minAndMax,
		cropPrecision: cropPrecision,

		isEmptyString: isEmptyString,
		repeatString: repeatString,
		randomString: randomString,

		try2Call: try2Call,
		try2Apply: try2Apply,
		bindActions: bindActions,

		initCanvas: initCanvas,
		getCanvasImageData: getCanvasImageData,
		putCanvasImageData: putCanvasImageData,
		calcRenderingWidth: calcRenderingWidth,
		calcRenderingHeight: calcRenderingHeight,
		getLinePosition: getLinePosition,
		defineReadonlyProperty: defineReadonlyProperty
	};

	defineReadonlyProperty(TradeChart2, "util", util);
})();