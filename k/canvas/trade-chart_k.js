;(function(){
	var TradeChart = window.TradeChart;
	var util = TradeChart.util;
	
	/**
	 * 扫描提供的数据，生成绘制所需的元数据
	 * @param datas {JsonArray} 数据数组
	 * @param dataParser {Function} 数据转换方法
	 * @param config {JsonObject} 渲染配置
	 * @return {JsonObject} 元数据集合
	 */
	var sketch = function(datas, dataParser, config){
		var dataSketch = {
			origin: {
				max: -Infinity,/* 最大价格 */
				min: Infinity,/* 最小价格 */
				avgVariation: 0,/* 价格的平均变动幅度 */	
				maxVariation: 0/* 价格的最大变动幅度 */	
			},
			extended: {
				priceCeiling: 0,/* 坐标中价格的最大值 */
				priceFloor: 0/* 坐标中价格的最小值 */
			}
		}, chartSketch = {
			width: 0,/** 图表的宽度 */
			contentWidth: 0,/** 图表内容的宽度 */
			height: 0,/** 图表的高度 */
			contentHeight: 0,/** 图表内容的高度 */
			priceHeightRatio: 0,/** 高度与价格之间的映射比例 */
			maxGroupCount: 0/** 可呈现的最多的数据组的个数 */
		};
		
		chartSketch.width = config.width - config.paddingLeft - config.paddingRight;
		chartSketch.contentWidth = chartSketch.width - config.axisXTickOffset;
		chartSketch.height = config.height - config.paddingTop - config.paddingBottom;
		chartSketch.contentHeight = chartSketch.height - config.axisYTickOffset;
		chartSketch.maxGroupCount = Math.floor((chartSketch.contentWidth + config.groupGap) / (config.groupGap + config.groupBarWidth)) + 1;
		
		/* 数据概览扫描 */
		var variationSum = 0;
		for(var i = 0; i < datas.length && i < chartSketch.maxGroupCount; i++){
			var d = datas[i];
			/* 数据格式转换 */
			d = dataParser? dataParser(d, i): d;
			
			var max = Math.max(+d.openPrice, +d.highPrice, +d.lowPrice, +d.closePrice),
				min = Math.min(+d.openPrice, +d.highPrice, +d.lowPrice, +d.closePrice);
			if(max > dataSketch.origin.max)
				dataSketch.origin.max = max;
			if(min < dataSketch.origin.min)
				dataSketch.origin.min = min;
			
			var variation = Math.abs(max - min);
			
			/* 确定更大的价格变动幅度 */
			if(variation > dataSketch.origin.maxVariation)
				dataSketch.origin.maxVariation = variation;
			variationSum += variation;
		}
		dataSketch.origin.avgVariation = variationSum / datas.length;
		
		dataSketch.extended.priceCeiling = dataSketch.origin.max + (dataSketch.origin.avgVariation / 2);
		dataSketch.extended.priceFloor = dataSketch.origin.min - (dataSketch.origin.avgVariation / 2);
		dataSketch.extended.priceFloor = dataSketch.extended.priceFloor < 0? 0: dataSketch.extended.priceFloor;
		dataSketch.extended.priceCeiling = (dataSketch.extended.priceCeiling - dataSketch.extended.priceFloor < 2E-7)? (dataSketch.extended.priceFloor + 1): dataSketch.extended.priceCeiling;
		
		chartSketch.width = config.width - config.paddingLeft - config.paddingRight;
		chartSketch.contentWidth = chartSketch.width - config.axisXTickOffset;
		chartSketch.height = config.height - config.paddingTop - config.paddingBottom;
		chartSketch.contentHeight = chartSketch.height - config.axisYTickOffset;
		chartSketch.maxGroupCount = Math.floor((chartSketch.contentWidth + config.groupGap) / (config.groupGap + config.groupBarWidth));
		
		chartSketch.priceHeightRatio = (dataSketch.extended.priceCeiling - dataSketch.extended.priceFloor) / chartSketch.height;
		
		return {data: dataSketch, chart: chartSketch};
	};
	
	/**
	 * @constructor
	 * 已完成渲染的K线图
	 * @param kChart {KChart} K线图实例
	 * @param sketch {JsonObject} 数据和图形的扫描分析结果
	 * @param config {JsonObject} 渲染配置
	 * @param renderMetadata {JsonObject} 渲染时使用的基准数据
	 */
	var RenderedKChart = function(kChart, sketch, config, renderMetadata){
		if(!(kChart instanceof KChart))
			throw new Error("Invalid arguemnt. KChart instance is needed.");
		
		/**
		 * 获取渲染用到的配置数据
		 */
		this.getConfig = function(){
			return config;
		};
		
		/**
		 * 获取渲染时使用的基准数据
		 */
		this.getRenderMetadata = function(){
			return renderMetadata;
		};
		
		/**
		 * 获取指定的相对横坐标对应的数据索引
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @reutrn {Integer} 相对横坐标对应的数据索引。如果没有数据与之对应，则返回-1
		 */
		this.getDataIndex = function(x){
			var groupCount = Math.min(kChart.getDatas().length, sketch.chart.maxGroupCount);
			var minX = Math.floor(config.paddingLeft + config.axisXTickOffset) + 0.5;
			var maxX = minX + groupCount * config.groupBarWidth + (groupCount - 1) * config.groupGap;/** N组数据之间有N-1个间隙 */
			
			if(x < minX || x > maxX)
				return -1;
			
			var tmpX = x - minX;
			var index = Math.round(tmpX / (config.groupBarWidth + config.groupGap));
			return index;
		};
		
		/**
		 * 获取指定的相对横坐标对应的数据在画布上的坐标位置
		 * @param x {Number} 相对于图形坐标系的横坐标。坐标系原点为画布：Canvas的左上角
		 * @return {JsonObject} 坐标位置，形如：{x: <x>, y: <y>}。如果没有数据与之对应，则返回null。
		 */
		this.getCoordinate = function(x){
			var dataIndex = this.getDataIndex(x);
			if(-1 == dataIndex)
				return null;
			
			var minX = Math.floor(config.paddingLeft + config.axisXTickOffset) + 0.5;
			
			var obj = {x: 0, y: -1};/** 纵坐标不确定 */
			obj.x = minX + dataIndex * (config.groupBarWidth + config.groupGap) + Math.floor((config.groupBarWidth + 1 - config.groupLineWidth) / 2);
			
			return obj;
		};
	};
	
	/**
	 * @constructor
	 * K线图（OHLC图）
	 * 数据格式：{time: "", openPrice: <Number>, highPrice: <Number>, lowPrice: <Number>, closePrice: <Number>}
	 */
	var KChart = function(){
		TradeChart.apply(this, arguments);
		
		/** 数据数组 */
		var datas;
		/** 数据转换方法，用于将提供的数据数组转为本图表兼容的格式 */
		var dataParser;
		
		/**
		 * 设置数据源
		 * @param _datas {JsonArray} 数据源
		 */
		this.setDatas = function(_datas){
			datas = _datas;
			return this;
		};
		
		/**
		 * 获取设置的数据源
		 */
		this.getDatas = function(){
			return datas;
		};
		
		/**
		 * 设置数据转换方法
		 * @param parser {Function} 数据转换方法
		 */
		this.setDataParser = function(parser){
			dataParser = parser;
			return this;
		};
		
		/**
		 * 获取数据转换方法
		 * @return {Function} 数据转换方法
		 */
		this.getDataParser = function(){
			return dataParser;
		};
		
		/**
		 * 渲染图形，并呈现至指定的画布中
		 * @param domContainerObj {HTMLCanvasElement} 画布
		 * @param config {JsonObject} 渲染配置
		 * @param config.enclosedAreaBackground {String|TradeChart.LinearGradient} 折线与X轴围成的区域的背景色
		 * @return {RenderedKChart} 绘制的K线图
		 */
		this.render = function(canvasObj, config){
			config = util.cloneObject(config, true);
			
			config = util.setDftValue(config, {
				width: "100%",/* 整体图形宽度 */
				height: 300,/* 整体图形高度 */
				
				/** 图形内边距（坐标系外边距） */
				paddingTop: 20,
				paddingBottom: 20,
				paddingLeft: 60,
				paddingRight: 20,
				
				groupLineWidth: 1,/** 蜡烛线的宽度。大于1时最好为偶数，从而使得线可以正好在正中间。注：边框占据1像素 */
				groupBarWidth: 4,/** 蜡烛的宽度，必须大于线的宽度。最好为偶数，从而使得线可以正好在正中间。注：边框占据1像素 */
				groupGap: 5,/** 相邻两组数据之间的间隔 */
				
				axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
				axisLabelFont: "normal 10px sans-serif, serif",/** 坐标标签字体 */
				axisLabelColor: null,/** 坐标标签颜色 */
				axisLineColor: null,/** 坐标轴颜色 */
				
				axisXTickOffset: 5,/* 横坐标刻度距离原点的位移 */
				axisXTickInterval: 10,/** 横坐标刻度之间相差的点的个数 */
				axisXLabelOffset: 5,/* 横坐标标签距离坐标轴刻度线的距离 */
				
				axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移 */
				axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
				axisYPrecision: 2,/** 纵坐标的数字精度 */
				axisYLabelVerticalOffset: 0,/** 纵坐标标签纵向位移 */
				axisYLabelOffset: 5,/* 纵坐标标签距离坐标轴刻度线的距离 */
				
				gridLineDash: [1, 3, 3],/** 网格横线的虚线构造方法。如果需要用实线，则用“[1]”表示 */
				showHorizontalGridLine: true,/** 是否绘制网格横线 */
				horizontalGridLineColor: "#A0A0A0",/** 网格横线颜色 */
				
				showVerticalGridLine: true,/** 是否绘制网格横线 */
				verticalGridLineColor: "#A0A0A0",/** 网格竖线颜色 */
				
				appreciatedColor: "red",/** 收盘价大于开盘价时的绘制蜡烛和线时用的画笔和油漆桶颜色 */
				depreciatedColor: "#21CB21",/** 收盘价小于开盘价时的绘制蜡烛和线时用的画笔和油漆桶颜色 */
				keepedColor: "white",/** 收盘价等于开盘价时的绘制蜡烛和线时用的画笔和油漆桶颜色 */
				
				coordinateBackground: null/** 坐标系围成的矩形区域的背景色 */
			});
			
			/* 百分比尺寸自动转换 */
			if(/%/.test(config.width))
				config.width = canvasObj.parentElement.clientWidth * parseInt(config.width.replace(/%/, "")) / 100;
			if(/%/.test(config.height))
				config.height = canvasObj.parentElement.clientHeight * parseInt(config.height.replace(/%/, "")) / 100;
			util.setAttributes(canvasObj, {width: config.width, height: config.height});
			
			var ctx = canvasObj.getContext("2d");
			
			/** 高分辨率适应 */
			var pixelRatio = util.pixelRatio();
			if(pixelRatio > 1){
				canvasObj.style.width = config.width + "px";
				canvasObj.style.height = config.height + "px";
				
				canvasObj.width = pixelRatio * config.width;
				canvasObj.height = pixelRatio * config.height;
				
				ctx.scale(pixelRatio, pixelRatio);
			}
			
			var renderMetadata = {
				scaleX: pixelRatio,
				scaleY: pixelRatio,
				cssWidth: config.width,
				cssHeight: config.height
			};
			Object.freeze && Object.freeze(renderMetadata);
			
			var _sketch = sketch(datas, dataParser, config);
			console.log("K chart sketch", _sketch);
			
			/**
			 * 获取指定价钱对应的物理高度
			 * @param price1 {Number} 价钱1
			 * @param price2 {Number} 价钱2。缺省时，为_sketch.data.extended.priceCeiling
			 * @return {Number} 物理高度
			 */
			var getHeight = function(price1, price2){
				if(arguments.length < 2)
					price2 = _sketch.data.extended.priceCeiling;
				return Math.abs(price2 - price1) / _sketch.chart.priceHeightRatio;
			};
			
			/** 绘制坐标区域背景 */
			if(config.coordinateBackground){
				ctx.save();
				ctx.beginPath();
				ctx.rect(Math.floor(config.paddingLeft) + 0.5, Math.floor(config.paddingTop) + 0.5, _sketch.chart.width, _sketch.chart.height);
				
				var bg = config.coordinateBackground;
				if(bg instanceof TradeChart.LinearGradient){
					bg = ctx.createLinearGradient(config.paddingLeft, config.paddingTop, config.paddingLeft, config.paddingTop + _sketch.chart.height);
					config.coordinateBackground.getStops().forEach(function(stop){
						var offset = stop.offset;
						if(/%/.test(offset))
							offset = parseInt(offset.replace(/%/, "")) / 100;
						
						bg.addColorStop(offset, stop.color);
					});
				}
				
				ctx.fillStyle = bg;
				ctx.fill();
				ctx.restore();
			}
			
			/* 绘制坐标系 */
			ctx.save();
			ctx.lineWidth = 1;
			ctx.textAlign = "center";
			ctx.textBaseline = "top";
			config.axisLineColor && (ctx.strokeStyle = config.axisLineColor);
			config.axisLabelFont && (ctx.font = config.axisLabelFont);
			config.axisLabelColor && (ctx.fillStyle = config.axisLabelColor);
			
			var showVerticalGridLine = config.showVerticalGridLine && config.verticalGridLineColor,
				showHorizontalGridLine = config.showHorizontalGridLine && config.horizontalGridLineColor;
			
			var x_axisX = Math.floor(config.paddingLeft) + 0.5,
				x2_axisX = x_axisX + _sketch.chart.width,
				y_axisX = Math.floor(config.paddingTop + _sketch.chart.height) + 0.5;
			
			/** 绘制X轴坐标线 */
			ctx.beginPath();
			ctx.moveTo(x_axisX, y_axisX);
			ctx.lineTo(x2_axisX, y_axisX);
			ctx.stroke();
			
			/* 绘制X轴刻度 */
			var groupCount = Math.min(_sketch.chart.maxGroupCount, datas.length);
			for(var i = 0; i < groupCount; i += config.axisXTickInterval){
				var data = datas[i];
				/* 数据格式转换 */
				data = dataParser? dataParser(data, i): data;
				
				var x = Math.floor(i * (config.groupBarWidth + config.groupGap) + config.axisXTickOffset);
				var tickX = x + Math.floor((config.groupBarWidth + 1 - config.groupLineWidth) / 2);
				
				/** 绘制网格横线 */
				if(showVerticalGridLine){
					ctx.save();
					ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
					ctx.strokeStyle = config.verticalGridLineColor;
					
					ctx.beginPath();
					ctx.moveTo(x_axisX + tickX, y_axisX);
					ctx.lineTo(x_axisX + tickX, y_axisX - Math.floor(_sketch.chart.contentHeight));
					ctx.stroke();
					
					ctx.restore();
				}
				
				/** 绘制刻度线 */
				ctx.beginPath();
				ctx.moveTo(x_axisX + tickX, y_axisX);
				ctx.lineTo(x_axisX + tickX, y_axisX + config.axisTickLineLength);
				ctx.stroke();
				ctx.fillText(data.time, x_axisX + tickX, y_axisX + config.axisTickLineLength + config.axisXLabelOffset);
			}
			
			var x_axisY = x_axisX,
				y_axisY = Math.floor(config.paddingTop) + 0.5,
				y2_axisY = y_axisX;
			
			/** 绘制Y轴坐标线 */
			ctx.beginPath();
			ctx.moveTo(x_axisY, y_axisY);
			ctx.lineTo(x_axisY, y2_axisY);
			ctx.stroke();
			
			ctx.textAlign = "end";
			ctx.textBaseline = "middle";
			
			/** 绘制Y轴刻度 */
			var axisYPriceInterval = (_sketch.data.extended.priceCeiling - _sketch.data.extended.priceFloor) / (config.axisYMidTickQuota + 1);
			var axisYHeightInterval = axisYPriceInterval / _sketch.chart.priceHeightRatio;
			for(var i = 0; i <= config.axisYMidTickQuota + 1; i++){
				var price = _sketch.data.extended.priceFloor + i * axisYPriceInterval,
					tickOffset = (config.axisYMidTickQuota + 1 - i) * axisYHeightInterval;
				var tickY = Math.round(tickOffset);
				
				/** 绘制网格横线 */
				if(showHorizontalGridLine && (i > 0)){/** 最后一条网格横线不绘制，以避免和坐标轴的横线混合 */
					ctx.save();
					ctx.setLineDash && ctx.setLineDash(config.gridLineDash? config.gridLineDash: [1]);
					ctx.strokeStyle = config.horizontalGridLineColor;
					
					ctx.beginPath();
					ctx.moveTo(x_axisY, y_axisY + tickY);
					ctx.lineTo(x_axisY + Math.floor(_sketch.chart.width), y_axisY + tickY);
					ctx.stroke();
					
					ctx.restore();
				}
				
				/** 绘制刻度线 */
				ctx.beginPath();
				ctx.moveTo(x_axisY, y_axisY + tickY);
				ctx.lineTo(x_axisY - config.axisTickLineLength, y_axisY + tickY);
				ctx.stroke();
				ctx.fillText(util.formatMoney(price, config.axisYPrecision), x_axisY - config.axisTickLineLength - config.axisYLabelOffset, y_axisY + tickY + config.axisYLabelVerticalOffset);
			}
			ctx.restore();
			
			/** 绘制蜡烛 */
			ctx.save();
			for(var i = 0; i < groupCount; i++){
				var data = datas[i];
				/* 数据格式转换 */
				data = dataParser? dataParser(data, i): data;

				var isAppreciated = data.closePrice > data.openPrice,
					isDepreciated = data.closePrice < data.openPrice,
					isKeeped = Math.abs(data.closePrice - data.openPrice) < 2e-7;
				
				var maxLinePrice = Math.max(data.highPrice, data.lowPrice),
					maxBarPrice = Math.max(data.openPrice, data.closePrice);
				
				var x = x_axisX + Math.floor(i * (config.groupBarWidth + config.groupGap) + config.axisXTickOffset);
				ctx.fillStyle = ctx.strokeStyle = isKeeped? config.keepedColor: (isAppreciated? config.appreciatedColor: config.depreciatedColor);
				
				/** 绘制线 */
				var lineX = x + Math.floor((config.groupBarWidth + 1 - config.groupLineWidth) / 2),
					lineY = Math.floor(config.paddingTop) + Math.floor(getHeight(maxLinePrice)) + 0.5;
				var lineY2 = lineY + Math.floor(getHeight(data.highPrice, data.lowPrice));
				ctx.beginPath();
				if(config.groupLineWidth > 1){
					ctx.rect(lineX, lineY, config.groupLineWidth, Math.abs(lineY2 - lineY));
					ctx.stroke();
					ctx.fill();
				}else{
					ctx.moveTo(lineX, lineY);
					ctx.lineTo(lineX, lineY2);
					ctx.stroke();
				}
				
				/** 绘制蜡烛 */
				var barX = x,
					barY = Math.floor(config.paddingTop) + Math.floor(getHeight(maxBarPrice)) + 0.5;
				var barHeight = Math.floor(getHeight(data.openPrice, data.closePrice));

				ctx.beginPath();
				ctx.rect(barX, barY, config.groupBarWidth, barHeight);
				ctx.stroke();
				ctx.fill();
				
				data = null;
			}
			ctx.restore();
			
			return new RenderedKChart(this, _sketch, config, renderMetadata);
		};
		
		/**
		 * 渲染图形，并呈现至指定的DOM容器中
		 * @param domContainerObj {HTMLElement} DOM容器
		 * @param config {JsonObject} 渲染配置
		 * @param config.enclosedAreaBackground {String|KChart.LinearGradient} 折线与X轴围成的区域的背景色
		 * @return {RenderedKChart} 绘制的K线图
		 */
		this.renderAt = function(domContainerObj, config){
			var canvasObj = document.createElement("canvas");
			domContainerObj.appendChild(canvasObj);
			
			return this.render(canvasObj, config);
		};
	};
	KChart.prototype = Object.create(TradeChart.prototype);
	
	TradeChart.defineChart("KChart", KChart);
})();