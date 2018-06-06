//import "babel-polyfill";
import React from 'react';
import ReactDOM from 'react-dom';
import { DatePicker, message } from 'antd';
//import DatePicker from 'antd/lib/date-picker';
//import "antd/dist/antd.min.css";
//import "antd/lib/date-picker/style/css.js"
import moment from 'moment'
import zhCN from 'antd/lib/locale-provider/zh_CN';


class NpDatePicker extends React.Component{
    constructor(props) {
        super(props);
        if(props.value!="")
            var day = moment(this.props.value);
        this.state = {
            date: day
        };
    }
    componentWillReceiveProps(nextProps){
        this.props=nextProps;
        var day="";
        if(this.props.value!="")
            day = moment(this.props.value);
        this.setState({
            date: day
        })
    }
    handleChange(date){
        //message.info('您选择的日期是: ' + date.toString());
        this.setState({ date:date });
        this.props.handleChange(date)
    }
    render(){
        return (
            <div style={{display:"inline-block",width:"60%"}}>
                <DatePicker value={this.state.date} onChange={value => this.handleChange(value)} />
            </div>
        );
    }
};
//NpDatePicker.propTypes={
//    value: 'string',
//    handleChange:'func'
//}


//导出组件
export default NpDatePicker;