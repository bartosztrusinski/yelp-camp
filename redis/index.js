const session = require('express-session');
const redis = require('redis');
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});
const RedisStore = require('express-brute-redis');
const RedisSessionStore = require('connect-redis')(session);

module.exports = { redisClient, RedisStore, RedisSessionStore };
