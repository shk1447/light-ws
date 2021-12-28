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
const LWS = require('light-ws/server')

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
import LWS from 'light-ws/client';
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

## Available types

### Basic types

- 'uint': unsigned integer (between 0 and 2^53)
- 'int': signed integer (between -2^53 and 2^53)
- 'float': a 64-bit floating-point (the JavaScript number type)
- 'string': a utf-8 string
- 'Buffer': a Buffer instance
- 'boolean': a boolean
- 'regex': a JS RegExp instance
- 'date': a JS Date instance
- 'json': any data supported by [JSON format](http://json.org/). Read bellow for more
- 'oid': mongodb ObjectId (see bellow)

### Compound types

A compound type is an object with (optional) fields. Those fields may be arrays, but with the restriction that every element has the same data schema.

Examples:

- Nested fields: `{a: {b: 'int', d: {e: 'int'}}}`
- Optional fields: `{a: 'int', 'b?': 'int', 'c?': {d: 'int'}}`
- Array fields: `{a: ['int']}`
- All together now: `{'a?': [{'b?': 'int'}]}`

### Array type

An array type in which every element has the same data schema.

Examples:

- Int array: `['int']`
- Object array: `[{v: 'int', f: 'string'}]`

### JSON type

As stated before, the js-binary requires the data to have a rather strict schema. But sometimes, part of the data may not fit this reality. In this case, you can fallback to JSON :)

Of course, a JSON field will miss the point about space efficiency and data validation, but will gain in flexibility.

### ObjectId type

js-binary gives first-class support for mongodb ObjectId. But since js-binary doesn't (and shouldn't) depend on any peculiar mongodb driver, the rules for this type are:

- Encoding: any object `o` is accepted, as long `new Buffer(String(o), 'hex')` yields a 12-byte Buffer
- Decoding: returns a 24-char hex-encoded string

This should be compatible with most ObjectId implementations on the wild

## Furture Feature
- It is still in the basic implementation stage.
