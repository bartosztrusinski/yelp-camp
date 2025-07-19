import { createClient } from 'redis';

const redisClient = await createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
})
  .on('error', (err) => console.log('Redis Client error: ', err))
  .on('connect', () => console.log('Connected to Redis'))
  .connect();

export { redisClient };
