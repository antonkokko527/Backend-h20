const _ = require('lodash');
const User = require('../models/user');
const Question = require('../models/question');
const File = require('../models/file');
const Document = require('../models/document');
const Version = require('../models/version');
const es = require('../services/elastic-search.service');
const QA = require('../constants/qa');
const PERMISSIONS = require('../constants/permissions');

/**
 * @param {string} userId
 * @returns {Promise<boolean | string[]>}
 */
function getUserAllowedTags(userId) {
    return User.findById(userId)
    .populate([{ path: 'teams', select: 'name' }, { path: 'role', select: 'permissions' }])
    .then((userModel) => {
        const userTags = _.map(userModel.teams, 'name');
        userTags.push(userModel.username);

        if (userModel.role.permissions.indexOf(PERMISSIONS.SYSTEM) > -1) {
            return false;
        }

        return userTags;
    });
}

/**
 * @param {string} userId
 * @returns {Promise<object>}
 */
function getUserAllowedTagQuery(userId) {
    return getUserAllowedTags(userId)
    .then((tags) => {
        if (!tags) return {};

        return {
            $or: tags.map(tag => ({
                tags: tag
            }))
        };
    });
}

/**
 * push new tag if does not exist
 * @param {String[]} originalTags
 * @param {String} newTag
 */
function getTags(originalTags = [], newTag) {
    const tags = originalTags.slice(0);
    if (tags.indexOf(newTag) === -1) {
        tags.push(newTag);
    }
    return tags;
}

/**
 * replace tags on all collections
 * @param {string} oldTag
 * @param {string} newTag
 * @param {Mongoose Model} model
 */
function replaceTagOnColletion(oldTag, newTag, model) {
    const bulk = model.collection.initializeOrderedBulkOp();
    // pulls out new tag if exists already so that it is not duplicated
    bulk.find({ tags: oldTag }).updateOne({ $pull: { tags: newTag } });

    // add new tag into the set
    bulk.find({ tags: oldTag }).updateOne({ $addToSet: { tags: newTag } });

    // pulls out old tag
    bulk.find({ tags: oldTag }).updateOne({ $pull: { tags: oldTag } });
    return bulk.execute();
}

/**
 * replace tags on all collections
 * @param {string} oldTag
 * @param {string} newTag
 */
function replaceTagOnAllCollections(oldTag, newTag) {
    const models = [Question, File, Document, Version];
    return Promise.all(models.map(model => replaceTagOnColletion(oldTag, newTag, model)));
}

/**
 * replace tags on ES
 * @param {string} oldTag
 * @param {string} newTag
 * @param {string} index
 * @param {string} type
 */
function replaceTagsOnES(oldTag, newTag, index, type) {
    return es._perClient(client => client.updateByQuery({
        index,
        type,
        body: {
            query: {
                match: {
                    tags: oldTag
                }
            },
            script: {
                inline: 'ctx._source.tags.add(params.add_tag);ctx._source.tags.remove(ctx._source.tags.indexOf(params.remove_tag));',
                params: {
                    add_tag: newTag,
                    remove_tag: oldTag
                }
            }
        }
    }));
}

/**
 * replace tags on ES
 * @param {string} oldTag
 * @param {string} newTag
 * @param {string} index
 * @param {string} type
 */
function replaceTagsOnAllESIndexes(oldTag, newTag) {
    const indexesWithTags = [QA];
    return Promise.all(
        indexesWithTags.map(ESINDEX =>
            replaceTagsOnES(oldTag, newTag, ESINDEX.INDEX, ESINDEX.TYPE)
        )
    );
}

module.exports = {
    getUserAllowedTagQuery,
    getUserAllowedTags,
    replaceTagsOnAllESIndexes,
    replaceTagsOnES,
    replaceTagOnAllCollections,
    replaceTagOnColletion,
    getTags
};
