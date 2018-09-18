;(function(){
	/**
	 * 加载数据
	 * @param callback {Function} 加载完成后执行的方法
	 */
	var loadData = function(callback){
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "data.js");
		xhr.onreadystatechange = function(){
			if(this.readyState != 4)
				return;
			
			var data = JSON.parse(this.responseText);
			callback && callback(data);
		};
		xhr.send();
	};
	
	loadData(function(datas){
		var containerObj = document.querySelector(".k-container");
		
		var kChartConfig = {
			width: "100%",/* 整体图形宽度 */

			paddingLeft: 60,
			paddingRight: 20,
			
			groupWidth: 4,
			groupGap: 3,
			
			axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
			axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
			axisLabelFont: null,
			
			axisXTickOffset: 30,/* 横坐标刻度距离原点的位移 */
			axisXTickInterval: 30,/** 横坐标刻度之间相差的点的个数 */
			axisXLabelSize: 100,
			
		};

		var kSubChartConfig = {
			height: 300,

			paddingTop: 20,
			paddingBottom: 30,

			coordinateBackground: "#F9F9F9"
		};
		
		var chartCanvas = document.getElementById("chart"), detailCanvas = document.getElementById("detail");

		var KChart = TradeChart2.KChart;
		var kChart = new KChart().setDataParser(function(d, i){
			var obj = {time: d[1], openPrice: d[2], closePrice: d[3], highPrice: d[4], lowPrice: d[5]};
			if(isNaN(obj.openPrice)){
				console.error(d, i, obj.openPrice);
				obj.openPrice = 0;
			}
			if(isNaN(obj.closePrice)){
				console.error(d, i, obj.closePrice);
				obj.closePrice = 0;
			}
			if(isNaN(obj.highPrice)){
				console.error(d, i, obj.highPrice);
				obj.highPrice = 0;
			}
			if(isNaN(obj.lowPrice)){
				console.error(d, i, obj.lowPrice);
				obj.lowPrice = 0;
			}

			return obj;
		}).setDataList(datas.slice(1)).setConfig(kChartConfig);

		var subChart = kChart.newSubChart(TradeChart2.KSubChartTypes.CANDLE);
		subChart.render(chartCanvas, kSubChartConfig);
	});
})();