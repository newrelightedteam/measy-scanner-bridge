const { Tray, Menu, app } = require('electron');
const path = require('path');
const os = require('os');

let tray = null;

function createTray(win) {
  tray = new Tray(path.join(__dirname, "../assets/icon.png"));

  const menuItems = [
    { label: "Open", click() { win.show(); } },
  ];

  if (os.platform() === "win32") {
    const { autoUpdater } = require("electron-updater");
    menuItems.push({
      label: "Check for Updates",
      click() { autoUpdater.checkForUpdates(); }
    });
  }

  menuItems.push({
    label: "Quit",
    click() { app.isQuitting = true; app.quit(); }
  });

  const menu = Menu.buildFromTemplate(menuItems);

  tray.setToolTip("MEasy Scanner Bridge");
  tray.setContextMenu(menu);
  tray.on('double-click', () => win.show());

  return tray;
}

module.exports = createTray;