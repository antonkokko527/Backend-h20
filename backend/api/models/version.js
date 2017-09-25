const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const versionSchema = new Schema({
    url: { type: String },
    title: { type: String },
    number: { type: Number },
    pages: [{
        number: { type: Number },
        content: { type: String },
        _id: false
    }],
    pagesCount: { type: Number },
    head: { type: String },
    date: { type: Date },
    tags: [{ type: String }],
    document: { type: Schema.Types.ObjectId, ref: 'Document' },
    author: { type: Schema.Types.ObjectId, ref: 'User' }
}, { collection: 'versions', timestamps: true });

module.exports = mongoose.model('Version', versionSchema);
