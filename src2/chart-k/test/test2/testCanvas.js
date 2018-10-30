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

	/**
	 * 将给定的字符串自连n次后返回
	 * @param str {String} 要重复的字符串单元
	 * @param n {Integer} 要重复的次数
	 * @return {String} 重复连接后的字符串
	 */
	var repeatString = function(str, n){
		var s = "";
		while(n-- > 0)
			s += str;
		return s;
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
	
	loadData(function(datas){
		var kChartConfig = {
			width: "100%",/* 整体图形宽度 */

			paddingLeft: 60,
			paddingRight: 60,
			
			groupLineWidth: 3,/** 蜡烛线的宽度。最好为奇数，从而使得线可以正好在正中间 */
			groupBarWidth: 7,/** 蜡烛的宽度，必须大于等于线的宽度+2。最好为奇数，从而使得线可以正好在正中间 */
			groupGap: 3,
			
			axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
			axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
			axisLabelFont: null,
			
			axisXTickOffset: 0,/* 横坐标刻度距离原点的位移 */
			axisXTickOffsetFromRight: 0,/* 横坐标右侧刻度距离原点的位移 */
			axisXTickInterval: 30,/** 横坐标刻度之间相差的点的个数 */
			axisXLabelSize: 100,
		};

		var kCandleConfig = {
			height: "100%",

			paddingTop: 20,
			paddingBottom: 30,

			showAxisXLabel: false,

			axisYTickOffset: 10,/* 纵坐标刻度距离原点的位移 */

			coordinateBackground: "#F0F0F0",
			keepingColor: "blue"
		};
		var kVolumeConfig = {
			height: "100%",

			paddingTop: 20,
			paddingBottom: 30,

			axisYPosition: "right",
			axisYTickOffset: 10,

			showVerticalGridLine: false,
			horizontalGridLineColor: false,

			coordinateBackground: null
		};
		
		var column_candleObj = document.querySelector(".column .candle canvas"),
			column_volumeObj = document.querySelector(".column .volume canvas"),
			column_candleDetailObj = document.querySelector(".column .candle .detail"),
			column_volumeDetailObj = document.querySelector(".column .volume .detail"),

			dataDetailObj = document.querySelector(".data-detail");

		var moveLeftObj = document.querySelector(".move-left"),
			moveRightObj = document.querySelector(".move-right");

		column_candleObj.detailCanvas = column_candleDetailObj;
		column_volumeObj.detailCanvas = column_volumeDetailObj;

		var KChart = TradeChart2.KChart;
		var sepIndex = Math.floor(datas.length / 2);
		var kChart = new KChart().setDataParser(function(d, i){
			var obj = {time: formatDate(new Date(d.i * 1000), "HH:mm"), openPrice: d.o, closePrice: d.c, highPrice: d.h, lowPrice: d.l, volume: d.a};
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
		}).setConfig(kChartConfig);
		kChart.setDataList(datas.slice(sepIndex)).prependDataList(datas.slice(0, sepIndex));
		window.kChart = kChart;

		var moveDelayTimer, moveTimer;
		moveLeftObj.addEventListener("mousedown", function(){
			kChart.updateRenderingOffsetBy(-1);

			clearTimeout(moveDelayTimer);
			moveDelayTimer = setTimeout(function(){
				clearInterval(moveTimer);
				moveTimer = setInterval(function(){
					kChart.updateRenderingOffsetBy(-1);
				}, 20);
			}, 500);
		});
		moveLeftObj.addEventListener("mouseup", function(){
			clearTimeout(moveDelayTimer);
			clearInterval(moveTimer);
		});
		moveRightObj.addEventListener("mousedown", function(){
			kChart.updateRenderingOffsetBy(1);

			clearTimeout(moveDelayTimer);
			moveDelayTimer = setTimeout(function(){
				clearInterval(moveTimer);
				moveTimer = setInterval(function(){
					kChart.updateRenderingOffsetBy(1);
				}, 20);
			}, 500);
		});
		moveRightObj.addEventListener("mouseup", function(){
			clearTimeout(moveDelayTimer);
			clearInterval(moveTimer);
		});

		/* 蜡烛图 */
		var subChart_candle = kChart.newSubChart(TradeChart2.KSubChartTypes.CANDLE);
		var columnResult_candle = subChart_candle.render(column_candleObj, kCandleConfig);
		window.columnResult_candle = columnResult_candle;
		columnResult_candle.initCanvas(column_candleDetailObj);

		/* 量图 */
		var subChart_volume = kChart.newSubChart(TradeChart2.KSubChartTypes.VOLUME);
		var columnResult_volume = subChart_volume.render(column_volumeObj, kVolumeConfig);
		window.columnResult_volume = columnResult_volume;
		columnResult_volume.initCanvas(column_volumeDetailObj);

		var drawLine4DataIndex = function(result, dataIndex, top, bottom){
			var canvasObj = result.getCanvasDomElement();
			var detailCtx = canvasObj.detailCanvas.getContext("2d");
			detailCtx.clearRect(0, 0, canvasObj.width, canvasObj.height);

			var x = result.getRenderingHorizontalPosition(dataIndex);
			if(-1 == x)
				return;

			detailCtx.lineWidth = 0.5;
			detailCtx.setLineDash([5, 5]);
			detailCtx.beginPath();
			detailCtx.moveTo(x, top);
			detailCtx.lineTo(x, bottom);
			detailCtx.stroke();
		};

		var drawLineAndShowDataDetail4X = function(result, x, top, bottom){
			var canvasObj = result.getCanvasDomElement();
			var detailCtx = canvasObj.detailCanvas.getContext("2d");
			detailCtx.clearRect(0, 0, canvasObj.width, canvasObj.height);

			var convertedData = result.getConvertedRenderingData(x);
			var dataIndex = result.getRenderingDataIndex(x);

			dataDetailObj.innerHTML = null == convertedData? "--": (dataIndex + " --> " + JSON.stringify(convertedData));
			if(null == convertedData)
				return;

			drawLine4DataIndex(result, dataIndex, top, bottom);
		};

		/* 纵向排列时的明细查看 */
		var f = function(e){
			var x = e.layerX;

			drawLineAndShowDataDetail4X(columnResult_candle, x,
				columnResult_candle.getConfigItem("paddingTop"),
				TradeChart2.util.getLinePosition(columnResult_candle.getConfigItem("height"))
			);
			drawLineAndShowDataDetail4X(columnResult_volume, x,
				TradeChart2.util.getLinePosition(0),
				TradeChart2.util.getLinePosition(columnResult_volume.getConfigItem("height") - columnResult_volume.getConfigItem("paddingBottom"))
			);
		};
		column_candleDetailObj.addEventListener("mousemove", f);
		column_volumeDetailObj.addEventListener("mousemove", f);
	});
})();