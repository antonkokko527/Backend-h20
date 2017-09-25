const User = require('../models/user');
const UserService = require('../services/user.service');

function create(req, res, next) {
    UserService.create(req.body, req.user.data)
    .then((user) => {
        res.json(user);
    })
    .catch(next);
}

function update(req, res, next) {
    UserService.update(req.queryUser, req.body)
    .then((user) => {
        res.json(user);
    })
    .catch(next);
}

function read(req, res) {
    res.json(req.queryUser);
}

function list(req, res, next) {
    UserService.list(req.query.filters, req.query.sorts, req.query.page, req.query.size)
    .then((result) => {
        res.json(result);
    })
    .catch(next);
}

function getUserMiddleware(req, res, next, username) {
    UserService.findByUsername(username)
    .then((user) => {
        req.queryUser = user;
        next();
    })
    .catch(next);
}

// get user by username with query & continue even if user does not exist
function getUserByUsernameQuery(req, res, next) {
    const username = req.query.username;

    if (!username) {
        return next();
    }

    return User.findOne({ username })
    .then((user) => {
        if (user) {
            req.queryUser = user;
        }

        next();
    })
    .catch(next);
}

module.exports = {
    create,
    update,
    list,
    read,
    getUserMiddleware,
    getUserByUsernameQuery
};
