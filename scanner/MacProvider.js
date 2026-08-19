const { BaseProvider } = require("./BaseProvider");
const Naps2 = require("./Naps2Engine");

/**
 * macOS scanning via the NAPS2 console CLI (https://www.naps2.com).
 * NAPS2 talks to scanners on macOS through the "apple" (ImageCaptureCore)
 * driver by default, and can also use "escl" for network/AirScan-capable
 * scanners or "sane" if the sane-backends Homebrew package is installed.
 */
class MacProvider extends BaseProvider {

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

module.exports = { MacProvider }
