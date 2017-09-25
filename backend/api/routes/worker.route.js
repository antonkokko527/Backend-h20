const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/question');
const questionCtlr = require('../controllers/question.controller');
const policy = require('../policies/worker.policies');

const router = express.Router();

router.route('/update-featured-questions')
    .post(
        validate(validation.updateFeaturedQuestions),
        policy.isAllowed,
        questionCtlr.updateFeaturedQuestions
    );

module.exports = router;
