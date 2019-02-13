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

	/* 内部状态位，用于控制是否输出日志，以辅助定位插件问题 */
	Chart.showLog = true;

	attachContext[attachName] = Chart;
})();