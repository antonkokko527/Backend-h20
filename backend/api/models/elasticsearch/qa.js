const es = require('../../services/elastic-search.service');
const moment = require('moment');
const Question = require('../question');
const Answer = require('../answer');
const Vote = require('../vote');
const APIError = require('../../utils/api-error');
const QA = require('../../constants/qa');

/**
 * @param {String} refId
 * @returns {Number} result.downVotes
 * @returns {Number} result.upVotes
 */
function getVoteCounts(refId) {
    return Vote.aggregate([
        {
            $match: { votingObject: refId }
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]).then((resp) => {
        const result = {
            upVotes: 0,
            downVotes: 0
        };
        Object.keys(resp).forEach((key) => {
            if (resp[key]._id === 1) {
                result.upVotes = resp[key].count;
            } else if (resp[key]._id === -1) {
                result.downVotes = resp[key].count;
            }
        });
        return result;
    });
}

/**
 * @param {String} questionID
 * @returns {String} qa.mongoDbId
 * @returns {String} qa.author
 * @returns {String} qa.title
 * @returns {String} qa.description
 * @returns {Array<String>} qa.tags
 * @returns {Number} qa.downVotes
 * @returns {Number} qa.upVotes
 * @returns {Number} qa.answerCount
 * @returns {'question'|'answer'} qa.type
 * @returns {/YYYY-MM-DD/} qa.timestamp
 */
function prepareQuestion(questionID) {
    return Promise.all([
        Question.findById(questionID).populate({ path: 'askedBy' }),
        getVoteCounts(questionID)
    ])
    .then((resp) => {
        const [question, voteCounts] = resp;
        if (!question) {
            throw new APIError('Question not found', 404, true);
        }

        return {
            mongoDbId: questionID,
            author: question.askedBy.username,
            title: question.text,
            description: question.description,
            tags: question.tags,
            downVotes: voteCounts.downVotes,
            upVotes: voteCounts.upVotes,
            answerCount: question.answers.length,
            type: 'question',
            timestamp: moment().format('YYYY-MM-DD')
        };
    });
}

/**
 * @param {String} answerID
 * @returns {String} qa.mongoDbId
 * @returns {String} qa.author
 * @returns {String} qa.title
 * @returns {String} qa.description
 * @returns {Array<String>} qa.tags
 * @returns {Number} qa.downVotes
 * @returns {Number} qa.upVotes
 * @returns {Number} qa.answerCount
 * @returns {'question'|'answer'} qa.type
 * @returns {/YYYY-MM-DD/} qa.timestamp
 */
function prepareAnswer(answerID) {
    return Promise.all([
        Answer.findById(answerID)
            .populate({ path: 'answeredBy' })
            .populate({ path: 'question' }),
        getVoteCounts(answerID)
    ])
    .then((resp) => {
        const [answer, voteCounts] = resp;
        if (!answer) {
            throw new APIError('Answer not found', 404, true);
        }

        return {
            mongoDbId: answerID,
            author: answer.answeredBy.username,
            title: answer.question.text,
            description: answer.text,
            tags: answer.question.tags, // use same tags as question
            downVotes: voteCounts.downVotes,
            upVotes: voteCounts.upVotes,
            answerCount: answer.question.answers.length,
            type: 'answer',
            timestamp: moment().format('YYYY-MM-DD')
        };
    });
}

function addQuestion(question) {
    return prepareQuestion(question._id)
    .then((qa) => {
        const query = es.bulkQuery(QA.INDEX, QA.TYPE);
        query.create(qa.mongoDbId, qa);
        return es.execBulk(query.value());
    });
}

function updateQuestion(question, changeAnswers = true) {
    const promises = [prepareQuestion(question._id)];

    if (changeAnswers) {
        (question.answers || []).forEach((answer) => {
            promises.push(prepareAnswer(answer));
        });
    }

    return Promise.all(promises)
    .then((resp) => {
        const query = es.bulkQuery(QA.INDEX, QA.TYPE);
        resp.forEach((qa) => {
            query.update(qa.mongoDbId, qa);
        });
        return es.execBulk(query.value());
    });
}

function addAnswer(answer) {
    return Question.findById(answer.question)
    .then((question) => {
        if (!question) {
            throw new APIError('Question not found', 404, true);
        }

        const promises = (question.answers || []).map(a => prepareAnswer(a));
        promises.push(prepareQuestion(question._id));
        return Promise.all(promises);
    })
    .then((resp) => {
        const query = es.bulkQuery(QA.INDEX, QA.TYPE);
        resp.forEach((qa) => {
            if (answer._id.equals(qa.mongoDbId)) {
                query.create(qa.mongoDbId, qa);
            } else {
                query.update(qa.mongoDbId, qa);
            }
        });
        return es.execBulk(query.value());
    });
}

function updateAnswer(answer) {
    return prepareAnswer(answer._id)
    .then((qa) => {
        const query = es.bulkQuery(QA.INDEX, QA.TYPE);
        query.update(qa.mongoDbId, qa);
        return es.execBulk(query.value());
    });
}

module.exports = {
    addQuestion,
    addAnswer,
    updateQuestion,
    updateAnswer
};
