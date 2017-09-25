const _ = require('lodash');
const Promise = require('bluebird');

const Vote = require('../models/vote');
const Question = require('../models/question');
const Answer = require('../models/answer');
const Comment = require('../models/comment');

const APIError = require('../utils/api-error');
const Helpers = require('../utils/helpers');
const RealTimeNotification = require('../services/realtime-notification.service');

function getVotingObjectType(votingObject) {
    if (votingObject.answers != null) {
        return Promise.resolve({
            questionId: votingObject._id,
            on: 'question'
        });
    }

    return Promise.resolve({
        questionId: votingObject.question,
        on: 'answer',
        answerId: votingObject._id
    });
}

function getCommentParent(commentingObject) {
    return Comment.findById(commentingObject)
        .then(comment =>
            Question.findById(comment.commentingObject)
                .then((question) => {
                    if (question == null) {
                        return Answer
                            .findById(comment.commentingObject)
                            .then(answer => ({
                                on: 'answer',
                                answerId: answer._id,
                                questionId: answer.question,
                                commentId: comment._id
                            }));
                    }
                    return {
                        on: 'question',
                        questionId: question._id,
                        commentId: comment._id
                    };
                })
        );
}

function sendVoteUpdatedRealtimeNotification(sessionId, votes, votingObject) {
    getVotingObjectType(votingObject)
                    .then((votingObjectType) => {
                        const notification = _.extend(votingObjectType, {
                            actor: sessionId,
                            votes,
                            type: RealTimeNotification.TYPE_VOTE_UPDATED
                        });
                        if (votingObject.commentingObject != null) {
                            return getCommentParent(votingObject)
                                .then((parent) => {
                                    notification.questionId = parent.questionId;
                                    notification.commentId = parent.commentId;
                                    notification.on = parent.on;
                                    if (parent.answerId != null) {
                                        notification.answerId = parent.answerId;
                                    }

                                    return notification;
                                });
                        }
                        return notification;
                    }).then((notification) => {
                        RealTimeNotification.send(
                            RealTimeNotification.CHANNEL_QUESTION + notification.questionId,
                            notification);
                    });
}

/**
 * @param {Mongoose.Types.SchemaId} askedBy
 * @param {Votable} votingObject
 * @returns {Promise}
 */
function remove(askedBy, votingObject) {
    const model = votingObject.constructor;
    return Vote.findOne({
        votingObject: votingObject._id,
        user: askedBy
    })
    .then((vote) => {
        if (!vote) {
            throw new APIError('You did not vote yet', 400, true);
        }

        return Promise.all([
            vote.remove(),
            model.update({ _id: votingObject._id }, { $pullAll: [vote] }, { new: true })
        ]);
    });
}

/**
 * @param {Mongoose.Types.SchemaId} askedBy
 * @param {Votable} votingObject
 * @returns {Promise<Vote>}
 */
function create(askedBy, sessionId, votingObject, type = 1) {
    const newVote = new Vote({ type });
    newVote.votingObject = votingObject;
    newVote.user = askedBy;

    return Vote.findOne({
        votingObject: votingObject._id,
        user: askedBy
    })
    .then((vote) => {
        if (vote) {
            const index = _.findIndex(votingObject.votes, v => v._id.equals(vote._id));
            if (vote.type === type) {
                votingObject.votes.splice(index, 1);
                type = 0;
                return remove(askedBy, votingObject)
                    .then(v => ({ new: false, vote: v }));
            }

            vote.type = type;
            votingObject.votes[index] = vote;

            return vote.save().then(v => ({ new: false, vote: v }));
        }

        return newVote.save().then(v => ({ new: true, vote: v }));
    })
    .then((response) => {
        if (votingObject.votes == null) {
            votingObject.votes = [];
        }

        if (response.new === true) votingObject.votes.push(response.vote);
        return Promise
            .all([response.vote, votingObject.save()])
            .then(() => Helpers.countVotes(votingObject, { votesOnly: true, userVote: type }))
            .then((votes) => {
                sendVoteUpdatedRealtimeNotification(sessionId, votes, votingObject);
                return votes;
            });
    });
}

module.exports = {
    create,
    remove
};
