const os = require("os");

const { WindowsProvider } = require("./WindowProvider");
const { MacProvider } = require("./MacProvider");
const { LinuxProvider } = require("./LinuxProvider");

// import WindowsProvider from "./providers/WindowProvider";

class ScannerManager {
  constructor() {
    switch (os.platform()) {
      case "win32":
        this.provider = new WindowsProvider();
        break;

      case "darwin":
        this.provider = new MacProvider();
        break;

      default:
        this.provider = new LinuxProvider();
    }
  }

  async listScanners(driver = null) {
    return this.provider.listScanners(driver);
  }

  async scan(options = null) {
    return this.provider.scan(options);
  }

  async cancel() {
    return this.provider.cancel();
  }
}

module.exports = new ScannerManager();
