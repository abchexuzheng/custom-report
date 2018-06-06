import React from 'react';
import ReactDOM from 'react-dom';
import  $ from  'jquery';
import EChart from '../echartComponent.jsx'
import {Icon} from 'antd'
//import Icon from 'antd/lib/icon';
//import "antd/lib/icon/style/css.js"
import { createStore } from 'redux';
import store from '../../reduxState.js'
import ReportSwitcher from  '../reportSwitcher.jsx'
import Drager from  '../drager.jsx'
import Pagination from  '../pagination.jsx'
import NpSearcher from  '../npSearcher.jsx'
import SimScrollBar from  '../SimScrollBar.jsx'
import { Scrollbars } from 'react-custom-scrollbars';
import * as XLSX from 'xlsx';
import * as fileSaver from 'file-saver'
import "./np-report.less"


class NpReport extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            state: "初始化中",
            data: {}
        };
    }
    getData(url,data) {
        var thisObj=this;
        this.setState({
            state: "正在渲染报表",
            data: {}
        });
        var targetUrl=url;
        var args=targetUrl.indexOf("?")>=0?"&":"?";
        for(var i in data){
            if(i!=0){
                args+="&";
            }
            args+=data[i].name;
            args+="=";
            args+=data[i].value;
        }
        targetUrl+=args;
        var randomTargetUrl=targetUrl+"&randomKey="+Math.floor(Math.random()*10000000000000);
        randomTargetUrl=encodeURI(randomTargetUrl,"UTF-8");

        $.ajax({
            type:"get",
            url:randomTargetUrl,
            async:true,
            dataType:"json",
            success(result){
                if(result.errorMessage){
                    console.log(result.errormessage);
                    return;
                }
                if(result.options&&!result.options.pageSize)
                    result.options.pageSize=20;
                if(result.options&&!result.options.statsTitle)
                    result.options.statsTitle="总计";
                store.dispatch({type:'INIT',data:result,index:thisObj.props.index});
                thisObj.setState({
                    data: result,
                    state: "加载完成",
                    targetUrl:targetUrl
                });
            },
            error(err){
                thisObj.setState({
                    state: "error"
                });
            }
        });
    }
    search=(data)=> {
        var targetUrl=this.state.data.options.action?this.state.data.options.action:this.props.source;
        this.getData(targetUrl,data);
    }

    getInitialState () {
        return {
            state: "初始化中",
            data: {}
        };
    }
    componentDidMount () {
        this.getData(this.props.source,[]);
    }
    render () {
        var npTable=<NpTable dataSource={store.getState()[this.props.index]} index={this.props.index} />;
        if(this.state.data.errorMessage)
            npTable=<div className="errorMessage">{this.state.data.errorMessage}</div>;
        if (this.state.state=="加载完成") {
            return <div className="npReport">
                <NpSearcher dataSource={this.state.data.searcher} searchedData={this.state.data.queryParams} search={this.search}  />
                <ReportSwitcher index={this.props.index} />
                {npTable}
            </div>
        }
        else if(this.state.state=="error"){
            return <div>网络错误，请检查网络连接</div>
        }
        else {
            return <Nploader2 loadingState={this.state.state}/>
        }
    }
};
//NpReport.propTypes={
//    source: 'string',
//    index:'number'
//}

var NpLoader = React.Component({
    propTypes: {
        loadingState: 'string'
    },
    render(){
        return<div className='loader'>
            <div className='loader_overlay'></div>
            <div className='loader_cogs'>
                <div className='loader_cogs__top'>
                    <div className='top_part'></div>
                    <div className='top_part'></div>
                    <div className='top_part'></div>
                    <div className='top_hole'></div>
                </div>
                <div className='loader_cogs__left'>
                    <div className='left_part'></div>
                    <div className='left_part'></div>
                    <div className='left_part'></div>
                    <div className='left_hole'></div>
                </div>
                <div className='loader_cogs__bottom'>
                    <div className='bottom_part'></div>
                    <div className='bottom_part'></div>
                    <div className='bottom_part'></div>
                    <div className='bottom_hole'></div>
                </div>
                <p>{this.props.loadingState}</p>
            </div>
        </div>
    }
});

class Nploader2 extends React.Component{
    render(){
        return <div hidden={this.props.hidden?"hidden":""} className="blurBackground"><div className="loading">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div></div>
    }
};
//Nploader2.propTypes={
//    hidden: 'bool',
//}

class NpTable extends React.Component{
    constructor(props) {
        super(props);
        this.rebuildMultData();
        this.lineData=this.getDataByLine();
        this.lineDataInit=this.getDataByLine(true);
        var colSortedArr=this.getColumns("columns");
        var rowSortedByCol=this.getColumns("rows");
        var rowSortedArr=this.getRows(rowSortedByCol);
        var colGroupArr=this.getGroupArr("columns");
        var rowGroupArr=this.getGroupArr("rows");
        var valueType=this.getValueType();
        var colDataArr=this.toAllArr(colSortedArr,colGroupArr);
        var rowDataArr=this.toAllArr(rowSortedByCol,rowGroupArr);
        var valueArr=this.getValueArr(valueType);
        //隐藏某列
        var hiddenLine=[];
        if(valueType=="columns"){
            hiddenLine=this.getHiddenLine(colDataArr,colGroupArr,valueArr);
            colSortedArr=this.hideTheValueLine(colSortedArr,hiddenLine,"columns");
        }else{
            hiddenLine=this.getHiddenLine(rowDataArr,rowGroupArr,valueArr);
            rowSortedArr=this.hideTheValueLine(rowSortedArr,hiddenLine,"rows");
        }
        this.state = {
            state: true,
            data: {},
            colSortedArr: colSortedArr,
            rowSortedArr: rowSortedArr,
            left: 0,
            top: 0,
            colDataArr:colDataArr,
            rowDataArr:rowDataArr,
            lineData:this.lineData,
            valueArr:valueArr,
            valueType:valueType,
            pageNow:1,
            rowHiddenLine:hiddenLine,
            scrollNow:"",
            totalTable:false
        };
    }
    //根据groupLevel获取字段名字
    getNameByLevel(level,type){
        var dataObj=this.props.dataSource;
        if (level == 0) {
            return undefined
        }
        else {
            for (var i in dataObj[type]) {
                if (dataObj[type][i].groupLevel == level){
                    return dataObj[type][i].name;
                }
            }
        }
    }
    getValuesTitle(type){
        var dataObj=this.props.dataSource;
        var namesArr=[];
        for (var i in dataObj[type]) {
            if (dataObj[type][i].groupLevel == 0)
                namesArr.push(dataObj[type][i].title)
        }
        return namesArr
    }
    getValuesName(type){
        var dataObj=this.props.dataSource;
        var namesArr=[];
        for (var i in dataObj[type]) {
            if (dataObj[type][i].groupLevel == 0)
                namesArr.push(dataObj[type][i].name)
        }
        return namesArr
    }
    //获取需要统计的字段
    getGroupStateArr(type){
        var dataObj=this.props.dataSource;
        var arr=[];
        for(var i in dataObj[type]){
            if(dataObj[type][i].groupStats){
                arr.push(dataObj[type][i].name)
            }
        }
        return arr;
    }
    getOptionsByName(name){
        var dataObj=this.props.dataSource;
        for(var i in dataObj.rows){
            if(dataObj.rows[i].name==name){
                return dataObj.rows[i];
            }
        }
        for(var i in dataObj.columns){
            if(dataObj.columns[i].name==name){
                return dataObj.columns[i];
            }
        }
    }
    getLineDataString(){
        var lineData=this.lineData;
        var list1=[];
        var list2=[];
        for(var i in lineData){

        }
    }
    getMaxDataLength(nameObj,type,lastStats,stringData){
        var lineData=this.lineData;
        //var valueArr=this.getValueArr();
        var sameArr=[];
        var thisType="columns";
        if(type=="columns"){
            thisType="rows";
        }
        var groupArr=this.getGroupArr(thisType);
        var nameObjString="";
        var sameIndexArr=[];
        var nameObjNameArr=[];
        for(var i in nameObj){
            nameObjNameArr.push(i);
        }
        for(var i in this.lineData[0]){
            if(nameObjNameArr.indexOf(i)>=0){
                nameObjString+=nameObj[i]+"-"
            }
        }
        if(stringData!=undefined){
            while (stringData.indexOf(nameObjString,sameIndexArr.length==0?0:(sameIndexArr[sameIndexArr.length-1]+1))>=0){
                var thisIndex=stringData.indexOf(nameObjString,sameIndexArr.length==0?0:(sameIndexArr[sameIndexArr.length-1]+1))
                sameIndexArr.push(thisIndex);
                sameArr.push(lineData[thisIndex]);
            }
        }else{
            sameArr=lineData
        }
        var list2 = [];
        var listMap = {};
        for (var i = 0, len = sameArr.length; i < len; i++) {
            var key="";
            for(var j in sameArr[i]){
                if(groupArr.indexOf(j)>=0)
                    key+=j+":"+sameArr[i][j]+"-"
            }
            if (!!listMap[key]) {
                listMap[key]++;
            } else {
                listMap[key] = 1;
            }
        }
        var maxLength=1;
        for (var item in listMap) {
            if(listMap[item]>maxLength){
                maxLength=listMap[item]
            }
        }
        //末级统计功能
        if(lastStats&&maxLength!=1){
            maxLength++
        }
        return maxLength;
    }
    getColumns (type) {
        //获取子data个数
        function getSpan (dataname,datavalue,groupArr,length,type,k,indexArr){
            if(datavalue==="#empty#"){
                return 0;
            }
            var dataIndex=groupArr.indexOf(dataname);
            var childName=groupArr[dataIndex+1];
            var needState=0;
            if(groupStateArr.indexOf(dataname)>=0){
                needState=length?length:1
            }
            if(indexArr==undefined){
                indexArr=[];
                for(var i in dataObj.data[dataname]){
                    indexArr.push(i);
                }
            }
            var thisIndexArr=[];
            for(var i in dataObj.data[dataname]){
                if(dataObj.data[dataname][i]==datavalue&&indexArr.indexOf(i)>=0){
                    thisIndexArr.push(i);
                }
            }
            if(childName){
                var spanNum=0;
                var pushedArr2=[];

                for(var i in dataObj.data[childName]){
                    if(thisIndexArr.indexOf(i)>=0&&dataObj.data[dataname][i]==datavalue&&pushedArr2.indexOf(dataObj.data[childName][i])<0){
                        spanNum+=getSpan(childName,dataObj.data[childName][i],groupArr,length,type,i,thisIndexArr);
                        pushedArr2.push(dataObj.data[childName][i])
                    }
                }
                return spanNum+needState
            }else{
                if(length==0){
                    //console.log(datavalue+":"+thisIndexArr)
                    if(thisIndexArr.length==0){
                        return 0;
                    }
                    var thisGroupArr=thisObj.getGroupArr(type);
                    var thisObjData={};
                    for(var i in thisGroupArr){
                        thisObjData[thisGroupArr[i]]=dataObj.data[thisGroupArr[i]][k]
                    }
                    if(thisObj.props.dataSource.options.dataUnique){
                        return 1;
                    }else{
                        var lastStats=thisObj.getOptionsByName(groupNameArr[i]).groupStats
                        var thisMaxLength=thisObj.getMaxDataLength(thisObjData,type,lastStats,stringData);
                        return thisMaxLength;
                    }
                }else {
                    return length
                }
            }
        }
        var thisObj=this;
        var dataObj = this.props.dataSource;
        var initLevel = 1;
        var colSortedArr = [];
        var groupNameArr=[];  //按groupLevel大小排序的字段名
        var initGroupLevel=1; //第一groupLevel等级
        var thisGroupName=this.getNameByLevel(initGroupLevel,type);
        var thisValueName=this.getValuesTitle(type);
        var thisGroupNameLength=thisValueName.length;
        var groupStateArr=this.getGroupStateArr(type);
        while (thisGroupName){
            groupNameArr.push(thisGroupName);
            initGroupLevel++;
            thisGroupName=this.getNameByLevel(initGroupLevel,type);
        }
        //if(thisObj.getOptionsByName(groupNameArr[groupNameArr.length-1]).groupStats){
        //    groupNameArr.push("hiddenStatsLine")
        //}
        var stringData=this.getStringData(groupNameArr,this.lineData);
        for(var i=0;i<=groupNameArr.length-1;i++){
            var thisName=groupNameArr[i];
            var lastName = groupNameArr[i-1];
            var sortedObj = {data: [], span: [],span2:[]};
            if(i==0){
                for(var j in dataObj.data[groupNameArr[i]]){
                    if (sortedObj.data.indexOf(dataObj.data[groupNameArr[i]][j]) < 0) {
                        sortedObj.data.push(dataObj.data[groupNameArr[i]][j]);
                        var thisSpan=getSpan(thisName,dataObj.data[groupNameArr[i]][j],groupNameArr,thisGroupNameLength,type,j);
                        sortedObj.span.push(thisSpan);
                        sortedObj.span2.push(1);
                    }
                }
            }else{
                for(var j in colSortedArr[i-1].data){
                    var parentData=colSortedArr[i-1].data[j];  //父级的data
                    var pushedArr=[]; //已经添加的data的数组
                    var thisIndex=0;
                    for(var thisJ=0;thisJ<j;thisJ++){
                        thisIndex+=colSortedArr[i-1].span[thisJ];
                    }
                    for(var k in dataObj.data[groupNameArr[i]]){
                        //var hasThis=true;
                        var parentIndex=i-1;
                        var indexArr=[];
                        for(var x in dataObj.data[thisName]){
                            indexArr.push(x);
                        }

                        while (parentIndex>=0){
                            var thisLineArr=[];
                            var addedData=[];
                            for(var v in colSortedArr[parentIndex].data){
                                var addedIndex=colSortedArr[parentIndex].span[v]
                                while(addedIndex>0){
                                    thisLineArr.push(colSortedArr[parentIndex].data[v])
                                    addedIndex--;
                                }
                            }
                            //console.log(thisLineArr)
                            for(var y in dataObj.data[groupNameArr[parentIndex]]){
                                if(thisLineArr[thisIndex]!=dataObj.data[groupNameArr[parentIndex]][y]&&indexArr.indexOf(y)>=0){
                                    indexArr.splice(indexArr.indexOf(y),1);
                                }
                            }
                            parentIndex--
                        }

                        //console.log(hasThis);
                        //var indexArr=[];
                        //for(var x in dataObj.data[thisName]){
                        //    indexArr.push(x);
                        //}
                        //var thisIndexArr=[];
                        //for(var z in dataObj.data[thisName]){
                        //    if(dataObj.data[thisName][z]==dataObj.data[groupNameArr[i]][k]&&indexArr.indexOf(z)>=0){
                        //        thisIndexArr.push(z);
                        //    }
                        //}
                        if(dataObj.data[groupNameArr[i-1]][k]==parentData&&pushedArr.indexOf(dataObj.data[groupNameArr[i]][k])<0){
                            //console.log(dataObj.data[groupNameArr[i]][k]+indexArr)
                            sortedObj.data.push(dataObj.data[groupNameArr[i]][k]);
                            pushedArr.push(dataObj.data[groupNameArr[i]][k]);
                            var thisSpan=getSpan(thisName,dataObj.data[groupNameArr[i]][k],groupNameArr,thisGroupNameLength,type,k,indexArr);
                            sortedObj.span.push(thisSpan);
                            sortedObj.span2.push(1);
                            //if(groupStateArr[groupStateArr.length-1]==groupNameArr[i]){
                            //    var statsTitle2=thisObj.getOptionsByName(groupNameArr[i]).statsTitle;
                            //    sortedObj.data.push(statsTitle2);
                            //    sortedObj.span.push(thisGroupNameLength?thisGroupNameLength:1);
                            //    sortedObj.span2.push(1);
                            //}
                        }
                    }
                    if(groupStateArr.indexOf(groupNameArr[i-1])>=0){
                        var statsTitle=thisObj.getOptionsByName(groupNameArr[i-1]).statsTitle;
                        if(sortedObj.data[sortedObj.data.length-1]!=statsTitle){
                            sortedObj.data.push(statsTitle);
                            sortedObj.span.push(thisGroupNameLength?thisGroupNameLength:1);
                            sortedObj.span2.push(groupNameArr.length-i)
                        }else{
                            sortedObj.data.push(statsTitle);
                            sortedObj.span.push(thisGroupNameLength?thisGroupNameLength:1);
                            sortedObj.span2.push(0);
                        }
                    }
                    if(parentData==statsTitle&&groupStateArr.indexOf(groupNameArr[i-1])<0){
                        sortedObj.data.push(statsTitle);
                        sortedObj.span.push(thisGroupNameLength?thisGroupNameLength:1);
                        sortedObj.span2.push(0);
                    }

                }
            }
            colSortedArr.push(sortedObj);
        }
        //添加总计
        var statsTitleAll=thisObj.props.dataSource.options.statsTitle;
        if(dataObj.options.stats){
            for(var i in colSortedArr){
                colSortedArr[i].data.push(statsTitleAll);
                colSortedArr[i].span.push(thisGroupNameLength?thisGroupNameLength:1);
                if(i==0){
                    colSortedArr[i].span2.push(colSortedArr.length);
                }else{
                    colSortedArr[i].span2.push(0);
                }
            }
        }
        //添加数值表头
        var dataLength;
        if(colSortedArr.length){
            dataLength=colSortedArr[colSortedArr.length-1].data.length;
        }else{
            dataLength=1;
        }
        var valueType=this.getValueType();
        if(thisValueName.length>1||(colSortedArr.length==0&&type==valueType)){
            colSortedArr.push({data:[],span:[],span2:[]});
            for(var i=0;i<dataLength;i++){
                for(var j in thisValueName){
                    colSortedArr[colSortedArr.length-1].data.push(thisValueName[j]);
                    colSortedArr[colSortedArr.length-1].span.push(1);
                    colSortedArr[colSortedArr.length-1].span2.push(1);
                }
            }
        }

        //没有表头时添加最外层
        if(colSortedArr.length==0){
            var maxLength=this.getMaxDataLength({},type);
            colSortedArr.push({data:[],span:[],span2:[]});
            colSortedArr[0].data=["outerInitData"];
            colSortedArr[0].span=[maxLength];
            colSortedArr[0].span2=[0];
        }
        return colSortedArr
    }
    getRows (colSortedArr) {
        if(colSortedArr.length==0){
            //return [{data:[""],span:[0]}];
            return [];
        }else{
            var spanSum=0;
            for(var i in colSortedArr[0].span){
                spanSum+=colSortedArr[0].span[i]
            }
            var rowSortedArr = [];
            var aName;
            for (var i = 0; i < spanSum; i++) {
                rowSortedArr.push({data: [], span: [],span2:[]})
            }
            for (var i in colSortedArr) {
                for (var j in colSortedArr[i].data) {
                    if(colSortedArr[i].data[j]!="#empty#"){
                        var lastSpan = 0;
                        j = parseInt(j);
                        var intI=parseInt(i);
                        if (j > 0) {
                            for (var g = 0; g < j; g++) {
                                lastSpan += colSortedArr[i].span[g] - 1
                            }
                        }
                        if(rowSortedArr[j + lastSpan]){
                            rowSortedArr[j + lastSpan].data.push(colSortedArr[i].data[j]);
                            rowSortedArr[j + lastSpan].span.push(colSortedArr[i].span[j]);
                            if(colSortedArr[i].span2)
                                rowSortedArr[j + lastSpan].span2.push(colSortedArr[i].span2[j]);
                        }

                        var tempSpan = colSortedArr[i].span[j];
                        for (var k = 1; k < tempSpan; k++) {
                            if(rowSortedArr[intI + k]&&colSortedArr[i].data[j]!="#empty#"){
                                intI = j + lastSpan;
                                rowSortedArr[intI + k].data.push(colSortedArr[i].data[j]);
                                rowSortedArr[intI + k].span.push(tempSpan-k);
                                rowSortedArr[intI + k].span2.push(0);
                            }
                        }
                    }
                }
            }
            return rowSortedArr;
        }
    }
    getMaxSpan(){
        if(this.state.colSortedArr.length==0){
            return 1
        }else{
            var sum=0;
            for(var i in this.state.colSortedArr[this.state.colSortedArr.length-1].span){
                sum+=this.state.colSortedArr[this.state.colSortedArr.length-1].span[i]
            }
            return sum
        }
    }
    isFirst(index){
        if(index==0){
            return true
        }else{
            return false
        }
    }
    toAllArr(arr,colGroupArr){
        var sortedArr={};
        for(var i in arr){
            if(colGroupArr[i]){
                sortedArr[colGroupArr[i]]=[];
                for(var j in arr[i].data){
                    for(var k=0;k<arr[i].span[j];k++){
                        sortedArr[colGroupArr[i]].push(arr[i].data[j])
                    }
                }
            }
        }
        return sortedArr
    }
    getGroupArr(type){
        var colGroupArr=[];
        var initGroupLevel=1; //第一groupLevel等级
        var thisGroupName=this.getNameByLevel(initGroupLevel,type);
        while (thisGroupName){
            colGroupArr.push(thisGroupName);
            initGroupLevel++;
            thisGroupName=this.getNameByLevel(initGroupLevel,type);
        }
        return colGroupArr
    }
    //隐藏指定列
    hideTheValueLine(sortedArr,lineNumArr,type){
        if(type=="columns") {
            for (var i in sortedArr) {
                var spanNow = 0;
                var lastSpan = 0;
                for (var j in sortedArr[i].span) {
                    var thisSpan = sortedArr[i].span[j];
                    spanNow += thisSpan;
                    for (var k in lineNumArr) {
                        if (spanNow >= lineNumArr[k] && lineNumArr[k] > lastSpan) {
                            if (sortedArr[i].span[j] > 1) {
                                sortedArr[i].span[j]--;
                            } else {
                                sortedArr[i].span2[j] = 0;
                            }
                        }
                    }
                    if (spanNow >= lineNumArr[lineNumArr.length - 1]) {
                        lastSpan = 0;
                        break
                    }
                    lastSpan += thisSpan
                }
            }
        }else{
            for(var i in lineNumArr){
                lineNumArr[i]--;
                for(var j in sortedArr[lineNumArr[i]].span2){
                    var iNow=lineNumArr[i];
                    if(sortedArr[iNow].span2[j]!=0&&sortedArr[iNow+1]&&sortedArr[iNow+1].span2[j]==0){
                        sortedArr[iNow+1].span2[j]=1;
                    }else{
                        while(sortedArr[iNow].span2[j]==0&&iNow>0){
                            sortedArr[iNow-1].span[j]--;
                            iNow--;
                        }
                    }
                }
            }
        }
        return sortedArr
    }
    //获取行式数据
    getDataByLine(isInit){
        var lineDataArr=[];
        var names=[];
        var emptyObj={};
        for(var i in this.props.dataSource.data){
            names.push(i);
            emptyObj[i]="";
        }
        for(var i in this.props.dataSource.data[names[0]]){
            var isEmpty=false;
            var dataObj={};
            for(var k in emptyObj){
                dataObj[k]=emptyObj[k];
            }
            for (var j in this.props.dataSource.data){
                //若果数据中有#empty#则隐藏该行数据
                if(this.props.dataSource.data[j][i]=="#empty#"){
                    isEmpty=true
                }
                dataObj[j]=this.props.dataSource.data[j][i]
            }
            if(!isEmpty||isInit){
                lineDataArr.push(dataObj)
            }

        }
        return lineDataArr
    }
    getValueArr(type){
        var dataObj=this.props.dataSource;
        var level=0;
        var valueArr=[];
        if (level == 0) {
            for (var i in dataObj[type]) {
                if (dataObj[type][i].groupLevel == level)
                    valueArr.push(dataObj[type][i].name)
            }
        }
        return valueArr;
    }
    getValueType(){
        var dataObj=this.props.dataSource;
        var type="rows";
        for (var i in dataObj[type]) {
            if (dataObj[type][i].groupLevel == 0)
                return type
        }

        type="columns";
        for (var i in dataObj[type]) {
            if (dataObj[type][i].groupLevel == 0)
                return type
        }
    }
    getHiddenLine(arr,groupArr,valueArr){
        var aKey="";
        var dataSource=this.props.dataSource.data;
        for(var i in arr){
            aKey=i;
            break;
        }
        var hiddenArr=[];
        var noHiddenArr=[];

        var dataStringData=this.getStringData(groupArr,this.lineDataInit);
        var arrStringData=[];
        var arrSorted={};
        for(var i in this.lineDataInit[0]){
            for(var j in arr){
                if(j==i)
                    arrSorted[j]=arr[j]
            }
        }
        arr=arrSorted;
        for(var i in arr[aKey]){
            var tempString="";
            for(var j in arr){
                tempString+=arr[j][i]+"-"
            }
            if(arrStringData.indexOf(tempString)<0)
                arrStringData.push(tempString)
        }
        for(var i in arrStringData){
            var index=dataStringData.indexOf(arrStringData[i]);
            if(index>=0){
                for(var j in valueArr){
                    if(this.lineDataInit[index][valueArr[j]]=="hidden"||!this.lineDataInit[index].hasOwnProperty(valueArr[j])){
                        var intJ=parseInt(j);
                        hiddenArr.push(i*valueArr.length+intJ+1)
                    }
                }
            }
        }
        return hiddenArr;
    }
    setPage=(num)=>{
        var thisObj=this;
        this.setState({
            state: false
        });
        setTimeout(function(){
            thisObj.setState({
                pageNow: num,
                state: true
            });
        },1);

    }
    //多组数据组合重构
    rebuildMultData(){
        var thisData=this.props.dataSource.data;
        var colGroupArr=this.getGroupArr("columns");
        var rowGroupArr=this.getGroupArr("rows");
        var valueType=this.getValueType();
        var groupArr=valueType=="columns"?colGroupArr:rowGroupArr;
        if(thisData.length>=2){
            var tempData={};
            for(var i in thisData){
                for(var j in thisData[i]){
                    if(!tempData[j]){
                        tempData[j]=[];
                    }
                }
            }
            for(var i in thisData){
                for(var j in tempData){
                    if(thisData[i][j]){
                        tempData[j]=tempData[j].concat(thisData[i][j])
                    }else{
                        var tempKey="";
                        for(var k in thisData[i]){
                            tempKey=k;
                        }
                        for(var k in thisData[i][tempKey]){
                            tempData[j].push("hidden");
                        }
                    }
                }
            }
            this.props.dataSource.data=tempData;
        }else if(thisData.length==1){
            this.props.dataSource.data=thisData[0];
        }
    }
    //obj型数据转换string数据
    getStringData (switchArr,lineData){
        var dataStringArr=[];
        for(var i in lineData){
            var stringData="";
            for(var j in lineData[i]){
                if(switchArr.indexOf(j)>=0){
                    stringData+=lineData[i][j]+"-"
                }
            }
            dataStringArr.push(stringData);
        }
        return dataStringArr;
    }

    getInitialState () {
        this.rebuildMultData();
        this.lineData=this.getDataByLine();
        this.lineDataInit=this.getDataByLine(true);
        var colSortedArr=this.getColumns("columns");
        var rowSortedByCol=this.getColumns("rows");
        var rowSortedArr=this.getRows(rowSortedByCol);
        var colGroupArr=this.getGroupArr("columns");
        var rowGroupArr=this.getGroupArr("rows");
        var valueType=this.getValueType();
        var colDataArr=this.toAllArr(colSortedArr,colGroupArr);
        var rowDataArr=this.toAllArr(rowSortedByCol,rowGroupArr);
        var valueArr=this.getValueArr(valueType);
        //隐藏某列
        var hiddenLine=[];
        if(valueType=="columns"){
            hiddenLine=this.getHiddenLine(colDataArr,colGroupArr,valueArr);
            colSortedArr=this.hideTheValueLine(colSortedArr,hiddenLine,"columns");
        }else{
            hiddenLine=this.getHiddenLine(rowDataArr,rowGroupArr,valueArr);
            rowSortedArr=this.hideTheValueLine(rowSortedArr,hiddenLine,"rows");
        }

        return {
            state: true,
            data: {},
            colSortedArr: colSortedArr,
            rowSortedArr: rowSortedArr,
            left: 0,
            top: 0,
            colDataArr:colDataArr,
            rowDataArr:rowDataArr,
            lineData:this.lineData,
            valueArr:valueArr,
            valueType:valueType,
            pageNow:1,
            rowHiddenLine:hiddenLine,
            scrollNow:"",
            totalTable:false
        };
    }
    componentWillReceiveProps(nextProps){
        this.props=nextProps;
        this.rebuildMultData();
        this.lineData=this.getDataByLine();
        var colSortedArr=this.getColumns("columns");
        var rowSortedByCol=this.getColumns("rows");
        var rowSortedArr=this.getRows(rowSortedByCol);
        var colGroupArr=this.getGroupArr("columns");
        var rowGroupArr=this.getGroupArr("rows");
        var valueType=this.getValueType();
        var colDataArr=this.toAllArr(colSortedArr,colGroupArr);
        var rowDataArr=this.toAllArr(rowSortedByCol,rowGroupArr);
        var valueArr=this.getValueArr(valueType);
        //隐藏某列
        var hiddenLine=[];
        if(valueType=="columns"){
            hiddenLine=this.getHiddenLine(colDataArr,colGroupArr,valueArr);
            colSortedArr=this.hideTheValueLine(colSortedArr,hiddenLine,"columns");
        }else{
            hiddenLine=this.getHiddenLine(rowDataArr,rowGroupArr,valueArr);
            rowSortedArr=this.hideTheValueLine(rowSortedArr,hiddenLine,"rows");
        }
        this.setState({
            state: true,
            data: {},
            colSortedArr: colSortedArr,
            rowSortedArr: rowSortedArr,
            left: 0,
            top: 0,
            colDataArr:colDataArr,
            rowDataArr:rowDataArr,
            lineData:this.lineData,
            valueArr:valueArr,
            valueType:valueType,
            pageNow:1,
            rowHiddenLine:hiddenLine,
            scrollNow:"",
            totalTable:false
        })
    }
    componentDidMount(){
        var thisNode=this.tableInstance
        if(this.props.dataSource.options.fixedLeft||this.props.dataSource.options.fixedTop){
            this.resetFixedHeight();
            this.resetTdWidth();
        }
        if(this.props.dataSource.options.fixedTop==false||this.props.dataSource.options.fixedTop==undefined){
            $(thisNode).find(".tableBox").removeClass("fixedTop")
        }
    }
    componentDidUpdate (){
        var thisNode=this.tableInstance
        if(this.props.dataSource.options.fixedLeft||this.props.dataSource.options.fixedTop){
            this.resetFixedHeight();
            this.resetTdWidth();
        }
        if(this.props.dataSource.options.fixedTop==false||this.props.dataSource.options.fixedTop==undefined){
            $(thisNode).find(".tableBox").removeClass("fixedTop")
        }
    }
    setTable=(instance)=>{
        this.tableInstance=instance
    };
    resetFixedHeight(){
        var thisNode=this.tableInstance;
        //var newHeight=$(thisNode).find("#scrollTableHead").find(".colIndexLeft").css("height");
        //console.log(newHeight)
        var borderWidth=Math.ceil(parseFloat($(thisNode).find("#scrollTableHead").find(".colIndexLeft").css("border-bottom-width")))
        if($(thisNode).find("#scrollTableHead").find(".colIndexLeft")[0]){
            var newHeight=$(thisNode).find("#scrollTableHead").find(".colIndexLeft")[0].clientHeight+borderWidth+"px";
            $(thisNode).find(".leftFixedTable").find(".colIndexLeft").css("height",newHeight);
        }
        var heightArr=[];
        $(thisNode).find(".scrollTableBox .rowIndexLast").each(function(){
            var borderWidthThis=Math.ceil(parseFloat($(this).css("border-bottom-width")))
            var newHeightThis=$(this)[0].clientHeight+borderWidth+"px";
            heightArr.push(newHeightThis)
        });
        $(thisNode).find(".leftFixedTable .rowIndexLast").each(function(index){
            this.style.height=heightArr[index]
        });
        var leftTbodyWidth=0;
        $(thisNode).find(".scrollTableBox tbody tr:first-child").find(".rowIndex").each(function(){
            leftTbodyWidth+=parseInt($(this).css("width"));
        });
        if(leftTbodyWidth!=0){
            $(".npTableHeader").css("max-width",leftTbodyWidth);
            $(".npTableHeader").show();
        }else{
            $(".npTableHeader").hide();
        }
        var tableScrollHeight=$(thisNode).find(".scrollTableBox tbody")[0].scrollHeight
        $(thisNode).find(".simScrollBarContent").height(tableScrollHeight);
    }
    resetTdWidth(){
        var thisNode=this.tableInstance;
        $(thisNode).find(".tableBox").removeClass("fixedTop");
        $(thisNode).find(".scrollTableBox thead").find("td").each(function(){
            $(this).css("min-width","");
            $(this).css("max-width","");
        });
        $(thisNode).find(".scrollTableBox tbody tr:first-child").find("td").each(function(){
            $(this).css("min-width","");
            $(this).css("max-width","");
        });
        var widthArr1=[];
        var widthArr2=[];
        $(thisNode).find(".scrollTableBox thead").find("td").each(function(){
            var thisWidth=$(this).css("width");
            widthArr1.push(thisWidth)
        });
        $(thisNode).find(".scrollTableBox tbody tr:first-child").find("td").each(function(){
            var thisWidth=$(this).css("width");
            widthArr2.push(thisWidth)
        });
        $(thisNode).find(".tableBox").addClass("fixedTop");
        $(thisNode).find(".scrollTableBox thead").find("td").each(function(index){
            $(this).css("min-width",widthArr1[index]);
            $(this).css("max-width",widthArr1[index]);
        });
        $(thisNode).find(".scrollTableBox tbody tr:first-child").find("td").each(function(index){
            $(this).css("min-width",widthArr2[index]);
            $(this).css("max-width",widthArr2[index]);
        });
        $(thisNode).find(".scrollTableBox .colIndexLeft").each(function(index){
            var borderWidth=Math.ceil(parseFloat($(this).css("border-bottom-width")))
            $(thisNode).find(".leftFixedTable .colIndexLeft").eq(index).css("height",$(this)[0].clientHeight+borderWidth);
            $(thisNode).find(".leftFixedTable .colIndexLeft").eq(index).css("min-width",$(this).css("width"));
            $(thisNode).find(".leftFixedTable .colIndexLeft").eq(index).css("max-width",$(this).css("width"));
        });
        $(thisNode).find(".scrollTableBox .rowIndex").each(function(index){
            var borderWidth=Math.ceil(parseFloat($(this).css("border-bottom-width")))
            $(thisNode).find(".leftFixedTable .rowIndex").eq(index).css("height", $(this)[0].clientHeight+borderWidth);
            $(thisNode).find(".leftFixedTable .rowIndex").eq(index).css("min-width",$(this).css("width"));
            $(thisNode).find(".leftFixedTable .rowIndex").eq(index).css("max-width",$(this).css("width"));
        });
        var titleWidth=0;
        $(thisNode).find(".scrollTableBox tbody tr:first-child").find(".rowIndex").each(function(){
            titleWidth+=parseInt($(this).css("width"));
        });
        $(thisNode).find(".leftFixedTable .npTableHeader").css("min-width",titleWidth);
        $(thisNode).find(".leftFixedTable .npTableHeader").css("max-width",titleWidth)
    }
    handleScroll=(event)=>{
        event.stopPropagation();
        var thisNode=this.tableInstance;
        if(event.target.scrollLeft!=0)
            $(thisNode).find(".leftFixedTable").addClass("shadowLeft");
        if(event.target.scrollLeft==0)
            $(thisNode).find(".leftFixedTable").removeClass("shadowLeft")
    }
    handleTbodyScroll=(event)=>{
        event.stopPropagation();
        if(this.mouseOverNow!="simScrollBar"&&$(event.target).html()==this.mouseOverNow.html()){
            var thisNode=this.tableInstance;
            $(thisNode).find(".scrollHidden").scrollTop(event.target.scrollTop)
            $(thisNode).find(".simScrollBarContent").parent().scrollTop(event.target.scrollTop)
            if(event.target.scrollTop!=0)
                $(thisNode).find("thead").addClass("shadowTop");
            if(event.target.scrollTop==0)
                $(thisNode).find("thead").removeClass("shadowTop");
        }
    }
    handleMouseOver=(event)=>{
        if($(event.target).parents(".simScrollBar").length>0){
            this.mouseOverNow="simScrollBar";
        }else{
            this.mouseOverNow=$(event.target).parents("tbody");
        }
    }
    handleSimScroll=(scrollTop)=>{
        if(this.mouseOverNow=="simScrollBar"){
            var thisNode=this.tableInstance;
            $(thisNode).find(".scrollHidden").scrollTop(scrollTop)
        }
    }
    handleLeftScroll=(e)=>{
        if($(e.target).hasClass("tableBox")){
            var scrollLeft=e.target.scrollLeft
            var thisNode=this.tableInstance;
            $(thisNode).find(".simScrollBar").css({right:-scrollLeft})
        }
    }
    handleDownload=()=>{
        var thisObj=this;
        var wopts = { bookType: 'xlsx', bookSST: false, type: 'binary' };//这里的数据是用来定义导出的格式类型
        function s2ab(s) {
            if (typeof ArrayBuffer !== 'undefined') {
                var buf = new ArrayBuffer(s.length);
                var view = new Uint8Array(buf);
                for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
                return buf;
            } else {
                var buf = new Array(s.length);
                for (var i = 0; i != s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF;
                return buf;
            }
        }
        this.setState({
            totalTable:true,
            state:false
        });
        var timeInterval=setInterval(function(){
            if(ReactDOM.findDOMNode(thisObj.refs.tableObj)){
                var tableObj=ReactDOM.findDOMNode(thisObj.refs.tableObj)
                var wb = { SheetNames: ['Sheet1'], Sheets: {}, Props: {} };
                wb.Sheets['Sheet1'] = XLSX.utils.table_to_sheet(tableObj);//通过json_to_sheet转成单页(Sheet)数据
                var Blobobj=new Blob([s2ab(XLSX.write(wb, wopts))], { type: "application/octet-stream" });
                fileSaver.saveAs(Blobobj, thisObj.props.dataSource.options.title + '.' + (wopts.bookType=="biff2"?"xls":wopts.bookType));
                window.clearInterval(timeInterval);
                thisObj.setState({
                    state:true
                })
            }
        },200)
    }
    render () {
        var thisObj = this;
        var colLength=thisObj.state.rowSortedArr.length?thisObj.state.rowSortedArr[0].data.length:0;
        if(thisObj.state.rowSortedArr.length){
            if(thisObj.state.rowSortedArr[0].data[0]=="outerInitData"){
                colLength=0;
            }else {
                colLength=thisObj.state.rowSortedArr[0].data.length
            }
        }else{
            colLength=0;
        }
        var rowTitleArr=[];
        var rowGroupArr=this.getGroupArr("rows");
        for(var i in rowGroupArr){
            for(var j in this.props.dataSource.rows){
                if(rowGroupArr[i]==this.props.dataSource.rows[j].name&&this.props.dataSource.rows[j].groupLevel>=0){
                    rowTitleArr.push(this.props.dataSource.rows[j].title)
                }
            }
        }
        function getColTitle(index){
            var colGroupArr=thisObj.getGroupArr("columns");
            for(var j in thisObj.props.dataSource.columns){
                if(colGroupArr[index]==thisObj.props.dataSource.columns[j].name){
                    return thisObj.props.dataSource.columns[j].title
                }
            }
        }
        var isFirst=2;
        var lineHiddenArr=[];
        //var lineHiddenArr=thisObj.state.valueType=="columns"?thisObj.state.colSortedArr[thisObj.state.colSortedArr.length-1].span2:thisObj.state.colSortedArr[thisObj.state.colSortedArr.length-1].span;
        if(thisObj.state.valueType=="columns"){
            var lastData=thisObj.state.colSortedArr[thisObj.state.colSortedArr.length-1];
            var statsTitleAll=thisObj.props.dataSource.options.statsTitle;
            var GroupTitleArr=[];
            for(var i in this.props.dataSource.columns){
                if(this.props.dataSource.columns[i].statsTitle){
                    GroupTitleArr.push(this.props.dataSource.columns[i].statsTitle)
                }
            }
            GroupTitleArr.push(this.props.dataSource.options.statsTitle);
            for(var i in lastData.data){
                if(GroupTitleArr.indexOf(lastData.data[i])>=0){
                    lineHiddenArr.push(1);
                }else{
                    lineHiddenArr.push(lastData.span2[i])
                }
            }
        }else{
            lineHiddenArr=thisObj.state.colSortedArr[thisObj.state.colSortedArr.length-1].span
        }
        //获取行标签宽度
        var rowWidthArr=[];
        var rowAlignArr=[];
        var rowHtmlArr=[];
        var initGroupLevel=1;
        var thisGroupName="";
        function  getWidthByLevel(level,type){
            var dataObj=thisObj.props.dataSource;
            for (var i in dataObj[type]) {
                if (dataObj[type][i].groupLevel == level)
                    return dataObj[type][i].width;
            }
        }
        function  getAlignByLevel(level,type){
            var dataObj=thisObj.props.dataSource;
            for (var i in dataObj[type]) {
                if (dataObj[type][i].groupLevel == level)
                    return dataObj[type][i].align;
            }
        }
        function  getHtmlByLevel(level,type){
            var dataObj=thisObj.props.dataSource;
            for (var i in dataObj[type]) {
                if (dataObj[type][i].groupLevel == level)
                    return dataObj[type][i].isHTML;
            }
        }
        if(this.state.rowSortedArr[0]){
            for(var i in this.state.rowSortedArr[0].data){
                var levelI=parseInt(i)+1;
                rowWidthArr.push(getWidthByLevel(levelI,"rows"));
                rowAlignArr.push(getAlignByLevel(levelI,"rows"));
                rowHtmlArr.push(getHtmlByLevel(levelI,"rows"));
            }
        }

        if(!this.props.dataSource.display||this.props.dataSource.display.length==0){
            this.props.dataSource.display=[{type:"table"}]
        }
        var switchArr=[];
        for(var i in this.state.colDataArr){
            switchArr.push(i)
        }
        for(var i in this.state.rowDataArr){
            switchArr.push(i)
        }
        var dataStringArr=this.getStringData(switchArr,this.state.lineData);
        return <div id={"npTable"+thisObj.props.dataSource.options.title} ref={thisObj.setTable}>
            {
                this.props.dataSource.display.map(function(data,index){
                    if(data.type=="table"){
                        return <div key={"tableDiv"+index}>
                            <div
                                className="npTableHeaderDiv"
                                hidden={thisObj.props.dataSource.options.title?"":"hidden"}

                            >
                                {thisObj.props.dataSource.options.title}
                                {thisObj.props.dataSource.options.tableDownload==true?<Icon className="downloadBtn" title="导出为excel文件" type="download" onClick={thisObj.handleDownload}/>:""}
                            </div>
                            <div onScroll={thisObj.handleLeftScroll} className={thisObj.props.dataSource.options.fixedTop==true?"tableBox":"tableBox"} >
                                <div className="leftFixedTable" hidden={thisObj.props.dataSource.options.fixedLeft==true?"":"hidden"}>
                                    <table>
                                        <thead>
                                        {
                                            thisObj.state.colSortedArr.map(function
                                                (data, index) {
                                                return <NpTrByColumn index={thisObj.props.index} valueArr={thisObj.state.valueArr} initData={thisObj.props.dataSource} rowWidthArr={rowWidthArr} isFirst={thisObj.isFirst(index)} key={"columns"+index} dataSource={{data:[]}} valueType={thisObj.state.valueType} rowTitleArr={rowTitleArr} colTitle={getColTitle(index)} colLength={colLength} rowLength={thisObj.state.colSortedArr[0].data[0]!="outerInitData"?thisObj.state.colSortedArr.length:0}/>
                                            })
                                        }
                                        </thead>
                                        <tbody className="scrollHidden" onMouseOver={thisObj.handleMouseOver} onScroll={thisObj.handleTbodyScroll} style={{width:"100%",maxHeight:thisObj.props.dataSource.options.bodyHeight}}>
                                        {
                                            thisObj.state.rowSortedArr.map(function
                                                (data, index) {
                                                if
                                                (index<thisObj.props.dataSource.options.pageSize*thisObj.state.pageNow&&index>=thisObj
                                                        .props.dataSource.options.pageSize*(thisObj.state.pageNow-1)&&
                                                    (thisObj.state.rowHiddenLine.indexOf(index)<0||thisObj.state.valueType=="columns")){
                                                    if(isFirst>0)
                                                        isFirst--;
                                                    return  <NpTrByRow index={thisObj.props.index} key={"row"+index} dataSource={data} rowHtmlArr={rowHtmlArr} rowAlignArr={rowAlignArr} rowWidthArr={rowWidthArr} lineHiddenArr={lineHiddenArr} isFirst={isFirst} valueNum={0} rowNum={index} colData={thisObj.state.colDataArr} rowData={thisObj.state.rowDataArr} lineData={thisObj.state.lineData} dataStringArr={dataStringArr} valueArr={thisObj.state.valueArr} valueType={thisObj.state.valueType} initData={thisObj.props.dataSource}/>
                                                }
                                            })
                                        }
                                        </tbody>
                                    </table>
                                </div>
                                <div className="scrollTableBox" onScroll={thisObj.handleScroll} style={{overflow:thisObj.props.dataSource.options.fixedLeft==true?"auto":""}}>
                                    <table>
                                        <thead id="scrollTableHead">

                                        {
                                            thisObj.state.colSortedArr.map(function (data, index) {
                                                isFirst=2;
                                                return <NpTrByColumn index={thisObj.props.index} colDataArr={thisObj.state.colDataArr} rowNumber={index} valueArr={thisObj.state.valueArr} initData={thisObj.props.dataSource} rowWidthArr={rowWidthArr} isFirst={thisObj.isFirst(index)} key={"columns"+index} dataSource={data} valueType={thisObj.state.valueType} rowTitleArr={rowTitleArr} colTitle={getColTitle(index)} colLength={colLength} rowLength={thisObj.state.colSortedArr[0].data[0]!="outerInitData"?thisObj.state.colSortedArr.length:0}/>
                                            })
                                        }
                                        </thead>
                                        <tbody  onMouseOver={thisObj.handleMouseOver}  onScroll={thisObj.handleTbodyScroll}  className="scrollHidden"  style={{width:"100%",maxHeight:thisObj.props.dataSource.options.bodyHeight}}>
                                        {
                                            thisObj.state.rowSortedArr.map(function (data, index) {
                                                if(index<thisObj.props.dataSource.options.pageSize*thisObj.state.pageNow&&index>=thisObj.props.dataSource.options.pageSize*(thisObj.state.pageNow-1)&&(thisObj.state.rowHiddenLine.indexOf(index)<0||thisObj.state.valueType=="columns")){
                                                    if(isFirst>0)
                                                        isFirst--;
                                                    return <NpTrByRow index={thisObj.props.index} key={"row"+index} dataSource={data} rowHtmlArr={rowHtmlArr} rowAlignArr={rowAlignArr} rowWidthArr={rowWidthArr} lineHiddenArr={lineHiddenArr} isFirst={isFirst} valueNum={thisObj.getMaxSpan()} rowNum={index} colData={thisObj.state.colDataArr} rowData={thisObj.state.rowDataArr} lineData={thisObj.state.lineData} dataStringArr={dataStringArr} valueArr={thisObj.state.valueArr} valueType={thisObj.state.valueType} initData={thisObj.props.dataSource}/>
                                                }
                                            })
                                        }
                                        </tbody>
                                    </table>
                                </div>
                                <SimScrollBar isShow={thisObj.props.dataSource.options.fixedTop} handleMouseOver={thisObj.handleMouseOver}  handleScroll={thisObj.handleSimScroll} scrollHeight={thisObj.state.tableScrollHeight} domHeight={thisObj.props.dataSource.options.bodyHeight} />
                                <div className="outputTable" hidden="hidden">
                                    {
                                        thisObj.state.totalTable==true?<table ref="tableObj">
                                            <thead id="scrollTableHead">
                                            {
                                                thisObj.state.colSortedArr.map(function (data, index) {
                                                    isFirst=2;
                                                    return <NpTrByColumn isCopyed="true" index={thisObj.props.index} colDataArr={thisObj.state.colDataArr} rowNumber={index} valueArr={thisObj.state.valueArr} initData={thisObj.props.dataSource} rowWidthArr={rowWidthArr} isFirst={thisObj.isFirst(index)} key={"columns"+index} dataSource={data} valueType={thisObj.state.valueType} rowTitleArr={rowTitleArr} colTitle={getColTitle(index)} colLength={colLength} rowLength={thisObj.state.colSortedArr[0].data[0]!="outerInitData"?thisObj.state.colSortedArr.length:0}/>
                                                })
                                            }
                                            </thead>
                                            <tbody  onMouseOver={thisObj.handleMouseOver}  onScroll={thisObj.handleTbodyScroll}  className="scrollHidden"  style={{width:"100%",maxHeight:thisObj.props.dataSource.options.bodyHeight}}>
                                            {
                                                thisObj.state.rowSortedArr.map(function (data, index) {
                                                    if((thisObj.state.rowHiddenLine.indexOf(index)<0||thisObj.state.valueType=="columns")){
                                                        if(isFirst>0)
                                                            isFirst--;
                                                        return <NpTrByRow isCopyed="true" index={thisObj.props.index} key={"row"+index} dataSource={data} rowHtmlArr={rowHtmlArr} rowAlignArr={rowAlignArr} rowWidthArr={rowWidthArr} lineHiddenArr={lineHiddenArr} isFirst={isFirst} valueNum={thisObj.getMaxSpan()} rowNum={index} colData={thisObj.state.colDataArr} rowData={thisObj.state.rowDataArr} lineData={thisObj.state.lineData} dataStringArr={dataStringArr} valueArr={thisObj.state.valueArr} valueType={thisObj.state.valueType} initData={thisObj.props.dataSource}/>
                                                    }
                                                })
                                            }
                                            </tbody>
                                        </table>:""
                                    }

                                </div>
                            </div>

                            <div className="tableBox">
                                <Pagination pageNow={thisObj.state.pageNow} source={thisObj.props.source}  pageSize={thisObj.props.dataSource.options.pageSize} totalLength={thisObj.state.rowSortedArr.length} setPage={thisObj.setPage}/>
                                <Nploader2 hidden={thisObj.state.state}/>
                            </div>
                            <Drager index={thisObj.props.index}/>
                        </div>
                    }else {
                        var valueOptions=[];
                        var valuesArr=[];
                        var hrefData={};
                        for(var i in data.valueNames){
                            valueOptions.push(thisObj.getOptionsByName(data.valueNames[i]));
                            valuesArr.push(thisObj.props.dataSource.data[data.valueNames[i]]);
                        }
                        for(var i in valueOptions){
                            if(valueOptions[i].href){
                                hrefData[valueOptions[i].href]=thisObj.props.dataSource.data[valueOptions[i].href]
                            }
                        }
                        return <EChart key={"eChart"+index} id={"eChart"+index+Math.floor(Math.random()*1000000000)} data={thisObj.props.dataSource.data} type={data.type} index={thisObj.props.dataSource.data[data.index]} hrefData={hrefData} valuesArr={valuesArr} valueOptions={valueOptions} title={data.title} displayData={data} width={data.width} height={data.height} valueType={data.valueType}/>
                    }
                })
            }
        </div>
    }
};
//NpTable.propTypes= {
//    dataSource: 'object',
//    index:'number'
//}
NpTable.lineData=[]
NpTable.tableInstance=""
NpTable.mouseOverNow=""


class NpTrByColumn extends React.Component{
    isHidden(data,span,span2){
        if(data=="outerInitData"||span==0||span2==0){
            return "hidden";
        }
    }
    showSelections(event){
        var thisObj=event.target;
        $(thisObj).find(".rightSelection").show(300);
        event.stopPropagation();
    }
    hideSelections(event){
        var thisObj=event.target;
        $(thisObj).find(".rightSelection").hide(300);
        event.stopPropagation();
    }
    render () {
        var thisObj = this;
        var isTitle=false;
        if(thisObj.props.isFirst&&(thisObj.props.rowLength!=0&&thisObj.props.colLength!=0))
            isTitle=true;
        var widthArr=[];
        var HtmlArr=[];
        for(var i in this.props.initData[this.props.valueType]){
            for(var j in this.props.valueArr){
                if(this.props.valueArr[j]==this.props.initData[this.props.valueType][i].name){
                    widthArr.push(this.props.initData[this.props.valueType][i].width);
                }
            }
        }
        return <tr>
            {
                this.props.valueType=="columns"?
                    this.props.rowTitleArr.map(function(data,index){
                        var thisWidth=thisObj.props.rowWidthArr[index]=="auto"?thisObj.props.rowWidthArr[index]:thisObj.props.rowWidthArr[index]+"px";
                        var style={minWidth:thisWidth,maxWidth:thisWidth};
                        return thisObj.props.isFirst?<td key={data+index} style={style} className="colIndex colIndexLeft" hidden={thisObj.props.isFirst?"":"hidden"} rowSpan={thisObj.props.rowLength}>{data}</td>:""
                    }): <td className="colIndex  colIndexLeft" colSpan={thisObj.props.colLength} hidden={this.props.colTitle?"":"hidden"}>{this.props.colTitle}</td>
            }
            {
                this.props.dataSource.data.map(function (data, index) {
                    var valueNum=index%thisObj.props.valueArr.length;
                    var valueName=thisObj.props.valueArr[valueNum];
                    var dataObj={};
                    for(var i in thisObj.props.colDataArr){
                        dataObj[i]=thisObj.props.colDataArr[i][index]
                    }
                    var getNameByLevel=function(level,type,dataObj){
                        if (level == 0) {
                            return undefined
                        }
                        else {
                            for (var i in dataObj[type]) {
                                if (dataObj[type][i].groupLevel == level)
                                    return dataObj[type][i].name;
                            }
                        }
                    };
                    var dataName=getNameByLevel(thisObj.props.rowNumber+1,"columns",thisObj.props.initData);
                    var thisWidth=widthArr[valueNum]=="auto"?widthArr[valueNum]:widthArr[valueNum]+"px"
                    var style={minWidth:thisWidth,maxWidth:thisWidth};
                    let className="colIndex";
                    if(thisWidth!="auto"){
                        className+=" valueTd";
                    }
                    var thisHtml=thisObj.props.initData.columns[thisObj.props.rowNumber].isHTML;
                    if(thisObj.isHidden(data,thisObj.props.dataSource.span[index],thisObj.props.dataSource.span2?thisObj.props.dataSource.span2[index]:1)!="hidden"){
                        return <td className={className}  style={style} colSpan={thisObj.props.dataSource.span[index]} rowSpan={thisObj.props.dataSource.span2?thisObj.props.dataSource.span2[index]:1} key={data+index} hidden={thisObj.isHidden(data,thisObj.props.dataSource.span[index],thisObj.props.dataSource.span2?thisObj.props.dataSource.span2[index]:1)}>
                            {
                                thisHtml==true?<span dangerouslySetInnerHTML={{__html:data}} />:data
                            }
                            <HoverSelections isCopyed={thisObj.props.isCopyed} index={thisObj.props.index} data={data} rowNumber={thisObj.props.rowNumber} colNumber={index} type="columns" valueName={valueName} dataObj={dataObj} dataName={dataName} />
                        </td>
                    }
                })
            }
        </tr>
    }
};
//NpTrByColumn.propTypes={
//    initData: 'object',
//    dataSource: 'object',
//    isFirst:'bool',
//    colLength:'number',
//    rowLength:'number',
//    rowTitleArr:'array',
//    valueType:'string',
//    colTitle:'string',
//    rowWidthArr:'array',
//    valueArr:'array',
//    rowNumber:'number',
//    colDataArr:'object',
//    index:'number',
//    isCopyed:'string'
//}

class HoverSelections extends React.Component{
    constructor(props) {
        super(props);
    }
    showDetails(event){
        var thisObj=event.target;
        $(thisObj).parent().find(".selectionsDetail").show(300);
        event.stopPropagation();
    }
    hideDetails(event){
        var thisObj=event.target;
        $(thisObj).parent().find(".selectionsDetail").hide(300);
        event.stopPropagation();
    }
    render(){
        var thisObj=this;
        var detailContents="";
        if(this.props.dataName){
            detailContents=<ul className="selectionsDetail">
                <li onClick={store.dispatch.bind(null,{type: 'switchIndex',index:thisObj.props.index,dataName:thisObj.props.dataName,dataType:this.props.type})}>转换行列</li>
                <li onClick={store.dispatch.bind(null,{type: 'removeIndex',index:thisObj.props.index,dataName:thisObj.props.dataName,dataType:this.props.type})}>移除该标签</li>
                <li onClick={store.dispatch.bind(null,{type: 'removeData',index:thisObj.props.index,key:thisObj.props.data,dataName:thisObj.props.dataName})}>移除该条数据</li>
                <li onClick={store.dispatch.bind(null,{type: 'changeLevel',index:thisObj.props.index,level:-1,dataName:thisObj.props.dataName,dataType:this.props.type})}>提升标签优先级</li>
                <li onClick={store.dispatch.bind(null,{type: 'changeLevel',index:thisObj.props.index,level:1,dataName:thisObj.props.dataName,dataType:this.props.type})}>降低标签优先级</li>
                <li onClick={store.dispatch.bind(null,{type: 'addStats',index:thisObj.props.index,dataName:thisObj.props.dataName,dataType:this.props.type})}>添加/删除小计</li>
            </ul>
        }else{
            detailContents=<ul className="selectionsDetail">
                <li onClick={store.dispatch.bind(null,{type: 'switchValueType',index:thisObj.props.index,valueName:thisObj.props.valueName,dataObj:thisObj.props.dataObj,dataType:this.props.type})}>转换行列</li>
                <li onClick={store.dispatch.bind(null,{type: 'removeValueData',index:thisObj.props.index,valueName:thisObj.props.valueName,dataObj:thisObj.props.dataObj,dataType:this.props.type})}>移除该数值类</li>
                <li onClick={store.dispatch.bind(null,{type: 'removeValueByLine',index:thisObj.props.index,valueName:thisObj.props.valueName,dataObj:thisObj.props.dataObj})}>移除该条数据</li>
                <li>
                    切换统计类型
                    <ul className="childSelections">
                        <li onClick={store.dispatch.bind(null,{type: 'changeStatsType',index:thisObj.props.index,valueName:thisObj.props.valueName,dataObj:thisObj.props.dataObj,dataType:this.props.type,stats:"sum"})}>求和</li>
                        <li onClick={store.dispatch.bind(null,{type: 'changeStatsType',index:thisObj.props.index,valueName:thisObj.props.valueName,dataObj:thisObj.props.dataObj,dataType:this.props.type,stats:"avg"})}>求平均值</li>
                        <li onClick={store.dispatch.bind(null,{type: 'changeStatsType',index:thisObj.props.index,valueName:thisObj.props.valueName,dataObj:thisObj.props.dataObj,dataType:this.props.type,stats:"count"})}>求总数</li>
                    </ul>
                </li>
                <li>
                    切换对齐方式
                    <ul className="childSelections">
                        <li onClick={store.dispatch.bind(null,{type: 'changeAlign',index:thisObj.props.index,valueName:thisObj.props.valueName,dataObj:thisObj.props.dataObj,dataType:this.props.type,align:"left"})}>居左</li>
                        <li onClick={store.dispatch.bind(null,{type: 'changeAlign',index:thisObj.props.index,valueName:thisObj.props.valueName,dataObj:thisObj.props.dataObj,dataType:this.props.type,align:"center"})}>居中</li>
                        <li onClick={store.dispatch.bind(null,{type: 'changeAlign',index:thisObj.props.index,valueName:thisObj.props.valueName,dataObj:thisObj.props.dataObj,dataType:this.props.type,align:"right"})}>居右</li>
                    </ul>
                </li>
                <li>宽度 : <input type="number" ref="widthInput" onChange={store.dispatch.bind(null,{type: 'changeWidth',index:thisObj.props.index,valueName:thisObj.props.valueName,dataObj:thisObj.props.dataObj,dataType:this.props.type,thisObj:this})} /></li>
            </ul>
        }

        return (thisObj.props.isCopyed!="true"&&store.getState()[thisObj.props.index])&&(store.getState()[thisObj.props.index].options.custom==true)?<div className="rightSelection">
            <div className="selectionDiv">
                <Icon type="pushpin-o" />
                {detailContents}
            </div>
            <div className="selectionDiv" >
                <Icon onMouseDown={store.dispatch.bind(null,{type: 'startDrag',index:thisObj.props.index,dataName:thisObj.props.dataName})} type="swap" />
            </div>
        </div>:null
    }
};
//HoverSelections.propTypes= {
//    data: 'string',
//    rowNumber:'number',
//    colNumber:'number',
//    type:'string',
//    valueName:'string',
//    dataObj:'object',
//    dataName:'string',
//    index:'number',
//    isCopyed:'string'
//}


class NpTrByRow extends React.Component{
    constructor(props) {
        super(props);
        var thisObj=this;
        var alignArr=[];
        var widthArr=[];
        for(var i in this.props.initData[this.props.valueType]){
            for(var j in this.props.valueArr){
                if(this.props.valueArr[j]==this.props.initData[this.props.valueType][i].name){
                    alignArr.push(this.props.initData[this.props.valueType][i].align);
                    widthArr.push(this.props.initData[this.props.valueType][i].width);
                }
            }
        }
        this.state = {
            colData:[],
            rowData:[],
            alignArr:alignArr,
            widthArr:widthArr
        };
    }
    componentWillReceiveProps(nextProps){
        this.props=nextProps;
        var thisObj=this;
        var alignArr=[];
        var widthArr=[];
        for(var i in this.props.initData[this.props.valueType]){
            for(var j in this.props.valueArr){
                if(this.props.valueArr[j]==this.props.initData[this.props.valueType][i].name){
                    alignArr.push(this.props.initData[this.props.valueType][i].align);
                    widthArr.push(this.props.initData[this.props.valueType][i].width);
                }
            }
        }
        this.setState({
            colData:[],
            rowData:[],
            alignArr:alignArr,
            widthArr:widthArr
        });
    }

    isHidden (span,span2,data,hiddenAfter) {
        if (((this.props.isFirst==0)&&(span == 0||span2==0))||data=="outerInitData"||hiddenAfter==1) {
            //if (((this.getAllGroupTitle().indexOf(data)>=0||this.props.isFirst==0)&&(span == 0||span2==0))||data=="outerInitData") {
            return "hidden"
        }else{
            return ""
        }
    }
    findValueName(row,col){
        if(row>=0&&col>=0){
            var nameObj={};
            for(var j in this.props.lineData[0]){
                for(var i in this.props.rowData){
                    if(i==j)
                        nameObj[i]=this.props.rowData[i][row]
                }
                for(var i in this.props.colData){
                    if(i==j)
                        nameObj[i]=this.props.colData[i][col]
                }
            }

            return nameObj;
        }else{
            return false;
        }

    }
    isSameObj(obj1,obj2){
        if(obj1&&obj2){
            var isSame=1;
            for(var i in obj1){
                if(obj2[i]!=obj1[i]){
                    isSame=0;
                    break
                }
            }
            return isSame
        }else{
            return false
        }
    }
    states(arr,statType){
        var result=0;
        var fixedNum=0;
        function getFixedNum(num){
            var stringNum=num.toString();
            var docIndex=stringNum.indexOf(".")
            if(docIndex>=0){
                var thisFixedNum=stringNum.length-1-docIndex;
                if(thisFixedNum>fixedNum){
                    fixedNum=thisFixedNum
                }
            }
        }
        switch (statType){
            case "sum":
                for(var i in arr){
                    if(arr[i]&&Number(arr[i])){
                        getFixedNum(Number(arr[i]));
                        result+=Number(arr[i]);
                    }
                }
                result=result.toFixed(fixedNum)
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
                result.toFixed(4);
                break;
        }
        return result;
    }
    getStatType(name){
        var dataObj=this.props.initData;
        var type=this.props.valueType;
        for (var i in dataObj[type]) {
            if (dataObj[type][i].name == name)
                return dataObj[type][i].stats
        }
    }
    getValueName(row,col){
        var valueArr=this.props.valueArr;
        var valueName="";
        if(this.props.valueType=="rows"){
            valueName=valueArr[row%valueArr.length];
        }else{
            valueName=valueArr[col%valueArr.length];
        }
        return valueName;
    }
    getOptionsByName(name){
        var dataObj=this.props.initData;
        for(var i in dataObj.rows){
            if(dataObj.rows[i].name==name){
                return dataObj.rows[i];
            }
        }
        for(var i in dataObj.columns){
            if(dataObj.columns[i].name==name){
                return dataObj.columns[i];
            }
        }
    }
    getAllGroupTitle(){
        var arr=[];
        for(var i in this.props.initData.rows){
            if(this.props.initData.rows[i].statsTitle){
                arr.push(this.props.initData.rows[i].statsTitle)
            }
        }
        for(var i in this.props.initData.columns){
            if(this.props.initData.columns[i].statsTitle){
                arr.push(this.props.initData.columns[i].statsTitle)
            }
        }
        arr.push(this.props.initData.options.statsTitle);
        return arr;
    }
    getValue(row,col,isHidden){
        var thisObj=this;
        var nameObj=this.findValueName(row,col);
        var sameTimeNeed=1;
        //var valueArr=this.props.valueArr;
        //var valueType=this.props.valueType;
        var aKey="";
        //var lineHiddenArr=this.props.lineHiddenArr;
        for(var i in nameObj){
            aKey=i;
        }
        var nameObjString="";
        for(var i in nameObj){
            nameObjString+=nameObj[i]+"-"
        }
        if(aKey){
            var lastObj;
            if(this.props.valueType=="columns"){
                lastObj=this.findValueName(row-sameTimeNeed,col);
            }else{
                lastObj=this.findValueName(row,col-sameTimeNeed);
            }
            while(this.isSameObj(nameObj,lastObj)){
                sameTimeNeed++;
                if(this.props.valueType=="columns"){
                    lastObj=this.findValueName(row-sameTimeNeed,col);
                }else{
                    lastObj=this.findValueName(row,col-sameTimeNeed);
                }
            }
            var samedArr=[];
            while (samedArr.length!=sameTimeNeed){
                var i = this.props.dataStringArr.indexOf(nameObjString,samedArr.length==0?0:(samedArr[samedArr.length-1]+1));
                if(i>=0){
                    samedArr.push(i)
                }else{
                    if(sameTimeNeed>1){
                        //return ""
                        break;
                    }else{
                        break;
                    }

                }
                if(samedArr.length==sameTimeNeed){
                    var valueName="";
                    if(this.props.valueType=="rows"){
                        valueName=this.props.valueArr[row%this.props.valueArr.length]
                    }else{
                        valueName=this.props.valueArr[col%this.props.valueArr.length]
                    }
                    if(isHidden||this.props.lineData[i][valueName]=="hidden"){
                        this.props.lineData[i][valueName]="";
                    }
                    var options=this.getOptionsByName(valueName);
                    if(options.href){
                        return '<a href='+this.props.lineData[i][options.href]+'>'+this.props.lineData[i][valueName]+'</a>'
                    }
                    return this.props.lineData[i][valueName]
                }
            }
            var isState=0;
            var isLastLine=false;
            for(var i in nameObj){
                if(thisObj.getAllGroupTitle().indexOf(nameObj[i])>=0){
                    delete(nameObj[i]);
                    isState=1;
                }
                var nextObj;
                if(this.props.valueType=="columns"){
                    nextObj=this.findValueName(row+1,col);
                }else{
                    nextObj=this.findValueName(row,col+1);
                }
                var thisObjString="";
                var nextObjString="";
                for(var i in nameObj){
                    thisObjString+=i+"-"+nameObj[i]
                }
                for(var i in nextObj){
                    nextObjString+=i+"-"+nextObj[i]
                }
                if(thisObjString!=nextObjString){
                    isState=1;
                    isLastLine=true;
                }
            }
            if(isState==1){
                var statNumArr=[];
                var statNum;
                for(var i=0;i<this.props.lineData.length;i++){
                    var isSame=1;
                    for(var j in nameObj){
                        if(nameObj[j]!=this.props.lineData[i][j]){
                            isSame=0;
                            break;
                        }
                    }
                    if(isSame){
                        var valueName;
                        if(this.props.valueType=="rows"){
                            valueName=this.props.valueArr[row%this.props.valueArr.length]
                        }else{
                            valueName=this.props.valueArr[col%this.props.valueArr.length];
                        }
                        if(isHidden||this.props.lineData[i][valueName]=="hidden"||this.props.lineData[i][valueName]==undefined){
                            this.props.lineData[i][valueName]="";
                        }
                        statNumArr.push(this.props.lineData[i][valueName]);
                        statNum=thisObj.states(statNumArr,thisObj.getStatType(valueName));
                    }
                }
            }
            if(1==1){
                return statNum;
            }else {
                return ""
            }
        }else{
            if(this.props.valueType=="columns"){
                if(this.props.lineData.length>0)
                    return this.props.lineData[row][this.props.valueArr[col]]=="hidden"?"":this.props.lineData[row][this.props.valueArr[col]];
            }else{
                if(this.props.lineData.length>0)
                    return this.props.lineData[col][this.props.valueArr[row]]=="hidden"?"":this.props.lineData[col][this.props.valueArr[row]];
            }
        }
    }
    render () {
        var thisObj = this;
        var items = [];
        for (var i = 0; i < this.props.valueNum; i++) {
            items.push("");
        }
        var hiddenNum=0;
        var hiddenAfter=-1;

        return <tr>
            {
                this.props.dataSource.data.map(function (data, index) {
                    var thisWidth=thisObj.props.rowWidthArr[index]=="auto"?thisObj.props.rowWidthArr[index]:thisObj.props.rowWidthArr[index]+"px";
                    var thisAlign=thisObj.props.rowAlignArr[index];
                    var thisHtml=thisObj.props.rowHtmlArr[index];
                    var style={minWidth:thisWidth,maxWidth:thisWidth,textAlign:thisAlign};
                    var className="rowIndex";
                    if(thisWidth!="auto")
                        className+=" valueTd";
                    if(index+1==thisObj.props.dataSource.data.length)
                        className+=" rowIndexLast";
                    var valueNum=thisObj.props.rowNum%thisObj.props.valueArr.length;
                    var valueName=thisObj.props.valueArr[valueNum];
                    var dataObj={};
                    for(var i in thisObj.props.rowData){
                        dataObj[i]=thisObj.props.rowData[i][thisObj.props.rowNum]
                    }
                    var getNameByLevel=function(level,type,dataObj){
                        if (level == 0) {
                            return undefined
                        }
                        else {
                            for (var i in dataObj[type]) {
                                if (dataObj[type][i].groupLevel == level)
                                    return dataObj[type][i].name;
                            }
                        }
                    };
                    var dataName=getNameByLevel(index+1,"rows",thisObj.props.initData);
                    if(thisObj.props.dataSource.span2[index]>1&&thisObj.props.isFirst==1||hiddenAfter==0){
                        hiddenAfter++;
                    }
                    if(thisObj.isHidden(thisObj.props.dataSource.span[index],thisObj.props.dataSource.span2[index],data,hiddenAfter)!="hidden"){
                        return <td className={className} data-col-index={index} style={style} rowSpan={thisObj.props.dataSource.span[index]} colSpan={thisObj.props.dataSource.span2[index]} hidden={thisObj.isHidden(thisObj.props.dataSource.span[index],thisObj.props.dataSource.span2[index],data)} key={data+index}>
                            {
                                thisHtml==true?<span dangerouslySetInnerHTML={{__html:data}} />:data
                            }
                            <HoverSelections isCopyed={thisObj.props.isCopyed} index={thisObj.props.index} data={data} rowNumber={index} colNumber={index} type="rows" valueName={valueName} dataObj={dataObj} dataName={dataName} />
                        </td>
                    }
                })
            }
            {
                items.map(function(data,index){
                    var isHTML=thisObj.getOptionsByName(thisObj.getValueName(thisObj.props.rowNum,index)).isHTML;
                    var isHidden=false;
                    if(thisObj.props.lineHiddenArr[index]==0){
                        isHidden=true
                    }
                    var valueNum=index%thisObj.props.valueArr.length;
                    var thisWidth=thisObj.state.widthArr[valueNum]=="auto"?thisObj.state.widthArr[valueNum]:thisObj.state.widthArr[valueNum]+"px";
                    var style={textAlign:thisObj.state.alignArr[valueNum],minWidth:thisWidth,maxWidth:thisWidth};
                    if(thisObj.props.lineHiddenArr[index]!=0){
                        if(isHTML){
                            return <td className={thisWidth!="auto"?"valueTd":""} key={'value'+thisObj.props.rowNum+index}  dangerouslySetInnerHTML={{__html: thisObj.getValue(thisObj.props.rowNum,index,isHidden)}} hidden={thisObj.props.lineHiddenArr[index]==0?"hidden":""} style={style} />
                        }else{
                            return <td className={thisWidth!="auto"?"valueTd":""} key={'value'+thisObj.props.rowNum+index}  hidden={thisObj.props.lineHiddenArr[index]==0?"hidden":""}  style={style} >{thisObj.getValue(thisObj.props.rowNum,index,isHidden)}</td>
                        }
                    }
                })
            }
        </tr>
    }
};
//NpTrByRow.propTypes ={
//    initData: 'object',
//    dataSource: 'object',
//    valueNum:'number',
//    rowNum:'number',
//    colData:'object',
//    rowData:'object',
//    lineData:'array',
//    valueArr:'array',
//    valueType:'string',
//    isFirst:'number',
//    lineHiddenArr:'array',
//    rowWidthArr:'array',
//    rowAlignArr:'array',
//    dataStringArr:'array',
//    rowHtmlArr:'array',
//    index:'number',
//    isCopyed:'string'
//}



//导出组件
export default NpReport;
