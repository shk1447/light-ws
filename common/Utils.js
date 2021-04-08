(function (root, factory) {
  const Common = (function () {
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

  if (typeof define === 'function' && define.amd) {
    // AMD
    define([Common, EventHandler], factory);
  } else if (typeof module === 'object' && module.exports) { // CommonJS
    module.exports = factory({ Common, EventHandler });
  } else { // window
    Object.assign(root, factory({ Common, EventHandler }));
  }
}(typeof self !== 'undefined' ? self : this, function (obj) {
  return obj;
}))
