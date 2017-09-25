const express = require('express');
const validate = require('express-validation');
const expressJwt = require('express-jwt');

const validation = require('./validation/question');
const questionCtlr = require('../controllers/question.controller');

const answerRoutes = require('./answer.route');
const commentRoutes = require('./comment.route');
const voteRoutes = require('./vote.route');
const policy = require('../policies/question.policies');
const PERMISSONS = require('../constants/permissions');


const config = require('../../config/config');
const sessionMiddleWare = require('../middlewares/sessionMiddleware');

const authMiddleware = expressJwt({ secret: config.jwtSecret });
const router = express.Router();

router.use(authMiddleware);
router.use(sessionMiddleWare.getSessionId);

/**
 * GET /
 * Get all questions. Available GET options: skip, size
 *
 * POST /
 * Create new question
 **/
router.route('/')
    .post(validate(validation.create), policy.isCreateAllowed, questionCtlr.create)
    .get(validate(validation.list), questionCtlr.list);

/**
 * GET /:questionSlug
 * Read a question by slug
 *
 * PUT /:questionSlug
 * Update question
 *
 * DELETE /:questionSlug
 * Soft delete a question
 **/
router.route('/:questionSlug')
    .get(validate(validation.read), policy.isAllowed(PERMISSONS.READ), questionCtlr.read)
    .put(validate(validation.update), policy.isAllowed(PERMISSONS.QUESTION), questionCtlr.update)
    .delete(
        validate(validation.remove),
        policy.isAllowed(PERMISSONS.QUESTION),
        questionCtlr.remove
    );

router.route('/:questionSlug/viewed')
    .post(
        validate(validation.incrementView),
        policy.isAllowed(PERMISSONS.READ),
        questionCtlr.addView);

// register vote routes
router.use('/:questionSlug/vote', policy.isAllowed(PERMISSONS.VOTE), (req, res, next) => {
    req.votingObject = req.question;
    next();
}, voteRoutes);

// register answer routes
router.use('/:questionSlug/answers', policy.isAllowed(PERMISSONS.READ), answerRoutes);

// register question comment routes
router.use('/:questionSlug/comments', policy.isAllowed(PERMISSONS.COMMENT), (req, res, next) => {
    req.commentingObject = req.question;
    next();
}, commentRoutes);

// Middleware to assign req.question by slug
router.param('questionSlug', questionCtlr.getQuestionBySlug);

module.exports = router;
