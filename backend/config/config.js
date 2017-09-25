const Joi = require('joi');

require('dotenv').config();

const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string()
        .allow(['development', 'test', 'production'])
        .default('development'),
    PORT: Joi.number().default(3030),
    MONGOOSE_DEBUG: Joi.boolean().default(false),
    MONGO_LINK: Joi.string().required().description('Mongo DB connection url'),
    JWT_SECRET: Joi.string().required().description('JWT Secret required to sign'),
    JWT_EXP: Joi.string().default('30d').description('JWT token life time'),
    FS_LIMIT: Joi.string().default('50mb').description('File size upload limit'),
    CORS: Joi.boolean().default(false).description('Enable CORS middleware'),
    ELASTIC_SEARCH_LINK: Joi.string().required().description('ElasticSearch connection string'),
    AWS_ACCESS_KEY: Joi.string().required().description('Aws Access Key ID'),
    AWS_SECRET_KEY: Joi.string().required().description('Aws Secret Access Key'),
    AWS_REGION: Joi.string().required().description('Aws region'),
    UPLOAD_BUCKET: Joi.string().required().description('Bucket to upload annotation files to'),
    MANDRILL_API_KEY: Joi.string().required().description('Mandrill API Key'),
    EMAIL_FROM_ADDRESS: Joi.string().required().description('Address emails are sent from')
}).unknown().required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongooseDebug: envVars.MONGOOSE_DEBUG,
    mongoURL: envVars.MONGO_LINK,
    jwtSecret: envVars.JWT_SECRET,
    jwtExp: envVars.JWT_EXP,
    fileSizeLimit: envVars.FS_LIMIT,
    cors: envVars.CORS,
    esURL: envVars.ELASTIC_SEARCH_LINK,
    s3: {
        accessKeyId: envVars.AWS_ACCESS_KEY,
        secretAccessKey: envVars.AWS_SECRET_KEY,
        region: envVars.AWS_REGION,
        signatureVersion: 'v4',
        bucket: envVars.UPLOAD_BUCKET,
        annotation: {
            typeName: 'annotation',
            fileUrl: `https://s3.amazonaws.com/${envVars.UPLOAD_BUCKET}/`,
            uploadDirectory: envVars.ANNOTATION_DIRECTORY,
            root_host: 's3.amazonaws.com'
        },
        document: {
            typeName: 'document',
            fileUrl: `https://s3.amazonaws.com/${envVars.UPLOAD_BUCKET}/`,
            uploadDirectory: envVars.DOCUMENT_DIRECTORY,
            root_host: 's3.amazonaws.com'
        }
    },
    PubNub: {
        publishKey: envVars.PUBNUB_PUBLISH_KEY,
        subscribeKey: envVars.PUBNUB_SUBSCRIBE_KEY
    },
    mandrill: {
        apiKey: envVars.MANDRILL_API_KEY,
        from: envVars.EMAIL_FROM_ADDRESS
    }
};

// JWT Exp format info at : https://github.com/zeit/ms

module.exports = config;
