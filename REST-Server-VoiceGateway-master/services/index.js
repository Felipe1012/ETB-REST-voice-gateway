const elasticsearch = require('./elasticsearch');
const mongodb = require('./mongodb');
const cos = require('./cos');
const passport = require('./passport');
const kubernetes = require('./kubernetes');


module.exports = {
    cos,
    elasticsearch,
    mongodb,
    passport,
    kubernetes
}