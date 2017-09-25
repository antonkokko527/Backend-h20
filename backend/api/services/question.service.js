const Promise = require('bluebird');
const moment = require('moment');
const Question = require('../models/question');
const EsQA = require('../models/elasticsearch/qa');
const User = require('../models/user');
const APIError = require('../utils/api-error');
const Helpers = require('../utils/helpers');
const TagService = require('../services/tag.service');
const RealTimeNotification = require('../services/realtime-notification.service');
const CONSTANTS = require('../constants/question');

const QUESTION_POPULATE = [{
    path: 'askedBy', select: 'firstname lastname _id username'
}, {
    path: 'votes', select: 'type user'
}];

function getQuery(filterName, filterValue) {
    switch (filterName) {
    case 'answer':
        return Promise.resolve({ answers: { $size: filterValue } });
    case 'tags':
        return Promise.resolve({ tags: { $all: filterValue.split(',') } });
    case 'username':
        return User.findOne({ username: filterValue })
            .then((user) => {
                if (!user) {
                    return { askedBy: null };
                }

                return { askedBy: user._id };
            });
    default:
        return Promise.resolve({ [filterName]: filterValue });
    }
}

function getSorts(sorts) {
    sorts.unshift('createdAt desc');
    return sorts.map(sort => sort.split(' '));
}

/**
 * @param {Object} data
 * @param {User} user
 */
function create(data, user, sessionId) {
    const newQuestion = new Question(data);
    newQuestion.askedBy = user.id;
    newQuestion.tags = TagService.getTags(newQuestion.tags, user.username);
    return newQuestion.save()
    .then((question) => {
        EsQA.addQuestion(question);

        RealTimeNotification
            .send(RealTimeNotification.CHANNEL_PUBLIC_QUESTION, {
                actor: sessionId,
                on: 'question',
                questionId: question._id,
                slug: question.slug,
                type: RealTimeNotification.TYPE_QUESTION_CREATED
            });
        return question;
    });
}

/**
 * @param {Question} question
 * @param {Object} data
 */
function update(question, data, userId, sessionId) {
    Object.assign(question, data);
    return question.save()
    .then((updatedQuestion) => {
        EsQA.updateQuestion(updatedQuestion);
        RealTimeNotification
            .send(RealTimeNotification.CHANNEL_QUESTION + question._id, {
                actor: sessionId,
                on: 'question',
                question: question._id,
                type: RealTimeNotification.TYPE_QUESTION_UPDATED
            });

        return this.get(updatedQuestion.slug, userId);
    });
}

/**
 * @param {Question} question
 */
function remove(question) {
    return question.update({ status: CONSTANTS.STATUS.DELETED });
}

/**
 * @param {Number} page
 * @param {Number} size
 * @param {Object} filters
 * @param {Array<String>} sorts
 */
function list(filters = {}, sorts = [], page = 0, size = 10, userId) {
    const promises = Object.keys(filters).map(
        filterName => getQuery(filterName, filters[filterName])
    );
    promises.push(TagService.getUserAllowedTagQuery(userId));

    return Promise.all(promises)
    .then((resp) => {
        const tagQueries = resp.pop();
        const queries = resp;
        const conditions = { status: { $ne: CONSTANTS.STATUS.DELETED } };
        queries.forEach(query => Object.assign(conditions, query));

        const where = {
            $and: [tagQueries, conditions]
        };

        return Promise.all([
            Question.find(where)
            .sort(getSorts(sorts))
            .skip(page * size)
            .limit(size)
            .populate(QUESTION_POPULATE)
            .lean()
            .then(questions =>
                Promise.map(questions, question => Helpers.countVotes(question, { userId }))),
            Question.count(where)
        ])
        .spread((questions, count) => ({
            pagination: {
                currentPage: page,
                numPages: Math.ceil(count / size),
                total: count
            },
            questions
        }));
    });
}

function addView(question) {
    question.views = (question.views || 0) + 1;
    return question.save();
}

/**
 * @param {String} slug
 */
function get(slug, userId) {
    return Question.findOne({
        slug,
        status: { $ne: CONSTANTS.STATUS.DELETED }
    })
    .select('-__v')
    .populate(QUESTION_POPULATE)
    .lean()
    .then(question => Helpers.countVotes(question, { userId }))
    .then((question) => {
        if (!question) {
            const error = new APIError(`Question with ${slug} not found`, 404, true);
            throw error;
        }

        return question;
    });
}

function getMongooseDoc(slug) {
    return Question.findOne({
        slug,
        status: { $ne: CONSTANTS.STATUS.DELETED }
    })
    .select('-__v')
    .populate(QUESTION_POPULATE)
    .then((question) => {
        if (!question) {
            const error = new APIError(`Question with ${slug} not found`, 404, true);
            throw error;
        }

        return question;
    });
}

function updateFeaturedQuestions(duration = 60 * 60 * 24) {
    const yesterday = moment().subtract(duration, 'seconds');
    return Question.update({
        updatedAt: {
            $lt: yesterday.toDate()
        },
        answers: { $size: 0 }
    }, {
        $set: { featured: true }
    }, {
        multi: true
    });
}

module.exports = {
    create,
    update,
    remove,
    get,
    addView,
    getMongooseDoc,
    list,
    updateFeaturedQuestions
};
