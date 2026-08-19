module.exports = (req, res, next) => {

    const token = req.header('X-API-Key');

    if (token !== (process.env.API_KEY)) {

        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });

    }

    next();

};