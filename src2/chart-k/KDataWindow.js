;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;
	var eventDrive = TradeChart2.eventDrive;


	/**
	 * 事件名称：窗口尺寸发生了变更
	 * @type {string}
	 */
	var evtName_lengthChanges = "lengthchange";

	/**
	 * 事件名称：位置发生了变更
	 * @type {string}
	 */
	var evtName_offsetChanges = "offsetchange";

	/**
	 * @constructor
	 * K线图数据浏览窗口
	 */
	var KDataWindow = function(){
		var self = this;

		/* 窗口尺寸 */
		var length = 0;

		/**
		 * 当前位置相对初始位置的位移，单位：像素。
		 * 数值大于0代表窗口向右移动，从而看到较新的数据；
		 * 数值小于0代表窗口向左移动，从而看到较旧的数据；
		 *
		 * @type {number}
		 */
		var offsetFromRight = 0;


		/**
		 * 获取窗口尺寸
		 * @returns {Number}
		 */
		this.getLength = function(){
			return length;
		};

		/**
		 * 设置窗口尺寸
		 * @param {Number} v 窗口尺寸
		 * @returns {KDataWindow}
		 */
		this.setLength = function(v){
			if(!util.isValidNumber(v)){
				console.warn("Invalid window length: " + v);
				return this;
			}

			v = util.parseAsNumber(v, 0);
			if(v === 0){
				console.warn("Window length should be greater than 0");
				return this;
			}

			var flag = v !== length;
			length = v;
			if(flag)
				this.fire(evtName_lengthChanges, null, false);

			return this;
		};

		/**
		 * 获取当前位置相对初始位置的位移，单位：像素。
		 * @returns {number}
		 */
		this.getOffsetFromRight = function(){
			return offsetFromRight;
		};

		/**
		 * 更新当前位置相对初始位置的位移，单位：像素。
		 * @param {Number} movedOffset 位移幅度
		 * @returns {KDataWindow}
		 */
		this.updateOffsetFromRightBy = function(movedOffset){
			if(!util.isValidNumber(movedOffset)){
				console.warn("Invalid moved offset: " + movedOffset);
				return this;
			}

			movedOffset = util.parseAsNumber(movedOffset, 0);
			if(movedOffset === 0){
				return this;
			}

			offsetFromRight = offsetFromRight + movedOffset;
			this.fire(evtName_offsetChanges, null, false);

			return this;
		};

		var getElapsedDataCount = function(offset, groupBarSize, groupGap, ifIncludesHalfBar){
			if(arguments.length < 4)
				ifIncludesHalfBar = false;

			var tmp = offset;
			var elapsedDataCount = 0, i = 0;

			while(true){
				if(tmp <= 0)
					return elapsedDataCount;

				if(i % 2 === 0 || groupGap === 0){/* 处理柱子 */
					if(tmp >= groupBarSize || ifIncludesHalfBar){
						elapsedDataCount += 1;
						tmp -= groupBarSize;
					}else
						return elapsedDataCount;
				}else{/* 处理间隙 */
					if(tmp >= groupGap){
						tmp -= groupGap;
					}else{
						return elapsedDataCount;
					}
				}

				i++;
			}
		};

		/**
		 * 根据当前位置，获取最靠近窗口右侧的数据的索引位置（从右向左的索引位置）
		 * @param {Number} groupBarSize 柱子宽度
		 * @param {Number} groupGap 柱子之间的间隙
		 * @returns {Number}
		 */
		this.getRightSideDataIndexFromRight = function(groupBarSize, groupGap){
			return getElapsedDataCount(offsetFromRight, groupBarSize, groupGap, false);
		};

		/**
		 * 根据当前位置，获取最靠近窗口左侧的数据的索引位置（从右向左的索引位置）
		 * @param {Number} groupBarSize 柱子宽度
		 * @param {Number} groupGap 柱子之间的间隙
		 * @returns {Number}
		 */
		this.getLeftSideDataIndexFromRight = function(groupBarSize, groupGap){
			return getElapsedDataCount(offsetFromRight + length, groupBarSize, groupGap, true);
		};

		/**
		 * 根据当前位置，获取最右侧数据的渲染偏移
		 * 返回正数，代表窗口向左移动；
		 * 返回负数，代表窗口向右移动；
		 *
		 * @param {Number} groupBarSize 柱子宽度
		 * @param {Number} groupGap 柱子之间的间隙
		 * @returns {Number}
		 */
		this.getRightSideDataRenderingOffsetFromRight = function(groupBarSize, groupGap){
			var tmp = offsetFromRight;
			var halfGroupBarWidth = Math.floor(groupBarSize / 2);

			var i = 0, elapsedAmount = 0;
			while(true){
				if(i % 2 === 0 || groupGap === 0){/* 处理柱子 */
					if(tmp >= groupBarSize){
						tmp -= groupBarSize;
					}else
						return -tmp;
				}else{/* 处理间隙 */
					if(tmp >= groupGap){
						tmp -= groupGap;
					}else{
						return (groupGap - tmp);
					}
				}

				i++;
			}
		};

		/* 测试代码 */
		this.getRightSideDataRenderingOffsetFromRight.test = function(){
			document.body.innerHTML = "";
			var s = "";
			for(var L = 1; L < 7; L++)
				for(var B = 1; B <= L + 1; B++){
					var t = Math.max(L, B);
					for(var G = 0; G <= t + 1; G++){
						var divObj = document.createElement("div");
						divObj.classList.add("test");
						divObj.style.cssText = "text-align: right;";

						var gObj = document.createElement("div");
						gObj.className = "graph";

						var b = function(){
							var obj = document.createElement("div");
							obj.style.cssText = "display: inline-block; width: " + (B * 20) + "px; height: 20px; background: blue; border-left: solid 1px white; box-sizing: border-box;";
							return obj;
						};
						var g = function(){
							var obj = document.createElement("div");
							obj.style.cssText = "display: inline-block; width: " + (G * 20) + "px; height: 20px; background: red; border-left: solid 1px white; box-sizing: border-box;";
							return obj;
						};

						gObj.appendChild(b());
						gObj.appendChild(g());
						gObj.appendChild(b());
						gObj.appendChild(g());
						gObj.appendChild(b());
						gObj.appendChild(document.createElement("br"));

						var offsetObj = document.createElement("div");
						offsetObj.style.cssText = "display: inline-block; width: " + (20 * L) + "px; height: 20px; outline: solid 1px black;";
						gObj.appendChild(offsetObj);

						var rstObj = document.createElement("div");
						rstObj.className = "rst";
						rstObj.innerHTML = JSON.stringify([L, B, G]) + " = " + self.getRightSideDataRenderingOffsetFromRight(L, B, G);

						divObj.appendChild(gObj);
						divObj.appendChild(rstObj);
						document.body.appendChild(divObj);
					}
				}
		};

		eventDrive(this);
	};

	util.defineReadonlyProperty(TradeChart2, "KDataWindow", KDataWindow);
})();