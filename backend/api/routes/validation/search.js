const Joi = require('joi');

const MONGO_OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const validator = {
    // GET /api/search/documents/59007f12fb6a5043ad97c8cc
    // TODO: Default size ?
    documentSearch: {
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required(),
        },
        query: {
            from: Joi.number().min(0).default(0),
            size: Joi.number().positive().default(10),
            page: Joi.number().positive(),
            order: Joi.string().allow(['asc', 'desc']).default('desc'),
            q: Joi.string().required()
        }
    },
    documentsAllSearch: {
        query: {
            from: Joi.number().min(0).default(0),
            size: Joi.number().min(0).default(25),
            page: Joi.number().positive(),
            order: Joi.string().allow(['asc', 'desc']).default('desc'),
            q: Joi.string().required()
        }
    },
    annotationsSearch: {
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required(),
        },
        query: {
            from: Joi.number().min(0).default(0),
            size: Joi.number().positive().default(10),
            page: Joi.number().positive(),
            order: Joi.string().allow(['asc', 'desc']).default('desc'),
            q: Joi.string().required()
        }
    },
    versionSearch: {
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required(),
            versionNumber: Joi.number().positive().required()
        },
        query: {
            from: Joi.number().min(0).default(0),
            size: Joi.number().positive().default(10),
            page: Joi.number().positive(),
            order: Joi.string().allow(['asc', 'desc']).default('desc'),
            q: Joi.string().required()
        }
    },
    versionAnnotationsSearch: {
        params: {
            versionNumber: Joi.number().positive().required()
        },
        query: {
            from: Joi.number().min(0).default(0),
            size: Joi.number().positive().default(10),
            page: Joi.number().positive(),
            order: Joi.string().allow(['asc', 'desc']).default('desc'),
            q: Joi.string().required()
        }
    },
    searchByAuthor: {
        params: {
            author: Joi.string().required()
        },
        query: {
            from: Joi.number().min(0).default(0),
            size: Joi.number().positive().default(10),
            page: Joi.number().positive(),
            order: Joi.string().allow(['asc', 'desc']).default('desc'),
            q: Joi.string().required()
        }
    } };


module.exports = validator;
