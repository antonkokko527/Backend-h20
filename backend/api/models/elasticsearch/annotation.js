const striptags = require('striptags');
const Entities = require('html-entities').AllHtmlEntities;
const ANNOTATIONS = require('../../constants/annotation');
const es = require('../../services/elastic-search.service');

const entities = new Entities();

/**
 * Prepare annotation object for ES indexing
 * @param annotation {Object}
 * @returns {Object}
 * */
function prepareAnnotation(annotation) {
    return {
        content: entities.encode(striptags(annotation.content)),
        pageNumber: annotation.page,
        versionNumber: annotation.versionNumber,
        highlights: annotation.highlights,
        tags: annotation.tags,
        public: annotation.public,
        annotationId: annotation._id.toString(),
        author: annotation.author.toString(),
        version: annotation.version.toString(),
        document: annotation.document.toString()
    };
}

function prepareBulkQuery(annotations) {
    const query = es.bulkQuery(ANNOTATIONS.INDEX, ANNOTATIONS.TYPE);
    annotations.forEach((annotation) => {
        const body = prepareAnnotation(annotation);
        query.create(annotation._id, body);
    });
    return query;
}

/**
 * Send Annotation model to ES index
 * @param annotation {Object} - Annotation object
 * @returns {Promise}
 * */
function add(annotation) {
    const query = prepareBulkQuery([annotation]);
    return es.execBulk(query.value());
}

/**
 * Remove annotation from ES by mongo ObjectId
 * @param annotationId {string} - ObjectId of the annotation
 * @returns {Promise}
 * */
function remove(annotationId) {
    const query = es.bulkQuery(ANNOTATIONS.INDEX, ANNOTATIONS.TYPE);
    query.remove(annotationId);
    return es.execBulk(query.value());
}

/**
 * Remove document annotations from ES by mongo ObjectId
 * @param document {string} - ObjectId of the document
 * @returns Promise
 * */
function removeByDocument(document) {
    return es._perClient(client => client.deleteByQuery({
        index: ANNOTATIONS.INDEX,
        type: ANNOTATIONS.TYPE,
        body: {
            query: {
                term: { document }
            }
        }
    }));
}

function addExisting(annotations) {
    const query = prepareBulkQuery(annotations);
    return es.execBulk(query.value());
}

/**
 * Update annotation record in ES
 * @param annotationId
 * @param data
 * @returns {undefined}
 * */
function update(annotationId, data) {
    const query = es.bulkQuery(ANNOTATIONS.INDEX, ANNOTATIONS.TYPE);
    query.update(annotationId, {
        content: entities.encode(data.content)
    });
    return es.execBulk(query.value());
}

module.exports = {
    add,
    addExisting,
    remove,
    removeByDocument,
    update
};
