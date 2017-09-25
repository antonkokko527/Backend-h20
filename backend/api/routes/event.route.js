const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/event');
const eventCtrl = require('../controllers/event.controller');

const router = express.Router();

router.route('/')
    .post(validate(validation.create), eventCtrl.create);

module.exports = router;
