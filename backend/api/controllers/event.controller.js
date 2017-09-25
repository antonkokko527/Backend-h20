const ESEvent = require('../models/elasticsearch/event');

function create(req, res, next) {
    ESEvent.create(req.body, req)
    .then(() => {
        res.json({ success: true });
    })
    .catch(next);
}

module.exports = {
    create
};
