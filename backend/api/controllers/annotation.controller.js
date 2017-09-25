const AnnotationService = require('../services/annotation.service');
const ESAnnotation = require('../models/elasticsearch/annotation');

/**
 * Create new annotation for document version and send it to ES
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function create(req, res, next) {
    AnnotationService.addToVersion({
        document: req.params.document,
        number: req.params.version
    }, {
        content: req.body.content,
        files: req.body.files,
        highlights: req.body.highlights,
        selectionText: req.body.selectionText,
        author: req.user.data.id,
        page: req.body.page,
        color: req.body.color
    }, req.user.data).then((annotation) => {
        res.json({ annotation });
        ESAnnotation.add(annotation);
    }).catch(next);
}

/**
 * Get annotation by id
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function view(req, res, next) {
    AnnotationService
    .view(req.params.id)
    .then(annotation => res.json({ annotation }))
    .catch(next);
}

/**
 * Remove your annotation by id
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function remove(req, res, next) {
    AnnotationService.remove(req.params.id, req.user.data.id)
    .then((annotation) => {
        res.json({ annotation });
        ESAnnotation.remove(req.params.id);
    }).catch(next);
}

/**
 * Update your annotation by id
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function update(req, res, next) {
    AnnotationService.updateItem(req.params.id, req.user.data.id, req.body, req.body.files)
    .then((annotation) => {
        res.json({ annotation });

        const data = { content: req.body.content };

        if (typeof req.body.public !== 'undefined') {
            data.public = req.body.public;
        }

        ESAnnotation.update(req.params.id, data);
    }).catch(next);
}

/**
 * Get annotations list
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function list(req, res, next) {
    AnnotationService.list({
        versionNumber: req.params.version, document: req.params.document
    }, {
        author: req.query.author,
        skip: req.query.skip,
        limit: req.query.limit,
        page: req.query.page,
        pageFrom: req.query.pageFrom,
        pageTo: req.query.pageTo
    }, req.user.data)
    .then(annotations => res.json(annotations))
    .catch(next);
}

module.exports = {
    create,
    view,
    remove,
    update,
    list
};
