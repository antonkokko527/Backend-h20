const express = require('express');
const expressJwt = require('express-jwt');
const authRoutes = require('./auth.route');
const annotationRoutes = require('./annotation.route');
const documentRoutes = require('./document.route');
const accountRoutes = require('./account.route');
const searchRoutes = require('./search.route');
const uploadRoutes = require('./upload.route');
const questionRoutes = require('./question.route');
const workerRoutes = require('./worker.route');
const userRoutes = require('./user.route');
const filesRoutes = require('./files.route');
const fileRoutes = require('./file.route');
const fileLambdaRoutes = require('./file.lambda.route');
const fileShortIdRoutes = require('./file.shortid.route');
const eventRoutes = require('./event.route');
const teamRoutes = require('./team.route');
const roleRoutes = require('./role.route');
const config = require('../../config/config');

const router = express.Router();
const authMiddleware = expressJwt({ secret: config.jwtSecret });
// test route
router.get('/health', (req, res) => { res.json({ test: 'success' }); });

// mount auth routes at /auth
router.use('/auth', authRoutes);
// mount account routes like /password-reset etc
router.use('/account', authMiddleware, accountRoutes);
// mount documents routes at /documents
router.use('/documents', authMiddleware, documentRoutes);
// mount annotations routes at /:document/annotations
router.use('/documents', authMiddleware, annotationRoutes);
// mount search routes
router.use('/search', authMiddleware, searchRoutes);
// mount upload routes
router.use('/upload', authMiddleware, uploadRoutes);
// mount question, answers route
router.use('/questions', authMiddleware, questionRoutes);
// mount worker routes
router.use('/workers', authMiddleware, workerRoutes);
// mount file routes
router.use('/f', authMiddleware, fileShortIdRoutes);
router.use('/file', authMiddleware, fileRoutes);
router.use('/files', authMiddleware, filesRoutes);
router.use('/preview', fileLambdaRoutes);
// mount user route
router.use('/users', authMiddleware, userRoutes);

// mount event log route
router.use('/events', authMiddleware, eventRoutes);
// mount team routes
router.use('/teams', authMiddleware, teamRoutes);
// mount team routes
router.use('/roles', authMiddleware, roleRoutes);

module.exports = router;
