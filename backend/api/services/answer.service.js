const Promise = require('bluebird');
const Answer = require('../models/answer');

const EsQA = require('../models/elasticsearch/qa');
const User = require('../models/user');
const Question = require('../models/question');

const CONSTANTS = require('../constants/answer');

const APIError = require('../utils/api-error');
const Helpers = require('../utils/helpers');
const RealTimeNotification = require('../services/realtime-notification.service');

const ANSWER_POPULATE = [{
    path: 'votes', select: 'type user'
}, {
    path: 'answeredBy', select: 'firstname lastname _id username'
}];

function getQuery(filterName, filterValue) {
    switch (filterName) {
    case 'username':
        return User.findOne({ username: filterValue })
            .then((user) => {
                if (!user) {
                    return { answeredBy: null };
                }

                return { answeredBy: user._id };
            });
    default:
        return Promise.resolve({ [filterName]: filterValue });
    }
}

function getSorts(sorts) {
    sorts.unshift('createdAt desc');
    sorts.unshift('accepted desc');
    return sorts.map(sort => sort.split(' '));
}

/**
 * @param {Object} data
 * @param {Question} question
 * @param {String} userID
 */
function create(data, question, userId, sessionId) {
    const newAnswer = new Answer(data);
    newAnswer.question = question;
    newAnswer.answeredBy = userId;

    return newAnswer.save()
        .then((answer) => {
            question.answers = question.answers || [];
            question.answers.push(answer);
            return Promise.all([answer, question.save()]);
        })
        .then(resp => resp[0])
        .then((answer) => {
            EsQA.addAnswer(answer);
            RealTimeNotification
                .send(RealTimeNotification.CHANNEL_QUESTION + question._id, {
                    actor: sessionId,
                    on: 'question',
                    questionId: question._id,
                    answerId: answer._id,
                    type: RealTimeNotification.TYPE_ANSWER_CREATED
                });
            return newAnswer;
        });
}

/**
 * @param {Answer} answer
 * @param {Object} data
 */
function update(answer, data, userId, sessionId) {
    Object.assign(answer, data);
    return answer.save()
    .then((updatedAnswer) => {
        EsQA.updateAnswer(updatedAnswer);
        RealTimeNotification
            .send(RealTimeNotification.CHANNEL_QUESTION + answer.question, {
                actor: sessionId,
                on: 'question',
                questionId: answer.question,
                answerId: answer._id,
                type: RealTimeNotification.TYPE_ANSWER_UPDATED
            });
        return this.get(updatedAnswer._id, userId);
    });
}

/**
 * @param {Answer} answer
 */
function remove(answer) {
    return answer.update({ status: CONSTANTS.STATUS.DELETED });
}

/**
 * @param {Number} page
 * @param {Number} size
 * @param {Object} filters
 * @param {Array<String>} sorts
 */
function list(question, filters = {}, sorts = [], page = 0, size = 10, userId) {
    return Promise.all(
        Object.keys(filters).map(
            filterName => getQuery(filterName, filters[filterName])
        )
    )
    .then((queries) => {
        const where = { status: CONSTANTS.STATUS.ACTIVE, question };
        queries.forEach(query => Object.assign(where, query));

        const sortCriteria = getSorts(sorts);
        console.log('sorting criteria', sortCriteria);
        return Promise.all([
            Answer.find(where)
            .sort(sortCriteria)
            .skip(page * size)
            .limit(size)
            .select('-status -__v')
            .populate(ANSWER_POPULATE)
            .lean()
            .then(answers => Promise.map(answers, answer =>
                Helpers.countVotes(answer, { userId }))),
            Answer.count(where)
        ])
        .spread((answers, count) => ({
            pagination: {
                currentPage: page,
                numPages: Math.ceil(count / size),
                total: count
            },
            answers
        }));
    });
}

/**
 * @param {Answer} answer
 * @param {Boolean} accepted
 */
function setAccepted(answer, accepted) {
    return Question.findById(answer.question)
        .then((question) => {
            if (!question) {
                throw new APIError('Invalid request. Please try again', 404, true);
            }

            return Answer.update({
                _id: { $in: question.answers }
            }, {
                $set: { accepted: false }
            }, {
                multi: true
            }).then(() => {
                question.acceptedAnswer = accepted ? answer._id : null;
                return question.save();
            });
        }).then(() => {
            answer.accepted = accepted;
            return answer.save();
        });
}

/**
 * @param {String} id
 */
function get(id, userId) {
    return Answer.findOne({
        _id: id,
        status: CONSTANTS.STATUS.ACTIVE
    })
    .populate(ANSWER_POPULATE)
    .lean()
    .then((answer) => {
        if (!answer) {
            const error = new APIError(`Answer with ${id} not found`, 404, true);
            throw error;
        }
        return Helpers.countVotes(answer, { userId });
    });
}

function getMongooseDoc(id) {
    return Answer.findOne({
        _id: id,
        status: CONSTANTS.STATUS.ACTIVE
    })
    .select('-__v')
    .populate(ANSWER_POPULATE)
    .then((answer) => {
        if (!answer) {
            const error = new APIError(`Answer with ${id} not found`, 404, true);
            throw error;
        }

        return answer;
    });
}

module.exports = {
    create,
    update,
    remove,
    get,
    setAccepted,
    getMongooseDoc,
    list
};
