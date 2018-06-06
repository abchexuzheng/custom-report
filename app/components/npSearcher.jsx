import React from 'react';
import ReactDOM from 'react-dom';
import NpDatePicker from '../components/datePicker.jsx';

class NpSearcher extends React.Component{
    constructor(props) {
        super(props);
        var initData=props.dataSource;
        var searchedData=props.searchedData;
        for(var i in initData){
            if(searchedData[initData[i].name]){
                initData[i].value=searchedData[initData[i].name];
            }else{
                initData[i].value="";
            }
        }
        var initData2=[];
        for(var i=0;i<initData.length;i++){
            initData2.push(initData[i])
        }
        this.state = {
            data: initData,
            initData:initData2
        };
    }
    handleSearch=()=>{
        this.props.search(this.state.data);
    }
    handleInputChange=(index,event)=>{
        var dataSource=this.state.data;
        if(event){
            if(event._d){
                var month=event._d.getMonth()+1;
                if(month<10){
                    month="0"+month
                }
                var day=event._d.getDate();
                if(day<10){
                    day="0"+day
                }
                dataSource[index].value=event._d.getFullYear()+"-"+month+"-"+day;
                this.setState({
                    data:dataSource
                });
            }else{
                dataSource[index].value=event.target.value;
                this.clearChildrenData(dataSource,index)
                this.setState({
                    data:dataSource
                });
            }
        }else{
            dataSource[index].value="";
            this.setState({
                data:dataSource
            });
        }
    }
    clearSearch=()=>{
        var initData=this.props.dataSource;
        for(var i in initData){
            initData[i].value="";
        }
        this.setState({
            data:initData
        });
    }
    getDataIndexByName(name){
        var thisObj=this;
        for(var i in thisObj.state.data){
            if(thisObj.state.data[i].name==name){
                if(thisObj.state.data[i].parent==0){
                    return i;
                }else{
                    return thisObj.getDataIndexByName(thisObj.state.data[i].parent)
                }
            }
        }
    }
    getDataLastIndexByName(name){
        var thisObj=this;
        for(var i in thisObj.state.data){
            if(thisObj.state.data[i].name==name){
                return i;
            }
        }
    }
    clearChildrenData(dataSource,index){
        var thisName=dataSource[index].name;
        for(var i in dataSource){
            if(dataSource[i].parent==thisName){
                dataSource[i].value="";
                dataSource=this.clearChildrenData(dataSource,i);
            }
        }
        return dataSource;
    }
    getValue(data,index){
        var thisObj=this;
        if(data.parent==undefined||data.parent==0){
            return data.value;
        }else{
            var dataIndex=thisObj.getDataIndexByName(tdata.parent)
            var dataLastIndex=thisObj.getDataLastIndexByName(data.parent)
        }
    }
    render(){
        var thisObj=this;
        return this.state.data.length!=0?<div className="searcher" hidden={this.state.data.length==0?"hidden":""}>
            {
                this.state.data.map(function (data, index) {
                    if(data.type=="text"){
                        return <div key={"search"+index} className="npSearchBox">
                            <label>{data.title+"："}</label><input value={data.value} type={data.type} onChange={thisObj.handleInputChange.bind(null,index)}/>
                        </div>
                    }else if(data.type=="Sselect"){
                        return <div key={"search"+index} className="npSearchBox">
                            <label>{data.title+"："}</label>
                            <select onChange={thisObj.handleInputChange.bind(null,index)} value={data.value}>
                                <option key={data+"-1"} value="" />
                                {
                                    thisObj.props.dataSource[index].dataValue.map(function(data,index2){
                                        return <option key={data+index2} value={thisObj.props.dataSource[index].dataId[index2]} >{data}</option>
                                    })
                                }
                            </select>
                        </div>
                    }else if(data.type=="date"){
                        return <div className="npSearchBox"  key={"search"+index}>
                            <label>{data.title+"："}</label>
                            <NpDatePicker value={data.value} handleChange={thisObj.handleInputChange.bind(null,index)}/>
                        </div>
                    }else if(data.type=="select"){
                        return <div key={"search"+index} className="npSearchBox">
                            <label>{data.title+"："}</label>
                            <select onChange={thisObj.handleInputChange.bind(null,index)} value={data.value}>
                                <option key={data+"-1"} value="" />
                                {
                                    (thisObj.props.dataSource[index].parent==undefined||thisObj.props.dataSource[index].parent==0)?thisObj.props.dataSource[index].dataValue.map(function(data,index2){
                                        if(thisObj.props.dataSource[index].dataPId==undefined||thisObj.props.dataSource[index].dataPId[index2]==0){
                                            return <option key={data+index2} value={thisObj.props.dataSource[index].dataId[index2]} >{data}</option>
                                        }else{
                                            return null;
                                        }
                                    }):thisObj.props.dataSource[thisObj.getDataIndexByName(thisObj.props.dataSource[index].parent)].dataValue.map(function(data,index2){
                                        var dataIndex=thisObj.getDataIndexByName(thisObj.props.dataSource[index].parent)
                                        var dataLastIndex=thisObj.getDataLastIndexByName(thisObj.props.dataSource[index].parent)
                                        var dataObj=thisObj.props.dataSource[dataIndex];
                                        if(dataObj.dataPId[index2]==thisObj.state.data[dataLastIndex].value&&dataObj.dataPId[index2]!=0){
                                            return <option key={data+index2} value={dataObj.dataId[index2]} >{data}</option>
                                        }else{
                                            return null;
                                        }

                                    })
                                }
                            </select>
                        </div>
                    }
                })
            }
            <div className="btnBox">
                <button className="searchBtn" onClick={this.handleSearch}>搜索</button>
                <button className="clearBtn" onClick={this.clearSearch}>清空</button>
            </div>
        </div>:null;
    }
};
//NpSearcher.propTypes= {
//    dataSource: 'array',
//    search:'func',
//    searchedData:'object'
//}

export default NpSearcher;