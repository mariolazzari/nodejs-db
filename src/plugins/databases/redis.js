import fp from "fastify-plugin";

async function redisPlugin(fastify, config) {
  let redisStatus = "disconnected";

  // TODO: Connect to Redis and update the status
  fastify.decorate("redisStatus", () => redisStatus);

  // Graceful shutdown
  fastify.addHook("onClose", async (fastifyInstance, done) => {
    redisStatus = "disconnected";
    // TODO: Close Redis connection
    done();
  });
}

export default fp(redisPlugin, { name: "redis-plugin" });
