'use strict';

const elasticsearch = require('elasticsearch');
const config = require('./config');
const client = new elasticsearch.Client({host: config.esURL});

module.exports = client;
