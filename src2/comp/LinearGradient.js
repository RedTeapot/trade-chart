;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	/**
	 * 线性渐变
	 * @param {String[]} colorStops 色阶数组。如："["5%, white", "100%, black"]"
	 */
	var LinearGradient = function(colorStops){
		var stops = [];

		colorStops && colorStops.forEach(function(pair){
			var tmp = pair.split(/:/.test(pair)? /\s*:\s*/: /\s*,\s*/);
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

		/**
		 * 将线性渐变应用至指定的上下文中
		 * @param {CanvasRenderingContext2D} ctx 画布上下文
		 * @param {Float} x0 开始坐标的横坐标
		 * @param {Float} y0 开始坐标的纵坐标
		 * @param {Float} x1 结束坐标的横坐标
		 * @param {Float} y1 结束坐标的纵坐标
		 */
		this.apply = function(ctx, x0, y0, x1, y1){
			var bg = ctx.createLinearGradient(x0, y0, x1, y1);
			stops.forEach(function(stop){
				var offset = stop.offset;
				if(/%/.test(offset))
					offset = parseInt(offset.replace(/%/, "")) / 100;

				bg.addColorStop(offset, stop.color);
			});
			ctx.fillStyle = bg;

			return this;
		};
	};

	util.defineReadonlyProperty(TradeChart2, "LinearGradient", LinearGradient);
})();