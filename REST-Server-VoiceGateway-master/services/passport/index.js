const passport = require("passport");
const LocalStrategy = require("passport-local");
const { User } = require("../../models");
const JWTStrategy = require("passport-jwt").Strategy;
const { ExtractJwt } = require("passport-jwt");

// Local Strategy
const localOpts = {
  usernameField: "email"
};

const localStrategy = new LocalStrategy(
  localOpts,
  async (email, password, done) => {
    try {
      const user = await User.findOne({
        email
      });
      if (!user) {
        return done(null, false);
      } else if (!user.authenticateUser(password)) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
);

passport.use(localStrategy);
const authLocal = passport.authenticate("local", {
  session: false
});

// JWT Strategy
const jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
  secretOrKey: 'secret'
};

const jwtStrategy = new JWTStrategy(jwtOpts, async (payload, done) => {
  try {
    const user = await User.findById(payload._id);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
});

passport.use(jwtStrategy);
const authJwt = passport.authenticate("jwt", { 
  session: false 
});

module.exports = {
  authLocal,
  authJwt
};
