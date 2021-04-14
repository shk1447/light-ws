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
  'user': [{
    'id':'string',
    'name':'string'
  }],
  'user.add':{
    'id':'string',
    'name':'string'
  },
  'login': {
    'id':'string',
    'result?':'boolean'
  },
  'sendMsg': {
    'to_id':'string',
    'message':'string'
  }
})

ws.listen({noServer:true,path:'/light'}, server);
var user_list = [];
ws.on('user', function(data, client) {
  ws.send('user', user_list);
})

ws.on('user.add', function(data, client) {
  user_list.push(data);
  ws.send('user', user_list);
})

ws.on('login', function(data, client) {
  client['user_id'] = data.id;
  // args : data_type, data, forward socket
  ws.send('login', {result:true}, {user_id:data.id})
})

ws.on('syncMsg', function (data, client) {
  // args : data_type, data, forward socket
  ws.send('syncMsg', data, {user_id:data.to_id})
})
```
### Browser
#### Import Module
```js
import LWS from 'light-ws';
var ws = new LWS({ 'user': { id: 'string', name: 'string' } });
ws.connect('ws://localhost:8080/light.sock', function (e) {
  if (e.type == 'open') {
    ws.send('user', []);
    ws.send('user.add', {id:'test',name:'test'});
    ws.send('login', {id:'browser01'})
    ws.on('user', function (data) {
      console.log(data);
      // expected result
      // []
      // [{id:'test',name:'test'}]
    })
    ws.on('login', function(data) {
      console.log(data);
      // expected result
      // {result:true}
    })
    ws.on('syncMsg', function(data) {
      console.log(data);
      // if browser02 user_id call ws.send('syncMsg', {to_id:'browser01', message:'blahblahblah~~'})
      // expected result
      // {to_id:'browser01', message:'blahblahblah~~'}
    })
  }
});
```

## Furture Feature
- It is still in the basic implementation stage.