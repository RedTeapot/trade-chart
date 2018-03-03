;(function(){
	var attachContext = window,
		attachName = "TradeChart";
	
	if(attachName in attachContext){
		console.warn("Object: " + attachName + " exists already.");
		return;
	}
	
	/**
	 * 创建svg元素
	 * @param tag {String} 标签名称
	 */
	var createSvgElement = function(tag){
		return document.createElementNS("http://www.w3.org/2000/svg", tag);
	};
	
	/**
	 * 设定参数默认值
	 */
	var setDftValue = function(ops, dftOps){
		ops = ops || {};
		dftOps = dftOps || {};
		
		/* 参数不存在时，从默认参数中读取并赋值 */
		for(var p in dftOps)
		if(!(p in ops))
			ops[p] = dftOps[p];

		return ops;
	};
	
	/**
	 * 格式化钱数字
	 * @param amount {Number} 金额
	 * @param precision {Integer} 精度。默认2位
	 */
	var formatMoney = function(amount, precision){
		if(arguments.length < 2)
			precision = 2;
		
		if(amount >= 10000)
			return (amount / 10000).toFixed(precision).replace(/(\.[^0])0+/, "$1") + "万";
		if(amount >= 100000000)
			return (amount / 100000000).toFixed(precision).replace(/(\.[^0])0+/, "$1") + "亿";
		
		return amount.toFixed(precision).replace(/(\.[^0])0+/, "$1");
	};
	
	/**
	 * 克隆对象
	 * @param obj {Object} 要克隆的对象
	 * @param keepType {Boolean} 是否保持对象类型。默认为：true
	 */
	var cloneObject = function(obj, keepType){
		if(null === obj)
			return null;
		if(undefined === obj)
			return undefined;
		
		if(arguments.length < 2)
			keepType = true;
		
		var newObj = {};
		for(var p in obj){
			var v = obj[p];
			
			if((typeof v == "object") && !keepType){
				newObj[p] = cloneObject(v, true);
			}else
				newObj[p] = v;
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
	 * @param obj {HTMLElement} 要设置的元素
	 * @param props {JsonObject} 属性集合
	 */
	var setAttributes = function(obj, props){
		if(null == props)
			return;
		for(var p in props)
			obj.setAttribute(p, props[p]);
	};
	
	/**
	 * @constructor
	 * 图形构造基类
	 */
	var Chart = function(){
	};
	Chart.prototype = {};
	
	/**
	 * @constructor
	 * 分时图、K线图的原型构造器
	 */
	var CommonTradeChart = function(){
		Chart.apply(this, arguments);
	};
	CommonTradeChart.prototype = Object.create(Chart.prototype);
	
	/**
	 * 线性渐变
	 * @param colorStops {StringArray} 色阶数组。如："["5%, white", "100%, black"]"
	 */
	var LinearGradient = function(colorStops){
		var stops = [];
		
		colorStops && colorStops.forEach(function(pair){
			var tmp = pair.split(/:/.test(pair)? /\s*:\s*/: /\s*,\s*/);
			stops.push({offset: tmp[0], color: tmp[1]});
		});
		
		/**
		 * 添加色阶
		 * @param offset {String} 位置
		 * @param color {String} 色值
		 */
		this.addColorStop = function(offset, color){
			stops.push({offset: offset, color: color});
			
			return this;
		};
		
		/**
		 * 获取色阶配置
		 */
		this.getStops = function(){
			return stops;
		};
	};
	
	Object.defineProperty(CommonTradeChart, "LinearGradient", {value: LinearGradient, configurable: false, writable: false});
	
	/**
	 * 工具集合
	 */
	var util = {
		setDftValue: setDftValue,
		cloneObject: cloneObject,
		createSvgElement: createSvgElement,
		formatMoney: formatMoney,
		setAttributes: setAttributes,
		pixelRatio: pixelRatio
	};
	Object.defineProperty(CommonTradeChart, "util", {value: util, configurable: false, writable: false});
	
	/**
	 * 图表类集合
	 */
	var charts = {};
	Object.defineProperty(CommonTradeChart, "chart", {value: charts, configurable: false, writable: false});
	
	/**
	 * 图表定义
	 * @param name {String} 图表名称
	 * @param obj {Any} 图表实现
	 */
	Object.defineProperty(CommonTradeChart, "defineChart", {value: function(name, obj){
		if(name in charts)
			throw new Error("Chart of name: " + name + " exists already.");
		
		charts[name] = obj;
	}, configurable: false, writable: false});
	
	attachContext[attachName] = CommonTradeChart;
})();