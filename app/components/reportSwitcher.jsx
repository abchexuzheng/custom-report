//import "babel-polyfill";
import React from 'react';
import ReactDOM from 'react-dom';
//import Switch from 'antd/lib/switch';
//import "antd/lib/switch/style/css.js"
import {Switch} from 'antd'
import store from '../reduxState.js'


class ReportSwitcher extends React.Component{
    constructor(props) {
        super(props);
    }
    handleSwitch=(type,checked)=>{
        store.dispatch({type: type,index:this.props.index,checked:checked})
    }
    render(){
        var thisObj=this;
        return store.getState()[this.props.index].options.custom==true?<div>
            <ul className="switcherUL">
                <li>
                    <span>显示总计  </span>
                    <Switch defaultChecked={store.getState()[thisObj.props.index].options.stats} onChange={thisObj.handleSwitch.bind(null,"switchTotalStats")}/>
                </li>
                <li>
                    <span>左侧浮动  </span>
                    <Switch defaultChecked={store.getState()[thisObj.props.index].options.fixedLeft} onChange={thisObj.handleSwitch.bind(null,"switchFixedLeft")}/>
                </li>
                <li>
                    <span>顶部浮动  </span>
                    <Switch defaultChecked={store.getState()[thisObj.props.index].options.fixedTop} onChange={thisObj.handleSwitch.bind(null,"switchFixedTop")}/>
                </li>
                <li>
                    <span>每页行数： </span>
                    <input type="number" ref="pageSize" min="1"/>
                    <button ref="pageSizeBtn" onClick={store.dispatch.bind(null,{type: 'changePageSize',index:thisObj.props.index,thisObj:thisObj})}>确认</button>
                </li>
            </ul>
        </div>:null
    }
};
//ReportSwitcher.propTypes= {
//    index:'number'
//}


//导出组件
export default ReportSwitcher;