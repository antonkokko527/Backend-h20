const PermissionService = require('../services/permission.service');
const PERMISSONS = require('../constants/permissions');

function isAllowed(req, res, next) {
    return PermissionService.hasPermission(req.user.data, PERMISSONS.SYSTEM)
    .then(() => {
        next();
    })
    .catch(err => next(err));
}

module.exports = {
    isAllowed
};
