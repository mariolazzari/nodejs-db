import fp from "fastify-plugin";
import { Sequelize } from "sequelize";

async function sequelizePlugin(fastify, config) {
  let mysqlStatus = "disconnected";

  // Connect to MySQL via Sequelize and update the status
  try {
    const sequelize = new Sequelize(config.uri, config.options);
    await sequelize.authenticate();
    fastify.log.info("MySQL connected via Sequelize");
    mysqlStatus = "connected";
    fastify.decorate("sequelize", sequelize);
  } catch (error) {
    fastify.log.error("Unable to connect to MySQL via Sequelize:", error);
    mysqlStatus = "error";
    throw error;
  }

  fastify.decorate("mysqlStatus", () => mysqlStatus);

  // Graceful shutdown
  fastify.addHook("onClose", async (fastifyInstance, done) => {
    mysqlStatus = "disconnected";
    // Close Sequelize connection
    await fastifyInstance.sequelize.close();
    fastifyInstance.log.info("MySQL connection closed");
    done();
  });
}

export default fp(sequelizePlugin, { name: "sequelize-plugin" });
