const User = require('../models/user');

/**
 * Change user password
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function changePassword(req, res, next) {
    User.changePassword(req.user.data.id, req.body.password, req.body.newPassword)
    .then(() => {
        res.json({ success: true });
    }).catch(next);
}

module.exports = {
    changePassword
};
