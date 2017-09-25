const express = require('express');
const validate = require('express-validation');

const router = express.Router();

const validation = require('./validation/upload');
const uploadCtrl = require('../controllers/upload.controller');

router.route('/getS3UploadCredentials').post(validate(validation.getS3UploadCredentials), uploadCtrl.getS3UploadCredentials);

module.exports = router;
