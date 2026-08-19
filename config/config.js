const path = require("path");
const { app } = require("electron");

const envPath = app.isPackaged
  ? path.join(process.resourcesPath, ".env")
  : path.join(__dirname, "..", ".env");

require("dotenv").config({ path: envPath });

module.exports = {
    host: process.env.HOST || '127.0.0.1',
    port: Number(process.env.PORT) || 3000,
    apiKey: process.env.API_KEY || null,
     laravel: {
        url: process.env.LARAVEL_URL || null,
        upload: process.env.LARAVEL_UPLOAD_ENDPOINT || null,
        token: process.env.LARAVEL_API_TOKEN || null

    }
};