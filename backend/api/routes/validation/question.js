const Joi = require('joi');

const SORT_REGEX = /^[a-zA-Z0-9_]+\s(asc|desc)$/;

const validator = {
    create: {
        body: {
            text: Joi.string().required(),
            description: Joi.string().required(),
            tags: Joi.array().items(Joi.string()).optional()
        }
    },
    update: {
        body: {
            text: Joi.string().required(),
            description: Joi.string().required(),
            tags: Joi.array().items(Joi.string()).optional()
        },
        params: {
            questionSlug: Joi.string().required()
        }
    },
    read: {
        params: {
            questionSlug: Joi.string().required()
        }
    },
    remove: {
        params: {
            questionSlug: Joi.string().required()
        }
    },
    updateFeaturedQuestions: {
        body: {
            duration: Joi.number().min(0)
        }
    },
    list: {
        query: {
            filters: Joi.object(),
            sorts: Joi.array().items(Joi.string().regex(SORT_REGEX, 'valid sort parameter')),
            page: Joi.number().min(0),
            size: Joi.number().min(0)
        }
    },
    incrementView: {}
};

module.exports = validator;
