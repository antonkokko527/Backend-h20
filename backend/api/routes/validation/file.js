const _ = require('lodash');
const Joi = require('joi');

const SORT_REGEX = /^[a-zA-Z0-9_]+\s(asc|desc)$/;

const isValidFile = {
    type: Joi.string().allow('FILE', 'DIRECTORY'),
    url: Joi.string(),
    name: Joi.string().required(),
    storageKey: Joi.string(),
    mimeType: Joi.string().optional(),
    size: Joi.number().min(0),
    tags: Joi.array().items(Joi.string())
};

const validator = {
    create: {
        params: {
            0: Joi.string().allow('')
        },
        body: _.extend(isValidFile, { versionId: Joi.string() })
    },
    update: {
        body: _.extend(isValidFile, { newVersion: Joi.number(), versionId: Joi.string() }),
        params: {
            0: Joi.string().allow('')
        }
    },
    read: {
        params: {
            0: Joi.string().allow('')
        },
        query: {
            filters: Joi.object(),
            sorts: Joi.array().items(Joi.string().regex(SORT_REGEX, 'valid sort parameter')),
            page: Joi.number().min(0),
            size: Joi.number().min(0),
            version: Joi.number().min(0)
        }
    },
    remove: {
        params: {
            0: Joi.string().allow('')
        }
    },
    restore: {
        params: {
            0: Joi.string().allow('')
        }
    },
    rename: {
        params: {
            0: Joi.string().allow('')
        },
        body: {
            name: Joi.string().required()
        }
    },
    savePreview: {
        body: {
            _id: Joi.string(),
            url: Joi.string(),
            type: Joi.string(),
            status: Joi.string(),
            version: Joi.string()
        }
    },
    readByShortId: {
        params: {
            shortId: Joi.string().required()
        },
        query: {
            filters: Joi.object(),
            sorts: Joi.array().items(Joi.string().regex(SORT_REGEX, 'valid sort parameter')),
            page: Joi.number().min(0),
            size: Joi.number().min(0)
        }
    },
    search: {
        query: {
            query: Joi.string().required(),
            page: Joi.number().min(0),
            size: Joi.number().min(0)
        }
    },
    details: {
        params: {
            0: Joi.string().allow('')
        }
    },
    fileCount: {
        query: {
            fileId: Joi.alternatives().try([
                Joi.string(),
                Joi.array().items(Joi.string())
            ]).required()
        }
    }
};

module.exports = validator;
