const { User } = require("../../models");
const jwt = require("jsonwebtoken");

function _generateToken(user) {
  return jwt.sign(user, "secret", {
    expiresIn: '1d'
  });
}

function _setUserInfo(request) {
  return {
    _id: request._id,
    email: request.email,
    role: request.role
  };
}

async function login(req, res, next) {
  const userInfo = _setUserInfo(req.user);

  res.status(200).json({
    token: "JWT " + _generateToken(userInfo),
    user: userInfo
  });
}

async function signup(req, res, next) {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

function roles(roles) {
  return async function(req, res, next) {
    if (typeof roles === "string" && roles === "*") {
      return next();
    }
    try {
      const user = await User.findById(req.user._id);
      if (user.role === 'admin') {
        return next();
      }
      
      if (roles.includes(user.role)) {
        return next();
      }

      next({
        status: 401,
        message: "You are not authorized to view this content",
        type: 'acl'
      });
    } catch (error) {
      next({ status: 402, message: "No user found." });
    }
  };
}

module.exports = {
  login,
  signup,
  roles
};
