const mongoose = require('mongoose');
const generateSlug = require('../utils/generate-slug');
const CONSTANTS = require('../constants/question');

const Schema = mongoose.Schema;

const questionSchema = new Schema({
    text: { type: String, required: true },
    description: { type: String, required: true },
    answers: [{ type: Schema.ObjectId, ref: 'Answer' }],
    acceptedAnswer: { type: Schema.ObjectId, ref: 'Answer' },
    comments: [{ type: Schema.ObjectId, ref: 'Comment' }],
    votes: [{ type: Schema.ObjectId, ref: 'Vote' }],
    tags: [{ type: String, required: true }],
    askedBy: { type: Schema.ObjectId, ref: 'User' },
    slug: { type: String, unique: true, index: true },
    featured: { type: Boolean, default: false },
    status: {
        type: String,
        enum: Object.values(CONSTANTS.STATUS),
        default: CONSTANTS.STATUS.ACTIVE
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// generates unique slug before saving
questionSchema.pre('save', function preSave(next) {
    if (this.slug) {
        // if slug is already set, slug should remain as it is for SEO
        return next();
    }

    return generateSlug(this.constructor, this.text)
    .then((slug) => {
        this.slug = slug;
        next();
    })
    .catch((err) => {
        next(err);
    });
});

module.exports = mongoose.model('Question', questionSchema);
