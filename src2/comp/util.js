;(function(){
	var TradeChart2 = window.TradeChart2;

	/**
	 * 定义只读属性
	 * @param {Object} obj 目标对象
	 * @param {String} name 要定义的属性名称
	 * @param {*} value 要定义的取值
	 */
	var defineReadonlyProperty = function(obj, name, value){
		if(name in obj)
			return;

		Object.defineProperty(obj, name, {value: value, configurable: false, writable: false});
	};

	/**
	 * 设定参数默认值
	 */
	var setDftValue = function(ops, dftOps){
		ops = ops || {};
		dftOps = dftOps || {};

		/* 参数不存在时，从默认参数中读取并赋值 */
		for(var p in dftOps)
			if(!(p in ops))
				ops[p] = dftOps[p];

		return ops;
	};

	/**
	 * 格式化钱数字
	 * @param {Number} amount 金额
	 * @param {Number} precision 精度。默认2位
	 */
	var formatMoney = (function(){
		var arr = [[1000, "K"], [1000000, "M"], [1000000000, "G"]];

		return function(amount, precision){
			if(arguments.length < 2)
				precision = 2;

			for(var i = 0; i < arr.length; i++){
				if(amount >= arr[i][0])
					return (amount / arr[i][0]).toFixed(precision).replace(/(\.[^0])0+/, "$1") + arr[i][1];
			}

			return amount.toFixed(precision).replace(/(\.[^0])0+$/, "$1");
		};
	})();

	/**
	 * 克隆对象
	 * @param obj {Object} 要克隆的对象
	 * @param keepType {Boolean} 是否保持对象类型。默认为：true
	 */
	var cloneObject = function(obj, keepType){
		if(null === obj)
			return null;
		if(undefined === obj)
			return undefined;

		if(arguments.length < 2)
			keepType = true;

		var newObj = {};
		for(var p in obj){
			var v = obj[p];

			if((typeof v === "object") && !keepType){
				newObj[p] = cloneObject(v, true);
			}else
				newObj[p] = v;
		}

		return newObj;
	};

	/**
	 * 设备像素密度
	 */
	var pixelRatio = (function(){
		var ctx = document.createElement("canvas").getContext("2d"),
			dpr = window.devicePixelRatio || 1,
			bspr = ctx.webkitBackingStorePixelRatio ||
				ctx.mozBackingStorePixelRatio ||
				ctx.msBackingStorePixelRatio ||
				ctx.oBackingStorePixelRatio ||
				ctx.backingStorePixelRatio || 1;
		var ratio = dpr / bspr;

		return function(){
			return ratio;
		};
	})();

	/**
	 * 设置属性
	 * @param{HTMLElement} obj  要设置的元素
	 * @param {Object} props 属性集合
	 */
	var setAttributes = function(obj, props){
		if(null == props)
			return;
		for(var p in props)
			obj.setAttribute(p, props[p]);
	};

	/**
	 * 判断给定的字符串是否是空字符串
	 * @param {String} str 要判断的字符串
	 * @param {Boolean} [trim=true] 是否在判断前执行前后空白符号的裁剪操作
	 */
	var isEmptyString = function(str, trim){
		if(arguments.length < 2)
			trim = true;

		if(null === str || undefined === str)
			return true;

		str = String(str);
		if(trim)
			str = str.trim();

		return str.length === 0;
	};

	/**
	 * 尝试调用指定的方法
	 * @param {Function} func 待执行的方法
	 * @param {Object} ctx 方法执行时的this上下文
	 * @param {Arguments} args 方法参数列表对象
	 */
	var try2Apply = function(func, ctx, args){
		if(null === func || typeof func !== "function")
			return;

		try{
			return func.apply(ctx, args);
		}catch(e){
			console.error("Error occurred while executing function: " + func.name, e, e.stack);
			return undefined;
		}
	};

	/**
	 * 尝试调用指定的方法
	 * @param {Function} func 待执行的方法
	 * @param {Object} ctx 方法执行时的this上下文
	 * @param {*} args... 方法参数列表
	 */
	var try2Call = function(func, ctx, args){
		if(null === func || typeof func !== "function")
			return undefined;

		try{
			var len = arguments.length;

			if(len === 1)
				return func();
			else if(len === 2)
				return func.call(ctx);
			else if(len === 3)
				return func.call(ctx, arguments[2]);
			else if(len === 4)
				return func.call(ctx, arguments[2], arguments[3]);
			else if(len === 5)
				return func.call(ctx, arguments[2], arguments[3], arguments[4]);
			else if(len === 6)
				return func.call(ctx, arguments[2], arguments[3], arguments[4], arguments[5]);
			else if(len === 7)
				return func.call(ctx, arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
			else{
				var tmp = "", index = 2;
				for(var i = index; i < arguments.length; i++)
					tmp += ",arguments[" + i + "]";

				var rst;
				eval("rst = func.call(ctx" + tmp + ")");
				return rst;
			}
		}catch(e){
			console.error("Error occurred while executing function: " + func.name, e);
			return undefined;
		}
	};

	/**
	 * 将给定的字符串自连n次后返回
	 * @param str {String} 要重复的字符串单元
	 * @param n {Number} 要重复的次数
	 * @return {String} 重复连接后的字符串
	 */
	var repeatString = function(str, n){
		var s = "";
		while(n-- > 0)
			s += str;
		return s;
	};

	/**
	 * 生成随机字符串
	 * @param {String} [prefix=""] 前缀
	 * @param {Number} [len=10] 除前缀外，要随机生成的字符串的长度
	 */
	var randomString = (function(){
		var i = 0, tailLength = 2;
		var alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

		var getTail = function(){
			var s = repeatString("0", tailLength) + (i++).toString(36);
			if(i > Math.pow(16, tailLength))
				i = 0;

			return s.substring(s.length -tailLength);
		};

		return function(prefix, len){
			if(arguments.length < 2)
				len = 10;
			if(arguments.length < 1)
				prefix = "";

			var minLen = tailLength + 1;
			if(len < minLen)
				throw new Error("Length should not be little than " + minLen);
			len -= tailLength;

			var str = "";
			while(len-- > 0){
				var index = Math.floor(Math.random() * alphabet.length);
				str += alphabet.charAt(index);
			}

			return prefix + str + getTail();
		};
	})();

	/**
	 * 判断给定的元素是否为一个合法的数字，或合法数字的字符串
	 * @param {*} tar 要判断的对象
	 */
	var isValidNumber = function(tar){
		var isEmpty = isEmptyString(tar, true);
		return !isEmpty && (/^\d*(?:\.\d+)?$/.test(tar) || /^\d+\.\d*$/.test(tar));
	};

	/**
	 * 解析给定的参数将其以数字形式返回
	 * @param {Big|*} tar 要解析的参数
	 * @param {Number} [dftValue] 如果要解析的参数不是一个合法的数字时，要返回的默认数字
	 * @returns {*}
	 */
	var parseAsNumber = function(tar, dftValue){
		if(tar instanceof util.Big)
			tar = tar.toString();

		var isNumber = isValidNumber(tar);
		if(isNumber)
			return Number(tar);

		if(arguments.length > 1)
			return Number(dftValue);

		return tar;
	};

	/**
	 * 从给定的数字中获取该数字所使用的精度
	 * @param {Number} num 数字精度
	 * @returns {Number}
	 */
	var getPrecision = function(num){
		var tmp = String(num);
		var lastDotIndex = tmp.lastIndexOf(".");
		if(-1 === lastDotIndex)
			return 0;

		return tmp.substring(lastDotIndex + 1).length;
	};

	/**
	 * 使用给定的尺寸初始化画布
	 */
	var initCanvas = (function(){
		var initFlag = randomString("CANVAS_TRADE_CHART_INIT_FLAG");

		/**
		 * 使用给定的尺寸初始化画布
		 * @param {HTMLCanvasElement} canvasObj 要初始化的画布
		 * @param {Number} width 画布要呈现的宽度
		 * @param {Number} height 画布要呈现的高度
		 *
		 * @returns {CanvasRenderingContext2D}
		 */
		return function(canvasObj, width, height){
			var ctx = canvasObj.getContext("2d");

			if(canvasObj.initFlag){
				console.warn("The canvas was initialized already.");
				return ctx;
			}

			/* 高分辨率适应 */
			var pr = pixelRatio();
			if(pr > 1){
				canvasObj.style.width = width + "px";
				canvasObj.style.height = height + "px";

				setAttributes(canvasObj, {width: pr * width, height: pr * height});
			}else{
				canvasObj.style.width = "";
				canvasObj.style.height = "";

				setAttributes(canvasObj, {width: width, height: height});
			}

			ctx.scale(pr, pr);
			canvasObj.initFlag = true;

			return ctx;
		};
	})();

	/**
	 * 计算给定画布的渲染宽度
	 * @param {HTMLCanvasElement} canvasObj 要计算的画布
	 * @param {String|Number} configuredWidth 配置的绘制宽度。支持像素单位的数字和代表百分比的字符串（如：100%）
	 * @returns {Number}
	 */
	var calcRenderingWidth = function(canvasObj, configuredWidth){
		var width = configuredWidth;
		var r = /%/;
		if(r.test(configuredWidth) || !isValidNumber(configuredWidth))
			width = canvasObj.parentElement.clientWidth * parseInt(configuredWidth.replace(r, "")) / 100;

		return width;
	};

	/**
	 * 计算给定画布的渲染高度
	 * @param {HTMLCanvasElement} canvasObj 要计算的画布
	 * @param {String|Number} configuredHeight 配置的绘制高度。支持像素单位的数字和代表百分比的字符串（如：100%）
	 * @returns {Number}
	 */
	var calcRenderingHeight = function(canvasObj, configuredHeight){
		var height = configuredHeight;
		var r = /%/;
		if(r.test(configuredHeight) || !isValidNumber(configuredHeight))
			height = canvasObj.parentElement.clientHeight * parseInt(configuredHeight.replace(r, "")) / 100;

		return height;
	};

	/**
	 * 根据给定的数据计算返回对应在画布上可以清晰绘制线条的位置
	 * @param {String|Number|Big} d 坐标位置
	 */
	var getLinePosition = function(d){
		if(!isValidNumber(d))
			throw new Error("Invalid line position: " + d);

		return Math.floor(parseAsNumber(d)) + 0.5;
	};

	/**
	 * 工具集合
	 */
	var util = {
		setDftValue: setDftValue,
		cloneObject: cloneObject,
		formatMoney: formatMoney,
		setAttributes: setAttributes,
		pixelRatio: pixelRatio,
		isValidNumber: isValidNumber,
		isEmptyString: isEmptyString,
		repeatString: repeatString,
		randomString: randomString,
		try2Call: try2Call,
		try2Apply: try2Apply,
		parseAsNumber: parseAsNumber,
		getPrecision: getPrecision,
		initCanvas: initCanvas,
		calcRenderingWidth: calcRenderingWidth,
		calcRenderingHeight: calcRenderingHeight,
		getLinePosition: getLinePosition,
		defineReadonlyProperty: defineReadonlyProperty
	};

	/* big.js v3.1.3 https://github.com/MikeMcl/big.js/LICENCE */
	(function(global){"use strict";var DP=20,RM=1,MAX_DP=1e6,MAX_POWER=1e6,E_NEG=-7,E_POS=21,P={},isValid=/^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,Big;function bigFactory(){function Big(n){var x=this;if(!(x instanceof Big)){return n===void 0?bigFactory():new Big(n)}if(n instanceof Big){x.s=n.s;x.e=n.e;x.c=n.c.slice()}else{parse(x,n)}x.constructor=Big}Big.prototype=P;Big.DP=DP;Big.RM=RM;Big.E_NEG=E_NEG;Big.E_POS=E_POS;return Big}function format(x,dp,toE){var Big=x.constructor,i=dp-(x=new Big(x)).e,c=x.c;if(c.length>++dp){rnd(x,i,Big.RM)}if(!c[0]){++i}else if(toE){i=dp}else{c=x.c;i=x.e+i+1}for(;c.length<i;c.push(0)){}i=x.e;return toE===1||toE&&(dp<=i||i<=Big.E_NEG)?(x.s<0&&c[0]?"-":"")+(c.length>1?c[0]+"."+c.join("").slice(1):c[0])+(i<0?"e":"e+")+i:x.toString()}function parse(x,n){var e,i,nL;if(n===0&&1/n<0){n="-0"}else if(!isValid.test(n+="")){throwErr(NaN)}x.s=n.charAt(0)=="-"?(n=n.slice(1),-1):1;if((e=n.indexOf("."))>-1){n=n.replace(".","")}if((i=n.search(/e/i))>0){if(e<0){e=i}e+=+n.slice(i+1);n=n.substring(0,i)}else if(e<0){e=n.length}for(i=0;n.charAt(i)=="0";i++){}if(i==(nL=n.length)){x.c=[x.e=0]}else{for(;n.charAt(--nL)=="0";){}x.e=e-i-1;x.c=[];for(e=0;i<=nL;x.c[e++]=+n.charAt(i++)){}}return x}function rnd(x,dp,rm,more){var u,xc=x.c,i=x.e+dp+1;if(rm===1){more=xc[i]>=5}else if(rm===2){more=xc[i]>5||xc[i]==5&&(more||i<0||xc[i+1]!==u||xc[i-1]&1)}else if(rm===3){more=more||xc[i]!==u||i<0}else{more=false;if(rm!==0){throwErr("!Big.RM!")}}if(i<1||!xc[0]){if(more){x.e=-dp;x.c=[1]}else{x.c=[x.e=0]}}else{xc.length=i--;if(more){for(;++xc[i]>9;){xc[i]=0;if(!i--){++x.e;xc.unshift(1)}}}for(i=xc.length;!xc[--i];xc.pop()){}}return x}function throwErr(message){var err=new Error(message);err.name="BigError";throw err}P.abs=function(){var x=new this.constructor(this);x.s=1;return x};P.cmp=function(y){var xNeg,x=this,xc=x.c,yc=(y=new x.constructor(y)).c,i=x.s,j=y.s,k=x.e,l=y.e;if(!xc[0]||!yc[0]){return!xc[0]?!yc[0]?0:-j:i}if(i!=j){return i}xNeg=i<0;if(k!=l){return k>l^xNeg?1:-1}i=-1;j=(k=xc.length)<(l=yc.length)?k:l;for(;++i<j;){if(xc[i]!=yc[i]){return xc[i]>yc[i]^xNeg?1:-1}}return k==l?0:k>l^xNeg?1:-1};P.div=function(y){var x=this,Big=x.constructor,dvd=x.c,dvs=(y=new Big(y)).c,s=x.s==y.s?1:-1,dp=Big.DP;if(dp!==~~dp||dp<0||dp>MAX_DP){throwErr("!Big.DP!")}if(!dvd[0]||!dvs[0]){if(dvd[0]==dvs[0]){throwErr(NaN)}if(!dvs[0]){throwErr(s/0)}return new Big(s*0)}var dvsL,dvsT,next,cmp,remI,u,dvsZ=dvs.slice(),dvdI=dvsL=dvs.length,dvdL=dvd.length,rem=dvd.slice(0,dvsL),remL=rem.length,q=y,qc=q.c=[],qi=0,digits=dp+(q.e=x.e-y.e)+1;q.s=s;s=digits<0?0:digits;dvsZ.unshift(0);for(;remL++<dvsL;rem.push(0)){}do{for(next=0;next<10;next++){if(dvsL!=(remL=rem.length)){cmp=dvsL>remL?1:-1}else{for(remI=-1,cmp=0;++remI<dvsL;){if(dvs[remI]!=rem[remI]){cmp=dvs[remI]>rem[remI]?1:-1;break}}}if(cmp<0){for(dvsT=remL==dvsL?dvs:dvsZ;remL;){if(rem[--remL]<dvsT[remL]){remI=remL;for(;remI&&!rem[--remI];rem[remI]=9){}--rem[remI];rem[remL]+=10}rem[remL]-=dvsT[remL]}for(;!rem[0];rem.shift()){}}else{break}}qc[qi++]=cmp?next:++next;if(rem[0]&&cmp){rem[remL]=dvd[dvdI]||0}else{rem=[dvd[dvdI]]}}while((dvdI++<dvdL||rem[0]!==u)&&s--);if(!qc[0]&&qi!=1){qc.shift();q.e--}if(qi>digits){rnd(q,dp,Big.RM,rem[0]!==u)}return q};P.eq=function(y){return!this.cmp(y)};P.gt=function(y){return this.cmp(y)>0};P.gte=function(y){return this.cmp(y)>-1};P.lt=function(y){return this.cmp(y)<0};P.lte=function(y){return this.cmp(y)<1};P.sub=P.minus=function(y){var i,j,t,xLTy,x=this,Big=x.constructor,a=x.s,b=(y=new Big(y)).s;if(a!=b){y.s=-b;return x.plus(y)}var xc=x.c.slice(),xe=x.e,yc=y.c,ye=y.e;if(!xc[0]||!yc[0]){return yc[0]?(y.s=-b,y):new Big(xc[0]?x:0)}if(a=xe-ye){if(xLTy=a<0){a=-a;t=xc}else{ye=xe;t=yc}t.reverse();for(b=a;b--;t.push(0)){}t.reverse()}else{j=((xLTy=xc.length<yc.length)?xc:yc).length;for(a=b=0;b<j;b++){if(xc[b]!=yc[b]){xLTy=xc[b]<yc[b];break}}}if(xLTy){t=xc;xc=yc;yc=t;y.s=-y.s}if((b=(j=yc.length)-(i=xc.length))>0){for(;b--;xc[i++]=0){}}for(b=i;j>a;){if(xc[--j]<yc[j]){for(i=j;i&&!xc[--i];xc[i]=9){}--xc[i];xc[j]+=10}xc[j]-=yc[j]}for(;xc[--b]===0;xc.pop()){}for(;xc[0]===0;){xc.shift();--ye}if(!xc[0]){y.s=1;xc=[ye=0]}y.c=xc;y.e=ye;return y};P.mod=function(y){var yGTx,x=this,Big=x.constructor,a=x.s,b=(y=new Big(y)).s;if(!y.c[0]){throwErr(NaN)}x.s=y.s=1;yGTx=y.cmp(x)==1;x.s=a;y.s=b;if(yGTx){return new Big(x)}a=Big.DP;b=Big.RM;Big.DP=Big.RM=0;x=x.div(y);Big.DP=a;Big.RM=b;return this.minus(x.times(y))};P.add=P.plus=function(y){var t,x=this,Big=x.constructor,a=x.s,b=(y=new Big(y)).s;if(a!=b){y.s=-b;return x.minus(y)}var xe=x.e,xc=x.c,ye=y.e,yc=y.c;if(!xc[0]||!yc[0]){return yc[0]?y:new Big(xc[0]?x:a*0)}xc=xc.slice();if(a=xe-ye){if(a>0){ye=xe;t=yc}else{a=-a;t=xc}t.reverse();for(;a--;t.push(0)){}t.reverse()}if(xc.length-yc.length<0){t=yc;yc=xc;xc=t}a=yc.length;for(b=0;a;){b=(xc[--a]=xc[a]+yc[a]+b)/10|0;xc[a]%=10}if(b){xc.unshift(b);++ye}for(a=xc.length;xc[--a]===0;xc.pop()){}y.c=xc;y.e=ye;return y};P.pow=function(n){var x=this,one=new x.constructor(1),y=one,isNeg=n<0;if(n!==~~n||n<-MAX_POWER||n>MAX_POWER){throwErr("!pow!")}n=isNeg?-n:n;for(;;){if(n&1){y=y.times(x)}n>>=1;if(!n){break}x=x.times(x)}return isNeg?one.div(y):y};P.round=function(dp,rm){var x=this,Big=x.constructor;if(dp==null){dp=0}else if(dp!==~~dp||dp<0||dp>MAX_DP){throwErr("!round!")}rnd(x=new Big(x),dp,rm==null?Big.RM:rm);return x};P.sqrt=function(){var estimate,r,approx,x=this,Big=x.constructor,xc=x.c,i=x.s,e=x.e,half=new Big("0.5");if(!xc[0]){return new Big(x)}if(i<0){throwErr(NaN)}i=Math.sqrt(x.toString());if(i===0||i===1/0){estimate=xc.join("");if(!(estimate.length+e&1)){estimate+="0"}r=new Big(Math.sqrt(estimate).toString());r.e=((e+1)/2|0)-(e<0||e&1)}else{r=new Big(i.toString())}i=r.e+(Big.DP+=4);do{approx=r;r=half.times(approx.plus(x.div(approx)))}while(approx.c.slice(0,i).join("")!==r.c.slice(0,i).join(""));rnd(r,Big.DP-=4,Big.RM);return r};P.mul=P.times=function(y){var c,x=this,Big=x.constructor,xc=x.c,yc=(y=new Big(y)).c,a=xc.length,b=yc.length,i=x.e,j=y.e;y.s=x.s==y.s?1:-1;if(!xc[0]||!yc[0]){return new Big(y.s*0)}y.e=i+j;if(a<b){c=xc;xc=yc;yc=c;j=a;a=b;b=j}for(c=new Array(j=a+b);j--;c[j]=0){}for(i=b;i--;){b=0;for(j=a+i;j>i;){b=c[j]+yc[i]*xc[j-i-1]+b;c[j--]=b%10;b=b/10|0}c[j]=(c[j]+b)%10}if(b){++y.e}if(!c[0]){c.shift()}for(i=c.length;!c[--i];c.pop()){}y.c=c;return y};P.toString=P.valueOf=P.toJSON=function(){var x=this,Big=x.constructor,e=x.e,str=x.c.join(""),strL=str.length;if(e<=Big.E_NEG||e>=Big.E_POS){str=str.charAt(0)+(strL>1?"."+str.slice(1):"")+(e<0?"e":"e+")+e}else if(e<0){for(;++e;str="0"+str){}str="0."+str}else if(e>0){if(++e>strL){for(e-=strL;e--;str+="0"){}}else if(e<strL){str=str.slice(0,e)+"."+str.slice(e)}}else if(strL>1){str=str.charAt(0)+"."+str.slice(1)}return x.s<0&&x.c[0]?"-"+str:str};P.toExponential=function(dp){if(dp==null){dp=this.c.length-1}else if(dp!==~~dp||dp<0||dp>MAX_DP){throwErr("!toExp!")}return format(this,dp,1)};P.toFixed=function(dp){var str,x=this,Big=x.constructor,neg=Big.E_NEG,pos=Big.E_POS;Big.E_NEG=-(Big.E_POS=1/0);if(dp==null){str=x.toString()}else if(dp===~~dp&&dp>=0&&dp<=MAX_DP){str=format(x,x.e+dp);if(x.s<0&&x.c[0]&&str.indexOf("-")<0){str="-"+str}}Big.E_NEG=neg;Big.E_POS=pos;if(!str){throwErr("!toFix!")}return str};P.toPrecision=function(sd){if(sd==null){return this.toString()}else if(sd!==~~sd||sd<1||sd>MAX_DP){throwErr("!toPre!")}return format(this,sd-1,2)};Big=bigFactory();if(typeof define==="function"&&define.amd){define(function(){return Big})}else if(typeof module!=="undefined"&&module.exports){module.exports=Big}else{global.Big=Big}})(util);

	defineReadonlyProperty(TradeChart2, "util", util);
})();