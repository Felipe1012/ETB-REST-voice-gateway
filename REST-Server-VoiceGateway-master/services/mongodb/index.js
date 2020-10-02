const mongoose = require('mongoose');

function connect() {
    mongoose.connect(process.env.MONGODB_URI || 'https://mongodb:27017');
    mongoose.Promise = global.Promise;
    mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
}

module.exports = {
    connect,
}