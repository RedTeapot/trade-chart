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

	attachContext[attachName] = Chart;
})();