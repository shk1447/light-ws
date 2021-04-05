const url = require('url');
const WebSocket = require('ws');
const LightJSON = require('light-json');

module.exports = function(types) {
  var wss;
  var type = {};
  if(types) {
    Object.keys(types).forEach(function(key) {
      type[key] = {
        schema:types[key],
        instance: new LightJSON(types[key])
      }
      console.log(type[key]);
    })
  }

  return {
    addKey:function(key, schema) {
      type[key] = {
        schema:schema,
        instance:new LightJSON({
          key:'string',
          data:schema
        })
      }
    },
    sendKey:function(key, data) {
      wss.clients.forEach((client) => {
        if(client.readyState === WebSocket.OPEN) {
          if(client.keys.length > 0 && client.keys.includes(key)) {
            var ljson = type[key].instance.binarify(data);
            var header = new ArrayBuffer(key.length + '|||'.length);
            
            var bufView = new Uint8Array(header);
            for(var i = 0, strLen=(key + '|||').length; i < strLen; i++) {
              bufView[i] = key.charCodeAt(i)
            }
            
            var tmp = new Uint8Array(header.byteLength + ljson.byteLength);
            
            tmp.set( new Uint8Array(header), 0);
            tmp.set(new Uint8Array(ljson), header.byteLength);
            client.send(tmp.buffer);
          }
        }
      })
    },
    broadcast: function(key, data) {
      wss.clients.forEach((client) => {
        if(client.readyState === WebSocket.OPEN) {
          var ljson = type[key].instance.binarify(data);
          
          client.send(ljson);
        }
      })
    },
    listen:function(options, server) {
      wss = new WebSocket.Server(options);
  
      wss.on('connection', function(ws,req) {
        ws['keys'] = [];
        ws.on('open', () => {
          
        })
        ws.on('message', (message) => {
          message = JSON.parse(message);
          if(message.key) {
            if(ws['keys'].includes(message.key)) ws['keys'].splice(ws['keys'].indexOf(message.key), 1);
            else ws['keys'].push(message.key)
            
            if(!type[message.key]) this.addKey(message.key, message.schema);
            
            ws.send(JSON.stringify({key:message.key, schema:type[message.key].schema}));
          }
        });
        ws.on('close', () => {
            
        })
      })
  
      if(options.noServer) {
        server.on('upgrade', function(request,socket,head) {
          const pathname = url.parse(request.url).pathname;
          if(pathname === options.path) {
              wss.handleUpgrade(request, socket, head, function(ws) {
                  wss.emit('connection', ws, request);
              })
          } else {
              socket.destory();
          }
        })
      }
  
      return wss;
    } 
  }
}