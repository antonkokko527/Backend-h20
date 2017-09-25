const Promise = require('bluebird');

const FileService = require('../services/file.service');
const File = require('../models/file');
const { STATUS } = require('../constants/file');

function create(req, res, next) {
    FileService.create(req.user.data, req.body, req.params['0'])
        .then((file) => {
            res.json(file);
        })
        .catch(next);
}

function read(req, res, next) {
    const { filters, sorts, page, size, version } = req.query;
    FileService.getByPath(req.params['0'], req.user.data, filters, sorts, page, size, version)
    .then(file => res.json(file))
    .catch(next);
}

function readByShortId(req, res, next) {
    const { filters, sorts, page, size } = req.query;
    FileService.get({ shortId: req.params.shortId }, req.user.data, filters, sorts, page, size)
        .then(file => res.json(file))
        .catch(next);
}

function update(req, res, next) {
    FileService.update(req.params['0'], req.body, req.user.data)
        .then((file) => {
            res.json(file);
        })
        .catch(next);
}

function remove(req, res, next) {
    FileService.remove(req.params['0'], req.user.data)
        .then(count => res.json({ deleted: count }))
        .catch(next);
}

function restore(req, res, next) {
    FileService.restore(req.params['0'], req.user.data)
        .then(count => res.json({ restored: count }))
        .catch(next);
}

function rename(req, res, next) {
    FileService.rename(req.params['0'], req.body.name)
        .then(count => res.json({ affected: count }))
        .catch(next);
}

function previewCallback(req, res, next) {
    FileService.updatePreview(req.body._id, {
        url: req.body.url,
        type: req.body.type,
        status: req.body.status,
        version: parseInt(req.body.version, 10)
    }).then(file => res.json(file))
    .catch(next);
}

function search(req, res, next) {
    const page = req.page || 0;
    const size = req.size || 10;

    return File
    .find({
        name: { $regex: new RegExp(req.query.query), $options: 'i' },
        status: STATUS.ACTIVE
    })
    .skip(page * size)
    .limit(size)
    .then((files) => {
        res.json(files);
    })
    .catch(next);
}

function details(req, res, next) {
    return FileService
        .detailsFromPath(req.params['0'])
        .then(response => res.json(response))
        .catch(next);
}

function fileCount(req, res, next) {
    FileService.getFileCounts(req.query.fileId, req.user.data)
        .then(response => res.json(response))
        .catch(next);
}

function shortIdMiddleware(req, res, next) {
    FileService.getFileByShortId(req.params.shortId)
        .then((file) => {
            req.file = file;
            next();
        })
        .catch(next);
}

module.exports = {
    create,
    update,
    read,
    remove,
    restore,
    search,
    details,
    rename,
    fileCount,
    readByShortId,
    previewCallback,
    shortIdMiddleware
};
