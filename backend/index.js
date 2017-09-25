const mongoose = require('mongoose');

const config = require('./config/config');
const app = require('./config/express');

const logger = require('./config/logger').instance;

mongoose.Promise = require('bluebird');

mongoose.connect(config.mongoURL);
mongoose.set('debug', true);
mongoose.connection.on('error', () => {
    throw new Error(`Unable to connect to database: ${config.mongoURL}`);
});

// print mongoose logs in dev env
if (config.mongooseDebug) {
    mongoose.set('debug', (collectionName, method, query, doc) => {
        console.log(`${collectionName}.${method}`, query);
    });
}

//Required for mocha
if (!module.parent) {
    app.listen(config.port, () => {
        console.log(`Server started on port ${config.port} (${config.env})`);
    });
}

module.exports = app;
