const Utils = (function () {
  function separate(buffer) {
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

  function merge(key, buffer) {
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
    separate: separate,
    merge: merge
  }
})();


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

export { EventHandler, Utils }

import LightJSON from 'light-json';

var socket;
var types = {};
const MessageSchema = new LightJSON({
  key: 'string',
  event: 'string',
  schema: 'json',
  data: 'Buffer'
});
export default {
  setSchema: function (key, schema) {
    types[key] = new LightJSON(schema)
  },
  sendData(key, data) {
    socket.send(Utils.merge(key, types[key].binarify(data)));
  },
  on: function (key, func) {
    EventHandler.on(key, func);
    socket.send(MessageSchema.binarify({ key: key, event: 'on' }))
  },
  off: function (key, func) {
    EventHandler.off(key, func)
    socket.send(MessageSchema.binarify({ key: key, event: 'off' }))
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
        var result = Utils.separate(evt.data);
        var json = types[result.key].parse(result.buffer)
        EventHandler.emit(result.key, [json]);
      } else {
        console.log(evt.data);
      }
    }
    return socket;
  }
}