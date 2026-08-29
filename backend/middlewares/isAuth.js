const jwt = require('jsonwebtoken');

const AppError = require('../utils/appError');
const config = require('../config');

function isAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, '請先登入'));
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, config.get('secret.jwtSecret'));
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Token 已過期'));
    }

    return next(new AppError(401, '無效的 token'));
  }
}

module.exports = isAuth;
