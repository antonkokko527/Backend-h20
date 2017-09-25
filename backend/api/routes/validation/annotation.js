const Joi = require('joi');

const MONGO_OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const validator = {
    create: {
        body: {
            content: Joi.string().required(),
            page: Joi.number().required(),
            highlights: Joi.string().required(),
            selectionText: Joi.string().required(),
            color: Joi.string()
        },
        params: {
            version: Joi.number().positive().required(),
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    view: {
        params: {
            id: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    remove: {
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required(),
            id: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required(),
            version: Joi.number().positive().required()
        }
    },
    update: {
        body: {
            content: Joi.string(),
            public: Joi.boolean().optional()
        },
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required(),
            id: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required(),
            version: Joi.number().positive().required()
        }
    },
    list: {
        params: {
            version: Joi.number().positive().required(),
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        },
        query: {
            author: Joi.string(),
            page: Joi.number().positive(),
            pageFrom: Joi.number().positive(),
            pageTo: Joi.number().positive(),
            skip: Joi.number().min(0).default(0),
            limit: Joi.number().min(0).default(25)
        }
    }
};

module.exports = validator;
