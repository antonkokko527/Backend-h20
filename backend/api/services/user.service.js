const _ = require('lodash');
const User = require('../models/user');
const APIError = require('../utils/api-error');
const Promise = require('bluebird');
const { ADMIN_ALLOWED_FIELDS, STATUS }
    = require('../constants/user');

function getQuery(filterName, filterValue) {
    return Promise.resolve({ [filterName]: filterValue });
}

function getSorts(sorts) {
    return sorts.map(sort => sort.split(' '));
}

/**
 * @param {Object} data
 */
function create(data) {
    const newUser = new User(
        _.pick(data, 'email', 'username', 'lastname', 'avatar', 'role', 'status', 'firstname')
    );

    return User.hash(data.password)
    .then((password) => {
        newUser.password = password;
        return newUser.save();
    });
}

/**
 * @param {User} user
 * @param {Object} data
 */
function update(user, data, allowedFields = ADMIN_ALLOWED_FIELDS) {
    const updateData = _.pick(data, ...allowedFields);

    Object.assign(user, updateData);
    return user.save();
}

/**
 * @param {User} user
 */
function remove(user) {
    return user.update({ status: STATUS.DELETED });
}

/**
 * @param {Number} page
 * @param {Number} size
 * @param {Object} filters
 * @param {Array<String>} sorts
 */
function list(filters = {}, sorts = [], page = 0, size = 10) {
    return Promise.all(
        Object.keys(filters).map(
            filterName => getQuery(filterName, filters[filterName])
        )
    )
    .then((queries) => {
        const where = { status: { $ne: STATUS.DELETED } };
        queries.forEach(query => Object.assign(where, query));

        return Promise.all([
            User.find(where)
            .populate([{ path: 'role', select: '_id name permissions' }])
            .sort(getSorts(sorts))
            .skip(page * size)
            .limit(size)
            .lean(),
            User.count(where)
        ])
        .spread((users, count) => ({
            pagination: {
                currentPage: page,
                numPages: Math.ceil(count / size)
            },
            users
        }));
    });
}

/**
 * @param username {string} - user username
 * @returns {Promise}
 **/
function findByUsername(username) {
    return User.findOne({
        username,
        status: {
            $ne: STATUS.DELETED
        }
    })
    .populate([{ path: 'role', select: '_id name permissions' }])
    .then((user) => {
        if (!user) {
            const err = new APIError('User with provided username not found', 401, true);
            throw err;
        }
        return user;
    });
}

module.exports = {
    create,
    update,
    remove,
    list,
    findByUsername
};
