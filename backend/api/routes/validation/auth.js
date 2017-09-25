'use strict';

const Joi = require('joi');

const validator = {
    // POST /api/auth/login
    login: {
        body: {
            email: Joi.string().email().required(),
            password: Joi.string().required()
        }
    },
};

module.exports = validator;