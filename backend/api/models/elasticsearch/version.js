const striptags = require('striptags');
const Entities = require('html-entities').AllHtmlEntities;
const VERSIONS = require('../../constants/version');
const es = require('../../services/elastic-search.service');

const entities = new Entities();

/**
 * Prepare bulk body
 * @param  {Array} rawData.pages - document pages markup
 * @param {Object} rawData.version
 * @param {Object} rawData.document
 * @returns {BulkQueryBuilder}
 * */
function prepareBulkQuery(rawData) {
    const { pages, document, version } = rawData;
    const query = es.bulkQuery(VERSIONS.INDEX, VERSIONS.TYPE);
    pages.forEach((page) => {
        let content = striptags(page.content);
        content = entities.decode(content);
        const body = {
            content,
            pageNumber: page.number,
            versionNumber: version.number,
            version: version._id.toString(),
            document: document._id.toString(),
            author: version.author.toString()
        };
        query.create(page._id, body);
    });
    return query;
}

function prepareExistingPages(versions) {
    const query = es.bulkQuery(VERSIONS.INDEX, VERSIONS.TYPE);
    Object.keys(versions).forEach((version) => {
        versions[version].pages.forEach((page) => {
            let content = striptags(page.content);
            content = entities.decode(content);
            const body = {
                content,
                pageNumber: page.number,
                versionNumber: versions[version].number,
                version: versions[version]._id.toString(),
                document: versions[version].document.toString(),
                author: versions[version].author.toString()
            };
            query.create(page._id, body);
        });
    });

    return query;
}

/**
 * Add version pages to ES
 * @param data {Object}
 * @returns {Promise}
 * */
function add(data) {
    const query = prepareBulkQuery(data);
    return es.execBulk(query.value());
}

function addExisting(versions) {
    const query = prepareExistingPages(versions);
    return es.execBulk(query.value());
}

/**
 * Remove all document versions pages
 * @param document {string} - ObjectId of the document
 * @returns Promise
 * */
function remove(document) {
    return es._perClient(client => client.deleteByQuery({
        index: VERSIONS.INDEX,
        type: VERSIONS.TYPE,
        body: {
            query: {
                term: { document }
            }
        }
    }));
}


module.exports = {
    add,
    addExisting,
    remove
};
