import React from 'react';
import ReactDOM from 'react-dom';
//import echarts from 'echarts';
import echarts from 'echarts/dist/echarts.js';
import  $ from  'jquery';


class EChart extends React.Component{
    constructor(props) {
        super(props);
        var thisObj=this;
        var indexArr=[];
        var valuesArr=[];
        var valuesStatArr=[];
        for(var i in this.props.valuesArr){
            if(this.props.valuesArr[i]!="hidden"){
                valuesArr.push([]);
                valuesStatArr.push([]);
            }
        }
        for(var i in this.props.index){
            if(indexArr.indexOf(this.props.index[i])<0&&this.props.index[i]!="hidden"){
                indexArr.push(this.props.index[i]);
                for(var j in valuesArr){
                    valuesArr[j].push([thisObj.props.valuesArr[j][i]])
                }
            }else if(this.props.index[i]!="hidden"){
                for(var k in valuesArr){
                    valuesArr[k][indexArr.indexOf(this.props.index[i])].push(thisObj.props.valuesArr[k][i]);
                }
            }
        }
        for(var i in valuesArr){
            for(var j in valuesArr[i]){
                valuesStatArr[i].push(thisObj.stats(valuesArr[i][j],thisObj.props.valueOptions[i].stats));
            }
        }
        this.state = {
            indexArr:indexArr,
            valueStatArr:valuesStatArr
        };
    }
    componentWillReceiveProps(nextProps){
        this.props=nextProps
        var thisObj=this;
        var indexArr=[];
        var valuesArr=[];
        var valuesStatArr=[];
        for(var i in this.props.valuesArr){
            if(this.props.valuesArr[i]!="hidden"){
                valuesArr.push([]);
                valuesStatArr.push([]);
            }
        }
        for(var i in this.props.index){
            if(indexArr.indexOf(this.props.index[i])<0&&this.props.index[i]!="hidden"){
                indexArr.push(this.props.index[i]);
                for(var j in valuesArr){
                    valuesArr[j].push([thisObj.props.valuesArr[j][i]])
                }
            }else if(this.props.index[i]!="hidden"){
                for(var k in valuesArr){
                    valuesArr[k][indexArr.indexOf(this.props.index[i])].push(thisObj.props.valuesArr[k][i]);
                }
            }
        }
        for(var i in valuesArr){
            for(var j in valuesArr[i]){
                valuesStatArr[i].push(thisObj.stats(valuesArr[i][j],thisObj.props.valueOptions[i].stats));
            }
        }
        this.setState({
            indexArr:indexArr,
            valueStatArr:valuesStatArr
        })
    }
    stats(arr,type){
        var result=0;
        switch (type){
            case "sum":
                for(var i in arr){
                    if(arr[i]&&Number(arr[i]))
                        result+=Number(arr[i]);
                }
                break;
            case "count":
                var count=0;
                for(var i in arr){
                    if(arr[i])
                        count++;
                }
                result=count;
                break;
            case "avg":
                result=this.states(arr,"sum")/this.states(arr,"count");
                result=result.toFixed(2);
                break;
            default:
                for(var i in arr){
                    if(arr[i]&&Number(arr[i]))
                        result+=Number(arr[i]);
                }
                break;
        }
        return result;
    }
    componentDidMount(){
        this.showChart()
    }

    componentDidUpdate() {
        this.showChart()
    }
    getDataByName(name){
        console.log(this.props)
    }
    showChart(){
        var myChart = echarts.init(document.getElementById(this.props.id));
        var thisObj=this;
        var option={};
        //if(this.props.valueType==undefined){
        //    this.props.valueType=[];
        //}
        if(this.props.type=="bar"){
            var thisSeries =[];
            var legendArr=[];
            var yAxis=[];
            var yAxisArr=[];
            if(this.props.valueType){
                for(var i in this.props.valueType){
                    if(yAxisArr.indexOf(this.props.valueType[i])<0){
                        var tempYAxis={
                            type: 'value',
                            name: this.props.valueType[i],
                            splitLine:{
                                show:false
                            }
                        }
                        yAxis.push(tempYAxis)
                        yAxisArr.push(this.props.valueType[i])
                    }
                }
            }else{
                var tempYAxis={
                    type: 'value',
                    splitLine:{
                        show:false
                    }
                }
                yAxis.push(tempYAxis)
            }

            for(var i in this.props.valueOptions){
                var tempObj={
                    name:this.props.valueOptions[i].title,
                    type:'bar',
                    data: this.state.valueStatArr[i],
                    yAxisIndex:this.props.valueType?yAxisArr.indexOf(this.props.valueType[i]):0
                };
                thisSeries.push(tempObj);
                legendArr.push(this.props.valueOptions[i].title);
            }

            option = {
                title: {
                    text: this.props.title
                },
                //color: ['#3398DB'],
                tooltip : {
                    trigger: 'axis',
                    axisPointer : {
                        type : 'shadow'
                    }
                },
                legend: {
                    data:legendArr
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis : [
                    {
                        type : 'category',
                        data : thisObj.state.indexArr,
                        axisTick: {
                            alignWithLabel: true
                        },
                        axisLabel: {
                            interval: 0,
                            rotate:30
                        }
                    }
                ],
                yAxis : yAxis,
                series : thisSeries
            };
        }else if(this.props.type=="pie"){
            var pieData=[];
            for(var i in this.state.indexArr){
                var tempObj={
                    value: this.state.valueStatArr[0][i],
                    name: this.state.indexArr[i]
                };
                pieData.push(tempObj)
            }
            option = {
                title : {
                    text: this.props.title,
                    //subtext: '纯属虚构',
                    x:'center'
                },
                tooltip : {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    data: thisObj.state.indexArr
                },
                series : [
                    {
                        name: this.props.valueOptions[0].title,
                        type: 'pie',
                        radius : '55%',
                        center: ['50%', '60%'],
                        data:pieData,
                        itemStyle: {
                            emphasis: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };
        }else if(this.props.type=="horzBar"){
            var thisSeries = [];
            var legendArr = [];
            for (var i in this.props.valueOptions) {
                var tempObj = {
                    name: this.props.valueOptions[i].title,
                    type: 'bar',
                    data: this.state.valueStatArr[i]
                };
                thisSeries.push(tempObj);
                legendArr.push(this.props.valueOptions[i].title);
            }

            option = {
                title: {
                    text: this.props.title
                },
                //color: ['#3398DB'],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                legend: {
                    data: legendArr
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: [
                    {
                        type: 'value'
                    }
                ],
                yAxis: [
                    {
                        type: 'category',
                        data: thisObj.state.indexArr,
                        axisTick: {
                            alignWithLabel: true
                        }
                    }

                ],
                series: thisSeries

            }

        }else if(this.props.type=="gauge"){
            function getGaugeData(){
                $.ajax({
                    type:"get",
                    url:thisObj.props.action,
                    async:true,
                    dataType:"json",
                    success: function (data) {
                        return data
                    }
                })
            }
            option = {
                tooltip: {
                    formatter: "{a} <br/>{b} : {c}%"
                },
                toolbox: {
                    feature: {
                        restore: {},
                        saveAsImage: {}
                    }
                },
                series: [
                    {
                        name: thisObj.props.title,
                        type: 'gauge',
                        detail: {formatter: '{value}%'},
                        data: [{value: 0, name: ''}]
                    }
                ]
            };
            if(thisObj.props.refreshTime){
                setInterval(function () {
                    option.series[0].data[0].value = getGaugeData();
                    myChart.setOption(option, true);
                },thisObj.props.refreshTime);
            }
        }else if(thisObj.props.type=='echartCustom'){
            var thisOption=thisObj.props.displayData.option;
            var thisOptionStr=JSON.stringify(thisObj.props.displayData.option);
            var data=thisObj.props.data;
            var patt=new RegExp(/\"\$\$[a-zA-Z\d,]*\$\"/,'gm');
            var match=thisOptionStr.match(patt);
            for(var i in match){
                var index=thisOptionStr.indexOf(match[i]);
                var lastIndex=thisOptionStr.lastIndexOf(match[i]);
                var length=match[i].length
                var value=match[i].substring(3,length-2);
                var arrStr;
                if(value.indexOf(",")>=0){
                    var valueIndex = value.indexOf(",")
                    var valueValue=value.substring(0,valueIndex);
                    var valueName=value.substring(valueIndex+1,length-1);
                    var valueArr=[];
                    for(var i in thisObj.props.data[valueValue]){
                        var pushedObj={
                            value:thisObj.props.data[valueValue][i],
                            name:thisObj.props.data[valueName][i],
                        }
                        valueArr.push(pushedObj);
                    }
                    var arrStr=JSON.stringify(valueArr)
                }else{
                    arrStr=JSON.stringify(thisObj.props.data[value])
                }
                //thisOptionStr.replace(match[i],"[123123,123123]")
                var before=thisOptionStr.substring(0,index);
                var after=thisOptionStr.substring(index+length,thisOptionStr.length);
                thisOptionStr=before+arrStr+after
            }
            option=JSON.parse(thisOptionStr)
        }
        myChart.on('click', function (params) {
            var hrefDataName=thisObj.props.valueOptions[params.seriesIndex].href;
            if(hrefDataName){
                var hrefData=thisObj.props.hrefData[hrefDataName];
                var dataIndex=thisObj.props.index.indexOf(params.name);
                var thisHref=hrefData[dataIndex];
                window.open(thisHref);
            }
        });
        myChart.setOption(option);
    }
    getData(name){
        return this.props.data[name]
    }
    render() {
        var style;
        if(this.props.width&&this.props.width!="auto"){
            style={width:"100%",maxWidth:this.props.width,height:this.props.height?this.props.height:500}
        }else{
            style={width:"100%",maxWidth:1280,height:this.props.height?this.props.height:500}
        }
        return (
            <div className="eChartDiv" id={this.props.id} style={style}></div>
        )
    }
};
//EChart.propTypes= {
//    type:'string',
//    index: 'array',
//    valueOptions:'array',
//    valuesArr:'array',
//    id:'string',
//    width:'number',
//    height:'number',
//    hrefData:'object',
//    valueType:'array'
//}


//导出组件
export default EChart;