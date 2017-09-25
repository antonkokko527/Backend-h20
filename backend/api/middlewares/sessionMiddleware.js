function getSessionId(req, res, next) {
    if (req.user) {
        req.user.sessionId = req.header('X-Session-Id');
    }

    next();
}

module.exports = {
    getSessionId
};
