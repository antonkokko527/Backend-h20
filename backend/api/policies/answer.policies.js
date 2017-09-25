const PermissionService = require('../services/permission.service');
const PERMISSONS = require('../constants/permissions');

function isAllowed(permission) {
    return (req, res, next) => {
        if (!req.answer) {
            return next();
        }

        // if answer was asked by user, allow any access
        if (req.user.data.id === req.answer.answeredBy.toString()) {
            return next();
        }

        return PermissionService.hasPermission(req.user.data, permission)
        .then(() => {
            next();
        })
        .catch(err => next(err));
    };
}

function isCreateAllowed(req, res, next) {
    return PermissionService.hasPermission(req.user.data, PERMISSONS.ANSWER)
    .then(() => {
        next();
    })
    .catch(err => next(err));
}

module.exports = {
    isAllowed,
    isCreateAllowed
};
