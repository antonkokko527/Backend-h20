const mongoose = require('mongoose');
const slugify = require('limax');
const shorten = require('../services/shorten.service');
const CONSTANTS = require('../constants/file');

const Schema = mongoose.Schema;

const fileSchema = new Schema({
    type: {
        type: String,
        enum: ['FILE', 'DIRECTORY'],
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    shortId: {
        type: String,
        unique: true
    },
    url: { type: String, required: false },
    path: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nameSlug: { type: String },
    mimeType: String,
    size: Number,
    tags: [String],
    storageKey: String,
    version: [{ no: Number, id: String }],
    parent: {
        type: Schema.ObjectId,
        ref: 'File'
    },
    preview: [{
        url: { type: String },
        type: { type: String, enum: ['pdf', 'image', 'video', 'other'] },
        status: String,
        version: Number
    }],
    status: {
        type: String,
        enum: Object.values(CONSTANTS.STATUS),
        default: CONSTANTS.STATUS.ACTIVE
    },
    comments: [{ type: Schema.ObjectId, ref: 'Comment' }],
    children: [{
        type: Schema.ObjectId,
        ref: 'File'
    }]
}, {
    timestamps: true
});

// eslint-disable-next-line func-names
fileSchema.pre('save', function (next) {
    this.nameSlug = slugify(this.name);
    if (this.shortId) {
        return next();
    }
    return shorten.getShortId()
    .then((shortid) => {
        this.shortId = shortid;
        next();
    });
});

module.exports = mongoose.model('File', fileSchema);
module.exports.Types = {
    File: 'FILE',
    Directory: 'DIRECTORY'
};
module.exports.MimeTypes = {
    Directory: 'inode/directory'
};
