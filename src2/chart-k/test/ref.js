[
	"../trade-chart.js",
	"../comp/util.js",
	"../comp/eventDrive.js",
	"../comp/Big.js",
	"../comp/LinearGradient.js",
	"../CommonChartConfig.js",
	"../CommonDataManager.js",
	"../CommonChart.js",
	"../CommonChartSketch.js",
	"../CommonDataSketch.js",
	"../SubChart.js",
	"../SubChartTypes.js",

	"KChartSketch.js",

	"KSubChartConfig.js",
	"KSubChartSketch.js",
	"KSubChartRenderResult.js",
	"KSubChartOperationUtil.js",
	"KSubChart.js",

	"KChartConfig.js",
	"KChart.js",

	"KSubChart_CandleChart.js",
	"KSubChart_TrendChart.js",
	"KSubChart_VolumeChart.js",
	"KSubChart_IndexMAChart.js",
	"KSubChart_KebabChart.js"
].forEach(function(f){
	document.write('<script type = "text/javascript" src = "../../' + f + '"></script>');
});
