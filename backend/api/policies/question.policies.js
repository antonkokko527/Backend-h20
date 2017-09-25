const PermissionService = require('../services/permission.service');
const PERMISSONS = require('../constants/permissions');
const CONSTANTS = require('../constants/question');

function isAllowed(permission) {
    return (req, res, next) => {
        if (!req.question) {
            return next();
        }

        // if question was asked by user, allow any access
        if (req.user.data.id === req.question.askedBy.toString()) {
            return next();
        }

        // status change can be only done by admin
        // also locked question can be only edited by admin
        if ((req.question.status !== req.body.status &&
            req.body.status) ||
            (req.question.status === CONSTANTS.STATUS.LOCKED
                && permission === PERMISSONS.QUESTION
            )
        ) {
            return PermissionService.hasPermission(req.user.data, PERMISSONS.SYSTEM)
            .then(() => next())
            .catch(err => next(err));
        }

        return PermissionService.checkAccess(req.question.tags, req.user.data, permission)
        .then(() => {
            next();
        })
        .catch(err => next(err));
    };
}

function isCreateAllowed(req, res, next) {
    return PermissionService.hasPermission(req.user.data, PERMISSONS.QUESTION)
    .then(() => {
        next();
    })
    .catch(err => next(err));
}

module.exports = {
    isAllowed,
    isCreateAllowed
};
