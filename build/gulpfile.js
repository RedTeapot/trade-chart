var fs = require("fs"),
	gulp = require("gulp"),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	gap = require("gulp-append-prepend"),
	uglify = require("gulp-uglify");

var version = "1.0.0",
	buildVersion = "B1";

/**
 * 获取命令行中指定名称的参数
 * @param {String} name 参数名。区分大小写
 */
var getParameter = function(name){
	var args = process.argv;
	var index = args.indexOf("--" + name);
	if(-1 == index)
		return undefined;

	if(args.length == index + 1)
		return null;

	return args[index + 1];
};

/** 获取当前时间 */
var getTime = function(){
	var time = new Date();
	var year = time.getFullYear();
	var month =  "0" + String(time.getMonth() + 1);
	month = month.substring(month.length - 2);
	var date =  "0" + String(time.getDate());
	date = date.substring(date.length - 2);
	var hours = "0" + String(time.getHours());
	hours = hours.substring(hours.length - 2);
	var minutes = "0" + String(time.getMinutes());
	minutes = minutes.substring(minutes.length - 2);
	
	return year + month + date + hours + minutes;
};

var getVersion = function(){
	return version + buildVersion + "-" + getTime();
};

var min = function(list){
	list = list || ["trend", "k", "depth"];
	
	var arr = ['../src/trade-chart.js'];
	if(list.indexOf("trend") != -1)
		arr.push('../src/trend/canvas/trade-chart_trend.js');
	if(list.indexOf("k") != -1)
		arr.push('../src/k/canvas/trade-chart_k.js');
	if(list.indexOf("depth") != -1)
		arr.push('../src/depth/canvas/trade-chart_depth.js');
	
	gulp.src(arr)
		.pipe(concat("trade-chart." + getVersion() + ".min.js")).on("error", function(e){console.error(e, e.stack);})
        .pipe(uglify()).on("error", function(e){console.error(e, e.stack);})
		.pipe(gap.prependText('/**\n * trade-chart.js v' + getVersion() + '\n * author: Billy, wmjhappy_ok@126.com\n */')).on("error", function(e){console.error(e, e.stack);})
        .pipe(gulp.dest('../')).on("error", function(e){console.error(e, e.stack);});
};

gulp.task('min', function(){
	var includes = getParameter("includes");
	if(null != includes)
		includes = includes.split(/\s*,\s*/).reduce(function(rst, tmp){
			tmp = tmp.trim();
			if(tmp == "")
				return rst;
			
			if(rst.indexOf(tmp) == -1)
				rst.push(tmp);
			return rst;
		}, []);
	min(includes);
});