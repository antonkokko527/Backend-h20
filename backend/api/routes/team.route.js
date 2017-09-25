const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/team');
const teamCtrl = require('../controllers/team.controller');
const policy = require('../policies/team.policies');

const router = express.Router();

/**
 * GET /
 * Get all teams. Available GET options: skip, size
 *
 * POST /
 * Create new team
 **/
router.route('/')
    .post(validate(validation.create), policy.isAllowed, teamCtrl.create)
    .get(validate(validation.list), policy.isAllowed, teamCtrl.list);

/**
 * GET /:teamId
 * Read a team by id
 *
 * PUT /:teamId
 * Update team
 *
 * DELETE /:teamId
 * Soft delete a team
 **/
router.route('/:teamId')
    .get(validate(validation.read), policy.isAllowed, teamCtrl.read)
    .put(validate(validation.update), policy.isAllowed, teamCtrl.update)
    .delete(validate(validation.remove), policy.isAllowed, teamCtrl.remove);

/**
 * POST /:teamId/members
 * add a member
 *
 * DELETE /:teamId/members
 * remove a member
 **/
router.route('/:teamId/members')
    .post(validate(validation.addMember), policy.isAllowed, teamCtrl.addMember)
    .delete(validate(validation.removeMember), policy.isAllowed, teamCtrl.removeMember);

// Middleware to assign req.team by id
router.param('teamId', teamCtrl.getTeamById);

module.exports = router;
