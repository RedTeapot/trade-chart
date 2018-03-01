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
			paddingBottom: 40,
			paddingLeft: 60,
			paddingRight: 20,

			/**
			 * 相邻两个点之间的间隔。
			 *
			 * 1. 赋值整数，以指定固定间隔（此时会根据可显示的数据量自动舍去超出渲染范围的的数据，从而导致可能只显示前一部分数据）；
			 * 2. 赋值字符串：“auto”以渲染所有数据，并自动计算两个点之间的距离。
			 */
			dotGap: "auto",

			axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
			axisLabelFont: "normal 10px sans-serif, serif",/** 坐标标签字体 */
			axisLabelColor: "#61688A",/** 坐标标签颜色 */
			axisLineColor: "#2E3247",/** 坐标轴颜色 */

			axisXTickOffset: 5,/* 横坐标刻度距离原点的位移 */
			axisXLabelOffset: 5,/* 横坐标标签距离坐标轴刻度线的距离 */
			axisXLabelSize: 55,/* 横坐标标签文字的长度（用于决定如何绘制边界刻度) */

			axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移 */
			axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
			axisYPrecision: 2,/** 纵坐标的数字精度 */
			axisYLabelVerticalOffset: 0,/** 纵坐标标签纵向位移 */
			axisYLabelOffset: 5,/* 纵坐标标签距离坐标轴刻度线的距离 */

			gridLineDash: [1, 3, 3],/** 网格横线的虚线构造方法。如果需要用实线，则用“[1]”表示 */
			showHorizontalGridLine: false,/** 是否绘制网格横线 */
			horizontalGridLineColor: "#EAEAEA",/** 网格横线颜色 */

			showVerticalGridLine: false,/** 是否绘制网格竖线 */
			verticalGridLineColor: "#EAEAEA",/** 网格竖线颜色 */

			coordinateBackground: null,/** 坐标系围成的矩形区域的背景色 */
			enclosedAreaBackground4Buyer: "#243336",/** 折线与X轴围绕而成的，代表买方的封闭区域的背景色 */
			enclosedAreaBackground4Seller: "#392332",/** 折线与X轴围绕而成的，代表卖方的封闭区域的背景色 */
			enclosedAreaGap: 20,/** 买方区域与卖方区域之间的横向间隔 */

			showEnclosedAreaEdgeLine: false,/** 是否绘制买卖区域的边界线 */
			enclosedAreaEdgeLineWidth: 1,/** 买卖区域边界线的线条宽度 */
			enclosedAreaEdgeLineColor: "#D0D0D0",/** 买卖区域边界线的线条颜色 */
			enclosedAreaEdgeLineDash: [1],/** 买卖区域边界线的线条的虚线构造方法。如果需要用实线，则用“[1]”表示 */

			showAreaColorBelonging: true,/** 是否呈现区域的买卖性质 */
			enclosedAreaBelongingTextFont: "normal 10px sans-serif, serif",/** 卖方区域的买卖性质文本字体 */
			enclosedAreaBelongingTextColor: "#2E3247",/** 卖方区域的买卖性质文本颜色 */
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
			var lastCoordinate = null, timer;

			var detailObj = document.querySelector(".detail");
		
			return function(e){
				var x = (null != window.TouchEvent && e instanceof TouchEvent? e.touches[0].clientX: e.clientX) - offsetLeft;
				var dataPosition = window.renderedDepthChart.getDataPosition(x);
				var coordinate = window.renderedDepthChart.getCoordinate(x);
				if(null == coordinate)
					return;
				
				var x = 0, y = 0, dotRadius = 10;
				if(null != lastCoordinate){
					x = lastCoordinate.x - dotRadius;
					y = lastCoordinate.y - dotRadius;
					x = x < 0? 0: x;
					y = y < 0? 0: y;
				}
				detailCtx.clearRect(0, y, detailCtx.canvas.width, dotRadius * 2);
				detailCtx.clearRect(x, 0, dotRadius * 2, detailCtx.canvas.height);
				
				var x1 = Math.floor(config.paddingLeft) + 0.5,
					x2 = Math.floor(config.width - config.paddingRight) + 0.5;
				y = Math.floor(coordinate.y) + 0.5;
				
				detailCtx.strokeStyle = config.axisLabelColor;
				detailCtx.fillStyle = "#7A98F7";
				
				/** 横线 */
				detailCtx.beginPath();
				detailCtx.moveTo(x1, y);
				detailCtx.lineTo(x2, y);
				
				/** 竖线 */
				x = Math.floor(coordinate.x) + 0.5;
				detailCtx.moveTo(x, Math.floor(config.paddingTop) + 0.5);
				detailCtx.lineTo(x, Math.floor(config.height - config.paddingBottom) + 0.5);
				detailCtx.stroke();
				
				/* 大圆点 */
				detailCtx.globalAlpha = 0.6;
				detailCtx.beginPath();
				detailCtx.moveTo(x, y);
				detailCtx.arc(x, y, dotRadius, 2 * Math.PI, 0);
				detailCtx.closePath();
				detailCtx.fill();

				/* 小圆点 */
				detailCtx.globalAlpha = 1;
				detailCtx.beginPath();
				detailCtx.moveTo(x, y);
				detailCtx.arc(x, y, dotRadius / 2, 2 * Math.PI, 0);
				detailCtx.closePath();
				detailCtx.fill();

				/* 在右上方呈现详细信息 */
				var data = window.renderedDepthChart.getConvertedData(dataPosition.dataIndex, dataPosition.area);
				detailObj.querySelector(".price span").innerHTML = data.price;
				detailObj.querySelector(".amount span").innerHTML = data.amount;
				detailObj.classList.add("visible");
				var offset = 10, left = x + offset, bottom = (config.height - y) + offset, right = "", top = "",
					detailOffsetWidth = detailObj.offsetWidth, containerClientWidth = containerObj.clientWidth,
					detailOffsetHeight = detailObj.offsetHeight, containerClientHeight = containerObj.clientHeight;

				/* 不能超过右侧边界和上侧边界 */
				left = Math.min(left, containerClientWidth - detailOffsetWidth - offset);
				bottom = Math.min(bottom, containerClientHeight - detailOffsetHeight - offset);

				/* 调整为在左下方显示 */
				if(left < x){
					left = "";
					right = (config.width - x) + 10;
				}
				if(config.height - bottom > y){
					bottom = "";
					top = y + 10;
				}

				detailObj.style.left = left;
				detailObj.style.right = right;
				detailObj.style.top = top;
				detailObj.style.bottom = bottom;

				/* 详细信息自动消失 */
				clearTimeout(timer);
				timer = setTimeout(function(){
					detailObj.classList.remove("visible");
				}, 4000);
				
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