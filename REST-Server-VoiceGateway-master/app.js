const cors = require('cors');
const express = require('express');
const createError = require('http-errors');
const { mongodb } = require('./services');
const passport = require('passport');

const app = express();

mongodb.connect();

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

app.use('/', require('./routes'));
app.use('/static/audio', express.static('/recordings'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    if (req.app.get('env') === 'development') console.log(err)
    res.json(err);
});

module.exports = app;
