const QuestionService = require('../services/question.service');

function create(req, res, next) {
    return QuestionService.create(req.body, req.user.data, req.user.sessionId)
    .then((question) => {
        res.json(question);
    })
    .catch(next);
}

function update(req, res, next) {
    return QuestionService.update(req.question, req.body, req.user.data.id, req.user.sessionId)
    .then((question) => {
        res.json(question);
    })
    .catch(next);
}

function addView(req, res, next) {
    return QuestionService.addView(req.question)
        .then(() => res.json({}))
        .catch(next);
}

function remove(req, res, next) {
    return QuestionService.remove(req.question)
    .then((question) => {
        res.json(question);
    })
    .catch(next);
}

function read(req, res) {
    res.json(req.question);
}

function list(req, res, next) {
    QuestionService
        .list(req.query.filters, req.query.sorts, req.query.page, req.query.size, req.user.data.id)
        .then((result) => {
            res.json(result);
        })
        .catch(next);
}

function updateFeaturedQuestions(req, res, next) {
    QuestionService.updateFeaturedQuestions(req.body.duration)
    .then(result => res.json(result))
    .catch(next);
}

function getQuestionBySlug(req, res, next, slug) {
    if (req.method === 'GET' || req.method === 'get') {
        return QuestionService.get(slug, req.user.data.id)
        .then((question) => {
            req.question = question;
            return next();
        })
        .catch(next);
    }

    return QuestionService.getMongooseDoc(slug)
        .then((question) => {
            req.question = question;
            return next();
        })
        .catch(next);
}


module.exports = {
    create,
    read,
    list,
    update,
    remove,
    addView,
    updateFeaturedQuestions,
    getQuestionBySlug
};
