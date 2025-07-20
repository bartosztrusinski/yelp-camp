import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { formatDistanceToNowStrict } from 'date-fns';
import { redisClient } from '../redis.js';

const handleRateLimitExceeded = (req, res, next, options) => {
  const timeRemaining = formatDistanceToNowStrict(req.rateLimit.resetTime);

  req.flash(
    'error',
    `${options.message}. Please try again in ${timeRemaining}`
  );
  res.redirect(req.get('Referrer') || '/');
};

const generateKey = (req, keyFn) => {
  const ipOrId = req.isAuthenticated()
    ? req.user._id.toString()
    : ipKeyGenerator(req.ip);

  return keyFn ? `${ipOrId}:${keyFn(req)}` : ipOrId;
};

const createLimiter = ({
  limit,
  windowMinutes,
  actionName = 'this resource',
  keyFn = null,
  prefix,
}) =>
  rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix,
    }),
    standardHeaders: true,
    legacyHeaders: false,
    limit,
    windowMs: windowMinutes * 60 * 1000,
    message: `You have made too many attempts to ${actionName}`,
    handler: handleRateLimitExceeded,
    keyGenerator: (req, res) => generateKey(req, keyFn),
  });

const resetLimiter = (prefix, keyFn) => async (req, res, next) => {
  const key = generateKey(req, keyFn);
  await redisClient.del(`${prefix}${key}`);
  next();
};

const globalLimiter = createLimiter({
  limit: 200,
  windowMinutes: 15,
  prefix: 'global:',
});

const authLimiter = (actionName, keyFn) => [
  createLimiter({
    limit: 50,
    windowMinutes: 24 * 60,
    prefix: 'auth:long:',
    actionName,
  }),
  createLimiter({
    limit: 10,
    windowMinutes: 15,
    prefix: 'auth:short:',
    actionName,
    keyFn,
  }),
];

const registrationLimiter = [
  createLimiter({
    limit: 10,
    windowMinutes: 24 * 60,
    actionName: 'create an account',
    prefix: 'register:long:',
  }),
  createLimiter({
    limit: 5,
    windowMinutes: 15,
    actionName: 'create an account',
    prefix: 'register:short:',
  }),
];

const mailLimiter = (actionName) => [
  createLimiter({
    limit: 10,
    windowMinutes: 24 * 60,
    prefix: 'mail:long:',
    actionName,
  }),
  createLimiter({
    limit: 3,
    windowMinutes: 60,
    prefix: 'mail:short:',
    actionName,
  }),
];

const contentLimiter = (actionName) => [
  createLimiter({
    limit: 100,
    windowMinutes: 24 * 60,
    prefix: 'content:long:',
    actionName,
  }),
  createLimiter({
    limit: 15,
    windowMinutes: 60,
    prefix: 'content:short:',
    actionName,
  }),
];

export {
  resetLimiter,
  globalLimiter,
  authLimiter,
  registrationLimiter,
  mailLimiter,
  contentLimiter,
};
