const _ = require('lodash');
const User = require('../models/user');
const Role = require('../models/role');
const APIError = require('../utils/api-error');
const PERMISSIONS = require('../constants/permissions');

/**
 * @param {User} user
 */
function getPermissions(user) {
    const rolePromise = user.role.permissions ?
        Promise.resolve(user.role) :
        Role.findById(user.role);
    return rolePromise.then(role => role.permissions);
}

/**
 * @param {User} user
 * @param {number} role
 * @returns {Promise<boolean>}
 */
function hasPermission(user, permission) {
    return getPermissions(user)
    .then((permissions) => {
        if (permissions.indexOf(permission) > -1) {
            return Promise.resolve(permissions);
        }

        // grant access if user has system permission
        if (permissions.indexOf(PERMISSIONS.SYSTEM) > -1) {
            return Promise.resolve(permissions);
        }

        const permssionError = new APIError('You have no permission to do this action', 401, true);
        return Promise.reject(permssionError);
    });
}

/**
 * @param {string[]} tags
 * @param {User} user
 * @returns {Promise<boolean>}
 */
function checkAccessWithTags(tags, user) {
    return User.findOne({ username: user.username })
    .populate([{ path: 'teams', select: 'name' }])
    .then((userModel) => {
        const userTags = _.map(userModel.teams, 'name');
        userTags.push(user.username);

        if (_.intersection(tags, userTags).length > 0) {
            return Promise.resolve(true);
        }

        throw new APIError('You have no permission to access', 401, true);
    });
}

/**
 * @param {string[]} tags
 * @param {User} user
 * @param {string} permission
 * @returns {Promise<boolean>}
 */
function checkAccess(tags, user, permission) {
    return hasPermission(user, permission)
    .then((userPermissions) => {
        if (userPermissions.indexOf(PERMISSIONS.SYSTEM) > -1) {
            return Promise.resolve();
        }

        return checkAccessWithTags(tags, user);
    });
}

module.exports = {
    checkAccess,
    getPermissions,
    hasPermission
};
