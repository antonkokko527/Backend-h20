const ES = require('../utils/elastic-search');
const config = require('../../config/config');

const esInstance = new ES(
    { host: config.esURL }
);

module.exports = esInstance;
