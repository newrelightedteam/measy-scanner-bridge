const { BaseProvider } = require("./BaseProvider");
const Naps2 = require("./Naps2Engine");

/**
 * Linux scanning via the NAPS2 console CLI (https://www.naps2.com).
 * On Linux, NAPS2 talks to scanners through the SANE ("sane") driver by
 * default, and can also use "escl" for network/AirScan-capable scanners.
 */
class LinuxProvider extends BaseProvider {

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

module.exports = { LinuxProvider }
