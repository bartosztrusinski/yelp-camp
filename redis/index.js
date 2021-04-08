const session = require('express-session')
    , redis = require('redis');

module.exports.redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: 10268,
    password: process.env.REDIS_PASSWORD
});

module.exports.RedisStore = require('express-brute-redis');
module.exports.RedisSessionStore = require('connect-redis')(session);
