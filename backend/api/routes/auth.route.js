'use strict';

const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/auth');
const authCtrl = require('../controllers/auth.controller');

const router = express.Router();

/**
 * POST /auth/login
 * Returns token if correct username and password is provided
 * */
router.route('/login').post(validate(validation.login), authCtrl.login);

module.exports = router;
