const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu, MenuItem } = require('electron');
const Binance = require('binance-api-node').default;
const _ = require('lodash');

const client = Binance();

const path = require('path');

const assetsDirectory = path.join(__dirname, 'assets');

let tray = undefined;
let window = undefined;

const menuItems = [
  new MenuItem({
    label: 'Debug',
    click() {
      showWindow();
      window.webContents.openDevTools();
    }
  }),
  new MenuItem({
    type: 'separator'
  })
];

const fetchExchangeData = async () => {
  const marketInfo = await client.exchangeInfo();
  const quoteAssets = _.groupBy(marketInfo.symbols, 'quoteAsset');
  for (let base of Object.keys(quoteAssets)) {
    const pairs = quoteAssets[base].map(market => {
      return {
        label: market['baseAsset'],
        role: 'submenu',
        click() {
          window.webContents.send('market-change', { market: market['symbol'].toLowerCase(), base });
          // ipcMain.send('market-change', market['symbol'].toLowerCase());
        }
      };
    });
    const mnuItem = new MenuItem({
      label: base,
      submenu: pairs
    });
    menuItems.push(mnuItem);
  }
  menuItems.push(
    new MenuItem({
      type: 'separator'
    })
  );

  menuItems.push(
    new MenuItem({
      label: 'Exit',
      click() {
        app.exit(0);
      }
    })
  );
};
// Don't show the app in the doc
app.dock.hide();

app.on('ready', async () => {
  await fetchExchangeData();
  createTray();
  createWindow();
});

// Quit the app when the window is closed
app.on('window-all-closed', () => {
  app.quit();
});

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, 'menuIcon.png'));

  const contextMenu = new Menu();

  for (let i of menuItems) contextMenu.append(i);

  tray.on('right-click', function(event) {
    tray.popUpContextMenu(contextMenu);
  });
  // tray.on('right-click', toggleWindow);
  tray.on('double-click', toggleWindow);
  tray.on('click', function(event) {
    toggleWindow();

    // Show devtools when command clicked
    if (window.isVisible() && process.defaultApp && event.metaKey) {
      window.openDevTools({ mode: 'detach' });
    }
  });
};

const getWindowPosition = () => {
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  return { x: x, y: y };
};

const createWindow = () => {
  window = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    paintWhenInitiallyHidden: false,
    webPreferences: {
      nodeIntegration: true,
      // Prevents renderer process code from not running when window is
      // hidden
      backgroundThrottling: true
    },
    icon: path.join(assetsDirectory, 'menuIcon.png')
  });

  window.loadURL(`file://${path.join(__dirname, 'index.html')}`);

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });
};

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide();
  } else {
    showWindow();
  }
};

const showWindow = () => {
  const position = getWindowPosition();
  window.setPosition(position.x, position.y, false);
  window.show();
  window.focus();
};

ipcMain.on('show-window', () => {
  showWindow();
});

ipcMain.on('price-updated', (event, candle) => {
  let c, price;
  if (candle.base.toLowerCase().indexOf('usd') >= 0) {
    c = '$';
    price = Math.round(candle.price);
  } else if (candle.base.toLowerCase().indexOf('btc') >= 0) {
    c = '₿';
    price = parseFloat(candle.price).toFixed(6);
  } else {
    c = candle.base;
    price = parseFloat(candle.price).toFixed(6);
  }
  tray.setTitle(`${c} ${price}`);
  tray.set
});
