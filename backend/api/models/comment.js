const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
    text: { type: String, required: true },
    commentingObject: { type: Schema.ObjectId },
    votes: [{ type: Schema.ObjectId, ref: 'Vote' }],
    commentedBy: { type: Schema.ObjectId, ref: 'User' },
    status: { type: String, enum: ['ACTIVE', 'DELETED'], default: 'ACTIVE' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);
