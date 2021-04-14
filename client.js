
import LightJSON from 'light-json';

export default function (types) {
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

  var socket;
  this.types = {};
  if (types) {
    Object.keys(types).forEach(function (key) {
      this.types[key] = new LightJSON(types[key])
    }.bind(this))
  }

  this.on = EventHandler.on;
  this.off = EventHandler.off;
  this.emit = EventHandler.emit;
  this.getSchema = (key) => {
    return this.types[key];
  };
  this.setSchema = function (key, schema) {
    this.types[key] = new LightJSON(schema)
  };
  this.send = function (key, data) {
    socket.send(merge(key, this.types[key].binarify(data)));
  };
  this.connect = function (url, callback) {
    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = function (evt) {
      callback.apply(this, [evt])
    }.bind(this)
    socket.onclose = function (evt) {
      callback.apply(this, [evt])
    }.bind(this)
    socket.onerror = function (evt) {
      callback.apply(this, [evt])
    }.bind(this)
    socket.onmessage = function (evt) {
      if (evt.data instanceof ArrayBuffer) {
        var result = separate(evt.data);
        var json = this.types[result.key].parse(result.buffer)
        EventHandler.emit(result.key, [json, socket]);
      }
    }.bind(this)
    return socket;
  };

}