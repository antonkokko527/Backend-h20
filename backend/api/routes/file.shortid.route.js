const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/file');
const fileCtrl = require('../controllers/file.controller');
const commentRoutes = require('./comment.route');
const policy = require('../policies/file.policies');
const PERMISSONS = require('../constants/permissions');

const router = express.Router();

router.route('/:shortId')
    .get(
        validate(validation.readByShortId),
        policy.isAllowed(PERMISSONS.READ),
        fileCtrl.readByShortId
    );

router.use('/:shortId/comments',
    fileCtrl.shortIdMiddleware,
    policy.isAllowed(PERMISSONS.COMMENT),
    (req, res, next) => {
        req.commentingObject = req.file;
        next();
    },
    commentRoutes);

module.exports = router;
