import React from 'react';
import ReactDOM from 'react-dom';
import Scrollbars from 'react-custom-scrollbars';

class SimScrollBar extends React.Component{
    handleScroll=(e)=>{
        e.stopPropagation();
        this.props.handleScroll(e.target.scrollTop)
    }
    handleMouseOver=(e)=>{
        this.props.handleMouseOver(e)
    }
    render() {
        var thisObj=this;
        var style={width: 10,height: thisObj.props.domHeight,position:"absolute",right:0,bottom:5}
        return thisObj.props.isShow?<Scrollbars onMouseOver={thisObj.handleMouseOver} scrollTop="100" className="simScrollBar" onScroll={thisObj.handleScroll} style={style}>
            <div className="simScrollBarContent"></div>
        </Scrollbars>:null
    }
}
//SimScrollBar.propTypes={
//    domHeight: 'number',
//    scrollHeight:'string',
//    handleScroll:'func',
//    handleMouseOver:'func',
//    isShow:'bool'
//}


export default SimScrollBar


