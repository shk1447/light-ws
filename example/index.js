const path = require('path');
const http = require('http');
const express = require('express');
const LightWS = require('../index.js')

var app = express();

app.use('/', express.static(path.resolve(__dirname, '../')))

var server = http.createServer(app);

server.listen(8080, '0.0.0.0', function () {
  console.log('start server port 8080!')
})

var ws = new LightWS({
  'user': {
    id:'string',
    name:'string'
  }
})

ws.listen({noServer:true,path:'/light'}, server);

setInterval(function() {
  ws.sendKey('user',{
    id:'aaaa',
    name:'aaaa'
  })
},1000)