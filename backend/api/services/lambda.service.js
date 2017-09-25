const aws = require('aws-sdk');

const UtilService = require('../services/util.service');

aws.config.region = 'us-east-1';

const lambda = new aws.Lambda();
const DOC_TO_PDF_LAMBDA = 'CURTISDigital-H2O-DocConverter';

function lookupLambda(mimeType) {
    switch (mimeType) {
    case 'application/pdf':
        return 'savePdfPreview';
    case 'image/gif':
    case 'image/jpeg':
    case 'image/png':
    case 'image/bmp':
        return 'generateImagePreviewLambda';
    case 'video/x-flv':
    case 'video/mp4':
    case 'application/x-mpegURL':
    case 'video/MP2T':
    case 'video/3gpp':
    case 'video/quicktime':
    case 'video/x-msvideo':
    case 'video/x-ms-wmv':
        return 'generateVideoPreviewLambda';
    default:
        return 'generatePDFLambda';
    }
}

const Lambdas = {
    savePdfPreview: file => UtilService
        .addNewPreview(file, {
            url: file.url,
            type: 'pdf',
            status: 'active'
        }),
    generatePDFLambda: file => UtilService
        .addNewPreview(file, {
            url: null,
            type: 'other',
            status: 'Preview generation in progress. Please check back later.'
        }).then((f) => {
            lambda.invoke({
                FunctionName: DOC_TO_PDF_LAMBDA,
                Payload: JSON.stringify({
                    version: f.preview[0].version,
                    fileId: file._id,
                    versionId: file.versionId,
                    key: file.storageKey
                })
            }, (/* err, response */) => {
            });

            return f;
        }),
    generateImagePreviewLambda: file => UtilService
        .addNewPreview(file, {
            url: file.url,
            type: 'image',
            status: 'active'
        }),
    generateVideoPreviewLambda: file => UtilService
        .addNewPreview(file, {
            url: file.url,
            type: 'video',
            status: 'active'
        })
};

function generatePreview(lambdaName, file) {
    return Lambdas[lambdaName](file);
}

module.exports = {
    generatePreview,
    lookupLambda
};
