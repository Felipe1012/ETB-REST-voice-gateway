const elasticsearch = require('elasticsearch');

module.exports = new elasticsearch.Client({
    host: process.env.ES_HOST,
});