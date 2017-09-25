const PermissionService = require('../services/permission.service');
const Document = require('../models/document');
const PERMISSONS = require('../constants/permissions');

function isAllowed(permission) {
    return (req, res, next) => {
        if (req.params.document) {
            return Document.findById(req.params.document)
            .then((document) => {
                if (!document) return next();
                // if document was created by user, allow any access
                if (req.user.data.id === document.author.toString()) {
                    return next();
                }

                return PermissionService.checkAccess(document.tags, req.user.data, permission)
                .then(() => {
                    next();
                });
            })
            .catch(err => next(err));
        }

        return next();
    };
}

function isChangingPublic(req, res, next) {
    if (req.body && typeof req.body.public !== 'undefined') {
        return PermissionService.hasPermission(req.user.data, PERMISSONS.MODERATOR)
        .then(() => next())
        .catch(err => next(err));
    }

    return next();
}

function isCreateAllowed(req, res, next) {
    return PermissionService.hasPermission(req.user.data, PERMISSONS.DOCUMENT)
    .then(() => {
        next();
    })
    .catch(err => next(err));
}

module.exports = {
    isAllowed,
    isChangingPublic,
    isCreateAllowed
};
