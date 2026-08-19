const express = require("express");

const ScannerController = require("../controllers/ScannerController");
const FileService = require("../services/FileService");

const router = express.Router();

router.get("/api/scanners", ScannerController.devices);

router.post("/api/scan", ScannerController.scan);

router.post("/api/scan/cancel", ScannerController.cancel);

router.get("/api/files/:id", (req, res) => {
  const file = FileService.file(req.params.id);

  if (!FileService.exists(req.params.id)) {
    return res.status(404).json({
      success: false,
    });
  }

  res.download(file);
});

router.delete("/api/files/:id", (req, res) => {
  FileService.delete(req.params.id);

  res.json({
    success: true,
  });
});

module.exports = router;
