const Joi = require('joi');

const MONGO_OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const SORT_REGEX = /^[a-zA-Z0-9_]+\s(asc|desc)$/;

const validator = {
    create: {
        body: {
            name: Joi.string().required()
        }
    },
    update: {
        body: {
            name: Joi.string().required()
        },
        params: {
            teamId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    read: {
        params: {
            teamId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    remove: {
        params: {
            teamId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    addMember: {
        params: {
            teamId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        },
        body: {
            username: Joi.string().required()
        }
    },
    removeMember: {
        params: {
            teamId: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        },
        body: {
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
