const CONSTANTS = require('../constants/team');

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const teamSchema = new Schema({
    name: { type: String, required: true, unique: true },
    members: [{ type: Schema.ObjectId, ref: 'User' }],
    status: {
        type: String,
        enum: Object.values(CONSTANTS.STATUS),
        default: CONSTANTS.STATUS.ACTIVE
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
