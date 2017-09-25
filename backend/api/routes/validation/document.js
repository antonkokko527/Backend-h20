const Joi = require('joi');

const MONGO_OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const sortingItemSchema = Joi.object().keys({
    _id: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required(),
    number: Joi.number().required()
});
const validator = {
    // GET /api/documents/14124124
    view: {
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    // GET /api/documents/1EY4U
    viewVersion: {
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required(),
            version: Joi.number().positive()
        },
        query: {
            from: Joi.number().min(0).default(0),
            to: Joi.number().min(0).default(1),
            page: Joi.number().positive()
        }
    },
    // POST /api/documents/124124125/version
    addVersion: {
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    // DELETE /api/documents/143124
    remove: {
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    // PUT /api/documents/124125
    update: {
        body: {
            title: Joi.string().required()
        },
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID').required()
        }
    },
    // GET /api/documents/all
    list: {
        query: {
            author: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID'),
            skip: Joi.number().min(0).default(0),
            limit: Joi.number().min(0).default(10)
        }
    },
    count: {
        query: {
            author: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID')
        }
    },
    reorder: {
        params: {
            document: Joi.string().regex(MONGO_OBJECT_ID_REGEX, 'valid objectID')
        },
        body: {
            items: Joi.array().items(sortingItemSchema)
        }
    }
};

module.exports = validator;
