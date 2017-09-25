const CommentService = require('../services/comment.service');

function create(req, res, next) {
    CommentService.create(req.body, req.commentingObject, req.user.data.id, req.user.sessionId)
    .then((comment) => {
        res.json(comment);
    })
    .catch(next);
}

function list(req, res, next) {
    CommentService.list(req.commentingObject, req.query.page, req.query.size, req.user.data.id)
    .then((comments) => {
        res.json(comments);
    })
    .catch(next);
}

function update(req, res, next) {
    return CommentService.update(req.comment, req.body, req.user.data.id, req.user.sessionId)
    .then((comment) => {
        res.json(comment);
    })
    .catch(next);
}

function remove(req, res, next) {
    return CommentService.remove(req.comment)
    .then((comment) => {
        res.json(comment);
    })
    .catch(next);
}

function read(req, res) {
    res.json(req.comment);
}

function getCommentById(req, res, next, id) {
    if (req.method === 'GET' || req.method === 'get') {
        return CommentService.get(id, req.user.data.id)
            .then((comment) => {
                req.comment = comment;
                return next();
            })
            .catch(next);
    }

    return CommentService.getMongooseDoc(id)
    .then((comment) => {
        req.comment = comment;
        return next();
    }).catch(next);
}

module.exports = {
    create,
    list,
    read,
    update,
    remove,
    getCommentById
};
