const Promise = require('bluebird');
const ObjectId = require('mongoose').Types.ObjectId;

const Annotation = require('../models/annotation');
const Version = require('../models/version');
const APIError = require('../utils/api-error');
const _ = require('lodash');
const logger = require('../../config/logger').instance;
const TagService = require('../services/tag.service');
const PermissionService = require('../services/permission.service');
const ESSearchService = require('../models/elasticsearch/search');

const PERMISSIONS = require('../constants/permissions');
const USER = require('../constants/user');

function annotationFromIdsMaintainingListOrder(annotationIds) {
    const stack = [];
    const n = annotationIds.length;

    for (let i = n - 1; i > 0; i -= 1) {
        const rec = {
            $cond: [{
                $eq: ['$_id', annotationIds[i - 1]]
            }, i]
        };

        if (stack.length === 0) {
            rec.$cond.push(i + 1);
        } else {
            const lval = stack.pop();
            rec.$cond.push(lval);
        }
        stack.push(rec);
    }

    const pipeline = [
        { $match: { _id: { $in: annotationIds } } }, {
            $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' }
        }, {
            $project: {
                weight: stack[0],
                createdAt: 1,
                author: {
                    firstname: 1,
                    lastname: 1
                },
                content: 1,
                highlights: 1,
                selectionText: 1,
                page: 1,
                files: 1
            }
        }, {
            $unwind: '$author' // $group not necessary since author.length === 1
        }, {
            $sort: { weight: 1 }
        }
    ];

    return Annotation.aggregate(pipeline);
}

/**
 * Get annotation by ID
 * @param _id {string} - (mongo ObjectId) of your annotation
 * @returns Promise
 * */
function view(_id) {
    return Annotation.findById({ _id })
        .populate([USER.POPULATE])
        .then((doc) => {
            if (!doc) {
                logger.warn(`Annotation ${_id} not found`);
                throw new APIError('Annotation not found', 404, true);
            }
            return doc;
        });
}

/**
 * Create new annotation for Document version
 * @param params {Object}
 * @param params.number {number} - number of your document version
 * @param params.document {string} - (mongo ObjectId) of your document version
 * @param data {Object}
 * @param data.page {string} - Version page that annotation belongs
 * @param data.content {string} -  Annotation text
 * @param data.files {FileSchema} - fileSchema (list of files)
 * @param data.color {string} -  Annotation color
 * @param data.author {string} - (mongo ObjectId) Author
 * @param data.highlights {string} - rangy selection
 * @param data.selectionText {string} - annotated text
 * @returns Promise
 * */
function addToVersion(params, data, user) {
    const { number, document } = params;
    return Promise.all([
        TagService.getUserAllowedTags(user.id),
        Version.findOne({ number, document }, { document: 1, number: 1 }).lean()
    ])
    .then((resp) => {
        const tags = resp[0];
        const version = resp[1];

        if (!version) {
            logger.warn(`Attempt to add annotation to version ${version} that does not exists`);
            throw new APIError('Version not found', 400, true);
        }

        return Annotation.create({
            tags: tags || [user.username],
            version: version._id,
            versionNumber: version.number,
            document: version.document,
            files: data.files || [],
            highlights: data.highlights,
            selectionText: data.selectionText,
            content: data.content,
            author: data.author,
            page: data.page,
            color: data.color
        });
    })
    .then(doc => view(doc._id));
}

/**
 * Remove annotation by ID and author
 * @param _id {string} - (mongo ObjectId) of Annotation doc
 * @param author {string} - (mongo ObjectId) of author
 * @returns Promise
 * */
function remove(_id, author) {
    return Annotation.findOneAndRemove({ _id, author })
        .then((doc) => {
            if (!doc) {
                logger.warn(`Annotation ${_id} not found`);
                throw new APIError('Annotation not found', 404, true);
            }

            return doc;
        });
}

/**
 * Update annotation content by ID and author
 * @param _id {string} - (mongo ObjectId) of Annotation doc
 * @param author {string} - (mongo ObjectId) of author
 * @param content {string} - modified content
 * @param newFiles {FileSchema} - modified files
 * @returns Promise
 * */
function updateItem(_id, author, data, newFiles) {
    return Annotation.findOne({ _id })
        .then((doc) => {
            if (!doc) {
                logger.warn(`Annotation ${_id} not found`);
                throw new APIError('Annotation not found', 404, true);
            }

            // @TODO: Modify once file removal functionality is added in UI
            if (newFiles != null) {
                // const existing = doc.files || [];
                // newFiles = !_.isArray(newFiles) ? [newFiles]: newFiles;

                // let difference = _.differenceWith(newFiles, existing, fileComparator);
                // let intersection = _.intersectionWith(newFiles, existing, fileComparator);
                doc.files = doc.files.concat(newFiles);
            }

            if (data.content != null) {
                doc.content = data.content;
            }

            if (typeof data.public !== 'undefined') {
                doc.public = data.public;
            }

            return doc.save();
        });
}

/**
 * Annotations list for document version
 * @param params {Object}
 * @param params.versionNumber {number} - document's version number
 * @param params.document {string} - (mongo ObjectId) of Document
 * @param options {Object} - options like: skip, limit, author
 * @param options.author {string} - filter by author
 * @param options.skip {number} - how many records should be skipped
 * @param options.limit {number} - how many records should be selected
 * @param options.page {number} - For what page annotation should be selected
 * @returns Promise
 * */
function list(params, options, user) {
    const { versionNumber, document } = params;
    const queryObject = { versionNumber, document };
    const { author, skip, page, pageFrom, pageTo } = options;

    if (author) {
        queryObject.author = author;
    }

    if (pageFrom !== undefined && pageTo !== undefined) {
        queryObject.page = { $gte: pageFrom, $lte: pageTo };
    } else if (page !== undefined) {
        queryObject.page = page;
    }

    return PermissionService.hasPermission(user, PERMISSIONS.MODERATOR)
    .catch(() => {
        queryObject.public = true;
    })
    .then(() => TagService.getUserAllowedTagQuery(user.id))
    .then((tagQueries) => {
        const query = Annotation.find({
            $and: [tagQueries, queryObject]
        });
        if (skip) query.skip(skip);

        return query
            .sort([['createdAt', 'desc']])
            .populate([USER.POPULATE])
            .lean()
            .exec((err, annotations) => {
                if (err) {
                    logger.info('Annotations fetch error', err);
                    throw new APIError('Failed to fetch annotations', 500, true);
                }
                annotations = _.groupBy(annotations, 'page');
                return annotations;
            });
    });
}

function searchAnnotation(document, versionNumber, user, content, page, from, size, order) {
    if (page) from = page > 1 ? size * (page - 1) : 0;
    const query = {
        document,
        versionNumber,
        content
    };

    // if (user.id != null) {
    //     query.author = user.id;
    // }

    return PermissionService.hasPermission(user, PERMISSIONS.MODERATOR)
    .catch(() => {
        query.public = true;
    })
    .then(() => TagService.getUserAllowedTags(user.id))
    .then((tags) => {
        if (tags) {
            // it means user is not admin.
            query.tags = tags;
        }

        return ESSearchService.annotations(query, {
            from,
            size,
            order
        });
    })
    .then((response) => {
        let hits = response[0].hits;
        const total = hits.total;

        hits = hits.hits;
        return Promise
            .map(hits, hit => ObjectId(hit._source.annotationId))
            .then(annotationIds => annotationFromIdsMaintainingListOrder(annotationIds)
                .then(annotations => ({
                    pagination: {
                        total,
                        size,
                        from
                    },
                    hits: annotations
                }))
            );
    });
}

module.exports = {
    addToVersion,
    remove,
    view,
    updateItem,
    list,
    searchAnnotation
};
