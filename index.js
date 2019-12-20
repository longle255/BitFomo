const { ipcRenderer, shell } = require('electron');

function connect() {
  console.log("Connecting...");
  var ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
  ws.onopen = function() {
    console.log("Connected");
  };

  ws.onmessage = function(event) {
    try {
      let candle = JSON.parse(event.data);
      ipcRenderer.send('price-updated', candle.p);
    } catch (e) {}
  };

  ws.onclose = function(e) {
    console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
    setTimeout(function() {
      connect();
    }, 1000);
  };

  ws.onerror = function(err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    ws.close();
  };
}

connect();
