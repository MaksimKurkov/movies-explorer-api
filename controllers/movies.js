const mongoose = require('mongoose');
const movieModel = require('../models/movie');
const BadRequestError = require('../errors/badRequestError');
const ForbiddenError = require('../errors/forbiddenError');
const NotFoundError = require('../errors/notFoundError');

module.exports.getMovies = (req, res, next) => {
  const currentUser = req.user._id;
  movieModel.find({ owner: currentUser })
    .then((movies) => {
      res.send(movies);
    })
    .catch(next);
};

module.exports.createMovie = (req, res, next) => {
  const {
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    movieId,
    nameRU,
    nameEN,
  } = req.body;
  return movieModel.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    movieId,
    nameRU,
    nameEN,
    owner: req.user._id,
  })
    .then((movie) => movieModel.populate(movie, { path: 'owner' }))
    .then((populatedMovie) => res.status(201).send(populatedMovie))
    .catch((err) => {
      if (err instanceof mongoose.Error.ValidationError) {
        next(new BadRequestError(err.message));
      } else {
        next(err);
      }
    });
};

module.exports.deleteMovie = (req, res, next) => {
  movieModel.findById(req.params.movieId)
    .orFail()
    .then((movie) => {
      if (!movie.owner.equals(req.user._id)) {
        throw new ForbiddenError('Фильмы других пользователей удалять нельзя');
      }
      movieModel.deleteOne(movie)
        .orFail()
        .then(() => {
          res.send({ message: 'Фильм удален' });
        })
        .catch((err) => {
          if (err instanceof mongoose.Error.DocumentNotFoundError) {
            next(new NotFoundError(`Фильм с _id: ${req.params.movieId} не найден.`));
          } else {
            next(err);
          }
        });
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError(`Фильм с _id: ${req.params.movieId} не найден.`));
      } else if (err instanceof mongoose.Error.CastError) {
        next(new BadRequestError(`Некорректный _id фильма: ${req.params.movieId}`));
      } else {
        next(err);
      }
    });
};
