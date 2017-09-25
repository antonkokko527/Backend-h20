'use strict';

const fs = require('fs'),
    cors = require('cors'),
    morgan = require('morgan'),
    helmet = require('helmet'),
    express = require('express'),
    mongoose = require('mongoose'),
    compress = require('compression'),
    bodyParser = require('body-parser'),
    expressValidation = require('express-validation'),
    config = require('./config'),
    APIError = require('../api/utils/api-error'),
    logger = require('./logger').instance,
    app = express();

const routes = require('../api/routes/index.route');

if (config.cors) app.use(cors());
app.use(morgan('combined'));
app.use(helmet({frameguard: false}));
app.use(bodyParser.json({limit: config.fileSizeLimit}));
app.use(bodyParser.urlencoded({extended: true, limit: config.fileSizeLimit}));
app.use(compress());

/**
 * All routes mounted on this path
 * */
app.use('/api', routes);

/**
 * Convert Errors to APIError class
 * */
app.use((err, req, res, next) => {
    console.error(err);
    if (err instanceof expressValidation.ValidationError) {
        // validation error contains errors which is an array of error each containing message[]
        const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
        const error = new APIError(unifiedErrorMessage, err.status, true, err.errors);
        return next(error);
    } else if (!(err instanceof APIError)) {
        const apiError = new APIError(err.message, err.status, err.isPublic);
        return next(apiError);
    }
    return next(err);
});

/**
 * Catch 404 and forward to error handler
 * */
app.use((req, res, next) => {
    const err = new APIError('Not found', 404);
    return next(err);
});


app.use((err, req, res, next) =>
    res.status(err.status).json({
        message: err.isPublic ? err.message : err.status,
        stack: config.env === 'development' ? err.stack : {},
        errors: err.errors
    })
);

process.on("uncaughtException", function (err) {
    console.error(err)
});

module.exports = app;