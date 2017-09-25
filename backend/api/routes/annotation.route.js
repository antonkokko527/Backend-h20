const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/annotation');
const annotationCtrl = require('../controllers/annotation.controller');
const policy = require('../policies/document.policies');
const PERMISSONS = require('../constants/permissions');

const router = express.Router();

/**
 * GET :version/annotations/
 * Get all document annotations. Available GET options: skip, limit, author
 * */
router.route('/:document/version/:version/annotations/').get(validate(validation.list), policy.isAllowed(PERMISSONS.READ), annotationCtrl.list);
router.route('/:document/version/:version/annotations/all').get(validate(validation.list), policy.isAllowed(PERMISSONS.READ), annotationCtrl.list);

/**
 * POST :version/annotations/
 * Create new annotation
 * */
router.route('/:document/version/:version/annotations').post(validate(validation.create), policy.isAllowed(PERMISSONS.ANNOTATION), annotationCtrl.create);

/**
 * GET :version/annotations/:id
 * Get annotation by ID
 * */
router.route('/:document/version/:version/annotations/:id').get(validate(validation.view), policy.isAllowed(PERMISSONS.READ), annotationCtrl.view);

/**
 * DELETE :version/annotations/:id
 * Remove annotation by id (IF AUTHOR ONLY)
 * */
router.route('/:document/version/:version/annotations/:id').delete(validate(validation.remove), policy.isAllowed(PERMISSONS.ANNOTATION), annotationCtrl.remove);

/**
 * PUT :version/annotations/:id
 * Update annotation by id (IF AUTHOR ONLY)
 * */
router.route('/:document/version/:version/annotations/:id').put(validate(validation.update), policy.isAllowed(PERMISSONS.ANNOTATION), policy.isChangingPublic, annotationCtrl.update);

module.exports = router;
