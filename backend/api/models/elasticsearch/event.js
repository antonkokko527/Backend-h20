const shortid = require('shortid');
const _ = require('lodash');
const es = require('../../services/elastic-search.service');
const EVENT = require('../../constants/event');

/**
 * @param {String} event.sessionId
 * @param {String} event.type
 * @param {String} event.event
 * @param {String} event.content
 * @param {String} event.metadata
 * @param {String} event.callback
 * @param {Express Request} req
 */
function create(event, req) {
    const data = _.pick(event, 'user', 'sessionId', 'type', 'eventType', 'event', 'content', 'metadata', 'callback');

    console.log('user', req.user);

    Object.assign(data, {
        // eventType: 'user', // hard coded to user atm. will see if we need system event
        user: req.user.data.username,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().valueOf()
    });

    const query = es.bulkQuery(EVENT.INDEX, EVENT.TYPE);
    query.create(shortid.generate(), data);
    return es.execBulk(query.value());
}

module.exports = {
    create
};
