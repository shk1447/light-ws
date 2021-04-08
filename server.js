const url = require('url');
const WebSocket = require('ws');
const LightJSON = require('light-json');
const { Common, EventHandler } = require('./common/Utils');

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

  var setDataWithHeader = (key, data) => {
    var _header = key + '|||';
    var ljson = this.types[key].instance.binarify(data);
    var header = new ArrayBuffer(_header.length);

    var bufView = new Uint8Array(header);
    for (var i = 0, strLen = _header.length; i < strLen; i++) {
      bufView[i] = _header.charCodeAt(i)
    }

    var tmp = new Uint8Array(header.byteLength + ljson.byteLength);

    tmp.set(new Uint8Array(header), 0);
    tmp.set(new Uint8Array(ljson), header.byteLength);

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
            var sendBuffer = setDataWithHeader(key, data);
            client.send(sendBuffer);
          }
        }
      })
    },
    broadcast: (key, data) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          var sendBuffer = setDataWithHeader(key, data);

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
          message = JSON.parse(message);
          if (message.key && message.event) {
            if (message.event == 'on' && !ws['keys'].includes(message.key)) {
              ws['keys'].push(message.key);
              if (message.schema) this.setSchema(message.key, message.schema);
              ws.send(JSON.stringify({ key: message.key, schema: this.types[message.key].schema }));
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