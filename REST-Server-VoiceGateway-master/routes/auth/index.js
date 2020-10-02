const router = require('express').Router();
const { auth } = require('../../controllers');
const { passport } = require('../../services');

router.post('/signup', auth.signup, passport.authJwt, auth.roles(['admin']));
router.post('/login', passport.authLocal, auth.login);

module.exports = router;
