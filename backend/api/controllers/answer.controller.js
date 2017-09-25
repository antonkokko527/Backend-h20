const AnswerService = require('../services/answer.service');

function create(req, res, next) {
    return AnswerService.create(req.body, req.question, req.user.data.id, req.user.sessionId)
    .then((answer) => {
        res.json(answer);
    })
    .catch(next);
}

function update(req, res, next) {
    return AnswerService.update(req.answer, req.body, req.user.data.id, req.user.sessionId)
    .then((answer) => {
        res.json(answer);
    })
    .catch(next);
}

function remove(req, res, next) {
    return AnswerService.remove(req.answer)
    .then((answer) => {
        res.json(answer);
    })
    .catch(next);
}

function read(req, res) {
    res.json(req.answer);
}

function acceptAnswer(req, res, next) {
    return AnswerService.setAccepted(req.answer, true)
        .then((answer) => {
            res.json(answer);
        }).catch(next);
}

function unacceptAnswer(req, res, next) {
    return AnswerService.setAccepted(req.answer, false)
        .then((answer) => {
            res.json(answer);
        }).catch(next);
}

// @TODO implement searchTerm
function list(req, res, next) {
    AnswerService.list(req.question,
        req.query.filters, req.query.sorts, req.query.page, req.query.size, req.user.data.id)
    .then((result) => {
        res.json(result);
    })
    .catch(next);
}


function getAnswerById(req, res, next, id) {
    if (req.method === 'GET' || req.method === 'get') {
        return AnswerService.get(id, req.user.data.id)
            .then((answer) => {
                req.answer = answer;
                return next();
            })
            .catch(next);
    }

    return AnswerService.getMongooseDoc(id)
    .then((answer) => {
        req.answer = answer;
        return next();
    })
    .catch(next);
}

module.exports = {
    create,
    read,
    list,
    remove,
    update,
    acceptAnswer,
    unacceptAnswer,
    getAnswerById
};
