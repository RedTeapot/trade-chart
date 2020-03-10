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

	"KChartConfig.js",
	"KChart.js",

	"KSubChartConfig.js",
	"KSubChartSketch.js",
	"KSubChartRenderResult.js",
	"KSubChartOperationUtil.js",
	"KSubChart.js",

	"KSubChart_CandleRenderResult.js",
	"KSubChart_TrendRenderResult.js",
	"KSubChart_VolumeRenderResult.js",
	"KSubChart_IndexMARenderResult.js",

	"KSubChartConfig_CandleConfig.js",
	"KSubChartConfig_TrendConfig.js",
	"KSubChartConfig_VolumeConfig.js",
	"KSubChartConfig_IndexMAConfig.js",

	"KSubChartSketch_CandleDataSketch.js",
	"KSubChartSketch_TrendDataSketch.js",
	"KSubChartSketch_VolumeDataSketch.js",
	"KSubChartSketch_IndexMADataSketch.js",

	"KSubChartSketch_CandleChartSketch.js",
	"KSubChartSketch_TrendChartSketch.js",
	"KSubChartSketch_VolumeChartSketch.js",
	"KSubChartSketch_IndexMAChartSketch.js",

	"KSubChart_CandleChart.js",
	"KSubChart_TrendChart.js",
	"KSubChart_VolumeChart.js",
	"KSubChart_IndexMAChart.js",
].forEach(function(f){
	document.write('<script type = "text/javascript" src = "../../' + f + '"></script>');
});
