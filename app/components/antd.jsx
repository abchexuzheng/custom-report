//import "babel-polyfill";
import React from 'react';
import ReactDOM from 'react-dom';
//import { DatePicker, message } from 'antd';
import DatePicker from 'antd/lib/date-picker';
//import "antd/dist/antd.min.css";
import "antd/lib/date-picker/style/css.js"
import moment from 'moment'
const { MonthPicker, RangePicker } = DatePicker;
import Select from 'antd/lib/Select';
import "antd/lib/Select/style/css.js"
const Option = Select.Option;

var AntdComponents = React.createClass({
    propTypes: {
        type: React.PropTypes.string,
    },
    getInitialState: function () {
        return {

        }
    },
    render:function(){
        switch (this.props.type){
            case "DatePicker":
                return <DatePicker />
            case "RangePicker":
                return <RangePicker />
            case "DatetimePicker":
                return <DatePicker showTime  format="YYYY-MM-DD HH:mm:ss" />
        }
    }
});



//导出组件
export default AntdComponents;