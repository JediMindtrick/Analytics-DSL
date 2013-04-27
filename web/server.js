var connect = require('connect');

var port = process.env.PORT || 3000;

connect.createServer(
    connect.static(__dirname)
).listen(port);

console.log("Server listening on port %d", port);