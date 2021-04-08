const url = require('url');
const WebSocket = require('ws');
const LightJSON = require('light-json');
const MessageSchema = new LightJSON({
  key: 'string',
  event: 'string',
  schema: 'json',
  data: 'Buffer'
});
module.exports = function (types) {
  //console.log(EventHandler);
  var wss;
  this.types = {};
  if (types) {
    Object.keys(types).forEach((key) => {
      this.types[key] = {
        schema: types[key],
        instance: new LightJSON(types[key])
      }
    })
  }

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

  return {
    getTypes: () => {
      return this.types;
    },
    getSchema: (key) => {
      return this.types[key];
    },
    setSchema: (key, schema) => {
      this.types[key] = {
        schema: schema,
        instance: new LightJSON({
          key: 'string',
          data: schema
        })
      }
    },
    sendData: (key, data) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          if (client.keys.length > 0 && client.keys.includes(key)) {
            var sendBuffer = merge(key, data);
            client.send(sendBuffer);
          }
        }
      })
    },
    broadcast: (key, data) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          var sendBuffer = merge(key, data);

          client.send(sendBuffer);
        }
      })
    },
    listen: (options, server) => {
      wss = new WebSocket.Server(options);

      wss.on('connection', function (ws, req) {
        ws['keys'] = [];
        ws.on('open', () => {

        })
        ws.on('message', (message) => {
          message = MessageSchema.parse(message);

          if (message.key && message.event) {
            if (message.event == 'on' && !ws['keys'].includes(message.key)) {
              ws['keys'].push(message.key);
              if (message.schema) this.setSchema(message.key, message.schema);
            }
            if (message.event == 'off' && ws['keys'].includes(message.key)) ws['keys'].splice(ws['keys'].indexOf(message.key), 1);

            //if (message.event == 'emit') EventHandler.emit(message.key)
          }
        });
        ws.on('close', () => {

        })
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
}