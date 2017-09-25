const Team = require('../models/team');
const User = require('../models/user');
const APIError = require('../utils/api-error');
const UserService = require('./user.service');
const TagService = require('./tag.service');
const CONSTANTS = require('../constants/team');
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
    const newTeam = new Team(data);
    return newTeam.save();
}

/**
 * @param {Team} team
 * @param {Object} data
 */
function update(team, data) {
    const oldTag = team.name;
    const newTag = data.name;
    Object.assign(team, data);
    return Promise.all([
        team.save(),
        Promise.resolve(oldTag),
        Promise.resolve(newTag)
    ])
    .then((resp) => {
        const updatedTeam = resp[0];
        if (resp[1] !== resp[2]) {
            return Promise.all([
                TagService.replaceTagOnAllCollections(resp[1], resp[2]),
                TagService.replaceTagsOnAllESIndexes(resp[1], resp[2])
            ])
            .then(() => updatedTeam);
        }
        return updatedTeam;
    });
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
        const where = { status: CONSTANTS.STATUS.ACTIVE };
        queries.forEach(query => Object.assign(where, query));

        return Promise.all([
            Team.find(where)
            .sort(getSorts(sorts))
            .skip(page * size)
            .limit(size)
            .lean(),
            Team.count(where)
        ])
        .spread((teams, count) => ({
            pagination: {
                currentPage: page,
                numPages: Math.ceil(count / size)
            },
            teams
        }));
    });
}

/**
 * @param {Team} team
 */
function remove(team) {
    return team.update({ status: CONSTANTS.STATUS.DELETED });
}

/**
 * @param {ObjectId} id
 */
function get(id) {
    return Team.findOne({
        _id: id,
        status: CONSTANTS.STATUS.ACTIVE
    })
    .then((team) => {
        if (!team) {
            const error = new APIError('Team not found', 404, true);
            throw error;
        }

        return team;
    });
}

/**
 * @param {Team} team
 * @param {string} username
 */
function addMember(team, username) {
    return UserService.findByUsername(username)
    .then((user) => {
        team.members = team.members || [];
        team.members.push(user._id);
        user.teams = user.teams || [];
        user.teams.push(team._id);
        return Promise.all([
            team.save(),
            user.save()
        ]);
    });
}

/**
 * @param {Team} team
 * @param {string} username
 */
function removeMember(team, username) {
    return UserService.findByUsername(username)
    .then(user => Promise.all([
        Team.update({ _id: team._id }, { $pullAll: { members: [user._id] } }),
        User.update({ _id: user._id }, { $pullAll: { teams: [team._id] } })
    ]));
}

module.exports = {
    create,
    update,
    list,
    remove,
    get,
    addMember,
    removeMember
};
