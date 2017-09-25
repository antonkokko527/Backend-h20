/**
 * From https://github.com/KunalKapadia/express-mongoose-es6-rest-api/blob/develop/server/helpers/APIError.js
 * with minimum changes
**/

/**
 * @extends Error
 */
class ExtendableError extends Error {
    constructor(message, status, isPublic, errors) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        this.status = status;
        this.errors = errors;
        this.isPublic = isPublic;
        this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
        Error.captureStackTrace(this, this.constructor.name);
    }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIError extends ExtendableError {
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     * @param {boolean} isPublic - Whether the message should be visible to user or not.
     * @param {Array} errors - validation errors array
     */
    constructor(message, status = 500, isPublic = false, errors) {
        super(message, status, isPublic, errors);
    }
}

module.exports = APIError;