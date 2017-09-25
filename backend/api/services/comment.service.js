const _ = require('lodash');
const Promise = require('bluebird');

const Comment = require('../models/comment');
const Question = require('../models/question');
const Answer = require('../models/answer');


const APIError = require('../utils/api-error');
const Helpers = require('../utils/helpers');
const RealTimeNotification = require('../services/realtime-notification.service');

const CONSTANTS = require('../constants/comment');

const COMMENT_POPULATE = [{
    path: 'votes', select: 'type user'
}, {
    path: 'commentedBy', select: 'firstname lastname _id username'
}];

function getCommentingObjectType(commentingObject) {
    if (commentingObject.answers != null) {
        return Promise.resolve({
            questionId: commentingObject._id,
            on: 'question'
        });
    }

    return Promise.resolve({
        questionId: commentingObject.question,
        on: 'answer',
        answerId: commentingObject._id
    });
}

function sendCommentUpdatedRealtimeNotification(sessionId, commentId, commentingObjectId) {
    return Question
        .findById(commentingObjectId)
        .then((question) => {
            if (question != null) return question;
            return Answer.findById(commentingObjectId);
        })
        .then(commenthingObject => getCommentingObjectType(commenthingObject))
        .then((commentingObjectType) => {
            RealTimeNotification
                    .send(RealTimeNotification.CHANNEL_QUESTION + commentingObjectType.questionId,
                        _.extend(commentingObjectType, {
                            actor: sessionId,
                            commentId,
                            type: RealTimeNotification.TYPE_COMMENT_UPDATED
                        }));
        });
}

/**
 * @param {Object} data
 * @param {Mongoose Model Instance} commentingObject
 * @param {String} userId
 */
function create(data, commentingObject, userId, sessionId) {
    const newComment = new Comment(Object.assign({}, data, {
        commentedBy: userId,
        commentingObject
    }));

    return newComment.save()
    .then((comment) => {
        Object.assign(commentingObject, {
            comments: commentingObject.comments || []
        });
        commentingObject.comments.push(comment);

        getCommentingObjectType(commentingObject)
            .then((commentingObjectType) => {
                RealTimeNotification
                    .send(RealTimeNotification.CHANNEL_QUESTION + commentingObjectType.questionId,
                        _.extend(commentingObjectType, {
                            actor: sessionId,
                            commentId: newComment._id,
                            type: RealTimeNotification.TYPE_COMMENT_CREATED
                        }));
            });
        return Promise.all([comment, commentingObject.save()]);
    })
    .then(resp => resp[0]);
}

/**
 * @param {Comment} comment
 * @param {Object} data
 */
function update(comment, data, userId, sessionId) {
    Object.assign(comment, data);
    return comment
        .save()
        .then(() => {
            sendCommentUpdatedRealtimeNotification(
                sessionId, comment._id, comment.commentingObject);
            return this.get(comment._id, userId);
        });
}

/**
 * @param {Comment} comment
 */
function remove(comment) {
    return comment.update({ status: CONSTANTS.STATUS.DELETED });
}

function list(commentingObject, page = 0, size = 10, userId) {
    const where = {
        commentingObject,
        status: CONSTANTS.STATUS.ACTIVE
    };

    return Promise.all([
        Comment.find(where)
        .skip(page * size)
        .limit(size)
        .sort([['createdAt', 'desc']])
        .select('-status -__v')
        .populate(COMMENT_POPULATE)
        .lean()
        .then(comments =>
            Promise.map(comments, comment => Helpers.countVotes(comment, { userId }))),
        Comment.count(where)
    ])
    .spread((comments, count) => ({
        pagination: {
            currentPage: page,
            numPages: Math.ceil(count / size),
            total: count
        },
        comments
    }));
}

/**
 * @param {String} id
 */
function get(id, userId) {
    return Comment.findOne({
        _id: id,
        status: CONSTANTS.STATUS.ACTIVE
    })
    .populate(COMMENT_POPULATE)
    .lean()
    .then((comment) => {
        if (!comment) {
            const error = new APIError(`Comment with ${id} not found`, 404, true);
            throw error;
        }

        return Helpers.countVotes(comment, { userId });
    });
}

function getMongooseDoc(id) {
    return Comment.findOne({
        _id: id,
        status: CONSTANTS.STATUS.ACTIVE
    })
    .select('-__v')
    .populate(COMMENT_POPULATE)
    .then((comment) => {
        if (!comment) {
            const error = new APIError(`Comment with ${id} not found`, 404, true);
            throw error;
        }

        return comment;
    });
}

module.exports = {
    create,
    update,
    remove,
    list,
    get,
    getMongooseDoc
};
