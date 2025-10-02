import fp from "fastify-plugin";
import Redis from "ioredis";

async function redisPlugin(fastify, config) {
  let redisStatus = "disconnected";

  // Connect to Redis and update the status
  try {
    const redis = new Redis(config.host, config.port);
    redisStatus = "connected";
    fastify.log.info("Connected to Redis");
    fastify.decorate("redis", redis);
  } catch (ex) {
    redisStatus = "error";
    fastify.log.error("Error connecting to Redis:", ex);
    throw ex;
  }
  fastify.decorate("redisStatus", () => redisStatus);

  // Graceful shutdown
  fastify.addHook("onClose", async (fastifyInstance, done) => {
    redisStatus = "disconnected";
    // Close Redis connection
    await fastifyInstance.redis.quit();
    fastifyInstance.log.info("Redis connection closed");
    done();
  });
}

export default fp(redisPlugin, { name: "redis-plugin" });
