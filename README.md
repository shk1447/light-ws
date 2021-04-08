# light-ws
websocket with light-json

## Install
`npm install light-ws`

## Usage
### NodeJS
```js
const path = require('path');
const http = require('http');
const express = require('express');
const LWS = require('light-ws')

var app = express();

var server = http.createServer(app);

server.listen(8080, '0.0.0.0', function () {
  console.log('start server port 8080!')
})

var ws = new LWS({
  'user': {
    id:'string',
    name:'string'
  }
})

ws.listen({noServer:true,path:'/light'}, server);
```
### Browser

#### Import Module
```js
import LWS from 'light-ws';

LWS.connect('ws://localhost:8080/light', function(e) {
  if(e.type == 'open') {
    client.on('user', function(data) {
      console.log(data);
    })
  }
})
```

## Furture Feature
- It is still in the basic implementation stage.