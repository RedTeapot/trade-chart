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
			
			groupWidth: 4,
			groupGap: 3,
			
			axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
			axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
			axisLabelFont: null,
			
			axisXTickOffset: 30,/* 横坐标刻度距离原点的位移 */
			axisXTickInterval: 30,/** 横坐标刻度之间相差的点的个数 */
			axisXLabelSize: 100,
		};

		var kCandleConfig = {
			height: "100%",

			paddingTop: 20,
			paddingBottom: 30,

			showAxisXLabel: false,

			axisYTickOffset: 10,/* 纵坐标刻度距离原点的位移 */

			coordinateBackground: "#F9F9F9"
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
		
		var row_candleObj = document.querySelector(".row .candle canvas"),
			row_volumeObj = document.querySelector(".row .volume canvas"),
			row_candleDetailObj = document.querySelector(".row .candle .detail"),
			row_volumeDetailObj = document.querySelector(".row .volume .detail"),

			column_candleObj = document.querySelector(".column .candle canvas"),
			column_volumeObj = document.querySelector(".column .volume canvas"),
			column_candleDetailObj = document.querySelector(".column .candle .detail"),
			column_volumeDetailObj = document.querySelector(".column .volume .detail"),

			dataDetailObj = document.querySelector(".data-detail");

		var KChart = TradeChart2.KChart;
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
		}).setDataList(datas).setConfig(kChartConfig);

		/* 蜡烛图 */
		var subChart_candle = kChart.newSubChart(TradeChart2.KSubChartTypes.CANDLE);
		var rowResult_candle = subChart_candle.render(row_candleObj, kCandleConfig);
		window.rowResult_candle = rowResult_candle;
		rowResult_candle.initCanvas(row_candleDetailObj);

		var columnResult_candle = subChart_candle.render(column_candleObj, kCandleConfig);
		window.columnResult_candle = columnResult_candle;
		columnResult_candle.initCanvas(column_candleDetailObj);

		/* 量图 */
		var subChart_volume = kChart.newSubChart(TradeChart2.KSubChartTypes.VOLUME);
		var rowResult_volume = subChart_volume.render(row_volumeObj, kVolumeConfig);
		window.rowResult_volume = rowResult_volume;
		rowResult_volume.initCanvas(row_volumeDetailObj);

		var columnResult_volume = subChart_volume.render(column_volumeObj, kVolumeConfig);
		window.columnResult_volume = columnResult_volume;
		columnResult_volume.initCanvas(column_volumeDetailObj);


		var showDetail = function(e, result, top, bottom){
			var x = e.clientX - this.parentNode.offsetLeft;
			var convertedData = result.getConvertedRenderingData(x);
			dataDetailObj.innerHTML = null == convertedData? "--": JSON.stringify(convertedData);

			var detailCtx = this.getContext("2d");
			detailCtx.clearRect(0, 0, this.width, this.height);

			/* 竖线 */
			x = TradeChart2.util.getLinePosition(x);
			detailCtx.lineWidth = 0.5;
			detailCtx.setLineDash([5, 5]);
			detailCtx.beginPath();
			detailCtx.moveTo(x, top);
			detailCtx.lineTo(x, bottom);
			detailCtx.stroke();
		};

		/* 纵向排列时的明细查看 */
		var f = function(e){
			showDetail.call(column_candleDetailObj, e, columnResult_candle,
				TradeChart2.util.getLinePosition(columnResult_candle.getConfigItem("paddingTop")),
				TradeChart2.util.getLinePosition(columnResult_candle.getConfigItem("height"))
			);
			showDetail.call(column_volumeDetailObj, e, columnResult_volume,
				TradeChart2.util.getLinePosition(0),
				TradeChart2.util.getLinePosition(columnResult_volume.getConfigItem("height") - columnResult_volume.getConfigItem("paddingBottom"))
			);
		};
		column_candleDetailObj.addEventListener("mousemove", f);
		column_volumeDetailObj.addEventListener("mousemove", f);

		/* 横向排列时的明细查看 */
		var showDetail_row = function(e, result, top, bottom){
			var x = e.clientX;
			var convertedData = result.getConvertedRenderingData(x);
			dataDetailObj.innerHTML = null == convertedData? "--": JSON.stringify(convertedData);

			var detailCtx = this.getContext("2d");
			detailCtx.clearRect(0, 0, this.width, this.height);

			/* 竖线 */
			x = TradeChart2.util.getLinePosition(x);
			detailCtx.lineWidth = 0.5;
			detailCtx.setLineDash([5, 5]);
			detailCtx.beginPath();
			detailCtx.moveTo(x, top);
			detailCtx.lineTo(x, bottom);
			detailCtx.stroke();
		};
		g = function(e){
			showDetail_row.call(row_candleDetailObj, e, rowResult_candle,
				TradeChart2.util.getLinePosition(rowResult_candle.getConfigItem("paddingTop")),
				TradeChart2.util.getLinePosition(rowResult_candle.getConfigItem("height") - rowResult_candle.getConfigItem("paddingBottom"))
			);

			showDetail_row.call(row_volumeDetailObj, e, rowResult_volume,
				TradeChart2.util.getLinePosition(rowResult_candle.getConfigItem("paddingTop")),
				TradeChart2.util.getLinePosition(rowResult_volume.getConfigItem("height") - rowResult_volume.getConfigItem("paddingBottom"))
			);
		};
		row_candleDetailObj.addEventListener("mousemove", g);
		row_volumeDetailObj.addEventListener("mousemove", g);
	});
})();