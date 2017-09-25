const Version = require('../models/version');
const Annotation = require('../models/annotation');
const APIError = require('../utils/api-error');
const logger = require('../../config/logger').instance;

/**
 * Convert options.from and options.to
 * OR options.page into valid mongo projection splice arguments
 * @param options {Object}
 * @param options.from {number}
 * @param options.to {number}
 * @param options.page {number}
 * @returns Array
 * */
function getSliceOptions(options) {
    let result = [0, 1];
    if (typeof options.page !== 'undefined') {
        result = [options.page - 1, 1];
    } else if (options.from && options.to) {
        const skip = options.from > 0 ? options.from - 1 : 0;
        const limit = (options.to - options.from) + 1;
        result = [skip, limit];
    }
    return result;
}

/**
 * Create parsed html document
 * @param data {Object}
 * @param data.date {string} - version date
 * @param data.author {string} - author mongo objectId
 * @param data.pages {Array} - array with pages (as strings)
 * @param data.head {string} - parsed document head
 * @param data.url {string} - url to original document (PDF for example)
 * @param data.title {string} - title for this version of document
 * @param data.date {string} - date for this version of document
 * @param data.document {string} - document id which version belongs to
 * @param data.number {number} - human readable version number
 * @returns Promise
 **/
function create(data) {
    const number = data.number ? data.number : 1;
    const version = new Version({
        number,
        url: data.url,
        title: data.title,
        date: data.date,
        head: data.head,
        author: data.author,
        pages: data.pages,
        pagesCount: data.pages.length,
        document: data.document
    });

    return version.save();
}

/**
 * Set 'document' field for existing Version
 * @param _id {string} - ObjectId of the Version
 * @param document {string} - ObjectId of the document which version belongs to
 * @returns Promise
 **/
function assignToDocument(_id, document) {
    return Version.findOneAndUpdate({ _id }, { document }, { new: true })
    .then((doc) => {
        if (!doc) {
            logger.warn(`Failed to add document field to version ${_id}`);
            throw new APIError('Failed to update version', 500, false);
        }

        return doc;
    });
}

/**
 * Get version by ID
 * @param _id {string} - (mongo ObjectId) of your document version
 * @param options {Object}
 * @param options.from  {number}- get pages starting from
 * @param options.to {number}- get pages to
 * @param options.page {number}- get specific page
 * @returns Promise
 * */
function viewById(_id, options) {
    const sliceOptions = getSliceOptions(options);
    return Version.findOne({ _id })
    .slice('pages', sliceOptions)
    .populate('author', '-password')
    .lean()
    .then((version) => {
        if (!version) {
            logger.warn(`Document ${_id} not found`);
            throw new APIError('Version not found', 404, true);
        }
        return version;
    });
}

/**
 * Get version by document ID and version number
 * @param data {Object}
 * @param data.document {string} - (mongo ObjectId) of your document
 * @param data.number {number} - number of your document version
 * @param options {Object}
 * @param options.from  {number}- get pages starting from
 * @param options.to {number}- get pages to
 * @param options.page {number}- get specific page
 * @returns Promise
 * */
function view(data, options) {
    const sliceOptions = getSliceOptions(options);
    const { document } = data;
    let { number } = data;
    if (!number) number = 1;
    return Version.findOne({ document, number })
    .slice('pages', sliceOptions)
    .populate('author', '-password')
    .lean()
    .then((version) => {
        if (!version) {
            logger.warn('Document version not found', data);
            throw new APIError('Version not found', 404, true);
        }

        return version;
    });
}

/**
 * Delete Versions by IDs array
 * @param ids {Array}
 * @returns Promise
 * */
function deleteByIds(ids) {
    return Version.deleteMany({
        _id: { $in: ids }
    });
}

/**
 * Update version number in annotations assigned to Version
 * @param version {string} - Version mongodb Object id
 * @param versionNumber {number} - new number of the version
 * @returns Promise
 * */
function updateNumberInAnnotations(version, versionNumber) {
    return Annotation.update({ version }, { versionNumber }, { multi: true });
}

module.exports = {
    create,
    updateNumberInAnnotations,
    deleteByIds,
    assignToDocument,
    viewById,
    view
};
