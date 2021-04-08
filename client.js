import './common/Utils.js'
var socket;
var type = {}
export default {
  on: function (key, func) {
    EventHandler.on(key, func);
    socket.send(JSON.stringify({ key: key, event: 'on' }))
  },
  off: function (key, func) {
    EventHandler.off(key, func)
    socket.send(JSON.stringify({ key: key, event: 'off' }))
  },
  send: function (key, data) {
    socket.send(type[key].binarify(data))
  },
  connect: function (url, callback) {
    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = function (evt) {
      callback.apply(this, [evt])
    };
    socket.onclose = function (evt) {
      callback.apply(this, [evt])
    }
    socket.onerror = function (evt) {
      callback.apply(this, [evt])
    }
    socket.onmessage = function (evt) {
      if (evt.data instanceof ArrayBuffer) {
        var result = Common.separate(evt.data);
        var json = type[result.key].parse(result.buffer)
        EventHandler.emit(result.key, [json]);
      } else if (typeof evt.data == 'string') {
        var ljson = JSON.parse(evt.data);
        type[ljson.key] = new LJSON(ljson.schema)
      }
    }
    return socket;
  }
}