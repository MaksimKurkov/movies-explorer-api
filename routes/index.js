const router = require('express').Router();
const signupRouter = require('./signup');
const signinRouter = require('./signin');
const auth = require('../middlewares/auth');
const userRouter = require('./users');
const movieRouter = require('./movies');
const NotFoundError = require('../errors/notFoundError');

router.use(signupRouter);
router.use(signinRouter);

router.use(auth);

router.use(userRouter);
router.use(movieRouter);

router.use('*', (req, res, next) => {
  next(new NotFoundError('Неверный путь!'));
});

module.exports = router;
