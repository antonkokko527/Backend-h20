const PubNub = require('pubnub');
const Promise = require('bluebird');

const config = require('../../config/config');
const logger = require('../../config/logger').instance;

const pubnub = Promise.promisifyAll(new PubNub({
    subscribeKey: config.PubNub.subscribeKey,
    publishKey: config.PubNub.publishKey,
    ssl: true
}));

pubnub.addListener({
    status: (statusEvent) => {
        logger.info('statusEvent', statusEvent);
    },
    message: (message) => {
        logger.info('message', message);
    }
});

function send(channel, message) {
    pubnub.publish({
        message,
        channel,
        sendByPost: true,
        storeInHistory: false
    }, (status, response) => {
        if (status.error) {
            logger.error('Failed to publish notification', status);
        } else {
            logger.info('Successfully published notification', response);
        }
    });
}

module.exports = {
    send,
    CHANNEL_PUBLIC_QUESTION: 'channel_public_questions',
    CHANNEL_QUESTION: 'channel_question_',
    TYPE_QUESTION_CREATED: 'new_question',
    TYPE_QUESTION_UPDATED: 'update_question',
    TYPE_ANSWER_CREATED: 'new_answer',
    TYPE_ANSWER_UPDATED: 'update_answer',
    TYPE_COMMENT_CREATED: 'new_comment',
    TYPE_COMMENT_UPDATED: 'update_comment',
    TYPE_VOTE_UPDATED: 'vote_updated'
};
