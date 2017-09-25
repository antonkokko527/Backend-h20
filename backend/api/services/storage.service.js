const crypto = require('crypto');
const shortid = require('shortid');
const moment = require('moment');

const config = require('../../config/config');

// eslint-disable-next-line no-unused-vars
function removeFiles(files) {

}

function generateUploadCredentials(type, filetype, name, code) {
    const ext = name.slice(name.lastIndexOf('.'));
    if (code == null || code.trim() === '') {
        // eslint-disable-next-line prefer-template
        code = config.s3[type].uploadDirectory +
        // eslint-disable-next-line prefer-template
            (type === config.s3.document.typeName ? '/' + moment(new Date()).format('DD-MM-YYYY') : '') +
            '/' + shortid.generate() + ext;
    }

    const _d = new Date();
    const s3Policy = {
        expiration: `${_d.getFullYear()}-${_d.getMonth() + 1}-${_d.getDate()}T${_d.getHours() + 1}:${_d.getMinutes() + 50}:${_d.getSeconds()}Z`,
        conditions: [
            { bucket: config.s3.bucket },
            ['starts-with', '$key', ''],
            { acl: 'public-read' },
            ['starts-with', '$filename', ''],
            ['content-length-range', 0, 2147483648],
            ['eq', '$Content-Type', filetype],
            ['starts-with', '$Content-Disposition', '']
        ]
    };

    const s3PolicyBase64 = new Buffer(JSON.stringify(s3Policy)).toString('base64');
    const s3Credentials = {
        s3PolicyBase64,
        s3Signature: crypto.createHmac('sha1', config.s3.secretAccessKey)
            .update(s3PolicyBase64)
            .digest('base64'),
        s3Key: config.s3.key,
        s3Policy,
        code,
        s3Url: config.s3[type].fileUrl
    };

    return s3Credentials;
}

module.exports = {
    removeFiles,
    generateUploadCredentials
};
