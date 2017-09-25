const PermissionService = require('../services/permission.service');
const FileService = require('../services/file.service');
const PERMISSONS = require('../constants/permissions');

function getFile(req) {
    if (req.params.shortId) {
        return FileService.getFileByShortId(req.params.shortId);
    }

    if (req.params[0]) {
        return FileService.getOneByPath(req.params[0]);
    }

    return FileService.getOneByPath('');
}

function isAllowed(permission) {
    return (req, res, next) => {
        getFile(req)
        .then((file) => {
            // if user is exploring root, should allow access regardless of tag
            if (file.path === '/') {
                return PermissionService.hasPermission(req.user.data, permission);
            }

            return PermissionService.checkAccess(file.tags, req.user.data, permission);
        })
        .then(() => {
            next();
        })
        .catch(err => next(err));
    };
}

function isCreateAllowed(req, res, next) {
    return PermissionService.hasPermission(req.user.data, PERMISSONS.WRITE)
    .then(() => {
        next();
    })
    .catch(err => next(err));
}

module.exports = {
    isAllowed,
    isCreateAllowed
};
