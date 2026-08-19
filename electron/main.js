const { app } = require("electron");
const log = require("electron-log");
const { autoUpdater } = require("electron-updater");

const createWindow = require("./window");
const createTray = require("./tray");

const server = require("../server/app");
const config = require("../config/config");

const AutoLaunch = require("auto-launch");

const Naps2Installer = require("./Naps2Installer");

autoUpdater.logger = log;
autoUpdater.autoDownload = true; // download in background automatically
autoUpdater.autoInstallOnAppQuit = true; // install next time app quits

function setupAutoUpdater() {
  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for update...");
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info.version);
  });

  autoUpdater.on("update-not-available", () => {
    log.info("No update available.");
  });

  autoUpdater.on("error", (err) => {
    log.error("Auto updater error:", err);
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info.version);
    // Since this is a tray app with no visible window most of the time,
    // installing on next quit (autoInstallOnAppQuit) is the least
    // disruptive option. If you want it to update immediately instead:
    // autoUpdater.quitAndInstall();
  });

  // Check on startup, then every few hours
  autoUpdater.checkForUpdates();
  setInterval(
    () => {
      autoUpdater.checkForUpdates();
    },
    4 * 60 * 60 * 1000,
  ); // every 4 hours
}

// Scanner Bridge is a background/tray app - only one instance should ever
// be running (it also owns a fixed local port), so hand off to the
// existing instance instead of starting a second server.
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  const launcher = new AutoLaunch({
    name: "MEasy Scanner Bridge",
    path: app.getPath("exe"),
    isHidden: true, // start hidden/in the background on login (macOS)
  });

  app.on("second-instance", () => {
    // Another launch attempt happened (e.g. user opened it again, or the
    // OS restarted it) - there's nothing to focus since we run from the
    // tray, so this is intentionally a no-op.
  });

  app.on("before-quit", () => {
    app.isQuitting = true;
  });

  app.whenReady().then(async () => {
    // Tray-only app: no Dock icon/app switcher entry on macOS.
    if (process.platform === "darwin" && app.dock) {
      app.dock.hide();
    }

    if (app.isPackaged && process.platform === "win32") {
      setupAutoUpdater();
    }

    // Auto-start on OS login. Only wired up for packaged builds so running
    // `npm run dev` doesn't register your dev checkout as a login item.
    if (app.isPackaged) {
      try {
        // Always re-enable so a stale entry from a previous version/path
        // gets overwritten rather than silently left in place.
        await launcher.disable().catch(() => {}); // ignore if it wasn't enabled
        await launcher.enable();
      } catch (err) {
        log.error("Failed to configure auto-launch:", err);
      }
    }

    // Ensure NAPS2 is installed. On Windows this installs it silently; on
    // macOS/Linux it just opens the download page if it's missing. Either
    // way, failures here shouldn't prevent the tray/server from starting.
    try {
      await Naps2Installer.ensureInstalled();
    } catch (err) {
      log.error("NAPS2 setup failed:", err);
    }

    const win = createWindow();

    createTray(win);

    try {
      server.listen(config.port, config.host, () => {
        log.info(`Server running on ${config.host}:${config.port}`);
      });
    } catch (err) {
      log.error(err);
    }
  });

  // Keep running in the tray when the window closes instead of quitting -
  // the window is only ever hidden (see electron/window.js), so this
  // mainly guards against platform quirks where all-windows-closed would
  // otherwise terminate the app.
  app.on("window-all-closed", () => {
    // Do nothing - registering this handler is enough to stop Electron's
    // default "quit when all windows are closed" behavior.
  });
}
