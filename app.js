const express = require('express')
const path = require('path');
const YAML = require('yamljs');

const globalErrorHandler = require('./src/controllers/errorController');
const router = require('./src/routes/apiRoutes');
// const { swaggerUi, specs } = require('./src/utils/swagger');
// const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

app.use(express.json());

app.use('/api/v1/hrms', router);

app.all('*', (req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Can't find ${req.originalUrl} on this server!`
    })
});

app.use(globalErrorHandler);

module.exports = app