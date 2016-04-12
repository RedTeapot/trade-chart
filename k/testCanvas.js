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
		
		var config = {
			width: "100%",/* 整体图形宽度 */
			height: 300,/* 整体图形高度 */
			
			/** 图形内边距（坐标系外边距） */
			paddingTop: 20,
			paddingBottom: 30,
			paddingLeft: 60,
			paddingRight: 20,
			
			groupWidth: 4,
			groupGap: 3,
			
			axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
			axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
			axisLabelFont: null,
			
			axisXTickOffset: 30,/* 横坐标刻度距离原点的位移 */
			axisXTickInterval: 30,/** 横坐标刻度之间相差的点的个数 */
			
			coordinateBackground: "#F9F9F9"
		};
		
		/** 图形绘制 */
		var chartCanvas = document.getElementById("chart"), detailCanvas = document.getElementById("detail");
		window.renderedKChart = new TradeChart.chart.KChart().setDataParser(function(d, i){
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
		}).setDatas(datas.slice(1)).render(chartCanvas, config);
		
		/** 明细查看 */
		config = window.renderedKChart.getConfig();
		detailCanvas.width = chartCanvas.width;
		detailCanvas.height = chartCanvas.height;
		detailCanvas.style.width = window.renderedKChart.getRenderMetadata().cssWidth;
		detailCanvas.style.height = window.renderedKChart.getRenderMetadata().cssHeight;
		
		window.detailCtx = detailCanvas.getContext("2d")
		detailCtx.scale(window.renderedKChart.getRenderMetadata().scaleX, window.renderedKChart.getRenderMetadata().scaleY);
		detailCtx.strokeStyle = "black";
		detailCtx.lineWidth = 0.5;
		
		var viewDetail = (function(){
			var offsetLeft = detailCanvas.offsetLeft;
			var lastCoordinate = null;
		
			return function(e){
				var x = (e instanceof TouchEvent? e.touches[0].clientX: e.clientX) - offsetLeft;
				var dataIndex = window.renderedKChart.getDataIndex(x);
				var coordinate = window.renderedKChart.getCoordinate(x);
				
				if(null == coordinate)
					return;
				
				var x = 0;
				if(null != lastCoordinate){
					x = lastCoordinate.x - 2;
					x = x < 0? 0: x;
				}
				detailCtx.clearRect(x, 0, 5, detailCtx.canvas.height);
				
				/** 竖线 */
				detailCtx.beginPath();
				detailCtx.moveTo(coordinate.x, Math.floor(config.paddingTop) + 0.5);
				detailCtx.lineTo(coordinate.x, Math.floor(config.height - config.paddingBottom) + 0.5);
				detailCtx.stroke();
				
				lastCoordinate = coordinate;
			};
		})();
		
		detailCanvas.addEventListener("mousemove", viewDetail);
		detailCanvas.addEventListener("touchstart", function(e){e.preventDefault();});
		detailCanvas.addEventListener("touchmove", function(e){
			viewDetail(e);
			
			e.preventDefault();
			e.stopPropagation();
		})
	});
	
})();