const { BaseProvider } = require("./BaseProvider");
const Naps2 = require("./Naps2Engine");

class WindowsProvider extends BaseProvider {
  async listScanners(driver = null) {
    return await Naps2.listDevices(driver);
  }

  async scan(options) {
    return await Naps2.scan(options);
  }

  async cancel() {
    return Naps2.cancel();
  }
}

module.exports = { WindowsProvider };
