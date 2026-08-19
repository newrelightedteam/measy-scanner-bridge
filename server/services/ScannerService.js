const fs = require("fs");
const path = require("path");
const UploadService = require("./UploadService");
const ScannerManager = require("../../scanner/ScannerManager");
const FileService = require("./FileService");
const { v4: uuid } = require("uuid");

class ScannerService {
  constructor() {
    // Scanner Bridge only runs one scan at a time, so tracking a single
    // active scan ID is enough for the cancel endpoint to report what it
    // stopped.
    this.activeScanId = null;
  }

  async devices(driver = null) {
    return await ScannerManager.listScanners(driver);
  }

  async scan(options) {
    const scanId = uuid();
    const output = FileService.file(scanId);

    this.activeScanId = scanId;

    try {
      await ScannerManager.scan({
        ...options,
        output,
      });
    } finally {
      this.activeScanId = null;
    }

    return {
      success: true,
      scanId,
      filename: scanId + ".png",
      download: `/api/files/${scanId}`,
    };
  }

  async cancel() {
    const scanId = this.activeScanId;
    const result = await ScannerManager.cancel();

    return {
      ...result,
      scanId,
    };
  }
}

module.exports = new ScannerService();
