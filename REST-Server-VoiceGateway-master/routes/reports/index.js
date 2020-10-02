const router = require('express').Router();
const voice = require('./voice');

router.use('/voice', voice);

module.exports = router;