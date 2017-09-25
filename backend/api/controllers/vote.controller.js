const VoteService = require('../services/vote.service');

function upvote(req, res, next) {
    return VoteService.create(req.user.data.id, req.user.sessionId, req.votingObject, 1)
    .then((vote) => {
        res.json(vote);
    })
    .catch(next);
}

function downvote(req, res, next) {
    return VoteService.create(req.user.data.id, req.user.sessionId, req.votingObject, -1)
    .then((vote) => {
        res.json(vote);
    })
    .catch(next);
}

function remove(req, res, next) {
    return VoteService.remove(req.user.data.id, req.votingObject)
    .then(() => {
        res.json({ success: true });
    })
    .catch(next);
}

module.exports = {
    upvote,
    downvote,
    remove
};
