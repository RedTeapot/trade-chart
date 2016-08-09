var tip = (function(){
	var container = document.createElement("div");
	container.style.cssText = "position: fixed; z-index: 31; left: 50%; bottom: 30%; margin-left: -110px; color: white; text-align: center; border-radius: 5px; width: 220px; height: 30px; line-height: 30px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; background: rgba(33, 33, 33, 0.8); font-size: 14px;";
	
	var timer = -1;
	
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
	 * @ops.content：提示的内容
	 * @ops.timeout: 显示时延，默认为2s
	 */
	var show = function(ops){
		ops = setDftValue(ops, {content: "", timeout: 3000});
		container.innerHTML = ops.content;
		
		clearTimeout(timer);
		
		/* 呈现出来 */
		document.body.appendChild(container);
		
		timer = setTimeout(function(){
			hide();
		}, ops.timeout);
	};
	
	/* 隐藏提示信息 */
	var hide = function(){
		clearTimeout(timer);
		container.parentNode && container.parentNode.removeChild(container);
	};
	
	return {show: show, hide: hide};
})();