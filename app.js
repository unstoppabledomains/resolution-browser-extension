var finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')

// Serve homepage if desired
var serve = serveStatic('build/chrome', {'index': ['index.html', 'index.htm']})

// Create server
var server = http.createServer(function onRequest (req, res) {
  serve(req, res, finalhandler(req, res))
})

// Listen
let port = process.env.PORT || 3000;
server.listen(port);
