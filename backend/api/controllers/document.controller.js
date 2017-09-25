const DocumentService = require('../services/document.service');
const ESVersion = require('../models/elasticsearch/version');
const ESAnnotation = require('../models/elasticsearch/annotation');
const Logger = require('../../config/logger');

const logger = Logger.instance;

/**
 * Upload file. Create new document.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function create(req, res, next) {
    DocumentService.prepareDocument(req, res, next)
    .then(data => Promise.all([
        data,
        DocumentService.create({
            author: req.user.data.id,
            title: req.body.title,
            description: req.body.description,
            date: req.body.date,
            pages: data.pages,
            head: data.head
        }, req.user.data.username)
    ]))
    .then((resp) => {
        const data = resp[0];
        const result = resp[1];
        res.json({ document: result.document });
        ESVersion.add({
            version: result.version,
            document: result.document,
            pages: data.pages
        });
    }).catch(next);
}

/**
 * Add new version for document
 * @param req
 * @param res
 * @param next
 * @returns {*}
 * */
function addVersion(req, res, next) {
    DocumentService.prepareDocument(req, res, next)
    .then(data => Promise.all([
        data,
        DocumentService.addVersion(req.params.document, {
            author: req.user.data.id,
            document: req.params.document,
            title: req.body.title,
            date: req.body.date,
            pages: data.pages,
            head: data.head
        })
    ]))
    .then((resp) => {
        const data = resp[0];
        const result = resp[1];
        res.json({ document: result.document });
        ESVersion.add({
            version: result.version,
            document: result.document,
            pages: data.pages
        });
    }).catch(next);
}

/**
 * Get document by id
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function viewVersion(req, res, next) {
    DocumentService.viewVersion({
        document: req.params.document,
        version: req.params.version
    }, {
        version: req.params.version,
        from: req.query.from,
        to: req.query.to,
        page: req.query.page
    })
    .then(document => res.json({ document }))
    .catch(next);
}

/**
 * Update document by id
 * @param req
 * @param res
 * @param next
 * @returns {*}
 * */
function update(req, res, next) {
    DocumentService.updateItem(req.params.document, {
        author: req.user.data.id,
        title: req.body.title
    })
    .then(document => res.json({ document }))
    .catch(next);
}

/**
 * Remove your document by id
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function remove(req, res, next) {
    DocumentService.remove(req.params.document, req.user.data.id)
    .then((document) => {
        res.json({ document });

        ESVersion.remove(document._id.toString())
        .then(logger.info)
        .catch(logger.error);

        ESAnnotation.removeByDocument(document._id.toString())
        .then(logger.info)
        .catch(logger.error);
    })
    .catch(next);
}

/**
 * Get documents list
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function list(req, res, next) {
    DocumentService.list({
        author: req.query.author,
        skip: req.query.skip,
        limit: req.query.limit
    }, req.user.data.id)
    .then(documents => res.json(documents))
    .catch(next);
}

/**
 * Get documents count
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function count(req, res, next) {
    DocumentService.countTotal({ author: req.query.author }, req.user.data.id)
    .then(documentCount => res.json({ count: documentCount }))
    .catch(next);
}

/**
 * Get document without versions population
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function view(req, res, next) {
    DocumentService.view(req.params.document)
    .then(document => res.json({ document }))
    .catch(next);
}

function reorder(req, res, next) {
    DocumentService.reorderVersions(req.params.document, req.body.items)
    .then(document => res.json({ document }))
    .catch(next);
}

module.exports = {
    create,
    view,
    update,
    list,
    remove,
    reorder,
    count,
    addVersion,
    viewVersion
};
