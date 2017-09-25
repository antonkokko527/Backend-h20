const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/account');
const userCtrl = require('../controllers/account.controller');

const router = express.Router();

/**
 * POST /account/change-password
 * Change user password
 * */
router.route('/change-password').post(validate(validation.passwordChange), userCtrl.changePassword);

// router.route('/reset-password').post(validate(validation.passwordReset), userCtrl.resetPassword);
module.exports = router;
