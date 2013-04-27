var connect = require('connect');

var port = process.env.PORT || 3000;

connect.createServer(
    connect.static(__dirname  + '/..')
).listen(port);

console.log("Main page at at http://localhost:%d/web/index.html", port);
console.log("Test page at at http://localhost:%d/web/test.html", port);