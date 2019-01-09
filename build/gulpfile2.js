var fs = require("fs"),
	merge2 = require("merge2"),
	gulp = require("gulp"),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	gap = require("gulp-append-prepend"),
	uglify = require("gulp-uglify");

var version = "2.0.0",
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

var prependCopyright = function(){
	return gap.prependText('/**\n * trade-chart.js v' + getVersion() + '\n * author: Billy, wmjhappy_ok@126.com\n */');
};

var xpipe = function(){
	var stream = arguments[0];
	if(null == stream)
		return;

	stream = stream.on("error", function(e){console.error(e, e.stack);});
	for(var i = 1; i < arguments.length; i++){
		var nextStream = arguments[i];
		if(null == nextStream || typeof nextStream != "object" || typeof nextStream.pipe != "function")
			continue;

		stream = stream.pipe(nextStream);
		stream = stream.on("error", function(e){console.error(e, e.stack);});
	}

	return stream;
};

/**
 * 合并K线源码
 * @returns {Emitter|*}
 */
var concatK = function(){
	return xpipe(
		gulp.src([
			"KChartDataTypes.js",

			"KChartSketch.js",
			"DataSketch.js",

			"CommonDataManager.js",
			"KChartConfig.js",
			"KChart.js",

			"KSubChartConfig.js",
			"SubChartTypes.js",
			"KSubChartSketch.js",
			"KSubChartRenderResult.js",
			"KSubChart.js",

			"KSubChart_CandleRenderResult.js",
			"KSubChart_VolumeRenderResult.js",

			"KSubChartConfig_CandleConfig.js",
			"KSubChartConfig_VolumeConfig.js",

			"KSubChartSketch_CandleDataSketch.js",
			"KSubChartSketch_VolumeDataSketch.js",

			"KSubChartSketch_CandleChartSketch.js",
			"KSubChartSketch_VolumeChartSketch.js",

			"KSubChart_CandleChart.js",
			"KSubChart_VolumeChart.js",
		].map(function(f){return "../src2/chart-k/" + f;})),
		concat("trade-chart2_k.js"),
		prependCopyright()
	);
};

/**
 * 合并并保存K线源码
 */
var concatKAndSave = function(){
	xpipe(
		concatK(),
		gulp.dest('../')
	);
};

/**
 * 合并并保存文件
 * @param {Boolean} min 是否压缩筹划
 */
var concatAllAndSave = function(min){
	if(arguments.length < 1)
		min = true;

	var stream = merge2();
	stream.add(gulp.src("../src2/trade-chart.js"));
	stream.add(gulp.src("../src2/comp/util.js"));
	stream.add(gulp.src("../src2/comp/eventDrive.js"));
	stream.add(gulp.src("../src2/comp/Big.js"));
	stream.add(gulp.src("../src2/comp/LinearGradient.js"));
	stream.add(gulp.src("../src2/CommonChartConfig.js"));
	stream.add(concatK());

	stream = xpipe(
		stream,
		concat("trade-chart." + getVersion() + (min? ".min": "") + ".js")
	);

	if(min)
		stream = xpipe(
			stream,
			uglify()
		);

	stream = xpipe(
		stream,
		prependCopyright(),
		gulp.dest('../')
	);
};

gulp.task('concat', function(){
	var min = getParameter("min") || "false";
	var ifMin = "true" === String(min).trim().toLowerCase();

	concatAllAndSave(ifMin);
});