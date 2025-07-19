// import ExpressBrute from 'express-brute';
// import RedisBruteStore from 'express-brute-redis';
// import { formatDistanceToNowStrict } from 'date-fns';
// import { redisClient } from '../redis.js';
// import { deleteUploadedImages } from '../cloudinary.js';

// const redisBruteStore = new RedisBruteStore({
//   client: redisClient,
//   prefix: 'brute:',
// });

// const handleStoreError = function (error) {
//   console.error(error);
//   throw { message: error.message, parent: error.parent };
// };

// const createFailCallback = function (message) {
//   return function (req, res, next, nextValidRequestDate) {
//     deleteUploadedImages(req);
//     req.flash(
//       'error',
//       `${message} ${formatDistanceToNowStrict(nextValidRequestDate)}`
//     );
//     res.redirect(req.get('Referrer') || '/');
//   };
// };

// const createGlobalOptions = function (retries, seconds) {
//   return {
//     ...createOptions(retries, seconds),
//     ...{
//       attachResetToRequest: false,
//       refreshTimeoutOnRequest: false,
//       lifetime: seconds,
//     },
//   };
// };

// const createOptions = function (retries, seconds) {
//   return {
//     freeRetries: retries,
//     minWait: (seconds + 5) * 1000,
//     maxWait: (seconds + 5) * 1000,
//     handleStoreError,
//   };
// };

// const passwordResetBruteForce = new ExpressBrute(redisBruteStore, {
//   ...createOptions(3, 20),
//   failCallback: createFailCallback(
//     "You've made too many failed attempts to reset password, please try again in"
//   ),
// });

// const passwordChangeBruteForce = new ExpressBrute(redisBruteStore, {
//   ...createOptions(3, 20),
//   failCallback: createFailCallback(
//     "You've made too many failed attempts to change password, please try again in"
//   ),
// });

// const loginBruteForce = new ExpressBrute(redisBruteStore, {
//   ...createOptions(3, 20),
//   failCallback: createFailCallback(
//     "You've made too many failed attempts to log in, please try again in"
//   ),
// });

// const registerBruteForce = new ExpressBrute(redisBruteStore, {
//   ...createGlobalOptions(4, 24 * 60 * 60),
//   failCallback: createFailCallback(
//     "You've made too many user accounts, please try again in"
//   ),
// });

// const campgroundCreateBruteForce = new ExpressBrute(redisBruteStore, {
//   ...createGlobalOptions(4, 24 * 60 * 60),
//   failCallback: createFailCallback(
//     "You've made too many campgrounds, please try again in"
//   ),
// });

// const reviewCreateBruteForce = new ExpressBrute(redisBruteStore, {
//   ...createGlobalOptions(9, 60 * 60),
//   failCallback: createFailCallback(
//     "You've made too many reviews, please try again in"
//   ),
// });

// const contactUsMailBruteForce = new ExpressBrute(redisBruteStore, {
//   ...createGlobalOptions(4, 24 * 60 * 60),
//   failCallback: createFailCallback(
//     "You've sent too many contact mails, please try again in"
//   ),
// });

// export {
//   passwordResetBruteForce,
//   passwordChangeBruteForce,
//   loginBruteForce,
//   registerBruteForce,
//   campgroundCreateBruteForce,
//   reviewCreateBruteForce,
//   contactUsMailBruteForce,
// };
