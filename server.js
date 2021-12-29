const url = require('url');
const WebSocket = require('ws');
const LightJSON = require('light-json');

module.exports = function (types) {
  // 내부 컴포넌트간의 이벤트 정의 위한 핸들러
  const EventHandler = (function () {
    var handlers = {};

    function on(evt, func) {
      handlers[evt] = handlers[evt] || [];
      handlers[evt].push(func);
    }

    function off(evt, func) {
      var handler = handlers[evt];
      if (handler) {
        for (var i = 0; i < handler.length; i++) {
          if (handler[i] === func) {
            handler.splice(i, 1);
            return;
          }
        }
      }
    }

    function emit(evt, args) {
      if (handlers[evt]) {
        for (var i = 0; i < handlers[evt].length; i++) {
          try {
            handlers[evt][i].apply(null, args);
          } catch (err) {
            console.log("common.events.emit error: [" + evt + "] " + (err.toString()));
            console.log(err);
          }
        }
      }
    }
    return {
      on: on,
      off: off,
      emit: emit
    }
  })();

  var separate = (buffer) => {
    var bufView = new Uint8Array(buffer);
    var key = "";
    for (var i = 0; i < bufView.length - 2; i++) {
      if (bufView[i] == 124 && bufView[i] == bufView[i + 1] && bufView[i] == bufView[i + 2]) {
        bufView = bufView.slice(i + 3, bufView.length)
        break;
      }
      key += String.fromCharCode(bufView[i]);
    }

    return {
      key: key,
      buffer: bufView.buffer
    }
  }

  var merge = (key, buffer) => {
    var _header = key + '|||';
    var header = new ArrayBuffer(_header.length);

    var bufView = new Uint8Array(header);
    for (var i = 0, strLen = _header.length; i < strLen; i++) {
      bufView[i] = _header.charCodeAt(i)
    }

    var tmp = new Uint8Array(header.byteLength + buffer.byteLength);

    tmp.set(new Uint8Array(header), 0);
    tmp.set(new Uint8Array(buffer), header.byteLength);

    return tmp.buffer;
  }

  var wss;
  this.types = {};
  if (types) {
    Object.keys(types).forEach((key) => {
      this.types[key] = new LightJSON(types[key])
    })
  }

  this.getSchema = (key) => {
    return this.types[key];
  };
  this.setSchema = (key, schema) => {
    this.types[key] = new LightJSON(schema)
  };
  this.send = (key, data, to) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        if(to) {
          Object.keys(to).forEach((channel) => {
            if(client.hasOwnProperty(channel)) {
              if((Array.isArray(client[channel]) && client[channel].includes(to[channel])) || client[channel] === to[channel]) {
                var sendBuffer = merge(key, this.types[key].binarify(data));
                client.send(sendBuffer); 
              }
            }
          })
        } else {
          var sendBuffer = merge(key, this.types[key].binarify(data));
          client.send(sendBuffer);
        }
      }
    })
  };

  this.response = (key, data, to) => {
    var sendBuffer = merge(key, this.types[key].binarify(data));
    to.send(sendBuffer)
  };
  
  this.on = EventHandler.on;
  this.off = EventHandler.off;
  this.emit = EventHandler.emit;
  this.listen = (options, server, callback) => {
    wss = new WebSocket.Server(options);

    wss.on('connection', function (ws, req) {
      ws.on('open', (evt) => {
        
      })
      ws.on('message', (message) => {
        if(message instanceof Buffer) {
          var result = separate(message);
          var json = this.types[result.key].parse(result.buffer)
          EventHandler.emit(result.key, [json, ws, req])
        }
      });
      ws.on('close', (evt) => {
        callback.apply(this, ['closed', ws]);
      })
      callback.apply(this, ['connected', ws]);
    }.bind(this))

    if (options.noServer) {
      server.on('upgrade', function (request, socket, head) {
        const pathname = url.parse(request.url).pathname;
        if (pathname === options.path) {
          wss.handleUpgrade(request, socket, head, function (ws) {
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