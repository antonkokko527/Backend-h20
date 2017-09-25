const Joi = require('joi');

const validator = {
    create: {
        body: {
            sessionId: Joi.string().required(),
            type: Joi.string().required(),
            event: Joi.string().required(),
            content: Joi.string(),
            metadata: Joi.string(),
            callback: Joi.string()
        }
    }
};

module.exports = validator;
