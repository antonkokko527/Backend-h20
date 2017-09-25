const fs = require('fs');
const os = require('os');
const multer = require('multer');
const Joi = require('joi');
const _ = require('lodash');
const cheerio = require('cheerio');
const Promise = require('bluebird');
const APIError = require('../utils/api-error');
const Logger = require('../../config/logger');
const Version = require('../models/version');
const Annotation = require('../models/annotation');
const Document = require('../models/document');
const VersionService = require('./version.service');
const ESVersion = require('../models/elasticsearch/version');
const ESAnnotation = require('../models/elasticsearch/annotation');
const TagService = require('../services/tag.service');
const ESSearchService = require('../models/elasticsearch/search');

const USER = require('../constants/user');

const logger = Logger.instance;

// @TODO move constants over to config
const ALLOWED_FILES = ['text/html'];
const UPLOAD_PATH = '/h2o/documents/';
const UPLOAD_SIZE_LIMIT = 50 * 1024 * 1024; // 50mb

function fileFilter(req, file, cb) {
    if (file && ALLOWED_FILES.indexOf(file.mimetype) > -1) {
        return cb(null, true);
    }

    return cb(new APIError('Only HTML files allowed', 400, true));
}

const uploader = multer({
    fileFilter,
    dest: os.tmpdir() + UPLOAD_PATH,
    limits: { fileSize: UPLOAD_SIZE_LIMIT }
}).single('htmlDocument');

const documentValidation = Joi.object().keys({
    title: Joi.string().min(3).max(64),
    description: Joi.string().max(512),
    date: Joi.date().iso()
});

/**
 * Upload document to temp folder and return content as string
 * @param req
 * @param res
 * @param next
 * @returns Promise
 * */
function uploadDocument(req, res, next) {
    return new Promise((resolve, reject) => {
        uploader(req, res, (err) => {
            if (err) {
                if (err instanceof APIError) return next(err);
                const error = new APIError('Failed to upload the file', 500, true);
                return reject(error);
            }

            if (!req.file) {
                const error = new APIError('File required', 400, true);
                return reject(error);
            }

            return Joi.validate(req.body, documentValidation, (error) => {
                if (error) {
                    logger.info('Document info validation failed', error);
                    return reject(new APIError('Document info validation failed', 400, true, error.details));
                }

                return fs.readFile(req.file.path, { encoding: 'utf8' }, (fsError, data) => {
                    if (fsError) {
                        return reject(new APIError('Failed to read uploaded file', 500, true));
                    }
                    return resolve(data);
                });
            });
        });
    });
}

/**
 * Split document to pages and header styles
 * @param html {string} - html document content
 * @returns Object
 * */
function splitDocument(html) {
    const $ = cheerio.load(html, { normalizeWhitespace: true });
    const pagesDOM = $('body > div').toArray();
    const pages = pagesDOM.map((page, index) => {
        const number = index + 1;
        return { number, content: $.html(page) };
    });
    const headDOM = $('style').toArray();
    const head = $(headDOM[0]).html();
    return { head, pages };
}

/**
 * Upload document and split into parts
 * @param req
 * @param res
 * @param next
 * @returns Promise
 * */
function prepareDocument(req, res, next) {
    return uploadDocument(req, res, next)
        .then(splitDocument);
}

/**
 * Create new document record
 * @param data.url {string} - document url
 * @param data.author {string} - document author ID
 * @param data.pages {Array} - strings with document pages markup
 * @param data.head {string} - head of uploaded html document
 * @param data.title {string} - title for version
 * @param data.date {string} - date for version
 * @param data.description {string} - description for document
 * @returns Promise
 * */
function create(data, username) {
    return VersionService.create(data)
    .then((version) => {
        const newDoc = new Document({
            tags: [username], // implicitly tagging with username
            title: data.title,
            author: data.author,
            description: data.description,
            date: data.date,
            versions: [{ _id: version._id, pagesCount: version.pagesCount, number: 1 }]
        });
        return Promise.all([
            version,
            newDoc.save()
        ]);
    })
    .then((resp) => {
        const version = resp[0];
        const document = resp[1];
        return VersionService.assignToDocument(version._id, document._id)
        .then(updatedVersion => ({
            document, version: updatedVersion
        }));
    });
}

/**
 * Add new version to existing document
 * 1 step we selects related doc to get new version number
 * 2 step we saving new version in DB
 * 3 add version info to related document
 *
 * @param _id {string} - MongoObjectId of your document
 * @param data {Object}
 * @param data.author {string} - version author ID
 * @param data.pages {Array} - strings with document pages markup
 * @param data.head {string} - head of uploaded html document
 * @param data.title {string} - title for version
 * @param data.date {string} - date for version
 * @param data.description {string}
 * @param data.document {string} - mongo ObjectId which version belongs
 * @param data.number {number}
 * */
function addVersion(_id, data) {
    return Document.findOne({ _id })
    .lean()
    .then((doc) => {
        if (!doc) {
            logger.warn(`Document ${_id} not found`);
            throw new APIError('Document not found', 404, true);
        }

        return doc.versionsCount + 1;
    })
    .then((versionNumber) => {
        data.number = versionNumber;
        return VersionService.create(data);
    })
    .then(version =>
        Document.findByIdAndUpdate(_id, {
            $inc: { versionsCount: 1 },
            $push: {
                versions: {
                    _id: version._id,
                    pagesCount: version.pagesCount,
                    number: version.number
                }
            }
        }, {
            safe: true,
            new: true
        })
        .then(document => ({ document, version }))
    );
}

/**
 * Update document information by ID
 * @param _id {string} - (mongo ObjectId) of your document
 * @param data {Object}
 * @param data.author {string} - document author id
 * @param data.title {string} - document author id
 * @returns Promise
 * */
function updateItem(_id, data) {
    return Document.findOneAndUpdate({ _id, author: data.author }, {
        title: data.title
    }, { new: true })
    .then((doc) => {
        if (!doc) {
            logger.warn(`Document ${_id} not found`);
            throw new APIError('Document not found', 404, true);
        }
        return doc;
    });
}

/**
 * Get document version by documentId and version number
 * @param data {Object}
 * @param data.version {number} - version number
 * @param data.document {string} - (mongo ObjectId) of your document
 * @param options {Object}
 * @param options.version {string}- (mongo ObjectId) of doc. ver.
 * @param options.from {number} - get pages starting from
 * @param options.to {number} - get pages to
 * @param options.page {number} - get specific page
 * @returns Promise
 * */
function viewVersion(data, options) {
    return Document.findOne({ _id: data.document })
    .populate([USER.POPULATE])
    .lean()
    .then((doc) => {
        if (!doc) {
            logger.warn(`Document ${data.document} not found`);
            throw new APIError('Document not found', 404, true);
        }

        return VersionService.view({
            document: data.document,
            number: data.version
        }, options)
        .then((version) => {
            doc.versions = [version];
            return doc;
        });
    });
}

/**
 * Get document
 * @param _id {string} - (mongo ObjectId) of your document
 * @returns Promise
 * */
function view(_id) {
    return Document.findById(_id)
    .populate([USER.POPULATE])
    .lean()
    .then((doc) => {
        if (!doc) {
            logger.warn(`Document ${_id} not found`);
            throw new APIError('Document not found', 404, true);
        }
        const ids = _.map(doc.versions, '_id');
        return Version.find({ _id: { $in: ids } })
        .then((versions) => {
            const indexedVersions = _.keyBy(versions, '_id');
            doc.versions.forEach((version) => {
                version.title = indexedVersions[version._id] ?
                    indexedVersions[version._id].title : '';
                version.date = indexedVersions[version._id] ?
                    indexedVersions[version._id].date : undefined;
            });
            return doc;
        });
    });
}

/**
 * Remove document by ID and author and ALL document versions
 * @param _id {string} - (mongo ObjectId) of document
 * @param author {string} - (mongo ObjectId) of author
 * @returns Promise
 * */
function remove(_id, author) {
    return Document.findOneAndRemove({ _id, author })
    .then((doc) => {
        if (!doc) {
            logger.warn(`Document ${_id} not found`);
            throw new APIError('Document not found', 404, true);
        }

        // If no document versions - just finish
        if (!doc.versions && !doc.versions.length) {
            return doc;
        }

        return VersionService.deleteByIds(doc.versions);
    });
}

/**
 * Documents list
 * @param options {Object} - options like: skip, limit, author
 * @param options.skip {number} - how many records should be skipped
 * @param options.limit {number} - how many records should be returned
 * @param options.author {string} - Author ObjectID
 * @returns Promise
 * */
function list(options, userId) {
    return TagService.getUserAllowedTagQuery(userId)
    .then((tagQueries) => {
        const conditions = {};
        const { author, skip, limit } = options;

        if (author) {
            conditions.author = author;
        }

        const queryObject = { $and: [tagQueries, conditions] };
        const query = Document.find(queryObject);
        if (skip) query.skip(skip);
        if (limit) query.limit(limit);

        return query
        .sort([['createdAt', 'desc']])
        .populate([USER.POPULATE])
        .lean();
    });
}

/**
 * Documents total count
 * @param options {Object}
 * @param options.author {string} - Author ObjectID
 * @returns Promise
 * */
function countTotal(options, userId) {
    return TagService.getUserAllowedTagQuery(userId)
    .then((tagQueries) => {
        const conditions = {};
        if (options.author) conditions.author = options.author;

        const queryObject = { $and: [tagQueries, conditions] };
        return Document.count(queryObject);
    });
}

/**
 * Is version numbers unique for document versions
 * Version numbers should be unique and greater than 0
 * @param data {Array.<Object>} - array of objects like
 *  [{ "_id": "59172c903d4712634832407f", "number": 2 }]
 * @returns boolean
 * */
function isVersionsNumbersValid(data) {
    const uniqueNumbers = _.uniqBy(data, 'number');
    const positive = _.filter(data, versionItem => versionItem.number > 0);
    return uniqueNumbers.length === data.length && positive.length === data.length;
}

/**
 * Update versions information that embed in document
 * @param _id {string} - document id
 * @param data {Array.<Object>} -
    array of objects like [{ "_id": "59172c903d4712634832407f", "number": 2 }]
 * */
function updateVersionsEmbedInfo(_id, data) {
    return Document.findById(_id)
    .then((document) => {
        if (document.versions.length !== data.length) {
            throw new APIError('Document have more versions than you re-ordered', 400, true);
        }

        return document;
    })
    .then((document) => {
        const indexed = _.keyBy(data, '_id');
        _.each(document.versions, (version) => {
            const vid = version._id.toString();
            version.number = indexed[vid].number;
        });
        document.save();
    });
}

/**
 * Update version numbers in document versions
 * @param data {Array.<Object>} -
    array of objects like [{ "_id": "59172c903d4712634832407f", "number": 2 }]
 * @param versions {Array.<Object>} -
    array of objects like [{ "_id": "59172c903d4712634832407f", "number": 2 }]
 * @returns Promise
 * */
function updateVersionsNumbers(versions, data) {
    const indexedById = _.keyBy(data, '_id');
    return Promise.all(
        versions.map((version) => {
            const vid = version._id.toString();
            const number = indexedById[vid].number;
            return Version.findOneAndUpdate({ _id: vid }, { number }, { new: true })
            .then((doc) => {
                if (!doc) {
                    logger.warn(`Failed to change version ${vid}`);
                    throw new APIError('Failed to update version', 500, false);
                }

                return doc;
            });
        })
    );
}

/**
 * Update version numbers in document annotation
 * @param data {Array.<Object>} -
    array of objects like [{ "_id": "59172c903d4712634832407f", "number": 2 }]
 * @param versions {Array.<Object>} -
    array of objects like [{ "_id": "59172c903d4712634832407f", "number": 2 }]
 * @returns Promise
 * */
function updateNumberInVersionsAnnotations(versions, data) {
    const indexedById = _.keyBy(data, '_id');
    return Promise.all([
        versions.map((version) => {
            const vid = version._id.toString();
            const versionNumber = indexedById[vid].number;
            return Annotation.update({ version }, { versionNumber }, { multi: true });
        })
    ]);
}

/**
 * Get updated versions, remove outdated pages , index again
 * @param document {string} - document ID
 * @returns Promise
 * */
function reIndexVersionsPages(document) {
    return Version.find({ document })
    .lean()
    .then((versions) => {
        if (!versions || versions.length < 1) {
            throw new APIError('Document versions not found', 404, true);
        }

        return versions;
    })
    .then(versions =>
        ESVersion.remove(document).then(() => {
            logger.info('Pages removed from ES');
            return versions;
        })
    )
    .then(versions =>
        ESVersion.addExisting(versions).then((result) => {
            logger.info(result, 'Indexing ES results');
            return versions;
        })
    );
}

/**
 * Get updated annotations, remove outdated annotations, index updated annotations again
 * @param document {string} - document ID
 * @returns Promise
 * */
function reIndexDocumentAnnotations(document) {
    return Annotation.find({ document })
    .then((annotations) => {
        if (!annotations || annotations.length < 1) {
            logger.info('Document annotations not found');
            throw new APIError('Document annotations not found', 404, true);
        }
        return annotations;
    })
    .then(annotations =>
        ESAnnotation.removeByDocument(document)
        .then((result) => {
            logger.info(result, 'Annotations removed from ES');
            return annotations;
        })
    )
    .then(annotations =>
        ESAnnotation.addExisting(annotations)
        .then((result) => {
            logger.info(result, 'Indexing ES results');
            return annotations;
        })
    );
}

/**
 * Re-order versions using their ids
 * @param _id {string} - document id which versions belongs to
 * @param data {Array.<Object>} - array of objects like
    [{ "_id": "59172c903d4712634832407f", "number": 2 }]
 * @returns Promise
 * */
function reorderVersions(_id, data) {
    if (!isVersionsNumbersValid(data)) {
        const err = new APIError('Versions numbers should be unique and greater than 0', 400, true);
        return Promise.reject(err);
    }

    return updateVersionsEmbedInfo(_id, data)
    .then(document =>
        updateVersionsNumbers(document.versions, data)
        .then(() => updateNumberInVersionsAnnotations(document.versions, data))
        .then(() => reIndexVersionsPages(document._id.toString()))
        .then(() => reIndexDocumentAnnotations(document._id.toString()))
    );
}

function search(document, versionNumber, userId, content, from, size, order) {
    const query = {
        document,
        versionNumber,
        author: userId,
        content
    };

    if (userId != null) query.author = userId;

    return ESSearchService.pages(query, {
        from,
        size,
        order
    })
    .then((response) => {
        let hits = response[0].hits;
        const total = hits.total;

        hits = hits.hits;

        return Promise.map(hits, hit => ({
            pageNumber: hit._source.pageNumber, content: hit.highlight.content
        })).then(results => ({
            pagination: {
                total,
                size,
                from
            },
            hits: results
        }));
    });
}

module.exports = {
    prepareDocument,
    splitDocument,
    uploadDocument,
    create,
    addVersion,
    updateItem,
    viewVersion,
    view,
    remove,
    list,
    reorderVersions,
    countTotal,
    search
};
