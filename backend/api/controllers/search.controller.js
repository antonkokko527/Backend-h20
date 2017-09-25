const Logger = require('../../config/logger');
const APIError = require('../utils/api-error');

const UserService = require('../services/user.service');

const AnnotationService = require('../services/annotation.service');
const DocumentService = require('../services/document.service');

const logger = Logger.instance;

/**
 * Search in all document versions
 * @param req
 * @param res
 * @param next
 * @returns {*}
 * */
function documentSearch(req, res, next) {
    const { document, versionNumber } = req.params;
    const { size, page, q, order } = req.query;
    let { from } = req.query;

    if (page) from = page > 1 ? size * (page - 1) : 0;

    DocumentService.search(document, versionNumber, null, q, from, size, order)
    .then(response => res.json(response))
    .catch((err) => {
        logger.error({ err }, 'ES query failed');
        const error = new APIError('Query failed', 500, true);
        return next(error);
    });
}
/**
 * Search in all document versions by author login
 * @param req
 * @param res
 * @param next
 * @returns {*}
 * */
function documentSearchByAuthor(req, res, next) {
    const { document, versionNumber, author } = req.params;
    const { size, page, q, order } = req.query;
    let { from } = req.query;

    if (page) from = page > 1 ? size * (page - 1) : 0;

    UserService
    .findByUsername(author)
    .then((user) => {
        DocumentService
        .search(document, versionNumber, user._id.toString(), q, from, size, order)
        .then(response => res.json(response))
        .catch((err) => {
            logger.error({ err }, 'ES query failed');
            const error = new APIError('Query failed', 500, true);
            return next(error);
        });
    }).catch(next);
}

/**
 * Search in all annotations of the version
 * @param req
 * @param res
 * @param next
 * @returns {*}
 * */
function annotationsSearch(req, res, next) {
    const { document, versionNumber } = req.params;
    const { q, size, page, from, order } = req.query;

    AnnotationService.searchAnnotation(
        document,
        versionNumber,
        req.user.data,
        q,
        page,
        from,
        size,
        order
    )
    .then(hits => res.json(hits))
    .catch((err) => {
        logger.error({ err }, 'ES query failed');
        const error = new APIError('Query failed', 500, true);
        return next(error);
    });
}

/**
 * Search in all version annotations by author login
 * @param req
 * @param res
 * @param next
 * @returns {*}
 * */
function annotationsSearchByAuthor(req, res, next) {
    const { document, versionNumber, author } = req.params;
    const { size, page, q, order } = req.query;
    let { from } = req.query;
    if (page) from = page > 1 ? size * (page - 1) : 0;

    UserService.findByUsername(author).then((user) => {
        AnnotationService.searchAnnotation(
            document,
            versionNumber,
            user,
            q,
            page,
            from,
            size,
            order
        )
        .then(hits => res.json(hits))
        .catch((err) => {
            logger.error({ err }, 'ES query failed');
            const error = new APIError('Query failed', 500, true);
            return next(error);
        });
    }).catch(next);
}

module.exports = {
    documentSearch,
    annotationsSearch,
    annotationsSearchByAuthor,
    documentSearchByAuthor
};
