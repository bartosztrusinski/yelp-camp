const ExpressBrute = require('express-brute')
    , formatDistanceToNowStrict = require('date-fns/formatDistanceToNowStrict')
    , {redisClient, RedisStore} = require('../redis')
    , store = new RedisStore({client: redisClient})
    , {deleteUploadedImages} = require('../cloudinary');

const handleStoreError = function(error) {
    log.error(error);
    throw {
        message: error.message,
        parent: error.parent
    };
}

const failCallback = function(message) {
    return function(req, res, next, nextValidRequestDate) {
        deleteUploadedImages(req);
        req.flash('error', `${message} ${formatDistanceToNowStrict(nextValidRequestDate)}`);
        res.redirect('back');
    }
}

const globalOptions = function(retries, seconds) {
    return {
        ...options(retries, seconds),
        ...{
            attachResetToRequest: false,
            refreshTimeoutOnRequest: false,
            lifetime: seconds,
        }
    }
}

const options = function(retries, seconds) {
    return {
        freeRetries: retries,
        minWait: (seconds + 5) * 1000,
        maxWait: (seconds + 5) * 1000,
        handleStoreError: handleStoreError
    }
}

module.exports.passwordResetBruteForce = new ExpressBrute(store, {
    ...options(3, 20),
    failCallback: failCallback("You've made too many failed attempts to reset password, please try again in")
});

module.exports.passwordChangeBruteForce = new ExpressBrute(store, {
    ...options(3, 20),
    failCallback: failCallback("You've made too many failed attempts to change password, please try again in")
});

module.exports.loginBruteForce = new ExpressBrute(store, {
    ...options(3, 20),
    failCallback: failCallback("You've made too many failed attempts to log in, please try again in")
});

module.exports.registerBruteForce = new ExpressBrute(store, {
    ...globalOptions(4, 24 * 60 * 60),
    failCallback: failCallback("You've made too many user accounts, please try again in")
});

module.exports.campgroundCreateBruteForce = new ExpressBrute(store, {
    ...globalOptions(4, 24 * 60 * 60),
    failCallback: failCallback("You've made too many campgrounds, please try again in")
});

module.exports.reviewCreateBruteForce = new ExpressBrute(store, {
    ...globalOptions(9, 60 * 60),
    failCallback: failCallback("You've made too many reviews, please try again in")
});

module.exports.contactUsMailBruteForce = new ExpressBrute(store, {
    ...globalOptions(4, 24 * 60 * 60),
    failCallback: failCallback("You've sent too many contact mails, please try again in")
});