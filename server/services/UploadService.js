const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const config = require("../../config/config");

class UploadService {

    async upload(filePath, metadata = {}) {

        const form = new FormData();
        console.log(filePath)

        form.append(
            "file",
            fs.createReadStream(filePath),{ knownLength: fs.statSync(filePath).size }
        );

        Object.keys(metadata).forEach(key => {
            form.append(key, metadata[key]);
        });

       

        try{

            const response = await axios.post(
            config.laravel.url + config.laravel.upload,
            form,

            {
                headers: {
                    ...form.getHeaders(),
                    "Content-Length": form.getLengthSync(),
                    Authorization:
                        `Bearer ${config.laravel.token}`
                },
                // maxBodyLength: Infinity
            }

        );

        console.error(response);

        return response.data;

        }catch(err){
            console.error('Error sending form-data:', err.message);
        }

    }

}

module.exports = new UploadService();