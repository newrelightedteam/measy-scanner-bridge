const ScannerService = require("../services/ScannerService");

class ScannerController {
  static async devices(req, res) {
    // console.log(req.query?.driver)
    res.json(await ScannerService.devices(req.query?.driver));
  }

  static async scan(req, res) {
    try {
      const result = await ScannerService.scan(req.body);

      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({
        success: false,
        message:
          e.toString(),//"Something went wrong while scanning. Please try reloading the page or restarting the Scanner.",
      });
    }
  }

  static async cancel(req, res) {
    try {
      const result = await ScannerService.cancel();

      res.json({
        success: true,
        ...result,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        success: false,
        message: e.toString(),
      });
    }
  }
}

module.exports = ScannerController;
