//import "babel-polyfill";
import React from 'react';
import ReactDOM from 'react-dom';
import store from '../reduxState.js';
import  $ from  'jquery';

class Drager extends React.Component{
    dragEnd(){
        store.dispatch({type: 'endDrag',index:this.props.index})
    }
    dragMove(event){
        var e = event||window.event;
        if(e){
            var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
            var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
            var x = e.pageX || e.clientX + scrollX;
            var y = e.pageY || e.clientY + scrollY;
            var style={left:x,top:y};
            this.setState({style:style});
            //console.log(document.elementFromPoint(x,y))
            var focusedNode=this.getElementByPoint(x,y);
            var parentTr=$(focusedNode).parents("tr");
            if(!parentTr.hasClass("dragToTr")&&$(focusedNode).hasClass("colIndex")){
                $(".dragToTr").removeClass("dragToTr");
                $(".dragToLeft").removeClass("dragToLeft");
                parentTr.addClass("dragToTr");
                //console.log(parentTr.parent().find("tr").index(parentTr[0]))
            }else if($(focusedNode).hasClass("rowIndex")){
                var colIndex=$(focusedNode).attr("data-colIndex");
                $(".dragToTr").removeClass("dragToTr");
                $(".dragToLeft").removeClass("dragToLeft");
                $(focusedNode).addClass("dragToLeft")
            }
        }
    }
    getElementByPoint(x,y){
        var check = false,
            isRelative = true;
            if (!document.elementFromPoint) return null;
            if (!check) {
                var sl;
                if ((sl = $(document).scrollTop()) > 0) {
                    isRelative = (document.elementFromPoint(0, sl + $(window).height() - 1) == null);
                } else if ((sl = $(document).scrollLeft()) > 0) {
                    isRelative = (document.elementFromPoint(sl + $(window).width() - 1, 0) == null);
                }
                check = (sl > 0);
        }
        if (!isRelative) {
            x += $(document).scrollLeft();
            y += $(document).scrollTop();
        }
        return document.elementFromPoint(x, y);
    }
    render(){
        var thisObj=this;
        var e = window.event;
        var style;
        if(e){
            var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
            var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
            var x = e.pageX || e.clientX + scrollX;
            var y = e.pageY || e.clientY + scrollY;
            style={left:x,top:y};
        }
        if(store.getState()[this.props.index].onDrag==true){
            window.onmousemove=function(){
                thisObj.dragMove();
            };
            window.onmouseup=function(){
                thisObj.dragEnd();
            };
            return <div ref="dragDiv" className="dragDiv" style={style}>
                拖动
            </div>
        }else{
            window.onmousemove=null;
            window.onmouseup=null;
            return null;
        }
    }
};
//Drager.propTypes={
//    index:'number'
//}

//导出组件
export default Drager;