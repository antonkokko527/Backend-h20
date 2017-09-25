const TeamService = require('../services/team.service');

function create(req, res, next) {
    return TeamService.create(req.body)
    .then((team) => {
        res.json(team);
    })
    .catch(next);
}

function update(req, res, next) {
    return TeamService.update(req.team, req.body)
    .then((team) => {
        res.json(team);
    })
    .catch(next);
}

function remove(req, res, next) {
    return TeamService.remove(req.team)
    .then((team) => {
        res.json(team);
    })
    .catch(next);
}

function read(req, res) {
    res.json(req.team);
}

function list(req, res, next) {
    TeamService.list(
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

function addMember(req, res, next) {
    TeamService.addMember(req.team, req.body.username)
    .then(() => {
        res.json({ success: true });
    })
    .catch(next);
}

function removeMember(req, res, next) {
    TeamService.removeMember(req.team, req.body.username)
    .then(() => {
        res.json({ success: true });
    })
    .catch(next);
}

function getTeamById(req, res, next, slug) {
    return TeamService.get(slug)
    .then((team) => {
        req.team = team;
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
    addMember,
    removeMember,
    getTeamById
};
