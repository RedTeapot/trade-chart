;(function(){
	var attachContext = window,
		attachName = "TradeChart2";
	
	if(attachName in attachContext){
		console.warn("Object: " + attachName + " exists already.");
		return;
	}

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

	attachContext[attachName] = CommonTradeChart;
})();