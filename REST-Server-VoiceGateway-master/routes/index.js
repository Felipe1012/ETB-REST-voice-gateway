const router = require("express").Router();
const { passport } = require("../services");
const reports = require("./reports");
const conversations = require("./conversations");
const auth = require("./auth");
const users = require("./users");
const kubernetes = require("./kubernetes");
const authController = require('../controllers').auth;
const vgw = require("./vgw");

router.use("/auth", auth);
router.use(
    "/reports",
    passport.authJwt,
    reports
);
router.use(
    "/conversations",
    passport.authJwt,
    conversations
);
router.use(
    "/kubernetes",
    passport.authJwt,
    kubernetes
);
router.use(
    "/vgw",
    passport.authJwt,
    vgw
);
router.use(
    "/users",
    passport.authJwt,
    authController.roles(['admin']),
    users
);

module.exports = router;
