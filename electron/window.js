const { BrowserWindow, app } = require('electron');
const path = require('path');

let window = null;

function createWindow() {

    window = new BrowserWindow({

        width: 0,
        height: 0,
        show: false,
        autoHideMenuBar: true,
        skipTaskbar: true,
        icon: path.join(__dirname, "../assets/icon.png"),

        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }

    });

    // window.loadURL(
    //     "data:text/html,<h2>Scanner Bridge Running...</h2>"
    // );

    // This is a background/tray app: closing the window (e.g. via Alt+F4,
    // or if it's ever shown) should just hide it again instead of quitting
    // the app and killing the scan server. Actual quitting only happens via
    // the tray menu's "Quit" item, which sets app.isQuitting first.
    window.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            window.hide();
        }
    });

    return window;

}

module.exports = createWindow;
