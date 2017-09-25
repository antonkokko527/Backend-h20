const async = require('async');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const APIError = require('../utils/api-error');
const logger = require('../../config/logger').instance;
const constants = require('../constants/user');

const Schema = mongoose.Schema;
const { STATUS } = constants;

const userSchema = new Schema({
    firstname: { type: String },
    lastname: { type: String },
    email: { type: String, index: true, unique: true },
    username: { type: String, index: true, unique: true },
    password: { type: String, select: false },
    role: { type: Schema.ObjectId, ref: 'Role' },
    status: {
        type: Number,
        enum: [STATUS.PENDING, STATUS.ACTIVE, STATUS.BLOCKED, STATUS.DELETED],
        default: STATUS.PENDING
    },
    avatar: { type: String },
    teams: [{ type: Schema.ObjectId, ref: 'Team' }]
}, { collection: 'users' });

const SALT_ROUNDS = 10;

/* eslint-disable no-use-before-define */
userSchema.statics = {
    /**
     * Not really login. Just find user by email and password
     * @param email - user email
     * @param password - user plain password
     * @returns Promise
     * */
    login: (email, password) => new Promise((resolve, reject) => {
        userModel.findWithPassword({ email, status: STATUS.ACTIVE }, password).then((user) => {
            resolve(user);
        }).catch(reject);
    }),

    /**
     * Change user password
     * @param _id {string} - user id
     * @param currentPassword {string} - user current password
     * @param newPassword {string} - user new password
     * */
    changePassword: (_id, currentPassword, newPassword) => new Promise((resolve, reject) => {
        async.waterfall([
            (callback) => {
                userModel.findWithPassword({ _id }, currentPassword).then((user) => {
                    callback(null, user);
                }).catch(callback);
            },
            (user, callback) => {
                userModel.hash(newPassword).then((passwordHash) => {
                    callback(null, user._id, passwordHash);
                }).catch(callback);
            },
            (id, password, callback) => {
                userModel.updateOne({ _id: id }, { password }).then((result) => {
                    callback(null, result);
                }).catch(callback);
            }
        ], (err, result) => {
            if (err) return reject(err);
            return resolve(result);
        });
    }),

    /**
     * Find user by criteria and validate password
     * @param criteria {Object} - query object like {_id:"USER_ID", email:"user@mail.com}
     * @param password {string} - current user's password
     * @returns Promise
     * */
    findWithPassword: (criteria, password) => new Promise((resolve, reject) => {
        userModel.findOne(criteria).select('password username email role').populate('role')
        .then((user) => {
            if (!user) {
                logger.warn('User not found. Criteria:', criteria);
                const err = new APIError('User with provided credentials not found', 401, true);
                return reject(err);
            }
            return bcrypt.compare(password, user.password).then((allow) => {
                if (!allow) {
                    logger.warn(`Wrong password for user with email ${user.email}`);
                    const err = new APIError('User with provided credentials not found', 401, true);
                    return reject(err);
                }
                return resolve(user);
            });
        })
        .catch(reject);
    }),

    /**
     * Generate password hash using bcrypt
     * @param password {string}
     * @returns Promise
     * */
    hash: password => new Promise((resolve, reject) => {
        bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
            if (err) {
                return reject(new APIError('Failed to generate hash', 500, false));
            }
            return resolve(hash);
        });
    })
};
/* eslint-enable */

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
