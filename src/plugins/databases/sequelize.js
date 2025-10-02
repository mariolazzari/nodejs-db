import fp from "fastify-plugin";
import { Sequelize } from "sequelize";
import { readdir } from "fs/promises";
import path from "path";

async function sequelizePlugin(fastify, config) {
  let mysqlStatus = "disconnected";

  // Connect to MySQL via Sequelize and update the status
  try {
    const sequelize = new Sequelize(config.uri, config.options);
    await sequelize.authenticate();
    fastify.log.info("MySQL connected via Sequelize");
    mysqlStatus = "connected";
    fastify.decorate("sequelize", sequelize);

    // models
    const models = {};
    const modelsPath = path.resolve("src/models/sequelize");
    const modelsFiles = await readdir(modelsPath);

    for (const file of modelsFiles) {
      if (file.endsWith(".js")) {
        const model = (await import(path.join(modelsPath, file))).default(
          sequelize,
          Sequelize.DataTypes
        );
        models[model.name] = model;
      }
    }

    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });

    await sequelize.sync({ alter: false });
    fastify.log.info("Sequelize models loaded");
    fastify.decorate("models", models);
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
