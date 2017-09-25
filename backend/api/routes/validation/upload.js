const Joi = require('joi');

const config = require('../../../config/config');

const validator = {
    // GET /api/getS3UploadCredentials
    getS3UploadCredentials: {
        body: {
            filetype: Joi.string().optional(),
            filename: Joi.string().required(),
            for: Joi.string().valid(config.s3.annotation.typeName, config.s3.document.typeName),
            storageKey: Joi.string()
        }
    }
};

module.exports = validator;
