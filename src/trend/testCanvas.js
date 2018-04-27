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
			
			dotGap: 5,/** 相邻两个点之间的间隔 */
			
			axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
			axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
			axisLabelFont: null,
			
			axisXTickOffset: 30,/* 横坐标刻度距离原点的位移 */
			axisXTickInterval: 17,/** 横坐标刻度之间相差的点的个数 */
			axisXLabelSize: 20,
			
			coordinateBackground: "#F9F9F9",
			enclosedAreaBackground: new TradeChart.LinearGradient(["0, white","1, #212121"])
		};
		
		/** 图形绘制 */
		var chartCanvas = document.getElementById("chart"), detailCanvas = document.getElementById("detail");
		window.renderedTickChart = new TradeChart.chart.TrendChart().setDataParser(function(d, i){
			var obj = {time: d[d.length - 1], price: +d[3]};
			if(isNaN(obj.price)){
				console.error(d, i, datas[i]);
				obj.price = 0;
			}
			
			return obj;
		}).setDatas(datas.slice(1)).render(chartCanvas, config);
		
		/** 明细查看 */
		config = window.renderedTickChart.getConfig();
		detailCanvas.width = chartCanvas.width;
		detailCanvas.height = chartCanvas.height;
		detailCanvas.style.width = window.renderedTickChart.getRenderMetadata().cssWidth;
		detailCanvas.style.height = window.renderedTickChart.getRenderMetadata().cssHeight;
		
		window.detailCtx = detailCanvas.getContext("2d")
		detailCtx.scale(window.renderedTickChart.getRenderMetadata().scaleX, window.renderedTickChart.getRenderMetadata().scaleY);
		detailCtx.strokeStyle = "black";
		detailCtx.lineWidth = 0.5;
		
		var viewDetail = (function(){
			var offsetLeft = detailCanvas.offsetLeft;
			var lastCoordinate = null;
		
			return function(e){
				var x = (e instanceof TouchEvent? e.touches[0].clientX: e.clientX) - offsetLeft;
				var dataIndex = window.renderedTickChart.getDataIndex(x);
				var coordinate = window.renderedTickChart.getCoordinate(x);
				
				if(null == coordinate)
					return;
				
				var x = 0, y = 0;
				if(null != lastCoordinate){
					x = lastCoordinate.x - 2;
					y = lastCoordinate.y - 2;
					x = x < 0? 0: x;
					y = y < 0? 0: y;
				}
				detailCtx.clearRect(0, y, detailCtx.canvas.width, 5);
				detailCtx.clearRect(x, 0, 5, detailCtx.canvas.height);
				
				var x1 = Math.floor(config.paddingLeft) + 0.5,
					x2 = Math.floor(config.width - config.paddingRight) + 0.5;
				y = Math.floor(coordinate.y) + 0.5;
				
				/** 横线 */
				detailCtx.beginPath();
				detailCtx.moveTo(x1, y);
				detailCtx.lineTo(x2, y);
				
				/** 竖线 */
				x = Math.floor(coordinate.x) + 0.5;
				detailCtx.moveTo(x, Math.floor(config.paddingTop) + 0.5);
				detailCtx.lineTo(x, Math.floor(config.height - config.paddingBottom) + 0.5);
				detailCtx.stroke();
				
				/** 圆点 */
				detailCtx.beginPath();
				detailCtx.moveTo(x, y);
				detailCtx.arc(x, y, 3, 2 * Math.PI, 0);
				detailCtx.closePath();
				detailCtx.fill();
				
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