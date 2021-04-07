export default function (url) {
  return new Promise(function(resolve, reject) {
    var socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = function(evt) {
      console.log('open', evt);
      resolve(socket);
    };
    socket.onclose = function(evt) {
      console.log('close',evt);
    }
    socket.onerror = function(evt) {
      console.log('error',evt);
    }
    socket.onmessage = function(evt) {
      console.log('message', evt);
    }
  })
}