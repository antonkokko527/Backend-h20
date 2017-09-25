const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const voteSchema = new Schema({
    votingObject: { type: Schema.ObjectId },
    type: { type: Number, enum: [-1, 1], default: 1 },
    user: { type: Schema.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Vote', voteSchema);
