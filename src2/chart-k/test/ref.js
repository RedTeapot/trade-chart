[
	"../trade-chart.js",
	"../comp/util.js",
	"../comp/eventDrive.js",
	"../comp/Big.js",
	"../comp/LinearGradient.js",

	"default-config/default-config_k-chart.js",
	"default-config/default-config_k-sub-chart.js",
	"default-config/default-config_k-sub-chart_candle.js",
	"default-config/default-config_k-sub-chart_volume.js",

	"KDataManager.js",
	"KChart.js",

	"KChartSketch.js",
	"KDataSketch.js",

	"KSubChart.js",
	"KSubChartTypes.js",
	"KSubChartSketch_ChartSketch.js",
	"KSubChartRenderResult.js",

	"KSubChart_CandleRenderResult.js",
	"KSubChart_VolumeRenderResult.js",

	"KSubChartSketch_CandleDataSketch.js",
	"KSubChartSketch_VolumeDataSketch.js",

	"KSubChartSketch_CandleChartSketch.js",
	"KSubChartSketch_VolumeChartSketch.js",

	"KSubChart_CandleChart.js",
	"KSubChart_VolumeChart.js",
].forEach(function(f){
	document.write('<script type = "text/javascript" src = "../../' + f + '"></script>');
});
