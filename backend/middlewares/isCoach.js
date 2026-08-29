const AppError = require('../utils/appError');

function isCoach(req, res, next) {
  if (!req.user || req.user.role !== 'COACH') {
    return next(new AppError(401, '使用者尚未成為教練'));
  }

  return next();
}

module.exports = isCoach;
