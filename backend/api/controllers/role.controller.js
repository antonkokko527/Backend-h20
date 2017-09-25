const RoleService = require('../services/role.service');

function create(req, res, next) {
    return RoleService.create(req.body)
    .then((role) => {
        res.json(role);
    })
    .catch(next);
}

function update(req, res, next) {
    return RoleService.update(req.role, req.body)
    .then((role) => {
        res.json(role);
    })
    .catch(next);
}

function remove(req, res, next) {
    return RoleService.remove(req.role)
    .then((role) => {
        res.json(role);
    })
    .catch(next);
}

function read(req, res) {
    res.json(req.role);
}

function list(req, res, next) {
    RoleService.list(
        req.query.filters,
        req.query.sorts,
        req.query.page,
        req.query.size,
    )
    .then((result) => {
        res.json(result);
    })
    .catch(next);
}

function getRoleById(req, res, next, slug) {
    return RoleService.get(slug)
    .then((role) => {
        req.role = role;
        return next();
    })
    .catch(next);
}

module.exports = {
    create,
    read,
    list,
    update,
    remove,
    getRoleById
};
