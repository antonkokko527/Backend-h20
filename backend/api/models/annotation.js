const mongoose = require('mongoose');
const URL = require('url');
const config = require('../../config/config');

const Schema = mongoose.Schema;

const fileSchema = new mongoose.Schema({
    key: String,
    filename: String,
    filetype: String,
    url: String,
    size: Number
}, {
    timestamps: true
});

fileSchema.methods.toJSON = function () {
    const object = this.toObject();
    const urlHost = URL.parse(object.url).hostname;
    let _url = object.url;
    _url = _url.replace(urlHost, config.s3[config.s3.annotation.typeName].root_host);

    return {
        filename: object.filename,
        key: object.key,
        url: _url,
        _id: object._id
    };
};

const annotationSchema = new Schema({
    highlights: { type: String },
    content: { type: String },
    files: [fileSchema],
    selectionText: { type: String },
    document: {
        type: Schema.Types.ObjectId, ref: 'Document'
    },
    version: {
        type: Schema.Types.ObjectId, ref: 'Version'
    },
    versionNumber: { type: Number },
    color: { type: String },
    page: { type: Number },
    tags: [{ type: String }],
    public: { type: Boolean, default: false },
    author: {
        type: Schema.Types.ObjectId, ref: 'User'
    }
}, { collection: 'annotations', timestamps: true });

module.exports = mongoose.model('Annotation', annotationSchema);
