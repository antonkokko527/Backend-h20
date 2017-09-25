const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/answer');
const answerCtlr = require('../controllers/answer.controller');
const userCtlr = require('../controllers/user.controller');

const commentRoutes = require('./comment.route');
const voteRoutes = require('./vote.route');
const policy = require('../policies/answer.policies');
const PERMISSONS = require('../constants/permissions');

const router = express.Router();

/**
 * GET /
 * Get all answers. Available GET options: skip, size
 *
 * POST /
 * Create new answer
 **/
router.route('/')
    .post(validate(validation.create), policy.isCreateAllowed, answerCtlr.create)
    .get(validate(validation.list), userCtlr.getUserByUsernameQuery, answerCtlr.list);

/**
 * GET /:answerId
 * Read a answer by id
 *
 * PUT /:answerId
 * Update answer
 *
 * DELETE /:answerId
 * Soft delete a answer
 **/
router.route('/:answerId')
    .get(validate(validation.read), policy.isAllowed(PERMISSONS.READ), answerCtlr.read)
    .put(validate(validation.update), policy.isAllowed(PERMISSONS.ANSWER), answerCtlr.update)
    .delete(validate(validation.remove), policy.isAllowed(PERMISSONS.ANSWER), answerCtlr.remove);

// register vote routes
router.use('/:answerId/vote', policy.isAllowed(PERMISSONS.VOTE), (req, res, next) => {
    req.votingObject = req.answer;
    next();
}, voteRoutes);

// register answer comment routes
router.use('/:answerId/comment', policy.isAllowed(PERMISSONS.COMMENT), (req, res, next) => {
    req.commentingObject = req.answer;
    next();
}, commentRoutes);

router.route('/:answerId/accept')
    .post(
        validate(validation.accept),
        policy.isAllowed(PERMISSONS.QUESTION),
        answerCtlr.acceptAnswer
    );

router.route('/:answerId/unaccept')
    .post(
        validate(validation.unaccept),
        policy.isAllowed(PERMISSONS.QUESTION),
        answerCtlr.unacceptAnswer
    );


// Middleware to assign req.answer by id
router.param('answerId', answerCtlr.getAnswerById);

module.exports = router;
