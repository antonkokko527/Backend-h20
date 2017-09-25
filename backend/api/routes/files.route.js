const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/file');
const fileCtrl = require('../controllers/file.controller');
const policy = require('../policies/file.policies');
const PERMISSONS = require('../constants/permissions');

const router = express.Router();

router.route('/*')
    .get(validate(validation.read), policy.isAllowed(PERMISSONS.READ), fileCtrl.read)
    .post(validate(validation.create), policy.isCreateAllowed, fileCtrl.create)
    .put(validate(validation.update), policy.isAllowed(PERMISSONS.WRITE), fileCtrl.update)
    .delete(validate(validation.remove), policy.isAllowed(PERMISSONS.WRITE), fileCtrl.remove);

module.exports = router;
