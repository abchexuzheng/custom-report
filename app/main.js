//main.js
import 'idempotent-babel-polyfill';
import React from 'react';
import ReactDom from 'react-dom';
import NpReport from './components/tableComponent/tableComponent.jsx';
import { createStore } from 'redux';
import store from './reduxState.js'


var reportArr=document.getElementsByClassName("np-report");



var render=function(dom){
    //console.log(store.getState());
    var randomKey=Math.ceil(Math.random()*10000)
    if(dom===undefined){
        for(var i=0;i<reportArr.length;i++){
            var thisHref=reportArr[i].getAttribute("data-source");
            var async=reportArr[i].getAttribute("data-async");
            if(!async){
                ReactDom.render(
                    <NpReport source={thisHref} index={reportArr[i].getAttribute("id")?reportArr[i].getAttribute("data-source"):i} randomKey={randomKey} />,
                    reportArr[i]
                );
            }
        }
    }else{
        ReactDom.unmountComponentAtNode(dom)
        var thisHref=dom.getAttribute("data-source");
        ReactDom.render(
            <NpReport source={thisHref} index={dom.getAttribute("id")} randomKey={randomKey}/>,
            dom
        );
    }
};
render();
store.subscribe(render);


//import AntdComponents from './components/antd.jsx';
//var reportArr=document.getElementsByClassName("AntdComponents");
//
//var render=function(){
//    for(var i=0;i<reportArr.length;i++){
//        var thisType=reportArr[i].getAttribute("data-type");
//        ReactDom.render(
//            <div>
//                <AntdComponents type={thisType} />
//            </div>,
//            reportArr[i]
//        );
//    }
//};
//render();

window.npReport={
    render:render
}
