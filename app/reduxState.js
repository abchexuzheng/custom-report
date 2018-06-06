import { createStore } from 'redux';

function counter(state = {}, action) {
    switch (action.type) {
        case 'INIT':
            state[action.index]=action.data;
            return state;
        case 'removeData':
            var dataName=action.dataName;
            while (state[action.index].data[dataName].indexOf(action.key)>=0){
                var thisIndex=state[action.index].data[dataName].indexOf(action.key);
                for(var i in state[action.index].data){
                    state[action.index].data[i].splice(thisIndex,1)
                }
            }
            return state;
        case 'removeValueByLine':
            var dataStr="";
            var dataStrArr=[];
            var aName="";
            for(var i in action.dataObj){
                dataStr+=action.dataObj[i]+"-";
                aName=i;
            }
            for(var i in state[action.index].data[aName]){
                var tempStr="";
                for(var j in action.dataObj){
                    tempStr+=state[action.index].data[j][i]+"-"
                }
                dataStrArr.push(tempStr);
            }
            var lastIndex=0;
            while (dataStrArr.indexOf(dataStr,lastIndex)>=0){
                var thisIndex=dataStrArr.indexOf(dataStr,lastIndex);
                state[action.index].data[action.valueName][thisIndex]="hidden";
                lastIndex=thisIndex+1;
            }
            return state;
        case 'removeValueData':
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].name==action.valueName){
                    state[action.index][action.dataType][i].groupLevel=-1;
                }
            }
            return state;
        case 'switchValueType':
            var otherType="";
            if(action.dataType=="columns"){
                otherType="rows";
            }else{
                otherType="columns";
            }
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].groupLevel==0){
                    var newObj={};
                    for(var j in state[action.index][action.dataType][i]){
                        newObj[j]=state[action.index][action.dataType][i][j]
                    }
                    state[action.index][otherType].push(newObj)
                    state[action.index][action.dataType][i].groupLevel=-1;
                }
            }
            return state;
        case 'removeIndex':
            var thisIndex;
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].name==action.dataName){
                    thisIndex=state[action.index][action.dataType][i].groupLevel
                    state[action.index][action.dataType][i].groupLevel=-1;
                }
            }
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].groupLevel>thisIndex){
                    state[action.index][action.dataType][i].groupLevel--;
                }
            }
            return state;
        case 'switchIndex':
            var otherType="";
            if(action.dataType=="columns"){
                otherType="rows";
            }else{
                otherType="columns";
            }
            var otherMaxLevel=0;
            for(var i in state[action.index][otherType]){
                if(state[action.index][otherType][i].groupLevel>otherMaxLevel){
                    otherMaxLevel=state[action.index][otherType][i].groupLevel
                }
            }
            var thisIndex;
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].name==action.dataName&&state[action.index][action.dataType][i].groupLevel>=0){
                    var newObj={};
                    for(var j in state[action.index][action.dataType][i]){
                        newObj[j]=state[action.index][action.dataType][i][j]
                    }
                    newObj.groupLevel=otherMaxLevel+1;
                    state[action.index][otherType].push(newObj);
                    thisIndex=state[action.index][action.dataType][i].groupLevel;
                    state[action.index][action.dataType][i].groupLevel=-1;
                }
            }
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].groupLevel>thisIndex){
                    state[action.index][action.dataType][i].groupLevel--;
                }
            }
            return state;
        case'changeLevel':
            var thisLevel;
            var changedLevel;
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].name==action.dataName){
                    thisLevel=state[action.index][action.dataType][i].groupLevel;
                    changedLevel=state[action.index][action.dataType][i].groupLevel+action.level;
                }
            }
            if(changedLevel==0){
                return state[action.index]
            }
            var changeAble=0;
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].groupLevel==changedLevel){
                    changeAble=1;
                }
            }
            if(changeAble){
                for(var i in state[action.index][action.dataType]){
                    if(state[action.index][action.dataType][i].groupLevel==thisLevel){
                        state[action.index][action.dataType][i].groupLevel=changedLevel;
                    }else if(state[action.index][action.dataType][i].groupLevel==changedLevel){
                        state[action.index][action.dataType][i].groupLevel=thisLevel;
                    }
                }
            }
            return state;
        case 'addStats':
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].name==action.dataName){
                    state[action.index][action.dataType][i].groupStats=!state[action.index][action.dataType][i].groupStats;
                    if(state[action.index][action.dataType][i].statsTitle==""){
                        state[action.index][action.dataType][i].statsTitle="小计"
                    }
                }
            }
            return state;
        case 'changeStatsType':
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].name==action.valueName){
                    state[action.index][action.dataType][i].stats=action.stats;
                }
            }
            return state;
        case 'changeAlign':
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].name==action.valueName){
                    state[action.index][action.dataType][i].align=action.align;
                }
            }
            return state;
        case 'changeWidth':
            for(var i in state[action.index][action.dataType]){
                if(state[action.index][action.dataType][i].name==action.valueName){
                    state[action.index][action.dataType][i].width=action.thisObj.refs.widthInput.value!=""?action.thisObj.refs.widthInput.value:"auto";
                }
            }
            return state;
        case 'switchTotalStats':
            state[action.index].options.stats=action.checked;
            return state;
        case 'switchFixedLeft':
            state[action.index].options.fixedLeft=action.checked;
            return state;
        case 'switchFixedTop':
            state[action.index].options.fixedTop=action.checked;
            if(!state[action.index].options.bodyHeight){
                state[action.index].options.bodyHeight=400;
            }
            return state;
        case 'changePageSize':
            var pageSize=action.thisObj.refs.pageSize.value>0?action.thisObj.refs.pageSize.value:state[action.index].options.pageSize;
            state[action.index].options.pageSize=pageSize;
            return state;
        case 'startDrag':
            state[action.index].onDrag=true;
            state[action.index].dragFrom=action.dataName;
            return state;
        case 'endDrag':
            state[action.index].onDrag=false;
            return state;
        default:
            return state;
    }
}

let store = createStore(counter);

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

//导出组件
export default store;
