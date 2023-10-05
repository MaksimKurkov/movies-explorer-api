const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user');
const BadRequestError = require('../errors/badRequestError');
const NotFoundError = require('../errors/notFoundError');
const ConflictError = require('../errors/conflictError');

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  const { NODE_ENV, JWT_SECRET = 'secret-key', JWT_DEV = 'dev-key' } = process.env;
  return userModel.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : JWT_DEV,
        { expiresIn: '7d' },
      );
      res.send({ token });
    })
    .catch((err) => {
      next(err);
    });
};

module.exports.createUser = (req, res, next) => {
  const { name, email, password } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => userModel.create({
      name, email, password: hash,
    })
      .then((user) => res.status(201).send({
        name: user.name, _id: user._id, email: user.email,
      }))
      .catch((err) => {
        if (err instanceof mongoose.Error.ValidationError) {
          next(new BadRequestError(err.message));
        } else if (err.code === 11000) {
          next(new ConflictError(`Пользователь с email: ${email} уже зарегистрирован`));
        } else {
          next(err);
        }
      }));
};

module.exports.updateUserData = (req, res, next) => {
  const { name, email } = req.body;
  userModel.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true })
    .orFail()
    .then((r) => res.send(r))
    .catch((err) => {
      if (err instanceof mongoose.Error.ValidationError) {
        next(new BadRequestError(err.message));
      } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError(`Пользователь по данному _id: ${req.user._id} не найден.`));
      } else {
        next(err);
      }
    });
};

module.exports.getCurrentUser = (req, res, next) => {
  const userId = req.user._id;
  return userModel.findById(userId)
    .orFail()
    .then((currentUser) => res.send(currentUser))
    .catch((err) => {
      if (err instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError(`Пользователь по данному _id: ${req.user._id} не найден.`));
      } else {
        next(err);
      }
    });
};
