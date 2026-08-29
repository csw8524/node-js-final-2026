const UUID_REGEXP =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidUUID(value) {
  return typeof value === 'string' && UUID_REGEXP.test(value);
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isHttpsUrl(value) {
  return isNonEmptyString(value) && value.startsWith('https');
}

function isValidPassword(value) {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    value.length <= 16 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value)
  );
}

module.exports = {
  isNonEmptyString,
  isValidUUID,
  isNonNegativeInteger,
  isHttpsUrl,
  isValidPassword,
};
