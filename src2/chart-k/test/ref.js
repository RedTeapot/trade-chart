[
	"../trade-chart.js",
	"../comp/util.js",
	"../comp/eventDrive.js",
	"../comp/Big.js",
	"../comp/LinearGradient.js",
	"../CommonChartConfig.js",

	"KChartSketch.js",
	"KDataSketch.js",

	"KDataManager.js",
	"KChartConfig.js",
	"KChart.js",

	"KSubChartConfig.js",
	"KSubChartTypes.js",
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
].forEach(function(f){
	document.write('<script type = "text/javascript" src = "../../' + f + '"></script>');
});
