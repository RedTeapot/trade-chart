;(function(){
	var TradeChart2 = window.TradeChart2;
	var util = TradeChart2.util;

	/**
	 * @constructor
	 * K线子图绘制结果
	 * @param {KSubChart} kSubChart 关联的，生成绘制结果的K线子图实例
	 * @param {Object} config 绘制过程使用的配置
	 */
	var KSubChartRenderResult = function(kSubChart, config){
		/**
		 * 获取渲染用到的配置数据
		 */
		this.getConfig = function(){
			return config;
		};

		/**
		 * 获取关联的，生成绘制结果的K线子图实例
		 * @returns {KSubChart}
		 */
		this.getRenderingKSubChart = function(){
			return kSubChart;
		};

		/**
		 * 获取关联的，持有“生成绘制结果的K线子图”的K线图实例
		 * @returns {KChart}
		 */
		this.getRenderingKChart = function(){
			return this.getRenderingKSubChart().getKChart();
		};

		/**
		 * 获取可以渲染出来的数据个数
		 * @returns {Number}
		 */
		this.getRenderingGroupCount = function(){
			console.error("Not implemented!");
		};

		/**
		 * 获取可以渲染出来的数据列表
		 * @returns {Array<KData|Object>}
		 */
		this.getRenderingDataList = function(){
			var kChart = this.getRenderingKChart();
			var dataList = kChart.getDataList() || [];
			var count = Math.min(this.getRenderingGroupCount(), dataList.length);

			return dataList.slice(0, count);
		};

		/**
		 * 获取可以渲染出来的，被转换后的数据列表
		 * @returns {Array<KData>}
		 */
		this.getConvertedRenderingDataList = function(){
			var kChart = this.getRenderingKChart(),
				dataList = this.getRenderingDataList();

			var newDataList = dataList;
			var dataParser = kChart.getDataParser();

			if(typeof dataParser === "function"){
				newDataList = dataList.map(function(data, index){
					try{
						data = dataParser(data, index, dataList);
					}catch(e){
						console.error("Fail to convert data of index: " + index + " using supplied data parser.", data);
						console.error(e);
					}

					return data;
				});
			}else
				console.warn("No data parser set, thus returning the original data list.");

			return newDataList;
		};
	};

	util.defineReadonlyProperty(TradeChart2, "KSubChartRenderResult", KSubChartRenderResult);
})();