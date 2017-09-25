const limax = require('limax');

/**
 * Generates unique slug
 * @param {Mongoose Model} model
 * @param { String } slugField slug name field to search slug
 * @param { String } value string value to convert into slug
 */
function generateSlug(model, value, slugField = 'slug') {
    const slug = limax(value);
    return model.count({ [slugField]: new RegExp(`^${slug}`, 'i') })
        .then(count => (count ? `${slug}-${count}` : slug));
}

module.exports = generateSlug;
