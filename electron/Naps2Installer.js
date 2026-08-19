const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { app, shell } = require("electron");
const log = require("electron-log");

/**
 * Makes sure NAPS2 (the scanning engine used by every platform provider) is
 * present on the machine before the server starts handling scan requests.
 *
 * - Windows: we bundle NAPS2.Setup.exe as an extraResource and can install
 *   it silently and automatically.
 * - macOS / Linux: NAPS2 ships as a .dmg / .deb / .rpm / Flatpak, which
 *   can't be silently installed the same way from here, so instead we
 *   detect whether it's missing and open the download page for the user.
 */
class Naps2Installer {

  get platform() {
    return os.platform();
  }

  get winExe() {
    const paths = [
      "C:\\Program Files\\NAPS2\\NAPS2.Console.exe",
      "C:\\Program Files (x86)\\NAPS2\\NAPS2.Console.exe",
    ];

    return paths.find((p) => fs.existsSync(p));
  }

  get macExe() {
    const exe = "/Applications/NAPS2.app/Contents/MacOS/NAPS2";

    return fs.existsSync(exe) ? exe : undefined;
  }

  isLinuxInstalled() {
    return new Promise((resolve) => {
      execFile("which", ["naps2"], (error) => resolve(!error));
    });
  }

  async isInstalled() {
    switch (this.platform) {
      case "win32":
        return !!this.winExe;

      case "darwin":
        return !!this.macExe;

      default:
        return await this.isLinuxInstalled();
    }
  }

  async ensureInstalled() {
    if (await this.isInstalled()) {
      log.info("NAPS2 already installed");
      return;
    }

    log.info("NAPS2 not installed");

    if (this.platform === "win32") {
      await this.installWindows();
      return;
    }

    this.promptManualInstall();
  }

  promptManualInstall() {
    log.warn(
      "NAPS2 is required for scanning but wasn't found on this machine. " +
      "Opening the NAPS2 download page so it can be installed manually " +
      `(platform: ${this.platform}).`
    );

    try {
      shell.openExternal("https://www.naps2.com/download");
    } catch (err) {
      log.error("Could not open the NAPS2 download page:", err);
    }
  }

  install() {
    // Kept for backwards compatibility; Windows-only silent install.
    return this.installWindows();
  }

  installWindows() {
    return new Promise((resolve, reject) => {
      const installer = app.isPackaged
        ? path.join(process.resourcesPath, "installer", "NAPS2.Setup.exe")
        : path.join(process.cwd(), "installer", "NAPS2.Setup.exe");

      if (!fs.existsSync(installer)) {
        return reject(new Error(`Installer not found: ${installer}`));
      }

      execFile(
        installer,
        ["/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART"], // <-- Silent install (verify switch below)
        (error, stdout, stderr) => {
          if (error) {
            return reject(new Error(stderr || error.message));
          }

          if (!this.winExe) {
            return reject(
              new Error(
                "NAPS2 installation completed but executable was not found.",
              ),
            );
          }

          resolve();
        },
      );
    });
  }
}

module.exports = new Naps2Installer();
