const Role = require('../models/role');
const User = require('../models/user');
const APIError = require('../utils/api-error');
const Promise = require('bluebird');

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
    const newRole = new Role(data);
    return newRole.save();
}

/**
 * @param {Role} role
 * @param {Object} data
 */
function update(role, data) {
    Object.assign(role, data);
    return role.save();
}

/**
 * @param {Role} role
 */
function remove(role) {
    return User.update({ role }, { $set: { role: null } })
    .then(() => role.remove());
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
        const where = { };
        queries.forEach(query => Object.assign(where, query));

        return Promise.all([
            Role.find(where)
            .sort(getSorts(sorts))
            .skip(page * size)
            .limit(size)
            .lean(),
            Role.count(where)
        ])
        .spread((roles, count) => ({
            pagination: {
                currentPage: page,
                numPages: Math.ceil(count / size)
            },
            roles
        }));
    });
}

/**
 * @param {ObjectId} id
 */
function get(id) {
    return Role.findById(id)
    .then((role) => {
        if (!role) {
            const error = new APIError('Role not found', 404, true);
            throw error;
        }

        return role;
    });
}

module.exports = {
    create,
    update,
    list,
    remove,
    get
};
