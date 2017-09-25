'use strict';

const es = require('../config/elasticsearch');

es.indices.create({
    index: 'versions',
    body: {
        mappings: {
            page: {
                properties: {
                    author: {
                        type: "keyword"
                    },
                    document: {
                        type: "keyword"
                    },
                    version: {
                        type: "keyword"
                    },
                    versionNumber: {
                        type: "integer"
                    },
                    content: {
                        type: "text"
                    },
                    pageNumber: {
                        type: "integer"
                    }
                }
            }
        }
    }
}, (err, result) => {
    if (err) console.error(err);
    if (result) console.log(result);
});

es.indices.create({
    index: 'annotations',
    body: {
        mappings: {
            item: {
                properties: {
                    author: {
                        type: "keyword"
                    },
                    document: {
                        type: "keyword"
                    },
                    highlights: {
                        type: "keyword"
                    },
                    version: {
                        type: "keyword"
                    },
                    versionNumber: {
                        type: "integer"
                    },
                    annotationId: {
                        type: "keyword"
                    },
                    content: {
                        type: "text"
                    },
                    pageNumber: {
                        type: "integer"
                    }
                }
            }
        }
    }
}, (err, result) => {
    if (err) console.error(err);
    if (result) console.log(result);
});