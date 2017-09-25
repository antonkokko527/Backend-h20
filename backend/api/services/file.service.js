const slugify = require('limax');
const Promise = require('bluebird');

const APIError = require('../utils/api-error');
const Helpers = require('../utils/helpers');
const File = require('../models/file');
const User = require('../models/user');

const LambdaService = require('../services/lambda.service');
const UtilService = require('../services/util.service');
const TagService = require('../services/tag.service');

const { STATUS } = require('../constants/file');

function updatePreview(fileId, preview) {
    return File
        .findById(fileId)
        .then((file) => {
            if (!file) {
                throw new APIError('Unable to find the requested file.', 404, true);
            }
            if (file.preview == null) {
                file.preview = [];
            }

            const nPreviews = file.preview.length;
            for (let i = 0; i < nPreviews; i += 1) {
                if (file.preview[i].version === preview.version) {
                    file.preview[i] = preview;
                    break;
                }
            }

            return file.save();
        });
}

function addFileToParent(fileParent, file, user) {
    file.parent = fileParent._id;
    file.version = [{ no: 1, id: file.versionId }];

    delete file.versionId;

    if (fileParent.children === null) {
        fileParent.children = [];
    }

    return new File(Object.assign({}, file, {
        tags: TagService.getTags(file.tags, user.username)
    }))
    .save()
    .then((savedFile) => {
        fileParent.children.push(savedFile._id);
        return fileParent
            .save()
            .then(() => savedFile);
    })
    .then((savedFile) => {
        if (savedFile.type === File.Types.File) {
            const lambda = LambdaService.lookupLambda(savedFile.mimeType);
            if (lambda) {
                LambdaService.generatePreview(lambda, savedFile);
            } else {
                if (savedFile.preview == null) {
                    savedFile.preivew = [];
                }
                savedFile.preview.push({
                    status: 'Preview not available'
                });
                return savedFile.save();
            }
        }

        return savedFile;
    })
    .catch((err) => {
        if (err.code === 11000) {
            return Promise.reject(
                new APIError(`The name ${file.name} is already used in this location. Please use a different name.`, 400, true)
            );
        }
        return Promise.reject(err);
    });
}

function formatPath(path) {
    path = path.trim();
    if (!path.startsWith('/')) {
        path = `/${path}`;
    }

    return path;
}

function getAllIdsFromSubdirectories(file, ids = [], files = []) {
    if (file && file.type === File.Types.Directory) {
        return Promise.each(file.children, (child) => {
            if (child.type === File.Types.File) {
                files.push(child);
                ids.push(child._id);
                return Promise.resolve();
            }

            ids.push(child._id);
            return File
                .findOne({ _id: child._id })
                .select('type url children')
                .populate({
                    path: 'children',
                    model: 'File'
                })
                .then(f => getAllIdsFromSubdirectories(f, ids, files));
        })
        .then(() => ({ files, ids }));
    }

    return Promise.resolve({ files, ids });
}

function getFilesCount(fileId, tagsQuery) {
    return File.findOne({
        $and: [tagsQuery, { _id: fileId, status: STATUS.ACTIVE }]
    })
    .select('type children tags status')
    .populate({
        path: 'children',
        match: { status: STATUS.ACTIVE },
        model: 'File'
    })
    .then((file) => {
        let count = file.children.length;

        return Promise.each(file.children, (child) => {
            if (child.type === File.Types.Directory) {
                return getFilesCount(child._id, tagsQuery).then((c) => {
                    count += c;
                }).then(() => (count));
            }

            return 0;
        })
        .then(() => (count));
    });
}

function getQuery(filterName, filterValue) {
    switch (filterName) {
    case 'tags':
        {
            const values = filterValue.split(',').map(str => str.trim());
            return Promise.resolve({ tags: { $all: values } });
        }
    case 'username':
        return User.findOne({ username: filterValue })
            .then((user) => {
                if (!user) {
                    return { createdBy: null };
                }

                return { createdBy: user._id };
            });
    case 'type':
    case 'mimeType':
    default:
        return Promise.resolve({ [filterName]: filterValue });
    }
}

function getSorts(sorts) {
    return sorts.map(sort => sort.split(' '));
}

function create(user, file, path) {
    path = formatPath(path);

    file.createdBy = user.id;
    if (path === '/' && file.name === '/') {
        return new File({
            type: File.Types.Directory,
            name: '/',
            createdBy: user.id,
            path: '/',
            nameSlug: 'root',
            mimeType: File.MimeTypes.Directory,
            children: [],
            tags: [],
            parent: null
        })
        .save()
        .catch((err) => {
            if (err.code === 11000) {
                return Promise.reject(
                    new APIError(`The name ${file.name} is already used in this location. Please use a different name.`, 400, true)
                );
            }
            return Promise.reject(err);
        });
    }

    file.path = path + (path.endsWith('/') ? '' : '/') + slugify(file.name);
    return File
        .findOne({ path })
        .then((fileParent) => {
            if (fileParent !== null) {
                return addFileToParent(fileParent, file, user);
            }

            const { parentPath, directory } = Helpers.getDirectoryNameAndParentPath(path);
            const newFile = {
                type: File.Types.Directory,
                mimeType: File.MimeTypes.Directory,
                name: directory
            };

            return create(user, newFile, parentPath)
                .then(createdParent => addFileToParent(createdParent, file, user));
        });
}

function get(criteria, user, filters = {}, sorts = [], page = 0, size = 10, version = 1) {
    return File
        .findOne(criteria)
        .select('-createdAt -parent -__v -children')
        .lean()
        .populate([{ path: 'createdBy', select: 'firstname lastname role -_id' }])
        .then((file) => {
            if (!file) {
                return Promise.reject(
                    new APIError('Unable to find the requested file. Please check the spelling and try again.', 404, true)
                );
            }
            if (file.type === File.Types.Directory) {
                const promises = Object.keys(filters).map(
                    filterName => getQuery(filterName, filters[filterName])
                );
                promises.push(TagService.getUserAllowedTagQuery(user.id));

                return Promise.all(promises)
                .then((resp) => {
                    const tagQueries = resp.pop();
                    const queries = resp;
                    const conditions = {
                        parent: file._id,
                        status: STATUS.ACTIVE
                    };
                    queries.forEach(query => Object.assign(conditions, query));
                    const where = {
                        $and: [tagQueries, conditions]
                    };

                    return Promise.all([
                        File
                        .find(where)
                        .select('-createdAt -parent -__v')
                        .sort(getSorts(sorts))
                        .skip(page * size)
                        .limit(size)
                        .lean()
                        .populate([{ path: 'createdBy', select: 'firstname lastname role -_id' }]),
                        File.count(where)
                    ]).spread((files, count) =>
                        ({
                            pagination: {
                                total: count,
                                currentPage: page,
                                numPages: Math.ceil(count / size)
                            },
                            files
                        })
                    );
                });
            }

            const nPreviews = file.preview.length;
            for (let i = 0; i < nPreviews; i += 1) {
                if (file.preview[i].version === version) {
                    file.preview = [file.preview[i]];
                    break;
                }
            }

            const nVersions = file.version.length;
            let currentVersion = 1;
            for (let i = 0; i < nVersions; i += 1) {
                if (file.version[i].no > currentVersion) {
                    currentVersion = file.version[i].no;
                }
            }

            file.currentVersion = version;

            return file;
        });
}

function getTotalFileCount(fileId, user) {
    return TagService
        .getUserAllowedTagQuery(user.id)
        .then(tagsQuery => getFilesCount(fileId, tagsQuery));
}

function getFileCounts(fileIds, user) {
    if (!Array.isArray(fileIds)) fileIds = [fileIds];

    const response = {};

    return Promise.each(fileIds,
        fileId => getTotalFileCount(fileId, user).then((count) => {
            response[fileId] = count;
        })).then(() => response);
}

function getByPath(path, user, filters = {}, sorts = [], page = 0, size = 10, version = 1) {
    path = formatPath(path);
    return get({ path, status: STATUS.ACTIVE }, user, filters, sorts, page, size, version);
}

function detailsFromPath(path) {
    path = formatPath(path);

    const segments = path.split('/');
    const nSegments = segments.length;

    const pathSegments = [];
    let currentSegment = '/';

    for (let i = 1; i < nSegments; i += 1) {
        if (i > 1) {
            currentSegment += '/';
        }
        currentSegment += segments[i];
        if (currentSegment !== '//') {
            pathSegments.push(currentSegment);
        }
    }

    if (pathSegments[0] !== '/') {
        pathSegments.push('/');
    }

    return File
        .find({ path: { $in: pathSegments } })
        .select('path name type')
        .then((files) => {
            const response = {};
            const nFiles = files.length;
            for (let i = 0; i < nFiles; i += 1) {
                response[files[i].path] = { name: files[i].name, type: files[i].type };
            }

            return response;
        });
}

// eslint-disable-next-line no-unused-vars
function update(path, updatedFile, user) {
    path = formatPath(path);

    return File
        .findOne({ path })
        .then((file) => {
            if (!file) {
                return Promise.reject(
                    new APIError(`Unable to find the requested file at ${path}. Please check the spelling and try again.`, 404, true)
                );
            }

            // if (updatedFile.url != null) file.url = updatedFile.url;
            if (updatedFile.name != null) file.name = updatedFile.name;
            if (updatedFile.size != null) file.size = updatedFile.size;
            if (updatedFile.tags != null) file.tags = updatedFile.tags;
            if (updatedFile.newVersion != null) {
                file.version.push({
                    no: updatedFile.newVersion,
                    id: updatedFile.versionId
                });

                delete updatedFile.newVersion;
                delete updatedFile.versionId;
            }

            return file.save();
        })
        .then((savedFile) => {
            if (savedFile.type === File.Types.File) {
                const lambda = LambdaService.lookupLambda(savedFile.mimeType);

                if (lambda) {
                    return LambdaService
                        .generatePreview(lambda, savedFile);
                }

                return UtilService.addNewPreview(savedFile, {
                    status: 'Preview not available',
                    type: 'other'
                });
            }

            return savedFile;
        });
}

/**
 * soft deletes file
 * @param {String} path
 * @returns {Number} deleted count
 */
function remove(path) {
    path = formatPath(path);

    return File.findOne({ path })
    .populate({
        path: 'children',
        model: 'File'
    })
    .then((file) => {
        if (!file) {
            return Promise.reject(
                new APIError(`Unable to find the requested file at ${path}. Please check the spelling and try again.`, 404, true)
            );
        }

        return getAllIdsFromSubdirectories(file, [file._id])
        .then((result) => {
            const ids = result.ids;
            const currentId = ids.shift();

            return Promise.all([
                File.update(
                    { _id: { $in: ids } },
                    { $set: { status: STATUS.SUB_DELETED } },
                    { multi: true }
                ),
                File.update({ _id: currentId }, { $set: { status: STATUS.DELETED } })
            ]);
        })
        .then(resp => resp[0].n + resp[1].n);
    });
}

/**
 * restores file and all children
 * @param {String} path
 * @returns {Number} restored count
 */
function restore(path) {
    path = formatPath(path);

    return File.findOne({ path })
    .populate({
        path: 'children',
        model: 'File'
    })
    .then((file) => {
        if (!file) {
            return Promise.reject(
                new APIError(`Unable to find the requested file at ${path}. Please check the spelling and try again.`, 404, true)
            );
        }

        return getAllIdsFromSubdirectories(file, [file._id])
        .then(result =>
            File.update(
                { _id: { $in: result.ids } },
                { $set: { status: STATUS.ACTIVE } },
                { multi: true }
            )
        )
        .then(resp => resp.n);
    });
}

/**
 * renames file name, all children paths
 * @param {String} path
 * @param {String} newName
 * @returns {Number} affected count
*/
function rename(path, newName) {
    path = formatPath(path);

    return Promise.all([
        File.findOne({ path }).populate({ path: 'children', model: 'File' }),
        File.findOne({ name: newName })
    ])
    .then((resp) => {
        const file = resp[0];
        if (!file) {
            return Promise.reject(
                new APIError(`Unable to find the requested file at ${path}. Please check the spelling and try again.`, 404, true)
            );
        }

        if (resp[1]) {
            return Promise.reject(
                new APIError(`${newName} is already taken by another file.`, 400, true)
            );
        }

        return getAllIdsFromSubdirectories(file, [file._id], [file])
        .then((result) => {
            const bulk = File.collection.initializeOrderedBulkOp();
            const currentId = result.ids.shift();
            const newPath = file.path.replace(new RegExp(`${file.name}$`), newName);

            bulk.find({ _id: currentId })
            .update({
                $set: {
                    name: newName,
                    path: newPath
                }
            });

            result.ids.forEach((_id, index) => {
                const childPath = result.files[index].path
                    .replace(new RegExp(`^${file.path}`), newPath);
                bulk.find({ _id }).update({ $set: { path: childPath } });
            });

            return new Promise((resolve, reject) => {
                bulk.execute((err, res) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(res);
                });
            });
        })
        .then(bulkResult => bulkResult.nModified);
    });
}

function getFileByShortId(shortId) {
    return File
        .findOne({ shortId, status: STATUS.ACTIVE })
        .then((file) => {
            if (!file) {
                return Promise.reject(
                    new APIError('Unable to find the requested file. Please check the spelling and try again.', 404, true)
                );
            }

            return file;
        });
}

function getOneByPath(path) {
    return File.findOne({
        path: formatPath(path),
        status: STATUS.ACTIVE
    }).then((file) => {
        if (!file) {
            return Promise.reject(
                new APIError('Unable to find the requested file. Please check the spelling and try again.', 404, true)
            );
        }

        return file;
    });
}

module.exports = {
    create,
    get,
    getByPath,
    getOneByPath,
    getFileCounts,
    update,
    restore,
    rename,
    remove,
    detailsFromPath,
    getFileByShortId,
    updatePreview
};
