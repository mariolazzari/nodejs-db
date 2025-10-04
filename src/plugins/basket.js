import fp from "fastify-plugin";

async function defaultsPlugin(fastify) {
  fastify.addHook("preHandler", async (req, reply) => {
    const user = req.session.get("user");
    if (!user) {
      return null;
    }
    const key = `myBasket:user:${user.id}:items`;
    const basketItems = await fastify.redis.hgetall(key);
    const basketCount = Object.values(basketItems).reduce(
      (sum, qty) => sum + parseInt(qty, 10),
      0
    );

    reply.locals = {
      ...(reply.locals || {}),
      basketCount,
    };
  });
}

export default fp(defaultsPlugin);
