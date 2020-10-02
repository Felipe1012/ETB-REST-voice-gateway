const { User } = require("../../models");

async function get(req, res, next) {
  try {
    res.status(200).json(await User.find({}, {password: 0}));
  } catch(error) {
    next(error);
  }
}

async function post(req, res, next) {
  try {
    let user = await User.create(req.body);
    res.status(201).json({
      role: user.role,
      email: user.email,
      _id: user._id
    });
  } catch (error) {
    next(error);
  }
}

async function put(req, res, next) {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndUpdate(id, req.body, {new: true});
    res.status(201).json(user)
  } catch (error) {
    next(error);
  }
}

async function del(req, res, next) {
  const { id } = req.params;

  try {
    const response = await User.find({ _id: id }).remove().exec();
    res.status(201).json(response);
  } catch(error) {
    next(error);
  }
}

module.exports = {
  get,
  post,
  put,
  del,
}