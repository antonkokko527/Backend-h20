const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/role');
const roleCtrl = require('../controllers/role.controller');
const policy = require('../policies/role.policies');

const router = express.Router();

/**
 * GET /
 * Get all roles. Available GET options: skip, size
 *
 * POST /
 * Create new role
 **/
router.route('/')
    .post(validate(validation.create), policy.isAllowed, roleCtrl.create)
    .get(validate(validation.list), policy.isAllowed, roleCtrl.list);

/**
 * GET /:roleId
 * Read a role by id
 *
 * PUT /:roleId
 * Update role
 *
 * DELETE /:roleId
 * Soft delete a role
 **/
router.route('/:roleId')
    .get(validate(validation.read), policy.isAllowed, roleCtrl.read)
    .put(validate(validation.update), policy.isAllowed, roleCtrl.update)
    .delete(validate(validation.remove), policy.isAllowed, roleCtrl.remove);

// Middleware to assign req.role by id
router.param('roleId', roleCtrl.getRoleById);

module.exports = router;
