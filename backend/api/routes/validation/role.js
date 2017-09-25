const Joi = require('joi');

const MONGO_OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const SORT_REGEX = /^[a-zA-Z0-9_]+\s(asc|desc)$/;

const validator = {
    create: {
        body: {
            name: Joi.string().required(),
            permissions: Joi.array().items(Joi.string()).required()
        }
    },
    update: {
        body: {
            name: Joi.string(),
            permissions: Joi.array().items(Joi.string())
        },
        params: {
            roleId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    read: {
        params: {
            roleId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    remove: {
        params: {
            roleId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
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
