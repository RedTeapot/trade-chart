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
			heightPriceRatio: 0,/** 高度与价格之间的映射比例 */
			maxDotCount: 0/** 可呈现的最多的点的个数 */
		};
		
		/* 数据概览扫描 */
		datas.forEach((function(){
			var previous = {price: 0};
			var variationSum = 0;
			
			return function(d, i){
				/* 数据格式转换 */
				d = dataParser? dataParser(d, i): d;
				
				if(+d.price > dataSketch.origin.max)
					dataSketch.origin.max = +d.price;
				if(+d.price < dataSketch.origin.min)
					dataSketch.origin.min = +d.price;
				
				var variation = Math.abs(+d.price - +previous.price);
				
				/* 确定更大的价格变动幅度 */
				if(variation > dataSketch.origin.maxVariation)
					dataSketch.origin.maxVariation = variation;
				previous = d;
				
				/* 确定平均的价格变动幅度 */
				variationSum += variation;
				if(i == datas.length - 1){
					dataSketch.origin.avgVariation = variationSum / datas.length;
				}
			};
		})());

		if(null != config.axisYPriceFloor){
			if(typeof config.axisYPriceFloor == "function")
				dataSketch.extended.priceFloor = config.axisYPriceFloor(dataSketch.origin.min, dataSketch.origin.max, dataSketch.origin.avgVariation, dataSketch.origin.maxVariation);
			else
				dataSketch.extended.priceFloor = Number(config.axisYPriceFloor);
		}else
			dataSketch.extended.priceFloor = dataSketch.origin.min - (dataSketch.origin.avgVariation / 2);
		if(null != config.axisYPriceCeiling){
			if(typeof config.axisYPriceCeiling == "function")
				dataSketch.extended.priceCeiling = config.axisYPriceCeiling(dataSketch.origin.min, dataSketch.origin.max, dataSketch.origin.avgVariation, dataSketch.origin.maxVariation);
			else
				dataSketch.extended.priceCeiling = Number(config.axisYPriceCeiling);
		}else
			dataSketch.extended.priceCeiling = dataSketch.origin.max + (dataSketch.origin.avgVariation / 2);

		dataSketch.extended.priceFloor = dataSketch.extended.priceFloor < 0? 0: dataSketch.extended.priceFloor;
		dataSketch.extended.priceCeiling = dataSketch.extended.priceCeiling < dataSketch.origin.max? dataSketch.origin.max: dataSketch.extended.priceCeiling;
		dataSketch.extended.priceCeiling = (dataSketch.extended.priceCeiling - dataSketch.extended.priceFloor < 2E-7)? (dataSketch.extended.priceFloor + 1): dataSketch.extended.priceCeiling;

		chartSketch.width = config.width - config.paddingLeft - config.paddingRight;
		chartSketch.contentWidth = chartSketch.width - config.axisXTickOffset;
		chartSketch.height = config.height - config.paddingTop - config.paddingBottom;
		chartSketch.contentHeight = chartSketch.height - config.axisYTickOffset;
		chartSketch.heightPriceRatio = (dataSketch.extended.priceCeiling - dataSketch.extended.priceFloor) / chartSketch.height;
		chartSketch.maxDotCount = Math.floor(chartSketch.contentWidth / config.dotGap) + 1;
		
		return {data: dataSketch, chart: chartSketch};
	};
	
	/**
	 * 线性渐变
	 * @param colorStops {StringArray} 色阶数组。如："["5%, white", "100%, black"]"
	 */
	var LinearGradient = function(colorStops){
		var stops = [];
		
		colorStops && colorStops.forEach(function(pair){
			var tmp = pair.split(/\s*,\s*/);
			stops.push({offset: tmp[0], color: tmp[1]});
		});
		
		/**
		 * 添加色阶
		 * @param offset {String} 位置
		 * @param color {String} 色值
		 */
		this.addColorStop = function(offset, color){
			stops.push({offset: offset, color: color});
			
			return this;
		};
		
		/**
		 * 获取色阶配置
		 */
		this.getStops = function(){
			return stops;
		};
	};
	
	/**
	 * @constructor
	 * 分时图
	 * 数据格式：{time: "", price: 12.01}
	 * 
	 */
	var TrendChart = function(){
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
		 * 渲染图形，并呈现至指定的DOM容器中
		 * @param domContainerObj {HTMLElement} DOM容器
		 * @param config {JsonObject} 渲染配置
		 * @param config.encircledAreaBackground {String|TrendChart.LinearGradient} 折线与X轴围成的区域的背景色
		 */
		this.renderAt = function(domContainerObj, config){
			config = util.cloneObject(config, true);
			
			config = util.setDftValue(config, {
				width: "100%",/* 整体图形宽度 */
				height: 300,/* 整体图形高度 */
				
				/** 图形内边距（坐标系外边距） */
				paddingTop: 20,
				paddingBottom: 20,
				paddingLeft: 60,
				paddingRight: 20,
				
				dotGap: 5,/** 相邻两个点之间的间隔 */
				
				axisTickLineLength: 6,/* 坐标轴刻度线的长度 */
				axisLabelOffset: 5,/* 坐标标签距离坐标轴刻度线的距离 */
				
				axisXTickOffset: 30,/* 横坐标刻度距离原点的位移 */
				axisXTickInterval: 5,/** 横坐标刻度之间相差的点的个数 */
				
				axisYTickOffset: 0,/* 纵坐标刻度距离原点的位移 */
				axisYMidTickQuota: 3,/** 纵坐标刻度个数（不包括最小值和最大值） */
				axisYPrecision: 2,/** 纵坐标的数字精度 */
				axisYFormatter: function(price, config){/** 纵坐标数字格式化方法 */
					/** price：价格；config：配置 */
					return util.formatMoney(price, config.axisYPrecision);
				},
				axisYPriceFloor: function(min, max, avgVariation, maxVariation){
					return min - avgVariation / 2;
				},
				axisYPriceCeiling: function(min, max, avgVariation, maxVariation){
					return max + avgVariation / 2;
				},
				
				encircledAreaBackground: "none"
			});
			
			/** 创建SVG容器 */
			var svgObj = util.createSvgElement("svg");
			util.setAttributes(svgObj, {width: config.width, height: config.height, style: "width: " + config.width + "; height: " + config.height});
			domContainerObj.appendChild(svgObj);
			
			/* 百分比尺寸自动转换 */
			if(/[^\d\.]/.test(config.width)){
				config.width = svgObj.clientWidth;
				util.setAttributes(svgObj, {width: config.width});
			}if(/[^\d\.]/.test(config.height)){
				config.height = svgObj.clientHeight;
				util.setAttributes(svgObj, {height: config.height});
			}
			svgObj.style.cssText = "";
			
			var _sketch = sketch(datas, dataParser, config);
			console.log(_sketch);
			
			/* 绘制坐标系 */
			var mainObj = util.createSvgElement("g");
			var axisX = util.createSvgElement("path"),
				axisY = util.createSvgElement("path"),
				axisXGroup = util.createSvgElement("g"),
				axisYGroup = util.createSvgElement("g");
			
			util.setAttributes(mainObj, {width: _sketch.chart.width, height: _sketch.chart.height, transform: "translate(" + config.paddingLeft + ", " + config.paddingTop + ")"});
			
			/* 绘制X轴及刻度 */
			util.setAttributes(axisXGroup, {class: "axis x", transform: "translate(0, " + _sketch.chart.height + ")"});
			util.setAttributes(axisX, {d: "m0,0l" + _sketch.chart.width + ",0Z"})
			var axisXTickGroup = util.createSvgElement("g");
			util.setAttributes(axisXTickGroup, {class: "ticks", transform: "translate(" + config.axisXTickOffset + ", 0)"});
			var dotCount = Math.min(_sketch.chart.maxDotCount, datas.length);
			for(var i = 0; i < dotCount; i += config.axisXTickInterval){
				var data = datas[i];
				/* 数据格式转换 */
				data = dataParser? dataParser(data, i): data;
				
				var lineObj = util.createSvgElement("line"),
					textObj = util.createSvgElement("text"),
					groupObj = util.createSvgElement("g");
				
				textObj.innerHTML = data.time;
				util.setAttributes(lineObj, {x2: 0, y2: config.axisTickLineLength});
				util.setAttributes(textObj, {y: config.axisTickLineLength + config.axisLabelOffset, dy: "1em"});
				util.setAttributes(groupObj, {transform: "translate(" + (config.dotGap * i) + ", 0)", "data-index": i});
				
				groupObj.appendChild(lineObj);
				groupObj.appendChild(textObj);
				axisXTickGroup.appendChild(groupObj);
			}
			axisXGroup.appendChild(axisXTickGroup);
			axisXGroup.appendChild(axisX);
			mainObj.appendChild(axisXGroup);
			
			/* 绘制Y轴 */
			util.setAttributes(axisYGroup, {class: "axis y"});
			util.setAttributes(axisY, {d: "m0,0l0," + _sketch.chart.height + "Z"})
			/* 绘制刻度 */
			var axisYTickGroup = util.createSvgElement("g");
			util.setAttributes(axisYTickGroup, {class: "ticks", transform: "translate(0, -" + config.axisYTickOffset + ")"});
			var axisYPriceInterval = (_sketch.data.extended.priceCeiling - _sketch.data.extended.priceFloor) / (config.axisYMidTickQuota + 1);
			var axisYHeightInterval = axisYPriceInterval / _sketch.chart.heightPriceRatio;
			for(var i = 0; i <= config.axisYMidTickQuota + 1; i++){
				var lineObj = util.createSvgElement("line"),
					textObj = util.createSvgElement("text"),
					groupObj = util.createSvgElement("g");
				
				var price = _sketch.data.extended.priceFloor + i * axisYPriceInterval,
					tickOffset = (config.axisYMidTickQuota + 1 - i) * axisYHeightInterval;
				
				var format = config.axisYFormatter || util.formatMoney;
				textObj.innerHTML = format(price, config);
				util.setAttributes(lineObj, {x2: -config.axisTickLineLength, y2: 0});
				util.setAttributes(textObj, {x: -(config.axisTickLineLength + config.axisLabelOffset), dy: "0.5em"});
				util.setAttributes(groupObj, {transform: "translate(0, " + tickOffset + ")"});
				
				groupObj.appendChild(lineObj);
				groupObj.appendChild(textObj);
				axisYTickGroup.appendChild(groupObj);
			}
			axisYGroup.appendChild(axisYTickGroup);
			axisYGroup.appendChild(axisY);
			mainObj.appendChild(axisYGroup);
			
			/** 绘制折现区域 */
			var trendObj = util.createSvgElement("path");
			var d = "m0," + _sketch.chart.contentHeight;
			for(var i = 0; i < dotCount; i++){
				var data = datas[i];
				/* 数据格式转换 */
				data = dataParser? dataParser(data, i): data;
				
				var priceVariation = _sketch.data.extended.priceCeiling - data.price;
				var height = priceVariation / _sketch.chart.heightPriceRatio;
				d += "L" + (i * config.dotGap) + "," + height;
			}
			d += "L" + ((dotCount - 1) * config.dotGap) + "," + _sketch.chart.contentHeight;
			d += "L0," + _sketch.chart.contentHeight + "Z";
			util.setAttributes(trendObj, {transform: "translate(" + config.axisXTickOffset + ",0)", d: d, fill: config.encircledAreaBackground? "url(#linearGradient)": config.encircledAreaBackground});
			mainObj.appendChild(trendObj);
			
			/** 渐变背影 */
			if(config.encircledAreaBackground){
				var linearGradientObj = util.createSvgElement("linearGradient");
				
				config.encircledAreaBackground.getStops().forEach(function(stop){
					var stopObj = util.createSvgElement("stop");
					util.setAttributes(stopObj, {offset: stop.offset, "stop-color": stop.color});
					linearGradientObj.appendChild(stopObj);
				});
				util.setAttributes(linearGradientObj, {id: "linearGradient", gradientTransform: "rotate(90)"});
				svgObj.appendChild(linearGradientObj);
			}
			
			svgObj.appendChild(mainObj);
		};
	};
	TrendChart.prototype = Object.create(TradeChart.prototype);
	
	/** 接口暴露 */
	Object.defineProperty(TrendChart, "LinearGradient", {value: LinearGradient, writable: false, configurable: false});
	
	TradeChart.defineChart("TrendChart", TrendChart);
})();