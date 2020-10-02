const conversations = require('./conversations');
const reports = require('./reports');
const auth = require('./auth');
const users = require('./users');
const kubernetes = require('./kubernetes');
const vgw = require('./vgw');


module.exports = {
    conversations,
    vgw,
    reports,
    auth,
    users,
    kubernetes,
    vgw
};
