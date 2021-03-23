const session = require('express-session');
const redis = require('redis');

module.exports.redisClient = redis.createClient({
    host: 'redis-10268.c135.eu-central-1-1.ec2.cloud.redislabs.com',
    port: 10268,
    password: process.env.REDIS_PASSWORD
})

module.exports.RedisStore = require('express-brute-redis');

module.exports.RedisSessionStore = require('connect-redis')(session);
