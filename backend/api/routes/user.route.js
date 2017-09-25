const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/user');
const userCtlr = require('../controllers/user.controller');
const policy = require('../policies/user.policies');

const router = express.Router();

/**
 * GET /
 * Get all users. Available GET options: skip, size
 *
 * POST /
 * Create new user
 **/
router.route('/')
    .post(validate(validation.create), policy.isAllowed, userCtlr.create)
    .get(validate(validation.list), policy.isAllowed, userCtlr.list);

/**
 * GET /:username
 * Read a user by username
 *
 * PUT /:username
 * Update user
 **/
router.route('/:username')
    .get(validate(validation.read), policy.isAllowed, userCtlr.read)
    .put(validate(validation.update), policy.isAllowed, userCtlr.update);

// Middleware to assign req.user by username
router.param('username', userCtlr.getUserMiddleware);

module.exports = router;
