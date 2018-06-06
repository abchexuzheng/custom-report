var http = require('http');
var url = require("url");

var caseInfo={
    caseTotal:642,      //案例总数
    caseThisMonth: 168,     //本月案例数
    readTotal:  15667 ,     //案例总阅读量
    starOfTheMonth:	 "上海一部"     //本月案例区域之星
}

var srv = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    var dataType = url.parse(req.url, true).query.dataType;
    console.log(url.parse(req.url, true).query)
    if (dataType == "" || dataType == undefined) {
        res.end(JSON.stringify(data));
    } else {
        res.end(JSON.stringify(eval(dataType)));
    }

});

srv.listen(8280, function () {
    console.log('listening on localhost:8280');
});