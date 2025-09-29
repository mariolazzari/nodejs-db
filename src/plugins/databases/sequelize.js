import fp from "fastify-plugin";

async function sequelizePlugin(fastify, config) {
  let mysqlStatus = "disconnected";

  // TODO: Connect to MySQL via Sequelize and update the status
  fastify.decorate("mysqlStatus", () => mysqlStatus);

  // Graceful shutdown
  fastify.addHook("onClose", async (fastifyInstance, done) => {
    mysqlStatus = "disconnected";
    // TODO: Close Sequelize connection
    done();
  });
}

export default fp(sequelizePlugin, { name: "sequelize-plugin" });
