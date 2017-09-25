const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const answerSchema = new Schema({
    text: { type: String, required: true },
    question: { type: Schema.ObjectId, ref: 'Question' },
    answeredBy: { type: Schema.ObjectId, ref: 'User' },
    comments: [{ type: Schema.ObjectId, ref: 'Comment' }],
    votes: [{ type: Schema.ObjectId, ref: 'Vote' }],
    accepted: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'DELETED'], default: 'ACTIVE' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Answer', answerSchema);
