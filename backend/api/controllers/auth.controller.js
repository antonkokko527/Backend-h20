const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const User = require('../models/user');

/**
 * Returns token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function login(req, res, next) {
    User.login(req.body.email, req.body.password)
    .then((user) => {
        const token = jwt.sign({
            data: {
                username: user.username,
                email: user.email,
                role: {
                    permissions: user.role && user.role.permissions,
                    name: user.role && user.role.name
                },
                id: user._id
            }
        }, config.jwtSecret, { expiresIn: config.jwtExp });

        return res.json({
            token,
            user
        });
    }).catch(next);
}

module.exports = {
    login
};
