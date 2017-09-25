const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/file');
const fileCtrl = require('../controllers/file.controller');

const router = express.Router();

router.route('/done')
    .post(validate(validation.savePreview), fileCtrl.previewCallback);

module.exports = router;
