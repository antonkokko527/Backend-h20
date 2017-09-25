const PAGES = require('../../constants/version');
const ANNOTATIONS = require('../../constants/annotation');
const es = require('../../services/elastic-search.service');

/**
 * Search in document pages using ElasticSearch
 * @param query {Object}
 * @param query.document {string} - ObjectId of document in which search will be executed
 * @param query.versionNumber {number} - number of document version where search will be executed
 * @param query.content {string} - search query content
 * @param query.author {string} - ObjectId of author
 * @param options {Object} - search options like order and pagination parameters
 * @param options.order {string} - sorting order 'asc' or 'desc'
 * @param options.from {number} - how many results should be skipped
 * @param options.size {number} - how many results should be returned from ES
 * @returns {Promise}
 */
function pages(query, options) {
    const { from, size, order } = options;
    const searchConditions = [{ match_phrase_prefix: { content: query.content } }];
    if (query.document) {
        searchConditions.push({ term: { document: query.document } });
    }
    if (query.versionNumber) {
        searchConditions.push({ term: { versionNumber: query.versionNumber } });
    }
    if (query.author) {
        searchConditions.push({ term: { author: query.author } });
    }

    return es.search(PAGES.INDEX, {
        _source: { excludes: ['content'] },
        query: { bool: { must: searchConditions } },
        highlight: { fields: { content: {} } },
        sort: { _score: order }
    }, {
        from,
        size,
        type: PAGES.TYPE
    });
}

/**
 * Search in document annotations using ElasticSearch
 * @param query {Object}
 * @param query.document {string} - ObjectId of the document to which the annotation should belong
 * @param query.versionNumber {string} - ObjectId of a version of the document to
    which the annotation should belong
 * @param query.author {string} - ObjectId of author
 * @param query.page {number} - Annotated page number
 * @param query.content {string} - search query content
 * @param options {Object} - search options like order and pagination parameters
 * @param options.order {string} - sorting order 'asc' or 'desc'
 * @param options.from {number} - how many results should be skipped
 * @param options.size {number} - how many results should be returned from ES
 * @returns {Promise}
 */
function annotations(query, options) {
    const { from, size, order } = options;
    const searchConditions = [{ match_phrase_prefix: { content: query.content } }];
    if (query.document) {
        searchConditions.push({ term: { document: query.document } });
    }
    if (query.versionNumber) {
        searchConditions.push({ term: { versionNumber: query.versionNumber } });
    }
    if (query.page) {
        searchConditions.push({ term: { page: query.page } });
    }
    if (query.author) {
        searchConditions.push({ term: { author: query.author } });
    }
    if (typeof query.public !== 'undefined') {
        searchConditions.push({ term: { public: query.public } });
    }
    if (query.tags) {
        searchConditions.push({ term: {
            tags: query.tags,
            minimum_should_match: 1
        } });
    }

    return es.search(ANNOTATIONS.INDEX, {
        _source: { excludes: ['content'] },
        query: { bool: { must: searchConditions } },
        highlight: { fields: { content: {} } },
        sort: { _score: order }
    }, {
        from,
        size,
        type: ANNOTATIONS.TYPE
    });
}

module.exports = {
    pages,
    annotations
};
