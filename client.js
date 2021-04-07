import SocketClient from './browser/SocketClient.js';
import EventHandler from './browser/EventHandler.js'

var handler = new EventHandler();

export default {
  addSchema: function(key, schema) {
    handler.on(key, )
  },
  connect: function() {
    var test = new SocketClient();
    test.then(function(ws) {

    })
  }
}