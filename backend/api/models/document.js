const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * VersionsCount property required to be sure that we'll never assign the same
 * version number for new version
 **/
const documentSchema = new Schema({
    title: { type: String },
    description: { type: String },
    versionsCount: { type: Number, default: 1 },
    versions: [{
        createdAt: { type: Date, default: Date.now },
        pagesCount: { type: Number },
        number: { type: Number },
        _id: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Version'
        }
    }],
    tags: [{ type: String }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { collection: 'documents', timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
