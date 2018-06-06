import React from 'react';
import ReactDOM from 'react-dom';
import  $ from  'jquery';

class Pagination extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            pageNow:this.props.pageNow?this.props.pageNow:1,
            pageNum:Math.ceil(this.props.totalLength/this.props.pageSize),
            data: this.getPageArr(this.props.pageNow),
            inputValue:1,
        };
    }
    componentWillReceiveProps(nextProps){
        this.props=nextProps;
        this.setState({
            pageNow:this.props.pageNow?this.props.pageNow:1,
            pageNum:Math.ceil(this.props.totalLength/this.props.pageSize),
            data: this.getPageArr(this.props.pageNow),
            inputValue:1
        })
    }
    selectPage=(num)=>{
        if(num>=1&&num<=this.state.pageNum){
            this.setState(
                {
                    pageNow:num,
                    inputValue:num,
                    data:this.getPageArr(num)
                }
            );
            this.props.setPage(num)
            $(window.top).scrollTop(0)
        }
    }

    getPageArr(num){
        var pageNum=Math.ceil(this.props.totalLength/this.props.pageSize);
        var pageArr=[];
        for(var i=1;i<=pageNum;i++){
            if(i==num){
                pageArr.push(1)
            }else {
                pageArr.push(0)
            }
        }
        if(pageArr.length==0){
            pageArr.push(1)
        }
        return pageArr;
    }
    handleInputChange=(event)=>{
        this.setState({
            inputValue:parseInt(event.target.value)
        });
    }
    render(){
        var thisObj=this;
        return <div className="pagination">
            <div  onClick={thisObj.selectPage.bind(null,this.state.pageNow-1)}>←</div>
            <div  onClick={thisObj.selectPage.bind(null,1)} style={{display:this.state.pageNow>=4?"inline-block":"none"}}>{1}</div>
            <div className="pageEllipsis"  style={{display:this.state.pageNow>=5?"inline-block":"none"}}>···</div>
            {
                this.state.data.map(function(data,index){
                    if(index>=(thisObj.state.pageNow-3)&&index<=(thisObj.state.pageNow+1))
                        return <div key={"page"+index} className={data?"pageNow":""} onClick={thisObj.selectPage.bind(null,index+1)}>{index+1}</div>
                })
            }
            <div className="pageEllipsis"  style={{display:this.state.pageNow<=(thisObj.state.pageNum-4)?"inline-block":"none"}}>···</div>
            <div onClick={thisObj.selectPage.bind(null,thisObj.state.data.length)}  style={{display:this.state.pageNow<=(thisObj.state.pageNum-3)?"inline-block":"none"}}>{thisObj.state.data.length}</div>
            <div onClick={thisObj.selectPage.bind(null,this.state.pageNow+1)}>→</div>
            <input style={{display:this.state.pageNum<=10?"none":""}} min="1" type="number" value={this.state.inputValue} className="pageInput" onChange={this.handleInputChange}/>
            <button style={{display:this.state.pageNum<=10?"none":""}} onClick={thisObj.selectPage.bind(null,this.state.inputValue)}>跳转</button>
        </div>
    }
};

//Pagination.propTypes={
//    pageSize: 'number',
//    pageNow: 'number',
//    totalLength: 'number',
//    setPage:'func'
//}


//导出组件
export default Pagination;