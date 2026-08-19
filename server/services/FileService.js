const fs = require("fs");
const path = require("path");
const { app } = require("electron");

class FileService {
  constructor() {
      this.uploadDir = path.join(
            app.getPath("userData"),
            "uploads"
        );

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  file(scanId,ext = "png") {
    return path.join(this.uploadDir,   `${scanId}.${ext}`);
  }

  exists(scanId,ext = "png") {
    return fs.existsSync(this.file(scanId,ext));
  }

  delete(scanId,ext = "png") {
    const file = this.file(scanId,ext);

    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}

module.exports = new FileService();
