const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu, MenuItem } = require('electron');
const path = require('path');

const assetsDirectory = path.join(__dirname, 'assets');

let tray = undefined;
let window = undefined;

// Don't show the app in the doc
app.dock.hide();

app.on('ready', () => {
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

  contextMenu.append(
    new MenuItem({
      label: 'Debug',
      click() {
        showWindow();
        window.webContents.openDevTools();
      }
    })
  );

  contextMenu.append(
    new MenuItem({
      label: 'Exit',
      click() {
        app.exit(0);
      }
    })
  );

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

ipcMain.on('price-updated', (event, price) => {
  tray.setTitle(`$${Math.round(price)}`);
});
