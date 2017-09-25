const StorageService = require('../services/storage.service');

function getS3UploadCredentials(req, res) {
    const s3Credentials = StorageService.generateUploadCredentials(
        req.body.for,
        req.body.filetype,
        req.body.filename,
        req.body.storageKey);

    res.json(s3Credentials);
}

module.exports = { getS3UploadCredentials };
