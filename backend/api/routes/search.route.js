const express = require('express');
const validate = require('express-validation');
const validation = require('./validation/search');
const searchController = require('../controllers/search.controller');

const router = express.Router();

/* GET search in document version */
router.route('/documents/:document/version/:versionNumber').get(validate(validation.versionSearch), searchController.documentSearch);
/* GET search in all document versions */
router.route('/documents/:document').get(validate(validation.documentSearch), searchController.documentSearch);
/* GET search in all documents */
router.route('/documents').get(validate(validation.documentsAllSearch), searchController.documentSearch);
/* GET search in document annotations*/
router.route('/documents/:document/annotations').get(validate(validation.annotationsSearch), searchController.annotationsSearch);
/* GET search annotations in document version*/
router.route('/documents/:document/version/:versionNumber/annotations').get(validate(validation.versionAnnotationsSearch), searchController.annotationsSearch);
/* GET search in all documents with specific author*/
router.route('/author/:author/documents').get(validate(validation.searchByAuthor), searchController.documentSearchByAuthor);
/* GET search in all author's annotations */
router.route('/author/:author/documents/annotations').get(validate(validation.searchByAuthor), searchController.annotationsSearchByAuthor);

module.exports = router;
