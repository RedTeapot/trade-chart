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
		var containerObj = document.querySelector(".container");
		
		var config = {
			width: "100%",/* 整体图形宽度 */
			height: 300,/* 整体图形高度 */
			
			/** 图形内边距（坐标系外边距） */
			paddingTop: 20,
			paddingBottom: 30,
			paddingLeft: 60,
			paddingRight: 20,
			
			dotGap: "auto",/** 相邻两个点之间的间隔 */
			
			axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
			axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
			axisLabelFont: null,
			
			axisXTickOffset: 10,/* 横坐标刻度距离原点的位移 */
			axisXTickInterval: 17,/** 横坐标刻度之间相差的点的个数 */
			axisXLabelSize: 30,

			axisYMidTickQuota: 2,/** 纵坐标刻度个数（不包括最小值和最大值） */
			
			coordinateBackground: "#F9F9F9",
			showEnclosedAreaEdgeLine: false,

			showAreaColorBelonging: true,/** 是否呈现区域的买卖性质 */
			enclosedAreaBelongingTextFont: "normal 10px sans-serif, serif",/** 卖方区域的买卖性质文本字体 */
			enclosedAreaBelongingTextColor: null,/** 卖方区域的买卖性质文本颜色 */
			enclosedAreaBelongingText4Buyer: "买",/** 买方区域的买卖性质文本 */
			enclosedAreaBelongingText4Seller: "卖",/** 卖方区域的买卖性质文本 */
		};
		
		// datas.splice(0, 1);
		var halfIndex = Math.floor(datas.length / 2);

		/** 图形绘制 */
		var chartCanvas = document.getElementById("chart"),
			detailCanvas = document.getElementById("detail");
		window.renderedDepthChart = new TradeChart.chart.DepthChart().setDataParser(function(d, i){
			var obj = {price: d[0], amount: +d[1]};
			if(isNaN(obj.amount)){
				console.error(d, i, datas[i]);
				obj.amount = 0;
			}
			
			return obj;
		}).setBuyerDatas(datas.slice(0, halfIndex)).setSellerDatas(datas.slice(halfIndex)).render(chartCanvas, config);
		
		/** 明细查看 */
		config = window.renderedDepthChart.getConfig();
		detailCanvas.width = chartCanvas.width;
		detailCanvas.height = chartCanvas.height;
		detailCanvas.style.width = window.renderedDepthChart.getRenderMetadata().cssWidth;
		detailCanvas.style.height = window.renderedDepthChart.getRenderMetadata().cssHeight;
		
		window.detailCtx = detailCanvas.getContext("2d");
		detailCtx.scale(window.renderedDepthChart.getRenderMetadata().scaleX, window.renderedDepthChart.getRenderMetadata().scaleY);
		detailCtx.strokeStyle = "black";
		detailCtx.lineWidth = 0.5;
		
		var viewDetail = (function(){
			var offsetLeft = detailCanvas.offsetLeft;
			var lastCoordinate = null;
		
			return function(e){
				var x = (null != window.TouchEvent && e instanceof TouchEvent? e.touches[0].clientX: e.clientX) - offsetLeft;
				var dataPosition = window.renderedDepthChart.getDataPosition(x);
				var coordinate = window.renderedDepthChart.getCoordinate(x);
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