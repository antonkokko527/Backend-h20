const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/document');
const documentCtrl = require('../controllers/document.controller');
const policy = require('../policies/document.policies');
const PERMISSONS = require('../constants/permissions');

const router = express.Router();

/**
 * GET /documents/all
 * Get all documents. Available GET options: skip, limit, author
 * */
router.route('/').get(validate(validation.list), documentCtrl.list);
router.route('/all').get(validate(validation.list), documentCtrl.list);

/**
 * GET /documents/count
 * Get all documents count.
 * */
router.route('/count').get(validate(validation.count), documentCtrl.count);

/**
 * POST /documents/
 * Create new document
 * */
router.route('/').post(policy.isCreateAllowed, documentCtrl.create);

/**
 * POST /documents/:id/version
 * Add new version for document
 * */
router.route('/:document/version').post(validate(validation.addVersion), policy.isAllowed(PERMISSONS.DOCUMENT), documentCtrl.addVersion);

/**
 * GET /documents/:id
 * Get document by ID with version
 * */
router.route('/:document/version/:version').get(validate(validation.viewVersion), policy.isAllowed(PERMISSONS.READ), documentCtrl.viewVersion);

/**
 * PUT /documents/:id
 * Update document by ID
 * */
router.route('/:document').put(validate(validation.update), policy.isAllowed(PERMISSONS.DOCUMENT), documentCtrl.update);

/**
 * POST /documents/:id/reorder
 * */
router.route('/:document/reorder').post(validate(validation.reorder), policy.isAllowed(PERMISSONS.DOCUMENT), documentCtrl.reorder);

/**
 * DELETE /documents/:id
 * Remove document by id (IF AUTHOR ONLY)
 * */
router.route('/:document').delete(validate(validation.remove), policy.isAllowed(PERMISSONS.DOCUMENT), documentCtrl.remove);

/**
 * GET /documents/:id
 * View document by id
 * */
router.route('/:document').get(validate(validation.view), policy.isAllowed(PERMISSONS.READ), documentCtrl.view);

module.exports = router;
