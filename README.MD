**Node.js API Env Variables**

    NODE_ENV - enviroment 'development', 'test' or 'production'
    PORT - API port
    MONGOOSE_DEBUG - (true / false) db requests logging
    MONGO_LINK - mongodb connection string
    JWT_SECRET - JSONWebToken secret
    JWT_EXP - JSONWebToken expiration (30d by-default, format info : https://github.com/zeit/ms)
    FS_LIMIT - FileSize uploading limit (50mb by-default)
    CORS - (TRUE/FALSE) enable CORS in node app (disabled by-default)
    ELASTIC_SEARCH_LINK - connection url to elasticsearch (like: http://localhost:9200)
**API requirements:** 
 - mongodb 3.4.*
 - Node.js LTS v6 
 
 API located in `backend` directory