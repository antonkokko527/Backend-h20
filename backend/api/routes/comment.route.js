const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/comment');
const commentCtlr = require('../controllers/comment.controller');
const voteRoutes = require('./vote.route');

const router = express.Router();

/**
 * GET /
 * Get all comments. Available GET options: skip, size
 *
 * POST /
 * Create new comment
 **/
router.route('/')
    .post(validate(validation.create), commentCtlr.create)
    .get(validate(validation.list), commentCtlr.list);

/**
 * GET /:commentId
 * Read a comment by id
 *
 * PUT /:commentId
 * Update comment
 *
 * DELETE /:commentId
 * Soft delete a comment
 **/
router.route('/:commentId')
    .get(validate(validation.read), commentCtlr.read)
    .put(validate(validation.update), commentCtlr.update)
    .delete(validate(validation.remove), commentCtlr.remove);

// register vote routes
router.use('/:commentId/vote', (req, res, next) => {
    req.votingObject = req.comment;
    next();
}, voteRoutes);

// Middleware to assign req.comment by id
router.param('commentId', commentCtlr.getCommentById);

module.exports = router;
