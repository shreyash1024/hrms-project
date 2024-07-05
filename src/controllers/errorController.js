module.exports = (err, req, res, next) => {

    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';

    if (err.isOperational) {
        res.status(statusCode).json({
            status: status,
            error: err,
            message: err.message,
            stack: err.stack
        })
    } else {
        console.log('ERROR!!!', err);

        res.status(500).json({
            status: 'error',
            error: err,
            message: err.message,
            stack: err.stack
        })
    }
}