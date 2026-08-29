function success(res, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    status: 'success',
    data,
  });
}

function failed(res, message, statusCode = 400) {
  return res.status(statusCode).json({
    status: 'failed',
    message,
  });
}

module.exports = {
  success,
  failed,
};
