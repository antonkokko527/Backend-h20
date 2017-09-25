const Joi = require('joi');

const MONGO_OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const SORT_REGEX = /^[a-zA-Z0-9_]+\s(asc|desc)$/;

const validator = {
    create: {
        body: {
            firstname: Joi.string().required(),
            lastname: Joi.string().required(),
            username: Joi.string().required(),
            avatar: Joi.string(),
            email: Joi.string().required(),
            password: Joi.string().required(),
            status: Joi.number().integer().min(0).max(2),
            role: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    update: {
        body: {
            firstname: Joi.string(),
            lastname: Joi.string(),
            avatar: Joi.string(),
            status: Joi.number().integer().min(0).max(2),
            role: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID')
        },
        params: {
            username: Joi.string().required()
        }
    },
    read: {
        params: {
            username: Joi.string().required()
        }
    },
    list: {
        query: {
            filters: Joi.object(),
            sorts: Joi.array().items(Joi.string().regex(SORT_REGEX, 'valid sort parameter')),
            page: Joi.number().min(0),
            size: Joi.number().min(0)
        }
    }
};

module.exports = validator;
