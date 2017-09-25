const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/file');
const fileCtrl = require('../controllers/file.controller');
const policy = require('../policies/file.policies');
const PERMISSONS = require('../constants/permissions');

const router = express.Router();

router.route('/search')
    .get(validate(validation.search), fileCtrl.search);

router.route('/details/*')
    .get(validate(validation.details), policy.isAllowed(PERMISSONS.READ), fileCtrl.details);

router.route('/restore/*')
    .patch(validate(validation.restore), policy.isAllowed(PERMISSONS.WRITE), fileCtrl.restore);

router.route('/rename/*')
    .patch(validate(validation.rename), policy.isAllowed(PERMISSONS.WRITE), fileCtrl.rename);

router.route('/count')
    .get(validate(validation.fileCount), fileCtrl.fileCount);

module.exports = router;
