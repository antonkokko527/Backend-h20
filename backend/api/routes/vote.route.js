const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/vote');
const voteCtlr = require('../controllers/vote.controller');

const router = express.Router();

/**
 * GET /upvote
 * Upvote an object
 */
router.route('/up')
    .post(validate(validation.up), voteCtlr.upvote);

/**
 * GET /downvote
 * Downvote an object
 */
router.route('/down')
    .post(validate(validation.down), voteCtlr.downvote);

/**
 * GET /downvote
 * Downvote an object
 */
router.route('/remove')
    .post(validate(validation.remove), voteCtlr.remove);


module.exports = router;
