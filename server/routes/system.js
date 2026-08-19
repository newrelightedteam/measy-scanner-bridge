const express = require('express');

const Naps2 = require("../../scanner/Naps2Engine");

const router = express.Router();

router.get('/api/health', (req, res) => {
    res.json({
        status: 'running'
    });
});


module.exports = router;