const Joi = require('joi');

const validator = {
    // PUT /api/users/password
    passwordChange: {
        body: {
            password: Joi.string().min(8).max(64).required(),
            newPassword: Joi.string().min(8).max(64).required()
        }
    },
};

module.exports = validator;