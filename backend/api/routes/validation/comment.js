const Joi = require('joi');

const MONGO_OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const validator = {
    create: {
        body: {
            text: Joi.string().required()
        }
    },
    update: {
        body: {
            text: Joi.string().required()
        },
        params: {
            commentId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    read: {
        params: {
            commentId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    remove: {
        params: {
            commentId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    list: {
        query: {
            page: Joi.number().min(0),
            size: Joi.number().min(0)
        }
    }
};

module.exports = validator;
