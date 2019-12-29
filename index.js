const { ipcRenderer, shell } = require('electron');

window.market = 'btcusdt';
window.base = 'usdt';
window.ws;
window.tradingView = null;

function fetchTradingView(market) {
  if (window.tradingView) {
    window.tradingView.options.symbol = `BINANCE:${market.toUpperCase()}`;
    window.tradingView.reload();
  } else {
    window.tradingView = new TradingView.widget({
      width: 800,
      height: 600,
      symbol: `BINANCE:${market.toUpperCase()}`,
      interval: '5',
      timezone: 'Europe/Zurich',
      theme: 'Dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      container_id: 'tradingview_b0c8a'
    });
  }
}
ipcRenderer.on('market-change', (event, data) => {
  window.market = data.market;
  window.base = data.base;
  if (ws) {
    console.log('closing connection');
    ws.close();
  }
  fetchTradingView(window.market);
});

function connect(market) {
  console.log('Connecting...');
  ws = new WebSocket(`wss://stream.binance.com:9443/ws/${market}@trade`);
  ws.onopen = function() {
    console.log(`Connected to market ${market}`);
  };

  ws.onmessage = function(event) {
    try {
      let candle = JSON.parse(event.data);
      ipcRenderer.send('price-updated', { base, price: candle.p });
    } catch (e) {}
  };

  ws.onclose = function(e) {
    console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
    setTimeout(function() {
      connect(window.market);
    }, 1000);
  };

  ws.onerror = function(err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    ws.close();
  };
}

connect(market);
fetchTradingView(market);
