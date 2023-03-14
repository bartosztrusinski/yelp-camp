const ExpressBrute = require('express-brute');
const formatDistanceToNowStrict = require('date-fns/formatDistanceToNowStrict');
const { redisClient, RedisStore } = require('../redis');
const { deleteUploadedImages } = require('../cloudinary');

const store = new RedisStore({ client: redisClient });

const handleStoreError = function (error) {
  log.error(error);
  throw { message: error.message, parent: error.parent };
};

const createFailCallback = function (message) {
  return function (req, res, next, nextValidRequestDate) {
    deleteUploadedImages(req);
    req.flash(
      'error',
      `${message} ${formatDistanceToNowStrict(nextValidRequestDate)}`
    );
    res.redirect('back');
  };
};

const createGlobalOptions = function (retries, seconds) {
  return {
    ...createOptions(retries, seconds),
    ...{
      attachResetToRequest: false,
      refreshTimeoutOnRequest: false,
      lifetime: seconds,
    },
  };
};

const createOptions = function (retries, seconds) {
  return {
    freeRetries: retries,
    minWait: (seconds + 5) * 1000,
    maxWait: (seconds + 5) * 1000,
    handleStoreError,
  };
};

const passwordResetBruteForce = new ExpressBrute(store, {
  ...createOptions(3, 20),
  failCallback: createFailCallback(
    "You've made too many failed attempts to reset password, please try again in"
  ),
});

const passwordChangeBruteForce = new ExpressBrute(store, {
  ...createOptions(3, 20),
  failCallback: createFailCallback(
    "You've made too many failed attempts to change password, please try again in"
  ),
});

const loginBruteForce = new ExpressBrute(store, {
  ...createOptions(3, 20),
  failCallback: createFailCallback(
    "You've made too many failed attempts to log in, please try again in"
  ),
});

const registerBruteForce = new ExpressBrute(store, {
  ...createGlobalOptions(4, 24 * 60 * 60),
  failCallback: createFailCallback(
    "You've made too many user accounts, please try again in"
  ),
});

const campgroundCreateBruteForce = new ExpressBrute(store, {
  ...createGlobalOptions(4, 24 * 60 * 60),
  failCallback: createFailCallback(
    "You've made too many campgrounds, please try again in"
  ),
});

const reviewCreateBruteForce = new ExpressBrute(store, {
  ...createGlobalOptions(9, 60 * 60),
  failCallback: createFailCallback(
    "You've made too many reviews, please try again in"
  ),
});

const contactUsMailBruteForce = new ExpressBrute(store, {
  ...createGlobalOptions(4, 24 * 60 * 60),
  failCallback: createFailCallback(
    "You've sent too many contact mails, please try again in"
  ),
});

module.exports = {
  passwordResetBruteForce,
  passwordChangeBruteForce,
  loginBruteForce,
  registerBruteForce,
  campgroundCreateBruteForce,
  reviewCreateBruteForce,
  contactUsMailBruteForce,
};
